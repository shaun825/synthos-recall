import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDueForDigest } from "@/lib/cursor";
import { getNextChunk, advanceCursor } from "@/lib/cursor";
import { generateDigest } from "@/lib/digest";
import { sendDigestEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all active instances
  const activeInstances = await prisma.instance.findMany({
    where: { isActive: true },
    select: { id: true, name: true, userId: true }
  });

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: [] as string[]
  };

  for (const instance of activeInstances) {
    try {
      results.processed++;

      const due = await isDueForDigest(instance.id);
      if (!due) {
        results.skipped++;
        continue;
      }

      const result = await getNextChunk(instance.id);
      if (!result || !result.chunk) {
        results.skipped++;
        continue;
      }

      const { instance: fullInstance, chunk } = result;

      const user = await prisma.user.findUnique({
        where: { id: fullInstance.userId }
      });

      if (!user?.email) {
        results.errors.push(`No email for instance ${instance.id}`);
        continue;
      }

      const digest = await generateDigest(
        fullInstance.name,
        chunk.content,
        chunk.index,
        fullInstance.totalChunks
      );

      await sendDigestEmail({
        toEmail: user.email,
        instanceName: fullInstance.name,
        chunkIndex: chunk.index,
        totalChunks: fullInstance.totalChunks,
        digest
      });

      await advanceCursor(instance.id);

      await prisma.digestLog.create({
        data: {
          userId: user.id,
          instanceId: instance.id,
          chunkIndex: chunk.index,
          emailSubject: digest.subject,
          status: "sent"
        }
      });

      results.sent++;
    } catch (error) {
      results.errors.push(`Instance ${instance.id}: ${error}`);
    }
  }

  return NextResponse.json(results);
}
