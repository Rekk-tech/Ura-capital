export const ROLES = {
  // Legacy roles (Maintained for full backward compatibility)
  USER: "USER",
  ADMIN: "ADMIN",

  // 5-Role Segregation of Duties (SoD) Ecosystem Architecture
  LEARNER: "LEARNER",
  BROKER: "BROKER",
  MODERATOR: "MODERATOR",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const CANONICAL_ROLES: readonly RoleCode[] = Object.freeze([
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN,
  ROLES.MODERATOR,
  ROLES.BROKER,
  ROLES.LEARNER,
  ROLES.USER,
]);

/**
 * Runtime type guard validating if an unknown string value is a canonical RoleCode.
 * Prevents unknown strings from database or input (e.g. ROOT, SUPERUSER) from becoming trusted roles.
 */
export function isRoleCode(value: unknown): value is RoleCode {
  return (
    typeof value === "string" &&
    (value === ROLES.LEARNER ||
      value === ROLES.BROKER ||
      value === ROLES.MODERATOR ||
      value === ROLES.SYSTEM_ADMIN ||
      value === ROLES.USER ||
      value === ROLES.ADMIN)
  );
}

/**
 * Role helper predicates for clean, readable authorization branching.
 */
export function isSystemAdmin(role?: string | null): boolean {
  return role === ROLES.SYSTEM_ADMIN || role === ROLES.ADMIN;
}

export function isModerator(role?: string | null): boolean {
  return role === ROLES.MODERATOR;
}

export function isBroker(role?: string | null): boolean {
  return role === ROLES.BROKER;
}

export function isLearner(role?: string | null): boolean {
  return role === ROLES.LEARNER || role === ROLES.USER;
}

