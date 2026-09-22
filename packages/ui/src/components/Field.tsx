import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Field({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="field">
      {label ? <label>{label}</label> : null}
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={["input", className].filter(Boolean).join(" ")} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={["input", className].filter(Boolean).join(" ")} {...rest} />;
}

export function RadioOption({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement> & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="radio">
      <input type="radio" {...props} />
      <span className="dot" />
      {label}
    </label>
  );
}
