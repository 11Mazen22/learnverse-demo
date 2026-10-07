"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type State={
  signedIn:boolean;
  displayName:string;
  xp:number;
  coins:number;
  streak:number;
  masteryRows:{mastery_score:number;state:string;next_review_at:string|null}[];
  lessons:number;
  completedLessons:number;
  courseTitle:string;
};

export function DashboardLive(){
  const [state,setState]=useState<State>({
    signedIn:false,displayName:"",xp:0,coins:0,streak:0,masteryRows:[],
    lessons:0,completedLessons:0,courseTitle:"علوم تجريبية — محتوى توضيحي"
  });
  const [loading,setLoading]=useState(true);
  const supabase=useMemo(()=>createClient(),[]);

  useEffect(()=>{
    void (async()=>{
      const [{data:courses},{data:lessons},{data:{user}}]=await Promise.all([
        supabase.from("courses").select("id,title_ar").eq("active",true).limit(1),
        supabase.from("lessons").select("id"),
        supabase.auth.getUser()
      ]);

      const base:State={
        signedIn:Boolean(user),
        displayName:"",
        xp:0,coins:0,streak:0,
        masteryRows:[],
        lessons:lessons?.length??0,
        completedLessons:0,
        courseTitle:courses?.[0]?.title_ar??"Noata"
      };

      if(!user){setState(base);setLoading(false);return;}

      const [{data:profile},{data:mastery},{data:progress}]=await Promise.all([
        supabase.from("profiles").select("display_name,xp,coins,streak_days").eq("id",user.id).single(),
        supabase.from("skill_evidence").select("mastery_score,state,next_review_at").eq("user_id",user.id),
        supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id",user.id)
      ]);

      setState({
        ...base,
        signedIn:true,
        displayName:profile?.display_name||user.email?.split("@")[0]||"",
        xp:Number(profile?.xp??0),
        coins:Number(profile?.coins??0),
        streak:Number(profile?.streak_days??0),
        masteryRows:(mastery??[]) as State["masteryRows"],
        completedLessons:(progress??[]).filter(x=>x.completed_at).length
      });
      setLoading(false);
    })();
  },[supabase]);

  const level=Math.floor(state.xp/100)+1;
  const mastery=state.masteryRows.length
    ?Math.round(state.masteryRows.reduce((sum,row)=>sum+Number(row.mastery_score),0)/state.masteryRows.length)
    :0;
  const due=state.masteryRows.filter(row=>row.next_review_at&&new Date(row.next_review_at)<=new Date()).length;
  const courseProgress=state.lessons?Math.round(state.completedLessons/state.lessons*100):0;
  const title=state.signedIn&&state.displayName
    ?"جاهز نكمّل يا "+state.displayName+"؟"
    :"تعلّم بذكاء. اتقدّم كل يوم. وخلي التعليم لعبة ليها معنى.";

  return <>
    <section className="hero">
      <div className="eyebrow">{state.signedIn?"YOUR NOATA JOURNEY":"NOATA LEARNING ENGINE"}</div>
      <h1>{title}</h1>
      <p>{state.signedIn
        ?"عندك "+due+" مراجعات مستحقة، وتقدمك في "+state.courseTitle+" وصل "+courseProgress+"%."
        :"مسارات تعليمية متكيفة، مهام متدرجة، ذكاء اصطناعي يفهم مستواك، ونظام تقدّم يكافئ الفهم الحقيقي — مش الحفظ."}</p>
      <div className="hero-actions">
        <a className="btn btn-primary" href="/learn">{state.signedIn?"كمّل رحلتك":"استكشف المحتوى"}</a>
        <a className="btn btn-secondary" href={state.signedIn?"/ai":"/login"}>{state.signedIn?"افتح Noata AI":"ابدأ حسابك"}</a>
      </div>
    </section>

    <section className="grid-4">
      <article className="metric-card"><span>المستوى</span><strong>{loading?"—":level}</strong><small>{state.xp} XP</small></article>
      <article className="metric-card"><span>Mastery</span><strong>{loading?"—":mastery+"%"}</strong><small>{state.masteryRows.length} skills tracked</small></article>
      <article className="metric-card"><span>السلسلة</span><strong>{loading?"—":state.streak+" أيام"}</strong><small>{due} reviews due</small></article>
      <article className="metric-card"><span>Noata Coins</span><strong>{loading?"—":state.coins.toLocaleString()}</strong><small>cosmetics only</small></article>
    </section>

    <section className="content-grid">
      <article className="panel">
        <div className="panel-head"><h2>المسار الحالي</h2><span className="pill">Live Supabase</span></div>
        <div className="quest">
          <div className="quest-icon">{courseProgress}%</div>
          <div><h3>{state.courseTitle}</h3><p>{state.completedLessons} من {state.lessons} دروس مكتملة</p><div className="progress"><i style={{width:courseProgress+"%"}}/></div></div>
          <a href="/learn"><b>Open</b></a>
        </div>
      </article>
      <aside>
        <div className="rank-card"><span>Learning Rank</span><strong>Lv. {level}</strong><small>{100-(state.xp%100)} XP للمستوى التالي</small></div>
        <div className="ai-preview"><b>Noata AI</b><p>اشرح، اختبر، راجع، استخدم صورة أو صوت، وخلي Noata يختار أذكى Fanar capability تلقائيًا.</p><a href={state.signedIn?"/ai":"/login"}>{state.signedIn?"ابدأ محادثة →":"سجّل الدخول →"}</a></div>
      </aside>
    </section>
  </>;
}
