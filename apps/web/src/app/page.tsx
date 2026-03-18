'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-[#7C3AED]/30">
      
      {/* ── Navigation Header ── */}
<!-- [Navigation bar with logo, login/register buttons] -->
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#2A2A3A] bg-[#0A0A0F]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Nishon <span className="text-[#7C3AED]">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => router.push('/login')}>
              Log in
            </Button>
            <Button size="sm" onClick={() => router.push('/register')}>
              Get Started →
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
<!-- [Hero section with main heading, CTA, and AI status indicator] -->
      <main className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-5 py-2 mb-8 animate-fade-in">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.4)]" />
            <span className="text-[#A78BFA] text-sm font-semibold tracking-wide uppercase">
              AI Autonomous Mode: ACTIVE
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Stop managing ads.
            <br />
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent">
              Start scaling results.
            </span>
          </h2>

          <p className="text-[#6B7280] text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-12">
            Nishon AI is your autonomous advertising agent. It manages, optimizes, 
            and scales your Meta, Google, and TikTok campaigns 24/7.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-10 py-7 text-lg shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-300" onClick={() => router.push('/onboarding')}>
              Setup Autonomous AI →
            </Button>
            <Button variant="secondary" size="lg" className="px-10 py-7 text-lg border-[#2A2A3A]" onClick={() => router.push('/login')}>
              View Demo Dashboard
            </Button>
          </div>
        </div>

        {/* ── Visual Proof Section ── */}
<!-- [Visual metric cards for ROAS, CPA, and scale improvements] -->
        <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="outlined" padding="lg" className="bg-[#13131A] group hover:border-[#7C3AED]/40 transition-all duration-500">
            <div className="p-2 mb-4">
              <span className="text-3xl">📈</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">3.2x Average ROAS</h3>
            <p className="text-[#6B7280] leading-relaxed">
              Our AI optimizes your budget distribution every 2 hours to chase 
              the highest performing segments across all platforms.
            </p>
          </Card>

          <Card variant="outlined" padding="lg" className="bg-[#13131A] group hover:border-[#7C3AED]/40 transition-all duration-500">
            <div className="p-2 mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">−40% Lower CPA</h3>
            <p className="text-[#6B7280] leading-relaxed">
              By rotating creatives and shifting budget away from poor audiences, 
              Nishon AI consistently drives down your cost per lead.
            </p>
          </Card>

          <Card variant="outlined" padding="lg" className="bg-[#13131A] group hover:border-[#7C3AED]/40 transition-all duration-500">
            <div className="p-2 mb-4">
              <span className="text-3xl">🧠</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Zero Management</h3>
            <p className="text-[#6B7280] leading-relaxed">
              No more manual bidding or daily spreadsheet checking. Our agent 
              runs autonomously, only waiting for your final approval.
            </p>
          </Card>
        </div>

        {/* ── Testimonial ── */}
<!-- [Testimonial from a CEO customer] -->
        <div className="max-w-4xl mx-auto mt-32">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#13131A] to-[#0A0A0F] border border-[#2A2A3A] overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/5 blur-[100px] rounded-full" />
            
            <p className="text-2xl md:text-3xl text-[#D1D5DB] font-medium leading-[1.3] mb-8 relative z-10 italic">
              "Nishon AI replaced our targetologist and improved ROAS by 2.8x in the first month. We now spend zero hours on campaign management."
            </p>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">JT</span>
              </div>
              <div>
                <p className="text-white text-lg font-bold">Jasur Toshmatov</p>
                <p className="text-[#6B7280]">CEO, TechShop Uzbekistan</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
<!-- [Simple footer with copyright] -->
      <footer className="py-12 border-t border-[#2A2A3A] text-center">
        <p className="text-[#4B5563] text-sm">
          © 2025 Nishon AI. All rights reserved. Built for professional advertisers.
        </p>
      </footer>
    </div>
  )
}
