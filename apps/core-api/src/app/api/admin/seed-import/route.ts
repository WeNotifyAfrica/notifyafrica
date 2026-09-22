import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { importConfigSeed } from "@/lib/seed-import";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await importConfigSeed(session.sub);
  return Response.json(result);
}
