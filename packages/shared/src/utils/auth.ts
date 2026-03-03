/**
 * Authentication utilities
 * JWT verification, Cognito parsing, etc.
 */

import type { JwtPayload } from "../types/index";

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );

    return {
      sub: decoded.sub,
      email: decoded.email,
      cognitoId: decoded.cognito_username || decoded.sub,
      planTier: decoded["custom:plan_tier"] || "free",
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

export function extractCognitoId(token: string): string | null {
  const payload = parseJwtPayload(token);
  return payload?.cognitoId || null;
}

export function extractUserId(token: string): string | null {
  const payload = parseJwtPayload(token);
  return payload?.sub || null;
}

export function extractPlanTier(token: string): string | null {
  const payload = parseJwtPayload(token);
  return payload?.planTier || null;
}
