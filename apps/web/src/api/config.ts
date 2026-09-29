/**
 * Resolves the backend API base URL from runtime Vite environment variables.
 *
 * Defaults to empty string `""` in local development, test runners, and unified origins
 * where reverse proxies (e.g. Nginx, Vite dev proxy) handle `/api` routing.
 *
 * When deployed across distributed origins (e.g., Cloudflare Pages frontend pointing to
 * a Render backend), `VITE_API_URL` configures the authoritative remote origin without trailing slash.
 */
export function getApiBaseUrl(): string {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
    let raw = String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, "");
    if (raw.endsWith("/api/v1")) {
      raw = raw.slice(0, -"/api/v1".length);
    } else if (raw.endsWith("/api")) {
      raw = raw.slice(0, -"/api".length);
    }
    return raw.replace(/\/+$/, "");
  }
  return "";
}
