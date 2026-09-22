import { createCoreApiClient } from "@notifyafrica/api-client";
import { env } from "./env";

export function coreApi(sessionToken?: string) {
  return createCoreApiClient({ baseUrl: env.coreApiUrl, sessionToken });
}
