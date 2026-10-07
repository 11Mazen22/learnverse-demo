import { FANAR_CAPABILITIES } from "@/lib/ai/catalog";
export const metadata={title:"Noata AI"};

export default function NoataAIPage(){
  return <main style={{padding:24,minHeight:"100vh"}}>
    <section className="ai-layout">
      <aside className="ai-sidebar">
        <div className="brand"><div className="brand-mark">N</div><div className="brand-copy"><strong>Noata AI</strong><span>Study companion</span></div></div>
        <button className="ai-new">＋ محادثة جديدة</button>
        <div className="ai-history"><button>شرح التشابه في الهندسة</button><button>راجع معايا درس الطاقة</button><button>اختبرني في الفلسفة</button></div>
      </aside>
      <section className="ai-chat">
        <header className="ai-top"><div><b>Noata AI</b><div style={{fontSize:11,color:"#73839b"}}>Learning-aware • Arabic-first • Fanar powered</div></div>
          <select className="model-select" defaultValue="auto"><option value="auto">Auto · Smart Router</option>{FANAR_CAPABILITIES.filter(x=>x.visibleInPicker).map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select>
        </header>
        <div className="ai-messages">
          <div className="message assistant"><b>أهلاً 👋</b><p>أنا Noata AI. أقدر أشرح، أختبرك، أراجع إجابتك، أتعامل مع الصور والصوت، وأحوّل الدرس لمهمة متدرجة حسب مستواك.</p></div>
          <div className="message user">خلّيني أفهم discriminant بطريقة سهلة وبعدين اختبرني.</div>
          <div className="message assistant"><b>الفكرة في 20 ثانية</b><p>الـ discriminant هو <b>b² − 4ac</b>. هو بيوصفلك نوع حلول المعادلة التربيعية قبل ما تحلها بالكامل.</p><p>لو موجب: حلّين حقيقيين. لو صفر: حل حقيقي مكرر. لو سالب: مفيش حلول حقيقية.</p></div>
        </div>
        <footer className="ai-composer"><div className="composer-box"><textarea placeholder="اسأل Noata… اكتب، ارفع صورة، أو استخدم صوتك" /><div className="composer-actions"><div style={{display:"flex",gap:8}}><button className="icon-btn">＋</button><button className="icon-btn">◉</button></div><button className="send-btn">إرسال ↑</button></div></div></footer>
      </section>
    </section>
  </main>;
}
