import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";
import { deleteFile } from "@/lib/storage";
import { validateResourceParent } from "@/lib/resources";

type Params = { params: Promise<{ assignmentId: string; resourceId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getVerifiedSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId, resourceId } = await params;

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (
      !resource ||
      resource.userId !== session.userId ||
      resource.assignmentId !== assignmentId
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Guard against corrupted DB records before acting on them
    const parentErr = validateResourceParent(resource.courseId, resource.assignmentId);
    if (parentErr) {
      console.error(`[DELETE assignments resource] invariant violated for resource ${resourceId}: ${parentErr}`);
      return NextResponse.json({ error: "Resource has invalid ownership state" }, { status: 500 });
    }

    await prisma.resource.delete({ where: { id: resourceId } });

    if (resource.type === "file" && resource.storagePath) {
      await deleteFile(resource.storagePath);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/assignments/[assignmentId]/resources/[resourceId]]", err);
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
  }
}
