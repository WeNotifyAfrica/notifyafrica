import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ session });
}
