export const env = {
  adminUrl: process.env.ADMIN_URL ?? "http://localhost:3002",
  coreApiUrl: process.env.CORE_API_URL ?? "http://localhost:3010",
};

export const SESSION_COOKIE = "na_admin_session";
