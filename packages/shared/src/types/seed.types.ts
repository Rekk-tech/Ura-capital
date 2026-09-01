/**
 * FEAT-017: Development & Test Seed Strategy Types & Contracts
 */

export const SEED_MODES = ["development", "test", "ci"] as const;
export type SeedMode = (typeof SEED_MODES)[number];

export const SEED_ENVIRONMENTS = ["development", "test"] as const;
export type SeedEnvironment = (typeof SEED_ENVIRONMENTS)[number];

export const MIN_DEV_SEED_PASSWORD_LENGTH = 12;

export interface SeedEnvironmentInput {
  nodeEnv?: string;
  seedMode?: string;
  isCi?: boolean;
  databaseUrl?: string;
  devSeedUserPassword?: string;
}

export type DbTargetClassification = "LOCAL_DEV" | "ISOLATED_TEST" | "INVALID";

export interface SeedEnvironmentValidationResult {
  valid: boolean;
  mode: SeedMode | null;
  environment: string;
  isCi: boolean;
  dbTargetClass: DbTargetClassification;
  errors: string[];
}

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "::1", "postgres", "db", "aura-postgres", "aura-db"];

const PROHIBITED_TARGET_MARKERS_COMMON = [
  "prod",
  "production",
  "staging",
  "stage",
  "live",
  "main",
  "master",
  "shared",
  "primary",
];

/**
 * Checks if a string contains prohibited production/staging/shared markers.
 * Handles case-normalization, percent-decoding, and boundary checks for short abbreviations like 'stg'.
 */
function containsProhibitedTargetMarkers(raw: string, additionalForbidden: string[] = []): boolean {
  if (!raw || typeof raw !== "string") return false;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep raw if decoding fails
  }

  const normalized = decoded.toLowerCase();

  const allForbidden = [...PROHIBITED_TARGET_MARKERS_COMMON, ...additionalForbidden];

  for (const marker of allForbidden) {
    if (normalized.includes(marker)) {
      return true;
    }
  }

  // Check word-boundary for 'stg' to avoid matching 'postgres'
  if (/(?:^|[^a-z0-9])stg(?:$|[^a-z0-9])/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Classifies whether a database URL points to a safe local development database.
 * Inspects the FULL normalized target including hostname, pathname, query parameters, and userinfo.
 */
export function isLocalDevelopmentDatabaseUrl(databaseUrl?: string): boolean {
  if (!databaseUrl || typeof databaseUrl !== "string") {
    return false;
  }

  let dbName = "";
  let hostname = "";
  let protocol = "";
  let search = "";
  let username = "";
  let password = "";

  try {
    const parsed = new URL(databaseUrl);
    protocol = (parsed.protocol || "").toLowerCase();
    hostname = (parsed.hostname || "").toLowerCase();
    dbName = (parsed.pathname || "").replace(/^\//, "").toLowerCase();
    search = (parsed.search || "").toLowerCase();
    username = (parsed.username || "").toLowerCase();
    password = (parsed.password || "").toLowerCase();
  } catch {
    return false;
  }

  if (protocol !== "postgresql:" && protocol !== "postgres:") {
    return false;
  }

  if (!LOCAL_HOSTNAMES.includes(hostname)) {
    return false;
  }

  // Must be exactly aura_capital_dev or start with aura_capital_dev_
  if (dbName !== "aura_capital_dev" && !dbName.startsWith("aura_capital_dev_")) {
    return false;
  }

  // Check for prohibited markers across full URL components
  if (
    containsProhibitedTargetMarkers(dbName, ["test"]) ||
    containsProhibitedTargetMarkers(hostname, ["test"]) ||
    containsProhibitedTargetMarkers(search, ["test"]) ||
    containsProhibitedTargetMarkers(username, ["test"]) ||
    containsProhibitedTargetMarkers(password, ["test"]) ||
    containsProhibitedTargetMarkers(databaseUrl, ["test"])
  ) {
    return false;
  }

  return true;
}

/**
 * Classifies whether a database URL points to a safe isolated test database.
 * Inspects the FULL normalized target including hostname, pathname, query parameters, and userinfo.
 */
export function isIsolatedTestDatabaseUrl(databaseUrl?: string): boolean {
  if (!databaseUrl || typeof databaseUrl !== "string") {
    return false;
  }

  let dbName = "";
  let hostname = "";
  let protocol = "";
  let search = "";
  let username = "";
  let password = "";

  try {
    const parsed = new URL(databaseUrl);
    protocol = (parsed.protocol || "").toLowerCase();
    hostname = (parsed.hostname || "").toLowerCase();
    dbName = (parsed.pathname || "").replace(/^\//, "").toLowerCase();
    search = (parsed.search || "").toLowerCase();
    username = (parsed.username || "").toLowerCase();
    password = (parsed.password || "").toLowerCase();
  } catch {
    return false;
  }

  if (protocol !== "postgresql:" && protocol !== "postgres:") {
    return false;
  }

  // Reject if any component contains forbidden dev/prod/staging/shared markers
  const testForbidden = ["dev", "development"];
  if (
    containsProhibitedTargetMarkers(dbName, testForbidden) ||
    containsProhibitedTargetMarkers(hostname, testForbidden) ||
    containsProhibitedTargetMarkers(search, testForbidden) ||
    containsProhibitedTargetMarkers(username, testForbidden) ||
    containsProhibitedTargetMarkers(password, testForbidden) ||
    containsProhibitedTargetMarkers(databaseUrl, testForbidden)
  ) {
    return false;
  }

  // Must contain explicit test marker in database name or schema query parameter
  const hasTestMarker = dbName.includes("test") || search.includes("schema=test") || search.includes("schema=aura_capital_test");
  return hasTestMarker;
}

/**
 * Builds a deterministic run/worker-scoped test user email for test isolation.
 */
export function buildTestSeedUserEmail(baseName: string, runId?: string, workerId?: string): string {
  const safeRun = (runId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  const safeWorker = (workerId || "0").replace(/[^a-zA-Z0-9_-]/g, "");
  return `${baseName}+${safeRun}.${safeWorker}@aura.test`;
}

/**
 * Builds a deterministic run/worker-scoped test admin email for test isolation.
 */
export function buildTestSeedAdminEmail(runId?: string, workerId?: string): string {
  const safeRun = (runId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  const safeWorker = (workerId || "0").replace(/[^a-zA-Z0-9_-]/g, "");
  return `test.admin+${safeRun}.${safeWorker}@aura.test`;
}

/**
 * Validates whether the current environment and configuration is safe to run seeds.
 * Returns fail-closed validation result with detailed sanitized error messages.
 */
export function validateSeedEnvironment(input: SeedEnvironmentInput): SeedEnvironmentValidationResult {
  const errors: string[] = [];
  const nodeEnv = (input.nodeEnv || "").trim().toLowerCase();
  const seedMode = (input.seedMode || "").trim().toLowerCase();
  const isCi = Boolean(input.isCi);
  const databaseUrl = input.databaseUrl || "";

  // 1. Prohibit staging / production / unknown environments explicitly
  if (!nodeEnv || (nodeEnv !== "development" && nodeEnv !== "test")) {
    errors.push(`Invalid or prohibited NODE_ENV '${input.nodeEnv || "UNSPECIFIED"}'. Seeds can only run in 'development' or 'test'.`);
  }

  // 2. Validate seed mode
  if (!seedMode || !SEED_MODES.includes(seedMode as SeedMode)) {
    errors.push(`Invalid or missing seed mode '${input.seedMode || "UNSPECIFIED"}'. Valid modes: ${SEED_MODES.join(", ")}.`);
  }

  // 3. Database URL classification
  let dbTargetClass: DbTargetClassification = "INVALID";
  if (isLocalDevelopmentDatabaseUrl(databaseUrl)) {
    dbTargetClass = "LOCAL_DEV";
  } else if (isIsolatedTestDatabaseUrl(databaseUrl)) {
    dbTargetClass = "ISOLATED_TEST";
  } else {
    errors.push("DATABASE_URL is not recognized as a safe local-development or isolated test target.");
  }

  // 4. Cross-signal predicate validations
  if (seedMode === "development") {
    if (nodeEnv !== "development") {
      errors.push(`seed:dev requires NODE_ENV='development', but received '${nodeEnv}'.`);
    }
    if (isCi) {
      errors.push("seed:dev is prohibited in CI environments (CI=true).");
    }
    if (dbTargetClass !== "LOCAL_DEV") {
      errors.push("seed:dev requires a local development database target ('aura_capital_dev' or 'aura_capital_dev_*' on localhost).");
    }
    if (!input.devSeedUserPassword || input.devSeedUserPassword.trim().length < MIN_DEV_SEED_PASSWORD_LENGTH) {
      errors.push(`Missing or insufficient DEV_SEED_USER_PASSWORD environment variable for development seed (must be >= ${MIN_DEV_SEED_PASSWORD_LENGTH} chars).`);
    }
  } else if (seedMode === "test") {
    if (nodeEnv !== "test") {
      errors.push(`seed:test requires NODE_ENV='test', but received '${nodeEnv}'.`);
    }
    if (dbTargetClass !== "ISOLATED_TEST") {
      errors.push("seed:test requires an isolated test database target with a test marker (e.g. 'aura_capital_test_*').");
    }
  } else if (seedMode === "ci") {
    if (!isCi) {
      errors.push("seed:ci mode requires CI=true signal.");
    }
    if (nodeEnv !== "test") {
      errors.push(`seed:ci requires NODE_ENV='test', but received '${nodeEnv}'.`);
    }
    if (dbTargetClass !== "ISOLATED_TEST") {
      errors.push("seed:ci requires an isolated test database target with a test marker.");
    }
  }

  return {
    valid: errors.length === 0,
    mode: errors.length === 0 ? (seedMode as SeedMode) : null,
    environment: nodeEnv,
    isCi,
    dbTargetClass,
    errors,
  };
}
