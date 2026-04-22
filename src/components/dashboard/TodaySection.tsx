"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Square, ArrowRight } from "lucide-react";
import type { TodayItem } from "@/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { useRouter } from "next/navigation";

interface TodaySectionProps {
  items: TodayItem[];
}

export function TodaySection({ items }: TodaySectionProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);

  async function toggleTask(assignmentId: string, taskId: string | null, currentStatus: string) {
    const key = taskId ?? assignmentId;
    setCompleting(key);
    try {
      if (taskId) {
        await fetch(`/api/assignments/${assignmentId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, status: currentStatus === "done" ? "not_started" : "done" }),
        });
      } else {
        await fetch(`/api/assignments/${assignmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: currentStatus === "done" ? "not_started" : "done" }),
        });
      }
      router.refresh();
    } finally {
      setCompleting(null);
    }
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Today</h2>
        <span className="text-xs text-zinc-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            description="No urgent tasks today. Check upcoming deadlines below."
          />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((item) => {
              const taskId = item.suggestedTask?.id ?? null;
              const taskStatus = item.suggestedTask?.status ?? item.assignment.status;
              const key = taskId ?? item.assignment.id;
              const isDone = taskStatus === "done";

              return (
                <li key={key} className="flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors group">
                  <button
                    onClick={() => toggleTask(item.assignment.id, taskId, taskStatus)}
                    disabled={completing === key}
                    className="mt-0.5 flex-shrink-0 text-zinc-400 hover:text-indigo-600 transition-colors"
                  >
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-zinc-800 ${isDone ? "line-through text-zinc-400" : ""}`}>
                      {item.suggestedTask?.title ?? item.assignment.title}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {item.assignment.course.name} · {item.reason}
                    </p>
                  </div>

                  <Link
                    href={`/assignments/${item.assignment.id}`}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
