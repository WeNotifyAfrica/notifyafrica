import { prisma } from "./db";

/**
 * Wallet ledger (00_Contexte_Global §10, 04_Prompt §15). Every mutation goes
 * through a DB transaction that updates the Wallet balance and appends a
 * LedgerEntry in the same commit, so the running balance and the audit trail
 * can never drift apart. Paid flows follow estimate -> holdFunds ->
 * (captureFunds | releaseFunds), never debiting directly (04_Prompt §15).
 */

export class InsufficientBalanceError extends Error {
  constructor() {
    super("insufficient_balance");
  }
}

export async function ensureWallet(organizationId: string, currency: string) {
  return prisma.wallet.upsert({
    where: { organizationId },
    update: {},
    create: { organizationId, currency, availableMinor: 0n, reservedMinor: 0n },
  });
}

export async function getWallet(organizationId: string) {
  return prisma.wallet.findUnique({ where: { organizationId } });
}

export async function creditWallet(organizationId: string, amountMinor: bigint, reason: string) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { organizationId },
      data: { availableMinor: { increment: amountMinor } },
    });
    await tx.ledgerEntry.create({
      data: { walletId: wallet.id, type: "CREDIT", amountMinor, reason },
    });
    return wallet;
  });
}

/** Reserves funds ahead of a paid operation. Throws InsufficientBalanceError
 * without mutating anything if the available balance can't cover it. */
export async function holdFunds(organizationId: string, amountMinor: bigint, reason: string) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { organizationId } });
    if (!wallet || wallet.availableMinor < amountMinor) {
      throw new InsufficientBalanceError();
    }
    const updated = await tx.wallet.update({
      where: { organizationId },
      data: {
        availableMinor: { decrement: amountMinor },
        reservedMinor: { increment: amountMinor },
      },
    });
    await tx.ledgerEntry.create({
      data: { walletId: wallet.id, type: "HOLD", amountMinor, reason },
    });
    return updated;
  });
}

/** Converts a hold into a final debit once the operation actually happened. */
export async function captureFunds(organizationId: string, amountMinor: bigint, reason: string) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { organizationId },
      data: { reservedMinor: { decrement: amountMinor } },
    });
    await tx.ledgerEntry.create({
      data: { walletId: wallet.id, type: "CAPTURE", amountMinor, reason },
    });
    return wallet;
  });
}

/** Returns a hold to available balance when the operation didn't happen. */
export async function releaseFunds(organizationId: string, amountMinor: bigint, reason: string) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { organizationId },
      data: {
        reservedMinor: { decrement: amountMinor },
        availableMinor: { increment: amountMinor },
      },
    });
    await tx.ledgerEntry.create({
      data: { walletId: wallet.id, type: "RELEASE", amountMinor, reason },
    });
    return wallet;
  });
}

/** Converts a decimal amount (e.g. 6.8 XOF) into integer minor units for the
 * given currency, using its seeded `decimals` (defaults to 0 if unknown). */
export async function toMinorUnits(amount: number, currency: string): Promise<bigint> {
  const currencyRow = await prisma.currency.findUnique({ where: { code: currency } });
  const decimals = currencyRow?.decimals ?? 0;
  return BigInt(Math.round(amount * 10 ** decimals));
}
