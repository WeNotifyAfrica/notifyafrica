import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { campaignJson } from "@/lib/serialize";
import { createCampaignSchema } from "@notifyafrica/validation";

/**
 * Campaigns (03_Specifications_Console §12): Draft -> Channel -> Audience
 * -> Content -> Estimate -> Schedule -> Review -> Reserve Funds -> Run ->
 * Report. This route only handles the Draft step — no funds are touched
 * until /launch.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ campaigns: campaigns.map(campaignJson) });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const project = await prisma.project.findFirst({ where: { organizationId: session.organizationId } });
  if (!project) {
    return Response.json({ error: "project_not_found" }, { status: 404 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      organizationId: session.organizationId,
      projectId: project.id,
      name: input.name,
      product: input.productKey,
      senderId: input.senderId,
      content: input.content,
      destinations: input.destinations,
      status: "DRAFT",
      totalCount: input.destinations.length,
    },
  });

  return Response.json({ campaign: campaignJson(campaign) });
}
