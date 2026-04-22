import prisma from "@/lib/prisma";
import { extractWithMock } from "./mock";
import { extractWithRules } from "./rules";
import { extractWithLLM } from "./llm";
import type { ExtractedAssignment } from "@/types";

const MODE = (process.env.EXTRACTION_MODE ?? "mock") as "mock" | "rules" | "llm";

export async function extractDocument(documentId: string): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: { extractionStatus: "processing" },
  });

  try {
    const doc = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });

    console.log(`[extraction] document "${doc.id}" courseId="${doc.courseId}" userId="${doc.userId}" mode="${MODE}"`);

    let extracted: ExtractedAssignment[];

    if (MODE === "llm") {
      extracted = await extractWithLLM(doc.storagePath, doc.filename);
    } else if (MODE === "rules") {
      extracted = await extractWithRules(doc.storagePath, doc.filename);
    } else {
      extracted = await extractWithMock(doc.filename);
    }

    console.log(`[extraction] extracted ${extracted.length} assignment(s) from document "${doc.id}"`);

    if (extracted.length === 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: { extractionStatus: "done", extractionConfidence: 0 },
      });
      return;
    }

    // Validate courseId: must exist and belong to this user
    let resolvedCourseId = doc.courseId ?? null;
    if (resolvedCourseId) {
      const course = await prisma.course.findFirst({
        where: { id: resolvedCourseId, userId: doc.userId },
        select: { id: true },
      });
      if (!course) {
        console.warn(
          `[extraction] courseId "${resolvedCourseId}" on document "${doc.id}" not found for user "${doc.userId}" — clearing it`
        );
        resolvedCourseId = null;
        // Clear the stale courseId from the document too
        await prisma.document.update({
          where: { id: documentId },
          data: { courseId: null },
        });
      }
    }

    if (!resolvedCourseId) {
      // Cannot create assignments without a valid course.
      // Mark the document done with 0 extracted items; user must assign a course first.
      console.info(
        `[extraction] document "${doc.id}" has no valid courseId — skipping assignment creation`
      );
      await prisma.document.update({
        where: { id: documentId },
        data: {
          extractionStatus: "error",
          errorMessage:
            "No course selected. Please re-upload and choose a course, or assign a course to this document first.",
        },
      });
      return;
    }

    const avgConfidence =
      extracted.reduce((s, e) => s + e.confidence, 0) / extracted.length;

    console.info(
      `[extraction] creating ${extracted.length} assignment(s) for document "${doc.id}" → course "${resolvedCourseId}"`
    );

    // Create assignments (unreviewed) linked to this document
    for (const e of extracted) {
      const payload = {
        userId: doc.userId,
        courseId: resolvedCourseId,
        documentId: doc.id,
        title: e.title,
        dueDate: e.dueDate,
      };
      console.log(`[extraction] assignment.create payload:`, payload);
      await prisma.assignment.create({
        data: {
          userId: doc.userId,
          courseId: resolvedCourseId,
          documentId: doc.id,
          title: e.title,
          description: e.description ?? null,
          dueDate: e.dueDate,
          status: "not_started",
          extractionConfidence: e.confidence,
          reviewed: false,
          tasks: {
            create: e.tasks.map((t) => ({
              title: t.title,
              estimatedMinutes: t.estimatedMinutes ?? null,
              orderIndex: t.orderIndex,
            })),
          },
        },
      });
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { extractionStatus: "done", extractionConfidence: avgConfidence },
    });
  } catch (err) {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractionStatus: "error",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
