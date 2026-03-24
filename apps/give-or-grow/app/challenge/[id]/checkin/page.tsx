"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Small progress is still progress.",
  "You don't have to be great to start, but you have to start to be great.",
  "Every expert was once a beginner.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going.",
  "The only way to do great work is to love what you do.",
  "Learning never exhausts the mind.",
  "It always seems impossible until it's done.",
  "Believe you can and you're halfway there.",
  "The more that you read, the more things you will know.",
  "Education is the passport to the future.",
  "The capacity to learn is a gift; the ability to learn is a skill.",
  "Develop a passion for learning. If you do, you will never cease to grow.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "An investment in knowledge pays the best interest.",
  "Education is not the filling of a pail, but the lighting of a fire.",
  "The mind is not a vessel to be filled, but a fire to be kindled.",
  "Real learning comes about when the competitive spirit has ceased.",
  "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
  "In learning you will teach, and in teaching you will learn.",
  "Knowledge is power. Information is liberating.",
  "The more I learn, the more I realize how much I don't know.",
  "Education is the key to unlocking the world.",
  "You are braver than you believe, stronger than you seem, smarter than you think.",
  "The only limit to our realization of tomorrow is our doubts of today.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
];

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params?.id as string;

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Rotate quote by day of year
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    setQuote(QUOTES[dayOfYear % QUOTES.length]);
  }, []);

  const handleCheckIn = async () => {
    if (checked || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      if (res.ok) {
        setChecked(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to check in. Please try again.");
        setLoading(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
      {/* Quote */}
      <div className="mb-12 max-w-xs">
        <p className="text-4xl mb-4">💡</p>
        <blockquote className="text-lg text-muted italic leading-relaxed">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </div>

      {/* Check-in button */}
      <div className="mb-8">
        <button
          onClick={handleCheckIn}
          disabled={checked || loading}
          className={`relative w-40 h-40 rounded-full border-4 transition-all duration-500 flex items-center justify-center ${
            checked
              ? "bg-primary-green border-primary-green scale-110"
              : loading
              ? "bg-primary-green/20 border-primary-green/50 animate-pulse"
              : "bg-surface border-primary-green/50 hover:border-primary-green hover:scale-105 active:scale-95"
          }`}
        >
          {checked ? (
            <svg
              viewBox="0 0 24 24"
              className="w-20 h-20 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : loading ? (
            <div className="w-12 h-12 border-2 border-primary-green border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-1">☑️</div>
              <p className="text-xs text-muted font-medium">Tap to check in</p>
            </div>
          )}
        </button>
      </div>

      {checked ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-2xl font-bold text-primary-green mb-2">
            ✓ Checked in!
          </p>
          <p className="text-muted text-sm">Great work. Redirecting...</p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Daily Check-in
          </h1>
          <p className="text-muted text-sm">
            Log today&apos;s progress to keep your streak alive.
          </p>
        </div>
      )}

      {/* Back link */}
      {!checked && (
        <button
          onClick={() => router.back()}
          className="mt-8 text-muted text-sm hover:text-foreground transition-colors"
        >
          ← Back to Dashboard
        </button>
      )}
    </main>
  );
}
