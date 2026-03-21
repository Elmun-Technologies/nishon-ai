import type { Metadata } from 'next'
import LegalPageLayout from '@/components/layout/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions | Nishon AI',
  description: 'How to request account and data deletion from Nishon AI.',
}

export default function Page() {
  return (
    <LegalPageLayout>
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Data Deletion Instructions</h1>
          <p className="text-[#9CA3AF]">
            You can request deletion of your Nishon AI data at any time.
          </p>
        </header>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">How to request deletion</h2>
          <p className="text-[#D1D5DB]">
            Send your deletion request from your registered account email to{' '}
            <a className="text-[#A78BFA] hover:text-[#C4B5FD]" href="mailto:elmuntechnologies@gmail.com">
              elmuntechnologies@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">Processing timeline</h2>
          <p className="text-[#D1D5DB]">
            After identity verification, we process deletion requests within 3-5 business days.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
          <h2 className="text-xl font-semibold">What gets deleted</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#D1D5DB]">
            <li>Your Nishon AI account profile and authentication data.</li>
            <li>Connected OAuth tokens and integration credentials.</li>
            <li>Stored workspace, campaign, and analytics data associated with your account.</li>
          </ul>
        </section>
      </article>
    </LegalPageLayout>
  )
}
