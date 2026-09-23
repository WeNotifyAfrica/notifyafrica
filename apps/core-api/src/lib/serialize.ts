/** Wallet/ledger amounts are BigInt in Postgres (exact integer minor units,
 * 00_Contexte_Global §19 "never a float") — JSON.stringify doesn't know how
 * to serialize BigInt, so every response touching them goes through this. */
export function walletJson<T extends { availableMinor: bigint; reservedMinor: bigint }>(
  wallet: T,
) {
  return {
    ...wallet,
    availableMinor: wallet.availableMinor.toString(),
    reservedMinor: wallet.reservedMinor.toString(),
  };
}

export function transactionJson<T extends { amountMinor: bigint }>(transaction: T) {
  return { ...transaction, amountMinor: transaction.amountMinor.toString() };
}

/** Campaign.heldAmountMinor is also BigInt (the funds reserved at launch) —
 * same reasoning as wallet/transaction amounts. */
export function campaignJson<T extends { heldAmountMinor: bigint | null }>(campaign: T) {
  return { ...campaign, heldAmountMinor: campaign.heldAmountMinor?.toString() ?? null };
}
