import {
  verifyUserToken,
  makeUserTokenVerifier,
  WhopServerSdk,
  type UserTokenPayload,
} from "@whop/api";

// Initialize the Whop Server SDK
export const whopApi = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY ?? "",
  appId: process.env.WHOP_APP_ID ?? "",
});

// Create a reusable token verifier
export const validateToken = makeUserTokenVerifier({
  appId: process.env.WHOP_APP_ID ?? "",
  dontThrow: true,
});

// Validate a user token and return the payload, or null if invalid
export async function validateUser(
  tokenOrRequest: string | Headers | Request | null | undefined
): Promise<UserTokenPayload | null> {
  try {
    const payload = await validateToken(tokenOrRequest);
    return payload;
  } catch {
    return null;
  }
}

// Get user access info — returns userId from validated token
export async function getUserAccess(
  request: Request | Headers
): Promise<{ userId: string; appId: string } | null> {
  const payload = await validateUser(request);
  if (!payload) return null;
  return { userId: payload.userId, appId: payload.appId };
}
