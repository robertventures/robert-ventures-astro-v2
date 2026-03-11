/**
 * Extracts the visitor's country code from the request headers.
 *
 * Netlify provides geo data in the `x-nf-geo` header as a base64-encoded
 * JSON object: { country: { code: "US" }, ... }
 *
 * Falls back to Cloudflare's `cf-ipcountry` header in case the site is
 * ever placed behind Cloudflare's proxy.
 *
 * Returns the uppercase ISO 3166-1 alpha-2 country code (e.g. "US", "DE"),
 * or null when no geo data is available (e.g. local development).
 */
export function getRequestCountry(request: Request): string | null {
  // 1. Netlify's geo header (base64 JSON)
  const nfGeo = request.headers.get("x-nf-geo");
  if (nfGeo) {
    try {
      const decoded = JSON.parse(atob(nfGeo));
      const code = decoded?.country?.code;
      if (typeof code === "string" && code.length > 0) {
        return code.toUpperCase();
      }
    } catch {
      // Malformed header — fall through to next check
    }
  }

  // 2. Cloudflare's country header (present when site is behind CF proxy)
  const cfCountry = (request.headers.get("cf-ipcountry") || "").trim().toUpperCase();
  if (cfCountry) {
    return cfCountry;
  }

  // 3. No geo data available (local dev) — caller decides how to handle
  return null;
}
