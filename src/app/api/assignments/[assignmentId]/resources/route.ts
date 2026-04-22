import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";
import { saveFile } from "@/lib/storage";
import { resourceOwnership } from "@/lib/resources";

type Params = { params: Promise<{ assignmentId: string }> };

async function getOwnedAssignment(assignmentId: string, userId: string) {
  const a = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!a || a.userId !== userId) return null;
  return a;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getVerifiedSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId } = await params;
    const assignment = await getOwnedAssignment(assignmentId, session.userId);
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const resources = await prisma.resource.findMany({
      where: { ...resourceOwnership("assignment", assignmentId), userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
  } catch (err) {
    console.error("[GET /api/assignments/[assignmentId]/resources]", err);
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getVerifiedSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId } = await params;
    const assignment = await getOwnedAssignment(assignmentId, session.userId);
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const title = (formData.get("title") as string | null)?.trim();
      const description = (formData.get("description") as string | null)?.trim() || null;

      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

      const { storagePath, error } = await saveFile(file, session.userId);
      if (error) return NextResponse.json({ error }, { status: 400 });

      const resource = await prisma.resource.create({
        data: {
          ...resourceOwnership("assignment", assignmentId),
          userId: session.userId,
          type: "file",
          title,
          description,
          filename: file.name,
          storagePath,
          mimeType: file.type || null,
          fileSize: file.size,
        },
      });
      return NextResponse.json(resource, { status: 201 });
    }

    // JSON body — link, chat_reference, or note
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const type = body.type as string | undefined;
    const title = (body.title as string | undefined)?.trim();
    const description = (body.description as string | undefined)?.trim() || null;

    if (!type || !["link", "chat_reference", "note"].includes(type)) {
      return NextResponse.json(
        { error: "type must be one of: link, chat_reference, note" },
        { status: 400 }
      );
    }
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    if (type === "link" || type === "chat_reference") {
      const url = (body.url as string | undefined)?.trim();
      if (!url) {
        return NextResponse.json(
          { error: "URL is required for links and chat references" },
          { status: 400 }
        );
      }
      const resource = await prisma.resource.create({
        data: {
          ...resourceOwnership("assignment", assignmentId),
          userId: session.userId,
          type,
          title,
          description,
          url,
        },
      });
      return NextResponse.json(resource, { status: 201 });
    }

    // note
    const bodyText = (body.body as string | undefined)?.trim() || null;
    const resource = await prisma.resource.create({
      data: {
        ...resourceOwnership("assignment", assignmentId),
        userId: session.userId,
        type: "note",
        title,
        description,
        body: bodyText,
      },
    });
    return NextResponse.json(resource, { status: 201 });
  } catch (err) {
    console.error("[POST /api/assignments/[assignmentId]/resources]", err);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
