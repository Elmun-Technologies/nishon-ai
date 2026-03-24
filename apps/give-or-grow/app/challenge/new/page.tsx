"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = [
  "Udemy",
  "Coursera",
  "YouTube",
  "edX",
  "LinkedIn Learning",
  "Other",
];

const DEPOSIT_OPTIONS = [10, 25, 50, 100];

type Step = 1 | 2 | 3;

export default function NewChallengePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [courseName, setCourseName] = useState("");
  const [courseUrl, setCourseUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [deposit, setDeposit] = useState(25);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName || !platform) return;
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseName, courseUrl, platform, deposit }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Failed to create challenge. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => (step > 1 ? setStep((step - 1) as Step) : router.back())}
          className="text-muted hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">New Challenge</h1>
          <p className="text-xs text-muted">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex gap-2 mb-8">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s <= step ? "bg-primary-green" : "bg-surface"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Course Details */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              What are you learning?
            </h2>
            <p className="text-muted text-sm">Tell us about the course you want to complete.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Course Name *
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. The Complete React Developer Course"
                required
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted focus:outline-none focus:border-primary-green/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Course URL
                <span className="text-muted font-normal ml-1">(optional)</span>
              </label>
              <input
                type="url"
                value={courseUrl}
                onChange={(e) => setCourseUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted focus:outline-none focus:border-primary-green/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Platform *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      platform === p
                        ? "bg-primary-green/20 border-primary-green text-primary-green"
                        : "bg-surface border-white/10 text-muted hover:border-white/30"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!courseName || !platform}
            className="w-full py-4 bg-primary-green text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-green/90 active:scale-95 transition-all"
          >
            Next: Set Your Stake →
          </button>
        </form>
      )}

      {/* Step 2: Deposit Amount */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Set your stake
            </h2>
            <p className="text-muted text-sm">
              How much do you want to put on the line?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DEPOSIT_OPTIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setDeposit(amount)}
                className={`relative p-5 rounded-xl border text-center transition-all ${
                  deposit === amount
                    ? "bg-primary-green/20 border-primary-green"
                    : "bg-surface border-white/10 hover:border-white/30"
                }`}
              >
                {deposit === amount && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary-green rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="currentColor">
                      <path d="M1 6l3.5 3.5L11 2" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                )}
                <p className={`text-3xl font-black ${deposit === amount ? "text-primary-green" : "text-foreground"}`}>
                  ${amount}
                </p>
                <p className="text-xs text-muted mt-1">deposit</p>
              </button>
            ))}
          </div>

          {/* Outcome preview */}
          <div className="space-y-3">
            <div className="bg-primary-green/10 border border-primary-green/20 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-primary-green">If you complete:</p>
                <p className="text-foreground text-sm">
                  Get <strong>${deposit}</strong> back + completion certificate
                </p>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">💙</span>
              <div>
                <p className="text-sm font-semibold text-blue-300">If you quit:</p>
                <p className="text-foreground text-sm">
                  <strong>${deposit}</strong> goes to charity — you still did good
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary-green text-white font-bold rounded-xl hover:bg-primary-green/90 active:scale-95 transition-all"
          >
            Next: Confirm →
          </button>
        </form>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Ready to commit?
            </h2>
            <p className="text-muted text-sm">Review your challenge details.</p>
          </div>

          {/* Summary Card */}
          <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Course</p>
                <p className="font-bold text-foreground">{courseName}</p>
                <p className="text-sm text-muted">{platform}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Stake</p>
                <p className="text-2xl font-black text-primary-green">${deposit}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted">Duration</p>
                <p className="font-semibold text-foreground">30 days</p>
              </div>
              <div>
                <p className="text-muted">Daily check-ins</p>
                <p className="font-semibold text-foreground">Required</p>
              </div>
              <div>
                <p className="text-muted">Starts</p>
                <p className="font-semibold text-foreground">Today</p>
              </div>
              <div>
                <p className="text-muted">Ends</p>
                <p className="font-semibold text-foreground">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Placeholder */}
          <div className="bg-warning-orange/10 border border-warning-orange/20 rounded-xl p-4 text-sm">
            <p className="text-warning-orange font-semibold">💳 Payment Coming Soon</p>
            <p className="text-muted mt-1">
              Stripe integration is in progress. For now, challenges are created without payment.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-primary-green text-white font-bold rounded-xl disabled:opacity-50 hover:bg-primary-green/90 active:scale-95 transition-all"
          >
            {loading ? "Creating Challenge..." : "🚀 Start Challenge"}
          </button>

          <p className="text-center text-xs text-muted">
            By starting, you commit to 30 daily check-ins. Miss too many and
            your deposit will go to charity.
          </p>
        </div>
      )}
    </main>
  );
}
