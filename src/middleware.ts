import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public routes
  const publicRoutes = ["/", "/login", "/auth/callback"];
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith("/auth/"));
  if (isPublic) return NextResponse.next();

  // Allow cron — verified by CRON_SECRET header, not session
  if (pathname.startsWith("/api/cron")) return NextResponse.next();

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // No session — redirect to login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check approval status via API
  const approvalRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/check-approval?userId=${session.user.id}`,
    { headers: { "x-internal-secret": process.env.CRON_SECRET! } }
  );

  if (!approvalRes.ok) {
    const waitlistUrl = new URL("/waitlist", req.url);
    return NextResponse.redirect(waitlistUrl);
  }

  return res;
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
