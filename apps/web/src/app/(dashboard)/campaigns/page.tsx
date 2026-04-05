"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { Button } from "@/components/ui/Button";
import { Badge, CampaignStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { campaigns as campaignsApi } from "@/lib/api-client";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";
import { AdsManagerPanel } from "@/components/campaigns/AdsManagerPanel";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  objective: string;
  dailyBudget: number;
  totalBudget: number;
  externalId: string | null;
  createdAt: string;
  adSets?: any[];
}

const OBJECTIVE_LABELS: Record<string, string> = {
  leads: "Lead Generation",
  sales: "Sales & Conversions",
  awareness: "Brand Awareness",
  traffic: "Website Traffic",
  engagement: "Engagement",
  app_installs: "App Installs",
};

export default function CampaignsPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft">(
    "all",
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await campaignsApi.list(currentWorkspace.id);
      setItems((res.data as any) ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Auto-refresh when Meta sync completes or optimization runs
  useRealtimeRefresh(
    currentWorkspace?.id,
    ["meta_synced", "optimization_done"],
    fetchCampaigns,
  );

  async function handleStatusChange(id: string, newStatus: string) {
    setActionLoading(id);
    setActionError("");
    try {
      await campaignsApi.updateStatus(id, newStatus);
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
      );
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to update campaign status");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = items.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const counts = {
    all: items.length,
    active: items.filter((c) => c.status === "active").length,
    paused: items.filter((c) => c.status === "paused").length,
    draft: items.filter((c) => c.status === "draft").length,
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Campaigns</h1>
            <Badge variant="gray">{items.length} total</Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            All advertising campaigns managed by Performa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchCampaigns}>
            ↻ Yangilash
          </Button>
          <button
            onClick={() => setShowCreatePanel(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white dark:bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold transition-colors shadow-lg shadow-gray-200"
          >
            <span className="text-base leading-none">+</span>
            Kampaniya yaratish
          </button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      <AdsManagerPanel />

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit">
        {(
          [
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "paused", label: "Paused" },
            { key: "draft", label: "Draft" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                filter === tab.key
                  ? "bg-slate-900 dark:bg-white dark:bg-slate-900 text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:bg-slate-800"
              }
            `}
          >
            {tab.label}
            <span
              className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${
                  filter === tab.key
                    ? "bg-white dark:bg-slate-900 dark:bg-slate-900/20 text-slate-900 dark:text-slate-50"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }
              `}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Campaign list ── */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="📢"
            title={
              filter === "all" ? "No campaigns yet" : `No ${filter} campaigns`
            }
            description={
              filter === "all"
                ? "Create your first campaign using the wizard or connect your ad account to sync existing campaigns."
                : `You have no campaigns with "${filter}" status right now.`
            }
          />
          {filter === "all" && (
            <div className="flex justify-center pb-6">
              <Button variant="primary" onClick={() => router.push("/wizard")}>
                + Create Campaign
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => {
            const isSelected = selectedId === campaign.id;
            const isThisLoading = actionLoading === campaign.id;
            return (
              <div key={campaign.id}>
                <Card
                  hoverable
                  onClick={() => setSelectedId(isSelected ? null : campaign.id)}
                  className={`transition-all duration-200 ${isSelected ? "border-slate-900/40 dark:border-white/40 bg-white dark:bg-slate-900/5 dark:bg-white dark:bg-slate-900/5" : ""}`}
                  padding="none"
                >
                  <div className="flex items-center gap-4 p-5">
                    <PlatformIcon platform={campaign.platform} size="lg" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-sm truncate">
                          {campaign.name}
                        </h3>
                        {campaign.externalId && (
                          <Badge variant="gray" size="sm">
                            Synced
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        {OBJECTIVE_LABELS[campaign.objective] ??
                          campaign.objective}
                        {" · "}
                        Created {timeAgo(campaign.createdAt)}
                        {campaign.adSets?.length
                          ? ` · ${campaign.adSets.length} ad set${campaign.adSets.length !== 1 ? "s" : ""}`
                          : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-slate-900 dark:text-slate-50 text-sm font-semibold">
                        {formatCurrency(campaign.dailyBudget)}
                        <span className="text-slate-500 dark:text-slate-400 font-normal">/day</span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        {formatCurrency(campaign.totalBudget)} total
                      </p>
                    </div>

                    <div className="shrink-0">
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    <div
                      className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 shrink-0 ${isSelected ? "rotate-180" : ""}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </Card>

                {isSelected && (
                  <div className="mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 border-t-0 rounded-b-xl px-5 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        {
                          label: "Platform",
                          value: campaign.platform.toUpperCase(),
                        },
                        {
                          label: "Objective",
                          value:
                            OBJECTIVE_LABELS[campaign.objective] ??
                            campaign.objective,
                        },
                        {
                          label: "Daily Budget",
                          value: formatCurrency(campaign.dailyBudget),
                        },
                        {
                          label: "Total Budget",
                          value: formatCurrency(campaign.totalBudget),
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1 uppercase tracking-wide">
                            {label}
                          </p>
                          <p className="text-slate-900 dark:text-slate-50 text-sm font-medium">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                      {campaign.status === "active" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={isThisLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(campaign.id, "paused");
                          }}
                        >
                          ⏸ Pause
                        </Button>
                      ) : campaign.status === "paused" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={isThisLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(campaign.id, "active");
                          }}
                        >
                          ▶ Resume
                        </Button>
                      ) : null}

                      {campaign.status !== "stopped" &&
                        campaign.status !== "completed" && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={isThisLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(campaign.id, "stopped");
                            }}
                          >
                            ⏹ Stop
                          </Button>
                        )}

                      <div className="ml-auto">
                        {campaign.externalId && (
                          <p className="text-slate-500 dark:text-slate-400 text-xs">
                            Platform ID: {campaign.externalId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <Card variant="outlined" padding="sm">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔗</span>
              <div>
                <p className="text-slate-900 dark:text-slate-50 text-sm font-medium">
                  Ko'proq platformalar ulash
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Google, TikTok yoki Telegram qo'shib qamrovni kengaytiring
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (window.location.href = "/settings/meta")}
            >
              Platforma ulash
            </Button>
          </div>
        </Card>
      )}

      {/* ── Create Campaign slide-over panel ── */}
      {showCreatePanel && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreatePanel(false)}
          />
          {/* Panel */}
          <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-slate-900 dark:text-slate-50 font-semibold">
                  Yangi kampaniya
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  {currentWorkspace?.name}
                </p>
              </div>
              <button
                onClick={() => setShowCreatePanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <CreateCampaignForm
                workspaceId={currentWorkspace?.id ?? ""}
                platform="meta"
                onSuccess={() => {
                  setShowCreatePanel(false);
                  fetchCampaigns();
                }}
                onCancel={() => setShowCreatePanel(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
