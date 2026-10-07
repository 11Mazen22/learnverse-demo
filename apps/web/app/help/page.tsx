import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/ui/icon";
export const metadata = { title: "المساعدة" };
const topics = [
  [
    "أبدأ منين؟",
    "افتح رحلة التعلّم، اختار وحدة، وابدأ أول درس. بعد الشرح جرّب المهمة علشان تتأكد إنك فهمت الفكرة.",
    "/learn",
    "ابدأ التعلّم",
  ],
  [
    "إيه الفرق بين الخبرة والإتقان؟",
    "نقاط الخبرة بتحتفل بمجهودك. الإتقان بيعبّر عن فهمك من إجاباتك المستقلة والمتنوعة. المراجعة في وقتها بتثبّت الفهم.",
    "/progress",
    "شوف تقدّمك",
  ],
  [
    "أستخدم Noata AI إزاي؟",
    "اكتب سؤالك أو ارفع صورة أو ملفًا صوتيًا. اختار «تلقائي» علشان يتحدد المساعد المناسب، واستخدم الأدوات للترجمة أو إنشاء صورة. راجع المعلومات المهمة.",
    "/ai",
    "افتح المساعد",
  ],
  [
    "ألاقي واجباتي فين؟",
    "الواجبات اللي نشرها مدرّسك لفصلك بتظهر في مساحة الواجبات. تابع الموعد، جاوب الأسئلة، وارجع تشوف النتيجة.",
    "/assignments",
    "افتح الواجبات",
  ],
  [
    "أغيّر شكل وتجربة التطبيق إزاي؟",
    "من الإعدادات تقدر تغيّر الاسم والمظهر واتجاه اللغة وتقلّل الحركة. تفضيلات الحساب بتتنقل معاك بين أجهزتك.",
    "/settings",
    "إعداداتك",
  ],
];
export default function Help() {
  return (
    <AppShell active="/help">
      <section className="hero">
        <div className="eyebrow">A LITTLE GUIDANCE</div>
        <h1>كل سؤال له بداية.</h1>
        <p>دليل صغير يخليك تستفيد من كل خطوة في Noata.</p>
      </section>
      <div className="content-grid">
        {topics.map(([title, body, href, label]) => (
          <article className="panel" key={title}>
            <Icon name="help" />
            <h2>{title}</h2>
            <p style={{ color: "var(--muted)" }}>{body}</p>
            <Link
              className="btn"
              href={href}
              style={{ color: "var(--accent)" }}
            >
              {label} ←
            </Link>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
