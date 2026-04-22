import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";
import { deleteFile } from "@/lib/storage";
import { validateResourceParent } from "@/lib/resources";

type Params = { params: Promise<{ courseId: string; resourceId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getVerifiedSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, resourceId } = await params;

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource || resource.userId !== session.userId || resource.courseId !== courseId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Guard against corrupted DB records before acting on them
    const parentErr = validateResourceParent(resource.courseId, resource.assignmentId);
    if (parentErr) {
      console.error(`[DELETE courses resource] invariant violated for resource ${resourceId}: ${parentErr}`);
      return NextResponse.json({ error: "Resource has invalid ownership state" }, { status: 500 });
    }

    await prisma.resource.delete({ where: { id: resourceId } });

    // Clean up stored file if applicable
    if (resource.type === "file" && resource.storagePath) {
      await deleteFile(resource.storagePath);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/courses/[courseId]/resources/[resourceId]]", err);
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
  }
}
