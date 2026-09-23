import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { z } from "zod";

const upsertProductSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().min(1),
  summary: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  icon: z.string().nullable().default(null),
  features: z.array(z.string()).default([]),
  billingUnit: z.string().nullable().default(null),
  countries: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "BETA", "COMING_SOON", "PRIVATE", "DISABLED"]),
  publicPageEnabled: z.boolean().default(false),
  order: z.number().int().default(0),
});

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = upsertProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const before = await prisma.catalogProduct.findUnique({ where: { key: input.key } });

  const product = await prisma.catalogProduct.upsert({
    where: { key: input.key },
    update: input,
    create: input,
  });

  await recordAudit({
    actorUserId: session.sub,
    action: before ? "catalog.update" : "catalog.create",
    resource: "catalog_product",
    resourceId: product.id,
    before,
    after: product,
  });

  return Response.json({ product });
}
