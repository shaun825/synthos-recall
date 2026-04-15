import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextChunk, advanceCursor, isDueForDigest } from "@/lib/cursor";
import { generateDigest } from "@/lib/digest";
import { sendDigestEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// This route can be called by a cron job or manually for testing
export async function POST(req: NextRequest) {
  try {
    // Verify this is an internal call using a shared secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json({ error: "instanceId required" }, { status: 400 });
    }

    // Check if this instance is due for a digest
    const due = await isDueForDigest(instanceId);
    if (!due) {
      return NextResponse.json({ skipped: true, reason: "Not due yet" });
    }

    // Get the next chunk for this instance
    const result = await getNextChunk(instanceId);
    if (!result || !result.chunk) {
      return NextResponse.json({ skipped: true, reason: "No chunk available" });
    }

    const { instance, chunk } = result;

    // Get the user's email
    const user = await prisma.user.findUnique({
      where: { id: instance.userId }
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate the digest using Claude Haiku
    const digest = await generateDigest(
      instance.name,
      chunk.content,
      chunk.index,
      instance.totalChunks
    );

    // Send the email via SES
    await sendDigestEmail({
      toEmail: user.email,
      instanceName: instance.name,
      chunkIndex: chunk.index,
      totalChunks: instance.totalChunks,
      digest
    });

    // Advance the cursor (restarts automatically if at end and isActive)
    const cursorResult = await advanceCursor(instanceId);

    // Log the send
    await prisma.digestLog.create({
      data: {
        userId: user.id,
        instanceId: instance.id,
        chunkIndex: chunk.index,
        emailSubject: digest.subject,
        status: "sent"
      }
    });

    return NextResponse.json({
      success: true,
      instanceName: instance.name,
      chunkIndex: chunk.index,
      totalChunks: instance.totalChunks,
      restarted: cursorResult.restarted,
      emailSentTo: user.email
    });
  } catch (error) {
    console.error("Send digest error:", error);
    return NextResponse.json(
      { error: "Failed to send digest" },
      { status: 500 }
    );
  }
}

// GET endpoint for testing a specific instance manually
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instanceId = searchParams.get("instanceId");
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!instanceId) {
    return NextResponse.json({ error: "instanceId required" }, { status: 400 });
  }

  // Reuse POST logic by forwarding
  const mockReq = new Request(`${req.url}`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}`, "content-type": "application/json" },
    body: JSON.stringify({ instanceId })
  });

  return POST(mockReq as NextRequest);
}
