import type { Metadata } from 'next'
import LegalPageLayout from '@/components/layout/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy | Nishon AI',
  description:
    'Learn how Nishon AI collects, uses, and protects user data for advertising automation.',
}

export default function Page() {
  return (
    <LegalPageLayout>
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="text-[#9CA3AF]">
            This policy explains what data Nishon AI collects and how we use it to provide
            autonomous ad management services.
          </p>
        </header>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">What data we collect</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#D1D5DB]">
            <li>Account data such as name and email address.</li>
            <li>OAuth credentials and access tokens for connected ad platforms.</li>
            <li>Usage and performance data including campaign events and platform interactions.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">How we use data</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#D1D5DB]">
            <li>To connect and manage advertising accounts on your behalf.</li>
            <li>To run analytics and performance reporting in your dashboard.</li>
            <li>To power AI decision-making and campaign optimization workflows.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Third-party services</h2>
          <p className="text-[#D1D5DB]">
            Nishon AI integrates with Meta, Google, and TikTok APIs to deliver campaign
            automation. Data shared with these providers is governed by their own policies.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Data security</h2>
          <p className="text-[#D1D5DB]">
            We use industry-standard safeguards to protect data in transit and at rest.
            Access is limited to authorized systems and personnel required to operate the service.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-[#D1D5DB]">
            For privacy questions, contact us at{' '}
            <a className="text-[#A78BFA] hover:text-[#C4B5FD]" href="mailto:elmuntechnologies@gmail.com">
              elmuntechnologies@gmail.com
            </a>
            .
          </p>
        </section>
      </article>
    </LegalPageLayout>
  )
}
