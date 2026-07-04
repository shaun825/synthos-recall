import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const response = NextResponse.redirect(`${origin}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  let user = null;
  let authError = null;

  if (token_hash && type) {
    // Handle token hash flow (magic link clicked from email)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any
    });
    user = data?.user;
    authError = error;
  } else if (code) {
    // Handle PKCE code exchange flow
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    user = data?.user;
    authError = error;
  } else {
    return NextResponse.redirect(`${origin}/login?error=no_token`);
  }

  if (authError || !user) {
    console.error("Auth error:", authError?.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(authError?.message || "unknown")}`);
  }

  // Upsert user in database
  try {
    await prisma.user.upsert({
      where: { email: user.email! },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
        plan: "FREE"
      }
    });
  } catch (dbError) {
    console.error("DB upsert error:", dbError);
  }

  return response;
}
