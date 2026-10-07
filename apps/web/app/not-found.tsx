import {AppShell} from "@/components/app-shell";

export default function NotFound(){
  return <AppShell active="">
    <section className="hero" style={{textAlign:"center",padding:48}}>
      <div className="eyebrow">404 · LOST QUEST</div>
      <h1>الصفحة دي مش موجودة.</h1>
      <p>ممكن الرابط اتغيّر أو المحتوى لسه مش منشور.</p>
      <div className="hero-actions" style={{justifyContent:"center"}}><a className="btn btn-primary" href="/">الرئيسية</a><a className="btn btn-secondary" href="/learn">التعلّم</a></div>
    </section>
  </AppShell>;
}
