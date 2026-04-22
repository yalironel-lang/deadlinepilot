import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { AtRiskItem } from "@/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatDate } from "@/lib/utils";

const tierBg: Record<string, string> = {
  critical: "border-red-200 bg-red-50",
  high: "border-orange-200 bg-orange-50",
  medium: "border-amber-200 bg-amber-50",
};

const tierText: Record<string, string> = {
  critical: "text-red-700",
  high: "text-orange-700",
  medium: "text-amber-700",
};

interface AtRiskSectionProps {
  items: AtRiskItem[];
}

export function AtRiskSection({ items }: AtRiskSectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">At Risk</h2>
        {items.length > 0 && (
          <span className="bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">Nothing at risk right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.assignment.id}
              href={`/assignments/${item.assignment.id}`}
              className={cn(
                "flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors hover:opacity-90",
                tierBg[item.tier] ?? "border-zinc-200 bg-zinc-50"
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", tierText[item.tier] ?? "text-zinc-500")} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{item.assignment.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.assignment.course.name}</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={cn("text-xs font-medium", tierText[item.tier] ?? "text-zinc-600")}>{item.reason}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{formatDate(new Date(item.assignment.dueDate))}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
