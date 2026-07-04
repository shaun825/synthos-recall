import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunker";
import pdf from "pdf-parse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const instanceName = formData.get("name") as string;
    const instanceType = formData.get("type") as string;
    const userId = formData.get("userId") as string;
    const cadenceDays = parseInt(formData.get("cadenceDays") as string) || 1;
    const sendTime = (formData.get("sendTime") as string) || "07:00";
    const timezone = (formData.get("timezone") as string) || "UTC";
    const sourceType = (formData.get("sourceType") as string) || "PDF";

    if (!instanceName || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let rawText = "";

    if (sourceType === "TEXT") {
      rawText = (formData.get("text") as string) || "";
      if (rawText.trim().length < 100) {
        return NextResponse.json({ error: "Text too short." }, { status: 400 });
      }
    } else {
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());

      if (sourceType === "PDF") {
        const pdfData = await pdf(buffer);
        rawText = pdfData.text;
      } else if (sourceType === "DOCX") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      }

      if (!rawText || rawText.trim().length < 100) {
        return NextResponse.json({ error: "Could not extract text from file." }, { status: 400 });
      }
    }

    const chunks = chunkText(rawText);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Could not segment content into chunks." }, { status: 400 });
    }

    const instance = await prisma.instance.create({
      data: {
        userId,
        name: instanceName,
        type: (instanceType as any) || "STUDY",
        sourceType: sourceType as any,
        rawText,
        totalChunks: chunks.length,
        cursorIndex: 0,
        isActive: true,
        cadenceDays,
        sendTime,
        timezone,
        chunks: {
          create: chunks.map((chunk) => ({
            index: chunk.index,
            content: chunk.content,
            wordCount: chunk.wordCount
          }))
        }
      },
      include: { chunks: true }
    });

    return NextResponse.json({
      success: true,
      instance: {
        id: instance.id,
        name: instance.name,
        totalChunks: instance.totalChunks,
        chunksCreated: instance.chunks.length
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process content." }, { status: 500 });
  }
}
