import Link from "next/link";
import { Calendar } from "lucide-react";
import type { UpcomingItem } from "@/types";
import { formatDate } from "@/lib/utils";

interface UpcomingSectionProps {
  items: UpcomingItem[];
}

export function UpcomingSection({ items }: UpcomingSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-3">Upcoming</h2>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => (
            <li key={item.assignment.id}>
              <Link
                href={`/assignments/${item.assignment.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-800 truncate">{item.assignment.title}</p>
                    <p className="text-xs text-zinc-400">{item.assignment.course.name}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4 text-right">
                  <p className="text-xs font-medium text-zinc-600">{formatDate(new Date(item.assignment.dueDate))}</p>
                  <p className="text-xs text-zinc-400">
                    {item.daysLeft === 0 ? "today" : `in ${item.daysLeft} day${item.daysLeft !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
