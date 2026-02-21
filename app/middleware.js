import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/services/authService";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Static files, Next.js internals, auth APIs, and ALL API routes
  // API routes manage their own auth — middleware should not intercept them
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

  const token = req.cookies.get("token")?.value;

  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
