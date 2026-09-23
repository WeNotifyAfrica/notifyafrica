import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { createProviderSchema } from "@notifyafrica/validation";

/**
 * Providers (02_Specifications_Backoffice §20). This is configuration
 * storage only — declaring a provider here does not open a proxy to it
 * (04_Prompt §17: "ne crée pas un proxy arbitraire non sécurisé"); no
 * runtime call-out exists yet, only the approved-destination catalog a
 * future gateway would read from.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const providers = await prisma.provider.findMany({
    orderBy: { name: "asc" },
    include: { endpoints: true },
  });
  return Response.json({ providers });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = createProviderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const provider = await prisma.provider.create({ data: parsed.data });

  await recordAudit({
    actorUserId: session.sub,
    action: "provider.create",
    resource: "provider",
    resourceId: provider.id,
    after: provider,
  });

  return Response.json({ provider });
}
