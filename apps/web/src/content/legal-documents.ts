/**
 * Full legal copy for public pages (Privacy, Terms, Data deletion).
 * Kept in TypeScript (not locale JSON) because of length and Meta / compliance review needs.
 * Update `lastUpdated` when you materially change a document.
 */
import type { Language } from '@/i18n/config'

export type LegalSection = { title: string; paragraphs: string[] }

export type LegalDocument = {
  title: string
  lastUpdatedLabel: string
  lead: string
  sections: LegalSection[]
}

/** Public contact emails — ensure inboxes exist or forward to your team. */
export const LEGAL_CONTACT = {
  support: 'support@adspectr.com',
  privacy: 'privacy@adspectr.com',
} as const

const privacyRu: LegalDocument = {
  title: 'Политика конфиденциальности',
  lastUpdatedLabel: 'Последнее обновление: 22 апреля 2026 г.',
  lead:
    'Настоящая Политика конфиденциальности описывает, как AdSpectr («мы», «нас», «Сервис») собирает, использует, хранит и раскрывает информацию при использовании веб-сайта https://adspectr.com, связанных поддоменов и облачной платформы AdSpectr (далее — «Платформа»). Используя Платформу, вы подтверждаете, что ознакомились с этой Политикой.',
  sections: [
    {
      title: '1. Кто отвечает за обработку данных',
      paragraphs: [
        'Оператором персональных данных в отношении Платформы AdSpectr является владелец сервиса AdSpectr. Юридические реквизиты оператора, применимые к вашему договору (если заключён), указываются в счёте, оферте или соглашении с клиентом.',
        `По вопросам персональных данных и реализации ваших прав вы можете связаться с нами: ${LEGAL_CONTACT.privacy} (предпочтительно для запросов о конфиденциальности) или ${LEGAL_CONTACT.support} (общая поддержка).`,
      ],
    },
    {
      title: '2. Область действия и определения',
      paragraphs: [
        'Платформа предназначена для бизнес-пользователей (рекламодателей, агентств и их сотрудников), которые управляют рекламными кампаниями, аналитикой и смежными процессами.',
        '«Персональные данные» — любая информация, относящаяся к прямо или косвенно определённому физическому лицу. «Обработка» — любые действия с персональными данными, включая сбор, хранение, использование и удаление.',
      ],
    },
    {
      title: '3. Какие данные мы собираем',
      paragraphs: [
        'Данные аккаунта и профиля: имя, адрес электронной почты, идентификатор пользователя, роль в workspace, настройки языка, данные аутентификации (например, хэш пароля при регистрации по email), технические идентификаторы сессии.',
        'Данные workspace (рабочего пространства): название организации, отрасль, цели использования, приглашения участников команды, журналы активности в пределах Платформы (кто и когда совершил действие, если эта функция включена).',
        'Данные, полученные при подключении рекламных платформ (по вашему явному действию «Подключить»): токены OAuth и идентификаторы, необходимые для доступа к API (например, Meta / Facebook Marketing API, Google Ads и другие интеграции, которые вы активируете). Мы можем получать сводные и детализированные данные о рекламных аккаунтах, кампаниях, расходах и метриках в объёме, разрешённом выданными вами разрешениями.',
        'Данные, полученные через Facebook Login / Meta при авторизации или при подключении рекламного кабинета: идентификаторы Meta, разрешённые области доступа (scopes), а также данные профиля и рекламных объектов в рамках предоставленного вами согласия и политик Meta.',
        'Технические и служебные данные: IP-адрес, тип браузера, диагностические логи, cookie и аналогичные технологии (см. раздел о cookie), данные об ошибках и производительности для обеспечения безопасности и стабильности.',
        'Платёжная информация: при оплате подписки или услуг обработку платёжных карт и реквизитов может осуществлять лицензированный платёжный провайдер; мы храним минимально необходимые данные о транзакциях (статус, сумма, идентификатор платежа), а не полные данные карты, если иное прямо не требуется провайдером.',
        'Коммуникации: сообщения в поддержку, содержимое тикетов, переписка по email.',
      ],
    },
    {
      title: '4. Цели обработки',
      paragraphs: [
        'Предоставление и улучшение Платформы: регистрация, аутентификация, управление workspace и командой, отображение отчётов и рекомендаций.',
        'Интеграция с рекламными системами: синхронизация кампаний и метрик, автоматизация задач, которые вы настраиваете.',
        'Безопасность: предотвращение мошенничества, злоупотреблений, расследование инцидентов, соблюдение лимитов API.',
        'Соблюдение закона: исполнение требований регуляторов, налогового и бухгалтерского учёта, ответы на законные запросы государственных органов при наличии оснований.',
        'Коммуникации с вами: уведомления о сервисе, ответы в поддержку, важные изменения условий (в объёме, разрешённом законом).',
        'Аналитика продукта в обезличенном или агрегированном виде, если применимо.',
      ],
    },
    {
      title: '5. Правовые основания',
      paragraphs: [
        'Мы обрабатываем персональные данные на основании: исполнения договора с вами (оказание услуг Платформы); вашего согласия (например, подключение сторонних аккаунтов, маркетинговые рассылки — если вы отдельно согласились); законных интересов (безопасность, защита прав, улучшение сервиса) — когда они не противоречат вашим правам; юридических обязательств, где это требуется.',
      ],
    },
    {
      title: '6. Передача третьим лицам и субобработчики',
      paragraphs: [
        'Мы не продаём ваши персональные данные. Мы можем передавать данные поставщикам инфраструктуры (облачный хостинг), платёжным провайдерам, сервисам email/уведомлений, аналитике в агрегированном виде, а также официальным API Meta, Google и других платформ — строго для предоставления выбранных вами функций.',
        'Третьи стороны обрабатывают данные в соответствии со своими политиками: например, Meta Platforms Technologies (политики Meta / Facebook), Google (политики Google). Мы рекомендуем ознакомиться с их документами при подключении интеграций.',
      ],
    },
    {
      title: '7. Международная передача',
      paragraphs: [
        'Инфраструктура и субобработчики могут находиться за пределами вашей страны. В таких случаях мы применяем организационные и технические меры, соответствующие применимому законодательству (договоры, стандартные положения, минимизация данных).',
      ],
    },
    {
      title: '8. Сроки хранения',
      paragraphs: [
        'Мы храним данные, пока ваш аккаунт активен и требуется для оказания услуг, а также в течение сроков, установленных законом (например, бухгалтерские документы). Токены интеграций хранятся до отзыва доступа или отключения интеграции вами.',
        'Резервные копии могут сохраняться ограниченное время после удаления основной записи. Подробности удаления — на странице «Удаление данных».',
      ],
    },
    {
      title: '9. Cookie и похожие технологии',
      paragraphs: [
        'Мы используем cookie и аналоги для входа в аккаунт, сохранения настроек (например, языка), безопасности и (при наличии) аналитики. Вы можете ограничить cookie в настройках браузера; часть функций может стать недоступной.',
      ],
    },
    {
      title: '10. Безопасность',
      paragraphs: [
        'Мы применяем организационные и технические меры: шифрование при передаче (HTTPS), ограничение доступа по ролям, журналирование критичных действий, разделение окружений. Ни один метод не гарантирует абсолютную безопасность; сообщайте о подозрительной активности в поддержку.',
      ],
    },
    {
      title: '11. Ваши права',
      paragraphs: [
        'В зависимости от применимого закона вы можете иметь право на доступ, исправление, удаление, ограничение обработки, возражение, переносимость данных, отзыв согласия (если обработка основана на согласии).',
        `Для реализации прав обращайтесь на ${LEGAL_CONTACT.privacy}. Мы ответим в разумный срок (обычно до 30 дней), если иное не предусмотрено законом. Вы также вправе подать жалобу в уполномоченный орган по защите данных в вашей юрисдикции.`,
      ],
    },
    {
      title: '12. Дети',
      paragraphs: [
        'Платформа не предназначена для лиц младше 16 лет (или возраста цифрового согласия в вашей стране). Мы не собираем персональные данные детей целенаправленно. Если вы считаете, что ребёнок предоставил нам данные, свяжитесь с нами для удаления.',
      ],
    },
    {
      title: '13. Изменения Политики',
      paragraphs: [
        'Мы можем обновлять эту Политику. Актуальная версия всегда доступна по адресу https://adspectr.com/privacy. Существенные изменения будут доведены до вашего сведения разумным способом (например, уведомление в интерфейсе или по email), если это требуется законом.',
      ],
    },
    {
      title: '14. Контакты',
      paragraphs: [
        `Вопросы по конфиденциальности: ${LEGAL_CONTACT.privacy}. Общая поддержка: ${LEGAL_CONTACT.support}.`,
      ],
    },
  ],
}

const privacyEn: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdatedLabel: 'Last updated: April 22, 2026',
  lead:
    'This Privacy Policy explains how AdSpectr (“we”, “us”, “the Service”) collects, uses, stores, and discloses information when you use https://adspectr.com, related subdomains, and the AdSpectr cloud platform (the “Platform”). By using the Platform, you acknowledge that you have read this Policy.',
  sections: [
    {
      title: '1. Data controller',
      paragraphs: [
        'The operator of personal data for the AdSpectr Platform is the AdSpectr service owner. Legal entity details applicable to your contract (if any) appear on your invoice, order form, or customer agreement.',
        `Privacy requests: ${LEGAL_CONTACT.privacy}. General support: ${LEGAL_CONTACT.support}.`,
      ],
    },
    {
      title: '2. Scope and definitions',
      paragraphs: [
        'The Platform is built for business users (advertisers, agencies, and their staff) managing advertising campaigns, analytics, and related workflows.',
        '“Personal data” means any information relating to an identified or identifiable natural person. “Processing” means any operation on personal data, including collection, storage, use, and deletion.',
      ],
    },
    {
      title: '3. Data we collect',
      paragraphs: [
        'Account and profile: name, email, user ID, workspace role, language preferences, authentication data (e.g. password hash for email login), session identifiers.',
        'Workspace data: organization name, industry, usage goals, team invitations, in-product activity logs (who did what and when, where the feature is enabled).',
        'Advertising platform connections (when you choose “Connect”): OAuth tokens and identifiers required to call APIs (e.g. Meta / Facebook Marketing API, Google Ads, and other integrations you enable). We may receive summarized and detailed data about ad accounts, campaigns, spend, and metrics within the permissions you grant.',
        'Facebook Login / Meta: when you authenticate or connect ad assets, we may receive Meta identifiers, granted scopes, and profile/ad object data permitted by your consent and Meta’s policies.',
        'Technical data: IP address, browser type, diagnostic logs, cookies and similar technologies (see Cookies), error and performance data for security and reliability.',
        'Payments: card data is typically processed by a licensed payment provider; we keep minimal transaction metadata (status, amount, payment reference) unless the provider requires more.',
        'Communications: support tickets, emails, and in-app messages you send us.',
      ],
    },
    {
      title: '4. Purposes of processing',
      paragraphs: [
        'Provide and improve the Platform: registration, authentication, workspace and team management, reporting and recommendations.',
        'Integrate ad platforms: sync campaigns and metrics, automate tasks you configure.',
        'Security: fraud prevention, abuse detection, incident response, API rate limits.',
        'Legal compliance: regulatory, tax, and accounting obligations, lawful requests from authorities where applicable.',
        'Communications: service notices, support responses, material changes to terms where allowed by law.',
        'Product analytics in de-identified or aggregated form, where applicable.',
      ],
    },
    {
      title: '5. Legal bases',
      paragraphs: [
        'We rely on: performance of a contract with you; your consent (e.g. connecting third-party accounts, marketing emails if you opt in); legitimate interests (security, protecting rights, improving the service) where not overridden by your rights; legal obligations where required.',
      ],
    },
    {
      title: '6. Sharing and subprocessors',
      paragraphs: [
        'We do not sell personal data. We may share data with infrastructure vendors (cloud hosting), payment processors, email/notification providers, aggregated analytics vendors, and official APIs (Meta, Google, etc.) strictly to deliver features you enable.',
        'Third parties process data under their own policies (e.g. Meta, Google). Review their documents when enabling integrations.',
      ],
    },
    {
      title: '7. International transfers',
      paragraphs: [
        'Infrastructure and subprocessors may be located outside your country. We implement safeguards consistent with applicable law (contracts, standard clauses, data minimization).',
      ],
    },
    {
      title: '8. Retention',
      paragraphs: [
        'We keep data while your account is active and as needed to provide the service, and for periods required by law (e.g. accounting). Integration tokens are kept until you revoke access or disconnect.',
        'Backups may persist for a limited period after primary deletion. See the Data Deletion page for user-driven deletion requests.',
      ],
    },
    {
      title: '9. Cookies and similar technologies',
      paragraphs: [
        'We use cookies and similar technologies for sign-in, preferences (e.g. language), security, and analytics where applicable. Browser controls can limit cookies; some features may not work without them.',
      ],
    },
    {
      title: '10. Security',
      paragraphs: [
        'We use organizational and technical measures such as encryption in transit (HTTPS), role-based access, audit logs for critical actions, and environment separation. No method is 100% secure; report suspected incidents to support.',
      ],
    },
    {
      title: '11. Your rights',
      paragraphs: [
        'Depending on applicable law, you may have rights to access, rectify, erase, restrict, object, port data, and withdraw consent where processing is consent-based.',
        `Contact ${LEGAL_CONTACT.privacy}. We typically respond within 30 days unless law requires otherwise. You may lodge a complaint with your local data protection authority.`,
      ],
    },
    {
      title: '12. Children',
      paragraphs: [
        'The Platform is not directed to children under 16 (or the digital consent age in your region). If you believe a child provided data, contact us for deletion.',
      ],
    },
    {
      title: '13. Changes',
      paragraphs: [
        'We may update this Policy. The current version is always at https://adspectr.com/privacy. Material changes may be notified as required by law (e.g. in-app notice or email).',
      ],
    },
    {
      title: '14. Contact',
      paragraphs: [
        `Privacy: ${LEGAL_CONTACT.privacy}. Support: ${LEGAL_CONTACT.support}.`,
      ],
    },
  ],
}

const privacyUz: LegalDocument = {
  title: 'Maxfiylik siyosati',
  lastUpdatedLabel: 'Oxirgi yangilanish: 2026-yil 22-aprel',
  lead:
    'Ushbu Maxfiylik siyosati AdSpectr («biz», «xizmat») https://adspectr.com sayti, tegishli subdomenlar va AdSpectr bulut platformasidan («Platforma») foydalanishda qanday maʼlumot yigʻilishi, ishlatilishi, saqlanishi va ochilishi haqida tushuntiradi. Platformadan foydalanish bilan siz ushbu Siyosat bilan tanishganingizni tasdiqlaysiz.',
  sections: [
    {
      title: '1. Maʼlumotlarni kim boshqaradi',
      paragraphs: [
        'AdSpectr Platformasi boʻyicha shaxsiy maʼlumotlar operatori — AdSpectr xizmatining egasi. Shartnoma (agar mavjud boʻlsa) boʻyicha yuridik rekvizitlar hisob-faktura yoki mijoz bilan kelishuvda koʻrsatiladi.',
        `Shaxsiy maʼlumotlar boʻyicha: ${LEGAL_CONTACT.privacy}. Umumiy yordam: ${LEGAL_CONTACT.support}.`,
      ],
    },
    {
      title: '2. Qamrov va taʼriflar',
      paragraphs: [
        'Platforma biznes foydalanuvchilari (reklama beruvchilar, agentliklar va xodimlari) uchun moʻljallangan.',
        '«Shaxsiy maʼlumot» — aniqlangan yoki aniqlanishi mumkin boʻlgan jismoniy shaxsga tegishli har qanday maʼlumot. «Qayta ishlash» — yigʻish, saqlash, foydalanish va oʻchirish kabi har qanday amallar.',
      ],
    },
    {
      title: '3. Qanday maʼlumotlar yigʻiladi',
      paragraphs: [
        'Hisob va profil: ism, email, foydalanuvchi ID, workspace roli, til sozlamalari, autentifikatsiya (masalan, email orqali kirishda parol xeshi), sessiya identifikatorlari.',
        'Workspace: tashkilot nomi, soha, maqsadlar, jamoa takliflari, Platforma ichidagi faollik jurnali (funksiya yoqilgan boʻlsa).',
        'Reklama platformalarini ulash (siz «Ulash»ni tanlaganingizda): OAuth tokenlari va API chaqirish uchun identifikatorlar (masalan, Meta / Facebook Marketing API, Google Ads va siz yoqgan boshqa integratsiyalar). Ruxsat bergan doirada reklama hisoblari, kampaniyalar, xarajat va metrikalar haqida maʼlumotlar kelishi mumkin.',
        'Facebook Login / Meta: autentifikatsiya yoki reklama aktivlarini ulashda Meta identifikatorlari, berilgan scopeʼlar va Meta siyosatiga mos profil/reklama maʼlumotlari.',
        'Texnik maʼlumotlar: IP, brauzer turi, diagnostika jurnallari, cookie va oʻxshash texnologiyalar, xavfsizlik va barqarorlik uchun xatolik/mahsuldorlik maʼlumotlari.',
        'Toʻlovlar: karta maʼlumotlari odatda litsenziyalangan provayder orqali; biz minimal tranzaksiya metamaʼlumotlarini saqlaymiz.',
        'Murojaatlar: yordam xabarlari, email.',
      ],
    },
    {
      title: '4. Qayta ishlash maqsadlari',
      paragraphs: [
        'Xizmatni koʻrsatish va yaxshilash: roʻyxatdan oʻtish, autentifikatsiya, workspace va jamoa boshqaruvi, hisobotlar.',
        'Reklama tizimlari bilan integratsiya: kampaniya va metrikalarni sinxronlash, sozlangan avtomatlashtirish.',
        'Xavfsizlik: firibgarlikning oldini olish, API cheklovlari.',
        'Qonuniy talablar: soliq, hisob-kitob, qonuniy soʻrovlar.',
        'Aloqa: xizmat bildirishnomalari, yordam javoblari.',
        'Mahsulot tahlili — agregatsiyalangan yoki anonimlashtirilgan shaklda.',
      ],
    },
    {
      title: '5. Huquqiy asoslar',
      paragraphs: [
        'Shartnomani bajarish; rozilik (uchinchi tomon hisoblarini ulash, marketing — alohida rozilik boʻlsa); qonuniy manfaatlar (xavfsizlik, huquqlarni himoya qilish); qonuniy majburiyatlar.',
      ],
    },
    {
      title: '6. Uchinchi tomon va subprocessorlar',
      paragraphs: [
        'Biz shaxsiy maʼlumotlarni sotmaymiz. Bulut, toʻlov, email/xabar, rasmiy API (Meta, Google va h.k.) — faqat siz yoqgan funksiyalar uchun.',
        'Uchinchi tomon oʻz siyosatlari boʻyicha ishlaydi; integratsiyalarni yoqishdan oldin ularning hujjatlarini oʻqing.',
      ],
    },
    {
      title: '7. Xalqaro uzatish',
      paragraphs: [
        'Infrastruktura boshqa mamlakatda boʻlishi mumkin. Qonunga mos choralarni qoʻllaymiz (shartnomalar, maʼlumotlarni minimallashtirish).',
      ],
    },
    {
      title: '8. Saqlash muddati',
      paragraphs: [
        'Hisob faol boʻlgan va xizmat uchun kerak boʻlgan muddatda; qonun talab qilgan hollarda qoʻshimcha. Integratsiya tokenlari — siz ulanishni bekor qilgungacha.',
        'Zaxira nusxalar cheklangan vaqt saqlanishi mumkin. Foydalanuvchi oʻchirish soʻrovi — «Maʼlumotlarni oʻchirish» sahifasida.',
      ],
    },
    {
      title: '9. Cookie',
      paragraphs: [
        'Cookie va oʻxshash texnologiyalar: kirish, til sozlamalari, xavfsizlik, (mavjud boʻlsa) tahlil. Brauzer sozlamalari cheklashi mumkin; baʼzi funksiyalar ishlamasligi mumkin.',
      ],
    },
    {
      title: '10. Xavfsizlik',
      paragraphs: [
        'HTTPS, rollar boʻyicha kirish, muhim amallar jurnali, muhitlarni ajratish. 100% kafolat yoʻq; shubhali holatlar haqida yordamga xabar bering.',
      ],
    },
    {
      title: '11. Sizning huquqlaringiz',
      paragraphs: [
        'Qonunga qarab: kirish, tuzatish, oʻchirish, cheklash, qarshilik, portativlik, rozilikni qaytarish.',
        `Murojaat: ${LEGAL_CONTACT.privacy}. Odatda 30 kun ichida javob. Shikoyat — mahalliy maʼlumotlarni himoya qilish organiga.`,
      ],
    },
    {
      title: '12. Bolalar',
      paragraphs: [
        'Platforma 16 yoshgacha (yoki mamlakatingizdagi raqamli rozilik yoshi) bolalar uchun emas. Boladan maʼlumot tushganini bilgan boʻlsangiz, biz bilan bogʻlaning.',
      ],
    },
    {
      title: '13. Oʻzgarishlar',
      paragraphs: [
        'Siyosatni yangilashimiz mumkin. Aktual matn: https://adspectr.com/privacy. Mohim oʻzgarishlar qonun talab qilsa bildiriladi.',
      ],
    },
    {
      title: '14. Aloqa',
      paragraphs: [
        `Maxfiylik: ${LEGAL_CONTACT.privacy}. Yordam: ${LEGAL_CONTACT.support}.`,
      ],
    },
  ],
}

const termsRu: LegalDocument = {
  title: 'Условия использования',
  lastUpdatedLabel: 'Последнее обновление: 22 апреля 2026 г.',
  lead:
    'Настоящие Условия использования («Условия») регулируют доступ и использование Платформы AdSpectr. Создавая аккаунт или используя Платформу, вы соглашаетесь с Условиями. Если вы действуете от имени организации, вы подтверждаете, что уполномочены связать эту организацию с настоящими Условиями.',
  sections: [
    {
      title: '1. Описание сервиса',
      paragraphs: [
        'AdSpectr предоставляет облачное программное обеспечение для управления рекламными кампаниями, аналитикой, командной работой и связанными функциями (ИИ-подсказки, отчёты, интеграции с рекламными системами — в объёме, доступном на момент использования).',
        'Мы можем изменять, приостанавливать или прекращать отдельные функции с уведомлением, если это разумно и не противоречит договору с вами.',
      ],
    },
    {
      title: '2. Регистрация и аккаунт',
      paragraphs: [
        'Вы обязуетесь предоставлять достоверные данные и поддерживать безопасность учётных данных. Вы несёте ответственность за действия под вашим аккаунтом, включая действия приглашённых участников команды в пределах выданных им прав.',
        'Вы должны незамедлительно уведомить нас о несанкционированном доступе: через поддержку.',
      ],
    },
    {
      title: '3. Допустимое использование',
      paragraphs: [
        'Запрещено: нарушать законы; пытаться получить несанкционированный доступ к системам или данным других клиентов; вмешиваться в работу Платформы; использовать Платформу для распространения вредоносного кода, спама или обмана; обходить технические ограничения или лимиты API; использовать Платформу способом, нарушающим правила рекламных платформ (Meta, Google и др.).',
        'Мы вправе приостановить или прекратить доступ при нарушении Условий или угрозе безопасности.',
      ],
    },
    {
      title: '4. Рекламные платформы и данные третьих сторон',
      paragraphs: [
        'При подключении Meta, Google Ads и других систем вы самостоятельно отвечаете за соблюдение их правил, политик, ограничений по данным и рекламному контенту. Мы не являемся представителем Meta или Google и не контролируем их API вне объёма технической интеграции.',
        'Вы подтверждаете, что имеете необходимые права на рекламные аккаунты и данные, которые подключаете к Платформе.',
      ],
    },
    {
      title: '5. Интеллектуальная собственность',
      paragraphs: [
        'Платформа, её код, дизайн, торговые обозначения и контент AdSpectr (кроме ваших материалов) принадлежат нам или нашим лицензиарам. Мы предоставляем вам ограниченную неисключительную лицензию на использование Платформы в соответствии с Условиями.',
        'Вы сохраняете права на ваши материалы (креативы, тексты, базы клиентов и т.д.), загружаемые в Платформу. Вы предоставляете нам лицензию на обработку этих материалов в целях оказания услуг.',
      ],
    },
    {
      title: '6. Подписка, оплата и налоги',
      paragraphs: [
        'Если вы используете платные тарифы, применяются цены и условия, указанные при оформлении. Платежи могут обрабатываться третьими сторонами. Налоги и сборы, если применимы, могут добавляться в соответствии с законодательством.',
        'Возвраты и споры по оплате рассматриваются по правилам, указанным в интерфейсе оплаты или отдельном договоре.',
      ],
    },
    {
      title: '7. Отказ от гарантий',
      paragraphs: [
        'Платформа предоставляется по принципу «как есть» и «как доступно». Мы не гарантируем отсутствие ошибок, бесперебойную работу или достижение конкретных рекламных результатов (ROAS, CPA и т.д.). Решения ИИ и рекомендации носят вспомогательный характер; финальные решения по бюджетам и запускам принимаете вы.',
      ],
    },
    {
      title: '8. Ограничение ответственности',
      paragraphs: [
        'В максимальной степени, разрешённой законом, мы не несём ответственности за косвенные, случайные, специальные или последующие убытки, упущенную выгоду, потерю данных или репутации. Совокупная ответственность по претензиям, связанным с Платформой, ограничивается суммой, уплаченной вами нам за Платформу за последние двенадцать (12) месяцев до события, вызвавшего претензию, либо минимальной суммой, установленной законом, если она выше.',
        'Мы не отвечаем за сбои рекламных платформ, изменения политик Meta/Google, блокировки аккаунтов на стороне третьих лиц.',
      ],
    },
    {
      title: '9. Возмещение убытков (индемнитет)',
      paragraphs: [
        'Вы обязуетесь возмещать убытки и ограждать нас от претензий третьих лиц, возникающих из вашего контента, вашего нарушения закона или Условий, либо из вашего использования рекламных аккаунтов без надлежащих полномочий.',
      ],
    },
    {
      title: '10. Прекращение',
      paragraphs: [
        'Вы можете прекратить использование, удалив аккаунт или обратившись в поддержку. Мы можем приостановить или закрыть доступ при нарушении Условий, неоплате (для платных тарифов) или по требованию закона.',
        'После прекращения доступа ваши данные обрабатываются в соответствии с Политикой конфиденциальности и страницей удаления данных.',
      ],
    },
    {
      title: '11. Применимое право и споры',
      paragraphs: [
        'Если иное не согласовано в отдельном письменном договоре, к Условиям применяется законодательство Республики Узбекистан. Споры подлежат рассмотрению в судах по месту нахождения оператора, если императивные нормы вашей страны не предусматривают иное.',
      ],
    },
    {
      title: '12. Изменения Условий',
      paragraphs: [
        'Мы можем обновлять Условия. Актуальная версия: https://adspectr.com/terms. Продолжение использования после вступления изменений в силу может означать согласие, если это допускается законом; при существенных изменениях мы уведомим вас разумным способом.',
      ],
    },
    {
      title: '13. Контакты',
      paragraphs: [
        `Поддержка: ${LEGAL_CONTACT.support}. Вопросы по оплате и договорам — через тот же канал с указанием организации и workspace.`,
      ],
    },
  ],
}

const termsEn: LegalDocument = {
  title: 'Terms of Service',
  lastUpdatedLabel: 'Last updated: April 22, 2026',
  lead:
    'These Terms of Service (“Terms”) govern access to and use of the AdSpectr Platform. By creating an account or using the Platform, you agree to the Terms. If you use the Platform on behalf of an organization, you represent that you have authority to bind that organization.',
  sections: [
    {
      title: '1. The service',
      paragraphs: [
        'AdSpectr provides cloud software to manage advertising campaigns, analytics, team collaboration, and related features (AI assistance, reporting, integrations — as available).',
        'We may modify, suspend, or discontinue features with reasonable notice where practicable and consistent with any agreement with you.',
      ],
    },
    {
      title: '2. Accounts',
      paragraphs: [
        'You must provide accurate information and keep credentials secure. You are responsible for activity under your account, including actions by invited teammates within their permissions.',
        'Notify us promptly of unauthorized access via support.',
      ],
    },
    {
      title: '3. Acceptable use',
      paragraphs: [
        'You may not: break the law; attempt unauthorized access to our systems or other customers’ data; interfere with the Platform; distribute malware, spam, or deceptive content; circumvent technical limits or API quotas; use the Platform in violation of ad platform rules (Meta, Google, etc.).',
        'We may suspend or terminate access for violations or security risks.',
      ],
    },
    {
      title: '4. Third-party ad platforms',
      paragraphs: [
        'When you connect Meta, Google Ads, or others, you are responsible for complying with their policies and data restrictions. We are not Meta or Google; we only provide technical integration.',
        'You confirm you have authority over the ad accounts and data you connect.',
      ],
    },
    {
      title: '5. Intellectual property',
      paragraphs: [
        'The Platform, branding, and our content are owned by us or licensors. We grant a limited, non-exclusive license to use the Platform per these Terms.',
        'You retain rights to your materials uploaded to the Platform and grant us a license to process them to provide the service.',
      ],
    },
    {
      title: '6. Fees, taxes',
      paragraphs: [
        'Paid plans are billed as presented at purchase. Payments may be processed by third-party providers. Applicable taxes may be added per law.',
        'Refunds and billing disputes follow the rules shown at checkout or in a separate agreement.',
      ],
    },
    {
      title: '7. Disclaimers',
      paragraphs: [
        'The Platform is provided “as is” and “as available.” We do not warrant error-free operation, uninterrupted service, or specific advertising outcomes (ROAS, CPA, etc.). AI outputs are advisory; you decide budgets and launches.',
      ],
    },
    {
      title: '8. Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, lost profits, lost data, or reputational harm. Aggregate liability is limited to fees you paid us for the Platform in the twelve (12) months before the claim, or the minimum amount required by law if higher.',
        'We are not responsible for third-party platform outages, policy changes, or account enforcement by Meta/Google.',
      ],
    },
    {
      title: '9. Indemnity',
      paragraphs: [
        'You will defend and indemnify us against claims arising from your content, your violation of law or these Terms, or your use of ad accounts without proper authority.',
      ],
    },
    {
      title: '10. Termination',
      paragraphs: [
        'You may stop using the Platform or request account closure via support. We may suspend or terminate for breach, non-payment (paid plans), or legal requirements.',
        'After termination, data handling follows the Privacy Policy and Data Deletion page.',
      ],
    },
    {
      title: '11. Governing law',
      paragraphs: [
        'Unless otherwise agreed in writing, these Terms are governed by the laws of the Republic of Uzbekistan. Courts in the operator’s location have jurisdiction unless mandatory consumer laws in your country provide otherwise.',
      ],
    },
    {
      title: '12. Changes',
      paragraphs: [
        'We may update these Terms at https://adspectr.com/terms. Continued use after changes may constitute acceptance where permitted; material changes may be notified as required by law.',
      ],
    },
    {
      title: '13. Contact',
      paragraphs: [
        `Support: ${LEGAL_CONTACT.support}. Include organization and workspace for billing or contract questions.`,
      ],
    },
  ],
}

const termsUz: LegalDocument = {
  title: 'Foydalanish shartlari',
  lastUpdatedLabel: 'Oxirgi yangilanish: 2026-yil 22-aprel',
  lead:
    'Ushbu Foydalanish shartlari («Shartlar») AdSpectr Platformasidan foydalanishni tartibga soladi. Hisob yaratish yoki Platformadan foydalanish bilan Shartlarga rozilik bildirasiz. Tashkilot nomidan foydalansangiz, ushbu Shartlarga tashkilotni bogʻlash huquqingiz borligini tasdiqlaysiz.',
  sections: [
    {
      title: '1. Xizmat',
      paragraphs: [
        'AdSpectr reklama kampaniyalari, tahlil, jamoa ishi va tegishli funksiyalar (AI yordam, hisobotlar, integratsiyalar — mavjud boʻyicha) uchun bulut dasturini taʼminlaydi.',
        'Alohida kelishuvga zid boʻlmasa, funksiyalarni oʻzgartirish, toʻxtatish yoki bekor qilish mumkin.',
      ],
    },
    {
      title: '2. Hisoblar',
      paragraphs: [
        'Toʻgʻri maʼlumot bering, kirish maʼlumotlarini xavfsiz saqlang. Hisobingizdagi harakatlar, jumladan taklif qilingan jamoa aʼzolari ruxsat doirasidagi harakatlar uchun javobsiz.',
        'Ruxsatsiz kirish haqida darhol yordam orqali xabar bering.',
      ],
    },
    {
      title: '3. Qoidalar',
      paragraphs: [
        'Taqiqlanadi: qonunni buzish; tizim yoki boshqa mijoz maʼlumotlariga ruxsatsiz kirish; Platforma ishlashiga xalaqit berish; zararli dastur, spam, aldamchilik; texnik cheklovlarni aylanib oʻtish; Meta, Google va boshqalar qoidalarini buzish.',
        'Buzilish yoki xavf boʻlsa, kirishni toʻxtatish yoki bekor qilish huquqimiz bor.',
      ],
    },
    {
      title: '4. Uchinchi tomon reklama platformalari',
      paragraphs: [
        'Meta, Google Ads va boshqalarni ulaganda ularning siyosatlari va cheklovlari uchun oʻz javobgarligingiz. Biz Meta yoki Google emasmiz — faqat texnik integratsiya.',
        'Ulagan reklama hisoblari va maʼlumotlar boʻyicha vakolatingiz borligini tasdiqlaysiz.',
      ],
    },
    {
      title: '5. Intellektual mulk',
      paragraphs: [
        'Platforma, brend va bizning kontentimiz biz yoki litsenziyachilarga tegishli. Shartlarga muvofiq cheklangan litsenziya beriladi.',
        'Platformaga yuklangan materiallaringiz huquqi sizda; xizmat koʻrsatish uchun ularni qayta ishlashga litsenziya berasiz.',
      ],
    },
    {
      title: '6. Toʻlov va soliqlar',
      paragraphs: [
        'Pullik tariflar sotib olishda koʻrsatilganidek. Toʻlovlar uchinchi tomon orqali. Qonunga muvofiq soliqlar qoʻshilishi mumkin.',
        'Qaytarish va nizolar — toʻlov interfeysi yoki alohida shartnomadagi qoidalar boʻyicha.',
      ],
    },
    {
      title: '7. Kafolatlarning yoʻqligi',
      paragraphs: [
        'Platforma «boricha» va «mavjud boʻyicha» beriladi. Xatosiz ishlash, uzluksiz xizmat yoki aniq reklama natijalari (ROAS, CPA va h.k.) kafolatlanmaydi. AI tavsiyalari yordamchi; qarorlar sizda.',
      ],
    },
    {
      title: '8. Javobgarlikni cheklash',
      paragraphs: [
        'Qonun ruxsat etgan darajada, bilvosita, tasodifiy, maxsus yoki keyingi zararlar, foyda va maʼlumot yoʻqotishi uchun javobgar emasmiz. Umumiy javobgarlik — daʼvo oldidan 12 oy ichida toʻlangan platforma toʻlovlari yoki qonunda belgilangan minimumdan yuqori boʻlsa shu miqdor.',
        'Uchinchi tomon platformalari uzilishlari, siyosat oʻzgarishi yoki hisob bloklari uchun javobgar emasmiz.',
      ],
    },
    {
      title: '9. Tazminot (indemnity)',
      paragraphs: [
        'Kontentingiz, qonun yoki Shartlarni buzishingiz yoki vakolatsiz hisoblardan foydalanishingizdan kelib chiqgan daʼvolardan bizni himoya qilasiz.',
      ],
    },
    {
      title: '10. Yakunlash',
      paragraphs: [
        'Hisobni yopish yoki yordam orqali foydalanishni toʻxtatishingiz mumkin. Buzilish, toʻlanmagan toʻlov (pullik tarif) yoki qonun talabi boʻlsa, kirishni toʻxtatish mumkin.',
        'Yakunlangach, maʼlumotlar Maxfiylik siyosati va «Maʼlumotlarni oʻchirish» sahifasiga muvofiq qayta ishlanadi.',
      ],
    },
    {
      title: '11. Qoʻllaniladigan qonun',
      paragraphs: [
        'Aks holda yozma kelishuv boʻlmasa, Oʻzbekiston Respublikasi qonunlari qoʻllaniladi. Operator joylashuvidagi sudlar nizolarni koʻrib chiqadi, agar isteʼmolchi qonunlari boshqacha talab qilmasa.',
      ],
    },
    {
      title: '12. Oʻzgarishlar',
      paragraphs: [
        'Shartlarni https://adspectr.com/terms da yangilashimiz mumkin. Oʻzgarishlardan keyin foydalanish rozilik boʻlishi mumkin; mohim oʻzgarishlar qonun boʻyicha bildiriladi.',
      ],
    },
    {
      title: '13. Aloqa',
      paragraphs: [
        `Yordam: ${LEGAL_CONTACT.support}. Hisob-kitob yoki shartnoma uchun tashkilot va workspace ni koʻrsating.`,
      ],
    },
  ],
}

const dataDeletionRu: LegalDocument = {
  title: 'Удаление данных',
  lastUpdatedLabel: 'Последнее обновление: 22 апреля 2026 г.',
  lead:
    'Эта страница объясняет, как вы можете запросить удаление персональных данных, обрабатываемых AdSpectr в рамках Платформы, и какие исключения могут действовать по закону или для безопасности.',
  sections: [
    {
      title: '1. Кто может подать запрос',
      paragraphs: [
        'Запрос может подать владелец аккаунта AdSpectr или уполномоченное лицо организации-клиента (с подтверждением полномочий). Мы можем запросить подтверждение личности или права доступа к workspace.',
      ],
    },
    {
      title: '2. Как подать запрос',
      paragraphs: [
        `Напишите на ${LEGAL_CONTACT.privacy} с темой «Запрос на удаление данных» или «Data deletion request». Укажите: email аккаунта; при наличии — идентификатор workspace; кратко опишите, какие категории данных вы хотите удалить (весь аккаунт или часть данных).`,
        'Запрос следует отправлять с адреса электронной почты, связанного с аккаунтом, или приложить доказательства полномочий, если используете другой адрес.',
      ],
    },
    {
      title: '3. Сроки рассмотрения',
      paragraphs: [
        'Мы подтвердим получение запроса в разумный срок. Основное рассмотрение и удаление (или анонимизация), как правило, выполняются в течение тридцати (30) календарных дней, если иное не требуется или не разрешено применимым законодательством.',
        'Сложные запросы (несколько workspace, судебные держатели) могут потребовать дополнительного времени — мы уведомим вас.',
      ],
    },
    {
      title: '4. Что будет удалено',
      paragraphs: [
        'При удалении аккаунта мы стремимся удалить или необратимо обезличить персональные данные профиля, настройки, приглашения команды и связанные записи, за исключением данных, которые мы обязаны или имеем право хранить (см. ниже).',
        'Данные в резервных копиях будут удалены по мере очередного цикла ротации резервных копий; обычно в течение до девяноста (90) дней после удаления основной записи, если технически иное невозможно без чрезмерных затрат.',
      ],
    },
    {
      title: '5. Исключения и сохранение',
      paragraphs: [
        'Мы можем сохранить определённые данные, если это необходимо: для исполнения юридического обязательства (налог, бухучёт); для установления, осуществления или защиты правовых требований; для предотвращения мошенничества и обеспечения безопасности; в обезличенном или агрегированном виде, не позволяющем идентифицировать лицо.',
        'Токены доступа к Meta / Google и другим платформам перестают действовать при удалении аккаунта или при отдельном отзыве доступа вами через настройки; мы также удаляем сохранённые токены в рамках удаления аккаунта, если это применимо.',
      ],
    },
    {
      title: '6. Данные, полученные через Meta / Facebook',
      paragraphs: [
        'Отзыв доступа к Платформе не автоматически изменяет настройки вашего аккаунта Meta. Вы можете отозвать разрешения приложения в настройках Facebook (Настройки → Безопасность и вход → Бизнес-интеграции / приложения) в соответствии с инструкциями Meta.',
        'Мы обрабатываем данные Meta только в объёме, необходимом для функций, которые вы включили.',
      ],
    },
    {
      title: '7. После удаления',
      paragraphs: [
        'После завершения удаления аккаунт может стать недоступным для входа. Некоторые обезличенные метрики продукта могут сохраняться для аналитики.',
      ],
    },
    {
      title: '8. Контакты',
      paragraphs: [
        `Удаление и конфиденциальность: ${LEGAL_CONTACT.privacy}. Общая поддержка: ${LEGAL_CONTACT.support}.`,
      ],
    },
  ],
}

const dataDeletionEn: LegalDocument = {
  title: 'Data deletion',
  lastUpdatedLabel: 'Last updated: April 22, 2026',
  lead:
    'This page explains how to request deletion of personal data processed by AdSpectr in connection with the Platform, and when retention exceptions apply.',
  sections: [
    {
      title: '1. Who may request',
      paragraphs: [
        'The AdSpectr account owner or an authorized representative of a business customer may submit a request. We may verify identity or authority to act on a workspace.',
      ],
    },
    {
      title: '2. How to submit',
      paragraphs: [
        `Email ${LEGAL_CONTACT.privacy} with subject “Data deletion request”. Include: account email; workspace ID if applicable; whether you want full account deletion or specific categories removed.`,
        'Please send from the account email, or include proof of authority if using another address.',
      ],
    },
    {
      title: '3. Timelines',
      paragraphs: [
        'We will acknowledge receipt within a reasonable time. We generally complete deletion or anonymization within thirty (30) calendar days unless law requires a different timeline.',
        'Complex requests may take longer; we will notify you.',
      ],
    },
    {
      title: '4. What we delete',
      paragraphs: [
        'For account deletion, we aim to delete or irreversibly anonymize profile data, settings, team invitations, and related records, except where we must retain data (see below).',
        'Backup copies are purged on rotation, typically within ninety (90) days of primary deletion where technically feasible.',
      ],
    },
    {
      title: '5. Retention exceptions',
      paragraphs: [
        'We may retain certain records where required for legal obligations (tax/accounting), to establish or defend legal claims, for fraud prevention and security, or in de-identified/aggregated form.',
        'Meta/Google tokens are invalidated as part of account deletion or when you disconnect integrations; stored tokens are removed where applicable.',
      ],
    },
    {
      title: '6. Meta / Facebook data',
      paragraphs: [
        'Removing data from AdSpectr does not automatically change your Meta account settings. You can revoke app permissions in Facebook settings (Security and login / Business integrations) per Meta’s instructions.',
        'We only process Meta-related data needed for features you enable.',
      ],
    },
    {
      title: '7. After deletion',
      paragraphs: [
        'You may lose access to the account. Some de-identified product metrics may remain for analytics.',
      ],
    },
    {
      title: '8. Contact',
      paragraphs: [
        `Privacy & deletion: ${LEGAL_CONTACT.privacy}. Support: ${LEGAL_CONTACT.support}.`,
      ],
    },
  ],
}

const dataDeletionUz: LegalDocument = {
  title: "Ma'lumotlarni o'chirish",
  lastUpdatedLabel: 'Oxirgi yangilanish: 2026-yil 22-aprel',
  lead:
    "Ushbu sahifa AdSpectr tomonidan Platforma bilan bog'liq qayta ishlangan shaxsiy ma'lumotlarni o'chirish so'rovini qanday yuborish va qachon ular saqlanishi mumkinligini tushuntiradi.",
  sections: [
    {
      title: '1. Kim so\'rov yuborishi mumkin',
      paragraphs: [
        "AdSpectr hisob egasi yoki biznes mijozining vakili (vakolat hujjati bilan) so'rov yuborishi mumkin. Shaxs yoki workspace bo'yicha vakolatni tekshirishimiz mumkin.",
      ],
    },
    {
      title: '2. Qanday yuboriladi',
      paragraphs: [
        `Mavzu: «Ma'lumotlarni o'chirish so'rovi» — ${LEGAL_CONTACT.privacy} ga yozing. Hisob emaili; workspace ID (bo'lsa); butun hisob yoki ma'lum toifalar o'chirilishini ayting.`,
        "Iltimos, hisob emailidan yuboring yoki boshqa manzildan bo'lsa, vakolatni tasdiqlovchi hujjat qo'shing.",
      ],
    },
    {
      title: '3. Muddatlar',
      paragraphs: [
        "So'rovni qabul qilganimizni ma'qul muddatda tasdiqlaymiz. Odatda o'chirish yoki anonimlashtirish 30 kalendary kun ichida; qonun boshqacha bo'lsa, shunga muvofiq.",
        "Murakkab holatlarda uzoqroq vaqt kerak bo'lishi mumkin — xabar beramiz.",
      ],
    },
    {
      title: '4. Nima o\'chiriladi',
      paragraphs: [
        "Hisobni o'chirishda profil, sozlamalar, jamoa takliflari va bog'liq yozuvlarni o'chirish yoki qaytarib bo'lmaydigan darajada anonimlashtirishga intilamiz — quyidagi istisnolar bundan mustasno.",
        "Zaxira nusxalar asosiy o'chirishdan keyin odatda 90 kun ichida rotatsiya bilan tozalanadi.",
      ],
    },
    {
      title: '5. Saqlash istisnolari',
      paragraphs: [
        "Soliq, hisob-kitob, huquqiy talablarni asoslash yoki himoya qilish, firibgarlikning oldini olish va xavfsizlik uchun ma'lumotlarni saqlashimiz mumkin; shuningdek anonimlashtirilgan yoki agregatsiyalangan shaklda.",
        "Meta/Google tokenlari hisob o'chirilganda yoki integratsiya uzilganda bekor qilinadi; saqlangan tokenlar qo'llaniladigan hollarda olib tashlanadi.",
      ],
    },
    {
      title: '6. Meta / Facebook ma\'lumotlari',
      paragraphs: [
        "AdSpectr dan ma'lumot olib tashlash Meta sozlamalarini avtomatik o'zgartirmaydi. Ilova ruxsatlarini Facebook sozlamalarida (Xavfsizlik va kirish / biznes integratsiyalari) Meta ko'rsatmalariga muvofiq bekor qilishingiz mumkin.",
        "Faqat siz yoqgan funksiyalar uchun zarur Meta bilan bog'liq ma'lumotlarni qayta ishlaymiz.",
      ],
    },
    {
      title: '7. O\'chirishdan keyin',
      paragraphs: [
        "Hisobga kirish imkoni yo'qolishi mumkin. Ba'zi anonim mahsulot metrikalari tahlil uchun qolishi mumkin.",
      ],
    },
    {
      title: '8. Aloqa',
      paragraphs: [
        `Maxfiylik va o'chirish: ${LEGAL_CONTACT.privacy}. Yordam: ${LEGAL_CONTACT.support}.`,
      ],
    },
  ],
}

export const LEGAL_DOCUMENTS = {
  privacy: { ru: privacyRu, en: privacyEn, uz: privacyUz },
  terms: { ru: termsRu, en: termsEn, uz: termsUz },
  dataDeletion: { ru: dataDeletionRu, en: dataDeletionEn, uz: dataDeletionUz },
} as const

export function getLegalDocument(
  doc: keyof typeof LEGAL_DOCUMENTS,
  language: Language,
): LegalDocument {
  const bundle = LEGAL_DOCUMENTS[doc]
  return bundle[language] ?? bundle.ru
}
