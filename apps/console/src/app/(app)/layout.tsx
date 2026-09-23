import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Nav, NavLink } from "@notifyafrica/ui";

/**
 * Console shell — sidebar/topbar + org/project switcher (design handoff
 * Lots 5-6). Every product module (SMS, Campaigns, OTP, ...) renders inside
 * this shell as a sub-route; it never gets its own top-level layout
 * (design handoff §3 exception on console/back-office page structure).
 */
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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid var(--color-divider)", padding: "var(--space-4)" }}>
        <div className="nav-brand" style={{ marginBottom: 24 }}>
          NotifyAfrica
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink href="/dashboard">Vue d&apos;ensemble</NavLink>
          <NavLink href="/dashboard/sms">SMS</NavLink>
          <NavLink href="/dashboard/campaigns">Campagnes</NavLink>
          <NavLink href="/dashboard/otp">OTP</NavLink>
          <NavLink href="/dashboard/pricing">Tarifs</NavLink>
          <NavLink href="/dashboard/quotes">Devis</NavLink>
          <NavLink href="/dashboard/billing">Facturation</NavLink>
          <NavLink href="/dashboard/developers">Développeurs</NavLink>
          <NavLink href="/dashboard/team">Équipe</NavLink>
        </nav>
      </aside>
      <div>
        <Nav>
          <span className="text-muted">{session.email}</span>
        </Nav>
        <main style={{ padding: "var(--space-6)" }}>{children}</main>
      </div>
    </div>
  );
}
