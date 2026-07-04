"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Listen for auth state change — fires when magic link is verified
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Sync user to our database
          try {
            await fetch("/api/auth/sync", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                id: session.user.id,
                email: session.user.email
              })
            });
          } catch (e) {
            console.error("User sync error:", e);
          }
          router.replace("/dashboard");
        } else if (event === "SIGNED_OUT") {
          router.replace("/login");
        }
      }
    );

    // Also handle token_hash in URL (for magic link flow)
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (token_hash && type) {
      supabase.auth.verifyOtp({
        token_hash,
        type: type as any
      }).then(({ error }) => {
        if (error) {
          console.error("OTP verify error:", error.message);
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        }
        // On success, onAuthStateChange above handles the redirect
      });
    }

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Signing you in...</p>
    </main>
  );
}
