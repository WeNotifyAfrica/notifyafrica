import { listCatalog } from "@/lib/catalog";

export async function GET() {
  const result = await listCatalog();
  return Response.json(result);
}
