import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  StrategyEngineService,
  StrategyResult,
} from "./strategy-engine.service";
import { DecisionLoopService } from "./decision-loop.service";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { ConfigService } from "@nestjs/config";
import {
  createAdSpectrAiClientFromEnv,
  isAiClientConfigured,
} from "@adspectr/ai-sdk";
import type { AdSpectrAiClient } from "@adspectr/ai-sdk";
import { FocusGroupDto } from "./dtos/focus-group.dto";
import { PlanCampaignDto } from "./dtos/plan-campaign.dto";
import { MetaConnector } from "../platforms/connectors/meta.connector";

/**
 * AiAgentService is the public facade for all AI capabilities.
 *
 * Instead of controllers calling StrategyEngineService or DecisionLoopService
 * directly, they go through this single service. This keeps things clean:
 * the controller doesn't need to know which internal AI service handles what.
 *
 * Think of this as the "front desk" — it receives requests and routes them
 * to the right specialist (strategy, optimization, etc.).
 */
@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly aiClient: AdSpectrAiClient;

  constructor(
    private readonly strategyEngine: StrategyEngineService,
    private readonly decisionLoop: DecisionLoopService,
    private readonly config: ConfigService,
    private readonly metaConnector: MetaConnector,
    @InjectRepository(AiDecision)
    private readonly decisionRepo: Repository<AiDecision>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {
    this.aiClient = createAdSpectrAiClientFromEnv((k) =>
      this.config.get<string>(k),
    );
  }

  /**
   * Loads a pending decision and verifies the caller owns its workspace.
   * Prevents one user from approving/rejecting another workspace's decisions.
   */
  private async loadOwnedPendingDecision(
    decisionId: string,
    userId: string,
  ): Promise<AiDecision> {
    const decision = await this.decisionRepo.findOne({
      where: { id: decisionId },
    });
    if (!decision) {
      throw new NotFoundException(`AI decision ${decisionId} not found`);
    }
    const workspace = decision.workspaceId
      ? await this.workspaceRepo.findOne({
          where: { id: decision.workspaceId },
        })
      : null;
    if (!workspace || workspace.userId !== userId) {
      throw new ForbiddenException("You do not have access to this decision");
    }
    if (decision.isExecuted) {
      throw new BadRequestException("This decision has already been executed");
    }
    return decision;
  }

  /**
   * Loads a workspace and verifies the caller owns it. Prevents one user from
   * reading another workspace's onboarding strategy (IDOR) via a guessed id.
   * Returns null when no workspaceId is supplied (callers fall back to defaults).
   */
  private async loadOwnedWorkspace(
    workspaceId: string | undefined,
    userId: string | undefined,
  ): Promise<Workspace | null> {
    if (!workspaceId) return null;
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) return null;
    if (userId && workspace.userId !== userId) {
      throw new ForbiddenException("You do not have access to this workspace");
    }
    return workspace;
  }

  /**
   * Fetches recent public ads from Meta Ad Library (Marketing API / ads_archive)
   * for each competitor name and formats a prompt appendix. Best-effort: returns
   * empty string if the app token is missing or Meta returns nothing useful.
   */
  private async buildMetaAdLibraryAppendix(
    competitors: Array<{ name: string }>,
    countryCode = "UZ",
  ): Promise<string> {
    const token = await this.metaConnector.getAppAccessToken();
    if (!token) return "";

    const lines: string[] = [];
    for (const c of competitors) {
      const term = c.name?.trim();
      if (!term || term.length < 2) continue;
      try {
        const ads = await this.metaConnector.searchAdLibrary({
          searchTerms: term,
          countryCode,
          limit: 12,
          accessToken: token,
        });
        if (!ads.length) continue;
        lines.push(
          `\n【${term}】 — Ad Library: ${ads.length} ta natija (qisqa):`,
        );
        for (const ad of ads.slice(0, 8)) {
          const body = (ad.adCreativeBody || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 200);
          const cap = (ad.adCreativeLinkCaption || "").trim().slice(0, 80);
          lines.push(
            `- Sahifa: ${ad.pageName} | boshlangan: ${(ad.adDeliveryStartTime || "").slice(0, 10) || "?"}` +
              (cap ? ` | caption: ${cap}` : "") +
              `\n  Matn: ${body || "(matn yo'q)"}`,
          );
        }
      } catch (err: any) {
        this.logger.debug(
          `Ad Library search skipped for "${term}": ${err?.message || err}`,
        );
      }
    }
    if (!lines.length) return "";

    return (
      `\n\n--- Meta Marketing API — Ad Library (ads_archive) ---\n` +
      `Quyidagi qatorlar Facebook/Instagram jamoat reklama arxividan (Graph API) olingan namunalar. ` +
      `Ularni kuch/xavf va kreativ yo‘nalishlarida asosiy dalil sifatida ishlating; bu to‘liq hisobot emas.\n` +
      lines.join("\n") +
      `\n`
    );
  }

  async generateStrategy(workspaceId: string): Promise<StrategyResult> {
    return this.strategyEngine.generateForWorkspace(workspaceId);
  }

  async regenerateStrategy(workspaceId: string): Promise<StrategyResult> {
    return this.strategyEngine.regenerateStrategy(workspaceId);
  }

  async runOptimizationLoop(workspaceId: string): Promise<AiDecision[]> {
    return this.decisionLoop.runForWorkspace(workspaceId);
  }

  /**
   * Approve a pending AI decision and execute it on the platform.
   * Only decisions with isApproved=null (pending) can be approved.
   */
  async approveDecision(decisionId: string, userId: string): Promise<void> {
    const decision = await this.loadOwnedPendingDecision(decisionId, userId);

    // Mark as approved first so it passes the guard in executeDecision
    await this.decisionRepo.update(decisionId, { isApproved: true });
    decision.isApproved = true;

    await this.decisionLoop.executeDecision(decision);
    this.logger.log(`Decision approved and executed: ${decisionId}`);
  }

  /**
   * Reject a pending AI decision — marks it as rejected without execution.
   */
  async rejectDecision(decisionId: string, userId: string): Promise<void> {
    await this.loadOwnedPendingDecision(decisionId, userId);

    await this.decisionRepo.update(decisionId, {
      isApproved: false,
      afterState: { rejectedAt: new Date(), status: "rejected" } as any,
    });
    this.logger.log(`Decision rejected: ${decisionId}`);
  }

  /**
   * AI Chat — answers questions about campaigns, metrics, errors, and strategy.
   * Used by the floating chat widget on the dashboard.
   */
  async chat(dto: {
    workspaceId: string;
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
    assistantPersona?: "targetologist" | "optimizer" | "general";
  }): Promise<{ reply: string }> {
    const persona =
      dto.assistantPersona === "optimizer"
        ? `Primary persona for this thread: ADS OPTIMIZER. Prioritize bid strategies, budget pacing, A/B testing cadence, creative performance diagnostics, scaling rules, and guardrails before spend changes. Still stay within platform safety and never promise unauthorized account actions.`
        : dto.assistantPersona === "targetologist"
          ? `Primary persona for this thread: TARGETOLOGIST (media buyer focused on targeting). Prioritize audiences, placements, geo/demographics, interest layering, exclusions, funnel structure, and measurement for targeting decisions. Still stay within platform safety and never promise unauthorized account actions.`
          : "";

    const systemPrompt = `You are AdSpectr — a helpful advertising assistant for the AdSpectr platform.
You help users understand their Meta ad campaign performance, troubleshoot errors, and optimize their strategy.
You also help them think through marketing workflows, automation ideas, team handoffs, and day-to-day processes — not only metrics.
You have knowledge about Meta Ads (Facebook/Instagram), campaign budgets, CTR, ROAS, CPM, CPC metrics.
Answer in the same language the user writes in (Uzbek, Russian, or English).
Be concise, practical, and friendly. When giving advice, use concrete numbers from context if available.
If asked about a specific campaign or metric, explain what it means and what actions to take.

When suggesting that the user navigate somewhere in the app, append an action
marker on its own line at the end of the relevant paragraph. The frontend
turns these into clickable chips. Use them sparingly — at most 2 per reply,
only when navigation is the natural next step. Available markers:
  [action:ad-launcher]    → opens the 3-step Ad Launcher
  [action:campaigns]      → opens the Campaigns list / Ads Manager
  [action:reports]        → opens the Reports page
  [action:meta-audit]     → opens the Meta Audit page
  [action:creative-hub]   → opens the Creative Hub
  [action:settings]       → opens workspace settings (Meta connection, etc.)

You may also provide a custom label like [action:ad-launcher|Yangi kampaniya yaratish].
${persona ? `\n${persona}\n` : ""}
Workspace ID for this conversation: ${dto.workspaceId}`;

    const historyText = (dto.history || [])
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const userPrompt = historyText
      ? `Previous conversation:\n${historyText}\n\nUser: ${dto.message}`
      : dto.message;

    const result = await this.aiClient.complete(userPrompt, systemPrompt, {
      taskType: "chat",
      agentName: "ChatWidget",
      temperature: 0.65,
      maxTokens: 900,
    });

    return { reply: result.content };
  }

  /**
   * Streaming version of chat() — same prompt, same persona, but yields
   * content chunks as the model produces them. Drives the SSE endpoint
   * for the live "typing" UI on the AI Assistant page.
   */
  async *chatStream(dto: {
    workspaceId: string;
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
    assistantPersona?: "targetologist" | "optimizer" | "general";
  }): AsyncGenerator<string, void, void> {
    const persona =
      dto.assistantPersona === "optimizer"
        ? `Primary persona for this thread: ADS OPTIMIZER. Prioritize bid strategies, budget pacing, A/B testing cadence, creative performance diagnostics, scaling rules, and guardrails before spend changes. Still stay within platform safety and never promise unauthorized account actions.`
        : dto.assistantPersona === "targetologist"
          ? `Primary persona for this thread: TARGETOLOGIST (media buyer focused on targeting). Prioritize audiences, placements, geo/demographics, interest layering, exclusions, funnel structure, and measurement for targeting decisions. Still stay within platform safety and never promise unauthorized account actions.`
          : "";

    const systemPrompt = `You are AdSpectr — a helpful advertising assistant for the AdSpectr platform.
Answer in the same language the user writes in (Uzbek, Russian, or English).
Be concise, practical, and friendly. When giving advice, use concrete numbers from context if available.

When suggesting that the user navigate somewhere in the app, append an action
marker on its own line at the end of the relevant paragraph. The frontend
turns these into clickable chips. Use them sparingly — at most 2 per reply.
Available markers: [action:ad-launcher] [action:campaigns] [action:reports]
[action:meta-audit] [action:creative-hub] [action:settings].
${persona ? `\n${persona}\n` : ""}
Workspace ID for this conversation: ${dto.workspaceId}`;

    const historyText = (dto.history || [])
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const userPrompt = historyText
      ? `Previous conversation:\n${historyText}\n\nUser: ${dto.message}`
      : dto.message;

    yield* this.aiClient.completeStream(userPrompt, systemPrompt, {
      taskType: "chat",
      agentName: "ChatWidget",
      temperature: 0.65,
      maxTokens: 900,
    });
  }

  /**
   * Competitor analysis — 12-category marketing audit (72 sub-parameters).
   * Returns a rich JSON that the frontend renders as a comparison table.
   */
  async analyzeCompetitor(dto: {
    workspaceId: string;
    competitor: { name: string; instagram: string; website: string };
    businessContext: any;
  }): Promise<any> {
    const systemPrompt = `
You are an expert digital marketing analyst who has audited 100+ businesses
in Uzbekistan and CIS markets. You use a proven 12-category audit framework.

Analyze BOTH the client's business AND their competitor across exactly these
12 categories with exactly these sub-parameters:

CATEGORY 1: "Instagram identikasi" (id: 1)
Sub-params:
1. Profil nomlanishi (tarixiy, qiziqarli, oson yodda qoladi)
2. Bio va positioning (kompaniya qiladigan narsa, foydalari, kontakt)
3. Vizual uyg'unlik (ranglar, fontlar, uslub va estetika)
4. CTA (Call to Action) — aniq harakatga chaqiruv
5. Business account holati (aktiv, barcha funksiyalar yoqilgan)
6. Raqobatchilar tahlili (ular nima qilayapti, eng yaxshi amaliyotlar)

CATEGORY 2: "Statistika" (id: 2)
Sub-params:
1. Obunachilar sifati (real manzil, bot emas, aktiv foydalanuvchilar)
2. Engagement darajasi (like/comment/save nisbati, normal 3-5%)
3. Oxvat (Reach va Impression) tendensiyasi
4. Kontent samaradorligi (eng yaxshi postlar, muvaffaqiyatli formatlar)
5. Post vaqtlari (eng yaxshi vaqtlar aniqlangan va rejalashtirilgan)
6. Story ko'rishlar soni va reaksiya darajasi

CATEGORY 3: "SMM tizimi" (id: 3)
Sub-params:
1. Reels soni va muntazamligi (haftada kamida 2-3 ta)
2. Carusel formati (ko'p rasmlik postlar, slideshow, infographics)
3. Story intizomi (kunlik, muntazam, interaktiv - polls, questions)
4. Kontent struktura (tarqalib ketganmi, rejalashtirilganmi)
5. Post tayyorlash jarayoni (fikr bor, lekin amalga oshmayaptimi?)
6. Hashtag strategiyasi (to'g'ri hashtaglar, lokal hashtaglar)

CATEGORY 4: "Target reklama" (id: 4)
Sub-params:
1. Active reklamalar soni (kamida 2-3 ta bir vaqtda ishlayaptimi)
2. Facebook/Instagram targeting (age, gender, location, interests)
3. Kampaniya logikasi (funnel: awareness -> consideration -> conversion)
4. Pixel va tracking (Facebook Pixel, conversion events)
5. Creative materials (rasm va video sifati, ad copy)
6. Retargeting (mijozlar qayta targetlanayaptimi)

CATEGORY 5: "Javob tezligi" (id: 5)
Sub-params:
1. Direct javob vaqti (optimal 15-30 daqiqa ichida)
2. Comment javob (hamma commentga javob beriladi)
3. Telegram monitoring (tezkor javob, auto-reply)
4. Facebook monitoring (Messenger va commentlar)
5. YouTube & TikTok commentlar tekshiriladi
6. Javob standartlari (skript bor, bir xil javob sifati)

CATEGORY 6: "Web sayt" (id: 6)
Sub-params:
1. UX - foydalanish qulayligi (navigatsiya aniq, mobile version)
2. Tezlik (yuklash 3-5 sekund ichida, PageSpeed score)
3. Kontakt shakllari (ishlaydimi, ma'lumot kiryaptimi)
4. Chatbot mavjudligi (avtomatik javoblash, 24/7)
5. SEO basics (meta tags, title, description, sitemap)
6. Responsiveness (barcha device larda yaxshi ko'rinadi)

CATEGORY 7: "SEO" (id: 7)
Sub-params:
1. On-page SEO (title, meta, H1-H6, keywords, internal linking)
2. Technical SEO (site speed, mobile-friendly, HTTPS, sitemap)
3. Keyword research (asosiy kalit so'zlar, long-tail, search volume)
4. Content optimization (sifat, keyword placement, readability)
5. Backlink analysis (domain authority, referring domains)
6. Local SEO (Google My Business, local keywords, NAP)

CATEGORY 8: "Marketplace" (id: 8)
Sub-params:
1. Platformalar mavjudligi (Uzum.uz, Express.uz, local marketplaces)
2. Product listings (tushunarli description, quality photos)
3. Inventory management (mahsulotlar mavjud, stock tracking)
4. Customer service (comments, feedbacks, javoblar, reyting)
5. Promotions (discounts, aksiyalar ishlatilayaptimi)
6. Analytics (sales data, top products, customer behavior)

CATEGORY 9: "Context reklama" (id: 9)
Sub-params:
1. Google Ads kampaniyalari (search, display, shopping, video)
2. Yandex Direct (kampaniyalar mavjudligi, Russian market)
3. Kalit so'zlar (relevant keywords, negative keywords)
4. Budget va bid strategies (CPC, ad spend optimization)
5. Landing pages (sifat, relevance, conversion rate)
6. Remarketing (retargeting setup, audience segments)

CATEGORY 10: "Call center" (id: 10)
Sub-params:
1. Telefon skript (muammo yechimi, offer taqdimoti, objection handling)
2. KEV varonka (awareness -> interest -> desire -> action)
3. Offer sifati (attraktiv, value proposition, urgency, scarcity)
4. Qayta aloqa - follow up (1st, 2nd, 3rd follow-up timing)
5. Suhbat sifati (professional, product knowledge, customer-centric)
6. KPI tracking (calls made, conversion rate, average call duration)

CATEGORY 11: "Xarita presence" (id: 11)
Sub-params:
1. Google Map (Business Profile, NAP, hours, reviews, photos)
2. Yandex Business (mavjudligi, to'liqligi, Russian audience)
3. 2GIS (manzil to'g'ri, kontakt ma'lumotlar, navigatsiya)
4. Reviews monitoring (barcha platformada baho va javoblar)
5. Consistency (barcha platformalarda bir xil NAP ma'lumotlar)
6. Local SEO (local keywords, geotagging, proximity factors)

CATEGORY 12: "Raqobatchilar SWOT" (id: 12)
Sub-params:
1. Strengths (kuchli tomonlari, unique selling proposition)
2. Weaknesses (zaif tomonlari, muammolari, gaplar)
3. Opportunities (bozor imkoniyatlari, market trends)
4. Threats (yangi raqobatchilar, market changes)
5. Price comparison (narxlarni solishtirish, value proposition)
6. Best practices (o'rganish, innovative approaches)

RESPOND WITH VALID JSON ONLY:
{
  "competitor": {
    "name": "string",
    "instagram": "string",
    "website": "string",
    "overallSummary": "2-3 sentence overview in Uzbek",
    "estimatedAdSpend": "e.g. $300–800/oy"
  },
  "categories": [
    {
      "id": 1,
      "title": "Instagram identikasi",
      "icon": "📸",
      "description": "Profil, bio, vizual, CTA, business account, raqobatchilar tahlili",
      "yourScore": 65,
      "competitorScore": 72,
      "subParams": [
        {
          "name": "Profil nomlanishi",
          "yourStatus": "good",
          "competitorStatus": "medium",
          "yourNote": "brief note in Uzbek",
          "competitorNote": "brief note in Uzbek"
        }
      ]
    }
  ],
  "overallScore": { "you": 61, "competitor": 68 },
  "overallWinner": "competitor",
  "topStrengths": ["strength 1 in Uzbek", "strength 2", "strength 3"],
  "topWeaknesses": ["weakness 1 in Uzbek", "weakness 2", "weakness 3"],
  "urgentFixes": ["fix 1 in Uzbek", "fix 2", "fix 3", "fix 4", "fix 5"],
  "annualStrategy": {
    "q1": "Q1 strategy in Uzbek",
    "q2": "Q2 strategy in Uzbek",
    "q3": "Q3 strategy in Uzbek",
    "q4": "Q4 strategy in Uzbek",
    "keyActions": ["action 1", "action 2", "action 3", "action 4", "action 5"],
    "budgetAdvice": "budget recommendation in Uzbek"
  }
}

RULES:
- Write yourNote, competitorNote, all strategy fields in Uzbek language
- status must be exactly "good", "bad", or "medium"
- yourScore and competitorScore per category: 0-100
- overallScore: 0-100
- Include ALL 12 categories with ALL 6 sub-params each
- Be specific and realistic based on provided Instagram/website URLs
- If data not available, make educated estimates based on industry
- When a "Meta Marketing API — Ad Library" section appears in the user message, use it as evidence for active paid/social creative patterns; reconcile with URL-based notes.
`;

    const adLibraryAppendixSingle = await this.buildMetaAdLibraryAppendix([
      { name: dto.competitor.name },
    ]);

    const userPrompt = `
Analyze this competitor vs our client:

OUR CLIENT:
- Business: ${dto.businessContext.name ?? "Unknown"}
- Industry: ${dto.businessContext.industry ?? "Unknown"}
- Description: ${dto.businessContext.productDescription ?? "Not provided"}
- Location: ${dto.businessContext.targetLocation ?? "Uzbekistan"}
- Monthly budget: $${dto.businessContext.monthlyBudget ?? 500}
- Goal: ${dto.businessContext.goal ?? "leads"}
- Existing strategy summary: ${dto.businessContext.aiStrategy?.summary ?? "Not generated"}

COMPETITOR:
- Name: ${dto.competitor.name}
- Instagram: ${dto.competitor.instagram || "Not provided"}
- Website: ${dto.competitor.website || "Not provided"}
${adLibraryAppendixSingle}
Please analyze both businesses across all 12 categories and 72 sub-parameters.
Use the Instagram and website URLs to gather real insights about the competitor.
Be specific, actionable, and write all notes in Uzbek language.
`;

    try {
      return await this.aiClient.completeJson(userPrompt, systemPrompt, {
        taskType: "competitor",
        agentName: "CompetitorAnalysis",
        temperature: 0.3,
      });
    } catch (err: any) {
      const detail = err?.message || String(err);
      this.logger.error(`Competitor analysis failed: ${detail}`);
      throw new InternalServerErrorException(
        `AI tahlil amalga oshmadi: ${detail.slice(0, 200)}`,
      );
    }
  }

  /**
   * Multi-competitor portfolio view (condensed JSON).
   * Intended for careful strategic review; can later be delegated to Manus with the same payload shape.
   */
  async analyzeCompetitorsBatch(dto: {
    workspaceId: string;
    businessContext: Record<string, unknown>;
    competitors: Array<{
      name: string;
      instagram?: string;
      website?: string;
      extraLinks?: string;
    }>;
  }): Promise<Record<string, unknown>> {
    const list = dto.competitors || [];
    if (list.length === 0) {
      throw new BadRequestException("Kamida bitta raqobatchi kerak");
    }
    if (list.length > 12) {
      throw new BadRequestException(
        "Bir vaqtning o‘zida 12 tadan ortiq raqobatchi yuborilmaydi",
      );
    }
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (!c?.name?.trim()) {
        throw new BadRequestException(`Raqobatchi #${i + 1}: nom majburiy`);
      }
      const hasLink = Boolean(
        (c.instagram && String(c.instagram).trim()) ||
        (c.website && String(c.website).trim()) ||
        (c.extraLinks && String(c.extraLinks).trim()),
      );
      if (!hasLink) {
        throw new BadRequestException(
          `Raqobatchi "${c.name.trim()}": kamida bitta havola (Instagram, sayt yoki qo‘shimcha havolalar) kiriting`,
        );
      }
    }

    const systemPrompt = `
You are a senior competitive intelligence analyst for Uzbekistan / CIS digital markets.
A business depends on this analysis — be careful, evidence-based, and avoid overclaiming when URLs are incomplete.
Return VALID JSON ONLY with this exact shape (all user-facing strings in Uzbek):

{
  "executiveSummary": "2-4 jumla: umumiy landshaft, asosiy bosim, nimaga e'tibor berish kerak",
  "analysisCareNote": "1-2 jumla: bu tahlil qarorlar uchun yo'l-yo'riq, kafolat emas; ma'lumotlar cheklangan bo'lishi mumkin",
  "portfolioPressureScore": 0-100,
  "competitors": [
    {
      "name": "string",
      "instagram": "string",
      "website": "string",
      "threatLevel": "low" | "medium" | "high",
      "oneLinePositioning": "Uzbek: ularning pozitsiyasi",
      "strengthBullets": ["...", "..."],
      "weaknessBullets": ["...", "..."],
      "whatToWatch": "Uzbek: kuzatish kerak bo'lgan 1-2 signal"
    }
  ],
  "topRisks": ["...", "...", "..."],
  "topOpportunities": ["...", "...", "..."],
  "ninetyDayPlan": {
    "focus": "Uzbek",
    "actions": ["...", "..."]
  },
  "twelveMonthOutlook": {
    "summary": "Uzbek",
    "milestones": ["...", "..."]
  }
}

RULES:
- threatLevel must be exactly "low", "medium", or "high"
- portfolioPressureScore: higher = more competitive pressure on the client
- 3-5 bullets max per strengths/weaknesses per competitor
- Be specific when URLs/names suggest a category; otherwise say what is unknown
- When a "Meta Marketing API — Ad Library" section is present in the user message, treat those rows as real public ad samples for the search term; align strength/threat notes with them where possible, and say when the Library returned nothing useful for a brand.
`;

    const biz = dto.businessContext || {};
    const adLibraryAppendix = await this.buildMetaAdLibraryAppendix(list);
    const competitorBlock = list
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.name.trim()}
   - Instagram: ${(c.instagram || "").trim() || "yo'q"}
   - Website: ${(c.website || "").trim() || "yo'q"}
   - Qo'shimcha havolalar / izoh: ${(c.extraLinks || "").trim() || "yo'q"}`,
      )
      .join("\n\n");

    const userPrompt = `
Workspace ID: ${dto.workspaceId}

BIZNING MIJOZ:
- Nomi: ${String(biz.name ?? "noma'lum")}
- Soha: ${String(biz.industry ?? "noma'lum")}
- Tavsif: ${String((biz as { productDescription?: string }).productDescription ?? "berilmagan")}
- Joy: ${String(biz.targetLocation ?? "O'zbekiston")}
- Oylik byudjet (taxmin): $${String(biz.monthlyBudget ?? 500)}
- Maqsad: ${String(biz.goal ?? "lead")}
- Auditoriya: ${String(biz.targetAudience ?? "berilmagan")}
- Strategiya (qisqa): ${JSON.stringify(biz.aiStrategy ?? {}).slice(0, 800)}

RAQOBATCHILAR (${list.length} ta):
${competitorBlock}
${adLibraryAppendix}
Barcha raqobatchilar bo'yicha portfolio tahlilini bering. JSON qaytaring.
`;

    try {
      return (await this.aiClient.completeJson(userPrompt, systemPrompt, {
        taskType: "competitor",
        agentName: "CompetitorPortfolioBatch",
        temperature: 0.25,
      })) as Record<string, unknown>;
    } catch (err: any) {
      const detail = err?.message || String(err);
      this.logger.error(`Competitor batch analysis failed: ${detail}`);
      throw new InternalServerErrorException(
        `Portfolio tahlili amalga oshmadi: ${detail.slice(0, 200)}`,
      );
    }
  }

  async generateAdScripts(workspaceId: string, dto: any): Promise<any> {
    const platforms: string[] = dto.platforms || ["meta"];

    const systemPrompt = `
You are an elite direct-response copywriter specializing in CIS markets
(Uzbekistan, Kazakhstan, Russia, Ukraine). You write high-converting
ad scripts in Uzbek language that feel native and culturally appropriate.

Your scripts must follow these principles:
1. HOOK first — stop the scroll in 3 seconds or less
2. Problem → Agitation → Solution structure
3. Social proof when possible
4. Clear single CTA — one action only
5. Natural Uzbek language — not translated, natively written
6. Platform-specific format and tone

Respond with VALID JSON ONLY. No explanation outside JSON.

JSON structure:
{
  "generatedAt": "ISO date string",
  "businessName": "string",
  "platforms": {
    "meta": {
      "videoScripts": [
        {
          "scriptNumber": 1,
          "hook": "First 3 seconds — scroll-stopping opener in Uzbek",
          "body": "Main message 4-25 seconds in Uzbek",
          "cta": "Last 5 seconds CTA in Uzbek",
          "duration": "30 soniya",
          "format": "Vertical 9:16 (Reels/Stories)"
        }
      ],
      "bannerCopies": [
        {
          "variant": 1,
          "headline": "max 40 chars in Uzbek",
          "primaryText": "main ad text in Uzbek",
          "description": "short description in Uzbek",
          "ctaButton": "Hozir xarid qiling"
        }
      ]
    },
    "google": {
      "headlines": ["15 headlines max 30 chars each in Uzbek"],
      "descriptions": ["4 descriptions max 90 chars each in Uzbek"]
    },
    "tiktok": {
      "scripts": [
        {
          "scriptNumber": 1,
          "style": "UGC — shaxsiy guvohlik",
          "hook": "First 3 sec CRITICAL — most important",
          "body": "4-30 seconds casual tone",
          "cta": "Last 3 seconds",
          "hashtags": ["#uzbekistan", "#relevant"]
        }
      ]
    },
    "youtube": {
      "hook": "0-5 seconds before skip button",
      "body": "6-30 seconds main message",
      "cta": "Last 5 seconds"
    },
    "telegram": {
      "posts": ["post 1 with emoji and formatting", "post 2", "post 3"]
    }
  },
  "generalTips": [
    "tip 1 in Uzbek",
    "tip 2 in Uzbek",
    "tip 3 in Uzbek"
  ]
}

Only include platforms that are requested.
Write ALL content in Uzbek language.
Make scripts feel genuine and human, not robotic.
Use specific details from the business context.
`;

    const platformDetails: Record<string, string> = {
      meta: "Meta: 3 video scripts (30 sec each, 9:16 vertical) + 7 banner copies",
      google:
        "Google: 15 headlines (max 30 chars) + 4 descriptions (max 90 chars) for RSA",
      tiktok: "TikTok: 3 UGC-style scripts (casual, authentic, 15-60 sec)",
      youtube: "YouTube: 1 skippable ad script (5-sec hook + 30-sec body)",
      telegram: "Telegram: 3 channel post ads with emojis and formatting",
    };

    const requestedPlatformDetails = platforms
      .map((p) => platformDetails[p] || p)
      .join("\n");

    const userPrompt = `
Generate ad scripts for these platforms:
${requestedPlatformDetails}

BUSINESS CONTEXT:
- Business name: ${dto.businessName}
- Industry: ${dto.industry}
- Product: ${dto.productDescription}
- Target audience: ${dto.targetAudience}
- Primary goal: ${dto.goal}
- Monthly budget: $${dto.monthlyBudget}
- Location: ${dto.targetLocation?.join(", ") || "Uzbekistan"}
- Key strengths: ${dto.productStrengths?.join(", ") || "Not specified"}
- Unique advantages: ${dto.uniqueAdvantage?.join(", ") || "Not specified"}

AI STRATEGY SUMMARY (use this to align messaging):
${dto.strategy?.summary || "Generate based on business context"}

CREATIVE GUIDELINES FROM STRATEGY:
- Tone: ${dto.strategy?.creativeGuidelines?.tone || "Professional yet friendly"}
- Key messages: ${dto.strategy?.creativeGuidelines?.keyMessages?.join(", ") || "Focus on value"}
- CTAs: ${dto.strategy?.creativeGuidelines?.callToActions?.join(", ") || "Contact us"}

Write all scripts in Uzbek. Make them specific to this business.
For video scripts, write exactly what the person says on camera or voiceover.
`;

    return this.aiClient.completeJson(userPrompt, systemPrompt, {
      taskType: "creative",
      agentName: "AdScriptWriter",
      temperature: 0.7,
    });
  }

  async scoreCreative(dto: {
    imageBase64: string;
    mimeType: string;
    platform: string;
    creativeType: string;
    goal: string;
    workspaceContext: any;
  }): Promise<any> {
    const systemPrompt = `
You are an expert ad creative analyst with 15+ years experience
evaluating advertising creatives for CIS markets (Uzbekistan, Kazakhstan, Russia).

Analyze the provided image/creative across exactly 10 parameters.
Be specific, honest, and actionable. Write all feedback in Uzbek language.

Respond with VALID JSON ONLY:
{
  "overallScore": 75,
  "grade": "B",
  "verdict": "needs_work",
  "verdictText": "1-2 sentence verdict in Uzbek",
  "parameters": [
    {
      "name": "Hook kuchi",
      "score": 7,
      "status": "good",
      "feedback": "specific feedback in Uzbek",
      "tip": "specific improvement tip in Uzbek"
    }
  ],
  "topStrengths": ["strength 1 in Uzbek", "strength 2", "strength 3"],
  "topIssues": ["issue 1 in Uzbek", "issue 2"],
  "improvements": ["specific fix 1 in Uzbek", "fix 2", "fix 3"],
  "platformFit": {
    "meta": 80,
    "tiktok": 45,
    "google": 70
  },
  "estimatedCtr": "1.2-1.8%",
  "abTestSuggestion": "A/B test recommendation in Uzbek"
}

The 10 parameters to evaluate (use exactly these names):
1. "Hook kuchi" — Does it stop the scroll? Is the opening compelling?
2. "Vizual sifat" — Image/video quality, resolution, professional look
3. "Matn o'qilishi" — Is text readable? Font size, contrast, placement
4. "CTA aniqligi" — Is the call-to-action clear and compelling?
5. "Rang psixologiyasi" — Color psychology, emotional response, brand colors
6. "Brend izchilligi" — Brand consistency, logo placement, style guide
7. "Auditoriya mosligi" — Does it match the target audience visually?
8. "Raqobat farqi" — Does it stand out from typical ads in this industry?
9. "Mobil optimizatsiya" — Optimized for mobile viewing? Text not too small?
10. "Platform talablari" — Meets platform specs? Correct aspect ratio? Safe zones?

Grade scale:
- A: 85-100 (Mukammal — deploy immediately)
- B: 70-84 (Yaxshi — minor tweaks)
- C: 50-69 (O'rtacha — needs improvements)
- D: 30-49 (Zaif — significant rework needed)
- F: 0-29 (Yaroqsiz — start over)

Verdict:
- "ready": score >= 70
- "needs_work": score 40-69
- "not_ready": score < 40

platformFit: Rate how well this creative fits each platform 0-100.
estimatedCtr: Estimate click-through rate based on creative quality.
`;

    const userMessage = `
Analyze this ${dto.creativeType} creative for ${dto.platform} platform.

Goal: ${dto.goal}
Business: ${dto.workspaceContext?.name || "Unknown"}
Industry: ${dto.workspaceContext?.industry || "Unknown"}
Target audience: ${dto.workspaceContext?.targetAudience || "General"}

Please evaluate this creative image and provide scores for all 10 parameters.
Write all feedback in Uzbek language.
`;

    return this.aiClient.completeVision(
      dto.imageBase64,
      dto.mimeType,
      userMessage,
      systemPrompt,
      { taskType: "vision", agentName: "CreativeScorer" },
    );
  }

  /**
   * Synthetic focus group — pre-flight test a creative against a panel of AI
   * personas built from the workspace's real target audience, BEFORE any ad
   * spend. Serves Money (cut cold-start test budget) and Trust (know before you
   * spend). One LLM call role-plays the whole panel (token-efficient); the CTR
   * band + verdict are computed in code from the personas' click intent so the
   * output is deterministic and honest (labelled an estimate).
   */
  async runFocusGroup(
    dto: FocusGroupDto,
    userId?: string,
  ): Promise<{
    personas: Array<{
      label: string;
      clickProbability: number;
      emotion: string;
      objection: string;
      whatWouldMakeMeClick: string;
    }>;
    avgClickProbability: number;
    predictedCtrRange: string;
    verdict: "ready" | "needs_work" | "not_ready";
    topObjections: string[];
    topImprovements: string[];
    winningPersona: string | null;
  }> {
    if (!isAiClientConfigured((k) => this.config.get<string>(k))) {
      throw new ServiceUnavailableException(
        "AI is not configured. Set the AI provider key on the API server.",
      );
    }
    if (!dto.adCopy && !dto.headline && !dto.imageBase64) {
      throw new BadRequestException(
        "Provide ad copy, a headline, or an image to test.",
      );
    }

    const ws = await this.loadOwnedWorkspace(dto.workspaceId, userId);
    const seeds = this.buildPersonaSeeds(ws);

    const creative = [
      dto.headline ? `Headline: ${dto.headline}` : "",
      dto.adCopy ? `Body: ${dto.adCopy}` : "",
      dto.cta ? `CTA: ${dto.cta}` : "",
      dto.imageBase64 ? "(A visual creative image is attached.)" : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You run a synthetic focus group for advertising creatives in CIS markets (Uzbekistan, Kazakhstan, Russia).
You are given a list of audience personas and one ad creative. Role-play EACH persona honestly — some will not be interested. Do NOT be optimistic; reflect real scepticism and ad-blindness.
Respond with VALID JSON ONLY:
{
  "personas": [
    { "label": "<persona label>", "clickProbability": 0.0, "emotion": "<short reaction>", "objection": "<their main hesitation>", "whatWouldMakeMeClick": "<one concrete change>" }
  ],
  "topObjections": ["<most common objection>", "..."],
  "topImprovements": ["<highest-impact fix>", "..."]
}
Rules:
- One persona object per given persona, in the same order.
- clickProbability is this persona's honest likelihood of clicking (0.0-1.0). Most everyday ads land 0.1-0.4; only a strong, relevant creative earns 0.5+.
- Write emotion/objection/whatWouldMakeMeClick and the top lists in Uzbek.`;

    const userMessage = `Business: ${ws?.name ?? "Unknown"} — ${ws?.industry ?? "general"}
Goal: ${dto.goal ?? "conversions"} · Platform: ${dto.platform ?? "meta"}
Target audience: ${ws?.targetAudience ?? "General consumers"}

Personas (role-play each):
${seeds.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Ad creative to test:
${creative}`;

    const raw = dto.imageBase64
      ? await this.aiClient.completeVision<{
          personas?: any[];
          topObjections?: string[];
          topImprovements?: string[];
        }>(
          dto.imageBase64,
          dto.mimeType ?? "image/jpeg",
          userMessage,
          systemPrompt,
          { taskType: "vision", agentName: "FocusGroup" },
        )
      : await this.aiClient.completeJson<{
          personas?: any[];
          topObjections?: string[];
          topImprovements?: string[];
        }>(userMessage, systemPrompt, {
          taskType: "strategy",
          agentName: "FocusGroup",
        });

    // ── Deterministic, code-side aggregation (not left to the model) ──────────
    const personas = (Array.isArray(raw?.personas) ? raw.personas : []).map(
      (p: any, i: number) => {
        const cp = Number(p?.clickProbability);
        return {
          label: String(p?.label ?? seeds[i] ?? `Persona ${i + 1}`),
          clickProbability: Number.isFinite(cp)
            ? Math.min(1, Math.max(0, cp))
            : 0,
          emotion: String(p?.emotion ?? ""),
          objection: String(p?.objection ?? ""),
          whatWouldMakeMeClick: String(p?.whatWouldMakeMeClick ?? ""),
        };
      },
    );

    const avg =
      personas.length > 0
        ? personas.reduce((s, p) => s + p.clickProbability, 0) / personas.length
        : 0;
    const avgClickProbability = Number(avg.toFixed(3));

    // Survey click-intent hugely overstates real CTR — map it down to a
    // plausible ad CTR band (heuristic, honestly labelled as an estimate).
    const ctrMid = Math.max(0.1, Number((avg * 3).toFixed(2)));
    const lo = Math.max(0.1, Number((ctrMid - 0.4).toFixed(1)));
    const hi = Number((ctrMid + 0.4).toFixed(1));
    const predictedCtrRange = `${lo.toFixed(1)}–${hi.toFixed(1)}%`;

    const verdict: "ready" | "needs_work" | "not_ready" =
      avg >= 0.45 ? "ready" : avg >= 0.28 ? "needs_work" : "not_ready";

    const winning = personas.length
      ? personas.reduce((a, b) =>
          b.clickProbability > a.clickProbability ? b : a,
        )
      : null;

    return {
      personas,
      avgClickProbability,
      predictedCtrRange,
      verdict,
      topObjections: (Array.isArray(raw?.topObjections)
        ? raw.topObjections
        : []
      )
        .slice(0, 4)
        .map(String),
      topImprovements: (Array.isArray(raw?.topImprovements)
        ? raw.topImprovements
        : []
      )
        .slice(0, 4)
        .map(String),
      winningPersona: winning ? winning.label : null,
    };
  }

  /**
   * Build 4-6 audience persona seeds from the workspace's real onboarding
   * strategy (geo × age combos + a value-shopper archetype). Falls back to
   * generic CIS personas when the workspace has no captured audience.
   */
  private buildPersonaSeeds(ws: Workspace | null): string[] {
    const strat = (ws?.aiStrategy ?? {}) as {
      geos?: string[];
      ageRanges?: string[];
      cjm?: string | null;
      vertical?: string | null;
    };
    const geoNames: Record<string, string> = {
      UZ: "Toshkent",
      KZ: "Olmaota",
      RU: "Moskva",
      KG: "Bishkek",
      TJ: "Dushanbe",
    };
    const geos =
      Array.isArray(strat.geos) && strat.geos.length ? strat.geos : ["UZ"];
    const ages =
      Array.isArray(strat.ageRanges) && strat.ageRanges.length
        ? strat.ageRanges
        : ["25-34", "35-44"];
    const industry = ws?.industry ?? "umumiy";

    const seeds: string[] = [];
    for (const geo of geos.slice(0, 2)) {
      const city = geoNames[geo] ?? geo;
      for (const age of ages.slice(0, 2)) {
        const gender = seeds.length % 2 === 0 ? "ayol" : "erkak";
        seeds.push(
          `${age} yoshli ${city}lik ${gender}, ${industry} sohasiga qiziqadi`,
        );
        if (seeds.length >= 5) break;
      }
      if (seeds.length >= 5) break;
    }
    // Always include a price-sensitive sceptic — the toughest audience.
    seeds.push("Narxga sezgir, reklamaga ishonchsiz tejamkor xaridor");
    return seeds.slice(0, 6);
  }

  /**
   * Chat-first "no-dashboard" launch: turn a free-text brief into a structured
   * Meta campaign proposal (objective / geo / age / budget / ad copy), seeded by
   * the workspace's onboarding defaults. Returns a PROPOSAL only — the user
   * reviews/edits it and confirms through the real launch-orchestrator, which
   * keeps this 100% Green Zone (official API, nothing auto-launched here).
   */
  async planCampaignFromBrief(
    dto: PlanCampaignDto,
    userId?: string,
  ): Promise<{
    name: string;
    objective: string;
    countries: string[];
    ageMin: number;
    ageMax: number;
    dailyBudgetUsd: number;
    headline: string;
    primaryText: string;
    cta: string;
    rationale: string;
  }> {
    if (!isAiClientConfigured((k) => this.config.get<string>(k))) {
      throw new ServiceUnavailableException(
        "AI is not configured. Set the AI provider key on the API server.",
      );
    }

    const ws = await this.loadOwnedWorkspace(dto.workspaceId, userId);
    const ld = ((ws?.aiStrategy as any)?.launchDefaults ?? {}) as {
      objective?: string;
      geos?: string[];
      ageMin?: number;
      ageMax?: number;
      dailyBudgetUsd?: number;
    };
    const OBJECTIVES = [
      "awareness",
      "traffic",
      "engagement",
      "leads",
      "app_promotion",
      "sales",
    ];

    const systemPrompt = `You are a media buyer. Turn a business owner's free-text brief into a Meta (Facebook/Instagram) ad campaign plan.
Respond with VALID JSON ONLY:
{
  "name": "<short campaign name>",
  "objective": "one of: awareness | traffic | engagement | leads | app_promotion | sales",
  "countries": ["UZ"],
  "ageMin": 18,
  "ageMax": 45,
  "dailyBudgetUsd": 10,
  "headline": "<ad headline>",
  "primaryText": "<primary ad text>",
  "cta": "one of: LEARN_MORE | SHOP_NOW | SIGN_UP | CONTACT_US | GET_OFFER",
  "rationale": "<one short sentence explaining the plan>"
}
Rules:
- Use the provided DEFAULTS when the brief does not specify geo / age / budget.
- countries are ISO-2 codes (UZ, KZ, RU, ...).
- Write name / headline / primaryText / rationale in the SAME language as the brief (Uzbek or Russian).`;

    const userMessage = `Business: ${ws?.name ?? "Unknown"} — ${ws?.industry ?? "general"}
DEFAULTS (from onboarding): objective=${ld.objective ?? "leads"}, geos=${(ld.geos ?? ["UZ"]).join(",")}, age=${ld.ageMin ?? 18}-${ld.ageMax ?? 45}, dailyBudgetUsd=${ld.dailyBudgetUsd ?? 10}
${dto.imageBase64 ? "(A product image is attached.)\n" : ""}Owner's brief:
${dto.brief}`;

    const raw = dto.imageBase64
      ? await this.aiClient.completeVision<any>(
          dto.imageBase64,
          dto.mimeType ?? "image/jpeg",
          userMessage,
          systemPrompt,
          { taskType: "vision", agentName: "ChatLaunch" },
        )
      : await this.aiClient.completeJson<any>(userMessage, systemPrompt, {
          taskType: "strategy",
          agentName: "ChatLaunch",
        });

    // ── Code-side normalisation (never trust the model blindly) ───────────────
    const objective = OBJECTIVES.includes(String(raw?.objective))
      ? String(raw.objective)
      : (ld.objective ?? "leads");
    // Keep only well-formed ISO-2 codes — a full name like "Kazakhstan" sliced
    // to "KA" is invalid and Meta would reject it, so drop non-2-letter tokens
    // and fall back to the onboarding geos when nothing valid remains.
    const validCountries: string[] = (
      Array.isArray(raw?.countries) ? raw.countries : []
    )
      .map((c: any) => String(c).trim().toUpperCase())
      .filter((c: string) => /^[A-Z]{2}$/.test(c));
    const countries: string[] = validCountries.length
      ? Array.from(new Set(validCountries))
      : (ld.geos ?? ["UZ"]);
    const clampAge = (n: any, def: number) => {
      const v = Math.round(Number(n));
      return Number.isFinite(v) ? Math.min(65, Math.max(13, v)) : def;
    };
    let ageMin = clampAge(raw?.ageMin, ld.ageMin ?? 18);
    let ageMax = clampAge(raw?.ageMax, ld.ageMax ?? 45);
    if (ageMin >= ageMax) {
      ageMin = ld.ageMin ?? 18;
      ageMax = ld.ageMax ?? 45;
    }
    const budget = Number(raw?.dailyBudgetUsd);
    const dailyBudgetUsd =
      Number.isFinite(budget) && budget >= 1
        ? Math.round(budget)
        : (ld.dailyBudgetUsd ?? 10);
    const CTAS = [
      "LEARN_MORE",
      "SHOP_NOW",
      "SIGN_UP",
      "CONTACT_US",
      "GET_OFFER",
    ];
    const cta = CTAS.includes(String(raw?.cta))
      ? String(raw.cta)
      : "LEARN_MORE";

    return {
      name: String(raw?.name ?? "Yangi kampaniya").slice(0, 120),
      objective,
      countries,
      ageMin,
      ageMax,
      dailyBudgetUsd,
      headline: String(raw?.headline ?? "").slice(0, 300),
      primaryText: String(raw?.primaryText ?? "").slice(0, 2000),
      cta,
      rationale: String(raw?.rationale ?? "").slice(0, 300),
    };
  }

  /**
   * Wizard: Generate ad copy (headlines + descriptions) for the campaign wizard.
   * Returns platform-specific headlines and descriptions ready to use in the form.
   */
  async generateWizardAdCopy(dto: {
    productName: string;
    benefits: string[];
    objective: string;
    audience: string;
    platform: string;
  }): Promise<{
    headlines: string[];
    descriptions: string[];
    cta: string;
    primaryText?: string;
  }> {
    const charLimits: Record<
      string,
      { headline: number; description: number }
    > = {
      google: { headline: 30, description: 90 },
      yandex: { headline: 56, description: 81 },
      meta: { headline: 40, description: 125 },
    };
    const limits = charLimits[dto.platform] || charLimits.meta;

    const systemPrompt = `You are a professional ad copywriter.
Generate ad copy for the given product and platform.
Respond with VALID JSON ONLY matching this exact structure:
{
  "headlines": ["headline1", "headline2", ...],
  "descriptions": ["desc1", "desc2", ...],
  "cta": "CTA text",
  "primaryText": "primary text for social ads"
}
Rules:
- Each headline must be max ${limits.headline} characters
- Each description must be max ${limits.description} characters
- Generate 5 headlines and 3 descriptions
- Write in the same language as the product name (Uzbek/Russian/English)`;

    const userMessage = `
Platform: ${dto.platform}
Product: ${dto.productName}
Benefits: ${dto.benefits.join(", ")}
Objective: ${dto.objective}
Target audience: ${dto.audience}`;

    const result = await this.aiClient.completeJson<{
      headlines: string[];
      descriptions: string[];
      cta: string;
      primaryText?: string;
    }>(userMessage, systemPrompt, {
      taskType: "creative",
      agentName: "WizardAdCopy",
    });

    return result;
  }

  /**
   * Wizard: Generate keyword suggestions for the campaign wizard.
   */
  async generateWizardKeywords(dto: {
    productName: string;
    niche: string;
    platform: string;
    matchType?: string;
  }): Promise<{
    keywords: string[];
    negativeKeywords: string[];
    matchTypes: Record<string, string>;
  }> {
    const systemPrompt = `You are a PPC keyword research expert.
Generate keyword suggestions for the given product and niche.
Respond with VALID JSON ONLY:
{
  "keywords": ["keyword1", "keyword2", ...],
  "negativeKeywords": ["neg1", "neg2", ...],
  "matchTypes": {"keyword1": "broad", "keyword2": "exact", ...}
}
Rules:
- Generate 10-15 relevant keywords
- Generate 5-8 negative keywords
- Assign appropriate match types (broad/phrase/exact)
- Write keywords in the same language as product name`;

    const userMessage = `
Product: ${dto.productName}
Niche: ${dto.niche}
Platform: ${dto.platform}
Preferred match type: ${dto.matchType || "broad"}`;

    return this.aiClient.completeJson<{
      keywords: string[];
      negativeKeywords: string[];
      matchTypes: Record<string, string>;
    }>(userMessage, systemPrompt, {
      taskType: "creative",
      agentName: "WizardKeywords",
    });
  }
}
