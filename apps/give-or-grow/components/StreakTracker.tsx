"use client";

interface CheckIn {
  date: string | Date;
}

interface StreakTrackerProps {
  checkIns: CheckIn[];
  startDate: Date | string;
  totalDays?: number;
}

export default function StreakTracker({
  checkIns,
  startDate,
  totalDays = 30,
}: StreakTrackerProps) {
  const start = new Date(startDate);
  const checkedInDates = new Set(
    checkIns.map((c) => {
      const d = new Date(c.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  // Calculate current streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (checkedInDates.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  // Build 30-day grid from start date
  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const isPast = d <= today;
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    return {
      date: d,
      checked: checkedInDates.has(key),
      isPast,
      isToday,
    };
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-primary-green"
          fill="currentColor"
        >
          <path d="M12.187 1.143a.75.75 0 0 1 .687.444c.5 1.125.775 2.37.775 3.663 0 1.86-.54 3.592-1.473 5.05.13-.018.261-.028.394-.028 1.578 0 2.937 1.049 3.37 2.489.194-.066.402-.1.617-.1 1.122 0 2.033.91 2.033 2.033 0 .178-.023.35-.066.515.462.362.762.924.762 1.556C19.286 19.37 16.026 22 12 22s-7.286-2.63-7.286-5.235c0-.632.3-1.194.762-1.556a2.013 2.013 0 0 1-.066-.515c0-1.122.91-2.033 2.033-2.033.215 0 .423.034.617.1.433-1.44 1.792-2.489 3.37-2.489.133 0 .264.01.394.028C10.79 8.842 10.25 7.11 10.25 5.25c0-1.293.275-2.538.775-3.663a.75.75 0 0 1 1.162-.444Z" />
        </svg>
        <span className="text-foreground font-semibold">
          {streak} day streak
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((day, i) => (
          <div
            key={i}
            title={day.date.toLocaleDateString()}
            className={`w-6 h-6 rounded-sm transition-all ${
              day.checked
                ? "bg-primary-green"
                : day.isPast
                ? "bg-surface border border-white/10"
                : "bg-surface/50 border border-white/5"
            } ${day.isToday ? "ring-2 ring-warning-orange ring-offset-1 ring-offset-background" : ""}`}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-primary-green" />
          <span>Checked in</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface border border-white/10" />
          <span>Missed</span>
        </div>
      </div>
    </div>
  );
}
