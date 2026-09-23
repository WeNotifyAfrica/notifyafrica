import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import {
  Button,
  Shell,
  ShellSidebar,
  ShellBrand,
  ShellNav,
  ShellTopbar,
  ShellPageTitle,
  ShellMain,
  formatMoney,
  type ShellNavItem,
} from "@notifyafrica/ui";

/**
 * Console shell — sidebar/topbar + org/project identity (design handoff
 * Lots 5-6). Every product module (SMS, Campaigns, OTP, ...) renders inside
 * this shell as a sub-route (§3: "les onglets deviennent des sous-routes").
 * The mockup's org/project *switcher* and Live/Test environment toggle are
 * shown as static labels, not interactive controls — there is only ever one
 * org and one default project per account today (Phase C), and no sandbox
 * environment exists in the data model, so a working switcher would be
 * theater. Documented in docs/ARCHITECTURE.md rather than faked.
 */
const NAV_ITEMS: ShellNavItem[] = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/sms", label: "SMS" },
  { href: "/dashboard/campaigns", label: "Campagnes" },
  { href: "/dashboard/otp", label: "OTP" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
  { href: "/dashboard/pricing", label: "Tarifs" },
  { href: "/dashboard/quotes", label: "Devis" },
  { href: "/dashboard/billing", label: "Facturation" },
  { href: "/dashboard/developers", label: "Développeurs" },
  { href: "/dashboard/team", label: "Équipe" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const api = coreApi(token);
  let session;
  try {
    ({ session } = await api.getSession());
  } catch {
    redirect("/login");
  }

  const [{ wallet }, currenciesConfig] = await Promise.all([
    api.getWallet().catch(() => ({ wallet: null })),
    api.listCurrencies().catch(() => ({ value: [] })),
  ]);
  const currencies = currenciesConfig.value ?? [];
  const initials = session.email.slice(0, 2).toUpperCase();

  return (
    <Shell>
      <ShellSidebar>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <ShellBrand>NotifyAfrica</ShellBrand>
          <span className="text-muted" style={{ fontSize: 11 }}>
            Console client
          </span>
        </div>

        <ShellNav items={NAV_ITEMS} />

        {wallet ? (
          <div className="card" style={{ marginTop: "auto", background: "var(--color-neutral-900)", gap: "var(--space-2)" }}>
            <span className="card-kicker">Solde disponible</span>
            <span className="num" style={{ fontSize: 19, color: "var(--color-accent-300)" }}>
              {formatMoney(wallet.availableMinor, wallet.currency, currencies)}
            </span>
            <a href="/dashboard/billing">
              <Button variant="primary" block>
                Recharger
              </Button>
            </a>
          </div>
        ) : null}
      </ShellSidebar>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <ShellTopbar>
          <ShellPageTitle items={NAV_ITEMS} fallback="Console" />
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginLeft: "auto" }}>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {session.email}
            </span>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--color-accent-800)",
                color: "var(--color-accent-100)",
                fontSize: 12,
              }}
            >
              {initials}
            </span>
          </div>
        </ShellTopbar>

        <ShellMain>{children}</ShellMain>
      </div>
    </Shell>
  );
}
