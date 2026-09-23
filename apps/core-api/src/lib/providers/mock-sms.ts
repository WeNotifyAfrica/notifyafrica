// Moved to packages/domain so the campaign job processor (Worker) uses the
// same adapter as single-message send — see
// packages/domain/src/providers/mock-sms.ts.
export { sendViaMockProvider } from "@notifyafrica/domain";
