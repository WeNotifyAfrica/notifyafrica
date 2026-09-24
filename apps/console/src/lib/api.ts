import { createCoreApiClient } from "@notifyafrica/api-client";
import { env, type ConsoleEnvironment } from "./env";

export function coreApi(sessionToken?: string, environment?: ConsoleEnvironment) {
  return createCoreApiClient({ baseUrl: env.coreApiUrl, sessionToken, environment });
}
