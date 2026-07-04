const PRODUCTION_APP_URL = "https://www.entiremind.com";

const ALLOWED_ORIGINS = new Set([
  "https://www.entiremind.com",
  "https://entiremind.com",
]);

/**
 * Resolve the app's own origin for building redirect URLs (Stripe checkout
 * success/cancel, billing-portal return, etc.).
 *
 * The request's Origin header is attacker-controlled, so it is only honored
 * when it matches a known app origin (or localhost during development).
 * Everything else falls back to NEXT_PUBLIC_APP_URL / the production domain,
 * so a forged Origin can never steer a user to an attacker's site after a
 * payment flow.
 */
export function resolveAppOrigin(request: Request): string {
  const origin = request.headers.get("origin");

  if (origin) {
    if (ALLOWED_ORIGINS.has(origin)) {
      return origin;
    }
    if (
      process.env.NODE_ENV === "development" &&
      /^http:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return origin;
    }
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_APP_URL;
}
