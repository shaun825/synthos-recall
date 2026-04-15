import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunker";
import pdf from "pdf-parse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const instanceName = formData.get("name") as string;
    const instanceType = formData.get("type") as string;
    const userId = formData.get("userId") as string;
    const cadenceDays = parseInt(formData.get("cadenceDays") as string) || 1;
    const sendTime = (formData.get("sendTime") as string) || "07:00";
    const timezone = (formData.get("timezone") as string) || "UTC";

    if (!file || !instanceName || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: file, name, userId" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB" },
        { status: 400 }
      );
    }

    // Parse PDF to plain text
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. Make sure it is not a scanned image." },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(rawText);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Could not segment PDF into readable chunks." },
        { status: 400 }
      );
    }

    // Create instance and chunks in database
    const instance = await prisma.instance.create({
      data: {
        userId,
        name: instanceName,
        type: instanceType as any || "STUDY",
        sourceType: "PDF",
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
      include: {
        chunks: true
      }
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
    return NextResponse.json(
      { error: "Failed to process PDF. Please try again." },
      { status: 500 }
    );
  }
}
