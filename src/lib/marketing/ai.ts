/**
 * Re-export of the shared strict-JSON helper.
 *
 * `generateStrictJson` started life here but is not marketing-specific — it now
 * lives in `src/lib/ai/json.ts` alongside the provider adapters it calls. This
 * file stays so existing marketing imports keep working.
 */
export { generateStrictJson, StrictJsonError } from "../ai/json";
