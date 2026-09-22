import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Nav({ brand, children, ...props }: { brand?: ReactNode } & HTMLAttributes<HTMLElement>) {
  const { className, ...rest } = props;
  return (
    <nav className={["nav", className].filter(Boolean).join(" ")} {...rest}>
      {brand ? <span className="nav-brand">{brand}</span> : null}
      {children}
    </nav>
  );
}

export function NavLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
