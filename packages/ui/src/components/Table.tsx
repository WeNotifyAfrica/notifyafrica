import type { HTMLAttributes } from "react";

/** Wrap in <Card elevation="md"> with overflow:auto per design handoff §6 convention. */
export function Table(props: HTMLAttributes<HTMLTableElement>) {
  const { className, ...rest } = props;
  return <table className={["table", className].filter(Boolean).join(" ")} {...rest} />;
}
