import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public routes
  const publicPrefixes = ["/", "/login", "/auth", "/waitlist", "/api/cron"];
  const isPublic = publicPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"));
  if (isPublic) return NextResponse.next();

  // Check for Supabase session cookie
  const hasSession = req.cookies.getAll().some((c) => c.name.includes("supabase") && c.name.includes("auth-token"));

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
    "/api/auth/sync"
  ]
};
