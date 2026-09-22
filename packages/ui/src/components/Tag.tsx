import type { HTMLAttributes } from "react";

type Variant = "accent" | "accent-2" | "neutral" | "outline";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Tag({ variant = "neutral", className, ...props }: TagProps) {
  const classes = ["tag", `tag-${variant}`, className].filter(Boolean).join(" ");
  return <span className={classes} {...props} />;
}
