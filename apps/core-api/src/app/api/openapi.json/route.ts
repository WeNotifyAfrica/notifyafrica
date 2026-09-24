import { generateOpenApiDocument } from "@/lib/openapi-registry";

/** Generated on every request from the live Zod registry — never a static
 * file that could go stale relative to the route handlers. */
export async function GET() {
  return Response.json(generateOpenApiDocument());
}
