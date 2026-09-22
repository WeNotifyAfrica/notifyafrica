import { coreApi } from "@/lib/api";
import { Card, Table } from "@notifyafrica/ui";

/**
 * SMS tiers example from 01_Specifications_Website §11: whatever Admin
 * publishes to PricingRule shows up here verbatim, no Website deploy
 * required to change a price.
 */
export default async function TarifsPage() {
  const { tiers } = await coreApi.listPricingTiers("SMS", "XOF");

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Tarifs SMS</h1>
      <Card elevation="md">
        <div style={{ overflow: "auto" }}>
          <Table style={{ minWidth: 480 }}>
            <thead>
              <tr>
                <th>Volume</th>
                <th>Prix unitaire</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, i) => (
                <tr key={i}>
                  <td>
                    {tier.volumeMin.toLocaleString("fr-FR")}
                    {tier.volumeMax ? ` - ${tier.volumeMax.toLocaleString("fr-FR")}` : "+"}
                  </td>
                  <td className="num">
                    {tier.quoteRequired ? "Sur devis" : `${tier.unitPrice} ${tier.currency}/SMS`}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </main>
  );
}
