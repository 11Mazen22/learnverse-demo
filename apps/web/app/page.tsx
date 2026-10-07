const nav=[["Overview","/"],["Learn","/learn"],["Missions","/missions"],["Noata AI","/ai"],["Progress","/progress"],["Rewards","/rewards"],["Teacher","/teacher"],["Studio","/admin"]];

export default function HomePage(){
  return <main className="noata-shell">
    <aside className="noata-sidebar">
      <div className="brand"><div className="brand-mark">N</div><div className="brand-copy"><strong>Noata</strong><span>Learn • Grow • Achieve</span></div></div>
      <div className="nav-group"><div className="nav-title">Learning OS</div>
        {nav.map(([label,href],i)=><a className={"nav-link "+(i===0?"active":"")} href={href} key={href}><span>◈</span>{label}</a>)}
      </div>
    </aside>
    <section className="noata-main">
      <header className="topbar"><input className="search" placeholder="ابحث عن درس، مهمة، مهارة..." /><div className="avatar">M</div></header>
      <section className="hero">
        <div className="eyebrow">NOATA LEARNING ENGINE</div>
        <h1>تعلّم بذكاء. اتقدّم كل يوم. وخلي التعليم لعبة ليها معنى.</h1>
        <p>مسارات تعليمية متكيفة، مهام متدرجة، ذكاء اصطناعي يفهم مستواك، ونظام تقدّم يكافئ الفهم الحقيقي — مش الحفظ.</p>
        <div className="hero-actions"><a className="btn btn-primary" href="/learn">كمّل رحلتك</a><a className="btn btn-secondary" href="/ai">افتح Noata AI</a></div>
      </section>
      <section className="grid-4">
        <article className="metric-card"><span>المستوى</span><strong>12</strong><small>+240 XP هذا الأسبوع</small></article>
        <article className="metric-card"><span>المهارات المتقنة</span><strong>18</strong><small>3 قريبة من الإتقان</small></article>
        <article className="metric-card"><span>السلسلة</span><strong>7 أيام</strong><small>أفضل سلسلة: 14</small></article>
        <article className="metric-card"><span>Noata Coins</span><strong>1,840</strong><small>+85 اليوم</small></article>
      </section>
      <section className="content-grid">
        <article className="panel"><div className="panel-head"><h2>مهامك الحالية</h2><span className="pill">Adaptive</span></div>
          <div className="quest-list">
            <div className="quest"><div className="quest-icon">01</div><div><h3>Mission: الطاقة والحركة</h3><p>سؤال سهل → تطبيق → تحدّي</p><div className="progress"><i style={{width:"68%"}} /></div></div><b>68%</b></div>
            <div className="quest"><div className="quest-icon">02</div><div><h3>Review: المعادلات الخطية</h3><p>مراجعة ذكية مبنية على أدائك السابق</p><div className="progress"><i style={{width:"42%"}} /></div></div><b>42%</b></div>
            <div className="quest"><div className="quest-icon">B</div><div><h3>Unit Boss</h3><p>3 مراحل — من الفهم للنقل والتطبيق</p><div className="progress"><i style={{width:"15%"}} /></div></div><b>Ready</b></div>
          </div>
        </article>
        <aside><div className="rank-card"><span>Learning Rank</span><strong>Explorer II</strong><small>460 XP للوصول إلى Explorer III</small></div><div className="ai-preview"><b>Noata AI</b><p>اسأل عن أي نقطة مش واضحة، ابعت صورة، أو خلّيني أحول الدرس لمهمة وأسئلة.</p><a href="/ai">ابدأ محادثة →</a></div></aside>
      </section>
    </section>
  </main>;
}
