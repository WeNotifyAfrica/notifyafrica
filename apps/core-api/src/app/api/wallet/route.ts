import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { getWallet } from "@/lib/wallet";
import { walletJson } from "@/lib/serialize";
import { releaseExpiredOtpHolds } from "@/lib/otp";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  // Self-heals reservedMinor before reporting it — an expired OTP hold the
  // caller never re-checked via /verify would otherwise look like stuck
  // reserved balance (see apps/core-api/src/lib/otp.ts).
  await releaseExpiredOtpHolds(session.organizationId);
  const wallet = await getWallet(session.organizationId);
  if (!wallet) {
    return Response.json({ error: "wallet_not_found" }, { status: 404 });
  }
  return Response.json({ wallet: walletJson(wallet) });
}
