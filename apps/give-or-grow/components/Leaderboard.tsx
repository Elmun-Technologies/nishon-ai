"use client";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  streak: number;
  courseName: string;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-surface rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-foreground">Top Learners</h3>
      </div>
      <div className="divide-y divide-white/5">
        {entries.length === 0 && (
          <p className="text-muted text-center py-8 text-sm">
            No entries yet. Start a challenge to appear here!
          </p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-4 p-4 transition-colors ${
              entry.isCurrentUser || entry.userId === currentUserId
                ? "bg-primary-green/10 border-l-2 border-l-primary-green"
                : "hover:bg-white/5"
            }`}
          >
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {entry.rank <= 3 ? (
                <span className="text-xl">{medals[entry.rank - 1]}</span>
              ) : (
                <span className="text-muted font-bold">#{entry.rank}</span>
              )}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {entry.username}
                {(entry.isCurrentUser || entry.userId === currentUserId) && (
                  <span className="ml-2 text-xs text-primary-green font-normal">
                    (you)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted truncate">{entry.courseName}</p>
            </div>

            {/* Streak */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-primary-green"
                  fill="currentColor"
                >
                  <path d="M12.187 1.143a.75.75 0 0 1 .687.444c.5 1.125.775 2.37.775 3.663 0 1.86-.54 3.592-1.473 5.05.13-.018.261-.028.394-.028 1.578 0 2.937 1.049 3.37 2.489.194-.066.402-.1.617-.1 1.122 0 2.033.91 2.033 2.033 0 .178-.023.35-.066.515.462.362.762.924.762 1.556C19.286 19.37 16.026 22 12 22s-7.286-2.63-7.286-5.235c0-.632.3-1.194.762-1.556a2.013 2.013 0 0 1-.066-.515c0-1.122.91-2.033 2.033-2.033.215 0 .423.034.617.1.433-1.44 1.792-2.489 3.37-2.489.133 0 .264.01.394.028C10.79 8.842 10.25 7.11 10.25 5.25c0-1.293.275-2.538.775-3.663a.75.75 0 0 1 1.162-.444Z" />
                </svg>
                <span className="font-bold text-foreground">{entry.streak}</span>
              </div>
              <p className="text-xs text-muted">day streak</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
