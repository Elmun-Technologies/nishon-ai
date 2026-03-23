import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import {
  StrategyEngineService,
  StrategyResult,
} from "./strategy-engine.service";
import { DecisionLoopService } from "./decision-loop.service";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { ConfigService } from "@nestjs/config";
import { NishonAiClient } from "@nishon/ai-sdk";

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
  private readonly aiClient: NishonAiClient;

  constructor(
    private readonly strategyEngine: StrategyEngineService,
    private readonly decisionLoop: DecisionLoopService,
    private readonly config: ConfigService,
  ) {
    const apiKey  = this.config.get<string>("AGENT_ROUTER_API_KEY", "");
    const baseURL =
      (this.config.get<string>("AGENT_ROUTER_BASE_URL") || "https://agentrouter.org")
        .replace(/\/$/, "") + "/v1";
    this.aiClient = new NishonAiClient(apiKey, baseURL);
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

  async approveDecision(decisionId: string): Promise<void> {
    // TODO: load decision, set isApproved = true, then executeDecision
    this.logger.log(`Decision approved: ${decisionId}`);
  }

  async rejectDecision(decisionId: string): Promise<void> {
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
  }): Promise<{ reply: string }> {
    const systemPrompt = `You are Nishon AI — a helpful advertising assistant for the Nishon AI platform.
You help users understand their Meta ad campaign performance, troubleshoot errors, and optimize their strategy.
You have knowledge about Meta Ads (Facebook/Instagram), campaign budgets, CTR, ROAS, CPM, CPC metrics.
Answer in the same language the user writes in (Uzbek, Russian, or English).
Be concise, practical, and friendly. When giving advice, use concrete numbers from context if available.
If asked about a specific campaign or metric, explain what it means and what actions to take.
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
      temperature: 0.7,
      maxTokens: 500,
    });

    return { reply: result.content };
  }

  /**
   * Competitor analysis — 12-category marketing audit (72 sub-parameters).
   * Returns a rich JSON that the frontend renders as a comparison table.
   */
  async analyzeCompetitor(dto: {
    workspaceId: string
    competitor: { name: string; instagram: string; website: string }
    businessContext: any
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
`

    const userPrompt = `
Analyze this competitor vs our client:

OUR CLIENT:
- Business: ${dto.businessContext.name ?? 'Unknown'}
- Industry: ${dto.businessContext.industry ?? 'Unknown'}
- Description: ${dto.businessContext.productDescription ?? 'Not provided'}
- Location: ${dto.businessContext.targetLocation ?? 'Uzbekistan'}
- Monthly budget: $${dto.businessContext.monthlyBudget ?? 500}
- Goal: ${dto.businessContext.goal ?? 'leads'}
- Existing strategy summary: ${dto.businessContext.aiStrategy?.summary ?? 'Not generated'}

COMPETITOR:
- Name: ${dto.competitor.name}
- Instagram: ${dto.competitor.instagram || 'Not provided'}
- Website: ${dto.competitor.website || 'Not provided'}

Please analyze both businesses across all 12 categories and 72 sub-parameters.
Use the Instagram and website URLs to gather real insights about the competitor.
Be specific, actionable, and write all notes in Uzbek language.
`

    try {
      return await this.aiClient.completeJson(userPrompt, systemPrompt, {
        taskType: 'competitor',
        agentName: 'CompetitorAnalysis',
        temperature: 0.3,
      })
    } catch (err: any) {
      const detail = err?.message || String(err)
      this.logger.error(`Competitor analysis failed: ${detail}`)
      throw new InternalServerErrorException(
        `AI tahlil amalga oshmadi: ${detail.slice(0, 200)}`
      )
    }
  }

  async generateAdScripts(workspaceId: string, dto: any): Promise<any> {
    const platforms: string[] = dto.platforms || ["meta"]

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
`

    const platformDetails: Record<string, string> = {
      meta: "Meta: 3 video scripts (30 sec each, 9:16 vertical) + 7 banner copies",
      google: "Google: 15 headlines (max 30 chars) + 4 descriptions (max 90 chars) for RSA",
      tiktok: "TikTok: 3 UGC-style scripts (casual, authentic, 15-60 sec)",
      youtube: "YouTube: 1 skippable ad script (5-sec hook + 30-sec body)",
      telegram: "Telegram: 3 channel post ads with emojis and formatting",
    }

    const requestedPlatformDetails = platforms
      .map((p) => platformDetails[p] || p)
      .join("\n")

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
`

    return this.aiClient.completeJson(userPrompt, systemPrompt, {
      taskType: 'creative',
      agentName: 'AdScriptWriter',
      temperature: 0.7,
    })
  }

  async scoreCreative(dto: {
    imageBase64: string
    mimeType: string
    platform: string
    creativeType: string
    goal: string
    workspaceContext: any
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
`

    const userMessage = `
Analyze this ${dto.creativeType} creative for ${dto.platform} platform.

Goal: ${dto.goal}
Business: ${dto.workspaceContext?.name || 'Unknown'}
Industry: ${dto.workspaceContext?.industry || 'Unknown'}
Target audience: ${dto.workspaceContext?.targetAudience || 'General'}

Please evaluate this creative image and provide scores for all 10 parameters.
Write all feedback in Uzbek language.
`

    return this.aiClient.completeVision(
      dto.imageBase64,
      dto.mimeType,
      userMessage,
      systemPrompt,
      { taskType: 'vision', agentName: 'CreativeScorer' },
    )
  }
}
