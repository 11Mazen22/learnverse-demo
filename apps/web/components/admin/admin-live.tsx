"use client";

import {FormEvent,useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import type {Json} from "@/lib/supabase/database.types";
import {CurriculumManager} from "@/components/admin/curriculum-manager";

type Question={id:string;prompt_ar:string;review_status:string;publication_status:string;question_type:string};
type Profile={id:string;display_name:string;role:"student"|"teacher"|"admin";xp:number;coins:number};
type ClassRow={id:string;slug:string;name:string;grade_label:string;academic_year:string;active:boolean};
type Lesson={id:string;title_ar:string};
type Skill={id:string;title_ar:string};
type Membership={class_id:string;student_id:string};
type TeacherAccess={class_id:string;teacher_id:string};

export function AdminLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [tab,setTab]=useState<"content"|"curriculum"|"users"|"classes">("content");
  const [questions,setQuestions]=useState<Question[]>([]);
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [classes,setClasses]=useState<ClassRow[]>([]);
  const [memberships,setMemberships]=useState<Membership[]>([]);
  const [teacherAccess,setTeacherAccess]=useState<TeacherAccess[]>([]);
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [skills,setSkills]=useState<Skill[]>([]);
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);

  const [promptAr,setPromptAr]=useState("");
  const [promptEn,setPromptEn]=useState("");
  const [questionType,setQuestionType]=useState<"multiple-choice"|"numeric">("multiple-choice");
  const [choicesAr,setChoicesAr]=useState("");
  const [choicesEn,setChoicesEn]=useState("");
  const [answer,setAnswer]=useState("");
  const [explanationAr,setExplanationAr]=useState("");
  const [explanationEn,setExplanationEn]=useState("");
  const [lessonId,setLessonId]=useState("");
  const [skillId,setSkillId]=useState("");

  const [className,setClassName]=useState("");
  const [gradeLabel,setGradeLabel]=useState("");
  const [academicYear,setAcademicYear]=useState("");
  const [selectedClass,setSelectedClass]=useState("");
  const [selectedUser,setSelectedUser]=useState("");

  async function load(){
    const [{data:q},{data:p},{data:c},{data:m},{data:t},{data:l},{data:s}]=await Promise.all([
      supabase.from("questions").select("id,prompt_ar,review_status,publication_status,question_type").order("created_at",{ascending:false}),
      supabase.from("profiles").select("id,display_name,role,xp,coins").order("display_name"),
      supabase.from("classes").select("id,slug,name,grade_label,academic_year,active").order("name"),
      supabase.from("class_memberships").select("class_id,student_id"),
      supabase.from("teacher_class_access").select("class_id,teacher_id"),
      supabase.from("lessons").select("id,title_ar").order("position"),
      supabase.from("skills").select("id,title_ar").order("title_ar")
    ]);

    const classRows=(c??[]) as ClassRow[];
    const profileRows=(p??[]) as Profile[];
    setQuestions((q??[]) as Question[]);
    setProfiles(profileRows);
    setClasses(classRows);
    setMemberships((m??[]) as Membership[]);
    setTeacherAccess((t??[]) as TeacherAccess[]);
    setLessons((l??[]) as Lesson[]);
    setSkills((s??[]) as Skill[]);
    if(!lessonId&&l?.[0])setLessonId(l[0].id);
    if(!skillId&&s?.[0])setSkillId(s[0].id);
    if(!selectedClass&&classRows[0])setSelectedClass(classRows[0].id);
    if(!selectedUser&&profileRows[0])setSelectedUser(profileRows[0].id);
  }

  useEffect(()=>{void load();},[]);

  async function transition(id:string,action:string){
    setBusy(true);setStatus("");
    const {error}=await supabase.rpc("transition_question",{p_question_id:id,p_action:action});
    setStatus(error?error.message:"Content updated ✓");
    await load();setBusy(false);
  }

  function actionFor(q:Question){
    if(q.review_status==="draft")return {label:"Submit review",action:"submit_review"};
    if(q.review_status==="in_review")return {label:"Approve",action:"approve"};
    if(q.review_status==="approved"&&q.publication_status==="draft")return {label:"Publish",action:"publish"};
    if(q.publication_status==="published"||q.publication_status==="published_demo")return {label:"Retire",action:"retire"};
    return null;
  }

  async function createQuestion(e:FormEvent){
    e.preventDefault();
    if(!promptAr.trim()||!promptEn.trim()||!lessonId||!skillId)return;

    const arChoices=choicesAr.split("\n").map(x=>x.trim()).filter(Boolean);
    const enChoices=choicesEn.split("\n").map(x=>x.trim()).filter(Boolean);
    let answerSpec:Record<string,unknown>;

    if(questionType==="multiple-choice"){
      const idx=Number(answer);
      if(!Number.isInteger(idx)||idx<0||idx>=arChoices.length||arChoices.length<2){
        setStatus("For multiple choice, enter a valid zero-based answer index and at least two choices.");
        return;
      }
      answerSpec={type:"multiple-choice",correctAnswer:String(idx)};
    }else{
      const numeric=Number(answer);
      if(!Number.isFinite(numeric)){setStatus("Numeric answer is invalid.");return;}
      answerSpec={type:"numeric",correctAnswer:numeric,tolerance:0.01};
    }

    setBusy(true);setStatus("Creating draft…");
    const {error}=await supabase.rpc("create_question_draft",{
      p_lesson_id:lessonId,
      p_unit_id:null as unknown as string,
      p_skill_id:skillId,
      p_question_type:questionType,
      p_prompt_ar:promptAr.trim(),
      p_prompt_en:promptEn.trim(),
      p_choices_ar:questionType==="multiple-choice"?arChoices:[],
      p_choices_en:questionType==="multiple-choice"?enChoices:[],
      p_answer_spec:answerSpec as Json,
      p_explanation_ar:explanationAr.trim(),
      p_explanation_en:explanationEn.trim(),
      p_difficulty:1,
      p_metadata:{source:"admin-studio"} as Json
    });
    if(error){setStatus(error.message);setBusy(false);return;}

    setPromptAr("");setPromptEn("");setChoicesAr("");setChoicesEn("");setAnswer("");setExplanationAr("");setExplanationEn("");
    setStatus("Draft created with hidden answer key ✓");
    await load();setBusy(false);
  }

  async function changeRole(profile:Profile,role:Profile["role"]){
    if(profile.role===role)return;
    setBusy(true);setStatus("");
    const {error}=await supabase.rpc("set_user_role",{p_user_id:profile.id,p_role:role});
    setStatus(error?error.message:"Role updated ✓");
    await load();setBusy(false);
  }

  async function createClass(e:FormEvent){
    e.preventDefault();
    if(!className.trim()||!gradeLabel.trim()||!academicYear.trim())return;
    setBusy(true);setStatus("");
    const slug="class-"+Date.now().toString(36);
    const {error}=await supabase.from("classes").insert({
      slug,name:className.trim(),grade_label:gradeLabel.trim(),academic_year:academicYear.trim(),active:true
    });
    setStatus(error?error.message:"Class created ✓");
    if(!error){setClassName("");setGradeLabel("");setAcademicYear("");}
    await load();setBusy(false);
  }

  async function addAccess(){
    const profile=profiles.find(x=>x.id===selectedUser);
    if(!profile||!selectedClass)return;
    setBusy(true);setStatus("");
    let errorMessage="";
    if(profile.role==="student"){
      const {error}=await supabase.from("class_memberships").insert({class_id:selectedClass,student_id:profile.id});
      errorMessage=error?.message??"";
    }else if(profile.role==="teacher"){
      const {error}=await supabase.from("teacher_class_access").insert({class_id:selectedClass,teacher_id:profile.id});
      errorMessage=error?.message??"";
    }else{
      errorMessage="Admins already have global class access.";
    }
    setStatus(errorMessage||"Class access added ✓");
    await load();setBusy(false);
  }

  async function removeStudent(classId:string,userId:string){
    setBusy(true);
    const {error}=await supabase.from("class_memberships").delete().eq("class_id",classId).eq("student_id",userId);
    setStatus(error?error.message:"Student removed ✓");await load();setBusy(false);
  }

  async function removeTeacher(classId:string,userId:string){
    setBusy(true);
    const {error}=await supabase.from("teacher_class_access").delete().eq("class_id",classId).eq("teacher_id",userId);
    setStatus(error?error.message:"Teacher access removed ✓");await load();setBusy(false);
  }

  const counts={
    draft:questions.filter(x=>x.review_status==="draft").length,
    review:questions.filter(x=>x.review_status==="in_review").length,
    published:questions.filter(x=>x.publication_status==="published"||x.publication_status==="published_demo").length,
    users:profiles.length
  };

  return <>
    <header className="topbar" style={{marginBottom:18}}>
      <div><div className="eyebrow" style={{color:"#2f7cff"}}>ADMIN STUDIO</div><h1 style={{margin:"6px 0 0"}}>Noata Control Center</h1></div>
      <span className="pill">Audited · RLS protected</span>
    </header>

    <section className="grid-4">
      <article className="metric-card"><span>Drafts</span><strong>{counts.draft}</strong><small>private</small></article>
      <article className="metric-card"><span>In review</span><strong>{counts.review}</strong><small>awaiting approval</small></article>
      <article className="metric-card"><span>Published</span><strong>{counts.published}</strong><small>student-visible</small></article>
      <article className="metric-card"><span>Users</span><strong>{counts.users}</strong><small>{classes.length} classes</small></article>
    </section>

    <div style={{display:"flex",gap:8,marginTop:18,flexWrap:"wrap"}}>
      {(["content","curriculum","users","classes"] as const).map(x=><button key={x} onClick={()=>setTab(x)} className="btn" style={{background:tab===x?"#102b52":"var(--surface)",color:tab===x?"white":"var(--ink)",borderColor:"var(--line)"}}>{x[0].toUpperCase()+x.slice(1)}</button>)}
    </div>

    {status&&<div className="panel" style={{marginTop:14,padding:14,color:status.includes("✓")?"#158456":"var(--muted)"}}>{status}</div>}

    {tab==="content"&&<>
      <section className="content-grid">
        <form className="panel" onSubmit={createQuestion}>
          <div className="panel-head"><h2>Create question draft</h2><span className="pill">Answer key hidden</span></div>
          <div style={{display:"grid",gap:10}}>
            <label><small>Lesson</small><select className="model-select" style={{width:"100%",marginTop:5}} value={lessonId} onChange={e=>setLessonId(e.target.value)}>{lessons.map(x=><option value={x.id} key={x.id}>{x.title_ar}</option>)}</select></label>
            <label><small>Skill</small><select className="model-select" style={{width:"100%",marginTop:5}} value={skillId} onChange={e=>setSkillId(e.target.value)}>{skills.map(x=><option value={x.id} key={x.id}>{x.title_ar}</option>)}</select></label>
            <label><small>Type</small><select className="model-select" style={{width:"100%",marginTop:5}} value={questionType} onChange={e=>setQuestionType(e.target.value as "multiple-choice"|"numeric")}><option value="multiple-choice">Multiple choice</option><option value="numeric">Numeric</option></select></label>
            <textarea className="search" style={{width:"100%",minHeight:74,paddingTop:12}} value={promptAr} onChange={e=>setPromptAr(e.target.value)} placeholder="السؤال بالعربية"/>
            <textarea className="search" style={{width:"100%",minHeight:74,paddingTop:12}} value={promptEn} onChange={e=>setPromptEn(e.target.value)} placeholder="English prompt"/>
            {questionType==="multiple-choice"&&<>
              <textarea className="search" style={{width:"100%",minHeight:90,paddingTop:12}} value={choicesAr} onChange={e=>setChoicesAr(e.target.value)} placeholder={"Arabic choices — one per line"}/>
              <textarea className="search" style={{width:"100%",minHeight:90,paddingTop:12}} value={choicesEn} onChange={e=>setChoicesEn(e.target.value)} placeholder={"English choices — one per line"}/>
            </>}
            <input className="search" style={{width:"100%"}} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={questionType==="multiple-choice"?"Correct index: 0, 1, 2…":"Correct numeric answer"}/>
            <textarea className="search" style={{width:"100%",minHeight:70,paddingTop:12}} value={explanationAr} onChange={e=>setExplanationAr(e.target.value)} placeholder="الشرح بعد التصحيح"/>
            <textarea className="search" style={{width:"100%",minHeight:70,paddingTop:12}} value={explanationEn} onChange={e=>setExplanationEn(e.target.value)} placeholder="Explanation in English"/>
            <button disabled={busy} className="btn" style={{background:"#102b52",color:"white"}}>Create draft</button>
          </div>
        </form>

        <aside className="panel">
          <div className="panel-head"><h2>Workflow rules</h2><span className="pill">Server enforced</span></div>
          <p style={{color:"var(--muted)",lineHeight:1.8}}>Draft → Review → Approve → Publish. Students never receive the hidden answer-key row. Publishing and retiring require admin access and every transition is written to the audit log.</p>
        </aside>
      </section>

      <section className="panel" style={{marginTop:18}}>
        <div className="panel-head"><h2>Content queue</h2><span className="pill">{questions.length} items</span></div>
        <div className="quest-list">
          {questions.slice(0,30).map((q,i)=>{
            const action=actionFor(q);
            return <div className="quest" key={q.id}><div className="quest-icon">{i+1}</div><div><h3>{q.prompt_ar}</h3><p>{q.review_status} · {q.publication_status} · {q.question_type}</p></div><div style={{display:"flex",gap:6}}>{q.review_status==="in_review"&&<button className="btn" disabled={busy} onClick={()=>void transition(q.id,"return_to_draft")} style={{background:"#fff3e8",color:"#a65c16",minHeight:38,padding:"0 10px"}}>Return</button>}{action&&<button className="btn" disabled={busy} onClick={()=>void transition(q.id,action.action)} style={{background:"#102b52",color:"white",minHeight:38,padding:"0 10px"}}>{action.label}</button>}</div></div>;
          })}
        </div>
      </section>
    </>}

    {tab==="curriculum"&&<CurriculumManager/>}

    {tab==="users"&&<section className="panel" style={{marginTop:18}}>
      <div className="panel-head"><h2>Users & roles</h2><span className="pill">Admin-only RPC</span></div>
      <div className="quest-list">
        {profiles.map(p=><div className="quest" key={p.id}><div className="quest-icon">{p.display_name?.slice(0,1).toUpperCase()||"U"}</div><div><h3>{p.display_name||"Unnamed user"}</h3><p>{p.role} · {p.xp} XP · {p.coins} Coins</p></div><select className="model-select" value={p.role} disabled={busy} onChange={e=>void changeRole(p,e.target.value as Profile["role"])}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>)}
      </div>
    </section>}

    {tab==="classes"&&<>
      <section className="content-grid">
        <form className="panel" onSubmit={createClass}>
          <div className="panel-head"><h2>Create class</h2><span className="pill">Admin only</span></div>
          <div style={{display:"grid",gap:10}}>
            <input className="search" style={{width:"100%"}} value={className} onChange={e=>setClassName(e.target.value)} placeholder="Class name"/>
            <input className="search" style={{width:"100%"}} value={gradeLabel} onChange={e=>setGradeLabel(e.target.value)} placeholder="Grade / level"/>
            <input className="search" style={{width:"100%"}} value={academicYear} onChange={e=>setAcademicYear(e.target.value)} placeholder="Academic year"/>
            <button disabled={busy} className="btn" style={{background:"#102b52",color:"white"}}>Create class</button>
          </div>
        </form>

        <aside className="panel">
          <div className="panel-head"><h2>Add class access</h2></div>
          <div style={{display:"grid",gap:10}}>
            <select className="model-select" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select className="model-select" value={selectedUser} onChange={e=>setSelectedUser(e.target.value)}>{profiles.map(p=><option key={p.id} value={p.id}>{p.display_name||"Unnamed"} · {p.role}</option>)}</select>
            <button className="btn" disabled={busy||!selectedClass||!selectedUser} onClick={()=>void addAccess()} style={{background:"#102b52",color:"white"}}>Add access</button>
          </div>
        </aside>
      </section>

      <section style={{display:"grid",gap:14,marginTop:18}}>
        {classes.map(c=>{
          const students=memberships.filter(x=>x.class_id===c.id);
          const teachers=teacherAccess.filter(x=>x.class_id===c.id);
          return <article className="panel" key={c.id}>
            <div className="panel-head"><div><h2>{c.name}</h2><p style={{margin:"4px 0",color:"var(--muted)"}}>{c.grade_label} · {c.academic_year}</p></div><span className="pill">{students.length} students · {teachers.length} teachers</span></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
              <div><b>Students</b>{students.map(m=><div key={m.student_id} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"8px 0",borderBottom:"1px solid var(--line)"}}><span>{profiles.find(p=>p.id===m.student_id)?.display_name||"Student"}</span><button onClick={()=>void removeStudent(c.id,m.student_id)} style={{border:0,background:"transparent",color:"#e35757"}}>Remove</button></div>)}</div>
              <div><b>Teachers</b>{teachers.map(t=><div key={t.teacher_id} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"8px 0",borderBottom:"1px solid var(--line)"}}><span>{profiles.find(p=>p.id===t.teacher_id)?.display_name||"Teacher"}</span><button onClick={()=>void removeTeacher(c.id,t.teacher_id)} style={{border:0,background:"transparent",color:"#e35757"}}>Remove</button></div>)}</div>
            </div>
          </article>;
        })}
      </section>
    </>}
  </>;
}
