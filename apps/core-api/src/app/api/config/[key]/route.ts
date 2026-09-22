import { resolveConfig } from "@/lib/config-resolver";
import type { ConfigEnvironment, ConfigScope } from "@notifyafrica/types";

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") as ConfigScope | null) ?? undefined;
  const scopeId = url.searchParams.get("scopeId");
  const environment = (url.searchParams.get("environment") as ConfigEnvironment | null) ?? undefined;

  const resolved = await resolveConfig(key, { scope, scopeId, environment });
  return Response.json(resolved);
}
