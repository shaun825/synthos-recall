import { prisma } from "@/lib/prisma";

export async function getNextChunk(instanceId: string) {
  const instance = await prisma.instance.findUnique({
    where: { id: instanceId },
    include: {
      chunks: {
        orderBy: { index: "asc" }
      }
    }
  });

  if (!instance) throw new Error("Instance not found");
  if (!instance.isActive) return null;
  if (instance.chunks.length === 0) return null;

  const currentIndex = instance.cursorIndex;
  const chunk = instance.chunks.find((c) => c.index === currentIndex);

  return { instance, chunk: chunk || instance.chunks[0] };
}

export async function advanceCursor(instanceId: string) {
  const instance = await prisma.instance.findUnique({
    where: { id: instanceId }
  });

  if (!instance) throw new Error("Instance not found");

  const nextIndex = instance.cursorIndex + 1;
  const isComplete = nextIndex >= instance.totalChunks;

  // If complete and active, restart from 0 (loop)
  // If complete and inactive, stay at end
  const newCursorIndex = isComplete
    ? instance.isActive ? 0 : instance.totalChunks - 1
    : nextIndex;

  await prisma.instance.update({
    where: { id: instanceId },
    data: {
      cursorIndex: newCursorIndex,
      lastSentAt: new Date()
    }
  });

  return {
    wasComplete: isComplete,
    restarted: isComplete && instance.isActive,
    newCursorIndex
  };
}

export async function isDueForDigest(instanceId: string): Promise<boolean> {
  const instance = await prisma.instance.findUnique({
    where: { id: instanceId }
  });

  if (!instance || !instance.isActive) return false;
  if (!instance.lastSentAt) return true;

  const now = new Date();
  const lastSent = new Date(instance.lastSentAt);
  const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
  const hoursRequired = instance.cadenceDays * 24;

  return hoursSinceLast >= hoursRequired;
}
