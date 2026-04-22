import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";
import { saveFile } from "@/lib/storage";
import { extractDocument } from "@/lib/extraction/index";

export async function GET(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  const docs = await prisma.document.findMany({
    where: {
      userId: session.userId,
      ...(courseId ? { courseId } : {}),
    },
    orderBy: { uploadedAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const rawCourseId = formData.get("courseId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // courseId is required — assignments cannot be created without one
  if (!rawCourseId || !rawCourseId.trim()) {
    return NextResponse.json(
      { error: "Course is required for extraction" },
      { status: 400 }
    );
  }

  console.log(`[documents] incoming courseId="${rawCourseId}" userId="${session.userId}"`);

  // Validate courseId ownership before storing — prevents FK violations downstream
  const course = await prisma.course.findFirst({
    where: { id: rawCourseId.trim(), userId: session.userId },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json(
      { error: "Course not found or does not belong to your account" },
      { status: 400 }
    );
  }
  const resolvedCourseId = course.id;

  const { storagePath, error } = await saveFile(file, session.userId);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: {
      userId: session.userId,
      courseId: resolvedCourseId,
      filename: file.name,
      storagePath,
      extractionStatus: "pending",
    },
  });

  // Fire-and-forget extraction
  void extractDocument(doc.id);

  return NextResponse.json(doc, { status: 201 });
}
