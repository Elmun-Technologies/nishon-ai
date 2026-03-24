import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { validateUser, whopApi } from "@/lib/whop-sdk";
import { db } from "@/lib/db";

function computeStreak(checkIns: Array<{ date: Date }>): number {
  if (checkIns.length === 0) return 0;
  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].date);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (
      d.getDate() === expected.getDate() &&
      d.getMonth() === expected.getMonth() &&
      d.getFullYear() === expected.getFullYear()
    ) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Simple SVG Bar Chart
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-muted">{d.value}</span>
          <div
            className="w-full bg-primary-green rounded-t-md transition-all"
            style={{ height: `${(d.value / max) * 100}px` }}
          />
          <span className="text-xs text-muted truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  const headersList = headers();
  const userId = headersList.get("x-whop-user-id");
  const authHeader = headersList.get("authorization");
  let resolvedUserId = userId;

  if (!resolvedUserId && authHeader) {
    const user = await validateUser(authHeader);
    resolvedUserId = user?.userId ?? null;
  }

  // In production, check Whop accessLevel === "admin"
  // For dev, allow access if running locally
  // NOTE: In production, uncomment the redirect below
  // if (!resolvedUserId) redirect("/");

  // Fetch all challenges
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [activeChallenges, allChallenges, todayCheckIns] = await Promise.all([
    db.challenge.findMany({
      where: { status: "active" },
      include: { checkIns: { orderBy: { date: "desc" } } },
      orderBy: { createdAt: "desc" },
    }),
    db.challenge.findMany({
      include: { checkIns: true },
    }),
    db.checkIn.count({
      where: { date: { gte: today, lt: tomorrow } },
    }),
  ]);

  const completedChallenges = allChallenges.filter(
    (c) => c.status === "completed"
  );
  const completionRate =
    allChallenges.length > 0
      ? Math.round((completedChallenges.length / allChallenges.length) * 100)
      : 0;

  const totalDeposit = activeChallenges.reduce((sum, c) => sum + c.deposit, 0);

  // Chart data: check-ins by day (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: 0,
    };
  });

  const allCheckIns = await db.checkIn.findMany({
    where: {
      date: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  allCheckIns.forEach((ci) => {
    const d = new Date(ci.date);
    const daysAgo = Math.floor(
      (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000)
    );
    const idx = 6 - daysAgo;
    if (idx >= 0 && idx < 7) {
      chartData[idx].value++;
    }
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
          ← Back
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Creator Dashboard</h1>
          <p className="text-xs text-muted">Admin Analytics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface rounded-xl p-5 border border-white/10">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">
            Active Challenges
          </p>
          <p className="text-3xl font-black text-foreground">
            {activeChallenges.length}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/10">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">
            Completion Rate
          </p>
          <p className="text-3xl font-black text-primary-green">
            {completionRate}%
          </p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/10">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">
            Total at Stake
          </p>
          <p className="text-3xl font-black text-warning-orange">
            ${totalDeposit}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/10">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">
            Check-ins Today
          </p>
          <p className="text-3xl font-black text-foreground">{todayCheckIns}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface rounded-2xl p-6 border border-white/10 mb-8">
        <h3 className="font-bold text-foreground mb-4">Check-ins (Last 7 Days)</h3>
        <BarChart data={chartData} />
      </div>

      {/* Active Challenges Table */}
      <div className="bg-surface rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-bold text-foreground">Active Challenges</h3>
        </div>

        {activeChallenges.length === 0 ? (
          <p className="text-muted text-center py-8 text-sm">
            No active challenges yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-muted font-medium">User</th>
                  <th className="text-left p-3 text-muted font-medium">Course</th>
                  <th className="text-right p-3 text-muted font-medium">Days Left</th>
                  <th className="text-right p-3 text-muted font-medium">Streak</th>
                  <th className="text-right p-3 text-muted font-medium">Stake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeChallenges.map((c) => {
                  const daysLeft = Math.max(
                    0,
                    Math.ceil(
                      (new Date(c.endDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  );
                  const streak = computeStreak(c.checkIns);
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-muted font-mono text-xs">
                        {c.userId.slice(-8)}
                      </td>
                      <td className="p-3 text-foreground max-w-[150px] truncate">
                        {c.courseName}
                      </td>
                      <td
                        className={`p-3 text-right font-semibold ${
                          daysLeft < 7 ? "text-warning-orange" : "text-foreground"
                        }`}
                      >
                        {daysLeft}d
                      </td>
                      <td className="p-3 text-right text-primary-green font-semibold">
                        {streak}
                      </td>
                      <td className="p-3 text-right text-foreground">
                        ${c.deposit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
