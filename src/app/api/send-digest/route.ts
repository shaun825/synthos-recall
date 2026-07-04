import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextChunk, advanceCursor, isDueForDigest } from "@/lib/cursor";
import { generateDigest } from "@/lib/digest";
import { sendDigestEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json({ error: "instanceId required" }, { status: 400 });
    }

    const due = await isDueForDigest(instanceId);
    if (!due) {
      return NextResponse.json({ skipped: true, reason: "Not due yet" });
    }

    const result = await getNextChunk(instanceId);
    if (!result || !result.chunk) {
      return NextResponse.json({ skipped: true, reason: "No chunk available" });
    }

    const { instance, chunk } = result;

    const user = await prisma.user.findUnique({
      where: { id: instance.userId }
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const digest = await generateDigest(
      instance.name,
      chunk.content,
      chunk.index,
      instance.totalChunks
    );

    // Create the digest log first to get the reviewToken
    const log = await prisma.digestLog.create({
      data: {
        userId: user.id,
        instanceId: instance.id,
        chunkIndex: chunk.index,
        emailSubject: digest.subject,
        keyPoints: JSON.stringify(digest.keyPoints),
        recallQuestions: JSON.stringify(digest.recallQuestions),
        status: "sending"
      }
    });

    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${log.reviewToken}`;

    await sendDigestEmail({
      toEmail: user.email,
      instanceName: instance.name,
      chunkIndex: chunk.index,
      totalChunks: instance.totalChunks,
      digest,
      reviewUrl
    });

    await prisma.digestLog.update({
      where: { id: log.id },
      data: { status: "sent" }
    });

    const cursorResult = await advanceCursor(instanceId);

    return NextResponse.json({
      success: true,
      instanceName: instance.name,
      chunkIndex: chunk.index,
      totalChunks: instance.totalChunks,
      restarted: cursorResult.restarted,
      emailSentTo: user.email,
      reviewUrl
    });
  } catch (error) {
    console.error("Send digest error:", error);
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}
