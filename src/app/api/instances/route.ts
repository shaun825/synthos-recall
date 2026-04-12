import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const instances = await prisma.instance.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      sourceType: true,
      cursorIndex: true,
      totalChunks: true,
      isActive: true,
      cadenceDays: true,
      lastSentAt: true,
      createdAt: true
    }
  });

  return NextResponse.json({ instances });
}
