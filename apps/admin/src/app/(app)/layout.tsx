import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Nav, NavLink } from "@notifyafrica/ui";

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
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid var(--color-divider)", padding: "var(--space-4)" }}>
        <div className="nav-brand" style={{ marginBottom: 24 }}>
          NotifyAfrica Admin
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink href="/dashboard">Pilotage</NavLink>
          <NavLink href="/dashboard/catalog">Catalogue</NavLink>
          <NavLink href="/dashboard/pricing">Moteur de prix</NavLink>
          <NavLink href="/dashboard/providers">Providers &amp; Routage</NavLink>
          <NavLink href="/dashboard/organizations">Organisations</NavLink>
          <NavLink href="/dashboard/users">Utilisateurs</NavLink>
          <NavLink href="/dashboard/transactions">Transactions</NavLink>
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
