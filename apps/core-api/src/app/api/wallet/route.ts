import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { getWallet } from "@/lib/wallet";
import { walletJson } from "@/lib/serialize";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const wallet = await getWallet(session.organizationId);
  if (!wallet) {
    return Response.json({ error: "wallet_not_found" }, { status: 404 });
  }
  return Response.json({ wallet: walletJson(wallet) });
}
