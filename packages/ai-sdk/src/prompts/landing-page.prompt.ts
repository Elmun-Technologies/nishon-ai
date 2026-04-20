/**
 * AI prompt for generating landing page content for Uzbek businesses.
 * The AI generates structured JSON — we render it with our React template.
 */
export const LANDING_PAGE_SYSTEM_PROMPT = `
You are AdSpectr Landing — an expert at creating high-converting landing pages for small businesses in Uzbekistan.

Your job is to generate compelling, conversion-focused landing page content in UZBEK language based on the business data provided.

Write like a professional copywriter who understands the Uzbek consumer psychology:
- Be direct and benefit-focused
- Use trust-building language ("kafolat", "sertifikatlangan", "ishonchli")
- Include urgency when appropriate
- Speak to the specific audience's pain points and desires
- Keep CTA buttons action-oriented

YOU MUST RESPOND WITH VALID JSON ONLY — the following structure:
{
  "headline": "Main headline — max 10 words, bold claim or benefit",
  "subheadline": "Supporting sentence — 1-2 lines, clarifies the headline",
  "description": "About paragraph — 2-3 sentences describing the business, what makes it special",
  "ctaText": "Call to action button text — 2-5 words (e.g. 'Hozir buyurtma bering')",
  "ctaSubtext": "Below button text — reassurance, e.g. 'Bepul konsultatsiya • Javob 5 daqiqada'",
  "urgencyText": "Urgency/offer text — e.g. 'Bu hafta 20% chegirma!' (can be null if not appropriate)",
  "socialProof": "Social proof stat — e.g. '1200+ mamnun mijoz'",
  "colorScheme": "ONE OF: blue | pink | green | orange | purple | navy | red (choose based on industry: beauty=pink, tech=blue, food=orange, health=green, luxury=purple, business=navy)",
  "trustBadges": ["✓ Badge 1", "✓ Badge 2", "✓ Badge 3"],
  "features": [
    {
      "icon": "⚡",
      "title": "Feature title — 2-4 words",
      "description": "Feature description — 1 sentence"
    }
  ],
  "testimonials": [
    {
      "name": "Uzbek name",
      "role": "Role or city — e.g. 'Toshkent, 32 yosh'",
      "text": "Review text — 1-2 sentences, realistic, specific",
      "rating": 5
    }
  ],
  "faq": [
    {
      "question": "Common question",
      "answer": "Clear, helpful answer"
    }
  ],
  "sections": ["hero", "social_proof", "features", "about", "testimonials", "faq", "contact"]
}

RULES:
- Generate exactly 3-5 features
- Generate exactly 2-3 testimonials (realistic Uzbek names, not generic)
- Generate exactly 3-5 FAQ items based on likely customer questions
- sections array controls display order — always start with "hero", end with "contact"
- All text MUST be in Uzbek language
- colorScheme must match the industry/brand feel
- trustBadges: exactly 3 badges
- Respond ONLY with the JSON object. No preamble, no explanation.
`

/** Preset layout + tone hints for the generator (Uzbek market). */
export type LandingPageTemplateId =
  | 'local_service'
  | 'product_store'
  | 'saas_b2b'
  | 'promo_event'

const TEMPLATE_INSTRUCTIONS: Record<LandingPageTemplateId, string> = {
  local_service:
    'SHABLON: mahalliy xizmat / ustaxona / klinika / oquv markaz. Hero qisqa va ishonchli; telefon va WhatsApp CTA ustun; ijtimoiy isbot va joylashuv ishonchi muhim.',
  product_store:
    'SHABLON: mahsulot / do\'kon / e-commerce. Hero mahsulot foydasi va vizual tasvir; xususiyatlar ro\'yxati aniq; chegirma/yetkazib berish kabi aniq takliflar.',
  saas_b2b:
    'SHABLON: B2B / SaaS / agentlik. Professional ton; muammo-yechim; ishonch (logo, raqamlar); FAQ texnik savollar uchun; CTA "demo" yoki "bog\'lanish".',
  promo_event:
    'SHABLON: aksiya / tadbir / muddatli kampaniya. Shoshilinchlik va aniq muddat; bir ekranda asosiy taklif; CTA qisqa va harakatga chaqiruvchi.',
}

export const buildLandingPagePrompt = (data: {
  businessName: string
  industry: string
  productDescription: string
  targetAudience: string
  goal: string
  uniqueAdvantage?: string
  priceRange?: string
  strategy?: {
    summary?: string
    creativeGuidelines?: {
      tone?: string
      keyMessages?: string[]
      callToActions?: string[]
    }
  }
  /** Layout / tone preset */
  templateId?: LandingPageTemplateId
  /** Free-form marketer brief */
  creativeBrief?: string
  /** Short Uzbek descriptions from vision pass (product/office/brand photos) */
  visualSummaries?: string[]
}): string => {
  const templateKey: LandingPageTemplateId =
    data.templateId && data.templateId in TEMPLATE_INSTRUCTIONS ? data.templateId : 'local_service'
  const templateBlock = TEMPLATE_INSTRUCTIONS[templateKey]
  const briefBlock = data.creativeBrief?.trim()
    ? `Qo'shimcha brif (foydalanuvchi):\n${data.creativeBrief.trim()}`
    : ''
  const visualBlock =
    data.visualSummaries && data.visualSummaries.length > 0
      ? `Foydalanuvchi yuklagan rasmlar bo'yicha qisqa vizual tahlil (matn):\n${data.visualSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}\nMatn va trust badge'larda ushbu tasvirlarga mos keladigan ifodalarni ishlating (o'ylab topilgan faktlarni qo'shmang).`
      : ''

  return `
Quyidagi biznes uchun Uzbek tilida yuqori konversiyali landing page kontentini yarating:

${templateBlock}

Biznes nomi: ${data.businessName}
Soha: ${data.industry}
Mahsulot/Xizmat: ${data.productDescription}
${data.uniqueAdvantage ? `Raqobat ustunligi: ${data.uniqueAdvantage}` : ''}
${data.priceRange ? `Narx diapazoni: ${data.priceRange}` : ''}
Maqsadli auditoriya: ${data.targetAudience}
Asosiy maqsad: ${data.goal}
${data.strategy?.summary ? `AI Strategiya xulosasi: ${data.strategy.summary}` : ''}
${data.strategy?.creativeGuidelines?.tone ? `Ton: ${data.strategy.creativeGuidelines.tone}` : ''}
${data.strategy?.creativeGuidelines?.keyMessages?.length ? `Asosiy xabarlar: ${data.strategy.creativeGuidelines.keyMessages.join(', ')}` : ''}
${briefBlock ? `\n${briefBlock}\n` : ''}
${visualBlock ? `\n${visualBlock}\n` : ''}

Landing page kontentini hozir yarating.
`
}
