export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const CANONICAL_ROLES: readonly RoleCode[] = Object.freeze([
  ROLES.ADMIN,
  ROLES.USER,
]);

/**
 * Runtime type guard validating if an unknown string value is a canonical RoleCode.
 * Prevents unknown strings from database or input (e.g. SUPER_ADMIN, ROOT) from becoming trusted roles.
 */
export function isRoleCode(value: unknown): value is RoleCode {
  return typeof value === "string" && (value === ROLES.USER || value === ROLES.ADMIN);
}
