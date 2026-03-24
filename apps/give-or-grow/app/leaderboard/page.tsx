import { headers } from "next/headers";
import Link from "next/link";
import { validateUser } from "@/lib/whop-sdk";
import { db } from "@/lib/db";
import Leaderboard from "@/components/Leaderboard";

type Period = "week" | "alltime";

function computeStreak(checkIns: Array<{ date: Date }>): number {
  if (checkIns.length === 0) return 0;

  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const dates = sorted.map((c) => {
    const d = new Date(c.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const uniqueDates = [...new Set(dates)];
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-${String(expected.getDate()).padStart(2, "0")}`;

    if (uniqueDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const headersList = headers();
  const userId = headersList.get("x-whop-user-id");
  const authHeader = headersList.get("authorization");
  let resolvedUserId = userId;

  if (!resolvedUserId && authHeader) {
    const user = await validateUser(authHeader);
    resolvedUserId = user?.userId ?? null;
  }

  const tab: Period = searchParams.tab === "alltime" ? "alltime" : "week";

  // Build date filter for "this week"
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const challenges = await db.challenge.findMany({
    where: {
      status: "active",
      ...(tab === "week" ? { startDate: { gte: weekAgo } } : {}),
    },
    include: {
      checkIns: { orderBy: { date: "desc" } },
    },
    take: 50,
  });

  // Build leaderboard entries
  const entries = challenges
    .map((c) => ({
      userId: c.userId,
      username: `User ${c.userId.slice(-6)}`, // Would ideally fetch from Whop API
      streak: computeStreak(c.checkIns),
      courseName: c.courseName,
    }))
    .filter((e) => e.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const currentUserRank = entries.findIndex((e) => e.userId === resolvedUserId);

  return (
    <main className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
          ← Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-xs text-muted">Top learners by streak</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-xl p-1 mb-6 border border-white/10">
        <Link
          href="/leaderboard?tab=week"
          className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-colors ${
            tab === "week"
              ? "bg-primary-green/20 text-primary-green"
              : "text-muted hover:text-foreground"
          }`}
        >
          This Week
        </Link>
        <Link
          href="/leaderboard?tab=alltime"
          className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-colors ${
            tab === "alltime"
              ? "bg-primary-green/20 text-primary-green"
              : "text-muted hover:text-foreground"
          }`}
        >
          All Time
        </Link>
      </div>

      {/* Leaderboard */}
      <Leaderboard entries={entries} currentUserId={resolvedUserId ?? undefined} />

      {/* Current user rank if not in top 10 */}
      {resolvedUserId && currentUserRank === -1 && (
        <div className="mt-4 bg-surface rounded-xl p-4 border border-white/10 text-center">
          <p className="text-muted text-sm">
            You&apos;re not in the top 10 yet. Keep your streak going!
          </p>
        </div>
      )}

      {/* Start challenge CTA */}
      <div className="mt-6 text-center">
        <Link href="/challenge/new">
          <button className="bg-primary-green text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-primary-green/90 transition-all">
            Start a Challenge
          </button>
        </Link>
      </div>
    </main>
  );
}
