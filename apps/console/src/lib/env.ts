export const env = {
  consoleUrl: process.env.CONSOLE_URL ?? "http://localhost:3001",
  coreApiUrl: process.env.CORE_API_URL ?? "http://localhost:3010",
  authSecret: process.env.AUTH_SECRET ?? "",
};

export const SESSION_COOKIE = "na_session";

/** Live/Test switch (design handoff Lots 5-6 shell). Defaults to
 * "sandbox" when absent — matches Core API's own default and every
 * pre-existing org's single project, so a visitor who's never touched the
 * toggle behaves exactly as before this feature existed. */
export const ENV_COOKIE = "na_env";
export type ConsoleEnvironment = "production" | "sandbox";
