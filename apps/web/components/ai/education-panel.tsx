"use client";
import { useId, useState } from "react";
import {
  EDUCATION_DEPTHS,
  EDUCATION_FLOWS,
  EDUCATION_LEVELS,
  buildEducationPrompt,
  getEducationFlow,
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
  const [selected, setSelected] = useState<EducationFlowId>("explain");
  const [level, setLevel] = useState<EducationLevelId>("secondary");
  const [depth, setDepth] = useState<EducationDepthId>("balanced");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const topicId = useId();
  const flow = getEducationFlow(selected);
  const ready = topic.trim().length >= 2;

  function run(action: (prompt: string) => void) {
    try {
      action(buildEducationPrompt(selected, topic, { level, depth }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "راجع موضوع النشاط.");
    }
  }

  return (
    <section className="aura-workshop" aria-label="ورشة المذاكرة">
      <header className="aura-workshop-head">
        <span className="aura-workshop-icon"><Icon name="book" size={22} /></span>
        <div>
          <strong>ورشة المذاكرة</strong>
          <small>اختر نشاطًا، حدّد مستواك، ثم أرسله إلى Noata AI.</small>
        </div>
      </header>

      <div className="aura-workshop-scroll" tabIndex={0} aria-label="خيارات ورشة المذاكرة">
      <ol className="aura-workshop-steps">
        <li>
          <h3><span>1</span> ماذا تريد أن تفعل؟</h3>
          <div className="aura-workshop-flows" role="group" aria-label="نوع النشاط">
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
          <h3><span>2</span> ما الموضوع أو النص؟</h3>
          <label className="sr-only" htmlFor={topicId}>الموضوع أو النص</label>
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
          <h3><span>3</span> خصّص النتيجة</h3>
          <div className="aura-workshop-options">
            <fieldset>
              <legend>المستوى الدراسي</legend>
              <div className="aura-chip-row">
                {EDUCATION_LEVELS.map((item) => (
                  <button key={item.id} type="button" aria-pressed={level === item.id} onClick={() => setLevel(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>عمق الرد</legend>
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
        <p><b>ما الذي ستحصل عليه:</b> {flow.outcome}</p>
      </div>

      {error && <p className="aura-education-error" role="alert">{error}</p>}

      <div className="aura-workshop-actions">
        {onSend && (
          <button type="button" className="aura-workshop-send" onClick={() => run(onSend)} disabled={!ready || !canSend}>
            ابدأ الآن <Icon name="arrow" size={17} />
          </button>
        )}
        <button type="button" className="aura-workshop-draft" onClick={() => run(onUse)} disabled={!ready}>
          ضعه في المحادثة لأعدّله
        </button>
      </div>
      <p className="aura-education-note">
        تُرسل الورشة طلبًا منظّمًا إلى Noata AI. راجع النتائج المهمة مع معلّمك أو كتابك المدرسي.
      </p>
      </div>
    </section>
  );
}
