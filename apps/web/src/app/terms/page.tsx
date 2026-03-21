import type { Metadata } from 'next'
import LegalPageLayout from '@/components/layout/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Terms of Service | Nishon AI',
  description: 'Read the terms and conditions for using Nishon AI services.',
}

export default function Page() {
  return (
    <LegalPageLayout>
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="text-[#9CA3AF]">
            By using Nishon AI, you agree to these terms and to use the platform responsibly.
          </p>
        </header>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Service usage rules</h2>
          <p className="text-[#D1D5DB]">
            You agree to provide accurate account information and use the platform only for
            legitimate advertising operations.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">No abuse or illegal usage</h2>
          <p className="text-[#D1D5DB]">
            You must not use Nishon AI to run fraudulent, harmful, abusive, or illegal campaigns,
            or to violate third-party platform policies.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Service provided "as is"</h2>
          <p className="text-[#D1D5DB]">
            Nishon AI is provided on an "as is" and "as available" basis without warranties of
            uninterrupted operation or specific business outcomes.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Limitation of liability</h2>
          <p className="text-[#D1D5DB]">
            To the maximum extent permitted by law, Nishon AI is not liable for indirect,
            incidental, or consequential losses related to use of the platform.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Account responsibility</h2>
          <p className="text-[#D1D5DB]">
            You are responsible for your account credentials, connected integrations, and all
            actions performed through your account.
          </p>
        </section>
      </article>
    </LegalPageLayout>
  )
}
