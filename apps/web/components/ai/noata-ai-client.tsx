"use client";

import {FormEvent,useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {FANAR_CAPABILITIES} from "@/lib/ai/catalog";

type Conversation={
  id:string;
  title:string;
  pinned:boolean;
  archived:boolean;
  selected_model:string;
  updated_at:string;
};

type Message={
  id:string;
  conversation_id:string;
  role:"user"|"assistant"|"system";
  content:string;
  model:string|null;
  status:string;
  created_at:string;
};

function titleFrom(text:string){
  const clean=text.trim().replace(/\s+/g," ");
  return clean.length>48?clean.slice(0,48).trim()+"…":clean||"New chat";
}

export function NoataAIClient(){
  const supabase=useMemo(()=>createClient(),[]);
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [model,setModel]=useState("auto");
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const scroller=useRef<HTMLDivElement>(null);

  const loadConversations=useCallback(async()=>{
    const {data,error}=await supabase
      .from("ai_conversations")
      .select("id,title,pinned,archived,selected_model,updated_at")
      .eq("archived",false)
      .order("pinned",{ascending:false})
      .order("updated_at",{ascending:false});
    if(error){setError(error.message);return;}
    setConversations((data??[]) as Conversation[]);
  },[supabase]);

  async function openConversation(id:string){
    setActiveId(id);
    const current=conversations.find(x=>x.id===id);
    if(current)setModel(current.selected_model||"auto");
    const {data,error}=await supabase
      .from("ai_messages")
      .select("id,conversation_id,role,content,model,status,created_at")
      .eq("conversation_id",id)
      .order("created_at",{ascending:true});
    if(error){setError(error.message);return;}
    setMessages((data??[]) as Message[]);
  }

  async function createConversation(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/login";return null;}
    const {data,error}=await supabase.from("ai_conversations").insert({
      user_id:user.id,title:"New chat",selected_model:model
    }).select("id,title,pinned,archived,selected_model,updated_at").single();
    if(error){setError(error.message);return null;}
    const row=data as Conversation;
    setConversations(current=>[row,...current]);
    setActiveId(row.id);setMessages([]);
    return row.id;
  }

  useEffect(()=>{void loadConversations();},[loadConversations]);
  useEffect(()=>{if(scroller.current)scroller.current.scrollTop=scroller.current.scrollHeight;},[messages,busy]);

  async function ensureConversation(){
    if(activeId)return activeId;
    return await createConversation();
  }

  async function invokeChat(history:{role:string;content:string}[]){
    const selected=model==="auto"?"Fanar":model;
    const {data,error}=await supabase.functions.invoke("noata-ai",{
      body:{action:"chat",model:selected,messages:history}
    });
    if(error)throw error;
    if(data?.error)throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
    return {content:String(data?.content??""),model:String(data?.model??selected)};
  }

  async function send(e?:FormEvent){
    e?.preventDefault();
    const text=input.trim();
    if(!text||busy)return;
    setBusy(true);setError("");
    try{
      const conversationId=await ensureConversation();
      if(!conversationId)throw new Error("Could not create conversation");

      const optimistic:Message={
        id:crypto.randomUUID(),conversation_id:conversationId,role:"user",
        content:text,model:null,status:"complete",created_at:new Date().toISOString()
      };
      setMessages(current=>[...current,optimistic]);setInput("");

      const {data:userRow,error:userError}=await supabase.from("ai_messages").insert({
        conversation_id:conversationId,role:"user",content:text,status:"complete"
      }).select("id,conversation_id,role,content,model,status,created_at").single();
      if(userError)throw userError;

      const history=[...messages,userRow as Message]
        .filter(x=>x.role==="user"||x.role==="assistant")
        .map(x=>({role:x.role,content:x.content}));

      const response=await invokeChat(history);
      const {data:assistantRow,error:assistantError}=await supabase.from("ai_messages").insert({
        conversation_id:conversationId,role:"assistant",content:response.content,model:response.model,status:"complete"
      }).select("id,conversation_id,role,content,model,status,created_at").single();
      if(assistantError)throw assistantError;

      setMessages(current=>current.filter(x=>x.id!==optimistic.id).concat(userRow as Message,assistantRow as Message));

      const existing=conversations.find(x=>x.id===conversationId);
      const patch:{
        updated_at:string;
        selected_model:string;
        title?:string;
      }={updated_at:new Date().toISOString(),selected_model:model};
      if(!existing||existing.title==="New chat")patch.title=titleFrom(text);
      await supabase.from("ai_conversations").update(patch).eq("id",conversationId);
      await loadConversations();
    }catch(err){
      setError(err instanceof Error?err.message:"Noata AI request failed");
    }finally{
      setBusy(false);
    }
  }

  async function removeConversation(id:string){
    await supabase.from("ai_conversations").delete().eq("id",id);
    if(activeId===id){setActiveId(null);setMessages([]);}
    await loadConversations();
  }

  async function regenerate(){
    if(busy||!activeId)return;
    const last=messages.at(-1);
    if(!last||last.role!=="assistant")return;
    setBusy(true);setError("");
    try{
      const history=messages.slice(0,-1).filter(x=>x.role!=="system").map(x=>({role:x.role,content:x.content}));
      const response=await invokeChat(history);
      const {data,error}=await supabase.from("ai_messages").update({
        content:response.content,model:response.model,status:"complete",created_at:new Date().toISOString()
      }).eq("id",last.id).select("id,conversation_id,role,content,model,status,created_at").single();
      if(error)throw error;
      setMessages(current=>current.slice(0,-1).concat(data as Message));
    }catch(err){setError(err instanceof Error?err.message:"Regeneration failed");}
    finally{setBusy(false);}
  }

  return <section className="ai-layout">
    <aside className="ai-sidebar">
      <div className="brand"><div className="brand-mark">N</div><div className="brand-copy"><strong>Noata AI</strong><span>Study companion</span></div></div>
      <button className="ai-new" onClick={()=>void createConversation()}>＋ محادثة جديدة</button>
      <div className="ai-history">
        {conversations.map(c=><div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr 28px",gap:4}}>
          <button onClick={()=>void openConversation(c.id)} style={{background:activeId===c.id?"rgba(255,255,255,.08)":undefined}}>{c.pinned?"◆ ":""}{c.title}</button>
          <button onClick={()=>void removeConversation(c.id)} title="Delete" style={{border:0,background:"transparent",color:"#7386a4"}}>×</button>
        </div>)}
        {!conversations.length&&<div style={{padding:12,color:"#7288aa",fontSize:12}}>مفيش محادثات لسه. ابدأ واحدة جديدة.</div>}
      </div>
    </aside>

    <section className="ai-chat">
      <header className="ai-top">
        <div><b>Noata AI</b><div style={{fontSize:11,color:"#73839b"}}>Learning-aware • Arabic-first • Fanar powered</div></div>
        <select className="model-select" value={model} onChange={e=>setModel(e.target.value)}>
          <option value="auto">Auto · Smart Router</option>
          {FANAR_CAPABILITIES.filter(x=>x.visibleInPicker).map(item=><option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
      </header>

      <div className="ai-messages" ref={scroller}>
        {!messages.length&&<div className="message assistant"><b>أهلاً 👋</b><p>أنا Noata AI. اشرحلي إنت بتذاكر إيه، ابعت سؤال، أو اطلب مني أختبرك خطوة خطوة.</p></div>}
        {messages.filter(x=>x.role!=="system").map(m=><div key={m.id} className={"message "+m.role}>
          {m.role==="assistant"&&<div style={{fontSize:11,color:"#7d8da4",marginBottom:5}}>{m.model||"Noata AI"}</div>}
          <div style={{whiteSpace:"pre-wrap"}}>{m.content}</div>
        </div>)}
        {busy&&<div className="message assistant" style={{color:"#6b7b92"}}>Noata بيفكر…</div>}
        {error&&<div className="message assistant" style={{color:"#e35757"}}>{error}</div>}
      </div>

      <footer className="ai-composer">
        <form className="composer-box" onSubmit={send}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="اسأل Noata… اكتب، ارفع صورة، أو استخدم صوتك" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}}/>
          <div className="composer-actions">
            <div style={{display:"flex",gap:8}}><button type="button" className="icon-btn" title="Attachment">＋</button><button type="button" className="icon-btn" title="Voice">◉</button>{messages.at(-1)?.role==="assistant"&&<button type="button" className="icon-btn" title="Regenerate" onClick={()=>void regenerate()}>↻</button>}</div>
            <button disabled={busy||!input.trim()} className="send-btn">إرسال ↑</button>
          </div>
        </form>
      </footer>
    </section>
  </section>;
}
