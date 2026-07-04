import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Use raw query to avoid Prisma type issue until client regenerates
  const users = await prisma.$queryRaw<{ approved: boolean }[]>`
    SELECT approved FROM "User" WHERE id = ${userId} LIMIT 1
  `;

  if (!users.length || !users[0].approved) {
    return NextResponse.json({ error: "Not approved" }, { status: 403 });
  }

  return NextResponse.json({ approved: true });
}
