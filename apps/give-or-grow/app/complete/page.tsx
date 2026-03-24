"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CompleteContent() {
  const searchParams = useSearchParams();
  const courseName = searchParams.get("course") ?? "Your Course";
  const deposit = searchParams.get("deposit") ?? "0";
  const days = searchParams.get("days") ?? "30";
  const streak = searchParams.get("streak") ?? "30";
  const confettiRef = useRef(false);

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;

    import("canvas-confetti").then((confetti) => {
      const fire = () => {
        confetti.default({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ["#22C55E", "#F97316", "#F8FAFC", "#22C55E"],
        });
      };
      fire();
      setTimeout(fire, 400);
      setTimeout(fire, 800);
    });
  }, []);

  const tweetText = encodeURIComponent(
    `I just completed "${courseName}" using @GiveOrGrow — put $${deposit} on the line and got it back! 💪 #GiveOrGrow #LearningGoals`
  );

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto py-12">
      {/* Celebration Header */}
      <div className="mb-8">
        <p className="text-7xl mb-4 animate-bounce">🎓</p>
        <h1 className="text-4xl font-black text-foreground mb-3">
          You did it!
        </h1>
        <p className="text-xl text-primary-green font-semibold">
          Challenge Complete! 🎉
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 w-full mb-8">
        <div className="bg-surface rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-black text-primary-green">{days}</p>
          <p className="text-xs text-muted mt-1">Days Done</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-black text-warning-orange">{streak}</p>
          <p className="text-xs text-muted mt-1">Best Streak</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-primary-green/30 bg-primary-green/10">
          <p className="text-2xl font-black text-primary-green">${deposit}</p>
          <p className="text-xs text-muted mt-1">Saved</p>
        </div>
      </div>

      {/* Certificate Card */}
      <div
        id="certificate"
        className="w-full bg-surface rounded-2xl p-6 border-2 border-primary-green/30 mb-8 text-left"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Certificate of Completion</p>
            <h3 className="text-lg font-bold text-foreground">{courseName}</h3>
          </div>
          <div className="text-3xl">🏅</div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-sm text-muted">This certifies the successful completion of a</p>
          <p className="text-sm font-semibold text-foreground">30-Day GiveOrGrow Challenge</p>
          <p className="text-xs text-muted mt-3">
            Completed on {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary-green" fill="currentColor">
            <path d="M12.187 1.143a.75.75 0 0 1 .687.444c.5 1.125.775 2.37.775 3.663 0 1.86-.54 3.592-1.473 5.05.13-.018.261-.028.394-.028 1.578 0 2.937 1.049 3.37 2.489.194-.066.402-.1.617-.1 1.122 0 2.033.91 2.033 2.033 0 .178-.023.35-.066.515.462.362.762.924.762 1.556C19.286 19.37 16.026 22 12 22s-7.286-2.63-7.286-5.235c0-.632.3-1.194.762-1.556a2.013 2.013 0 0 1-.066-.515c0-1.122.91-2.033 2.033-2.033.215 0 .423.034.617.1.433-1.44 1.792-2.489 3.37-2.489.133 0 .264.01.394.028C10.79 8.842 10.25 7.11 10.25 5.25c0-1.293.275-2.538.775-3.663a.75.75 0 0 1 1.162-.444Z" />
          </svg>
          <span className="text-xs text-primary-green font-semibold">GiveOrGrow Verified</span>
        </div>
      </div>

      {/* Share Button */}
      <a
        href={`https://twitter.com/intent/tweet?text=${tweetText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/30 font-semibold rounded-xl mb-3 hover:bg-[#1DA1F2]/30 transition-colors flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X (Twitter)
      </a>

      {/* New Challenge CTA */}
      <Link href="/challenge/new" className="w-full">
        <button className="w-full py-4 bg-primary-green text-white font-bold rounded-xl hover:bg-primary-green/90 active:scale-95 transition-all">
          Start New Challenge →
        </button>
      </Link>

      <Link
        href="/dashboard"
        className="mt-4 text-muted text-sm hover:text-foreground transition-colors"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    }>
      <CompleteContent />
    </Suspense>
  );
}
