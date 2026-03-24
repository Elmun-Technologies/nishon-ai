import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { validateUser } from "@/lib/whop-sdk";
import { db } from "@/lib/db";
import ChallengeCard from "@/components/ChallengeCard";
import StreakTracker from "@/components/StreakTracker";

export default async function DashboardPage() {
  const headersList = headers();
  const userId = headersList.get("x-whop-user-id");

  // Fall back to checking authorization header for Whop iFrame context
  const authHeader = headersList.get("authorization");
  let resolvedUserId = userId;

  if (!resolvedUserId && authHeader) {
    const user = await validateUser(authHeader);
    resolvedUserId = user?.userId ?? null;
  }

  // For development: use a demo user if no auth
  if (!resolvedUserId) {
    resolvedUserId = "demo-user";
  }

  // Fetch active challenge
  const challenge = await db.challenge.findFirst({
    where: { userId: resolvedUserId, status: "active" },
    include: { checkIns: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const completedCount = await db.challenge.count({
    where: { userId: resolvedUserId, status: "completed" },
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-green" fill="currentColor">
              <path d="M12.187 1.143a.75.75 0 0 1 .687.444c.5 1.125.775 2.37.775 3.663 0 1.86-.54 3.592-1.473 5.05.13-.018.261-.028.394-.028 1.578 0 2.937 1.049 3.37 2.489.194-.066.402-.1.617-.1 1.122 0 2.033.91 2.033 2.033 0 .178-.023.35-.066.515.462.362.762.924.762 1.556C19.286 19.37 16.026 22 12 22s-7.286-2.63-7.286-5.235c0-.632.3-1.194.762-1.556a2.013 2.013 0 0 1-.066-.515c0-1.122.91-2.033 2.033-2.033.215 0 .423.034.617.1.433-1.44 1.792-2.489 3.37-2.489.133 0 .264.01.394.028C10.79 8.842 10.25 7.11 10.25 5.25c0-1.293.275-2.538.775-3.663a.75.75 0 0 1 1.162-.444Z" />
            </svg>
            <h1 className="text-xl font-black text-foreground">GiveOrGrow</h1>
          </div>
          <p className="text-sm text-muted">Your Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/leaderboard"
            className="text-xs bg-surface text-muted px-3 py-2 rounded-lg border border-white/10 hover:text-foreground transition-colors"
          >
            Leaderboard
          </Link>
        </div>
      </div>

      {challenge ? (
        <div className="space-y-6">
          {/* Active Challenge Card */}
          <ChallengeCard challenge={challenge} />

          {/* Streak Tracker */}
          <div className="bg-surface rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-foreground mb-4">Your 30-Day Journey</h3>
            <StreakTracker
              checkIns={challenge.checkIns}
              startDate={challenge.startDate}
              totalDays={30}
            />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-black text-primary-green">
                {challenge.checkIns.length}
              </p>
              <p className="text-xs text-muted mt-1">Check-ins</p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-black text-warning-orange">
                {completedCount}
              </p>
              <p className="text-xs text-muted mt-1">Courses Completed</p>
            </div>
          </div>

          {/* Leaderboard link */}
          <Link href="/leaderboard">
            <div className="bg-surface rounded-xl p-4 border border-white/10 hover:border-primary-green/30 transition-colors flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">Community Leaderboard</p>
                <p className="text-xs text-muted">See how you rank against others</p>
              </div>
              <span className="text-muted">→</span>
            </div>
          </Link>
        </div>
      ) : (
        /* No active challenge */
        <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
          <div className="text-6xl">🎯</div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No active challenge
            </h2>
            <p className="text-muted">
              Start a new challenge to begin your learning journey.
            </p>
            {completedCount > 0 && (
              <p className="text-primary-green text-sm mt-2">
                🏆 You&apos;ve completed {completedCount} challenge{completedCount > 1 ? "s" : ""}!
              </p>
            )}
          </div>
          <Link href="/challenge/new">
            <button className="bg-primary-green text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-primary-green/90 active:scale-95 transition-all">
              Start New Challenge
            </button>
          </Link>
        </div>
      )}
    </main>
  );
}
