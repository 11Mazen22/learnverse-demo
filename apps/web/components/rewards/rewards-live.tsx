"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Item={id:string;slug:string;item_type:string;title_ar:string;title_en:string;price:number;asset_url:string|null};
type Profile={xp:number;coins:number};

export function RewardsLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [items,setItems]=useState<Item[]>([]);
  const [owned,setOwned]=useState<Set<string>>(new Set());
  const [profile,setProfile]=useState<Profile|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState<string|null>(null);

  async function load(){
    const [{data:itemRows},{data:{user}}]=await Promise.all([
      supabase.from("shop_items").select("id,slug,item_type,title_ar,title_en,price,asset_url").eq("active",true).order("price"),
      supabase.auth.getUser()
    ]);
    setItems((itemRows??[]) as Item[]);
    if(!user){setProfile(null);setOwned(new Set());return;}
    const [{data:p},{data:inventory}]=await Promise.all([
      supabase.from("profiles").select("xp,coins").eq("id",user.id).single(),
      supabase.from("inventory").select("item_id").eq("user_id",user.id)
    ]);
    setProfile(p as Profile|null);
    setOwned(new Set((inventory??[]).map(x=>x.item_id)));
  }

  useEffect(()=>{void load();},[]);

  async function buy(item:Item){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/login";return;}
    setBusy(item.id);setError("");
    const {error}=await supabase.rpc("purchase_shop_item",{
      p_item_id:item.id,
      p_idempotency_key:crypto.randomUUID()
    });
    if(error)setError(error.message);
    await load();
    setBusy(null);
  }

  const level=Math.floor(Number(profile?.xp??0)/100)+1;

  return <>
    <header className="topbar" style={{marginBottom:18}}>
      <div><div className="eyebrow" style={{color:"#2f7cff"}}>REWARDS</div><h1 style={{margin:"6px 0 0"}}>شخصيتك ومكافآتك</h1></div>
      <div style={{display:"flex",gap:8}}><span className="pill">Lv. {level}</span><span className="pill">{Number(profile?.coins??0).toLocaleString()} Coins</span></div>
    </header>
    <section className="hero" style={{minHeight:240,display:"grid",gridTemplateColumns:"1fr minmax(170px,260px)",alignItems:"center"}}>
      <div><div className="eyebrow">YOUR SPACE</div><h2 style={{fontSize:34,margin:"8px 0"}}>ابني شخصيتك من إنجازاتك.</h2><p>XP للتقدم فقط. Coins للـ cosmetics فقط. لا شراء ولا reward يغيّر الـ mastery — لأن الفهم لازم يفضل حقيقي.</p></div>
      <div style={{height:180,borderRadius:28,background:"linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.04))",display:"grid",placeItems:"center",fontSize:72}}>◈</div>
    </section>
    {error&&<div className="panel" style={{marginTop:14,color:"#e35757"}}>{error}</div>}
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginTop:18}}>
      {items.map(item=>{
        const isOwned=owned.has(item.id);
        const canAfford=Number(profile?.coins??0)>=item.price;
        return <article className="panel" key={item.id}>
          <div style={{height:120,borderRadius:16,background:"linear-gradient(145deg,#edf5ff,#dfeaff)",display:"grid",placeItems:"center",fontSize:44}}>◇</div>
          <h3>{item.title_ar}</h3><p style={{color:"#6b7b92",fontSize:12}}>{item.item_type} · {item.title_en}</p>
          <button disabled={isOwned||busy===item.id} onClick={()=>void buy(item)} className="btn" style={{width:"100%",background:isOwned?"#e9f7f0":"#102b52",color:isOwned?"#158456":"white"}}>
            {isOwned?"Owned":busy===item.id?"جارٍ الشراء…":item.price===0?"Free":item.price+" Coins"}
          </button>
          {profile&&!isOwned&&!canAfford&&<small style={{display:"block",marginTop:8,color:"#9a6b1d"}}>محتاج Coins أكتر</small>}
        </article>;
      })}
    </section>
  </>;
}
