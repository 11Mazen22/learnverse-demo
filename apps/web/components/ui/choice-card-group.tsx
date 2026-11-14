"use client";

import { useId } from "react";
import { Icon } from "./icon";

export function ChoiceCardGroup({
  legend,
  options,
  value,
  onChange,
  disabled = false,
  contentDir = "rtl",
  numericLabels = false,
  locale = "ar",
}: {
  legend: string;
  options: string[];
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  contentDir?: "rtl" | "ltr";
  numericLabels?: boolean;
  locale?: "ar" | "en";
}) {
  const groupName = useId();
  return (
    <fieldset className="noata-choice-fieldset" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <div className="noata-choice-list" role="radiogroup" aria-label={legend}>
        {options.map((option, index) => {
          const val = String(index);
          const selected = value === val;
          const badgeLabel = numericLabels
            ? (index + 1).toLocaleString(locale === "en" ? "en" : "ar-EG")
            : String.fromCharCode(65 + index);
          return (
            <label
              key={`${groupName}-${index}`}
              className="noata-choice-card"
              data-selected={selected ? "true" : "false"}
              data-disabled={disabled ? "true" : "false"}
            >
              <input
                type="radio"
                className="noata-choice-radio"
                name={groupName}
                value={val}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(val)}
              />
              <span className="noata-choice-badge" aria-hidden="true">
                {badgeLabel}
              </span>
              <span className="noata-choice-text" dir={contentDir}>
                {option}
              </span>
              <span className="noata-choice-indicator" aria-hidden="true">
                {selected ? <Icon name="check" size={14} /> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
