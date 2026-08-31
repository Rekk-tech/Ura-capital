import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { AccessTokenService } from "../../src/modules/auth/access-token.service.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("AccessTokenService (Unit)", () => {
  const testSecret = "test-secret-at-least-32-characters-length-for-jwt-signing";
  const testIssuer = "aura-capital-test";
  const testAudience = "aura-client-test";
  const testTtlMinutes = 15;

  const mockAuthConfig = {
    accessTokenSecret: testSecret,
    refreshTokenSecret: "test-refresh-secret-at-least-32-characters-length",
    accessTokenTtlMinutes: testTtlMinutes,
    accessTokenIssuer: testIssuer,
    accessTokenAudience: testAudience,
    refreshTokenTtlDays: 7,
    refreshCookie: {
      name: "aura_refresh_token",
      secure: false,
      sameSite: "lax" as const,
      httpOnly: true as const,
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 100,
    },
  };

  const service = new AccessTokenService(mockAuthConfig);
  const sampleUserId = "11111111-2222-3333-4444-555555555555";

  it("issues access token with HS256 algorithm and exact approved claims", () => {
    const { accessToken, expiresIn } = service.issueAccessToken(sampleUserId);

    expect(accessToken).toBeDefined();
    expect(expiresIn).toBe(15 * 60);

    // Decode without verification to inspect header & payload
    const decodedHeader = jwt.decode(accessToken, { complete: true })?.header;
    expect(decodedHeader?.alg).toBe("HS256");
    expect(decodedHeader?.typ).toBe("JWT");

    const decodedPayload = jwt.decode(accessToken) as Record<string, unknown>;
    expect(decodedPayload.sub).toBe(sampleUserId);
    expect(decodedPayload.iss).toBe(testIssuer);
    expect(decodedPayload.aud).toBe(testAudience);
    expect(decodedPayload.typ).toBe("access");
    expect(typeof decodedPayload.iat).toBe("number");
    expect(typeof decodedPayload.exp).toBe("number");
    expect(decodedPayload.exp).toBe((decodedPayload.iat as number) + 15 * 60);

    // Ensure strictly no forbidden or unnecessary claims exist
    const payloadKeys = Object.keys(decodedPayload);
    expect(payloadKeys.sort()).toEqual(["aud", "exp", "iat", "iss", "sub", "typ"].sort());
    expect(payloadKeys).not.toContain("password");
    expect(payloadKeys).not.toContain("passwordHash");
    expect(payloadKeys).not.toContain("credentialId");
    expect(payloadKeys).not.toContain("jti");
    expect(payloadKeys).not.toContain("roles");
    expect(payloadKeys).not.toContain("admin");
    expect(payloadKeys).not.toContain("role");
  });

  it("verifies a valid access token successfully and returns verified claims", () => {
    const { accessToken } = service.issueAccessToken(sampleUserId);
    const claims = service.verifyAccessToken(accessToken);

    expect(claims.sub).toBe(sampleUserId);
    expect(claims.iss).toBe(testIssuer);
    expect(claims.aud).toBe(testAudience);
    expect(claims.typ).toBe("access");
  });

  it("rejects forged access token with modified payload or wrong signing secret", () => {
    const { accessToken } = service.issueAccessToken(sampleUserId);
    const forgedToken = accessToken.slice(0, -5) + "abcde";

    expect(() => service.verifyAccessToken(forgedToken)).toThrowError(AppError);
    try {
      service.verifyAccessToken(forgedToken);
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Invalid or malformed access token");
    }
  });

  it("rejects expired access tokens safely with appropriate error", () => {
    // Generate a token that expired 10 seconds ago
    const now = Math.floor(Date.now() / 1000);
    const expiredPayload = {
      sub: sampleUserId,
      iat: now - 3600,
      exp: now - 10,
      iss: testIssuer,
      aud: testAudience,
      typ: "access",
    };

    const expiredToken = jwt.sign(expiredPayload, testSecret, { algorithm: "HS256" });

    expect(() => service.verifyAccessToken(expiredToken)).toThrowError(AppError);
    try {
      service.verifyAccessToken(expiredToken);
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(appErr.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      expect(appErr.message).toBe("Access token has expired");
    }
  });

  it("rejects token signed with 'none' algorithm or unexpected algorithm", () => {
    const payload = {
      sub: sampleUserId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      iss: testIssuer,
      aud: testAudience,
      typ: "access",
    };

    // 'none' algorithm token
    const noneHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const nonePayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const noneToken = `${noneHeader}.${nonePayload}.`;

    expect(() => service.verifyAccessToken(noneToken)).toThrowError(AppError);

    // Wrong algorithm (e.g. HS512)
    const hs512Token = jwt.sign(payload, testSecret, { algorithm: "HS512" });
    expect(() => service.verifyAccessToken(hs512Token)).toThrowError(AppError);
  });

  it("rejects token with wrong issuer or wrong audience", () => {
    const now = Math.floor(Date.now() / 1000);

    // Wrong issuer
    const wrongIssuerToken = jwt.sign(
      {
        sub: sampleUserId,
        iat: now,
        exp: now + 900,
        iss: "untrusted-issuer",
        aud: testAudience,
        typ: "access",
      },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(wrongIssuerToken)).toThrowError(AppError);

    // Wrong audience
    const wrongAudienceToken = jwt.sign(
      {
        sub: sampleUserId,
        iat: now,
        exp: now + 900,
        iss: testIssuer,
        aud: "untrusted-audience",
        typ: "access",
      },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(wrongAudienceToken)).toThrowError(AppError);
  });

  it("rejects malformed token strings", () => {
    expect(() => service.verifyAccessToken("not.a.valid.jwt.token")).toThrowError(AppError);
    expect(() => service.verifyAccessToken("random-string-without-dots")).toThrowError(AppError);
  });

  it("strictly rejects correctly signed tokens containing extra claims (DEF-001)", () => {
    const now = Math.floor(Date.now() / 1000);
    const validBasePayload = {
      sub: sampleUserId,
      iat: now,
      exp: now + 900,
      iss: testIssuer,
      aud: testAudience,
      typ: "access",
    };

    // Extra claim: role: 'ADMIN'
    const tokenWithRole = jwt.sign(
      { ...validBasePayload, role: "ADMIN" },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(tokenWithRole)).toThrowError(AppError);

    // Extra claim: admin: true
    const tokenWithAdmin = jwt.sign(
      { ...validBasePayload, admin: true },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(tokenWithAdmin)).toThrowError(AppError);

    // Extra claim: jti: 'jwt-id'
    const tokenWithJti = jwt.sign(
      { ...validBasePayload, jti: "unique-jwt-token-id" },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(tokenWithJti)).toThrowError(AppError);

    // Extra claim: passwordHash
    const tokenWithHash = jwt.sign(
      { ...validBasePayload, passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$..." },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(tokenWithHash)).toThrowError(AppError);

    // Extra claim: email
    const tokenWithEmail = jwt.sign(
      { ...validBasePayload, email: "user@example.com" },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(tokenWithEmail)).toThrowError(AppError);

    // Extra claim: credentialId
    const tokenWithCredId = jwt.sign(
      { ...validBasePayload, credentialId: "cred-uuid-1234" },
      testSecret,
      { algorithm: "HS256" },
    );
    expect(() => service.verifyAccessToken(tokenWithCredId)).toThrowError(AppError);
  });
});
