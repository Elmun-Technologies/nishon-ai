'use client'

const MODULES: Array<{ title: string; items: string[] }> = [
  {
    title: 'Core platform',
    items: [
      'Authentication & Authorization (email/password, Google, SSO, 2FA, RBAC)',
      'Multi-tenant architecture (workspace/client isolation)',
      'Subscription & billing (plan/usage-based, Stripe, invoices)',
    ],
  },
  {
    title: 'Ad network integrations',
    items: [
      'Meta, Google Ads, Yandex Direct, TikTok, LinkedIn, Snapchat, X, Pinterest, DV360',
      'OAuth/token refresh, account discovery, campaign/adgroup/ad sync',
      'Insights pull, audience sync, creative metadata sync, retry/backoff, rate-limit handling',
    ],
  },
  {
    title: 'Data & analytics layer',
    items: [
      'Raw ingestion + normalized schema + semantic metrics layer',
      'ETL/ELT pipeline, deduplication, timezone/currency normalization',
      'Warehouse-ready reporting tables and materialized aggregates',
    ],
  },
  {
    title: 'Automation + AI',
    items: [
      'Rule engine (pause/scale/budget-change/alerts)',
      'Budget pacing, bid automation, smart scaling',
      'Anomaly detection, forecasting, AI recommendations, AI analyst assistant',
    ],
  },
]

const ROADMAP = [
  { phase: 'Phase 1 (MVP)', detail: 'Meta + Google + Yandex, sync + reporting + alerts + simple rules', timeline: '3–5 oy' },
  { phase: 'Phase 2', detail: 'Advanced automation, budget pacing, creative & audience analytics', timeline: '6–9 oy' },
  { phase: 'Phase 3', detail: 'Attribution + CRM + offline conversions + LTV/cohort/funnel', timeline: '9–12 oy' },
  { phase: 'Phase 4', detail: 'AI platform: recommendations, forecasting, natural-language analytics', timeline: '12+ oy' },
  { phase: 'Phase 5', detail: 'Enterprise: white-label, approvals, advanced RBAC, compliance', timeline: '12–24 oy' },
]

const CHECKLIST: Array<{ group: string; points: string[] }> = [
  { group: 'Integrations', points: ['Meta Ads', 'Google Ads', 'Yandex Direct', 'TikTok Ads', 'LinkedIn Ads', 'Snapchat Ads', 'X Ads', 'Pinterest Ads', 'DV360', 'GA4'] },
  { group: 'Sync Engine', points: ['OAuth', 'token refresh', 'scheduled sync', 'incremental sync', 'backfill', 'webhook/polling', 'retry/error monitoring'] },
  { group: 'Reporting', points: ['Unified dashboard', 'drill-down reports', 'custom report builder', 'saved reports', 'CSV/Excel/PDF export', 'scheduled reports'] },
  { group: 'Automation', points: ['rules', 'budget changes', 'bid changes', 'pause/resume', 'smart scaling', 'alerts (Slack/Telegram/email)'] },
  { group: 'Attribution', points: ['UTM builder', 'click ID support', 'server-side events', 'CRM conversion import', 'attribution models'] },
  { group: 'AI', points: ['recommendations', 'anomaly detection', 'forecasting', 'AI analyst chat'] },
]

export default function PlatformArchitecturePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <h2 className="text-2xl font-semibold text-[#111827]">Performa Multi-Network Blueprint</h2>
        <p className="text-sm text-[#6B7280] mt-2">
          Bu bo‘limda Madgicx-like, lekin Performa’ga moslashtirilgan full platform architecture frontend ichiga kiritildi:
          modullar, roadmap, checklist va execution scope.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MODULES.map((module) => (
          <div key={module.title} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <h3 className="text-base font-semibold text-[#111827]">{module.title}</h3>
            <ul className="mt-3 space-y-2 list-disc list-inside text-sm text-[#4B5563]">
              {module.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Roadmap</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#6B7280] border-b border-[#E5E7EB]">
                <th className="pb-2">Phase</th>
                <th className="pb-2">Deliverables</th>
                <th className="pb-2">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {ROADMAP.map((row) => (
                <tr key={row.phase} className="border-b border-[#F3F4F6] align-top">
                  <td className="py-2 font-medium text-[#111827]">{row.phase}</td>
                  <td className="py-2 text-[#4B5563]">{row.detail}</td>
                  <td className="py-2 text-[#4B5563]">{row.timeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-base font-semibold text-[#111827]">Execution checklist</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHECKLIST.map((block) => (
            <div key={block.group} className="rounded-lg border border-[#E5E7EB] p-4">
              <p className="font-medium text-[#111827]">{block.group}</p>
              <ul className="mt-2 space-y-1 text-sm text-[#4B5563]">
                {block.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

