import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyUserToken } from "@whop/api";

// Public routes that don't require auth
const PUBLIC_ROUTES = ["/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes to handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Verify user token from Authorization header
  try {
    const payload = await verifyUserToken(request, {
      appId: process.env.WHOP_APP_ID ?? "",
      dontThrow: true,
    });

    if (!payload) {
      // Redirect to Whop login for unauthenticated users
      const loginUrl = new URL(
        `https://whop.com/oauth?client_id=${process.env.WHOP_APP_ID}&redirect_uri=${encodeURIComponent(
          process.env.NEXT_PUBLIC_APP_URL + "/api/auth/callback"
        )}`,
        request.url
      );
      return NextResponse.redirect(loginUrl);
    }

    // Attach user ID to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-whop-user-id", payload.userId);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
