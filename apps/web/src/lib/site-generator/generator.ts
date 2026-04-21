import {
  buildCourseBenefits,
  buildCourseHeadline,
  buildFashionBenefits,
  buildFashionHeadline,
  formatPriceUzs,
} from './copy-ai-stub'
import { blueprintFor } from './templates'
import type { LandingPageSpec, LandingSection, OnboardingBriefInput, SiteTemplateId } from './types'

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614158?w=800&q=80',
]

function reviews(templateId: SiteTemplateId) {
  if (templateId === 'course') {
    return [
      { name: 'Dilshod', text: "Darslar tushunarli, amaliyot ko'p. Ishga oldim.", rating: 5 },
      { name: 'Madina', text: 'Mentor javoblari tez. Kursga arziydi.', rating: 5 },
      { name: 'Jasur', text: "Portfolio uchun loyiha qildim — HR ga yubordim.", rating: 4 },
    ]
  }
  return [
    { name: 'Nilufar', text: "Oyoq og'rimaydi dedilar — haqiqatan yengil.", rating: 5 },
    { name: 'Aziza', text: 'Yetkazish tez, qadoqlash chiroyli.', rating: 5 },
    { name: 'Kamola', text: "Razmer to'g'ri keldi, sifat zo'r.", rating: 5 },
  ]
}

function faq(input: OnboardingBriefInput, templateId: SiteTemplateId) {
  const price = formatPriceUzs(input.priceUzs)
  if (templateId === 'course') {
    return [
      { q: 'Kurs qancha davom etadi?', a: "Odatda 4-6 hafta, o'zingiz tezligingizga mos." },
      { q: 'To‘lov qanday?', a: 'Click yoki Payme orqali onlayn.' },
      { q: 'Sertifikat bormi?', a: 'Ha, yakuniy testdan keyin beriladi.' },
    ]
  }
  return [
      {
        q: 'Yetkazib berish qancha vaqt?',
        a: (input.utp || '').toLowerCase().includes('yetkaz')
          ? input.utp
          : "Toshkent: 1 kun, viloyat: 2-3 kun.",
      },
    { q: 'Almashish bormi?', a: "14 kun ichida ishlatilmagan holatda — ha." },
    { q: 'Narx qancha?', a: `Hozirgi narx: ${price}.` },
  ]
}

/**
 * Onboarding + shablon → mobil-first landing spec (JSON).
 * Keyin: Template Engine → deploy (Vercel), pixel/CAPI inject.
 */
export function buildLandingSpec(
  input: OnboardingBriefInput,
  templateId: SiteTemplateId,
  locale: 'uz' | 'ru' = 'uz',
): LandingPageSpec {
  const brand = input.brandName?.trim() || "Savdo"
  const headline =
    templateId === 'course' ? buildCourseHeadline(input) : buildFashionHeadline(input)
  const benefits =
    templateId === 'course' ? buildCourseBenefits(input) : buildFashionBenefits(input)
  const imgs = (input.imageUrls?.length ? input.imageUrls : PLACEHOLDER_IMAGES).slice(0, 5)

  const bp = blueprintFor(templateId)
  const sections: LandingSection[] = bp.map((b) => {
    switch (b.type) {
      case 'hero':
        return {
          ...b,
          headline,
          subheadline: `${formatPriceUzs(input.priceUzs)} · ${input.audienceSummary}`,
          ctaLabel: "Hoziroq buyurtma",
          ctaHref: '#lead',
        }
      case 'problem_solution':
        return {
          ...b,
          headline: templateId === 'course' ? 'Muammo' : 'Tanaffus yo‘q — oyoq charchaydi',
          body:
            templateId === 'course'
              ? "Bo'sh vaqt kam, tizimli o'rganish kerak — lekin kontent tarqalgan."
              : "Ko'p krossovkalar 2-3 soatdan keyin bosim beradi. Sizning mijozingiz esa kun bo'yi harakatda.",
          items: [
            {
              title: templateId === 'course' ? 'Yechim' : 'Yechim',
              body:
                templateId === 'course'
                  ? 'Qisqa modullar, amaliy topshiriqlar, mentor bilan yo‘l-yo‘riq.'
                  : `${input.productTitle} — yengil podoshva, ventilyatsiya, ${input.utp}.`,
            },
          ],
        }
      case 'gallery':
        return {
          ...b,
          headline: 'Galereya',
          images: imgs,
        }
      case 'utp':
        return {
          ...b,
          headline: "Nega biz?",
          bullets: benefits,
        }
      case 'reviews':
        return { ...b, headline: 'Mijozlar fikri (boshlang‘ich — keyin real)', testimonials: reviews(templateId) }
      case 'faq':
        return { ...b, headline: 'FAQ', faq: faq(input, templateId) }
      case 'lead_form':
        return {
          ...b,
          headline: 'Buyurtma',
          subheadline: 'Ism va telefon — keyin Click / Payme',
          ctaLabel: 'Davom etish',
          ctaHref: '#pay',
        }
      case 'payment_embed':
        return {
          ...b,
          headline: "To'lov",
          body: "Click.uz / Payme vidjeti shu yerga embed qilinadi (integratsiya bosqichi).",
        }
      case 'tech_strip':
        return {
          ...b,
          headline: 'Texnik professional',
          bullets: [
            'Mobile-first (92% mobil)',
            "Vercel edge — maqsad <1.5s TTFB",
            'Meta Pixel + CAPI avtomatik slotlari',
            'Schema.org + Open Graph',
            "O'zbek / Rus tilida kontent",
          ],
        }
      case 'footer':
        return {
          ...b,
          headline: brand,
          body: input.phone
            ? `Aloqa: ${input.phone}${input.telegramUsername ? ` · @${input.telegramUsername.replace(/^@/, '')}` : ''}`
            : 'Aloqa: Telegram orqali',
        }
      default:
        return { ...b }
    }
  })

  const siteTitle = `${brand} — ${input.productTitle}`

  return {
    templateId,
    locale,
    siteTitle,
    sections,
    seo: {
      title: siteTitle,
      description: headline.slice(0, 155),
      ogImageUrl: imgs[0],
    },
    integrations: {
      metaPixelNote:
        'Subdomain deploy bilan `NEXT_PUBLIC_META_PIXEL_ID` — eventlar server-side CAPI orqali Signal Bridge ga ham yoziladi.',
      capiNote: "O'z domeningizda birinchi-party cookie — event yo'qolishi kamayadi.",
      signalBridgeNote:
        "Forma `submit` → `POST /api/crm/click` yoki maxsus `purchase` webhook — retarget 7 kun bilan bir xil tizim.",
      paymeClickNote: 'Checkout: Click / Payme iframe yoki redirect — keyingi sprint.',
      creativeAuditNote: "Galereya rasmlarini `/creative-audit` orqali tekshiring — brend va format.",
    },
    optimization: {
      abHeadlines: [headline, `${input.productTitle} — chegirma + ${input.utp}`.slice(0, 120)],
      heatmapNote: 'Microsoft Clarity yoki Hotjar snippet — forma pastda qolsa AI tavsiya beradi.',
      aiSuggestionNote: "3 kundan keyin yaxshi headline qoladi (A/B — Pro $9/oy rejasi).",
    },
  }
}
