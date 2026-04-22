import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";

async function getOwned(assignmentId: string, userId: string) {
  const a = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!a || a.userId !== userId) return null;
  return a;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      tasks: { orderBy: { orderIndex: "asc" } },
      course: true,
      document: { select: { id: true, filename: true } },
    },
  });

  if (!assignment || assignment.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(assignment);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;

  const owned = await getOwned(assignmentId, session.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, description, dueDate, status, courseId, reviewed } = await req.json();

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (dueDate !== undefined) data.dueDate = new Date(dueDate);
  if (status !== undefined) data.status = status;
  if (courseId !== undefined) data.courseId = courseId;
  if (reviewed !== undefined) data.reviewed = reviewed;

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data,
    include: { tasks: { orderBy: { orderIndex: "asc" } }, course: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;

  const owned = await getOwned(assignmentId, session.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.assignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ ok: true });
}
