import type { ChangeEvent, ReactNode } from 'react';

interface FieldWrapProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldWrapProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  suffix?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  hint,
  suffix,
}: NumberFieldProps) {
  const handle = (event: ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(event.target.value);
    if (!Number.isFinite(next)) {
      onChange(0);
      return;
    }
    let clamped = next;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    onChange(clamped);
  };

  return (
    <Field label={label} hint={hint}>
      <span className="field-input-wrap">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={handle}
        />
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
      </span>
    </Field>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}

export function TextField({ label, value, onChange, hint, placeholder }: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}

export function TextAreaField({ label, value, onChange, hint, rows = 4 }: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

interface CheckFieldProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}

export function CheckField({ label, checked, onChange, hint }: CheckFieldProps) {
  return (
    <label className="check-field">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <strong>{label}</strong>
        {hint ? <em>{hint}</em> : null}
      </span>
    </label>
  );
}
