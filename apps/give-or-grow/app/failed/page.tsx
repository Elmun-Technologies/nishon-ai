"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CHARITY_IMPACTS: Record<string, string> = {
  "10": "provides clean water for 1 person for a year",
  "25": "buys school supplies for 3 children",
  "50": "provides 5 meals for a family",
  "100": "funds education for a child for a month",
};

function FailedContent() {
  const searchParams = useSearchParams();
  const courseName = searchParams.get("course") ?? "Your Course";
  const deposit = searchParams.get("deposit") ?? "0";
  const daysAttempted = searchParams.get("days") ?? "0";
  const bestStreak = searchParams.get("streak") ?? "0";
  const charityName = "GiveDirectly";

  const charityImpact =
    CHARITY_IMPACTS[deposit] ?? `helps someone in need ($${deposit})`;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto py-12">
      {/* Empathetic Header */}
      <div className="mb-8">
        <p className="text-7xl mb-4">💙</p>
        <h1 className="text-4xl font-black text-foreground mb-3">
          That&apos;s okay.
        </h1>
        <p className="text-lg text-muted max-w-sm">
          This happens to everyone. What matters is that you tried — and your
          money went somewhere meaningful.
        </p>
      </div>

      {/* Charity message */}
      <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
        <p className="text-2xl mb-2">💙</p>
        <h2 className="text-xl font-bold text-blue-300 mb-2">
          Your ${deposit} is going to {charityName}
        </h2>
        <p className="text-muted text-sm">
          ${deposit} = {charityImpact}
        </p>
        <p className="text-xs text-muted/70 mt-3">
          You still made a positive impact in the world. That counts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full mb-8">
        <div className="bg-surface rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-black text-warning-orange">{daysAttempted}</p>
          <p className="text-xs text-muted mt-1">Days Attempted</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-black text-primary-green">{bestStreak}</p>
          <p className="text-xs text-muted mt-1">Best Streak</p>
        </div>
      </div>

      {/* Course info */}
      <div className="w-full bg-surface rounded-xl p-4 border border-white/10 mb-8 text-left">
        <p className="text-xs text-muted uppercase tracking-wider mb-1">Course Attempted</p>
        <p className="font-semibold text-foreground">{courseName}</p>
      </div>

      {/* Encouragement */}
      <div className="mb-8">
        <p className="text-warning-orange font-semibold text-lg mb-2">
          Ready to try again? 💪
        </p>
        <p className="text-muted text-sm max-w-sm">
          Many successful learners failed their first challenge. The secret is
          not giving up. Start fresh with what you learned.
        </p>
      </div>

      {/* Tips */}
      <div className="w-full bg-surface rounded-xl p-4 border border-white/10 mb-8 text-left">
        <p className="text-sm font-semibold text-foreground mb-3">
          💡 Tips for next time
        </p>
        <ul className="space-y-2 text-sm text-muted">
          <li>• Set a recurring reminder every day at the same time</li>
          <li>• Start with a shorter session (even 15 minutes counts)</li>
          <li>• Tell a friend for extra accountability</li>
          <li>• Try a lower deposit to reduce pressure</li>
        </ul>
      </div>

      {/* CTA */}
      <Link href="/challenge/new" className="w-full">
        <button className="w-full py-4 bg-primary-green text-white font-bold rounded-xl hover:bg-primary-green/90 active:scale-95 transition-all mb-3">
          Start New Challenge
        </button>
      </Link>

      <Link
        href="/dashboard"
        className="text-muted text-sm hover:text-foreground transition-colors"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    }>
      <FailedContent />
    </Suspense>
  );
}
