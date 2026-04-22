import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, isToday, isTomorrow } from "date-fns";
import type { RiskTier } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysUntil(date: Date): number {
  return differenceInDays(date, new Date());
}

export function formatDueDate(date: Date): string {
  const days = getDaysUntil(date);
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`;
  if (isToday(date)) return "Due today";
  if (isTomorrow(date)) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${format(date, "MMM d")}`;
}

export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getRiskTier(riskScore: number, status: string): RiskTier {
  if (status === "done") return "done";
  if (riskScore >= 0.85) return "critical";
  if (riskScore >= 0.6) return "high";
  if (riskScore >= 0.35) return "medium";
  return "low";
}

export function getRiskLabel(tier: RiskTier): string {
  switch (tier) {
    case "critical": return "Critical";
    case "high": return "High Risk";
    case "medium": return "Medium Risk";
    case "low": return "On Track";
    case "done": return "Done";
  }
}

export function buildReason(daysLeft: number, status: string, taskCount: number): string {
  if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft <= 2 && status === "not_started") return `Due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — not started`;
  if (daysLeft <= 2) return `Due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
  if (status === "not_started") return `Due in ${daysLeft} days — not started`;
  if (taskCount > 0) return `Due in ${daysLeft} days — ${taskCount} task${taskCount !== 1 ? "s" : ""} remaining`;
  return `Due in ${daysLeft} days`;
}
