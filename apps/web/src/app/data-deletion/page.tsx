import type { Metadata } from 'next'
import LegalPageLayout from '@/components/layout/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions | Performa',
  description: 'How to request account and data deletion from Performa.',
}

export default function Page() {
  return (
    <LegalPageLayout>
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Data Deletion Instructions</h1>
          <p className="text-text-tertiary">
            This page explains how Performa users can request deletion of account and platform
            data associated with their workspace.
          </p>
          <p className="text-sm text-text-tertiary">Last updated: March 22, 2026</p>
        </header>

        <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-6">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-text-secondary">
            Performa supports user-initiated deletion requests for account and connected
            workspace data. Deletion requests are processed in a controlled workflow to protect
            account security and prevent unauthorized removals.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-6">
          <h2 className="text-xl font-semibold">How to request deletion</h2>
          <p className="text-text-secondary">
            Send a request from your registered account email address to:
          </p>
          <p className="text-text-secondary">
            <a className="text-text-secondary hover:text-[#C4B5FD]" href="mailto:elmuntechnologies@gmail.com">
              elmuntechnologies@gmail.com
            </a>
          </p>
          <p className="text-text-secondary">
            Include your account email, workspace name (if applicable), and a clear statement that
            you request deletion of your Performa data.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-6">
          <h2 className="text-xl font-semibold">Identity verification process</h2>
          <p className="text-text-secondary">
            Before processing deletion, we may verify account ownership through the registered
            email and related account metadata. Additional confirmation may be required if the
            request appears incomplete or inconsistent.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface-elevated p-6">
          <h2 className="text-xl font-semibold">What data will be deleted</h2>
          <ul className="list-disc space-y-2 pl-5 text-text-secondary">
            <li>User account profile and authentication-related records in Performa.</li>
            <li>Workspace configuration and associated campaign operation history.</li>
            <li>Connected OAuth tokens and third-party integration credentials stored by Performa.</li>
            <li>Stored analytics and AI decision/recommendation records tied to your account.</li>
          </ul>

          <h2 className="text-xl font-semibold">Data that may be retained</h2>
          <p className="text-text-secondary">
            Certain records may be retained where required by applicable law, security, fraud
            prevention, dispute resolution, or audit obligations. Retained data is minimized and
            handled under applicable controls.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-6">
          <h2 className="text-xl font-semibold">Processing timeline</h2>
          <p className="text-text-secondary">
            After identity verification, we process deletion requests within 3-5 business days.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-6">
          <h2 className="text-xl font-semibold">Third-party connected platform implications</h2>
          <p className="text-text-secondary">
            Deleting data in Performa does not automatically delete data held by third-party
            platforms (such as Meta, Google, or TikTok). You may need to separately remove
            applications, revoke tokens, or submit deletion requests directly with those providers.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface-elevated p-6">
          <h2 className="text-xl font-semibold">Confirmation process</h2>
          <p className="text-text-secondary">
            Once the request is completed, Performa sends confirmation to the request email,
            including status details (completed, partially retained for legal reasons, or requiring
            additional information).
          </p>

          <h2 className="text-xl font-semibold">Contact email</h2>
          <p className="text-text-secondary">
            <a className="text-text-secondary hover:text-[#C4B5FD]" href="mailto:elmuntechnologies@gmail.com">
              elmuntechnologies@gmail.com
            </a>
          </p>
          <p className="text-sm text-text-tertiary">
            Disclaimer: These instructions are provided for operational and compliance purposes and
            may be updated as the Performa platform evolves.
          </p>
        </section>
      </article>
    </LegalPageLayout>
  )
}
