import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { buildTodayPlan, getAtRisk, getUpcoming } from "@/lib/planning";
import { TodaySection } from "@/components/dashboard/TodaySection";
import { AtRiskSection } from "@/components/dashboard/AtRiskSection";
import { UpcomingSection } from "@/components/dashboard/UpcomingSection";
import Link from "next/link";
import { Upload, BookOpen } from "lucide-react";

export default async function DashboardPage() {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const assignments = await prisma.assignment.findMany({
    where: { userId: session.userId, reviewed: true },
    include: {
      tasks: { orderBy: { orderIndex: "asc" } },
      course: true,
      document: { select: { id: true, filename: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const todayItems = buildTodayPlan(assignments as any);
  const atRiskItems = getAtRisk(assignments as any);
  const upcomingItems = getUpcoming(assignments as any);

  const pendingReview = await prisma.assignment.count({
    where: { userId: session.userId, reviewed: false },
  });

  const hasAnyData = assignments.length > 0;

  return (
    <>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Good {getTimeOfDay()}{session.name ? `, ${session.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {todayItems.length > 0
            ? `You have ${todayItems.length} task${todayItems.length !== 1 ? "s" : ""} to focus on today.`
            : hasAnyData
            ? "You're all caught up. Nothing urgent today."
            : "Add your first course and upload a file to get started."}
        </p>
      </div>

      {/* Review nudge */}
      {pendingReview > 0 && (
        <Link
          href="/inbox"
          className="flex items-center gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Upload className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              {pendingReview} extracted assignment{pendingReview !== 1 ? "s" : ""} waiting for review
            </p>
            <p className="text-xs text-amber-700">Confirm them to add to your plan →</p>
          </div>
        </Link>
      )}

      {/* Empty state */}
      {!hasAnyData && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-sm font-medium text-zinc-900 mb-2">No assignments yet</h3>
          <p className="text-sm text-zinc-500 mb-4 max-w-xs mx-auto">
            Add a course and upload your syllabus to see your plan here.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/courses" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Add a course
            </Link>
            <Link href="/inbox" className="text-sm font-medium border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
              Upload files
            </Link>
          </div>
        </div>
      )}

      {hasAnyData && (
        <>
          <TodaySection items={todayItems} />
          <AtRiskSection items={atRiskItems} />
          <UpcomingSection items={upcomingItems} />
        </>
      )}
    </>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
