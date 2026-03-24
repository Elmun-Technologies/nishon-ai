import Link from "next/link";
import { headers } from "next/headers";
import { validateUser } from "@/lib/whop-sdk";

export default async function LandingPage() {
  const headersList = headers();
  // Check if user is logged in via Whop token header
  const authHeader = headersList.get("authorization");
  const user = authHeader ? await validateUser(authHeader) : null;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo */}
        <div className="mb-8 inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-full border border-white/10">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-green" fill="currentColor">
            <path d="M12.187 1.143a.75.75 0 0 1 .687.444c.5 1.125.775 2.37.775 3.663 0 1.86-.54 3.592-1.473 5.05.13-.018.261-.028.394-.028 1.578 0 2.937 1.049 3.37 2.489.194-.066.402-.1.617-.1 1.122 0 2.033.91 2.033 2.033 0 .178-.023.35-.066.515.462.362.762.924.762 1.556C19.286 19.37 16.026 22 12 22s-7.286-2.63-7.286-5.235c0-.632.3-1.194.762-1.556a2.013 2.013 0 0 1-.066-.515c0-1.122.91-2.033 2.033-2.033.215 0 .423.034.617.1.433-1.44 1.792-2.489 3.37-2.489.133 0 .264.01.394.028C10.79 8.842 10.25 7.11 10.25 5.25c0-1.293.275-2.538.775-3.663a.75.75 0 0 1 1.162-.444Z" />
          </svg>
          <span className="text-foreground font-semibold text-sm">GiveOrGrow</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight max-w-3xl mb-6">
          Bet on yourself.{" "}
          <span className="text-primary-green">Finish your course.</span>{" "}
          Get your money back.
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted max-w-xl mb-10">
          Or your deposit goes to charity. You win either way.
        </p>

        {/* CTA */}
        <Link href="/challenge/new">
          <button className="bg-primary-green text-white font-bold text-lg px-10 py-4 rounded-xl hover:bg-primary-green/90 active:scale-95 transition-all shadow-lg shadow-primary-green/20">
            Start My Challenge →
          </button>
        </Link>

        {user && (
          <Link
            href="/dashboard"
            className="mt-4 text-muted text-sm hover:text-foreground transition-colors"
          >
            Go to Dashboard →
          </Link>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-surface/50 border-t border-white/10 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-muted text-sm font-medium uppercase tracking-wider mb-8">
            The Problem We Solve
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Without GiveOrGrow */}
            <div className="bg-surface rounded-xl p-6 border border-red-500/20 text-center">
              <p className="text-4xl font-black text-red-400 mb-2">3–15%</p>
              <p className="text-sm text-muted">average course completion rate</p>
              <p className="text-xs text-red-400/60 mt-2">Without accountability</p>
            </div>

            {/* With GiveOrGrow */}
            <div className="bg-surface rounded-xl p-6 border border-primary-green/20 text-center">
              <p className="text-4xl font-black text-primary-green mb-2">78%</p>
              <p className="text-sm text-muted">GiveOrGrow completion rate</p>
              <p className="text-xs text-primary-green/60 mt-2">With a stake on the line</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-12 max-w-2xl mx-auto w-full">
        <h2 className="text-center text-foreground font-bold text-xl mb-8">
          How It Works
        </h2>
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Pick a course",
              desc: "Choose any online course from Udemy, Coursera, YouTube, or more.",
            },
            {
              step: "2",
              title: "Put down a deposit",
              desc: "Stake $10–$100 as your commitment. It's your money to win back.",
            },
            {
              step: "3",
              title: "Check in daily for 30 days",
              desc: "Log your progress each day to maintain your streak.",
            },
            {
              step: "4",
              title: "Complete = cash back",
              desc: "Finish all 30 check-ins and get your full deposit returned.",
            },
            {
              step: "5",
              title: "Quit = charity wins",
              desc: "Miss too many check-ins and your deposit goes to a good cause.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary-green/20 text-primary-green font-bold text-sm flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/challenge/new">
            <button className="bg-primary-green text-white font-bold text-base px-8 py-3 rounded-xl hover:bg-primary-green/90 active:scale-95 transition-all">
              Start My Challenge
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
