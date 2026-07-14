/**
 * Client-side ad-copy generator for the AI Agent setup preview.
 *
 * Detects the business vertical from the entered website/channel link (or any
 * free text) via keyword matching, then returns curated TOFU / MOFU / BOFU ad
 * copy so the setup feels like the agent has already done the marketing work.
 *
 * Pure and deterministic — no network, no LLM cost. A "Regenerate with AI"
 * path (calling the real ai-agent endpoint) can be layered on later.
 */

import type { FunnelStage } from './funnel-allocator'

export type Vertical = 'apparel' | 'education' | 'food' | 'generic'

export type CopyLang = 'uz' | 'ru' | 'en'

export interface AdCopy {
  headline: string
  body: string
  cta: string
}

/** Keyword sets per vertical (matched case-insensitively against the input). */
const VERTICAL_KEYWORDS: Record<Exclude<Vertical, 'generic'>, string[]> = {
  apparel: [
    'cloth',
    'kiyim',
    'fashion',
    'moda',
    'wear',
    'shop',
    "do'kon",
    'dokon',
    'brand',
    'style',
    'boutique',
    'apparel',
    'garment',
  ],
  education: [
    'edu',
    'kurs',
    'course',
    'school',
    'maktab',
    "ta'lim",
    'talim',
    'academy',
    'akademiya',
    'learn',
    'o‘quv',
    'oquv',
    'universitet',
    'university',
    'tutor',
    'english',
    'ielts',
  ],
  food: [
    'pizza',
    'food',
    'cafe',
    'kafe',
    'restoran',
    'restaurant',
    'ovqat',
    'taom',
    'burger',
    'sushi',
    'kitchen',
    'oshxona',
    'coffee',
    'kofe',
    'bakery',
  ],
}

/** Detect the vertical from a link or arbitrary text. Falls back to "generic". */
export function detectVertical(input: string): Vertical {
  const text = (input || '').toLowerCase()
  for (const [vertical, keywords] of Object.entries(VERTICAL_KEYWORDS) as [
    Exclude<Vertical, 'generic'>,
    string[],
  ][]) {
    if (keywords.some((k) => text.includes(k))) return vertical
  }
  return 'generic'
}

type CopyBook = Record<Vertical, Record<FunnelStage, Record<CopyLang, AdCopy>>>

const c = (headline: string, body: string, cta: string): AdCopy => ({
  headline,
  body,
  cta,
})

/**
 * The copy book. Each cell is a distinct message tuned to the funnel stage:
 *   TOFU — attention / brand hook (cold)
 *   MOFU — value / consideration (warm)
 *   BOFU — urgency / conversion (hot / retargeting)
 */
const COPY: CopyBook = {
  apparel: {
    TOFU: {
      uz: c(
        'Yangi mavsum keldi 🔥',
        "Sizning uslubingizni aks ettiruvchi kolleksiya. Instagram va TikTok'da hoziroq ko'ring.",
        "Kolleksiyani ko'rish",
      ),
      ru: c(
        'Новый сезон уже здесь 🔥',
        'Коллекция, отражающая ваш стиль. Смотрите прямо сейчас в Instagram и TikTok.',
        'Смотреть коллекцию',
      ),
      en: c(
        'The new drop is here 🔥',
        'A collection that matches your style. See it now on Instagram and TikTok.',
        'View the collection',
      ),
    },
    MOFU: {
      uz: c(
        'Nega aynan biz?',
        "Premium sifat, qulay narx va bepul yetkazib berish. Mijozlarimiz nima deydi — o'zingiz ko'ring.",
        'Batafsil',
      ),
      ru: c(
        'Почему именно мы?',
        'Премиум-качество, доступная цена и бесплатная доставка. Смотрите отзывы наших клиентов.',
        'Подробнее',
      ),
      en: c(
        'Why choose us?',
        'Premium quality, fair prices and free delivery. See what our customers say.',
        'Learn more',
      ),
    },
    BOFU: {
      uz: c(
        "Savatingiz sizni kutmoqda 🛒",
        "Faqat bugun: -15% chegirma va bepul yetkazib berish. Buyurtmangizni yakunlang.",
        'Xarid qilish',
      ),
      ru: c(
        'Ваша корзина ждёт вас 🛒',
        'Только сегодня: скидка −15% и бесплатная доставка. Завершите заказ.',
        'Купить сейчас',
      ),
      en: c(
        'Your cart is waiting 🛒',
        'Today only: −15% off and free delivery. Complete your order.',
        'Buy now',
      ),
    },
  },
  education: {
    TOFU: {
      uz: c(
        '0 dan natijaga 🚀',
        "Amaliy kurslar bilan yangi kasbni egallang. Birinchi dars — bepul.",
        'Bepul darsni boshlash',
      ),
      ru: c(
        'С нуля до результата 🚀',
        'Освойте новую профессию на практических курсах. Первый урок — бесплатно.',
        'Начать бесплатный урок',
      ),
      en: c(
        'From zero to results 🚀',
        'Master a new profession with hands-on courses. First lesson is free.',
        'Start the free lesson',
      ),
    },
    MOFU: {
      uz: c(
        'Bitiruvchilarimiz ish topmoqda',
        "Mentor qo'llab-quvvatlashi, real loyihalar va sertifikat. Dasturni ko'rib chiqing.",
        "Dasturni ko'rish",
      ),
      ru: c(
        'Наши выпускники находят работу',
        'Поддержка ментора, реальные проекты и сертификат. Изучите программу.',
        'Смотреть программу',
      ),
      en: c(
        'Our graduates get hired',
        'Mentor support, real projects and a certificate. Explore the curriculum.',
        'View the curriculum',
      ),
    },
    BOFU: {
      uz: c(
        "Joylar tugab bormoqda ⏳",
        "Keyingi guruhga -20% chegirma faqat shu hafta. O'rningizni band qiling.",
        "Ro'yxatdan o'tish",
      ),
      ru: c(
        'Места заканчиваются ⏳',
        'Скидка −20% на следующий поток только на этой неделе. Забронируйте место.',
        'Записаться',
      ),
      en: c(
        'Seats are filling up ⏳',
        '−20% off the next cohort this week only. Reserve your spot.',
        'Enroll now',
      ),
    },
  },
  food: {
    TOFU: {
      uz: c(
        'Ochlik? Biz shu yerdamiz 🍕',
        "Issiq, mazali va 30 daqiqada eshigingizda. Menyuni ko'ring.",
        "Menyuni ko'rish",
      ),
      ru: c(
        'Проголодались? Мы рядом 🍕',
        'Горячее, вкусное и у вашей двери за 30 минут. Смотрите меню.',
        'Смотреть меню',
      ),
      en: c(
        'Hungry? We’ve got you 🍕',
        'Hot, delicious and at your door in 30 minutes. Check the menu.',
        'See the menu',
      ),
    },
    MOFU: {
      uz: c(
        'Yangi masalliqlar, sevimli ta’m',
        "Har kuni yangi tayyorlanadi. Kombo takliflar bilan tejang.",
        'Kombolarni ko‘rish',
      ),
      ru: c(
        'Свежие ингредиенты, любимый вкус',
        'Готовим каждый день. Экономьте с комбо-предложениями.',
        'Смотреть комбо',
      ),
      en: c(
        'Fresh ingredients, familiar taste',
        'Made fresh daily. Save more with our combo deals.',
        'View combos',
      ),
    },
    BOFU: {
      uz: c(
        "Buyurtmangizni yakunlang 🔥",
        "Bugun: bepul yetkazib berish + ikkinchi taomga -50%. Endi buyurtma bering.",
        'Buyurtma berish',
      ),
      ru: c(
        'Завершите заказ 🔥',
        'Сегодня: бесплатная доставка + −50% на второе блюдо. Закажите сейчас.',
        'Заказать',
      ),
      en: c(
        'Finish your order 🔥',
        'Today: free delivery + 50% off your second dish. Order now.',
        'Order now',
      ),
    },
  },
  generic: {
    TOFU: {
      uz: c(
        'Biznesingiz uchun yangi mijozlar',
        "Sizni qidirayotgan auditoriyaga yeting. Nima taklif qilishingizni ko'rsating.",
        'Batafsil',
      ),
      ru: c(
        'Новые клиенты для вашего бизнеса',
        'Дотянитесь до аудитории, которая ищет вас. Покажите, что вы предлагаете.',
        'Подробнее',
      ),
      en: c(
        'New customers for your business',
        'Reach the audience already looking for you. Show them what you offer.',
        'Learn more',
      ),
    },
    MOFU: {
      uz: c(
        'Nega bizni tanlashadi',
        "Ishonchli xizmat, aniq natija. Mijozlar tajribasi bilan tanishing.",
        "Ko'proq bilish",
      ),
      ru: c(
        'Почему выбирают нас',
        'Надёжный сервис и понятный результат. Познакомьтесь с опытом клиентов.',
        'Узнать больше',
      ),
      en: c(
        'Why customers choose us',
        'Reliable service, clear results. See our customers’ experience.',
        'Learn more',
      ),
    },
    BOFU: {
      uz: c(
        "Bugun boshlang 🚀",
        "Cheklangan taklif — hoziroq bog'laning va birinchi natijani oling.",
        'Bog‘lanish',
      ),
      ru: c(
        'Начните сегодня 🚀',
        'Ограниченное предложение — свяжитесь сейчас и получите первый результат.',
        'Связаться',
      ),
      en: c(
        'Get started today 🚀',
        'Limited offer — get in touch now and see your first result.',
        'Contact us',
      ),
    },
  },
}

/** Get ad copy for a vertical + funnel stage + language (defaults to uz). */
export function adCopyFor(
  vertical: Vertical,
  stage: FunnelStage,
  lang: CopyLang = 'uz',
): AdCopy {
  const book = COPY[vertical] ?? COPY.generic
  const perStage = book[stage]
  return perStage[lang] ?? perStage.uz
}
