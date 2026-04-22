"use client";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4 text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-zinc-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
