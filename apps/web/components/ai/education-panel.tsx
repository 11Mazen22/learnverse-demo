"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useId, useState } from "react";
import {
  EDUCATION_DEPTHS,
  EDUCATION_FLOWS,
  EDUCATION_LEVELS,
  buildEducationPrompt,
  getEducationFlow,
  educationCatalog,
  type EducationDepthId,
  type EducationFlowId,
  type EducationLevelId,
} from "@/lib/ai/education-flows";
import { Icon } from "@/components/ui/icon";

type Props = {
  onUse: (value: string) => void;
  onSend?: (value: string) => void;
  canSend?: boolean;
};

export function EducationPanel({ onUse, onSend, canSend = true }: Props) {
 const t=useTranslation(),locale=useLocale();
  const [selected, setSelected] = useState<EducationFlowId>("explain");
  const [level, setLevel] = useState<EducationLevelId>("secondary");
  const [depth, setDepth] = useState<EducationDepthId>("balanced");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const topicId = useId();
  const {flows:EDUCATION_FLOWS,levels:EDUCATION_LEVELS,depths:EDUCATION_DEPTHS}=educationCatalog(locale);
  const flow = getEducationFlow(selected,locale);
  const ready = topic.trim().length >= 2;

  function run(action: (prompt: string) => void) {
    try {
      action(buildEducationPrompt(selected, topic, { level, depth,locale }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("راجع موضوع النشاط.","Check the activity topic."));
    }
  }

  return (
    <section className="aura-workshop" aria-label={t("ورشة المذاكرة","Study workshop")}>
      <header className="aura-workshop-head">
        <span className="aura-workshop-icon"><Icon name="book" size={22} /></span>
        <div>
          <strong>{t("ورشة المذاكرة","Study workshop")}</strong>
          <small>{t("اختر نشاطًا، حدّد مستواك، ثم أرسله إلى Noäta AI.","Choose an activity and your level, then send it to Noäta AI.")}</small>
        </div>
      </header>

      <div className="aura-workshop-scroll" tabIndex={0} aria-label={t("خيارات ورشة المذاكرة","Study workshop options")}>
      <ol className="aura-workshop-steps">
        <li>
          <h3><span>1</span>{t("ماذا تريد أن تفعل؟","What would you like to do?")}</h3>
          <div className="aura-workshop-flows" role="group" aria-label={t("نوع النشاط","Activity type")}>
            {EDUCATION_FLOWS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected === item.id}
                onClick={() => setSelected(item.id)}
              >
                <span className="aura-workshop-flow-icon"><Icon name={item.icon} size={18} /></span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))}
          </div>
        </li>

        <li>
          <h3><span>2</span>{t("ما الموضوع أو النص؟","What is the topic or text?")}</h3>
          <label className="sr-only" htmlFor={topicId}>{t("الموضوع أو النص","Topic or text")}</label>
          <textarea
            id={topicId}
            className="aura-workshop-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={1200}
            placeholder={flow.placeholder}
            rows={3}
          />
          <div className="aura-workshop-meta">
            <span dir="ltr">{topic.trim().length} / 1200</span>
          </div>
        </li>

        <li>
          <h3><span>3</span>{t("خصّص النتيجة","Customize the result")}</h3>
          <div className="aura-workshop-options">
            <fieldset>
              <legend>{t("المستوى الدراسي","Learning level")}</legend>
              <div className="aura-chip-row">
                {EDUCATION_LEVELS.map((item) => (
                  <button key={item.id} type="button" aria-pressed={level === item.id} onClick={() => setLevel(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>{t("عمق الرد","Answer detail")}</legend>
              <div className="aura-chip-row">
                {EDUCATION_DEPTHS.map((item) => (
                  <button key={item.id} type="button" aria-pressed={depth === item.id} onClick={() => setDepth(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </li>
      </ol>
      </div>

      <div className="aura-workshop-footer">
      <div className="aura-workshop-preview" aria-live="polite">
        <Icon name="ai" size={17} />
        <p><b>{t("ما الذي ستحصل عليه:","What you will get:")}</b> {flow.outcome}</p>
      </div>

      {error && <p className="aura-education-error" role="alert">{error}</p>}

      <div className="aura-workshop-actions">
        {onSend && (
          <button type="button" className="aura-workshop-send" onClick={() => run(onSend)} disabled={!ready || !canSend}>{t("ابدأ الآن","Start now")}<Icon name="arrow" size={17} />
          </button>
        )}
        <button type="button" className="aura-workshop-draft" onClick={() => run(onUse)} disabled={!ready}>{t("ضعه في المحادثة لأعدّله","Add to chat for editing")}</button>
      </div>
      <p className="aura-education-note">{t("تُرسل الورشة طلبًا منظّمًا إلى Noäta AI. راجع النتائج المهمة مع معلّمك أو كتابك المدرسي.","The workshop sends a structured request to Noäta AI. Check important answers with your teacher or textbook.")}</p>
      </div>
    </section>
  );
}
