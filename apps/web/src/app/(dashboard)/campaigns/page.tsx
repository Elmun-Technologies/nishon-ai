"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Link2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { useI18n } from "@/i18n/use-i18n";
import { Button } from "@/components/ui/Button";
import { Badge, CampaignStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Dialog, PageHeader } from "@/components/ui";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { campaigns as campaignsApi } from "@/lib/api-client";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";
import { AdsManagerPanel } from "@/components/campaigns/AdsManagerPanel";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

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
  const { t } = useI18n();
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
  const [filterPreset, setFilterPreset] = useState("default");
  const [dateRange, setDateRange] = useState("last7");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const campaignLoadRangePresets = useMemo(
    () => [
      { id: "today", label: "Today" },
      { id: "yesterday", label: "Yesterday" },
      { id: "last3", label: "Last 3 days" },
      { id: "last7", label: "Last 7 days" },
      { id: "last14", label: "Last 14 days" },
      { id: "last30", label: "Last 30 days" },
    ],
    [],
  );

  const fetchCampaigns = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await campaignsApi.list(currentWorkspace.id);
      setItems((res.data as any) ?? []);
    } catch (err: any) {
      setError(err?.message ?? t("campaigns.loadFailed", "Failed to load campaigns"));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, t]);

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
      setActionError(err?.message ?? t("campaigns.updateFailed", "Failed to update campaign status"));
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <PageHeader
            className="mb-0 border-0 bg-transparent p-2 shadow-none"
            title={t("navigation.campaigns", "Campaigns")}
            subtitle={t("campaigns.subtitle", "All advertising campaigns managed by AdSpectr")}
          />
        </section>
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="rounded-2xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-3 h-3 w-72" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={t("navigation.campaigns", "Campaigns")}
          subtitle={t("campaigns.subtitle", "All advertising campaigns managed by AdSpectr")}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="gray">{items.length} {t("campaigns.total", "total")}</Badge>
              <Button variant="secondary" size="sm" onClick={fetchCampaigns}>
                {t("campaigns.refresh", "Refresh")}
              </Button>
              <Button onClick={() => setShowCreatePanel(true)} className="shadow-sm">
                + {t("campaigns.create", "Create Campaign")}
              </Button>
            </div>
          }
        />
      </section>

      <div className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        {error && <Alert variant="error">{error}</Alert>}
        {actionError && <Alert variant="error" className="mt-2">{actionError}</Alert>}
      </div>

      <div className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <AdsManagerPanel />
      </div>

      <div className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-text-tertiary">Load filter preset</label>
          <select
            value={filterPreset}
            onChange={(e) => setFilterPreset(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="default">Default preset</option>
            <option value="high-roas">High ROAS</option>
            <option value="creative-testing">Creative testing</option>
            <option value="retargeting">Retargeting</option>
          </select>
          <label className="ml-2 text-xs text-text-tertiary">Range</label>
          <DateRangeFilter
            variant="select"
            value={dateRange}
            onValueChange={setDateRange}
            presets={campaignLoadRangePresets}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            selectClassName="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            dateInputClassName="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
          <Button size="sm" className="ml-auto">
            Update
          </Button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="rounded-2xl border border-border/70 bg-white/85 p-2 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <div className="flex items-center gap-1 rounded-xl bg-slate-900/5 p-1 dark:bg-white/5 w-fit">
          {(
            [
              { key: "all", label: "All" },
              { key: "active", label: t("campaigns.active", "Active") },
              { key: "paused", label: t("campaigns.paused", "Paused") },
              { key: "draft", label: t("campaigns.draft", "Draft") },
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
                    ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm"
                    : "text-text-tertiary hover:text-text-primary hover:bg-white/70 dark:hover:bg-white/10"
                }
              `}
            >
              {tab.label}
              <span
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${
                    filter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-surface-2 text-text-tertiary"
                  }
                `}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Campaign list ── */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
          <EmptyState
            icon="📢"
            title={
              filter === "all" ? t("campaigns.noCampaigns", "No campaigns yet") : t("campaigns.noCampaignsWithStatus", `No ${filter} campaigns`)
            }
            description={
              filter === "all"
                ? t("campaigns.noCampaignsDescription", "Create your first campaign using the wizard or connect your ad account to sync existing campaigns.")
                : t("campaigns.noCampaignsWithStatusDescription", `You have no campaigns with "${filter}" status right now.`)
            }
          />
          {filter === "all" && (
            <div className="flex justify-center pb-6">
              <Button variant="primary" onClick={() => router.push("/wizard")}>
                + {t("campaigns.create", "Create Campaign")}
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
                  className={`rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm transition-all duration-200 dark:bg-slate-900/70 ${isSelected ? "border-blue-300/70 shadow-md dark:border-blue-500/40" : ""}`}
                  padding="none"
                >
                  <div className="flex items-center gap-4 p-5">
                    <PlatformIcon platform={campaign.platform} size="lg" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary text-sm truncate">
                          {campaign.name}
                        </h3>
                        {campaign.externalId && (
                          <Badge variant="gray" size="sm">
                            Synced
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-tertiary text-xs">
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
                      <p className="text-text-primary text-sm font-semibold">
                        {formatCurrency(campaign.dailyBudget)}
                        <span className="text-text-tertiary font-normal">/day</span>
                      </p>
                      <p className="text-text-tertiary text-xs mt-0.5">
                        {formatCurrency(campaign.totalBudget)} total
                      </p>
                    </div>

                    <div className="shrink-0">
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-text-tertiary transition-transform duration-200 shrink-0 ${isSelected ? "rotate-180" : ""}`}
                    />
                  </div>
                </Card>

                {isSelected && (
                  <div className="mt-1 rounded-2xl border border-border/70 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
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
                          <p className="text-text-tertiary text-xs mb-1 uppercase tracking-wide">
                            {label}
                          </p>
                          <p className="text-text-primary text-sm font-medium">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border">
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
                          {t("campaigns.pause", "Pause")}
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
                          {t("campaigns.resume", "Resume")}
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
                            {t("campaigns.stop", "Stop")}
                          </Button>
                        )}

                      <div className="ml-auto">
                        {campaign.externalId && (
                          <p className="text-text-tertiary text-xs">
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
        <Card variant="outlined" padding="sm" className="rounded-2xl border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-text-secondary" />
              <div>
                <p className="text-text-primary text-sm font-medium">
                  {t("campaigns.connectMorePlatforms", "Connect more ad platforms")}
                </p>
                <p className="text-text-tertiary text-xs">
                  {t("campaigns.connectMorePlatformsHint", "Add Google, TikTok, or Telegram to expand your reach.")}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/settings/meta")}
            >
              {t("campaigns.connectPlatform", "Connect platform")}
            </Button>
          </div>
        </Card>
      )}

      <Dialog
        open={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title={t("campaigns.newCampaign", "New campaign")}
        className="max-w-3xl"
      >
        <p className="mb-4 text-xs text-text-tertiary">{currentWorkspace?.name}</p>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
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
      </Dialog>
    </div>
  );
}
