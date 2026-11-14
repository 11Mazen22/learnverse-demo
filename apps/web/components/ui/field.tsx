"use client";

import {
  useId,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Icon } from "./icon";

export type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": "true" | "false";
    "aria-describedby"?: string;
    required?: boolean;
  }) => ReactNode;
};

/**
 * Accessible form field wrapper linking label, optional hint, and inline validation message
 * without pointing `aria-describedby` at empty hidden nodes.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className = "",
  children,
}: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["nk-field", className].filter(Boolean).join(" ")}>
      <label className="nk-field-label" htmlFor={id}>
        <span>{label}</span>
        {required && (
          <span className="nk-field-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": error ? "true" : "false",
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(required ? { required: true } : {}),
      })}
      {hint && (
        <p id={hintId} className="nk-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="nk-field-error" role="alert">
          <Icon name="alert-circle" size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** Accessible single-line text input styled with minimum 16px zoom-safe font sizing. */
export function Input({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["nk-input", className].filter(Boolean).join(" ")} {...rest} />;
}

/** Accessible select input styled identically to `.nk-input` in both themes. */
export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={["nk-select", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </select>
  );
}

/** Accessible multiline textarea with vertical resize and error-ring support. */
export function Textarea({
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={["nk-textarea", className].filter(Boolean).join(" ")} {...rest} />
  );
}

/** Semantic `<fieldset>` grouping related inputs with `<legend>` as first child. */
export function Fieldset({
  legend,
  className = "",
  children,
  ...rest
}: FieldsetHTMLAttributes<HTMLFieldSetElement> & { legend: string }) {
  return (
    <fieldset className={["nk-fieldset", className].filter(Boolean).join(" ")} {...rest}>
      <legend className="nk-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}
