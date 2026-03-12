import { NextResponse } from "next/server";

// Lightweight JWT check compatible with Next.js Edge runtime
// (jsonwebtoken uses Node.js crypto which is NOT available in Edge runtime)
function decodedTokenIsValid(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode the payload (base64url → JSON)
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );

    // Check expiry
    if (!payload.exp) return false;
    if (Date.now() / 1000 > payload.exp) return false;

    // Has a user id
    if (!payload.id) return false;

    return true;
  } catch {
    return false;
  }
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Static files, Next.js internals, and ALL API routes pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Allow auth pages (login, register)
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Check token cookie
  const token = req.cookies.get("token")?.value;

  if (!token || !decodedTokenIsValid(token)) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
