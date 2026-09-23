import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { createProviderEndpointSchema } from "@notifyafrica/validation";

/**
 * Provider endpoints (02_Specifications_Backoffice §21.1). Only connection
 * shape (base URL, path, method, auth type label, timeout) — actual
 * credentials belong to a Credentials Vault (§24), not built yet, so
 * `authType` here is a declared method, never a stored secret.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) {
    return Response.json({ error: "provider_not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createProviderEndpointSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }

  const endpoint = await prisma.providerEndpoint.create({
    data: { ...parsed.data, providerId: id },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "provider_endpoint.create",
    resource: "provider_endpoint",
    resourceId: endpoint.id,
    after: { providerId: id, baseUrl: endpoint.baseUrl, environment: endpoint.environment },
  });

  return Response.json({ endpoint });
}
