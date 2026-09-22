import { createCoreApiClient } from "@notifyafrica/api-client";
import { env } from "./env";

export const coreApi = createCoreApiClient({ baseUrl: env.coreApiUrl });
