"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/locale";
import { parseBulkImportCards, type ImportedStudyCard } from "@/lib/study/metadata";
import { StudyRichText } from "./study-rich-text";

export type StudyImportExportProps = {
  targetDeckTitle?: string;
  deckCards: Array<{
    front: string;
    back: string;
    card_type: string;
    cloze_text?: string | null;
    hint?: string;
  }>;
  busy?: boolean;
  onImportCards: (cards: ImportedStudyCard[], newDeckTitle?: string) => Promise<void> | void;
};

export function StudyImportExport({
  targetDeckTitle,
  deckCards,
  busy = false,
  onImportCards,
}: StudyImportExportProps) {
  const t = useTranslation();
  const { push } = useToast();

  const [rawInput, setRawInput] = useState("");
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [importing, setImporting] = useState(false);

  const parsedPreview = useMemo(() => parseBulkImportCards(rawInput, 150), [rawInput]);

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      setRawInput(content);
      if (!newDeckTitle && file.name) {
        setNewDeckTitle(file.name.replace(/\.(txt|tsv|csv|md)$/i, "").slice(0, 120));
      }
      push({
        title: t(`تمت قراءة الملف: ${file.name}`, `Loaded file: ${file.name}`),
        tone: "info",
      });
    } catch {
      push({
        title: t("تعذّرت قراءة الملف المحدد.", "Could not read the selected file."),
        tone: "danger",
      });
    } finally {
      e.target.value = "";
    }
  }

  function loadSampleCloze() {
    setRawInput(
      [
        "البناء الضوئي يحول {{c1::ثاني أكسيد الكربون::الغاز الممتص}} والماء إلى {{c2::جلوكوز::السكر الناتج}} بمساعدة ضوء الشمس.",
        "الدائرة :: $\\pi r^2$ يساوي مساحة الدائرة :: نصف القطر r",
        "قانون نيوتن الثاني\t$F = m \\cdot a$\tالقوة تساوي الكتلة في التسارع",
      ].join("\n"),
    );
  }

  async function submitImport() {
    if (parsedPreview.length === 0 || importing || busy) return;
    setImporting(true);
    try {
      await onImportCards(parsedPreview, newDeckTitle.trim() || undefined);
      setRawInput("");
      setNewDeckTitle("");
    } finally {
      setImporting(false);
    }
  }

  function handleExportAnki() {
    if (deckCards.length === 0) {
      push({ title: t("لا توجد بطاقات في هذه المجموعة للتصدير.", "No cards in the selected deck to export."), tone: "warning" });
      return;
    }
    const header = "#separator:tab\n#html:false\n";
    const lines = deckCards.map((c) => {
      const frontText = c.card_type === "cloze" && c.cloze_text ? c.cloze_text : c.front;
      const safeFront = frontText.replace(/\t|\n/g, " ").trim();
      const safeBack = c.back.replace(/\t|\n/g, " ").trim();
      const safeHint = (c.hint ?? "").replace(/\t|\n/g, " ").trim();
      return safeHint ? `${safeFront}\t${safeBack}\t${safeHint}` : `${safeFront}\t${safeBack}`;
    });
    const blob = new Blob([header + lines.join("\n")], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noata-cards-${Date.now()}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
    push({ title: t("تم تنزيل ملف Anki TSV بنجاح.", "Anki TSV file downloaded."), tone: "success" });
  }

  function handlePrintDeck() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="noata-import-export-box">
      <div className="noata-import-head">
        <div>
          <h3>{t("استيراد وتصدير البطاقات (Anki / Markdown / Cloze)", "Import & Export Cards (Anki / Markdown / Cloze)")}</h3>
          <p className="noata-study-muted">
            {t(
              "الصق نصوص Anki TSV أو CSV أو صيغة Markdown (المفهوم :: الشرح) أو جمل ملء الفراغات {{c1::الإجابة::تلميح}}.",
              "Paste Anki TSV, CSV, Markdown (Term :: Definition), or multi-group Cloze ({{c1::answer::hint}}).",
            )}
          </p>
        </div>

        <div className="noata-import-export-actions">
          <Button size="sm" variant="secondary" onClick={loadSampleCloze}>
            <Icon name="sparkles" size={14} />
            {t("تجربة مثال جاهز", "Load Sample")}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExportAnki} disabled={deckCards.length === 0}>
            <Icon name="download" size={14} />
            {t("تصدير Anki TSV", "Export Anki TSV")}
          </Button>
          <Button size="sm" variant="ghost" onClick={handlePrintDeck} disabled={deckCards.length === 0}>
            <Icon name="file" size={14} />
            {t("نسخة للطباعة", "Print Sheet")}
          </Button>
        </div>
      </div>

      <div className="noata-import-grid">
        <div className="noata-import-editor">
          <div className="noata-import-file-row">
            <label className="noata-file-upload-label">
              <Icon name="folder" size={15} />
              <span>{t("رفع ملف (.txt / .tsv / .csv / .md)", "Upload file (.txt / .tsv / .csv / .md)")}</span>
              <input
                type="file"
                accept=".txt,.tsv,.csv,.md,text/plain,text/csv,text/tab-separated-values"
                onChange={handleFileUpload}
              />
            </label>
            <input
              type="text"
              className="noata-input-compact"
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              placeholder={
                targetDeckTitle
                  ? t(`إضافة إلى: ${targetDeckTitle} (أو اكتب اسم مجموعة جديدة)`, `Target: ${targetDeckTitle} (or enter new deck name)`)
                  : t("اسم مجموعة جديدة للبطاقات المستوردة", "New deck title for imported cards")
              }
            />
          </div>

          <Field
            label={t("محتوى الاستيراد", "Import Payload")}
            htmlFor="noata-bulk-import-input"
          >
            {(fieldProps) => (
              <Textarea
                {...fieldProps}
                rows={5}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={t(
                  "مثال:\nالمفهوم :: التعريف المختصر\nنص يحتوي على {{c1::حذف::تلميح اختياري}}",
                  "Example:\nMitochondria :: Powerhouse of the cell\nPhotosynthesis converts {{c1::CO2::gas}} into {{c2::glucose::sugar}}",
                )}
              />
            )}
          </Field>

          <div className="noata-import-submit-row">
            <Badge tone={parsedPreview.length > 0 ? "success" : "neutral"}>
              {t(`${parsedPreview.length} بطاقة جاهزة للاستيراد`, `${parsedPreview.length} cards detected`)}
            </Badge>
            <Button
              variant="primary"
              disabled={parsedPreview.length === 0 || importing || busy}
              onClick={submitImport}
            >
              <Icon name="plus" size={16} />
              {importing
                ? t("جارٍ الاستيراد...", "Importing...")
                : newDeckTitle.trim()
                  ? t("إنشاء مجموعة واستيراد البطاقات", "Create Deck & Import")
                  : t("استيراد إلى المجموعة الحالية", "Import to Selected Deck")}
            </Button>
          </div>
        </div>

        <div className="noata-import-preview" aria-live="polite">
          <div className="noata-speed-col-label">
            {t("معاينة فورية للبطاقات", "Live Parse Preview")}
          </div>
          {parsedPreview.length === 0 ? (
            <p className="noata-study-muted">
              {t("اكتب أو ارفع بطاقات في المحرر لرؤية تصنيفها ونوع كل بطاقة هنا.", "Enter or upload lines on the left to inspect parsed card types.")}
            </p>
          ) : (
            <ul className="noata-preview-card-list">
              {parsedPreview.slice(0, 5).map((card, idx) => (
                <li key={idx} className="noata-preview-card-item">
                  <div className="noata-preview-card-head">
                    <Badge tone={card.card_type === "cloze" ? "accent" : "neutral"}>
                      {card.card_type}
                    </Badge>
                    {card.metadata.hint ? <Badge tone="warning">{card.metadata.hint}</Badge> : null}
                  </div>
                  <div className="noata-preview-card-front">
                    <StudyRichText content={card.cloze_text || card.front} />
                  </div>
                  {card.card_type !== "cloze" ? (
                    <div className="noata-preview-card-back">
                      <StudyRichText content={card.back} />
                    </div>
                  ) : null}
                </li>
              ))}
              {parsedPreview.length > 5 ? (
                <li className="noata-preview-more">
                  {t(`+ ${parsedPreview.length - 5} بطاقات إضافية`, `+ ${parsedPreview.length - 5} more cards`)}
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
