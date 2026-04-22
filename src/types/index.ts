import type {
  User,
  Course,
  Document,
  Assignment,
  Task,
  Resource,
} from "@/generated/prisma/client";

export type { User, Course, Document, Assignment, Task, Resource };

export type AssignmentWithTasks = Assignment & { tasks: Task[] };
export type AssignmentWithCourse = Assignment & { course: Course };
export type AssignmentFull = Assignment & { tasks: Task[]; course: Course; document: Document | null };

export type RiskTier = "critical" | "high" | "medium" | "low" | "done";

export interface TodayItem {
  assignment: AssignmentWithTasks & { course: Course };
  suggestedTask: Task | null;
  reason: string;
}

export interface AtRiskItem {
  assignment: AssignmentFull;
  reason: string;
  tier: RiskTier;
}

export interface UpcomingItem {
  assignment: AssignmentFull;
  daysLeft: number;
}

export interface ExtractedAssignment {
  title: string;
  dueDate: Date;
  description?: string;
  confidence: number;
  tasks: Array<{ title: string; estimatedMinutes?: number; orderIndex: number }>;
}
