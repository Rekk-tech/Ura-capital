/**
 * In-memory token store for React client
 * Complies with ADR-004 (no unsafe localStorage/sessionStorage)
 * Provides synchronous fallback access to access token for API clients
 */

let inMemoryAccessToken: string | null = null;

export function setGlobalAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getGlobalAccessToken(): string | null {
  return inMemoryAccessToken;
}
