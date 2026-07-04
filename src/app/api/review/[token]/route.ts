import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const log = await prisma.digestLog.findUnique({
      where: { reviewToken: params.token },
      include: { instance: true }
    });

    if (!log) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const keyPoints = log.keyPoints ? JSON.parse(log.keyPoints) : [];
    const recallQuestions = log.recallQuestions ? JSON.parse(log.recallQuestions) : [];

    return NextResponse.json({
      instanceName: log.instance.name,
      chunkIndex: log.chunkIndex,
      totalChunks: log.instance.totalChunks,
      keyPoints,
      recallQuestions,
      sentAt: log.sentAt
    });
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json({ error: "Failed to load review" }, { status: 500 });
  }
}
