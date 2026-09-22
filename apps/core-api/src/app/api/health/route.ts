export async function GET() {
  return Response.json({ status: "ok", service: "core-api", time: new Date().toISOString() });
}
