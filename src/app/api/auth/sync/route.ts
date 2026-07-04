import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id, email } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ error: "id and email required" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { email },
      update: { id },
      create: { id, email, plan: "FREE" }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("User sync error:", error?.message);
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }
}
