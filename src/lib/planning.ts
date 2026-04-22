import { differenceInDays } from "date-fns";
import type { AssignmentWithTasks, TodayItem, AtRiskItem, UpcomingItem, RiskTier } from "@/types";
import type { Course } from "@/generated/prisma/client";
import { buildReason, getRiskTier } from "./utils";

export function computeRiskScore(
  assignment: AssignmentWithTasks
): number {
  if (assignment.status === "done") return 0;

  const daysLeft = differenceInDays(new Date(assignment.dueDate), new Date());
  // Urgency peaks at 7-day window, maxes out when overdue
  const urgency = Math.max(0, Math.min(1, (7 - daysLeft) / 7));

  const doneTasks = assignment.tasks.filter((t) => t.status === "done").length;
  const totalTasks = assignment.tasks.length;
  const incompleteness =
    totalTasks > 0
      ? 1 - doneTasks / totalTasks
      : assignment.status === "not_started"
        ? 1
        : 0.5;

  return urgency * 0.6 + incompleteness * 0.4;
}

type AssignmentWithTasksAndCourse = AssignmentWithTasks & { course: Course };

export function buildTodayPlan(
  assignments: AssignmentWithTasksAndCourse[]
): TodayItem[] {
  const eligible = assignments
    .filter((a) => a.status !== "done")
    .map((a) => ({ ...a, _risk: computeRiskScore(a) }))
    .sort((a, b) => b._risk - a._risk || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return eligible.map((a) => {
    const daysLeft = differenceInDays(new Date(a.dueDate), new Date());
    const pendingTasks = a.tasks.filter((t) => t.status !== "done");
    const suggestedTask = pendingTasks[0] ?? null;
    const reason = buildReason(daysLeft, a.status, pendingTasks.length);
    return { assignment: a, suggestedTask, reason };
  });
}

export function getAtRisk(
  assignments: AssignmentWithTasksAndCourse[]
): AtRiskItem[] {
  return assignments
    .filter((a) => a.status !== "done")
    .map((a) => {
      const risk = computeRiskScore(a);
      const daysLeft = differenceInDays(new Date(a.dueDate), new Date());
      const pendingTasks = a.tasks.filter((t) => t.status !== "done");
      const tier = getRiskTier(risk, a.status) as RiskTier;
      return {
        assignment: a as any,
        reason: buildReason(daysLeft, a.status, pendingTasks.length),
        tier,
        _risk: risk,
      };
    })
    .filter((item) => item._risk >= 0.5)
    .sort((a, b) => b._risk - a._risk)
    .map(({ _risk, ...item }) => item);
}

export function getUpcoming(
  assignments: AssignmentWithTasksAndCourse[]
): UpcomingItem[] {
  return assignments
    .filter((a) => {
      if (a.status === "done") return false;
      const risk = computeRiskScore(a);
      if (risk >= 0.5) return false; // already in at-risk
      const daysLeft = differenceInDays(new Date(a.dueDate), new Date());
      return daysLeft >= 0; // all future assignments not already at-risk
    })
    .map((a) => ({
      assignment: a as any,
      daysLeft: differenceInDays(new Date(a.dueDate), new Date()),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
