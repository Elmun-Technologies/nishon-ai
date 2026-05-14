import {
  BarChart3,
  Brain,
  CreditCard,
  Crown,
  GitBranch,
  Layers3,
  type LucideIcon,
  Rocket,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react'

export type CategoryId = 'execution' | 'aiOpt' | 'analytics' | 'governance'

export interface FeatureStep {
  title: string
  desc: string
}

export interface FeatureFaq {
  q: string
  a: string
}

export interface FeatureContent {
  slug: string
  category: CategoryId
  icon: LucideIcon
  hero: {
    eyebrow: string
    title: string
    description: string
  }
  /** Metadata shown in the URL bar of the animation mock-up frame. */
  mockHeader: string
  bullets: { title: string; desc: string }[]
  steps: FeatureStep[]
  faq: FeatureFaq[]
  related: string[]
  cta?: { label: string; href: string }
  /** Short SEO description (~155 chars). */
  seoDescription: string
}

const ONBOARDING = '/onboarding'

export const FEATURE_CATEGORY_LABEL: Record<CategoryId, string> = {
  execution: 'Запуск кампаний',
  aiOpt: 'AI и оптимизация',
  analytics: 'Аналитика и интеллект',
  governance: 'Workspace, команда и финансы',
}

export const FEATURE_CONTENT: Record<string, FeatureContent> = {
  // ──────────────────────────────── EXECUTION ─────────────────────────────────
  'launch-wizard': {
    slug: 'launch-wizard',
    category: 'execution',
    icon: Rocket,
    hero: {
      eyebrow: 'Запуск кампаний',
      title: 'Мастер запуска',
      description:
        'Пошаговая настройка цели, аудитории, бюджета и креативов — без переключения между рекламными кабинетами.',
    },
    mockHeader: 'launch wizard',
    bullets: [
      { title: 'Один поток', desc: 'Meta, Google и TikTok запускаются из одной формы.' },
      { title: 'Шаблоны по нишам', desc: 'E-commerce, агентство, оффлайн — пресеты под вашу воронку.' },
      { title: 'Проверка перед публикацией', desc: 'Чек-листы Pixel, бюджета и креативов перед запуском.' },
      { title: 'Сохранённые черновики', desc: 'Команда продолжает с того места, где остановился коллега.' },
    ],
    steps: [
      { title: 'Цель и KPI', desc: 'Выберите бизнес-цель — ROAS, лиды или охват — и связанный KPI.' },
      { title: 'Аудитория и каналы', desc: 'Соберите аудиторию из CRM или сегмента LAL, отметьте каналы.' },
      { title: 'Креативы и бюджет', desc: 'Прикрепите креативы, распределите дневной бюджет с прогнозом.' },
      { title: 'Проверка и публикация', desc: 'Подтвердите чек-лист и запустите кампанию во всех каналах сразу.' },
    ],
    faq: [
      {
        q: 'Нужно ли подключать рекламные кабинеты заранее?',
        a: 'Кабинеты Meta, Google и TikTok подключаются по OAuth в разделе Ad accounts. Без них мастер позволит сохранить черновик, но не запустит публикацию.',
      },
      {
        q: 'Можно ли запустить одну кампанию сразу в несколько каналов?',
        a: 'Да — мастер собирает единый brief и публикует кампании в каждом выбранном канале, синхронизируя UTM и трекинг.',
      },
      {
        q: 'Сохраняются ли шаги, если закрыть вкладку?',
        a: 'Каждый шаг сохраняется как черновик автоматически. Команда может продолжить с любого устройства.',
      },
    ],
    related: ['campaign-manager', 'audience-builder', 'creative-scorer', 'budget-optimization'],
    cta: { label: 'Запустить первую кампанию', href: ONBOARDING },
    seoDescription:
      'Мастер запуска AdSpectr: одной формой запускайте кампании в Meta, Google и TikTok — цели, аудитории, креативы и бюджет в одном потоке.',
  },
  'campaign-manager': {
    slug: 'campaign-manager',
    category: 'execution',
    icon: Layers3,
    hero: {
      eyebrow: 'Запуск кампаний',
      title: 'Менеджер кампаний',
      description:
        'Управляйте всеми кампаниями по статусу, платформе и расходам в одной таблице — без переключения вкладок.',
    },
    mockHeader: 'campaigns table',
    bullets: [
      { title: 'Единая таблица', desc: 'Meta, Google и TikTok — одна сетка фильтров и сортировки.' },
      { title: 'Массовые действия', desc: 'Пауза, копия, бюджет-апдейт сразу для группы кампаний.' },
      { title: 'Расходы в реальном времени', desc: 'Spend, ROAS и CPA обновляются ежеминутно.' },
      { title: 'История изменений', desc: 'Кто и когда менял бюджет, креатив или статус.' },
    ],
    steps: [
      { title: 'Подключите кабинеты', desc: 'OAuth-связки с Meta, Google и TikTok за минуту.' },
      { title: 'Соберите рабочее представление', desc: 'Сохраните фильтры и колонки как именованный view.' },
      { title: 'Массово действуйте', desc: 'Выберите строки и примените действие сразу ко всем.' },
    ],
    faq: [
      { q: 'Сколько кабинетов можно подключить?', a: 'В пределах плана — без жёсткого лимита. Growth-план рассчитан на агентства с 10–20 рекламными кабинетами.' },
      { q: 'Влияют ли массовые действия на API-лимиты?', a: 'Запросы пакетируются и распределяются с учётом квот каждого канала.' },
    ],
    related: ['launch-wizard', 'audience-builder', 'budget-optimization', 'automation-rules'],
    cta: { label: 'Открыть менеджер', href: ONBOARDING },
    seoDescription:
      'Менеджер кампаний AdSpectr: одна таблица для Meta, Google и TikTok с массовыми действиями, ROAS в реальном времени и историей изменений.',
  },
  'audience-builder': {
    slug: 'audience-builder',
    category: 'execution',
    icon: Users,
    hero: {
      eyebrow: 'Запуск кампаний',
      title: 'Конструктор аудиторий',
      description:
        'Соберите аудитории по этапам воронки — из CRM, событий Pixel и look-alike — и переиспользуйте в любой кампании.',
    },
    mockHeader: 'audience builder',
    bullets: [
      { title: 'Воронка как источник', desc: 'Сегменты по статусу сделки в AmoCRM или Bitrix.' },
      { title: 'Look-alike в один клик', desc: 'LAL 1–10% с автоматическим сравнением каналов.' },
      { title: 'Custom Audience через Pixel', desc: 'Visit, AddToCart, Purchase — без ручной выгрузки.' },
      { title: 'Контроль пересечений', desc: 'Видите overlap между аудиториями до запуска.' },
    ],
    steps: [
      { title: 'Источник', desc: 'Выберите CRM-стадию, событие Pixel или загрузите CSV.' },
      { title: 'Правила', desc: 'Добавьте фильтры по периоду, валюте сделки или гео.' },
      { title: 'Синхронизация', desc: 'Аудитория уходит в Meta, Google и TikTok одновременно.' },
    ],
    faq: [
      { q: 'Поддерживается ли AmoCRM?', a: 'Да — AdSpectr читает воронку через OAuth и обновляет сегменты автоматически.' },
      { q: 'Как часто аудитория обновляется?', a: 'Раз в час по умолчанию; для Pro и Agency планов — каждые 10 минут.' },
    ],
    related: ['retargeting', 'launch-wizard', 'campaign-manager', 'performance-analytics'],
    cta: { label: 'Собрать аудиторию', href: ONBOARDING },
    seoDescription:
      'Конструктор аудиторий AdSpectr: сегменты из CRM, событий Pixel и look-alike — синхронизация в Meta, Google и TikTok автоматически.',
  },
  'retargeting': {
    slug: 'retargeting',
    category: 'execution',
    icon: Target,
    hero: {
      eyebrow: 'Запуск кампаний',
      title: 'Ретаргетинг',
      description:
        'Возвращайте посетителей и брошенные корзины — единый воркфлоу ретаргета для Meta, Google и TikTok.',
    },
    mockHeader: 'retargeting funnel',
    bullets: [
      { title: 'Шаблоны воронки', desc: 'Visit → AddToCart → Purchase с готовыми окнами 7/14/30 дней.' },
      { title: 'Кросс-канал', desc: 'Один сегмент → ретаргет одновременно в Meta, Google и TikTok.' },
      { title: 'Анти-усталость', desc: 'Автоматическая пауза при росте frequency выше порога.' },
      { title: 'Промо-серии', desc: 'Сценарии «скидка → напоминание → срочность» из коробки.' },
    ],
    steps: [
      { title: 'Подключите Pixel', desc: 'Meta Pixel и Google Tag — мастер проверит события и URL.' },
      { title: 'Соберите воронку', desc: 'Выберите шаблон или соберите свой сценарий из событий.' },
      { title: 'Запустите ретаргет', desc: 'Креативы и бюджет распределяются по каналам автоматически.' },
    ],
    faq: [
      { q: 'Нужен ли свой сайт?', a: 'Да — нужны установленные Meta Pixel и/или Google Tag. Если их нет, мастер предложит видео-инструкцию и помощь специалиста.' },
      { q: 'Можно ли ретаргетить без Pixel?', a: 'Можно работать через CRM-сегменты и события AmoCRM, но качество данных будет ограниченным.' },
    ],
    related: ['audience-builder', 'launch-wizard', 'creative-scorer', 'automation-rules'],
    cta: { label: 'Запустить ретаргет', href: ONBOARDING },
    seoDescription:
      'Ретаргетинг AdSpectr: возвращайте посетителей и брошенные корзины в Meta, Google и TikTok через готовые шаблоны воронки и анти-усталость.',
  },

  // ──────────────────────────────── AI / OPT ─────────────────────────────────
  'ai-decisions': {
    slug: 'ai-decisions',
    category: 'aiOpt',
    icon: Brain,
    hero: {
      eyebrow: 'AI и оптимизация',
      title: 'Решения AI',
      description:
        'Полный журнал решений AI: что было сделано, почему и какой ожидается эффект — с возможностью отката одним кликом.',
    },
    mockHeader: 'AI decision log',
    bullets: [
      { title: 'Объяснимые действия', desc: 'Каждое решение AI сопровождается причиной и ожидаемой выгодой.' },
      { title: 'Откат в один клик', desc: 'Не согласны — вернитесь к предыдущей конфигурации.' },
      { title: 'Журнал согласований', desc: 'Видно, кто из команды утвердил решение и когда.' },
      { title: 'Сценарии auto vs assist', desc: 'AI может действовать сам или предлагать на ревью.' },
    ],
    steps: [
      { title: 'Настройте границы', desc: 'Лимиты по бюджету и каналу, в которых AI может действовать.' },
      { title: 'Получайте предложения', desc: 'AI оценивает данные и формирует план оптимизаций.' },
      { title: 'Утверждайте или авторизуйте', desc: 'Включите авто-применение или ручную проверку.' },
    ],
    faq: [
      { q: 'Может ли AI слить весь бюджет?', a: 'Нет. Каждое действие проходит через лимиты, заданные владельцем workspace.' },
      { q: 'Как обучается модель?', a: 'AI использует исторические данные кампаний внутри workspace и не делится ими между клиентами.' },
    ],
    related: ['auto-optimization', 'creative-scorer', 'budget-optimization', 'simulation'],
    cta: { label: 'Включить AI-агента', href: ONBOARDING },
    seoDescription:
      'Решения AI в AdSpectr: журнал автономных действий по бюджету, креативам и аудиториям с причинами, ожидаемым эффектом и откатом.',
  },
  'auto-optimization': {
    slug: 'auto-optimization',
    category: 'aiOpt',
    icon: Settings2,
    hero: {
      eyebrow: 'AI и оптимизация',
      title: 'Автооптимизация',
      description:
        'Кампании оптимизируются круглосуточно по вашим правилам: AI перераспределяет бюджет, паузит слабые объявления и масштабирует победителей.',
    },
    mockHeader: 'auto-optimize stream',
    bullets: [
      { title: 'Реакция в реальном времени', desc: 'Действия применяются за минуты, а не часы.' },
      { title: 'Правила + AI', desc: 'Ваши пороги поверх обучающейся модели.' },
      { title: 'Логирование', desc: 'Всё видно в журнале решений с возможностью отката.' },
      { title: 'Без переобучения', desc: 'Защита от резких скачков и заклинивания на одной кампании.' },
    ],
    steps: [
      { title: 'Задайте цели', desc: 'ROAS-цель, CPA-потолок и допустимый разброс.' },
      { title: 'Подключите AI', desc: 'Выберите режим: assist (предложения) или auto (применение).' },
      { title: 'Следите за стримом', desc: 'Каждое действие появляется в реальном времени с метрикой.' },
    ],
    faq: [
      { q: 'Что если AI ошибается?', a: 'Любое действие можно откатить в журнале решений за один клик.' },
      { q: 'Можно ли работать без авто-режима?', a: 'Да — режим assist предлагает действия для ручного подтверждения.' },
    ],
    related: ['ai-decisions', 'creative-scorer', 'budget-optimization', 'simulation'],
    cta: { label: 'Включить автооптимизацию', href: ONBOARDING },
    seoDescription:
      'Автооптимизация AdSpectr: AI круглосуточно перераспределяет бюджет, паузит слабые объявления и масштабирует победителей в Meta, Google и TikTok.',
  },
  'creative-scorer': {
    slug: 'creative-scorer',
    category: 'aiOpt',
    icon: Sparkles,
    hero: {
      eyebrow: 'AI и оптимизация',
      title: 'Оценка креативов',
      description:
        'AI оценивает креативы до запуска — по hooks, читаемости текста, ритму и историческим триггерам конверсии.',
    },
    mockHeader: 'creative scorecard',
    bullets: [
      { title: 'Скоринг до запуска', desc: 'Понимание сильных и слабых сторон до открутки бюджета.' },
      { title: 'Hooks-анализ', desc: 'Где зритель решает остаться или промотать дальше.' },
      { title: 'Текст и читаемость', desc: 'Проверка длины, ключевых слов и CTA.' },
      { title: 'Аналог по портфелю', desc: 'Сравнение с лучшими креативами вашей ниши.' },
    ],
    steps: [
      { title: 'Загрузите', desc: 'Видео, баннеры и тексты для оценки.' },
      { title: 'Получите скор', desc: 'Балл 0–100 + рекомендации, что улучшить.' },
      { title: 'Запустите', desc: 'Лучший вариант уходит в кампанию.' },
    ],
    faq: [
      { q: 'Какие форматы поддерживаются?', a: 'MP4, JPG, PNG и тексты до 1000 символов. Идёт работа над поддержкой Instagram Reels-разметки.' },
      { q: 'Видит ли AI бренд-гайдлайны?', a: 'Можно загрузить гайд один раз — модель учитывает шрифты, палитру и тон голоса.' },
    ],
    related: ['ai-decisions', 'auto-optimization', 'top-ads', 'launch-wizard'],
    cta: { label: 'Оценить креативы', href: ONBOARDING },
    seoDescription:
      'Оценка креативов AdSpectr: AI скорит видео и баннеры до запуска по hooks, читаемости и историческим триггерам конверсии.',
  },
  'budget-optimization': {
    slug: 'budget-optimization',
    category: 'aiOpt',
    icon: Wallet,
    hero: {
      eyebrow: 'AI и оптимизация',
      title: 'Оптимизация бюджета',
      description:
        'Умное распределение бюджета между платформами по фактическим результатам — а не предположениям.',
    },
    mockHeader: 'budget allocation',
    bullets: [
      { title: 'Динамическое перераспределение', desc: 'Перевод бюджета на канал с лучшим ROAS.' },
      { title: 'Защитные пороги', desc: 'Минимум и максимум на канал — AI не выходит за рамки.' },
      { title: 'Прогноз эффекта', desc: 'До применения видно ожидаемое изменение ROAS.' },
      { title: 'Полная история', desc: 'Каждое перераспределение зафиксировано в журнале.' },
    ],
    steps: [
      { title: 'Общий бюджет', desc: 'Задайте дневной/месячный пул на все каналы.' },
      { title: 'Каналы и пороги', desc: 'Min/max для Meta, Google и TikTok.' },
      { title: 'Включите оптимизацию', desc: 'AI перераспределяет внутри ваших правил.' },
    ],
    faq: [
      { q: 'Учитывается ли сезонность?', a: 'Да — модель видит тренды по дням недели и часам, выравнивая распределение.' },
      { q: 'Можно ли заблокировать канал?', a: 'Установите min = max или нулевой потолок — канал не получит перераспределения.' },
    ],
    related: ['ai-decisions', 'auto-optimization', 'simulation', 'roi-calculator'],
    cta: { label: 'Запустить оптимизатор', href: ONBOARDING },
    seoDescription:
      'Оптимизация бюджета AdSpectr: AI перераспределяет бюджет между Meta, Google и TikTok по фактическому ROAS, в рамках ваших порогов.',
  },
  'simulation': {
    slug: 'simulation',
    category: 'aiOpt',
    icon: GitBranch,
    hero: {
      eyebrow: 'AI и оптимизация',
      title: 'Симуляция',
      description:
        'Прогнозируйте, как изменения бюджета и аудитории отразятся на KPI — до того, как открутите хоть один сум.',
    },
    mockHeader: 'scenario simulator',
    bullets: [
      { title: 'What-if сценарии', desc: 'Изменение бюджета на канал — мгновенный прогноз ROAS и CPA.' },
      { title: 'Аудитории', desc: 'Сравнение LAL 1% vs 3% по ожидаемой стоимости.' },
      { title: 'Креативы', desc: 'Моделирование выгоды от замены слабых креативов.' },
      { title: 'Доверительный интервал', desc: 'Видите диапазон, а не одну точку — и принимаете взвешенное решение.' },
    ],
    steps: [
      { title: 'Базовая линия', desc: 'AdSpectr строит её из вашей истории за 30 дней.' },
      { title: 'Изменения', desc: 'Сдвиньте ползунки бюджета, аудитории или креативов.' },
      { title: 'Прогноз', desc: 'KPI в новых условиях с разбросом и причиной.' },
    ],
    faq: [
      { q: 'Сколько данных нужно?', a: 'Минимум 14 дней истории кампаний в подключённых кабинетах.' },
      { q: 'Можно ли сразу применить сценарий?', a: 'Да — кнопка «Применить» переносит изменения в реальные кампании.' },
    ],
    related: ['ai-decisions', 'budget-optimization', 'auto-optimization', 'roi-calculator'],
    cta: { label: 'Открыть симулятор', href: ONBOARDING },
    seoDescription:
      'Симуляция AdSpectr: what-if сценарии бюджета, аудитории и креативов с прогнозом ROAS и доверительным интервалом до применения изменений.',
  },
  'roi-calculator': {
    slug: 'roi-calculator',
    category: 'aiOpt',
    icon: BarChart3,
    hero: {
      eyebrow: 'AI и оптимизация',
      title: 'ROI и результаты',
      description:
        'Интерактивный калькулятор ROI — складывает рекламные расходы, доходы из CRM и косвенные эффекты в одну картину.',
    },
    mockHeader: 'ROI calculator',
    bullets: [
      { title: 'Источники в одном месте', desc: 'Реклама, CRM-сделки и Google Sheets — единый расчёт.' },
      { title: 'Когортный учёт', desc: 'LTV и повторные покупки внутри окна атрибуции.' },
      { title: 'Экспорт для собственника', desc: 'PDF и Sheets — для совета директоров за минуту.' },
      { title: 'Сравнение периодов', desc: 'ROI этой недели vs прошлой — наглядно и автоматически.' },
    ],
    steps: [
      { title: 'Подключите источники', desc: 'AmoCRM, рекламные кабинеты и таблицы.' },
      { title: 'Соберите модель', desc: 'Атрибуция, окно и формула — настраиваются под бизнес.' },
      { title: 'Получите ROI', desc: 'Картина и тренд в реальном времени, с экспортом.' },
    ],
    faq: [
      { q: 'Какая модель атрибуции по умолчанию?', a: 'Last-click 30 дней. Можно переключить на multi-touch или first-click.' },
      { q: 'Как считается LTV?', a: 'Учитываются повторные сделки в CRM в окне 90/180/365 дней — настраивается.' },
    ],
    related: ['simulation', 'budget-optimization', 'performance-analytics', 'reporting'],
    cta: { label: 'Посчитать ROI', href: ONBOARDING },
    seoDescription:
      'Калькулятор ROI AdSpectr: связывает рекламные расходы, CRM-сделки и косвенные эффекты в единую картину с экспортом и сравнением периодов.',
  },

  // ──────────────────────────────── ANALYTICS ─────────────────────────────────
  'performance-analytics': {
    slug: 'performance-analytics',
    category: 'analytics',
    icon: BarChart3,
    hero: {
      eyebrow: 'Аналитика и интеллект',
      title: 'Performance',
      description:
        'KPI, тренды и срезы по всем кампаниям — на одном дашборде с фильтрами по каналу, аудитории и креативу.',
    },
    mockHeader: 'performance dashboard',
    bullets: [
      { title: 'Топ KPI', desc: 'ROAS, CPA, CTR, frequency — в одной строке.' },
      { title: 'Тренд за период', desc: 'Сравнение неделя/месяц/квартал в один клик.' },
      { title: 'Срезы', desc: 'По каналам, аудиториям, креативам, регионам.' },
      { title: 'Сохранение видов', desc: 'Команда работает с одинаковыми дашбордами.' },
    ],
    steps: [
      { title: 'Выберите период', desc: 'Любое окно с сопоставлением с предыдущим.' },
      { title: 'Соберите срез', desc: 'Drag & drop фильтры — без SQL.' },
      { title: 'Поделитесь', desc: 'Ссылка на дашборд работает для команды.' },
    ],
    faq: [
      { q: 'Поддерживаются ли пользовательские метрики?', a: 'Да — формулы из готовых полей создаются через UI и пересчитываются автоматически.' },
      { q: 'Откуда берутся данные?', a: 'Прямо из API Meta, Google и TikTok, плюс CRM и пиксели.' },
    ],
    related: ['reporting', 'competitor-intel', 'top-ads', 'automation-rules'],
    cta: { label: 'Открыть дашборд', href: ONBOARDING },
    seoDescription:
      'Performance-аналитика AdSpectr: единый дашборд KPI по Meta, Google и TikTok с трендами, срезами и пользовательскими метриками.',
  },
  'reporting': {
    slug: 'reporting',
    category: 'analytics',
    icon: Layers3,
    hero: {
      eyebrow: 'Аналитика и интеллект',
      title: 'Отчётность',
      description:
        'Готовые отчёты для клиентов и руководства — PDF, Sheets, расписания по email и Telegram.',
    },
    mockHeader: 'report builder',
    bullets: [
      { title: 'Шаблоны', desc: 'Weekly, monthly и client-ready пресеты из коробки.' },
      { title: 'Брендинг', desc: 'Логотип и палитра клиента — без дизайнера.' },
      { title: 'Расписание', desc: 'Авто-отправка по email и в Telegram.' },
      { title: 'Сравнение периодов', desc: 'Δ по KPI неделя к неделе сразу в отчёте.' },
    ],
    steps: [
      { title: 'Выберите шаблон', desc: 'Или соберите свой из блоков performance, ROI и креативов.' },
      { title: 'Подключите получателей', desc: 'Email-список, чат в Telegram или общий Sheets.' },
      { title: 'Расписание', desc: 'Каждый понедельник в 9:00 — без вашей руки.' },
    ],
    faq: [
      { q: 'Можно ли подписать клиента?', a: 'Да — отчёты отправляются прямо на email клиента с вашим брендом.' },
      { q: 'Поддерживается ли Google Sheets?', a: 'Каждый отчёт выгружается в Sheets с сохранёнными формулами.' },
    ],
    related: ['performance-analytics', 'roi-calculator', 'top-ads', 'automation-rules'],
    cta: { label: 'Создать отчёт', href: ONBOARDING },
    seoDescription:
      'Отчётность AdSpectr: PDF, Sheets и расписания по email и Telegram — готовые шаблоны для клиентов и руководства.',
  },
  'competitor-intel': {
    slug: 'competitor-intel',
    category: 'analytics',
    icon: Search,
    hero: {
      eyebrow: 'Аналитика и интеллект',
      title: 'Конкурентная аналитика',
      description:
        'Видите рекламу конкурентов, SWOT и инсайты рынка — без ручного парсинга и переключения вкладок.',
    },
    mockHeader: 'competitor radar',
    bullets: [
      { title: 'Радар конкурентов', desc: 'Кто и какие креативы запускает прямо сейчас.' },
      { title: 'SWOT за минуту', desc: 'Сильные и слабые стороны на основе данных.' },
      { title: 'Тренды ниши', desc: 'Какие месседжи растут, какие выгорают.' },
      { title: 'Алёрт на новинку', desc: 'Уведомление, когда у конкурента появился новый креатив.' },
    ],
    steps: [
      { title: 'Список конкурентов', desc: 'Добавьте до 20 компаний.' },
      { title: 'Источники', desc: 'Meta Ad Library, TikTok и Google Ads Transparency.' },
      { title: 'Радар', desc: 'Новые креативы, паузы и смена аудиторий — в одном фиде.' },
    ],
    faq: [
      { q: 'Откуда данные?', a: 'Публичные библиотеки рекламы Meta, Google и TikTok.' },
      { q: 'Можно ли скачать креативы?', a: 'Превью открывается прямо в AdSpectr, по правилам платформ.' },
    ],
    related: ['top-ads', 'performance-analytics', 'reporting', 'creative-scorer'],
    cta: { label: 'Открыть радар', href: ONBOARDING },
    seoDescription:
      'Конкурентная аналитика AdSpectr: радар креативов, SWOT, тренды ниши и алёрты по новым объявлениям конкурентов.',
  },
  'automation-rules': {
    slug: 'automation-rules',
    category: 'analytics',
    icon: Settings2,
    hero: {
      eyebrow: 'Аналитика и интеллект',
      title: 'Правила автоматизации',
      description:
        'Триггеры и правила для авто-действий: «если CPA выше N — пауза», «если ROAS выше M — масштаб» — без кода.',
    },
    mockHeader: 'rules engine',
    bullets: [
      { title: 'Конструктор без кода', desc: 'IF / THEN правила на drag & drop.' },
      { title: 'Шаблоны', desc: 'Stop loss, scale winners, frequency cap — готовые.' },
      { title: 'Алёрты', desc: 'Письмо, Telegram или вебхук на любое событие.' },
      { title: 'Тестирование', desc: 'Симулируйте правило на исторических данных перед запуском.' },
    ],
    steps: [
      { title: 'Условие', desc: 'Метрика, окно и порог.' },
      { title: 'Действие', desc: 'Пауза, бюджет, копия, алёрт.' },
      { title: 'Тест и активация', desc: 'Проверка на истории, затем запуск.' },
    ],
    faq: [
      { q: 'Сколько правил можно создать?', a: 'Без жёстких лимитов; критически большие наборы переходят в плановое выполнение.' },
      { q: 'Поддерживаются ли вебхуки?', a: 'Да — для интеграции с собственными системами и Slack/Telegram.' },
    ],
    related: ['auto-optimization', 'ai-decisions', 'performance-analytics', 'reporting'],
    cta: { label: 'Создать правило', href: ONBOARDING },
    seoDescription:
      'Правила автоматизации AdSpectr: IF/THEN-конструктор без кода — стоп-лосс, масштабирование, frequency cap и алёрты в Telegram.',
  },
  'top-ads': {
    slug: 'top-ads',
    category: 'analytics',
    icon: Crown,
    hero: {
      eyebrow: 'Аналитика и интеллект',
      title: 'Top Ads',
      description:
        'Панель для быстрого анализа лучших объявлений — по ROAS, CTR и conversion lift во всех каналах сразу.',
    },
    mockHeader: 'top performers',
    bullets: [
      { title: 'Лидерборд', desc: 'Лучшие объявления по выбранному KPI.' },
      { title: 'Кросс-канал', desc: 'Сравнение Meta vs Google vs TikTok.' },
      { title: 'Дублирование', desc: 'Запуск победителя в новые кампании за клик.' },
      { title: 'Журнал успехов', desc: 'История триумфов с разбивкой по нишам.' },
    ],
    steps: [
      { title: 'Выберите KPI', desc: 'ROAS, CTR, CPA или собственная формула.' },
      { title: 'Период', desc: 'От недели до квартала.' },
      { title: 'Действуйте', desc: 'Дублируйте, разверните или замените слабые места.' },
    ],
    faq: [
      { q: 'Какой KPI лучший?', a: 'Зависит от модели бизнеса. AdSpectr подсказывает дефолт под вашу нишу.' },
      { q: 'Можно ли запретить дублировать?', a: 'Да — для отдельных кабинетов и креативов есть запрет на массовое копирование.' },
    ],
    related: ['performance-analytics', 'creative-scorer', 'competitor-intel', 'reporting'],
    cta: { label: 'Открыть Top Ads', href: ONBOARDING },
    seoDescription:
      'Top Ads AdSpectr: лидерборд лучших объявлений по ROAS, CTR и CPA с дублированием победителей в Meta, Google и TikTok.',
  },

  // ──────────────────────────────── GOVERNANCE ─────────────────────────────────
  'workspace-team': {
    slug: 'workspace-team',
    category: 'governance',
    icon: Users,
    hero: {
      eyebrow: 'Workspace, команда и финансы',
      title: 'Команда workspace',
      description:
        'Управляйте командой с ролями и приглашениями — owner, manager, analyst и read-only под вашу структуру.',
    },
    mockHeader: 'team & roles',
    bullets: [
      { title: 'Роли из коробки', desc: 'Owner, manager, analyst, read-only.' },
      { title: 'Гостевой доступ', desc: 'Клиент или подрядчик — без раскрытия кабинетов.' },
      { title: 'Аудит действий', desc: 'Кто и что изменил — журнал доступа.' },
      { title: 'SSO в Pro', desc: 'Google Workspace и SAML для безопасности.' },
    ],
    steps: [
      { title: 'Пригласите', desc: 'Email или magic-link — без пароля по умолчанию.' },
      { title: 'Назначьте роль', desc: 'Из четырёх стандартных или создайте кастомную.' },
      { title: 'Смотрите журнал', desc: 'Каждое действие фиксируется с timestamp и IP.' },
    ],
    faq: [
      { q: 'Можно ли скрыть кабинеты от части команды?', a: 'Да — права назначаются на уровне рабочего пространства и отдельного кабинета.' },
      { q: 'Поддерживается ли SSO?', a: 'Google Workspace из коробки; SAML — на Pro и Agency.' },
    ],
    related: ['ad-accounts', 'products-plans', 'payments-invoices', 'mcp-credentials'],
    cta: { label: 'Пригласить команду', href: ONBOARDING },
    seoDescription:
      'Команда AdSpectr: роли, гостевой доступ, аудит действий и SSO — под структуру вашего агентства или бренда.',
  },
  'ad-accounts': {
    slug: 'ad-accounts',
    category: 'governance',
    icon: Shield,
    hero: {
      eyebrow: 'Workspace, команда и финансы',
      title: 'Рекламные аккаунты',
      description:
        'Подключайте Meta, Google и TikTok через OAuth, отслеживайте статус синхронизации и автоматический reconnect.',
    },
    mockHeader: 'ad accounts',
    bullets: [
      { title: 'OAuth в один клик', desc: 'Безопасное подключение без передачи паролей.' },
      { title: 'Статус токенов', desc: 'Алёрт при истечении или отзыве доступа.' },
      { title: 'Auto-reconnect', desc: 'Уведомление в Telegram + ссылка на повторную авторизацию.' },
      { title: 'Multi-account', desc: 'Десятки кабинетов в одном workspace.' },
    ],
    steps: [
      { title: 'Подключите', desc: 'Авторизация через канал — Meta, Google, TikTok.' },
      { title: 'Проверьте права', desc: 'AdSpectr подсветит, чего не хватает (Pixel, события).' },
      { title: 'Следите', desc: 'Дашборд статусов синхронизации.' },
    ],
    faq: [
      { q: 'Что если токен отозвали?', a: 'AdSpectr уведомит в Telegram и email; повторная авторизация — в один клик.' },
      { q: 'Можно ли заморозить кабинет?', a: 'Да — статус «paused» сохраняет историю, но останавливает синхронизацию.' },
    ],
    related: ['workspace-team', 'payments-invoices', 'mcp-credentials', 'help-center'],
    cta: { label: 'Подключить кабинет', href: ONBOARDING },
    seoDescription:
      'Рекламные аккаунты AdSpectr: OAuth-подключение Meta, Google и TikTok с auto-reconnect и алёртами в Telegram при истечении токена.',
  },
  'products-plans': {
    slug: 'products-plans',
    category: 'governance',
    icon: Crown,
    hero: {
      eyebrow: 'Workspace, команда и финансы',
      title: 'Продукты и тарифы',
      description:
        'Подписки, заказы и контроль использования — управляйте тарифом и лимитами без обращения в поддержку.',
    },
    mockHeader: 'plans & usage',
    bullets: [
      { title: 'Подписки', desc: 'Free, Starter, Growth, Pro, Agency — переключение в один клик.' },
      { title: 'Лимиты в реальном времени', desc: 'Кабинеты, кампании, AI-действия — наглядно.' },
      { title: 'История заказов', desc: 'PDF-инвойсы и оплаты в одном месте.' },
      { title: 'Апгрейд без даунтайма', desc: 'Смена плана сразу применяется к workspace.' },
    ],
    steps: [
      { title: 'Выберите план', desc: 'Сравнение функций и лимитов в реальном времени.' },
      { title: 'Оплатите', desc: 'Click, Payme, банковская карта или счёт на компанию.' },
      { title: 'Управляйте', desc: 'Апгрейд, даунгрейд и пауза — без потери данных.' },
    ],
    faq: [
      { q: 'Можно ли заморозить подписку?', a: 'Да — пауза до 60 дней без потери настроек и истории кампаний.' },
      { q: 'Есть ли годовая скидка?', a: 'До 20% на годовой план Growth, Pro и Agency.' },
    ],
    related: ['payments-invoices', 'workspace-team', 'help-center', 'mcp-credentials'],
    cta: { label: 'Сравнить тарифы', href: ONBOARDING },
    seoDescription:
      'Продукты и тарифы AdSpectr: Free, Starter, Growth, Pro и Agency — переключение, лимиты в реальном времени и история оплат.',
  },
  'payments-invoices': {
    slug: 'payments-invoices',
    category: 'governance',
    icon: CreditCard,
    hero: {
      eyebrow: 'Workspace, команда и финансы',
      title: 'Платежи и счета',
      description:
        'Профиль биллинга, способы оплаты и счета — Click, Payme, банковская карта и счёт на компанию.',
    },
    mockHeader: 'billing',
    bullets: [
      { title: 'Локальные методы', desc: 'Click и Payme для физлиц; банковский счёт — для юрлиц.' },
      { title: 'PDF-инвойсы', desc: 'Каждый платёж сопровождается отчётным документом.' },
      { title: 'Авто-продление', desc: 'С контролем уведомлений и возможностью отключить.' },
      { title: 'История', desc: 'Все транзакции в одном архиве с поиском.' },
    ],
    steps: [
      { title: 'Способ оплаты', desc: 'Сохраните карту или подключите Click/Payme.' },
      { title: 'План', desc: 'Выберите подписку — счёт формируется автоматически.' },
      { title: 'Документы', desc: 'PDF и Sheets — для бухгалтерии.' },
    ],
    faq: [
      { q: 'Можно ли оплатить по счёту на компанию?', a: 'Да — выставление счёта в один клик из биллинга, с НДС или без.' },
      { q: 'Поддерживается ли валюта?', a: 'UZS, USD и RUB — AdSpectr пересчитывает по курсу ЦБ.' },
    ],
    related: ['products-plans', 'workspace-team', 'roi-calculator', 'help-center'],
    cta: { label: 'Открыть биллинг', href: ONBOARDING },
    seoDescription:
      'Платежи и счета AdSpectr: Click, Payme, банковская карта и счёт на компанию с PDF-инвойсами и историей транзакций.',
  },
  'mcp-credentials': {
    slug: 'mcp-credentials',
    category: 'governance',
    icon: Settings2,
    hero: {
      eyebrow: 'Workspace, команда и финансы',
      title: 'MCP credentials',
      description:
        'Управление MCP client id / secret для агентов и интеграций — единое место для всех ключей и токенов.',
    },
    mockHeader: 'MCP keys',
    bullets: [
      { title: 'MCP-серверы', desc: 'Подключение собственных и сторонних MCP-серверов.' },
      { title: 'Скоупы доступа', desc: 'Гранулярные права на чтение, действия и эскалацию.' },
      { title: 'Ротация ключей', desc: 'Авто-ротация без даунтайма и потери истории.' },
      { title: 'Журнал использования', desc: 'Кто из агентов и когда обращался к ключу.' },
    ],
    steps: [
      { title: 'Создайте ключ', desc: 'С названием, сроком жизни и скоупами.' },
      { title: 'Подключите MCP-сервер', desc: 'AdSpectr или собственный — через URL и ключ.' },
      { title: 'Следите', desc: 'Журнал использования и алёрты при аномалиях.' },
    ],
    faq: [
      { q: 'Что такое MCP?', a: 'Model Context Protocol — стандарт, по которому AI-агенты безопасно обращаются к инструментам и данным.' },
      { q: 'Можно ли отозвать ключ?', a: 'Мгновенно — без перезапуска кампаний или потери настроек.' },
    ],
    related: ['ad-accounts', 'workspace-team', 'help-center', 'ai-decisions'],
    cta: { label: 'Открыть MCP', href: ONBOARDING },
    seoDescription:
      'MCP credentials AdSpectr: безопасные ключи для AI-агентов с гранулярными скоупами, ротацией и журналом использования.',
  },
  'help-center': {
    slug: 'help-center',
    category: 'governance',
    icon: Layers3,
    hero: {
      eyebrow: 'Workspace, команда и финансы',
      title: 'Справочный центр',
      description:
        'Быстрая помощь по workspace и команде — статьи, видео и прямой контакт с экспертами AdSpectr.',
    },
    mockHeader: 'help center',
    bullets: [
      { title: 'База знаний', desc: 'Статьи по запуску, аналитике и биллингу.' },
      { title: 'Видео-уроки', desc: 'Короткие демки 30–90 секунд по каждой функции.' },
      { title: 'Эксперты', desc: 'Чат с консультантом из marketplace — за фикс или процент.' },
      { title: 'Статус системы', desc: 'Известные инциденты и плановые работы.' },
    ],
    steps: [
      { title: 'Поиск', desc: 'Введите вопрос — AdSpectr подсказывает релевантные статьи.' },
      { title: 'Решение', desc: 'Шаги, видео или прямая ссылка в нужный раздел.' },
      { title: 'Эскалация', desc: 'Если не помогло — эксперт подключится напрямую.' },
    ],
    faq: [
      { q: 'Сколько стоит обращение к эксперту?', a: 'От $5 за быстрый ответ. Тариф фиксируется до начала работы.' },
      { q: 'На каком языке поддержка?', a: 'Русский, узбекский и английский — 24/7 для Pro и Agency.' },
    ],
    related: ['workspace-team', 'ad-accounts', 'products-plans', 'mcp-credentials'],
    cta: { label: 'Открыть центр помощи', href: ONBOARDING },
    seoDescription:
      'Справочный центр AdSpectr: статьи, видео-уроки и эксперты marketplace по запуску, аналитике и биллингу — 24/7 на трёх языках.',
  },
}

export const FEATURE_SLUGS = Object.keys(FEATURE_CONTENT)

export function getFeatureContent(slug: string): FeatureContent | undefined {
  return FEATURE_CONTENT[slug]
}
