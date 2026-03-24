"use client";

interface CountdownTimerProps {
  endDate: Date | string;
}

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isUrgent = daysLeft < 7;

  return (
    <div className="text-center">
      <p
        className={`text-6xl font-black ${
          isUrgent ? "text-warning-orange" : "text-foreground"
        }`}
      >
        {daysLeft}
      </p>
      <p className={`text-sm font-medium mt-1 ${isUrgent ? "text-warning-orange" : "text-muted"}`}>
        {daysLeft === 1 ? "day remaining" : "days remaining"}
      </p>
      {isUrgent && daysLeft > 0 && (
        <p className="text-xs text-warning-orange/70 mt-1 animate-pulse">
          Almost there! Don&apos;t give up!
        </p>
      )}
      {daysLeft === 0 && (
        <p className="text-xs text-primary-green mt-1 font-medium">
          Challenge complete! 🎉
        </p>
      )}
    </div>
  );
}
