import type { ReactNode } from "react";

export function Dialog({
  open,
  title,
  children,
  actions,
  onDismiss,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        <div className="dialog-body">{children}</div>
        {actions ? <div className="dialog-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
