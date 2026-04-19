/**
 * One-off merge: adds publicSite.marketing (features, solutions, marketplace UI, etc.)
 * Run from apps/web: node scripts/seed-public-marketing-i18n.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '../public/locales')

const L = (en, ru, uz) => ({ en, ru, uz })

const featuresItems = {
  launchWizard: L(
    { title: 'Launch Wizard', desc: 'Step-by-step objective, audience, budget, and creative setup.' },
    { title: 'Мастер запуска', desc: 'Пошаговая настройка цели, аудитории, бюджета и креативов.' },
    { title: 'Launch Wizard', desc: 'Maqsad, auditoriya, byudjet va kreativni bosqichma-bosqich sozlash.' },
  ),
  campaignManager: L(
    { title: 'Campaign Manager', desc: 'Manage campaigns by status, platform, and spend.' },
    { title: 'Менеджер кампаний', desc: 'Управление кампаниями по статусу, платформе и расходам.' },
    { title: 'Campaign Manager', desc: 'Kampaniyalarni status, platforma va spend bo‘yicha boshqarish.' },
  ),
  audienceBuilder: L(
    { title: 'Audience Builder', desc: 'Create and launch audiences across the funnel.' },
    { title: 'Конструктор аудиторий', desc: 'Создание и запуск аудиторий по воронке.' },
    { title: 'Audience Builder', desc: 'ARR funnel kesimida auditoriyalarni yaratish va ishga tushirish.' },
  ),
  retargeting: L(
    { title: 'Retargeting Flow', desc: 'Retargeting campaigns via funnel and wizard.' },
    { title: 'Ретаргетинг', desc: 'Ретаргетинг через воронку и мастер.' },
    { title: 'Retargeting Flow', desc: 'Retargeting funnel va wizard orqali qayta jalb qilish kampaniyalari.' },
  ),
  aiDecisions: L(
    { title: 'AI Decisions', desc: 'Full log of what AI decided and why.' },
    { title: 'Решения AI', desc: 'Полный журнал решений AI и причин.' },
    { title: 'AI Decisions', desc: 'AI nima qaror qildi va nima sababdan — to‘liq log.' },
  ),
  autoOptimization: L(
    { title: 'Auto Optimization', desc: 'Rule-based automation and history.' },
    { title: 'Автооптимизация', desc: 'Автоматизация по правилам и история.' },
    { title: 'Auto Optimization', desc: 'Qoidalar asosida avtomatik optimizatsiya va tarix.' },
  ),
  creativeScorer: L(
    { title: 'Creative Scorer', desc: 'AI scores creatives before launch.' },
    { title: 'Оценка креативов', desc: 'AI оценивает креативы до запуска.' },
    { title: 'Creative Scorer', desc: 'Kreativlarni launchdan oldin AI orqali baholash.' },
  ),
  budgetOpt: L(
    { title: 'Budget Optimization', desc: 'Smart budget split across platforms.' },
    { title: 'Оптимизация бюджета', desc: 'Умное распределение бюджета по платформам.' },
    { title: 'Budget Optimization', desc: 'Byudjetni platformalar bo‘yicha smart taqsimlash.' },
  ),
  simulation: L(
    { title: 'Simulation', desc: 'Forecast budget and KPI changes before you act.' },
    { title: 'Симуляция', desc: 'Прогноз изменений бюджета и KPI до действий.' },
    { title: 'Simulation', desc: 'Byudjet va KPI o‘zgarishlari uchun oldindan prognoz.' },
  ),
  roiCalculator: L(
    { title: 'ROI Calculator', desc: 'Estimate profitability before scaling.' },
    { title: 'Калькулятор ROI', desc: 'Оценка рентабельности до масштабирования.' },
    { title: 'ROI Calculator', desc: 'Scale qilishdan oldin rentabellikni hisoblash.' },
  ),
  performance: L(
    { title: 'Performance', desc: 'KPIs, trends, and campaign-level views.' },
    { title: 'Performance', desc: 'KPI, тренды и срезы по кампаниям.' },
    { title: 'Performance', desc: 'KPI, trend va campaign-level kesimlar bilan ishlash.' },
  ),
  reporting: L(
    { title: 'Reporting', desc: 'Export-ready reports and period comparisons.' },
    { title: 'Отчётность', desc: 'Отчёты для экспорта и сравнение периодов.' },
    { title: 'Reporting', desc: 'Export-ready hisobotlar va period taqqoslash.' },
  ),
  competitorIntel: L(
    { title: 'Competitor Intelligence', desc: 'Competitors, SWOT, and market insights.' },
    { title: 'Конкурентная аналитика', desc: 'Конкуренты, SWOT и инсайты рынка.' },
    { title: 'Competitor Intelligence', desc: 'Raqobatchilar, SWOT va bozor insightlari.' },
  ),
  automationRules: L(
    { title: 'Automation Rules', desc: 'Triggers and rules for automated actions.' },
    { title: 'Правила автоматизации', desc: 'Триггеры и правила для авто-действий.' },
    { title: 'Automation Rules', desc: 'Trigger set va qoidalar bilan avtomatik aksiyalar.' },
  ),
  topAds: L(
    { title: 'Top Ads', desc: 'Panel to quickly analyze best-performing ads.' },
    { title: 'Top Ads', desc: 'Панель для быстрого анализа лучших объявлений.' },
    { title: 'Top Ads', desc: 'Eng samarali e‘lonlarni tez tahlil qilish paneli.' },
  ),
  workspaceTeam: L(
    { title: 'Workspace Team', desc: 'Team management with roles and invites.' },
    { title: 'Команда workspace', desc: 'Управление командой с ролями и приглашениями.' },
    { title: 'Workspace Team', desc: 'Role-based access va invite flow bilan jamoa boshqaruvi.' },
  ),
  adAccounts: L(
    { title: 'Ad Accounts', desc: 'Connect Meta ad accounts, sync, and reconnect.' },
    { title: 'Рекламные аккаунты', desc: 'Подключение Meta, синхронизация и reconnect.' },
    { title: 'Ad Accounts', desc: 'Meta ad accountlar ulash, sync va reconnect holatlari.' },
  ),
  productsPlans: L(
    { title: 'Products and Plans', desc: 'Subscription packages, orders, and usage.' },
    { title: 'Продукты и тарифы', desc: 'Подписки, заказы и контроль использования.' },
    { title: 'Products and Plans', desc: 'Obuna paketlari, order holati va usage nazorati.' },
  ),
  paymentsInvoices: L(
    { title: 'Payments and Invoices', desc: 'Billing profile, methods, and invoice table.' },
    { title: 'Платежи и счета', desc: 'Профиль биллинга, способы оплаты и счета.' },
    { title: 'Payments and Invoices', desc: 'Billing profile, to‘lov usullari va invoice jadvali.' },
  ),
  mcpCreds: L(
    { title: 'MCP Credentials', desc: 'Manage MCP client id/secret for agent integrations.' },
    { title: 'MCP credentials', desc: 'Управление MCP client id/secret для агентов.' },
    { title: 'MCP Credentials', desc: 'Agent integratsiyasi uchun MCP client id/secret boshqaruvi.' },
  ),
  helpCenter: L(
    { title: 'Workspace Help Center', desc: 'Quick help for team and workspace topics.' },
    { title: 'Справочный центр', desc: 'Быстрая помощь по workspace и команде.' },
    { title: 'Workspace Help Center', desc: 'Jamoa va workspace bo‘yicha tezkor yordam markazi.' },
  ),
}

const featureGroups = {
  execution: L(
    { name: 'Campaign Execution', metric: '4 core flows' },
    { name: 'Запуск кампаний', metric: '4 ключевых потока' },
    { name: 'Campaign Execution', metric: '4 ta asosiy oqim' },
  ),
  aiOpt: L(
    { name: 'AI and Optimization', metric: '6 automation modules' },
    { name: 'AI и оптимизация', metric: '6 модулей автоматизации' },
    { name: 'AI va optimallashtirish', metric: '6 ta avtomatlashtirish moduli' },
  ),
  analytics: L(
    { name: 'Analytics and Intelligence', metric: '5 visibility modules' },
    { name: 'Аналитика и интеллект', metric: '5 модулей видимости' },
    { name: 'Analytics va Intelligence', metric: '5 ta visibility moduli' },
  ),
  governance: L(
    { name: 'Workspace, Team, and Finance', metric: '6 governance modules' },
    { name: 'Workspace, команда и финансы', metric: '6 модулей управления' },
    { name: 'Workspace, jamoa va moliya', metric: '6 ta boshqaruv moduli' },
  ),
}

const groupItemIds = {
  execution: ['launchWizard', 'campaignManager', 'audienceBuilder', 'retargeting'],
  aiOpt: ['aiDecisions', 'autoOptimization', 'creativeScorer', 'budgetOpt', 'simulation', 'roiCalculator'],
  analytics: ['performance', 'reporting', 'competitorIntel', 'automationRules', 'topAds'],
  governance: ['workspaceTeam', 'adAccounts', 'productsPlans', 'paymentsInvoices', 'mcpCreds', 'helpCenter'],
}

function buildMarketing(loc) {
  const items = {}
  for (const [id, triple] of Object.entries(featuresItems)) {
    items[id] = { title: triple[loc].title, desc: triple[loc].desc }
  }
  const groups = {}
  for (const [gid, triple] of Object.entries(featureGroups)) {
    groups[gid] = { name: triple[loc].name, metric: triple[loc].metric }
  }

  const solutionsTracks = {
    ecommerce: L(
      {
        title: 'E-commerce Growth Team',
        summary: 'For teams that run full-funnel ads and need faster launch cycles with strict budget control.',
        stack: ['Launch Wizard', 'Audience Builder', 'Creative Scorer', 'Performance Dashboard'],
      },
      {
        title: 'E-commerce growth-команда',
        summary: 'Для команд полного воронки с быстрым запуском и жёстким контролем бюджета.',
        stack: ['Launch Wizard', 'Audience Builder', 'Creative Scorer', 'Performance Dashboard'],
      },
      {
        title: 'E-commerce growth jamoasi',
        summary: 'Full-funnel reklama va qat’iy byudjet nazorati bilan tez launch sikllari kerak bo‘lgan jamoalar uchun.',
        stack: ['Launch Wizard', 'Audience Builder', 'Creative Scorer', 'Performance Dashboard'],
      },
    ),
    agency: L(
      {
        title: 'Agency Multi-Client Operations',
        summary: 'For agencies managing multiple workspaces with role-based access and billing visibility.',
        stack: ['Workspace Team', 'Ad Accounts', 'Billing and Invoices', 'MCP Credentials'],
      },
      {
        title: 'Агентство: мульти-клиент',
        summary: 'Для агентств с несколькими workspace, ролями и видимостью биллинга.',
        stack: ['Workspace Team', 'Ad Accounts', 'Billing and Invoices', 'MCP Credentials'],
      },
      {
        title: 'Agentlik: ko‘p mijoz',
        summary: 'Bir nechta workspace, rol asosida kirish va billing ko‘rinishi bilan agentliklar uchun.',
        stack: ['Workspace Team', 'Ad Accounts', 'Billing and Invoices', 'MCP Credentials'],
      },
    ),
    inhouse: L(
      {
        title: 'In-house AI Optimization',
        summary: 'For operators who need AI-assisted decisions with approval rails and transparent logs.',
        stack: ['AI Decisions', 'Auto Optimization', 'Budget', 'Reporting'],
      },
      {
        title: 'In-house AI-оптимизация',
        summary: 'Для операторов с AI-решениями, согласованиями и прозрачными логами.',
        stack: ['AI Decisions', 'Auto Optimization', 'Budget', 'Reporting'],
      },
      {
        title: 'In-house AI optimallashtirish',
        summary: 'Approval rail va shaffof loglar bilan AI yordamida qarorlar kerak bo‘lgan operatorlar uchun.',
        stack: ['AI Decisions', 'Auto Optimization', 'Budget', 'Reporting'],
      },
    ),
  }

  const sol = {}
  for (const [k, triple] of Object.entries(solutionsTracks)) {
    sol[k] = {
      title: triple[loc].title,
      summary: triple[loc].summary,
      stack0: triple[loc].stack[0],
      stack1: triple[loc].stack[1],
      stack2: triple[loc].stack[2],
      stack3: triple[loc].stack[3],
    }
  }

  const MARKETING_EN = {
      common: {
        backToLanding: 'Back to landing',
        backToPortfolio: 'Back to portfolio',
        backToMarketplace: 'Back to marketplace',
        openModule: 'Open module',
        openProfile: 'Open profile',
        openRelatedFlow: 'Open related flow',
        liveModuleTag: 'Live module',
        solutionTrackTag: 'Solution track',
        verified: 'Verified',
        reviews: 'reviews',
        campaignsDotBadges: 'campaigns',
        badgesWord: 'badges',
        dot: ' • ',
        perHour: '/hour',
        spendSuffix: 'spend',
        yearsShort: 'yrs',
        hoursShort: 'h',
      },
      features: {
        back: 'Back to landing',
        badge: 'Product capability matrix',
        title: 'Real modules. Real routes. Real operations.',
        subtitle: 'This page maps existing AdSpectr capabilities in one professional view. Every card links to a live module.',
        groupClusterSubtitle: 'Capability cluster aligned to existing product workflows.',
        metric0v: '21+',
        metric0l: 'Mapped modules',
        metric1v: '4',
        metric1l: 'Core capability blocks',
        metric2v: '100%',
        metric2l: 'Route-linked cards',
        metric3v: 'EN/RU/UZ',
        metric3l: 'Localization ready',
        pillar0Title: 'Route validity',
        pillar0Desc: 'Cards point to existing routes, not mocked placeholders.',
        pillar1Title: 'Product alignment',
        pillar1Desc: 'Modules map to real internal capabilities and workflows.',
        pillar2Title: 'Conversion ready',
        pillar2Desc: 'Public users can inspect capabilities before sign-in.',
      },
      solutions: {
        back: 'Back to landing',
        badge: 'Solution blueprints',
        title: 'Pick the operating model that fits your team',
        subtitle: 'Each track is built from real internal modules so marketing promise matches product reality.',
        structureTitle: 'How this page is structured',
        structure0: 'Solution track by team model',
        structure1: 'Module stacks mapped to routes',
        structure2: 'Governance and operational alignment',
        step0Label: 'Step 1',
        step0Title: 'Select track',
        step0Desc: 'Choose growth, agency, or AI-led operation model.',
        step1Label: 'Step 2',
        step1Title: 'Review stack',
        step1Desc: 'See exactly which product modules support the model.',
        step2Label: 'Step 3',
        step2Title: 'Enter flow',
        step2Desc: 'Jump to the relevant route and start execution.',
        nextEyebrow: 'Next action',
        nextTitle: 'Need help choosing the right track?',
        nextSubtitle: 'Explore the full feature map or go straight into the product to test your workflow setup.',
        openFeatureMap: 'Open feature map',
        openProduct: 'Open product',
      },
      marketplacePublic: {
        heroBadge: 'Talent marketplace',
        heroTitle1: 'Find verified specialists',
        heroTitle2: 'for growth campaigns',
        heroSubtitle: 'Marketplace helps teams discover operators by ROAS, review quality, and niche experience before collaboration.',
        stat0v: '150+',
        stat0l: 'Specialists',
        stat1v: '4.8',
        stat1l: 'Avg rating',
        stat2v: '3.9x',
        stat2l: 'Avg ROAS',
        searchPlaceholder: 'Search by specialist, niche, or platform',
        advancedFilters: 'Advanced filters',
        openProfile: 'Open profile',
      },
      specialistProfile: {
        notFoundTitle: 'Specialist not found',
        notFoundLink: 'Back to marketplace',
        backLink: 'Back to marketplace',
        statsTitle: 'Statistics',
        tabOverview: 'Overview',
        tabPortfolio: 'Portfolio',
        tabTestimonials: 'Reviews',
        bio: 'Bio',
        knowledge: 'Details',
        experienceLabel: 'Experience',
        yearsUnit: 'years',
        campaignsManagedLabel: 'Campaigns managed',
        totalSpendLabel: 'Total spend',
        responseTimeLabel: 'Response time',
        hoursUnit: 'hours',
        reviewsLabel: 'Reviews',
        ratingLabel: 'Rating',
        successRateLabel: 'Success rate',
        languages: 'Languages',
        certifications: 'Certifications',
        portfolioSpend: 'spend',
        sidebarTitle: 'Get started',
        priceLabel: 'Price',
        locationLabel: 'Location',
        sendMessage: 'Send message',
        secondaryCta: 'User profile',
        trustNote: 'Contact via marketplace to start safely. Payments are handled securely through AdSpectr.',
      },
      portfolioPublic: {
        eyebrow: 'Specialist portfolio',
        title: 'Verified media buyers with transparent performance history',
        description: 'The portfolio directory helps brands evaluate specialists using campaign metrics, niche fit, and review context.',
        statSpecialists: 'Specialists',
        statManagedSpend: 'Managed spend',
        statAvgRoas: 'Average ROAS',
        statCampaigns: 'Campaigns',
        searchPlaceholder: 'Search by name, title, or niche',
        sortRoas: 'Sort by ROAS',
        sortRating: 'Sort by rating',
        sortSpend: 'Sort by managed spend',
        labelRoas: 'ROAS',
        labelCampaigns: 'Campaigns',
        labelSpend: 'Spend',
      },
      portfolioDetail: {
        reviewsWithCount: 'reviews',
        responseTime: 'Response time',
        location: 'Location',
        specializationTitle: 'Specialization niches',
        platformSplitTitle: 'Platform split',
        recentCampaignsTitle: 'Recent campaign samples',
        thNiche: 'Niche',
        thPlatform: 'Platform',
        thSpend: 'Spend',
        thRoas: 'ROAS',
        thStatus: 'Status',
      },
      leaderboardPublic: {
        eyebrow: 'Performance ranking',
        title: 'Top specialists by outcomes, consistency, and client trust',
        description: 'Compare specialists by ROAS, ratings, campaigns, and verified delivery patterns.',
        tabOverall: 'Overall',
        tabRising: 'Rising',
        tabRoas: 'ROAS leaders',
        tabRating: 'Top rated',
        top3Title: 'Top 3 specialists',
        campaignsJoin: 'campaigns',
      },
      onboarding: {
        title: 'Onboarding',
        subtitle: 'Set up your workspace, connect accounts, and invite your team. More guided steps will appear here soon.',
        login: 'Log in',
        register: 'Create account',
      },
  }

  const attachDynamic = (base) => {
    const out = structuredClone(base)
    out.features.groups = groups
    out.features.items = items
    out.solutions.tracks = sol
    return out
  }

  const ruOverrides = {
    common: {
      backToLanding: 'На главную',
      backToPortfolio: 'Назад в портфолио',
      backToMarketplace: 'Назад в маркетплейс',
      openModule: 'Открыть модуль',
      openProfile: 'Открыть профиль',
      openRelatedFlow: 'Открыть связанный поток',
      liveModuleTag: 'Живой модуль',
      solutionTrackTag: 'Трек решения',
      verified: 'Проверен',
      reviews: 'отзывов',
      campaignsDotBadges: 'кампаний',
      badgesWord: 'бейджей',
      dot: ' • ',
      perHour: '/час',
      spendSuffix: 'расход',
      yearsShort: 'лет',
      hoursShort: 'ч',
    },
    features: {
      back: 'На главную',
      badge: 'Матрица возможностей продукта',
      title: 'Реальные модули. Реальные маршруты. Реальные операции.',
      subtitle: 'Карта существующих возможностей AdSpectr. Каждая карточка ведёт в рабочий модуль.',
      groupClusterSubtitle: 'Кластер возможностей, привязанный к продуктовым процессам.',
      metric0v: '21+',
      metric0l: 'Сопоставленных модулей',
      metric1v: '4',
      metric1l: 'Блоков возможностей',
      metric2v: '100%',
      metric2l: 'Карточки с маршрутами',
      metric3v: 'EN/RU/UZ',
      metric3l: 'Готовность к локализации',
      pillar0Title: 'Валидность маршрутов',
      pillar0Desc: 'Ссылки ведут на существующие маршруты, а не на заглушки.',
      pillar1Title: 'Соответствие продукту',
      pillar1Desc: 'Модули отражают реальные внутренние возможности.',
      pillar2Title: 'Готовность к конверсии',
      pillar2Desc: 'Публичные пользователи могут изучить возможности до входа.',
    },
    solutions: {
      back: 'На главную',
      badge: 'Шаблоны решений',
      title: 'Выберите модель работы для вашей команды',
      subtitle: 'Каждый трек собран из реальных модулей — обещания совпадают с продуктом.',
      structureTitle: 'Структура страницы',
      structure0: 'Трек по модели команды',
      structure1: 'Стек модулей с маршрутами',
      structure2: 'Управление и операционное выравнивание',
      step0Label: 'Шаг 1',
      step0Title: 'Выберите трек',
      step0Desc: 'Growth, агентство или AI-led модель.',
      step1Label: 'Шаг 2',
      step1Title: 'Изучите стек',
      step1Desc: 'Какие модули поддерживают модель.',
      step2Label: 'Шаг 3',
      step2Title: 'Перейдите в поток',
      step2Desc: 'Откройте нужный маршрут и начните работу.',
      nextEyebrow: 'Дальше',
      nextTitle: 'Нужна помощь с выбором?',
      nextSubtitle: 'Откройте карту функций или сразу продукт для проверки настроек.',
      openFeatureMap: 'Карта функций',
      openProduct: 'Открыть продукт',
      tracks: sol,
    },
    marketplacePublic: {
      heroBadge: 'Маркетплейс талантов',
      heroTitle1: 'Найдите проверенных специалистов',
      heroTitle2: 'для growth-кампаний',
      heroSubtitle: 'Помогает командам находить операторов по ROAS, отзывам и нише до старта сотрудничества.',
      stat0v: '150+',
      stat0l: 'Специалистов',
      stat1v: '4.8',
      stat1l: 'Средний рейтинг',
      stat2v: '3.9x',
      stat2l: 'Средний ROAS',
      searchPlaceholder: 'Поиск по специалисту, нише или платформе',
      advancedFilters: 'Расширенные фильтры',
      openProfile: 'Открыть профиль',
    },
    specialistProfile: {
      notFoundTitle: 'Специалист не найден',
      notFoundLink: 'В маркетплейс',
      backLink: 'В маркетплейс',
      statsTitle: 'Статистика',
      tabOverview: 'Обзор',
      tabPortfolio: 'Портфолио',
      tabTestimonials: 'Отзывы',
      bio: 'Био',
      knowledge: 'Детали',
      experienceLabel: 'Опыт',
      yearsUnit: 'лет',
      campaignsManagedLabel: 'Кампаний',
      totalSpendLabel: 'Расход',
      responseTimeLabel: 'Время ответа',
      hoursUnit: 'часов',
      reviewsLabel: 'Отзывы',
      ratingLabel: 'Рейтинг',
      successRateLabel: 'Успешность',
      languages: 'Языки',
      certifications: 'Сертификаты',
      portfolioSpend: 'расход',
      sidebarTitle: 'Начать',
      priceLabel: 'Цена',
      locationLabel: 'Локация',
      sendMessage: 'Написать',
      secondaryCta: 'Профиль',
      trustNote: 'Свяжитесь через маркетплейс. Платежи безопасно через AdSpectr.',
    },
    portfolioPublic: {
      eyebrow: 'Портфолио специалистов',
      title: 'Проверенные байеры с прозрачной историей',
      description: 'Каталог помогает оценить специалистов по метрикам кампаний, нише и отзывам.',
      statSpecialists: 'Специалистов',
      statManagedSpend: 'Управляемый расход',
      statAvgRoas: 'Средний ROAS',
      statCampaigns: 'Кампаний',
      searchPlaceholder: 'Поиск по имени, должности или нише',
      sortRoas: 'По ROAS',
      sortRating: 'По рейтингу',
      sortSpend: 'По расходу',
      labelRoas: 'ROAS',
      labelCampaigns: 'Кампании',
      labelSpend: 'Расход',
    },
    portfolioDetail: {
      reviewsWithCount: 'отзывов',
      responseTime: 'Время ответа',
      location: 'Локация',
      specializationTitle: 'Ниши',
      platformSplitTitle: 'Платформы',
      recentCampaignsTitle: 'Примеры кампаний',
      thNiche: 'Ниша',
      thPlatform: 'Платформа',
      thSpend: 'Расход',
      thRoas: 'ROAS',
      thStatus: 'Статус',
    },
    leaderboardPublic: {
      eyebrow: 'Рейтинг эффективности',
      title: 'Топ специалистов по результатам и доверию',
      description: 'Сравнение по ROAS, рейтингам, кампаниям и проверенной доставке.',
      tabOverall: 'Общий',
      tabRising: 'Рост',
      tabRoas: 'Лидеры ROAS',
      tabRating: 'По рейтингу',
      top3Title: 'Топ-3 специалистов',
      campaignsJoin: 'кампаний',
    },
    onboarding: {
      title: 'Онбординг',
      subtitle: 'Настройте workspace, подключите аккаунты и пригласите команду. Подробные шаги скоро.',
      login: 'Войти',
      register: 'Создать аккаунт',
    },
  }

  const uzOverrides = {
    common: {
      backToLanding: 'Landingga qaytish',
      backToPortfolio: 'Portfolioga qaytish',
      backToMarketplace: 'Marketplacega qaytish',
      openModule: 'Modulni ochish',
      openProfile: 'Profilni ochish',
      openRelatedFlow: 'Bog‘liq oqimni ochish',
      liveModuleTag: 'Jonli modul',
      solutionTrackTag: 'Solution track',
      verified: 'Tasdiqlangan',
      reviews: 'sharh',
      campaignsDotBadges: 'kampaniya',
      badgesWord: 'badge',
      dot: ' • ',
      perHour: '/soat',
      spendSuffix: 'xarajat',
      yearsShort: 'yil',
      hoursShort: 'soat',
    },
    features: {
      back: 'Landingga qaytish',
      badge: 'Product imkoniyatlari matritsasi',
      title: 'Haqiqiy modullar. Haqiqiy route’lar. Haqiqiy operatsiyalar.',
      subtitle: 'AdSpectr ichidagi mavjud funksiyalar bitta professional xaritada. Har bir karta jonli modulga ulangan.',
      groupClusterSubtitle: 'Mavjud product workflow’lariga mos imkoniyat klasteri.',
      metric0v: '21+',
      metric0l: 'Xaritalangan modullar',
      metric1v: '4',
      metric1l: 'Asosiy imkoniyat bloklari',
      metric2v: '100%',
      metric2l: 'Route bilan bog‘langan kartalar',
      metric3v: 'EN/RU/UZ',
      metric3l: 'Lokalizatsiyaga tayyor',
      pillar0Title: 'Route haqiqiyligi',
      pillar0Desc: 'Kartalar mavjud route’larga boradi, mock emas.',
      pillar1Title: 'Product mosligi',
      pillar1Desc: 'Modullar ichki imkoniyatlarga mos.',
      pillar2Title: 'Konversiyaga tayyor',
      pillar2Desc: 'Foydalanuvchilar kirishdan oldin imkoniyatlarni ko‘radi.',
    },
    solutions: {
      back: 'Landingga qaytish',
      badge: 'Solution blueprintlar',
      title: 'Jamoaingizga mos operatsion modelni tanlang',
      subtitle: 'Har bir track haqiqiy ichki modullardan yig‘ilgan — va’dalar mahsulot bilan mos.',
      structureTitle: 'Sahifa tuzilishi',
      structure0: 'Jamo modeli bo‘yicha track',
      structure1: 'Route bilan bog‘langan modul stack',
      structure2: 'Boshqaruv va operatsion moslashuv',
      step0Label: '1-qadam',
      step0Title: 'Track tanlash',
      step0Desc: 'Growth, agentlik yoki AI-led model.',
      step1Label: '2-qadam',
      step1Title: 'Stackni ko‘rish',
      step1Desc: 'Qaysi modullar modelni qo‘llab-quvvatlaydi.',
      step2Label: '3-qadam',
      step2Title: 'Oqimga kirish',
      step2Desc: 'Kerakli route’ga o‘ting va bajaring.',
      nextEyebrow: 'Keyingi qadam',
      nextTitle: 'Track tanlashda yordam kerakmi?',
      nextSubtitle: 'To‘liq feature xaritasini oching yoki workflow uchun to‘g‘ridan-to‘g‘ri productga kiring.',
      openFeatureMap: 'Feature xaritasini ochish',
      openProduct: 'Productni ochish',
      tracks: sol,
    },
    marketplacePublic: {
      heroBadge: 'Talent marketplace',
      heroTitle1: 'Tasdiqlangan mutaxassis topish',
      heroTitle2: 'growth kampaniyalari uchun',
      heroSubtitle: 'Marketplace jamoalarga hamkorlikdan oldin ROAS, sharh sifati va tajriba bo‘yicha operatorlarni topishda yordam beradi.',
      stat0v: '150+',
      stat0l: 'Mutaxassis',
      stat1v: '4.8',
      stat1l: 'O‘rtacha reyting',
      stat2v: '3.9x',
      stat2l: 'O‘rtacha ROAS',
      searchPlaceholder: 'Mutaxassis, nisha yoki platforma bo‘yicha qidiruv',
      advancedFilters: 'Kengaytirilgan filtrlar',
      openProfile: 'Profilni ochish',
    },
    specialistProfile: {
      notFoundTitle: 'Mutaxassis topilmadi',
      notFoundLink: 'Marketplacega qaytish',
      backLink: 'Marketplacega qaytish',
      statsTitle: 'Statistika',
      tabOverview: 'Haqida',
      tabPortfolio: 'Portfolio',
      tabTestimonials: 'Sharhlar',
      bio: 'Bio',
      knowledge: 'Batafsil',
      experienceLabel: 'Tajriba',
      yearsUnit: 'yil',
      campaignsManagedLabel: 'Boshqarilgan kampaniyalar',
      totalSpendLabel: 'Jami xarajat',
      responseTimeLabel: 'Javob vaqti',
      hoursUnit: 'soat',
      reviewsLabel: 'Sharhlar',
      ratingLabel: 'Reyting',
      successRateLabel: 'Muvaffaqiyat',
      languages: 'Tillar',
      certifications: 'Sertifikatlar',
      portfolioSpend: 'xarajat',
      sidebarTitle: 'Boshlash',
      priceLabel: 'Narx',
      locationLabel: 'Joylashuv',
      sendMessage: 'Xabar yuborish',
      secondaryCta: 'Foydalanuvchi profili',
      trustNote: 'Marketplace orqali bog‘laning. To‘lovlar AdSpectr orqali xavfsiz.',
    },
    portfolioPublic: {
      eyebrow: 'Mutaxassis portfoliosi',
      title: 'Shaffof tarixli tasdiqlangan media buyerlar',
      description: 'Katalog brendlarga kampaniya metrikalari, nisha va sharh konteksti bo‘yicha baholashda yordam beradi.',
      statSpecialists: 'Mutaxassislar',
      statManagedSpend: 'Boshqarilgan xarajat',
      statAvgRoas: 'O‘rtacha ROAS',
      statCampaigns: 'Kampaniyalar',
      searchPlaceholder: 'Ism, lavozim yoki nisha bo‘yicha qidiruv',
      sortRoas: 'ROAS bo‘yicha',
      sortRating: 'Reyting bo‘yicha',
      sortSpend: 'Boshqarilgan xarajat bo‘yicha',
      labelRoas: 'ROAS',
      labelCampaigns: 'Kampaniyalar',
      labelSpend: 'Xarajat',
    },
    portfolioDetail: {
      reviewsWithCount: 'sharh',
      responseTime: 'Javob vaqti',
      location: 'Joylashuv',
      specializationTitle: 'Ixtisoslashgan nishalar',
      platformSplitTitle: 'Platforma taqsimoti',
      recentCampaignsTitle: 'So‘nggi kampaniya namunalari',
      thNiche: 'Nisha',
      thPlatform: 'Platforma',
      thSpend: 'Xarajat',
      thRoas: 'ROAS',
      thStatus: 'Holat',
    },
    leaderboardPublic: {
      eyebrow: 'Performance reytingi',
      title: 'Natija, barqarorlik va ishonch bo‘yicha top mutaxassislar',
      description: 'ROAS, reyting, kampaniyalar va tasdiqlangan yetkazish naqshlari bo‘yicha solishtiring.',
      tabOverall: 'Umumiy',
      tabRising: 'O‘sish',
      tabRoas: 'ROAS yetakchilari',
      tabRating: 'Reyting bo‘yicha',
      top3Title: 'Top 3 mutaxassis',
      campaignsJoin: 'kampaniya',
    },
    onboarding: {
      title: 'Onboarding',
      subtitle: 'Workspace sozlang, accountlarni ulang va jamoani taklif qiling. Batafsil qadamlar tez orada.',
      login: 'Kirish',
      register: 'Akkaunt yaratish',
    },
  }

  if (loc === 'en') return attachDynamic(MARKETING_EN)
  if (loc === 'ru') return attachDynamic(deepMerge(MARKETING_EN, ruOverrides))
  return attachDynamic(deepMerge(MARKETING_EN, uzOverrides))
}

function deepMerge(base, over) {
  const out = structuredClone(base)
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}

for (const loc of ['en', 'ru', 'uz']) {
  const fp = path.join(localesDir, `${loc}.json`)
  const j = JSON.parse(fs.readFileSync(fp, 'utf8'))
  j.publicSite.marketing = buildMarketing(loc)
  fs.writeFileSync(fp, `${JSON.stringify(j, null, 2)}\n`)
}

console.log('Merged publicSite.marketing into en.json, ru.json, uz.json')
