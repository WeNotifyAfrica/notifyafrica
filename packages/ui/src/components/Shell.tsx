"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Console/Admin app shell (design handoff Lots 5-6 §3: product modules
 * "live inside the console shell" — sidebar, topbar, one layout for every
 * sub-route). Shared by both apps since Admin's back-office follows the
 * same shell pattern, minus the org/project switcher. */
export function Shell({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}

export function ShellSidebar({ children }: { children: ReactNode }) {
  return <aside className="shell-sidebar">{children}</aside>;
}

export function ShellBrand({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 17 }}>{children}</div>;
}

export interface ShellNavItem {
  href: string;
  label: string;
}

/** Client component: needs `usePathname` to mark the active link, the one
 * piece of the shell that can't be a plain server-rendered `<a>`. */
export function ShellNav({ items }: { items: ShellNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="shell-nav">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <a key={item.href} href={item.href} className="shell-link" aria-current={active ? "page" : undefined}>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export function ShellTopbar(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div className={["shell-topbar", className].filter(Boolean).join(" ")} {...rest} />;
}

/** Derives the topbar page title from the same nav item list, client-side
 * (the layout that renders the topbar is a server component and has no
 * reliable way to read the current pathname of the page it wraps). */
export function ShellPageTitle({ items, fallback }: { items: ShellNavItem[]; fallback: string }) {
  const pathname = usePathname();
  const match = [...items].sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span className="text-muted" style={{ fontSize: 11 }}>
        {fallback}
      </span>
      <span style={{ fontSize: 15 }}>{match?.label ?? "Vue d'ensemble"}</span>
    </div>
  );
}

export function ShellMain(props: HTMLAttributes<HTMLElement>) {
  const { className, ...rest } = props;
  return <main className={["shell-main", className].filter(Boolean).join(" ")} {...rest} />;
}
