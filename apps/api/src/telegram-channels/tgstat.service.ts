import { HttpService } from "@nestjs/axios";
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import {
  AdSpectrAiClient,
  createAdSpectrAiClientFromEnv,
  isAiClientConfigured,
} from "@adspectr/ai-sdk";
import { RecommendChannelsDto } from "./dtos/recommend-channels.dto";

/**
 * Telegram channel discovery via the TGStat API (server-held TGSTAT_API_KEY).
 * Surfaces and ranks candidate channels for hyper-local ad placement — the buy
 * itself is a manual admin negotiation, so this is discovery + fit-scoring only.
 *
 * Without TGSTAT_API_KEY the endpoints report "not configured" (503) rather than
 * returning invented channels (Trust: never fake real data). Estimated prices
 * are always labelled as heuristics on the client, never presented as quotes.
 */
const TGSTAT_BASE = "https://api.tgstat.ru";

/** CIS Telegram post CPM heuristic (USD per 1k views) — a rough, labelled estimate. */
const CIS_CPM_USD = 1.5;

export interface RankedChannel {
  id: string;
  username: string | null;
  title: string;
  link: string | null;
  category: string | null;
  country: string | null;
  subscribers: number;
  avgPostReach: number | null;
  /** Engagement rate (%), when TGStat provides it. */
  err: number | null;
  /** Estimated USD price per post — heuristic from reach × regional CPM. */
  estPricePerPostUsd: number | null;
  /** 0-100 fit score for the requested niche. */
  fitScore: number;
  why: string;
}

interface TgStatChannel {
  id?: number | string;
  tg_id?: number | string;
  username?: string;
  link?: string;
  title?: string;
  category?: string;
  country?: string;
  participants_count?: number;
  avg_post_reach?: number;
  err_percent?: number;
}

@Injectable()
export class TgStatService {
  private readonly logger = new Logger(TgStatService.name);
  private readonly aiClient: AdSpectrAiClient;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.aiClient = createAdSpectrAiClientFromEnv((k) =>
      this.config.get<string>(k),
    );
  }

  private apiKey(): string | undefined {
    return this.config.get<string>("TGSTAT_API_KEY")?.trim() || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  private ensureConfigured(): string {
    const key = this.apiKey();
    if (!key) {
      throw new ServiceUnavailableException(
        "Telegram channel discovery is not configured. Set TGSTAT_API_KEY on the API server.",
      );
    }
    return key;
  }

  /** Raw TGStat channel search. */
  private async searchChannels(params: {
    query: string;
    country?: string;
    category?: string;
    limit?: number;
  }): Promise<TgStatChannel[]> {
    const key = this.ensureConfigured();
    try {
      const res = await firstValueFrom(
        this.http.get<{
          status?: string;
          response?: {
            items?: Array<TgStatChannel | { channel?: TgStatChannel }>;
          };
          error?: string;
        }>(`${TGSTAT_BASE}/channels/search`, {
          params: {
            token: key,
            q: params.query,
            country: (params.country ?? "uz").toLowerCase(),
            ...(params.category ? { category: params.category } : {}),
            limit: params.limit ?? 20,
            // TGStat: restrict to real channels (not chats) and public ones.
            channel_type: "public",
          },
          timeout: 30_000,
        }),
      );
      if (res.data?.status && res.data.status !== "ok") {
        throw new BadGatewayException(
          res.data.error || "TGStat search returned an error",
        );
      }
      const items = res.data?.response?.items ?? [];
      // TGStat sometimes nests the channel under `.channel`, sometimes flat.
      return items.map((it: any) =>
        it && typeof it === "object" && it.channel ? it.channel : it,
      );
    } catch (e: any) {
      if (e instanceof BadGatewayException) throw e;
      const status = e?.response?.status;
      this.logger.error({
        msg: "TGStat search failed",
        status,
        data: e?.response?.data ?? String(e?.message ?? e),
      });
      throw new BadGatewayException("TGStat search failed");
    }
  }

  /** Search → normalise → rank (algorithmic) → AI "why" annotation (best-effort). */
  async recommend(dto: RecommendChannelsDto): Promise<{
    channels: RankedChannel[];
    aiAnnotated: boolean;
  }> {
    // ensureConfigured runs inside searchChannels; call to fail fast with 503.
    this.ensureConfigured();

    const raw = await this.searchChannels({
      query: dto.niche,
      country: dto.country,
      category: dto.category,
      limit: 20,
    });

    const normalised = raw
      .map((c) => this.normalise(c))
      .filter((c): c is RankedChannel => c !== null)
      // Drop tiny/dead channels — not worth a placement.
      .filter((c) => c.subscribers >= 500)
      .sort((a, b) => b.subscribers - a.subscribers)
      .slice(0, 12);

    if (normalised.length === 0) {
      return { channels: [], aiAnnotated: false };
    }

    // Algorithmic base score: subscriber scale (log) + engagement, in code so it
    // is verifiable and independent of the model.
    for (const c of normalised) {
      const scaleScore = Math.min(60, Math.log10(c.subscribers + 1) * 12);
      const erScore = c.err != null ? Math.min(40, c.err * 4) : 20;
      c.fitScore = Math.round(Math.min(100, scaleScore + erScore));
    }
    normalised.sort((a, b) => b.fitScore - a.fitScore);

    const aiAnnotated = await this.annotateWithAi(dto.niche, normalised);
    return { channels: normalised, aiAnnotated };
  }

  private normalise(c: TgStatChannel): RankedChannel | null {
    const id = c.id ?? c.tg_id;
    const title = String(c.title ?? "").trim();
    if (id == null || !title) return null;
    const subscribers = Number(c.participants_count) || 0;
    const avgPostReach =
      c.avg_post_reach != null ? Number(c.avg_post_reach) || 0 : null;
    const errRaw = c.err_percent != null ? Number(c.err_percent) : null;
    // Guard against a present-but-non-numeric err_percent — NaN would poison
    // the fitScore. Treat it as "unknown" (null) instead.
    const err = errRaw != null && Number.isFinite(errRaw) ? errRaw : null;
    const reachForPrice = avgPostReach ?? Math.round(subscribers * 0.25);
    const estPricePerPostUsd =
      reachForPrice > 0
        ? Math.round((reachForPrice / 1000) * CIS_CPM_USD)
        : null;
    return {
      id: String(id),
      username: c.username ? String(c.username) : null,
      title,
      link: c.link ? String(c.link) : null,
      category: c.category ? String(c.category) : null,
      country: c.country ? String(c.country) : null,
      subscribers,
      avgPostReach,
      err,
      estPricePerPostUsd,
      fitScore: 0,
      why: "",
    };
  }

  /**
   * Best-effort AI pass that fills each channel's `why`. Returns false (leaving
   * `why` empty) when the AI provider is not configured — we never fabricate a
   * rationale.
   */
  private async annotateWithAi(
    niche: string,
    channels: RankedChannel[],
  ): Promise<boolean> {
    if (!isAiClientConfigured((k) => this.config.get<string>(k))) {
      return false;
    }
    const list = channels
      .map(
        (c, i) =>
          `${i}. ${c.title}${c.username ? ` (@${c.username})` : ""} — ${c.subscribers} obunachi, kategoriya: ${c.category ?? "—"}`,
      )
      .join("\n");
    const system = `You are a media buyer choosing Telegram channels for a niche.
For each channel, write ONE short sentence (Uzbek) on why it fits (or does not) the niche.
Respond with VALID JSON ONLY: { "items": [ { "index": 0, "why": "..." } ] }`;
    const user = `Niche: ${niche}\nChannels:\n${list}`;
    try {
      const out = await this.aiClient.completeJson<{
        items?: Array<{ index?: number; why?: string }>;
      }>(user, system, { taskType: "strategy", agentName: "TelegramChannels" });
      for (const item of out?.items ?? []) {
        const idx = Number(item?.index);
        if (Number.isInteger(idx) && channels[idx] && item?.why) {
          channels[idx].why = String(item.why).slice(0, 240);
        }
      }
      return true;
    } catch (e: any) {
      this.logger.warn({
        msg: "TGStat AI annotation failed (non-fatal)",
        error: String(e?.message ?? e),
      });
      return false;
    }
  }
}
