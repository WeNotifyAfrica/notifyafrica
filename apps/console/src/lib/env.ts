export const env = {
  consoleUrl: process.env.CONSOLE_URL ?? "http://localhost:3001",
  coreApiUrl: process.env.CORE_API_URL ?? "http://localhost:3010",
  authSecret: process.env.AUTH_SECRET ?? "",
};

export const SESSION_COOKIE = "na_session";
