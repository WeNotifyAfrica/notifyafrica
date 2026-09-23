/**
 * Mock SMS provider adapter — stands in for a real SMPP/aggregator
 * connection until sandbox credentials exist (design handoff README §9
 * point 4). Deliberately isolated behind this one function: swapping in a
 * real adapter later means changing this file only, not the send route's
 * estimate/hold/capture sequence.
 */
export async function sendViaMockProvider(_input: {
  destination: string;
  content: string;
}): Promise<"SENT" | "FAILED"> {
  return "SENT";
}
