import { cn } from "@/lib/utils";
import type { RiskTier } from "@/types";

interface RiskBadgeProps {
  tier: RiskTier;
  className?: string;
}

const styles: Record<RiskTier, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  done: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const labels: Record<RiskTier, string> = {
  critical: "Critical",
  high: "High Risk",
  medium: "Medium",
  low: "On Track",
  done: "Done",
};

export function RiskBadge({ tier, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[tier],
        className
      )}
    >
      {labels[tier]}
    </span>
  );
}
