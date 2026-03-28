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
            This Privacy Policy explains how Nishon AI collects, uses, shares, stores, and
            protects information when you use our autonomous advertising platform.
          </p>
          <p className="text-sm text-[#6B7280]">Last updated: March 22, 2026</p>
        </header>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Introduction</h2>
          <p className="text-[#374151]">
            Nishon AI helps businesses manage, optimize, and scale campaigns across supported ad
            platforms. To provide these services, we process operational and user-provided data.
            This policy is written for users, partners, and platform reviewers who need clear
            visibility into our privacy practices.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Who we are</h2>
          <p className="text-[#374151]">
            Nishon AI is a software platform that provides AI-assisted and autonomous campaign
            management workflows. We act as a service provider for users who connect their
            advertising accounts and workspace data to operate campaigns through Nishon AI.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">What information we collect</h2>
          <h3 className="text-base font-semibold text-[#111827]">Account information</h3>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>Name, email address, login credentials, and authentication session data.</li>
            <li>Workspace membership and role-related access information.</li>
          </ul>

          <h3 className="text-base font-semibold text-[#111827]">Workspace and business information</h3>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>Business profile details, campaign goals, budgets, and preferred strategies.</li>
            <li>Configuration settings used to generate recommendations and automations.</li>
          </ul>

          <h3 className="text-base font-semibold text-[#111827]">OAuth and integration data</h3>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>Access tokens, refresh tokens, and account identifiers from connected platforms.</li>
            <li>Connection metadata (for example, connection status and granted scopes).</li>
          </ul>

          <h3 className="text-base font-semibold text-[#111827]">Campaign and analytics data</h3>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>Campaign performance metrics, ad account data, and optimization history.</li>
            <li>AI recommendation logs, user approvals/rejections, and execution outcomes.</li>
          </ul>

          <h3 className="text-base font-semibold text-[#111827]">Technical, device, and log data</h3>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>IP address, browser/device characteristics, timestamps, and request metadata.</li>
            <li>Operational logs used for reliability, debugging, security, and abuse prevention.</li>
          </ul>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">How we use data</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>To authenticate users and secure accounts and workspaces.</li>
            <li>To connect third-party ad accounts and synchronize campaign information.</li>
            <li>To provide campaign management, analytics, and AI-generated recommendations.</li>
            <li>To operate monitoring, fraud prevention, and platform abuse safeguards.</li>
            <li>To maintain, troubleshoot, and improve the performance of Nishon AI services.</li>
          </ul>
          <h3 className="text-base font-semibold text-[#111827]">Legal basis and legitimate purpose</h3>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>Contractual necessity: delivering the services requested by users.</li>
            <li>Legitimate interests: securing and improving the platform and user experience.</li>
            <li>Legal obligations: responding to applicable legal and regulatory requirements.</li>
            <li>Consent where required by law for certain data processing activities.</li>
          </ul>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Third-party integrations and service providers</h2>
          <h3 className="text-base font-semibold text-[#111827]">Meta</h3>
          <p className="text-[#374151]">
            When you connect Meta accounts, Nishon AI may access account and campaign data within
            the permissions you authorize.
          </p>
          <h3 className="text-base font-semibold text-[#111827]">Google</h3>
          <p className="text-[#374151]">
            For connected Google advertising services, Nishon AI processes account and campaign
            data as needed for reporting and optimization workflows.
          </p>
          <h3 className="text-base font-semibold text-[#111827]">TikTok</h3>
          <p className="text-[#374151]">
            For connected TikTok ad accounts, we process integration and performance data within
            granted scopes.
          </p>
          <h3 className="text-base font-semibold text-[#111827]">Infrastructure and analytics</h3>
          <p className="text-[#374151]">
            Nishon AI relies on infrastructure and hosting providers to run the platform. These
            providers process data under service agreements and operational controls.
          </p>
          <p className="text-[#374151]">
            Third-party platforms apply their own terms and privacy policies to data processed
            through their systems.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Data retention</h2>
          <p className="text-[#374151]">
            We retain information for as long as needed to provide services, maintain records,
            resolve disputes, enforce agreements, and comply with legal obligations. Retention
            periods may vary by data category and operational need.
          </p>

          <h2 className="text-xl font-semibold">Data security</h2>
          <p className="text-[#374151]">
            Nishon AI uses administrative, technical, and organizational safeguards intended to
            protect data from unauthorized access, loss, or misuse. No internet-based system can
            guarantee absolute security, but we continuously improve our controls.
          </p>

          <h2 className="text-xl font-semibold">International data transfers</h2>
          <p className="text-[#374151]">
            Depending on hosting and service providers, data may be processed in multiple
            jurisdictions. Where applicable, we use reasonable contractual and operational measures
            to support lawful and secure transfers.
          </p>

          <h2 className="text-xl font-semibold">User rights</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#374151]">
            <li>Request access to personal information associated with your account.</li>
            <li>Request correction or deletion where legally permissible.</li>
            <li>Request restriction or objection to certain processing where applicable.</li>
            <li>Disconnect integrated accounts and revoke platform access tokens.</li>
          </ul>

          <h2 className="text-xl font-semibold">Children&apos;s privacy</h2>
          <p className="text-[#374151]">
            Nishon AI is intended for business and professional users and is not directed to
            children. We do not knowingly collect personal data from children.
          </p>

          <h2 className="text-xl font-semibold">Changes to this policy</h2>
          <p className="text-[#374151]">
            We may update this Privacy Policy as our platform, integrations, and legal obligations
            evolve. Material updates are reflected by the "Last updated" date on this page.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-[#374151]">
            For privacy questions, access requests, or data-protection concerns, contact:
          </p>
          <p className="text-[#374151]">
            <a className="text-[#374151] hover:text-[#C4B5FD]" href="mailto:elmuntechnologies@gmail.com">
              elmuntechnologies@gmail.com
            </a>
          </p>
          <p className="text-sm text-[#6B7280]">
            Disclaimer: This policy is provided for operational and compliance purposes and may be
            updated as the Nishon AI platform evolves.
          </p>
        </section>
      </article>
    </LegalPageLayout>
  )
}
