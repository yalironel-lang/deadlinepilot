import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const reviewed = searchParams.get("reviewed");
  const status = searchParams.get("status");

  const assignments = await prisma.assignment.findMany({
    where: {
      userId: session.userId,
      ...(courseId ? { courseId } : {}),
      ...(reviewed !== null ? { reviewed: reviewed === "true" } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      tasks: { orderBy: { orderIndex: "asc" } },
      course: { select: { id: true, name: true } },
      document: { select: { id: true, filename: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, courseId, dueDate, description } = await req.json();
  if (!title?.trim() || !courseId || !dueDate) {
    return NextResponse.json({ error: "title, courseId, and dueDate are required" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== session.userId) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      userId: session.userId,
      courseId,
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: new Date(dueDate),
      status: "not_started",
      reviewed: true, // manually created assignments are pre-confirmed
    },
    include: { tasks: true, course: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}
