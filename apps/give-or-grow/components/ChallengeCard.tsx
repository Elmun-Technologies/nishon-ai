"use client";

import Link from "next/link";
import CountdownTimer from "./CountdownTimer";
import ProgressBar from "./ProgressBar";

interface Challenge {
  id: string;
  courseName: string;
  platform: string;
  deposit: number;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  checkIns: Array<{ date: Date | string }>;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

const PLATFORM_COLORS: Record<string, string> = {
  Udemy: "bg-purple-500/20 text-purple-300",
  Coursera: "bg-blue-500/20 text-blue-300",
  YouTube: "bg-red-500/20 text-red-300",
  edX: "bg-rose-500/20 text-rose-300",
  "LinkedIn Learning": "bg-sky-500/20 text-sky-300",
  Other: "bg-slate-500/20 text-slate-300",
};

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const totalDays = 30;
  const checkInCount = challenge.checkIns.length;

  const today = new Date();
  const hasCheckedInToday = challenge.checkIns.some((c) => {
    const d = new Date(c.date);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const platformColor =
    PLATFORM_COLORS[challenge.platform] || PLATFORM_COLORS["Other"];

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {challenge.courseName}
          </h2>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${platformColor}`}
          >
            {challenge.platform}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-primary-green">
            ${challenge.deposit}
          </p>
          <p className="text-xs text-muted">at stake</p>
        </div>
      </div>

      {/* Countdown */}
      <CountdownTimer endDate={challenge.endDate} />

      {/* Progress */}
      <ProgressBar
        current={checkInCount}
        total={totalDays}
        label="Check-ins"
      />

      {/* Check-in Button */}
      <Link href={`/challenge/${challenge.id}/checkin`}>
        <button
          disabled={hasCheckedInToday}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            hasCheckedInToday
              ? "bg-primary-green/20 text-primary-green cursor-default border border-primary-green/30"
              : "bg-primary-green text-white hover:bg-primary-green/90 active:scale-95"
          }`}
        >
          {hasCheckedInToday ? "✓ Checked in today!" : "Check in today ✓"}
        </button>
      </Link>
    </div>
  );
}
