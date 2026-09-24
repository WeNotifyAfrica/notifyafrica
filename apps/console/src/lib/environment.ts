import { cookies } from "next/headers";
import { ENV_COOKIE, type ConsoleEnvironment } from "./env";

/** Reads the Live/Test cookie for the current request — the one place
 * every page/action asks "which environment am I in right now". */
export async function getCurrentEnvironment(): Promise<ConsoleEnvironment> {
  const cookieStore = await cookies();
  return cookieStore.get(ENV_COOKIE)?.value === "production" ? "production" : "sandbox";
}
