/**
 * FEAT-073: Academy API Client Facade
 * Re-exports the canonical academy client from features/academy/api/academyApi
 */
export type { IAcademyApiClient } from "../features/academy/api/academyApi";
export {
  AcademyApiClient,
  academyApi,
} from "../features/academy/api/academyApi";
