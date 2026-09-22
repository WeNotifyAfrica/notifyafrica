import type { HTMLAttributes, ReactNode } from "react";

type Elevation = "sm" | "md" | "lg" | "none";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  accentBorder?: boolean;
}

export function Card({ elevation = "none", accentBorder, className, style, ...props }: CardProps) {
  const classes = ["card", elevation !== "none" ? `elev-${elevation}` : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      style={accentBorder ? { borderLeft: "2px solid var(--color-accent)", ...style } : style}
      {...props}
    />
  );
}

export function CardKicker({ children }: { children: ReactNode }) {
  return <div className="card-kicker">{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="card-title">{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <p className="card-body">{children}</p>;
}

export function CardMeta({ children }: { children: ReactNode }) {
  return <div className="card-meta">{children}</div>;
}
