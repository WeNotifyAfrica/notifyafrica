import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import {
  Shell,
  ShellSidebar,
  ShellBrand,
  ShellNav,
  ShellTopbar,
  ShellPageTitle,
  ShellMain,
  Tag,
  type ShellNavItem,
} from "@notifyafrica/ui";

/**
 * Back-office shell — same shell pattern as the Console (design handoff
 * §3), minus the org/project switcher and wallet card: those are
 * client-account concepts, meaningless for an internal Ops/Finance/Support
 * user. Lot 19's mockup shows the internal user's identity as a
 * `tag-accent` badge ("Interne NotifyAfrica · Aïcha B. · Ops") in the page
 * header — reproduced here from the real session email + internal role.
 */
const NAV_ITEMS: ShellNavItem[] = [
  { href: "/dashboard", label: "Pilotage" },
  { href: "/dashboard/catalog", label: "Catalogue" },
  { href: "/dashboard/pricing", label: "Moteur de prix" },
  { href: "/dashboard/discounts", label: "Remises" },
  { href: "/dashboard/providers", label: "Providers & Routage" },
  { href: "/dashboard/quotes", label: "Devis" },
  { href: "/dashboard/whatsapp-templates", label: "Modèles WhatsApp" },
  { href: "/dashboard/payment-methods", label: "Moyens de paiement" },
  { href: "/dashboard/organizations", label: "Organisations" },
  { href: "/dashboard/users", label: "Utilisateurs" },
  { href: "/dashboard/transactions", label: "Transactions" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  let session;
  try {
    ({ session } = await coreApi(token).getSession());
  } catch {
    redirect("/login");
  }
  if (!session.internalRole) redirect("/login");

  return (
    <Shell>
      <ShellSidebar>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <ShellBrand>NotifyAfrica Admin</ShellBrand>
          <span className="text-muted" style={{ fontSize: 11 }}>
            Back-office interne
          </span>
        </div>
        <ShellNav items={NAV_ITEMS} />
      </ShellSidebar>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <ShellTopbar>
          <ShellPageTitle items={NAV_ITEMS} fallback="Back-office" />
          <Tag variant="accent" style={{ marginLeft: "auto" }}>
            Interne NotifyAfrica · {session.email} · {session.internalRole}
          </Tag>
        </ShellTopbar>

        <ShellMain>{children}</ShellMain>
      </div>
    </Shell>
  );
}
