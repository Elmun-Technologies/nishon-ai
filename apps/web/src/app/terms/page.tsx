import type { Metadata } from 'next'
import LegalPageLayout from '@/components/layout/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Terms of Service | Performa',
  description: 'Read the terms and conditions for using Performa services.',
}

export default function Page() {
  return (
    <LegalPageLayout>
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="text-[#9CA3AF]">
            These Terms of Service govern your access to and use of Performa.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: March 22, 2026</p>
        </header>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Acceptance of terms</h2>
          <p className="text-slate-700 dark:text-slate-300">
            By creating an account, connecting third-party ad platforms, or using Performa, you
            agree to these Terms and any related policies referenced within the platform.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Description of the platform</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Performa is an autonomous advertising platform that supports campaign operations,
            analytics, and AI-assisted decision-making for connected ad accounts.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Eligibility</h2>
          <p className="text-slate-700 dark:text-slate-300">
            You represent that you are legally authorized to enter into these Terms and to act on
            behalf of any business account you connect to Performa.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Account registration and responsibility</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
            <li>You must provide accurate and current registration information.</li>
            <li>You are responsible for account credentials and all actions under your account.</li>
            <li>You must promptly report suspected unauthorized access.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Connected third-party accounts</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Performa relies on integrations with services such as Meta, Google, and TikTok.
            Your use of those services remains subject to their own terms and policies.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Acceptable use</h2>
          <p className="text-slate-700 dark:text-slate-300">
            You agree to use Performa only for lawful advertising and campaign operations.
          </p>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Prohibited activities</h3>
          <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
            <li>Operating fraudulent, deceptive, abusive, or unlawful campaigns.</li>
            <li>Attempting to bypass platform security, limits, or access controls.</li>
            <li>Using Performa in a manner that violates third-party platform rules.</li>
            <li>Interfering with service stability, availability, or other users.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">AI-generated recommendation disclaimer</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Performa may provide recommendations or automated actions based on campaign data.
            These outputs are informational or operational aids and do not constitute guaranteed
            business, financial, or legal outcomes.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Platform availability and downtime</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We aim for reliable service but do not guarantee uninterrupted availability. Scheduled
            maintenance, third-party outages, and unforeseen incidents may affect access.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Fees and billing</h2>
          <p className="text-slate-700 dark:text-slate-300">
            If paid plans or billing are introduced, pricing and payment terms will be presented
            in-product or through separate commercial terms. Where billing is not yet active,
            access may be provided without charge and subject to change.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Intellectual property</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Performa platform software, branding, and related materials are owned by or licensed
            to Performa. These Terms do not transfer ownership rights to users.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Suspension and termination</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We may suspend or terminate access where there is suspected abuse, legal risk,
            violation of these Terms, or risk to platform integrity.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Disclaimer of warranties</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Performa is provided on an "as is" and "as available" basis to the maximum extent
            permitted by law, without warranties of merchantability, fitness for a particular
            purpose, non-infringement, or guaranteed performance outcomes.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Limitation of liability</h2>
          <p className="text-slate-700 dark:text-slate-300">
            To the maximum extent permitted by law, Performa is not liable for indirect,
            incidental, special, consequential, or punitive damages, including loss of profits,
            data, business opportunities, or goodwill.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Indemnification</h2>
          <p className="text-slate-700 dark:text-slate-300">
            You agree to indemnify and hold Performa harmless from claims, liabilities, damages,
            and costs arising from your misuse of the platform, violation of law, or breach of
            these Terms.
          </p>

          <h2 className="text-xl font-semibold">Governing law and jurisdiction</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Unless otherwise required by applicable law, these Terms are governed by applicable
            laws in a competent jurisdiction determined by Performa operational setup. A final
            governing law clause may be updated as legal structuring is finalized.
          </p>

          <h2 className="text-xl font-semibold">Changes to terms</h2>
          <p className="text-slate-700 dark:text-slate-300">
            We may update these Terms from time to time. Updated terms become effective when
            posted, and continued use of Performa constitutes acceptance of the revised terms.
          </p>

          <h2 className="text-xl font-semibold">Contact information</h2>
          <p className="text-slate-700 dark:text-slate-300">
            For legal or account-related inquiries, contact:
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            <a className="text-slate-700 dark:text-slate-300 hover:text-[#C4B5FD]" href="mailto:elmuntechnologies@gmail.com">
              elmuntechnologies@gmail.com
            </a>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Disclaimer: These Terms are provided for operational and compliance purposes and may be
            updated as the Performa platform evolves.
          </p>
        </section>
      </article>
    </LegalPageLayout>
  )
}
