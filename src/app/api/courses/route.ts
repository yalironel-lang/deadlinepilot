import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const courses = await prisma.course.findMany({
      where: { userId: session.userId },
      include: {
        assignments: {
          where: { status: { not: "done" } },
          orderBy: { dueDate: "asc" },
          take: 1,
          select: { dueDate: true },
        },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(courses);
  } catch (err) {
    console.error("[GET /api/courses]", err);
    return NextResponse.json({ error: "Failed to load courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { name?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Course name is required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: { userId: session.userId, name: body.name.trim() },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error("[POST /api/courses]", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
