import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { campaignJson } from "@/lib/serialize";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!campaign) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ campaign: campaignJson(campaign) });
}
