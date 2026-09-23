import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, CardTitle, CardBody } from "@notifyafrica/ui";

/**
 * Wallet overview (03_Specifications_Console §8). Recharge/payment methods
 * are Phase D+ once a real PSP is wired (04_Prompt §16) — for now, balance
 * is credited manually from Admin (02_Specifications_Backoffice §15).
 */
export default async function BillingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { wallet } = await coreApi(token).getWallet();

  return (
    <div>
      <h1>Facturation</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        <Card elevation="sm">
          <CardTitle>Disponible</CardTitle>
          <CardBody>
            <span className="num" style={{ fontSize: 22, color: "var(--color-accent-300)" }}>
              {wallet.availableMinor} {wallet.currency}
            </span>
          </CardBody>
        </Card>
        <Card elevation="sm">
          <CardTitle>Réservé</CardTitle>
          <CardBody>
            <span className="num">{wallet.reservedMinor} {wallet.currency}</span>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
