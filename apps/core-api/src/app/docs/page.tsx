"use client";

import dynamic from "next/dynamic";

const SwaggerUIClient = dynamic(() => import("./SwaggerUIClient"), { ssr: false });

/** Self-hosted API reference, generated from the same Zod schemas the
 * route handlers validate against (see @/lib/openapi-registry) — never a
 * hand-maintained spec. Lives on this app's own domain, no third-party
 * account involved. */
export default function DocsPage() {
  return <SwaggerUIClient />;
}
