"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted">{label}</span>
          <span className="text-foreground font-medium">
            {current}/{total}
          </span>
        </div>
      )}
      <div className="h-3 bg-surface rounded-full overflow-hidden border border-white/10">
        <div
          className="h-full bg-primary-green rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
