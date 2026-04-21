/**
 * Extracts the visitor's country code from Netlify's context.
 *
 * The Astro Netlify adapter (v6+) exposes Netlify's context object at
 * `locals.netlify.context`. The `context.geo` property contains the
 * visitor's geolocation data including their country code.
 *
 * Falls back to Cloudflare's `cf-ipcountry` header in case the site is
 * ever placed behind Cloudflare's proxy.
 *
 * Returns the uppercase ISO 3166-1 alpha-2 country code (e.g. "US", "DE"),
 * or null when no geo data is available (e.g. local development).
 */
export function getRequestCountry(request: Request, locals?: Record<string, any>): string | null {
  // 1. Netlify context geo (available in serverless functions via Astro locals).
  // The Astro Netlify adapter injects a mock geo object in local dev
  // (country.code: "mock"); treat that as "no geo" so dev fails open.
  const netlifyCountry = locals?.netlify?.context?.geo?.country?.code;
  if (
    typeof netlifyCountry === "string" &&
    netlifyCountry.length > 0 &&
    netlifyCountry.toLowerCase() !== "mock"
  ) {
    return netlifyCountry.toUpperCase();
  }

  // 2. Cloudflare's country header (present when site is behind CF proxy)
  const cfCountry = (request.headers.get("cf-ipcountry") || "").trim().toUpperCase();
  if (cfCountry) {
    return cfCountry;
  }

  // 3. No geo data available (local dev) — caller decides how to handle
  return null;
}
