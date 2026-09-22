import { estimatePricing } from "@/lib/pricing-engine";
import { pricingEstimateRequestSchema } from "@notifyafrica/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = pricingEstimateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await estimatePricing(parsed.data);
  return Response.json(result);
}
