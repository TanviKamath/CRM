import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/services/authService";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;

  const protectedRoutes = ["/home", "/dashboard", "/brokers", "/clients", "/diamonds", "/sales"];

  if (protectedRoutes.some(path => req.nextUrl.pathname.startsWith(path))) {
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}
