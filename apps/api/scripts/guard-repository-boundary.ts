import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertRepositoryBoundary } from "../tests/helpers/repository-boundary-guard.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(currentDir, "../src");

try {
  const result = assertRepositoryBoundary(srcDir);
  console.log(`[REPOSITORY_BOUNDARY_GUARD] PASS`);
  console.log(`[REPOSITORY_BOUNDARY_GUARD] controllers=${result.controllersScanned}, services=${result.servicesScanned}, repositories=${result.repositoriesScanned}`);
  process.exit(0);
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
}
