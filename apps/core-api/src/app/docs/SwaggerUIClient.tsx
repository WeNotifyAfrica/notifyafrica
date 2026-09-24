"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

/** swagger-ui-react touches `window` at import time, so this is a client
 * component loaded via next/dynamic(..., { ssr: false }) from the page. */
export default function SwaggerUIClient() {
  return <SwaggerUI url="/api/openapi.json" docExpansion="list" />;
}
