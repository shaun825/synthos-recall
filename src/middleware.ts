import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — never intercept these
  const publicRoutes = [
    "/",
    "/login",
    "/waitlist",
    "/auth/callback",
    "/api/auth/callback",
    "/api/auth/sync",
    "/api/auth/check-approval",
    "/api/cron"
  ];

  const isPublic = publicRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/") || pathname.startsWith(r + "?")
  );

  if (isPublic) return NextResponse.next();

  // Check for Supabase session cookie
  const hasSession = req.cookies.getAll().some(
    (c) => c.name.includes("supabase") && c.name.includes("auth-token")
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/review/:path*",
    "/api/upload/:path*",
    "/api/instances/:path*",
    "/api/send-digest/:path*",
    "/api/review/:path*",
    "/auth/callback"
  ]
};
