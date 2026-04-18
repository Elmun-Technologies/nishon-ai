"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface AssetRow {
  id: string;
  name: string;
  budget: number;
  amountSpent: number;
  roas: number;
  cpc: number;
  activeOptimization: string;
}

const SAMPLE_ROWS: AssetRow[] = [
  {
    id: "a1",
    name: "Prospecting | Acquisition | US",
    budget: 250,
    amountSpent: 1753,
    roas: 0.79,
    cpc: 6.32,
    activeOptimization: "AI Bidding",
  },
  {
    id: "a2",
    name: "Retention BOF | 18-65+ M/F",
    budget: 100,
    amountSpent: 701,
    roas: 2.58,
    cpc: 13.38,
    activeOptimization: "Age Optimize",
  },
  {
    id: "a3",
    name: "Scaling | Interest Stack",
    budget: 200,
    amountSpent: 1437,
    roas: 0.6,
    cpc: 9.6,
    activeOptimization: "Gender Optimize",
  },
  {
    id: "a4",
    name: "Retargeting | Video Viewers",
    budget: 350,
    amountSpent: 2454,
    roas: 0.87,
    cpc: 6.75,
    activeOptimization: "Creative Cluster",
  },
];

const INSIGHT_TABS = [
  "Meta Dashboard",
  "Targeting Insights",
  "Auction Analytics",
  "Geo & Demo Insights",
  "Creative Insights",
  "Ad Copy Insights",
] as const;

type OneClickMetric = {
  name: string;
  description: string;
  formula?: string;
};

type OneClickMetricGroup = {
  title: string;
  metrics: OneClickMetric[];
};

const ONE_CLICK_METRIC_GROUPS: OneClickMetricGroup[] = [
  {
    title: "Revenue Metrics",
    metrics: [
      {
        name: "ROAS",
        description: "Revenue generated per $1 of ad spend.",
        formula: "Revenue / Amount Spent",
      },
      {
        name: "NC-ROAS",
        description: "Return on ad spend from first-time customers only.",
        formula: "New Customer Revenue / Total Ad Spend",
      },
      {
        name: "MER / NMER",
        description:
          "Marketing efficiency at total-business and new-customer levels.",
        formula: "Total Sales Revenue / Total Marketing Spend",
      },
      {
        name: "Net Profit",
        description: "How much profit remains after all expenses.",
        formula: "Total Revenue - All Expenses",
      },
    ],
  },
  {
    title: "Customer Metrics",
    metrics: [
      {
        name: "CAC",
        description: "Full-funnel cost to acquire each customer.",
        formula: "(Ad + Marketing Costs) / Customers Acquired",
      },
      {
        name: "NC-CAC",
        description: "Cost to acquire each new customer.",
        formula: "(Acquisition Spend + Costs) / New Customers",
      },
      {
        name: "LTV",
        description: "Expected customer value over the full relationship.",
        formula: "AOV × Purchase Frequency × Customer Lifespan",
      },
      {
        name: "LTV/CAC",
        description:
          "Profitability ratio of customer value to acquisition cost.",
        formula: "Lifetime Value / Customer Acquisition Cost",
      },
    ],
  },
  {
    title: "Funnel & Cost Metrics",
    metrics: [
      {
        name: "Impressions",
        description: "Number of ad deliveries across channels.",
      },
      {
        name: "CTR",
        description: "Rate of clicks from impressions.",
        formula: "(Clicks / Impressions) × 100",
      },
      {
        name: "Page Views",
        description: "How often landing pages are loaded.",
      },
      {
        name: "Conversion Rate",
        description: "Share of visitors completing your target action.",
        formula: "Conversions / Visits",
      },
      {
        name: "CPC",
        description: "Average cost per click.",
        formula: "Total Click Cost / Number of Clicks",
      },
      {
        name: "CPM",
        description: "Cost per 1,000 impressions.",
        formula: "(Campaign Cost / Impressions) × 1,000",
      },
      {
        name: "Cost per Result",
        description:
          "Spend required to get a chosen result (purchase, lead, etc.).",
        formula: "Amount Spent / Number of Results",
      },
    ],
  },
] as const;

const ONE_CLICK_TEMPLATES = [
  {
    name: "Business Dashboard",
    fit: "E-commerce",
    description:
      "Cross-channel overview of sales, blended ROAS, ad spend, landed costs, and net profit.",
  },
  {
    name: "Lead Gen Brand | Ultimate Meta Ads Performance",
    fit: "Lead generation",
    description:
      "Lead-focused performance with funnel stages, CPL, reach, and engagement diagnostics.",
  },
  {
    name: "Monthly Facebook Ad Report",
    fit: "Agencies",
    description:
      "Client-facing monthly KPI pack with ROAS, purchases, CPC/CPM, CTR, and spend vs. revenue trends.",
  },
] as const;

export function AdsManagerPanel() {
  const [activeTab, setActiveTab] =
    useState<(typeof INSIGHT_TABS)[number]>("Meta Dashboard");
  const [showSmartFilter, setShowSmartFilter] = useState(false);
  const [showAutoReporting, setShowAutoReporting] = useState(false);
  const [showFullFunnelInsights, setShowFullFunnelInsights] = useState(false);
  const [showErfmModule, setShowErfmModule] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [showDecreaseBid, setShowDecreaseBid] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [audienceView, setAudienceView] = useState<
    "Audience Size" | "Potential Reach"
  >("Audience Size");
  const [lookalikeView, setLookalikeView] = useState<
    "Lookalike %" | "Recency" | "Lookalike & Recency"
  >("Lookalike %");

  const selectedRows = useMemo(
    () => SAMPLE_ROWS.filter((row) => selected.includes(row.id)),
    [selected],
  );

  const allSelected = selected.length === SAMPLE_ROWS.length;

  return (
    <Card className="border-border">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {INSIGHT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-sm ${
                activeTab === tab
                  ? "bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400"
                  : "text-text-tertiary hover:bg-surface-2"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-text-primary">
            Ads Manager 2.0
          </h2>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button className="px-4 py-2 rounded-lg border border-border text-sm bg-surface">
              Filter Data
            </button>
            <button
              onClick={() => setShowSmartFilter(true)}
              className="px-4 py-2 rounded-lg border border-border text-sm bg-surface"
            >
              Smart Filter
            </button>
            <button className="px-4 py-2 rounded-lg border border-border text-sm bg-surface">
              Export PDF
            </button>
            <button
              onClick={() => setShowAutoReporting(true)}
              className="px-4 py-2 rounded-lg border border-border text-sm bg-surface"
            >
              Automated Reporting
            </button>
          </div>
        </div>

        {activeTab === "Meta Dashboard" && (
          <>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-surface-2 text-text-secondary">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() =>
                          setSelected(
                            allSelected ? [] : SAMPLE_ROWS.map((r) => r.id),
                          )
                        }
                      />
                    </th>
                    <th className="p-3 text-left">Asset name</th>
                    <th className="p-3 text-left">AI Bidding</th>
                    <th className="p-3 text-left">Amount Spent</th>
                    <th className="p-3 text-left">ROAS</th>
                    <th className="p-3 text-left">Cost per Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(row.id)}
                          onChange={() =>
                            setSelected((prev) =>
                              prev.includes(row.id)
                                ? prev.filter((x) => x !== row.id)
                                : [...prev, row.id],
                            )
                          }
                        />
                      </td>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setShowAiSettings(true)}
                          className="px-2 py-1 rounded-full text-xs bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400"
                        >
                          AI Bidding
                        </button>
                      </td>
                      <td className="p-3">${row.amountSpent}</td>
                      <td className="p-3">{row.roas}</td>
                      <td className="p-3">£{row.cpc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              {[
                { stage: "Acquisition Prospecting", budget: "60%" },
                { stage: "Acquisition Re-Engagement", budget: "20%" },
                { stage: "Retargeting", budget: "15%" },
                { stage: "Retention", budget: "5%" },
              ].map((stage) => (
                <div
                  key={stage.stage}
                  className="rounded-xl border border-border p-4 bg-surface-2"
                >
                  <p className="text-sm text-text-tertiary">{stage.stage}</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-2">
                    {stage.budget}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDecreaseBid(true)}
                disabled={!selected.length}
              >
                Decrease bid
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSetBudget(true)}
                disabled={!selected.length}
              >
                Set budget
              </Button>
            </div>
          </>
        )}

        {activeTab === "Targeting Insights" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Top Landing Pages</h3>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-sm">
                  See all landing pages
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-tertiary">
                    <th className="text-left p-2">Link</th>
                    <th className="text-left p-2">Amount Spent</th>
                    <th className="text-left p-2">ROAS (All)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["https://site.com/lp-a", "$460", "3.29"],
                    ["https://site.com/lp-b", "$140", "3.26"],
                    ["Ads without landing pages", "$1,741", "2.92"],
                  ].map((r) => (
                    <tr key={r[0]} className="border-t border-border">
                      <td className="p-2">{r[0]}</td>
                      <td className="p-2">{r[1]}</td>
                      <td className="p-2">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3">
                  Expand Interest & Lookalike Expansion
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    "Expand Interest + Lookalike Expansion",
                    "Expand Interest only",
                    "Lookalike Expansion only",
                    "No expansions launched yet",
                  ].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border p-3 bg-surface-2"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  {(["Audience Size", "Potential Reach"] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setAudienceView(tab)}
                        className={`px-3 py-1 rounded-md text-sm ${audienceView === tab ? "bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400" : "text-text-tertiary"}`}
                      >
                        {tab}
                      </button>
                    ),
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    "More than 20M",
                    "10M-20M",
                    "2M-10M",
                    "500K-2M",
                    "100K-500K",
                    "10K-100K",
                  ].map((tier) => (
                    <div
                      key={tier}
                      className="grid grid-cols-3 rounded-lg border border-border p-2"
                    >
                      <span>{tier}</span>
                      <span>$1,029</span>
                      <span>ROAS 6.82</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3">WiFi</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border p-3">WiFi Only</div>
                  <div className="rounded-lg border p-3">
                    Any Internet Connection
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  {(
                    ["Lookalike %", "Recency", "Lookalike & Recency"] as const
                  ).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setLookalikeView(tab)}
                      className={`px-3 py-1 rounded-md text-sm ${lookalikeView === tab ? "bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400" : "text-text-tertiary"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="text-sm rounded-lg border p-3">
                  Active view: {lookalikeView}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  Targeting Insights Across the Full Funnel
                </h3>
                <button
                  onClick={() => setShowFullFunnelInsights(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-sm"
                >
                  Go to Audiences Manager
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  "Total Prospecting",
                  "Total Re-Engagement",
                  "Total Retargeting",
                  "Total Retention",
                ].map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-6 rounded-lg border border-border p-2"
                  >
                    <span className="font-medium">{row}</span>
                    <span>Amount Spent</span>
                    <span>ROAS</span>
                    <span>Cost per Purchase</span>
                    <span>Outbound CTR</span>
                    <span className="text-text-tertiary">Trend ↗</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowErfmModule(true)}
                >
                  Open eRFM Module
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowFullFunnelInsights(true)}
                >
                  Open Full Funnel Insights
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Auction Analytics" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Placement & Device</h3>
                <span className="text-sm text-text-tertiary">ROAS (All)</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3 bg-surface-2">
                  <p className="text-text-tertiary">Desktop</p>
                  <p className="text-3xl font-semibold mt-2">1.47</p>
                  <p className="text-xs text-text-tertiary">18.69% of spend</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-surface-2">
                  <p className="text-text-tertiary">Mobile</p>
                  <p className="text-3xl font-semibold mt-2">6.07</p>
                  <p className="text-xs text-text-tertiary">81.31% of spend</p>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-text-tertiary">
                    <tr>
                      <th className="text-left p-2">Platform & Placement</th>
                      <th className="text-left p-2">Device</th>
                      <th className="text-left p-2">System</th>
                      <th className="text-left p-2">Amount Spent</th>
                      <th className="text-left p-2">ROAS (All)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Instagram Feed", "Mobile", "iOS", "US$9,937", "2.49"],
                      ["Facebook Stories", "Mobile", "iOS", "US$469", "3.64"],
                      [
                        "Instagram Reels",
                        "Mobile",
                        "Android",
                        "US$160",
                        "1.68",
                      ],
                    ].map((r) => (
                      <tr key={r[0]} className="border-t border-border">
                        {r.map((c, i) => (
                          <td key={i} className="p-2">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">
                Campaign Type & Budget (CBO vs ABO)
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  Campaign Budget Optimization:{" "}
                  <span className="font-semibold">5.76 ROAS</span>
                </div>
                <div className="rounded-lg border p-3">
                  Ad Set Budget Optimization:{" "}
                  <span className="font-semibold">3.92 ROAS</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">
                Campaign Objective & Ad Delivery Optimization
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3 bg-surface-2">
                  Conversions: 4.28
                </div>
                <div className="rounded-lg border p-3 bg-surface-2">
                  Lead Generation: 0.00
                </div>
                <div className="rounded-lg border p-3 bg-surface-2">
                  Landing Page Views: 0.00
                </div>
                <div className="rounded-lg border p-3 bg-surface-2">
                  Amount Spent split shown
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">
                Automatic Bid vs Manual Bid
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  Automatic: 10.30 ROAS (91.09% spend)
                </div>
                <div className="rounded-lg border p-3">
                  Manual: 8.20 ROAS (8.91% spend)
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Learning Phase</h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-4 border rounded-lg p-2">
                  <span>In learning</span>
                  <span>ROAS 6.06</span>
                  <span>£13,149</span>
                  <span>CTR 0.81%</span>
                </div>
                <div className="grid grid-cols-4 border rounded-lg p-2">
                  <span>Limited learning</span>
                  <span>ROAS 4.25</span>
                  <span>£1,667</span>
                  <span>CTR 0.32%</span>
                </div>
                <div className="grid grid-cols-4 border rounded-lg p-2">
                  <span>Out of learning</span>
                  <span>ROAS 1.83</span>
                  <span>£412</span>
                  <span>CTR 0.40%</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3">Ranking Benchmarks</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 border rounded p-2">
                    <span>Engagement: Above average</span>
                    <span>ROAS 4.65</span>
                    <span>US$2,008</span>
                    <span>2.25%</span>
                  </div>
                  <div className="grid grid-cols-4 border rounded p-2">
                    <span>Conversion: Bottom 35%</span>
                    <span>ROAS 8.04</span>
                    <span>US$10,305</span>
                    <span>1.72%</span>
                  </div>
                  <div className="grid grid-cols-4 border rounded p-2">
                    <span>Quality: Bottom 35%</span>
                    <span>ROAS 14.19</span>
                    <span>US$714</span>
                    <span>0.38%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3">Ad Type</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 border rounded p-2">
                    <span>DPA</span>
                    <span>ROAS 36.00</span>
                    <span>£676</span>
                    <span>3.21%</span>
                  </div>
                  <div className="grid grid-cols-4 border rounded p-2">
                    <span>MTO</span>
                    <span>ROAS 15.15</span>
                    <span>£364</span>
                    <span>1.54%</span>
                  </div>
                  <div className="grid grid-cols-4 border rounded p-2">
                    <span>Normal ads</span>
                    <span>ROAS 5.90</span>
                    <span>£41,061</span>
                    <span>0.73%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Days & Hours</h3>
              <div className="h-28 rounded-lg bg-gradient-to-r from-indigo-50 to-sky-100 dark:from-indigo-950 dark:to-sky-950" />
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Frequency Breakdown</h3>
              <div className="grid grid-cols-6 text-sm gap-2">
                {[
                  "1 Time",
                  "2 Times",
                  "3 Times",
                  "4 Times",
                  "5 Times",
                  "6-10 Times",
                ].map((b) => (
                  <div key={b} className="border rounded p-2 text-center">
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Geo & Demo Insights" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4 bg-surface-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Geo & Demo Insights</h3>
                <span className="text-sm text-text-tertiary">
                  Primary Market: Uzbekistan + CIS
                </span>
              </div>
              <p className="text-sm text-text-tertiary mt-2">
                Loyiha hozir Oʻzbekiston va MDH bozoriga fokuslangan; keyingi
                bosqichda xalqaro scaling qoʻshiladi.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-2">Wasted Spend</h3>
                <p className="text-4xl font-bold text-red-500 dark:text-red-400">26%</p>
                <p className="text-sm text-text-tertiary">
                  Potential uplift +1206.99%
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-2">Trending Countries</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ["Uzbekistan", "+342%"],
                    ["Kazakhstan", "+188%"],
                    ["Kyrgyzstan", "+97%"],
                    ["Tajikistan", "-22%"],
                    ["Azerbaijan", "+64%"],
                  ].map((row) => (
                    <div key={row[0]} className="flex justify-between">
                      <span>{row[0]}</span>
                      <span
                        className={
                          row[1].startsWith("-")
                            ? "text-red-500 dark:text-red-400 font-semibold"
                            : "text-green-500 dark:text-green-400 font-semibold"
                        }
                      >
                        {row[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Maps</h3>
                  <button className="px-3 py-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-sm">
                    See All Locations
                  </button>
                </div>
                <div className="h-52 rounded-lg bg-gradient-to-br from-blue-100 via-slate-50 to-emerald-100 dark:from-blue-950 dark:via-slate-800 dark:to-emerald-950 flex items-center justify-center text-text-tertiary text-sm">
                  Geo heatmap preview
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">International Scaling</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Top country", "UZ", "+53%", "€9,931", "15.76", "€90.28"],
                  ["Tier 1", "KZ", "+3493%", "€260.3", "27.64", "€130.15"],
                  ["Tier 2", "KG", "+12%", "€16,329", "20.53", "€101.42"],
                  ["Tier 3", "TJ", "+40%", "€234.27", "104.18", "€33.47"],
                ].map((r) => (
                  <div
                    key={r[0]}
                    className="grid grid-cols-6 border rounded p-2"
                  >
                    {r.map((c, i) => (
                      <span key={i}>{c}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3">Age & Gender</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ["18-24 Female", "£1,026", "CTR 0.63%", "ROAS 1.91"],
                    ["18-24 Male", "£2,806", "CTR 1.62%", "ROAS 8.87"],
                    ["25-34 Female", "£5,005", "CTR 0.77%", "ROAS 5.52"],
                    ["25-34 Male", "£40,395", "CTR 1.13%", "ROAS 6.74"],
                  ].map((row) => (
                    <div
                      key={row[0]}
                      className="grid grid-cols-4 border rounded p-2"
                    >
                      {row.map((c, i) => (
                        <span key={i}>{c}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3">Language</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ["Uzbek", "245 ads", "£133,356", "ROAS 6.73"],
                    ["Russian", "98 ads", "£53,523", "ROAS 4.24"],
                    ["Kazakh", "31 ads", "£12,511", "ROAS 3.18"],
                    ["English", "12 ads", "£4,207", "ROAS 2.02"],
                  ].map((row) => (
                    <div
                      key={row[0]}
                      className="grid grid-cols-4 border rounded p-2"
                    >
                      {row.map((c, i) => (
                        <span key={i}>{c}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Creative Insights" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xl">Audience Studio</h3>
                  <p className="text-sm text-text-tertiary mt-1">
                    Top audience performance, interest discovery, and audience
                    mixer
                  </p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm">
                  Launch
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <button className="px-3 py-1.5 rounded-md bg-indigo-500/10 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-sm">
                  Explore Audiences By Performance
                </button>
                <button className="px-3 py-1.5 rounded-md text-text-tertiary text-sm border border-border">
                  Discover New Interests
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-text-tertiary">
                    <tr>
                      <th className="text-left p-2">Audience Name</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Amount Spent</th>
                      <th className="text-left p-2">ROAS</th>
                      <th className="text-left p-2">Cost per Purchase</th>
                      <th className="text-left p-2">Audience Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Beauty salons",
                        "Interest",
                        "US$390",
                        "3.38",
                        "US$35.48",
                        "727M",
                      ],
                      [
                        "Nail polish",
                        "Interest",
                        "US$625",
                        "2.86",
                        "US$32.87",
                        "52.7M",
                      ],
                      [
                        "Lookalike (US 1%-2%)",
                        "Lookalike",
                        "US$755",
                        "2.44",
                        "US$39.76",
                        "33.2M",
                      ],
                      [
                        "Health & Beauty admins",
                        "Behavior",
                        "US$496",
                        "2.02",
                        "US$26.49",
                        "13.8M",
                      ],
                    ].map((row) => (
                      <tr key={row[0]} className="border-t border-border">
                        {row.map((cell, i) => (
                          <td key={i} className="p-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Audience mixer</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-blue-500/20 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm">
                    Clear selection
                  </button>
                  <button className="px-3 py-1.5 rounded-lg border border-blue-500/20 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm">
                    Save audience selection
                  </button>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-3">
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">
                    Included (0 intersection)
                  </p>
                  <ul className="text-sm space-y-1 text-text-secondary">
                    <li>Lookalike (UZ 1%-2%) — 2.6M</li>
                    <li>Lookalike (KZ 2%-3%) — 2.4M</li>
                    <li>Lookalike (KG 3%-4%) — 1.2M</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">1st intersection</p>
                  <ul className="text-sm space-y-1 text-text-secondary">
                    <li>Gigi Hadid — 5.5M</li>
                    <li>Kris Jenner — 11.9M</li>
                    <li>Kendall Jenner — 20.7M</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">2nd intersection</p>
                  <ul className="text-sm space-y-1 text-text-secondary">
                    <li>System of a Down — 5.6M</li>
                    <li>Rammstein — 6.8M</li>
                    <li>Linkin Park — 16M</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 border rounded-lg p-3 text-sm text-text-tertiary">
                Excluded audiences: none
              </div>
              <div className="mt-3 text-sm">
                Potential reach: <span className="font-semibold">10.4M</span>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-lg">
                How to uncover winning audiences with Audience Launcher
              </h3>
              <p className="text-sm text-text-tertiary mt-1">
                Launch AI-powered, prebuilt full-funnel audiences in minutes
                (instead of building everything manually in Meta Ads Manager).
              </p>
              <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
                <div className="rounded-lg border border-border p-3 bg-surface-2">
                  <p className="font-medium">76 prebuilt audiences</p>
                  <p className="text-text-tertiary mt-1">
                    Cover acquisition, re-engagement, retargeting, and retention
                    in a few clicks.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-surface-2">
                  <p className="font-medium">AI + eRFM segmentation</p>
                  <p className="text-text-tertiary mt-1">
                    Audience quality improves through behavioral and value-based
                    signals from your customer data.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-surface-2">
                  <p className="font-medium">Built-in exclusions</p>
                  <p className="text-text-tertiary mt-1">
                    Acquisition excludes retargeting/retention, and retargeting
                    excludes retention by default.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
                <p className="font-medium text-amber-900">
                  Default exclusion policy (must-have)
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-900/90">
                  <li>
                    Always exclude recent purchasers from top and middle funnel
                    campaigns by default.
                  </li>
                  <li>
                    Add email-based exclusions from{" "}
                    <span className="font-medium">Shopify</span>,{" "}
                    <span className="font-medium">Klaviyo</span>, or manual CSV
                    uploads.
                  </li>
                  <li>
                    Apply this baseline to{" "}
                    <span className="font-medium">Prospecting</span>,{" "}
                    <span className="font-medium">Re-Engagement</span>, and{" "}
                    <span className="font-medium">Retargeting</span>.
                  </li>
                  <li>
                    Focus only on required audience sets first (do not launch
                    all 76 at once).
                  </li>
                </ul>
              </div>

              <div className="mt-4 rounded-lg border border-border p-3">
                <p className="font-medium text-sm">Step-by-step launch flow</p>
                <ol className="list-decimal pl-5 mt-2 text-sm text-text-secondary space-y-1">
                  <li>
                    Select a funnel stage and choose preconfigured audiences.
                  </li>
                  <li>
                    Pick launch mode: split campaigns by funnel stage or launch
                    all ad sets into one campaign.
                  </li>
                  <li>
                    Assign creatives with performance context and save changes.
                  </li>
                  <li>
                    Configure location, recency, lookalike %, conversion type,
                    budget, placements, and demographics.
                  </li>
                  <li>
                    Review naming convention, campaign summary, and launch now
                    or schedule.
                  </li>
                </ol>
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium">Recommended by funnel stage</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-text-secondary">
                    <li>
                      <span className="font-medium">Acquisition:</span> Video
                      Addicts lookalike, Super lookalike, Top-URL lookalikes,
                      Interest mixes, Broad targeting.
                    </li>
                    <li>
                      <span className="font-medium">Re-engagement:</span> Video
                      addicts/enthusiasts/casuals, Social engagers, Ad watchers.
                    </li>
                    <li>
                      <span className="font-medium">Retargeting:</span> Custom
                      recency visitors (0-3 and 3-30 days), high-intent recency,
                      deep browsers.
                    </li>
                    <li>
                      <span className="font-medium">Retention:</span> Basic
                      180-day purchasers, fresh customers, reactivation windows.
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium">eRFM logic (simplified)</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-text-secondary">
                    <li>
                      <span className="font-medium">Value tiers:</span>{" "}
                      Silver/Low, Gold/Medium, Platinum/High.
                    </li>
                    <li>
                      <span className="font-medium">Frequency tiers:</span>{" "}
                      Infrequent, Occasional, Frequent.
                    </li>
                    <li>
                      <span className="font-medium">Intent:</span> low-intent vs
                      high-intent visitor paths and purchaser cohorts.
                    </li>
                    <li>
                      AI maps these segments to lookalikes and funnel-ready
                      launch sets.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm border border-border rounded-lg">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="text-left p-2">Facebook Ads Manager</th>
                      <th className="text-left p-2">
                        Performa Audience Manager
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Manual audience setup from scratch",
                        "Prebuilt audience library ready to launch",
                      ],
                      [
                        "No AI-native audience recommendations",
                        "AI-driven lookalikes and eRFM-based audience sets",
                      ],
                      [
                        "Limited launch-time targeting guidance",
                        "In-flow setup data for recency, lookalike %, and conversion setup",
                      ],
                      [
                        "No default cross-stage exclusions",
                        "Prebuilt exclusions between acquisition, retargeting, retention",
                      ],
                      [
                        "Harder to split campaigns by funnel stage",
                        "Stage-based campaign split supported during launch",
                      ],
                      [
                        "Creative selection without unified performance lens",
                        "Ad picker with performance context for better budget decisions",
                      ],
                    ].map((row) => (
                      <tr key={row[0]} className="border-t border-border">
                        <td className="p-2">{row[0]}</td>
                        <td className="p-2">{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Ad Copy Insights" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xl">One-Click Report</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-blue-500/20 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm">
                    Data Sources
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm">
                    Create Report
                  </button>
                </div>
              </div>
              <div className="mt-3 h-3 rounded-full bg-green-500/10 dark:bg-green-950">
                <div className="h-full w-1/4 rounded-full bg-green-500 dark:bg-green-400" />
              </div>
              <p className="text-sm text-text-tertiary mt-2">6/1000 reports used</p>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Templates</h3>
                <button className="px-3 py-1.5 rounded-lg border border-blue-500/20 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm">
                  Show All Templates
                </button>
              </div>
              <div className="grid md:grid-cols-4 gap-3 text-sm">
                {[
                  "Blank report",
                  ...ONE_CLICK_TEMPLATES.map((template) => template.name),
                ].map((name) => (
                  <div
                    key={name}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="h-24 rounded-md bg-surface-2 mb-2" />
                    <p className="font-medium">{name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-lg">
                Which metrics should you track?
              </h3>
              <p className="text-sm text-text-tertiary mt-1">
                Prioritize metrics that help you customize dashboards, optimize
                ad accounts, understand acquisition costs, and monitor
                profitability.
              </p>
              <div className="mt-4 space-y-4">
                {ONE_CLICK_METRIC_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-lg border border-border p-3"
                  >
                    <h4 className="font-semibold text-sm">{group.title}</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 text-sm">
                      {group.metrics.map((metric) => (
                        <div
                          key={metric.name}
                          className="rounded-lg bg-surface-2 p-3"
                        >
                          <p className="font-medium">{metric.name}</p>
                          <p className="text-text-tertiary mt-1">
                            {metric.description}
                          </p>
                          {metric.formula && (
                            <p className="text-xs text-text-secondary mt-2">
                              Formula: {metric.formula}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-lg">
                How to pick your template
              </h3>
              <p className="text-sm text-text-tertiary mt-1">
                Choose a prebuilt report based on your business model, then
                customize widgets and sources.
              </p>
              <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
                {ONE_CLICK_TEMPLATES.map((template) => (
                  <div
                    key={template.name}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      {template.fit}
                    </p>
                    <p className="font-medium mt-1">{template.name}</p>
                    <p className="text-text-tertiary mt-2">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-surface-2 border border-border p-3 text-sm">
                <p className="font-medium">Tips, hints, and tricks</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-text-secondary">
                  <li>
                    Track the same KPI across 3, 7, 14, and 30-day windows.
                  </li>
                  <li>
                    Compare ad spend vs. revenue and ROAS together to identify
                    profitable trend windows.
                  </li>
                  <li>
                    Use text widgets to section your report by funnel stage,
                    audience, or channel.
                  </li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-lg">
                Track your live marketing data with Business Dashboard
              </h3>
              <p className="text-sm text-text-tertiary mt-1">
                Connect Meta, TikTok, Shopify, Google Ads, GA4, and Klaviyo to
                monitor real-time blended business performance in one place.
              </p>
              <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium">What you get</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-text-secondary">
                    <li>Live blended summary across connected channels.</li>
                    <li>360° cross-platform marketing visibility.</li>
                    <li>Custom widgets and drag-and-drop layout control.</li>
                    <li>Blended metrics for deeper profitability insight.</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium">Connect data sources</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      "Meta",
                      "Google Ads",
                      "Google Analytics 4",
                      "Shopify",
                      "TikTok",
                      "Klaviyo",
                    ].map((source) => (
                      <div
                        key={source}
                        className="rounded-md border border-border px-2 py-1.5 text-xs bg-surface-2"
                      >
                        {source}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    Add sources from the header icon row or the "Connect more
                    data sources" section.
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">Customize & share</p>
                <div className="grid md:grid-cols-3 gap-2 mt-2 text-text-secondary">
                  <div className="rounded-md bg-surface-2 p-2">
                    1) Set date range from the top-right selector.
                  </div>
                  <div className="rounded-md bg-surface-2 p-2">
                    2) Use ⚙ settings for currency, full width, and account
                    management.
                  </div>
                  <div className="rounded-md bg-surface-2 p-2">
                    3) Click Edit to drag/drop widgets, then Share to generate a
                    live public link.
                  </div>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm border border-border rounded-lg">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="p-2 text-left">Facebook Ads Manager</th>
                      <th className="p-2 text-left">
                        Performa Business Dashboard
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Complex default report view",
                        "Visual KPI cards and blended snapshots",
                      ],
                      [
                        "Manual report setup",
                        "Prebuilt dashboard as soon as accounts connect",
                      ],
                      [
                        "Limited editing ergonomics",
                        "Drag-and-drop report editor",
                      ],
                      [
                        "Meta-only analytics",
                        "Cross-channel view: Meta, TikTok, Shopify, Google Ads, GA4, Klaviyo",
                      ],
                    ].map((row) => (
                      <tr key={row[0]} className="border-t border-border">
                        <td className="p-2">{row[0]}</td>
                        <td className="p-2">{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="grid lg:grid-cols-[260px_1fr] gap-4">
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Data sources</h4>
                  <ul className="text-sm space-y-2">
                    <li>🟢 Facebook (7 accounts)</li>
                    <li>🟢 Google Ads (1 account)</li>
                    <li>🔴 Google Analytics</li>
                    <li>🔴 GA4</li>
                    <li>🔴 Shopify</li>
                    <li>🔴 TikTok</li>
                    <li>🔴 Klaviyo</li>
                  </ul>

                  <h4 className="font-semibold mt-5 mb-2">Widgets</h4>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {[
                      "Line",
                      "Informer",
                      "Area",
                      "Bar",
                      "Table",
                      "Text",
                      "Pie",
                      "Goal",
                    ].map((w) => (
                      <div
                        key={w}
                        className="border rounded p-2 text-center bg-surface-2"
                      >
                        {w}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid md:grid-cols-4 gap-2">
                    {[
                      ["Revenue", "€279,780"],
                      ["Facebook ROAS", "26.45"],
                      ["All Purchases", "235"],
                      ["Cost per Purchase", "€45.01"],
                    ].map((m) => (
                      <div key={m[0]} className="border rounded-lg p-3">
                        <p className="text-xs text-text-tertiary">{m[0]}</p>
                        <p className="text-2xl font-semibold mt-1">{m[1]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-64 rounded-lg border bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-slate-900" />
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-border text-sm">
                      Duplicate widget
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-border text-sm">
                      Delete widget
                    </button>
                    <button
                      onClick={() => setShowShareOptions(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm"
                    >
                      Share Options
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== "Meta Dashboard" &&
          activeTab !== "Targeting Insights" &&
          activeTab !== "Auction Analytics" &&
          activeTab !== "Geo & Demo Insights" &&
          activeTab !== "Creative Insights" &&
          activeTab !== "Ad Copy Insights" && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-text-tertiary">
              {activeTab} coming soon.
            </div>
          )}
      </div>

      {showSetBudget && (
        <ModalShell title="Set Budget" onClose={() => setShowSetBudget(false)}>
          <p>
            This action will set the daily budget of the{" "}
            {selectedRows.length || 1} selected asset.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSetBudget(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSetBudget(false)}>
              Yes, confirm
            </Button>
          </div>
        </ModalShell>
      )}

      {showDecreaseBid && (
        <ModalShell
          title="Decrease Bid"
          onClose={() => setShowDecreaseBid(false)}
        >
          <p>
            This action will decrease the bid for the {selectedRows.length || 1}{" "}
            selected ad set(s).
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDecreaseBid(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowDecreaseBid(false)}>
              Yes, confirm
            </Button>
          </div>
        </ModalShell>
      )}

      {showAiSettings && (
        <ModalShell
          title="AI bidding settings"
          onClose={() => setShowAiSettings(false)}
        >
          <p className="mb-3">
            Optimization KPIs and suggested allocation updates.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowAiSettings(false)}
            >
              Turn Off AI Bidding
            </Button>
            <Button onClick={() => setShowAiSettings(false)}>Apply</Button>
          </div>
        </ModalShell>
      )}

      {showAutoReporting && (
        <ModalShell
          title="Automated Reporting"
          onClose={() => setShowAutoReporting(false)}
        >
          <p className="font-semibold">Reporting Frequency</p>
          <div className="space-y-2 text-sm my-3">
            {["Daily", "Weekly", "Monthly"].map((f) => (
              <label key={f} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={f === "Weekly"} />
                {f}
              </label>
            ))}
          </div>
          <input
            placeholder="Email"
            className="w-full border border-border rounded-lg px-3 py-2 mb-2"
          />
          <input
            placeholder="CC"
            className="w-full border border-border rounded-lg px-3 py-2"
          />
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowAutoReporting(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowAutoReporting(false)}>
              Save Schedule
            </Button>
          </div>
        </ModalShell>
      )}

      {showSmartFilter && (
        <ModalShell
          title="Smart Filter"
          onClose={() => setShowSmartFilter(false)}
        >
          <div className="grid md:grid-cols-5 gap-4 text-sm">
            <FilterCol
              title="Age"
              options={["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]}
            />
            <FilterCol
              title="Gender"
              options={["Male", "Female", "Uncategorized"]}
            />
            <FilterCol
              title="Device"
              options={["Desktop", "Mobile App", "Mobile Web"]}
            />
            <FilterCol
              title="Placement"
              options={[
                "Facebook",
                "Instagram",
                "Messenger",
                "Audience Network",
              ]}
            />
            <FilterCol
              title="ARR"
              options={["Acquisition", "Retargeting", "Retention"]}
            />
          </div>
          <input
            placeholder="Select Country"
            className="w-full border border-border rounded-lg px-3 py-2 mt-4"
          />
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowSmartFilter(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowSmartFilter(false)}>
              Apply Filters
            </Button>
          </div>
        </ModalShell>
      )}

      {showFullFunnelInsights && (
        <ModalShell
          title="Full Funnel Audience Insights"
          onClose={() => setShowFullFunnelInsights(false)}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-7 text-xs text-text-tertiary uppercase tracking-wide border-b pb-2">
              <span>% of spend</span>
              <span>Audience Type</span>
              <span>Live / Created</span>
              <span>Amount Spent</span>
              <span>ROAS (All)</span>
              <span>Cost per Purchase</span>
              <span>Outbound CTR</span>
            </div>
            {[
              [
                "-",
                "Total Account Performance",
                "47 / 61",
                "CA$32,015",
                "1.79",
                "CA$76.78",
                "0.29%",
              ],
              [
                "74.1%",
                "Total Prospecting",
                "36 / 50",
                "CA$23,722",
                "1.52",
                "CA$86.89",
                "0.32%",
              ],
              [
                "1.92%",
                "Total Re-Engagement",
                "1 / 3",
                "US$1,823",
                "6.65",
                "US$5.11",
                "1.06%",
              ],
              [
                "9.05%",
                "Total Retargeting",
                "1 / 2",
                "US$24,231",
                "13.21",
                "US$64.1",
                "0.49%",
              ],
              [
                "7.33%",
                "Total Retention",
                "2 / 6",
                "€1,633",
                "108.57",
                "€9.28",
                "0.52%",
              ],
            ].map((row) => (
              <div
                key={row[1]}
                className="grid grid-cols-7 text-sm border border-border rounded-lg p-2"
              >
                {row.map((cell, idx) => (
                  <span
                    key={idx}
                    className={idx === 2 ? "text-green-600 dark:text-green-400 font-semibold" : ""}
                  >
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </ModalShell>
      )}

      {showErfmModule && (
        <ModalShell
          title="eRFM Module"
          onClose={() => setShowErfmModule(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-sm">
              {[
                ["Silver (Low value)", "2.45"],
                ["Gold (Medium value)", "1.70"],
                ["Platinum (High value)", "-"],
                ["Occasional (Medium value)", "2.29"],
              ].map((cell) => (
                <div
                  key={cell[0]}
                  className="border border-border rounded-lg p-3 bg-surface-2"
                >
                  <p className="text-text-tertiary">{cell[0]}</p>
                  <p className="text-2xl font-semibold mt-2">{cell[1]}</p>
                  <button className="mt-2 px-2 py-1 rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-xs">
                    Create ad set
                  </button>
                </div>
              ))}
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="font-semibold mb-2">
                Top Recency & Lookalike for eRFM Module
              </p>
              <div className="grid grid-cols-4 text-sm">
                <span>Lookalike %</span>
                <span>Amount Spent</span>
                <span>ROAS (All)</span>
                <span>Cost per Purchase</span>
              </div>
              <div className="grid grid-cols-4 text-sm mt-2">
                <span>0-5%</span>
                <span>A$404</span>
                <span>2.29</span>
                <span>A$16.83</span>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {showShareOptions && (
        <ModalShell title="Sharing" onClose={() => setShowShareOptions(false)}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-950 text-blue-600 dark:text-blue-400">
                Link sharing
              </button>
              <button className="px-3 py-2 rounded-lg border border-border">
                Download report
              </button>
            </div>
            <div>
              <label className="text-sm text-text-tertiary">Link sharing</label>
              <select className="mt-1 w-full border border-border rounded-lg px-3 py-2">
                <option>Disabled link</option>
                <option>Public link</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowShareOptions(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowShareOptions(false)}>
                Export PDF
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </Card>
  );
}

function FilterCol({ title, options }: { title: string; options: string[] }) {
  return (
    <div>
      <p className="font-semibold mb-2">{title}</p>
      <div className="space-y-1">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2">
            <input type="checkbox" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-surface rounded-2xl shadow-2xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-2xl text-text-primary font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-text-tertiary"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
