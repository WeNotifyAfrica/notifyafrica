import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

/** Must run before any schema file in this package calls `.openapi()` —
 * imported first (side-effect only) by index.ts, relying on Node/ESM's
 * single module instance for `zod` so every schema file sees the same
 * already-extended `z`. */
extendZodWithOpenApi(z);
