import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      assignments: {
        include: { tasks: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });

  if (!doc || doc.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}
