import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { createDiscountRuleSchema } from "@notifyafrica/validation";

/** Discount Engine (02_Specifications_Backoffice §13). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const rules = await prisma.discountRule.findMany({ orderBy: { priority: "desc" } });
  return Response.json({ rules });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createDiscountRuleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const rule = await prisma.discountRule.create({
    data: {
      type: input.type,
      productKey: input.productKey,
      scope: input.scope,
      scopeId: input.scopeId,
      value: input.value,
      priority: input.priority,
      stackable: input.stackable,
      maxDiscount: input.maxDiscount,
      startAt: input.startAt ? new Date(input.startAt) : null,
      endAt: input.endAt ? new Date(input.endAt) : null,
      status: "ACTIVE",
    },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "discount.create",
    resource: "discount_rule",
    resourceId: rule.id,
    after: rule,
  });

  return Response.json({ rule });
}
