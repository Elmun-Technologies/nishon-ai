import { UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

/** Meta Ads Graph chaqiruvlari uchun token (MetaController bilan bir xil qoida). */
export function extractMetaAccessToken(authorization?: string, req?: Request): string {
  const dedicated = req?.headers["x-meta-access-token"];
  const fromHeader = Array.isArray(dedicated) ? dedicated[0] : dedicated;
  if (typeof fromHeader === "string" && fromHeader.trim().length > 15) {
    return fromHeader.trim();
  }

  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) return token;
  }

  const cookieHeader = req?.headers?.cookie ?? "";
  const pair = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith("meta_access_token="));

  if (pair) {
    const value = pair.split("=")[1];
    if (value) return decodeURIComponent(value);
  }

  throw new UnauthorizedException(
    "Meta access token kerak: Authorization: Bearer <token> yoki meta_access_token cookie.",
  );
}
