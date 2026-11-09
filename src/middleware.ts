import { NextResponse, type NextRequest } from "next/server";

export const SESSION_COOKIE = "kg_owner_session";

/**
 * Fast edge guard for /owner.
 *
 * Rejects obviously missing cookies before rendering. Every page and API route
 * additionally performs a full DB-backed check via requireOwner() in the Node.js
 * server runtime, so authorisation is enforced server-side in depth.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginRoute = pathname === "/owner/login" || pathname.startsWith("/api/owner/login");
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // Unauthenticated -> login (except the login page itself and logout).
  if (!token && !isLoginRoute && pathname !== "/api/owner/logout") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/owner/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Already signed in with token cookie -> keep them out of the login screen.
  if (token && isLoginRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/owner";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/api/owner/:path*"],
};
