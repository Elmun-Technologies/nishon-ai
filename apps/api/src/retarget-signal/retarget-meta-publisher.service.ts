import { HttpService } from "@nestjs/axios";
import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import type { RetargetCreativeRule } from "./retarget-creative-mapping";
import { hashPhoneSha256ForMeta } from "./retarget-phone-hash.util";

const GRAPH = "https://graph.facebook.com/v20.0";

export type RetargetPublishMetaResult = {
  metaAudienceId: string;
  metaCampaignId: string;
  metaAdSetId: string;
  metaCreativeId: string;
  metaAdId: string;
  mappingKey: string;
};

@Injectable()
export class RetargetMetaPublisherService {
  private readonly logger = new Logger(RetargetMetaPublisherService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async publishOneClickRetarget(input: {
    accessToken: string;
    adAccountId: string;
    pageId: string;
    phoneDigits: string;
    rule: RetargetCreativeRule;
    linkUrl?: string;
    dailyBudget?: number;
  }): Promise<RetargetPublishMetaResult> {
    const dry = this.config.get<string>("RETARGET_META_DRY_RUN", "") === "true";
    if (dry) {
      const fake = "dry_" + Date.now();
      return {
        metaAudienceId: fake,
        metaCampaignId: fake,
        metaAdSetId: fake,
        metaCreativeId: fake,
        metaAdId: fake,
        mappingKey: input.rule.key,
      };
    }

    const act = this.toActId(input.adAccountId);
    const link = (input.linkUrl || input.rule.linkUrl).trim() || "https://www.facebook.com/";
    const dailyBudget = String(
      input.dailyBudget ??
        (Number(this.config.get<string>("RETARGET_DEFAULT_DAILY_BUDGET", "50000")) || 50000),
    );
    const short = input.phoneDigits.slice(-4);
    const audienceName = `${input.rule.adsetName} — ${short}`;
    const campaignName = `Retarget - ${input.rule.key} - ${short}`;
    const adsetName = `Retarget - ${input.rule.key} - ${short}`;
    const token = input.accessToken;

    const audienceId = await this.createCustomAudience(act, audienceName, token);
    await this.addPhoneHashToAudience(audienceId, input.phoneDigits, token);
    await this.sleepForAudienceReady();

    const campaignId = await this.createTrafficCampaign(act, campaignName, token);
    const adsetId = await this.createAdSet({
      act,
      name: adsetName,
      campaignId,
      dailyBudget,
      audienceId,
      rule: input.rule,
      token,
    });
    const creativeId = await this.createLinkCreative({
      act,
      pageId: input.pageId,
      name: `${adsetName} creative`,
      headline: input.rule.headline,
      primaryText: input.rule.primaryText,
      link,
      token,
    });
    const adId = await this.createAd({
      act,
      name: `${adsetName} ad`,
      adsetId,
      creativeId,
      token,
    });

    this.logger.log({
      message: "Retarget Meta publish tugadi",
      audienceId,
      campaignId,
      adsetId,
      creativeId,
      adId,
    });

    return {
      metaAudienceId: audienceId,
      metaCampaignId: campaignId,
      metaAdSetId: adsetId,
      metaCreativeId: creativeId,
      metaAdId: adId,
      mappingKey: input.rule.key,
    };
  }

  private toActId(id: string): string {
    const t = id.trim();
    return t.startsWith("act_") ? t : `act_${t}`;
  }

  private async graphPostRaw(
    path: string,
    fields: Record<string, string>,
    accessToken: string,
  ): Promise<Record<string, unknown>> {
    const url = `${GRAPH}/${path}`;
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(fields)) {
      body.set(k, v);
    }
    body.set("access_token", accessToken);
    const res = await firstValueFrom(
      this.http.post<Record<string, unknown> & { error?: { message?: string } }>(url, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    ).catch((e: any) => {
      const msg = e?.response?.data?.error?.message ?? e?.message ?? "Graph xato";
      throw new BadGatewayException(msg);
    });
    const data = res.data;
    if (data && typeof data === "object" && "error" in data) {
      const er = (data as { error?: { message?: string } }).error;
      if (er?.message) throw new BadGatewayException(er.message);
    }
    return data;
  }

  private async graphPost(path: string, fields: Record<string, string>, accessToken: string): Promise<string> {
    const data = await this.graphPostRaw(path, fields, accessToken);
    const id = data?.id;
    if (typeof id !== "string" || !id.length) {
      throw new BadGatewayException("Graph javobida id yo‘q");
    }
    return id;
  }

  private async createCustomAudience(act: string, name: string, token: string): Promise<string> {
    return this.graphPost(
      `${act}/customaudiences`,
      {
        name,
        subtype: "CUSTOM",
        description: "Signal bridge retarget (phone hash)",
        customer_file_source: "USER_PROVIDED_ONLY",
      },
      token,
    );
  }

  private async addPhoneHashToAudience(audienceId: string, phoneDigits: string, token: string): Promise<void> {
    const hash = hashPhoneSha256ForMeta(phoneDigits);
    const payload = JSON.stringify({
      schema: ["PH"],
      data: [[hash]],
    });
    await this.graphPostRaw(
      `${audienceId}/users`,
      {
        payload,
      },
      token,
    );
  }

  /** Meta auditoriyani qayta ishlashi uchun qisqa kutish. */
  private async sleepForAudienceReady(): Promise<void> {
    const ms = Number(this.config.get<string>("RETARGET_AUDIENCE_WAIT_MS", "3000"));
    await new Promise((r) => setTimeout(r, Number.isFinite(ms) ? ms : 3000));
  }

  private async createTrafficCampaign(act: string, name: string, token: string): Promise<string> {
    return this.graphPost(
      `${act}/campaigns`,
      {
        name,
        objective: "OUTCOME_TRAFFIC",
        status: "ACTIVE",
        special_ad_categories: JSON.stringify([]),
        is_adset_budget_sharing_enabled: "false",
      },
      token,
    );
  }

  private async createAdSet(input: {
    act: string;
    name: string;
    campaignId: string;
    dailyBudget: string;
    audienceId: string;
    rule: RetargetCreativeRule;
    token: string;
  }): Promise<string> {
    const targeting = JSON.stringify({
      geo_locations: { countries: ["UZ"] },
      age_min: input.rule.ageMin,
      age_max: input.rule.ageMax,
      custom_audiences: [{ id: input.audienceId }],
    });
    return this.graphPost(
      `${input.act}/adsets`,
      {
        name: input.name,
        campaign_id: input.campaignId,
        daily_budget: input.dailyBudget,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LINK_CLICKS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        targeting,
        status: "ACTIVE",
        destination_type: "WEBSITE",
      },
      input.token,
    );
  }

  private async createLinkCreative(input: {
    act: string;
    pageId: string;
    name: string;
    headline: string;
    primaryText: string;
    link: string;
    token: string;
  }): Promise<string> {
    const object_story_spec = JSON.stringify({
      page_id: input.pageId,
      link_data: {
        link: input.link,
        message: input.primaryText,
        name: input.headline,
        call_to_action: {
          type: "SHOP_NOW",
          value: { link: input.link },
        },
      },
    });
    return this.graphPost(
      `${input.act}/adcreatives`,
      {
        name: input.name,
        object_story_spec,
      },
      input.token,
    );
  }

  private async createAd(input: {
    act: string;
    name: string;
    adsetId: string;
    creativeId: string;
    token: string;
  }): Promise<string> {
    const creative = JSON.stringify({ creative_id: input.creativeId });
    return this.graphPost(
      `${input.act}/ads`,
      {
        name: input.name,
        adset_id: input.adsetId,
        creative,
        status: "ACTIVE",
      },
      input.token,
    );
  }
}
