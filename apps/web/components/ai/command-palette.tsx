"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import {
  PALETTE_QUERY_MAX_LENGTH,
  matchPaletteCommands,
  movePaletteIndex,
  paletteOptionId,
  type PaletteCommand,
  type PaletteGroup,
  type PaletteLocale,
} from "@/lib/ai/command-palette";

/**
 * Aura command palette (Ctrl/Cmd+P) for the Noäta AI workspace.
 * Matching, ranking and circular selection are pure functions in
 * lib/ai/command-palette so this component only renders and reports choices.
 * Disabled commands are filtered out there, so an entry only shows when the
 * workspace is actually in a state that can run it.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  locale,
  onRun,
}: {
  open: boolean;
  onClose: () => void;
  commands: readonly PaletteCommand[];
  locale: PaletteLocale;
  onRun: (id: string) => void;
}) {
  const t = useTranslation();
  const uiLocale = useLocale() === "en" ? "en" : "ar";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const results = useMemo(
    () => matchPaletteCommands(query, commands, locale),
    [commands, locale, query],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A fresh palette every time: empty query, first option focused.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    inputRef.current?.focus();
  }, [open]);

  // The command list can shrink while the palette is open (loading/finish),
  // so keep the highlight inside the visible results.
  useEffect(() => {
    if (index > 0 && index >= results.length) setIndex(0);
  }, [index, results.length]);

  const groupHeadings: Record<PaletteGroup, string> = {
    quick: t("إجراءات سريعة", "Quick actions"),
    workspace: t("مساحة العمل", "Workspace"),
    conversations: t("المحادثات", "Conversations"),
  };

  function choose(command: PaletteCommand) {
    onRun(command.id);
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="nk-palette"
      aria-label={t("لوحة أوامر Noäta", "Noäta command palette")}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="nk-palette-panel" dir={uiLocale === "en" ? "ltr" : "rtl"} lang={uiLocale}>
        <div className="nk-palette-head">
          <span className="nk-palette-brand">
            <Icon name="sparkles" size={15} />
            {t("أوامر Noäta", "Noäta commands")}
          </span>
          <kbd className="nk-palette-kbd" aria-hidden="true">
            Ctrl+P
          </kbd>
        </div>
        <input
          ref={inputRef}
          type="search"
          id="nk-palette-input"
          className="nk-palette-input"
          role="combobox"
          aria-expanded="true"
          aria-controls="nk-palette-results"
          aria-activedescendant={results[index] ? paletteOptionId(index) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          maxLength={PALETTE_QUERY_MAX_LENGTH}
          placeholder={t("اكتب أمرًا أو عنوان محادثة…", "Type a command or conversation title…")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.slice(0, PALETTE_QUERY_MAX_LENGTH));
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => movePaletteIndex(i, 1, results.length));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => movePaletteIndex(i, -1, results.length));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const chosen = results[index];
              if (chosen) choose(chosen);
            }
          }}
        />
        {results.length ? (
          <ul
            className="nk-palette-list"
            id="nk-palette-results"
            role="listbox"
            aria-label={t("الأوامر المطابقة", "Matching commands")}
          >
            {results.map((command, position) => {
              const label = locale === "ar" ? command.labelAr : command.labelEn;
              const hint = locale === "ar" ? command.hintAr : command.hintEn;
              const showGroup =
                position === 0 || results[position - 1].group !== command.group;
              return (
                <li
                  key={command.id}
                  id={paletteOptionId(position)}
                  role="option"
                  aria-selected={position === index}
                  aria-label={label}
                  tabIndex={-1}
                  className={"nk-palette-option" + (position === index ? " active" : "")}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setIndex(position)}
                  onClick={() => choose(command)}
                >
                  <span className="nk-palette-option-text" aria-hidden="true">
                    {showGroup && (
                      <span className="nk-palette-group">{groupHeadings[command.group]}</span>
                    )}
                    <span className="nk-palette-label">{label}</span>
                    {hint && <span className="nk-palette-hint">{hint}</span>}
                  </span>
                  {command.shortcut && (
                    <span className="nk-palette-shortcut" aria-hidden="true">
                      {command.shortcut}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="nk-palette-empty" role="status">
            {t("لا نتائج مطابقة. جرّب كلمة أخرى.", "No matching results. Try another word.")}
          </p>
        )}
        <p className="nk-palette-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            {t("تنقّل", "Move")}
          </span>
          <span>
            <kbd>Enter</kbd>
            {t("تشغيل", "Run")}
          </span>
          <span>
            <kbd>Esc</kbd>
            {t("إغلاق", "Close")}
          </span>
        </p>
      </div>
    </dialog>
  );
}
