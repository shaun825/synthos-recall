import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { instanceId, isActive } = await req.json();

  if (!instanceId) {
    return NextResponse.json({ error: "instanceId required" }, { status: 400 });
  }

  const instance = await prisma.instance.update({
    where: { id: instanceId },
    data: { isActive }
  });

  return NextResponse.json({ success: true, isActive: instance.isActive });
}
