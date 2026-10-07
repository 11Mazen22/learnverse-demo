"use client";

import {ChangeEvent,FormEvent,useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {FANAR_CAPABILITIES} from "@/lib/ai/catalog";

type Conversation={
  id:string;
  title:string;
  pinned:boolean;
  archived:boolean;
  selected_model:string;
  updated_at:string;
  temporary:boolean;
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
  const [attachment,setAttachment]=useState<File|null>(null);
  const [recording,setRecording]=useState(false);
  const [audioUrl,setAudioUrl]=useState<string|null>(null);
  const [historyQuery,setHistoryQuery]=useState("");
  const [showTools,setShowTools]=useState(false);
  const scroller=useRef<HTMLDivElement>(null);
  const fileInput=useRef<HTMLInputElement>(null);
  const recorder=useRef<MediaRecorder|null>(null);
  const recordingChunks=useRef<Blob[]>([]);

  const loadConversations=useCallback(async()=>{
    const {data,error}=await supabase
      .from("ai_conversations")
      .select("id,title,pinned,archived,selected_model,updated_at,temporary")
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
    }).select("id,title,pinned,archived,selected_model,updated_at,temporary").single();
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

  async function uploadFile(file:File,conversationId?:string){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error("Please sign in first");
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-80)||"upload";
    const path=user.id+"/"+(conversationId??"scratch")+"/"+crypto.randomUUID()+"-"+safeName;
    const {error}=await supabase.storage.from("noata-uploads").upload(path,file,{upsert:false,contentType:file.type});
    if(error)throw error;
    await supabase.from("ai_attachments").insert({
      user_id:user.id,
      conversation_id:conversationId??null,
      storage_path:path,
      mime_type:file.type,
      size_bytes:file.size
    });
    return path;
  }

  function pickImage(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]??null;
    if(!file)return;
    if(!file.type.startsWith("image/")){setError("اختار صورة من فضلك.");return;}
    if(file.size>10*1024*1024){setError("الصورة أكبر من 10MB.");return;}
    setAttachment(file);setError("");
  }

  async function transcribeBlob(blob:Blob){
    setBusy(true);setError("");
    try{
      const file=new File([blob],"voice.webm",{type:blob.type||"audio/webm"});
      const path=await uploadFile(file,activeId??undefined);
      const {data,error}=await supabase.functions.invoke("noata-ai",{
        body:{action:"transcribe_storage",model:"Fanar-Aura-STT-1",attachmentPath:path,filename:file.name}
      });
      if(error)throw error;
      if(data?.error)throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
      const text=String(data?.result?.text??data?.result?.transcript??"").trim();
      if(!text)throw new Error("No transcript returned");
      setInput(current=>current?current+" "+text:text);
    }catch(err){setError(err instanceof Error?err.message:"Voice transcription failed");}
    finally{setBusy(false);}
  }

  async function toggleRecording(){
    if(recording){
      recorder.current?.stop();
      return;
    }
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const media=new MediaRecorder(stream);
      recordingChunks.current=[];
      media.ondataavailable=e=>{if(e.data.size)recordingChunks.current.push(e.data);};
      media.onstop=()=>{
        setRecording(false);
        stream.getTracks().forEach(t=>t.stop());
        const blob=new Blob(recordingChunks.current,{type:media.mimeType||"audio/webm"});
        void transcribeBlob(blob);
      };
      recorder.current=media;
      media.start();
      setRecording(true);
    }catch{setError("محتاج إذن الميكروفون علشان أسمعك.");}
  }

  async function readAloud(text:string){
    setError("");
    try{
      const {data,error}=await supabase.functions.invoke("noata-ai",{
        body:{action:"tts",model:"Fanar-Aura-TTS-2",input:text,voice:"Amelia",response_format:"mp3"}
      });
      if(error)throw error;
      if(data?.error)throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
      const url=String(data?.asset?.signedUrl??"");
      if(!url)throw new Error("No audio URL returned");
      setAudioUrl(url);
      const audio=new Audio(url);
      await audio.play();
    }catch(err){setError(err instanceof Error?err.message:"Text-to-speech failed");}
  }

  function textFromToolResult(action:string,data:any){
    if(action==="translate")return String(data?.result?.translation??data?.result?.text??JSON.stringify(data?.result??{},null,2));
    if(action==="poem")return String(data?.result?.poem??data?.result?.text??data?.result?.content??JSON.stringify(data?.result??{},null,2));
    if(action==="moderate")return "### Fanar Guard 2\n\n"+Object.entries(data?.result??{}).map(([key,value])=>"- **"+key+"**: "+String(value)).join("\n");
    if(action==="image"){
      const url=String(data?.asset?.signedUrl??data?.result?.data?.[0]?.url??"");
      return url?"![Noata generated image]("+url+")":"Image generated successfully.";
    }
    if(action==="sadiq_validate"||action==="sadiq_research")return "```json\n"+JSON.stringify(data?.result??{},null,2)+"\n```";
    return JSON.stringify(data?.result??data??{},null,2);
  }

  async function runTool(action:string){
    const text=input.trim();
    if(!text||busy)return;
    setBusy(true);setError("");
    try{
      const conversationId=await ensureConversation();
      if(!conversationId)throw new Error("Could not create conversation");
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)throw new Error("Please sign in first");

      const {data:userRow,error:userError}=await supabase.from("ai_messages").insert({
        conversation_id:conversationId,role:"user",content:text,status:"complete",metadata:{tool_action:action}
      }).select("id,conversation_id,role,content,model,status,created_at").single();
      if(userError)throw userError;

      const payload:any={action};
      if(action==="translate"){payload.text=text;payload.langpair=/[\u0600-\u06FF]/.test(text)?"ar-en":"en-ar";}
      else if(action==="poem"||action==="image"){payload.prompt=text;}
      else if(action==="moderate"){payload.prompt=text;payload.response="";}
      else{payload.input={query:text,prompt:text};}

      const {data,error}=await supabase.functions.invoke("noata-ai",{body:payload});
      if(error)throw error;
      if(data?.error)throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));

      const toolModels:Record<string,string>={
        translate:"Fanar-Shaheen-MT-1",
        poem:"Fanar-Diwan",
        moderate:"Fanar-Guard-2",
        image:"Fanar-Oryx-IG-2",
        sadiq_validate:"Fanar-Sadiq-2 (validate)",
        sadiq_research:"Fanar-Sadiq-2 (deep research)"
      };
      const content=textFromToolResult(action,data);
      const {data:assistantRow,error:assistantError}=await supabase.from("ai_messages").insert({
        conversation_id:conversationId,role:"assistant",content,model:toolModels[action]??null,status:"complete",
        metadata:{tool_action:action,quota:data?.quota??null,generated_asset:data?.asset??null}
      }).select("id,conversation_id,role,content,model,status,created_at").single();
      if(assistantError)throw assistantError;

      setMessages(current=>[...current,userRow as Message,assistantRow as Message]);
      setInput("");setShowTools(false);
      const existing=conversations.find(x=>x.id===conversationId);
      const patch:{updated_at:string;title?:string}={updated_at:new Date().toISOString()};
      if(!existing||existing.title==="New chat")patch.title=titleFrom(text);
      await supabase.from("ai_conversations").update(patch).eq("id",conversationId);
      await loadConversations();
    }catch(err){setError(err instanceof Error?err.message:"Noata AI tool failed");}
    finally{setBusy(false);}
  }
  async function invokeChat(history:{role:string;content:string}[],attachmentPath?:string){
    const selected=model;
    const {data,error}=await supabase.functions.invoke("noata-ai",{
      body:{action:"chat",model:selected,messages:history,attachmentPath}
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

      let attachmentPath:string|undefined;
      if(attachment){
        attachmentPath=await uploadFile(attachment,conversationId);
      }
      const response=await invokeChat(history,attachmentPath);
      const {data:assistantRow,error:assistantError}=await supabase.from("ai_messages").insert({
        conversation_id:conversationId,role:"assistant",content:response.content,model:response.model,status:"complete"
      }).select("id,conversation_id,role,content,model,status,created_at").single();
      if(assistantError)throw assistantError;

      setMessages(current=>current.filter(x=>x.id!==optimistic.id).concat(userRow as Message,assistantRow as Message));
      setAttachment(null);
      if(fileInput.current)fileInput.current.value="";

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

  async function togglePin(conversation:Conversation){
    const {error}=await supabase.from("ai_conversations").update({
      pinned:!conversation.pinned,updated_at:new Date().toISOString()
    }).eq("id",conversation.id);
    if(error){setError(error.message);return;}
    await loadConversations();
  }

  async function archiveConversation(id:string){
    const {error}=await supabase.from("ai_conversations").update({
      archived:true,updated_at:new Date().toISOString()
    }).eq("id",id);
    if(error){setError(error.message);return;}
    if(activeId===id){setActiveId(null);setMessages([]);}
    await loadConversations();
  }

  async function renameConversation(id:string,title:string){
    const next=title.trim().slice(0,80);
    if(!next)return;
    const {error}=await supabase.from("ai_conversations").update({
      title:next,updated_at:new Date().toISOString()
    }).eq("id",id);
    if(error){setError(error.message);return;}
    await loadConversations();
  }

  async function editFrom(message:Message){
    if(!activeId||message.role!=="user"||busy)return;
    setInput(message.content);
    const index=messages.findIndex(x=>x.id===message.id);
    if(index<0)return;
    const removeIds=messages.slice(index).map(x=>x.id);
    const {error}=await supabase.from("ai_messages").delete().in("id",removeIds);
    if(error){setError(error.message);return;}
    setMessages(messages.slice(0,index));
  }

  const visibleConversations=conversations.filter(c=>
    !historyQuery.trim()||c.title.toLowerCase().includes(historyQuery.trim().toLowerCase())
  );

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
      <input
        value={historyQuery}
        onChange={e=>setHistoryQuery(e.target.value)}
        placeholder="ابحث في المحادثات…"
        style={{height:38,borderRadius:11,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",padding:"0 11px",outline:0}}
      />
      <div className="ai-history">
        {visibleConversations.map(c=><div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:4,alignItems:"center"}}>
          <button onClick={()=>void openConversation(c.id)} style={{background:activeId===c.id?"rgba(255,255,255,.08)":undefined}}>{c.pinned?"◆ ":""}{c.title}</button>
          <div style={{display:"flex"}}>
            <button onClick={()=>void togglePin(c)} title={c.pinned?"Unpin":"Pin"} style={{border:0,background:"transparent",color:"#7386a4",width:26}}>◆</button>
            <button onClick={()=>{const next=window.prompt("اسم المحادثة",c.title);if(next)void renameConversation(c.id,next);}} title="Rename" style={{border:0,background:"transparent",color:"#7386a4",width:26}}>✎</button>
            <button onClick={()=>void archiveConversation(c.id)} title="Archive" style={{border:0,background:"transparent",color:"#7386a4",width:26}}>⌄</button>
            <button onClick={()=>void removeConversation(c.id)} title="Delete" style={{border:0,background:"transparent",color:"#7386a4",width:26}}>×</button>
          </div>
        </div>)}
        {!visibleConversations.length&&<div style={{padding:12,color:"#7288aa",fontSize:12}}>مفيش محادثات مطابقة.</div>}
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
          {m.role==="user"&&<div style={{display:"flex",gap:6,marginTop:7}}>
            <button type="button" className="icon-btn" style={{width:32,height:32,background:"rgba(255,255,255,.08)",borderColor:"rgba(255,255,255,.12)",color:"white"}} title="Edit from here" onClick={()=>void editFrom(m)}>✎</button>
          </div>}
          {m.role==="assistant"&&<div style={{display:"flex",gap:6,marginTop:7}}>
            <button type="button" className="icon-btn" style={{width:32,height:32}} title="Read aloud" onClick={()=>void readAloud(m.content)}>◖</button>
          </div>}
        </div>)}
        {audioUrl&&<audio src={audioUrl} controls style={{width:"min(520px,100%)"}}/>}
        {busy&&<div className="message assistant" style={{color:"#6b7b92"}}>Noata بيفكر…</div>}
        {error&&<div className="message assistant" style={{color:"#e35757"}}>{error}</div>}
      </div>

      <footer className="ai-composer">
        <form className="composer-box" onSubmit={send}>
          {attachment&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f0f6ff",borderRadius:12,fontSize:12}}>
            <span>▧</span><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{attachment.name}</span>
            <button type="button" onClick={()=>{setAttachment(null);if(fileInput.current)fileInput.current.value="";}} style={{border:0,background:"transparent"}}>×</button>
          </div>}
          {showTools&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:7,padding:"6px 4px 10px"}}>
            {[
              ["Image","ارسم صورة","Generate image"],
              ["Translate","ترجمة","Arabic ↔ English"],
              ["Poem","ديوان","Arabic poetry"],
              ["Research","بحث صادق","Deep research"]
            ].map(([key,label,title])=><button type="button" key={key} title={title} onClick={()=>{setInput(current=>current||label+": ");setShowTools(false);}} style={{border:"1px solid #dce6f3",background:"#f8fbff",borderRadius:11,padding:"9px 7px",fontSize:11,fontWeight:800}}>{label}</button>)}
          </div>}
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="اسأل Noata… اكتب، ارفع صورة، أو استخدم صوتك" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}}/>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickImage}/>
          <div className="composer-actions">
            <div style={{display:"flex",gap:8}}>
              <button type="button" className="icon-btn" title="Tools" onClick={()=>setShowTools(x=>!x)}>✦</button>
              <button type="button" className="icon-btn" title="Attach image" onClick={()=>fileInput.current?.click()}>＋</button>
              <button type="button" className="icon-btn" title={recording?"Stop recording":"Voice"} onClick={()=>void toggleRecording()} style={recording?{background:"#feecec",color:"#c73f3f"}:undefined}>{recording?"■":"◉"}</button>
              {messages.at(-1)?.role==="assistant"&&<button type="button" className="icon-btn" title="Regenerate" onClick={()=>void regenerate()}>↻</button>}
            </div>
            <button disabled={busy||!input.trim()} className="send-btn">إرسال ↑</button>
          </div>
        </form>
      </footer>
    </section>
  </section>;
}
