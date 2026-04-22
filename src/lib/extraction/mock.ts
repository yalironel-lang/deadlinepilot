import { addDays } from "date-fns";
import type { ExtractedAssignment } from "@/types";

/**
 * Mock extractor — returns deterministic fake assignments regardless of file content.
 * Used in development (EXTRACTION_MODE=mock). Instant, no file reading.
 */
export async function extractWithMock(
  filename: string
): Promise<ExtractedAssignment[]> {
  const base = filename.toLowerCase();
  const now = new Date();

  if (base.includes("syllabus") || base.includes("course")) {
    return [
      {
        title: "Midterm Exam",
        dueDate: addDays(now, 18),
        description: "Covers weeks 1–7. Closed book.",
        confidence: 0.88,
        tasks: [
          { title: "Review lecture notes weeks 1–3", orderIndex: 0, estimatedMinutes: 60 },
          { title: "Review lecture notes weeks 4–7", orderIndex: 1, estimatedMinutes: 60 },
          { title: "Complete practice problems", orderIndex: 2, estimatedMinutes: 90 },
          { title: "Review with study group", orderIndex: 3, estimatedMinutes: 60 },
        ],
      },
      {
        title: "Final Paper",
        dueDate: addDays(now, 35),
        description: "2000-word essay on a topic approved by instructor.",
        confidence: 0.75,
        tasks: [
          { title: "Choose and submit topic", orderIndex: 0, estimatedMinutes: 20 },
          { title: "Research and outline", orderIndex: 1, estimatedMinutes: 90 },
          { title: "Write first draft", orderIndex: 2, estimatedMinutes: 120 },
          { title: "Revise and submit", orderIndex: 3, estimatedMinutes: 60 },
        ],
      },
    ];
  }

  if (base.includes("assignment") || base.includes("hw") || base.includes("problem")) {
    return [
      {
        title: "Assignment — " + filename.replace(/\.[^.]+$/, "").replace(/_/g, " "),
        dueDate: addDays(now, 5),
        description: "See attached instructions.",
        confidence: 0.62,
        tasks: [
          { title: "Read problem statement", orderIndex: 0, estimatedMinutes: 15 },
          { title: "Solve questions 1–3", orderIndex: 1, estimatedMinutes: 45 },
          { title: "Solve remaining questions", orderIndex: 2, estimatedMinutes: 45 },
          { title: "Review and write up", orderIndex: 3, estimatedMinutes: 30 },
        ],
      },
    ];
  }

  // Fallback
  return [
    {
      title: "Task from " + filename.replace(/\.[^.]+$/, "").replace(/_/g, " "),
      dueDate: addDays(now, 7),
      confidence: 0.45,
      tasks: [
        { title: "Review document", orderIndex: 0, estimatedMinutes: 30 },
        { title: "Complete required work", orderIndex: 1, estimatedMinutes: 60 },
      ],
    },
  ];
}
