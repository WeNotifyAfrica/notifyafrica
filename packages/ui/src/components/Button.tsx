import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

/** Maps 1:1 to the .btn / .btn-* classes in @notifyafrica/design-system's nocturne.css. */
export function Button({ variant = "primary", block, className, ...props }: ButtonProps) {
  const classes = ["btn", `btn-${variant}`, block ? "btn-block" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={classes} {...props} />;
}
