import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";

async function getOwnedAssignment(assignmentId: string, userId: string) {
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

  const owned = await getOwnedAssignment(assignmentId, session.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await prisma.task.findMany({
    where: { assignmentId },
    orderBy: { orderIndex: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;

  const owned = await getOwnedAssignment(assignmentId, session.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, estimatedMinutes } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const count = await prisma.task.count({ where: { assignmentId } });
  const task = await prisma.task.create({
    data: { assignmentId, title: title.trim(), estimatedMinutes: estimatedMinutes || null, orderIndex: count },
  });
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;

  const owned = await getOwnedAssignment(assignmentId, session.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { taskId, status, title } = await req.json();
  if (!taskId) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (title !== undefined) data.title = title.trim();

  const task = await prisma.task.update({ where: { id: taskId }, data });

  // Auto-update assignment status based on tasks
  if (status !== undefined) {
    const allTasks = await prisma.task.findMany({ where: { assignmentId } });
    const allDone = allTasks.every((t) => t.status === "done");
    const anyInProgress = allTasks.some((t) => t.status === "done");
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: allDone ? "done" : anyInProgress ? "in_progress" : "not_started",
      },
    });
  }

  return NextResponse.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;

  const owned = await getOwnedAssignment(assignmentId, session.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { taskId } = await req.json();
  if (!taskId) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

  await prisma.task.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
