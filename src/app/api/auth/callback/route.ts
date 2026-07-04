import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const successResponse = NextResponse.redirect(`${origin}/dashboard`);
  const errorResponse = (msg: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);

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
            successResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  let user = null;
  let authError = null;

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any
    });
    user = data?.user;
    authError = error;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    user = data?.user;
    authError = error;
  } else {
    return errorResponse("no_token");
  }

  if (authError || !user) {
    return errorResponse(authError?.message || "auth_failed");
  }

  // Upsert user — handle both new and existing users gracefully
  try {
    await prisma.user.upsert({
      where: { email: user.email! },
      update: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        plan: "FREE"
      }
    });
  } catch (dbError: any) {
    // Non-fatal — user can still access dashboard even if DB sync fails
    console.error("DB upsert error:", dbError?.message);
  }

  return successResponse;
}
