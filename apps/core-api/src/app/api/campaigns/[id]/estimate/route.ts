import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { estimatePricing } from "@/lib/pricing-engine";
import { campaignJson } from "@/lib/serialize";

/**
 * Campaign "Estimate" step — quantity is the whole audience, so a large
 * campaign naturally lands on the right volume tier (or `quoteRequired`)
 * from the same Pricing Engine single sends use. Stores the result on the
 * campaign for /launch to hold funds against; doesn't touch the wallet
 * itself.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const [campaign, organization] = await Promise.all([
    prisma.campaign.findFirst({ where: { id, organizationId: session.organizationId } }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
  ]);
  if (!campaign || !organization) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (campaign.status !== "DRAFT") {
    return Response.json({ error: "not_editable" }, { status: 409 });
  }

  const estimate = await estimatePricing({
    organizationId: organization.id,
    projectId: campaign.projectId,
    product: campaign.product,
    country: organization.country,
    operator: null,
    category: null,
    quantity: campaign.destinations.length,
    currency: organization.currency as "XOF",
  });

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      unitPrice: estimate.quoteRequired ? null : estimate.unitPrice,
      currency: estimate.currency,
      estimatedTotal: estimate.quoteRequired ? null : estimate.total,
    },
  });

  return Response.json({ campaign: campaignJson(updated), estimate });
}
