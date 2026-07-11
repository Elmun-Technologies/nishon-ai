# Nishon AI — Loyiha Xaritasi

## Har sessiya boshida o'qi

Bu fayl har safar loyihaga kirganda yo'nalish beradi. Har yangi ish tugagach, "Joriy holat" bo'limini yangilash.

---

## Loyiha haqida qisqacha

**Nishon AI** — performance marketing platformasi. Reklama yaratish, kampaniya boshqarish, ROAS hisoblash, va mutaxassislar bozori.

**Tech stack:**
- Frontend: Next.js (apps/web)
- Backend: NestJS (apps/api)
- Monorepo: pnpm + Turborepo
- DB: PostgreSQL (TypeORM)

**Ishga tushirish:**
```bash
pnpm dev          # Hamma applarni ishga tushirish
pnpm --filter web dev   # Faqat frontend
pnpm --filter api dev   # Faqat backend
```

---

## Joriy holat (so'nggi yangilash: 2026-07-11)

**Asosiy branch:** `main`
**Faol branch:** `claude/loyihani-mvp-readiness-xv4anj` — Agentic platforma (Vaqt · Pul · Ishonch)

### 2026-07-11 sessiyasi — "White-Space" dasturi (Green Zone)
Ta'sischi bozor tahlili "oq nuqtalar"ni aniqladi: global (Madgicx, Revealbot) va
mahalliy o'yinchilar qoldirgan bo'shliqlar. **Green Zone** (100% qonuniy,
platforma-xavfsiz, off-platform) tanlandi; **Red Zone** (ban-himoya, cross-platform
arbitraj, anti-fraud — Meta/Google ToS buzadi) ataylab chetlab o'tildi. Uch feature
qurildi (har biri alohida commit+push, hamma darvoza yashil):

1. **Sintetik fokus-guruh** (Pul + Ishonch) — reklamani efirga chiqarmasdan,
   workspace auditoriyasidan qurilgan AI personalar test qiladi. Bitta LLM chaqiruv
   (matn yoki rasm → completeVision) butun panelni rolь o'ynaydi; agregatsiya
   (o'rtacha qiziqish → CTR band, verdict) **kodda** hisoblanadi (tekshiriladigan).
   `POST /ai-agent/focus-group`, `FocusGroupTester` komponenti (Creative Scorer +
   Launch CreativeStep + Chat-launchга o'rnatilgan). 4 spec.
2. **Suhbat orqali ishga tushirish** (Vaqt) — "No-Dashboard": bir jumla (+ ixtiyoriy
   rasm) → AI to'liq tahrirlanadigan Meta rejasini taklif qiladi → tasdiq **haqiqiy**
   `launch-orchestrator` (draft→validate→launch) orqali ketadi (soxta launch yo'q).
   `POST /ai-agent/plan-campaign` (kod-tomon normalizatsiya: objective/cta oq ro'yxat,
   ISO-2, yosh clamp, byudjet floor). `/launch/chat` sahifa + LaunchHub kartasi. 4 spec.
3. **Telegram kanal agenti** (hyper-local kashfiyot) — TGStat API orqali nishaga mos
   kanallarni topadi + saralaydi (obunachi log-shkala + faollik, kodda). AI "nega"
   izohi best-effort (kalit yo'q → tashlab ketiladi, soxta emas). Narx = belgilangan
   CIS-CPM evristika ("taxminiy", real kotirovka emas). Yangi `telegram-channels/`
   modul (reve patterni), `GET /status` + `POST /recommend`, `/telegram-channels`
   sahifa + sidebar nav. 5 spec. **Faollashtirish:** `TGSTAT_API_KEY` (env warn-list
   + render.yaml qo'shildi).

**Holat:** API **329/329** + lint toza + build OK, web build OK, unit **118/118**,
e2e **39/39**, i18n **2534×3**. Yangi migration yo'q (uchalasi stateless AI/HTTP proksi).

### 2026-07-10 sessiyasi (3) — Avtonom sifat/halollik sweep (Ishonch)
To'rt parallel audit (core loop, agentic, Meta-connect, money) real yadroni
tasdiqladi, lekin ko'p yuzada **soxta ma'lumot real deb ko'rsatilardi**. 11 ta
tekshirilgan batch (har biri build+unit+e2e+i18n yashil, alohida commit+push):

1. **Reporting KPI** — ROAS/leads/conv qattiq-kodlangan + soxta trend deltalar
   real jadval ustida. Endi `/meta/audit` real totals + real prior-period
   deltalar; manba yo'q qiymat → "—". Reports builder widgetlariga "namuna" badge.
2. **Telegram** — alert toggle'lar localStorage-only edi, cron e'tibormas; "21:00"
   noto'g'ri (cron 09:00). Digest=always-on(09:00), boshqalari "tez orada".
3. **Integrations** — soxta ACTIVE AmoCRM/Slack + "2 connected/99.8%" o'z preview
   banneri ostida. Endi "Namuna" badge, soxta raqamlar "—".
4. **Demo-on-error** — ai-agents va ai-decisions API xatosida soxta $2,840 foyda /
   demo qarorlar ko'rsatardi. Endi real error state, demo faqat no-workspace.
5. **Auto-optimization** — har userga DEMO_PAYLOAD ("Summer Sale 2024") yuborardi.
   Endi real synced kampaniya picker; demo faqat Meta ulanmaganda. Debug tick
   panel dev-only.
6. **Agent Store/Studio** — soxta marketplace + rent/train stub. "Preview/Beta"
   banner, rent stub o'rniga halol "tez orada".
7. **Automation** — "create rule" o'lik mock wizardga yo'naltirardi. Endi real
   `/triggersets` CRUD; wizard route redirect.
8. **Launch preview→execute fasad** — qattiq-kodlangan strategiya, soxta agent
   log, 5 soxta mutaxassis. "Namuna oqim (demo)" banner; execute real Launch/AI
   Agents CTA; specialist real Marketplace CTA.
9. **Dashboard "AI Signallar"** — soxta detection matnlari → halol maslahatlar
   (3 til). Runtime o'lik Pause/Enable/Settings → real workspace autopilot.
10. **Ad-accounts baseline** — soxta kunlik raqamlar "taxminiy" deb belgilandi.
11. **Billing** — joriy plan localStorage'dan edi (real Payme upgrade ko'rinmasdi).
    Endi backend `user.plan` (/auth/me) manba; demo-pay soxta upgrade neytrallandi.

**Kengaytirilgan sweep (ikkilamchi sahifalar, +7 batch):**
12. **Reporting templates modal** — dead-end galereya → "namuna" belgisi.
13. **Campaigns kartalari** — real Meta metrikalar (`externalId` bo'yicha
    `/meta/audit` join): ROAS badge, spend, kengaytirilgan Spend/ROAS/CTR/Conv.
14. **Dead stub route'lar** — `/retargeting/wizard`, `/retargeting/funnel`,
    `/audiences/create` bo'sh `<h1>Page</h1>` edi (jonli CTA'lar shularга
    ketardi) → real sahifalarga redirect. Reports soxta kampaniya filtri olindi.
15. **My-portfolio visibility** — public profil privacy toggle'lari jim
    tashlanardi (backend yo'q) → "hali faol emas" ogohlantirish.
16. **Creative-hub image-ads** — 4 wizard no-op/placeholder'da tugardi, landing
    "shipped" derdi → Preview banner, Generate "tez orada", "300+ aktyor"→"namuna".
17. **Audiences studio** — o'lik tab bar + dekorativ search olib tashlandi.

18. **Telegram link store (production bug)** — in-memory Map serverless'da
    (Vercel) digest onboarding'ni buzardi (webhook va poll turli instance'ga
    tushadi). Backend Redis bridge qo'shildi (`/api/telegram/link/complete|status`,
    RetargetRedisService `tglink:` kalitlar, webhook secret gated). Web additive:
    webhook backend'ga ham yozadi, link-status backend'ga fallback qiladi;
    in-memory single-instance uchun tegilmaydi (regressiya yo'q). 6 controller
    spec. Migration yo'q (Redis).

**Yakuniy honesty batch (audit 5 — wizard/settings/marketplace, +4 batch):**
19. **Marketplace public** — main/portfolio/[slug]/leaderboard hammasi mock
    mutaxassislar (soxta reyting/ROAS/reviews) belgisiz edi → shared
    `MarketplacePreviewBanner` ("namuna"). Backend real /agents bor lekin web
    TargetologistProfile boy mock-shakl → to'liq wiring katta feature.
20. **Wizard connection status (P0)** — PLATFORMS google+meta `connected:true`
    har userga → yangi user "Ready to use" ko'rardi. Endi `false` (flag kosmetik,
    selection bloklamaydi). Campaigns bo'sh-holat "Create Campaign" → real `/launch`.
21. **Products sahifasi** — soxta $2500 spend limit, "Trial" badge, bugungi sana
    billing period → real spend (cap'siz), badge olib tashlandi, sana "—".
22. **Settings notifications** — email/weekly/AI toggle'lar saqlanmasdi → "tez
    orada" izoh. **platform-architecture** ichki blueprint → `/docs` redirect.

**Image-ads real generatsiya (Reve / fal.ai) — yangi feature:**
23. **Creative Hub → Image ads «Product page»** endi real Reve generatsiya
    (fal.ai `fal-ai/reve/text-to-image`, $0.04/rasm). Yangi `reve` backend moduli
    (heygen patterni): `ReveService` server-side `FAL_KEY` bilan proxy, aspect
    mapping, `GET /reve/status` + `POST /reve/image-ads/generate` (JWT). Kalit
    yo'q → 503 "not configured" (soxta rasm yo'q). 5 spec. Frontend: Generate
    tugmasi real chaqiradi, loading skeleton, natijalar galereyasi + download.
    **Faollashtirish:** serverda `FAL_KEY` (Reve accessли fal.ai kaliti) kerak.

**Holat:** web build OK, web unit 118/118, e2e 39/39, i18n 2533×3, API **316/316**.
Backlog (kechiktirilgan — past qiymat yoki katta feature/credential):
budget slider persist (runtime consumer yo'q), F9 dead platforms Meta OAuth,
image-ads qolgan 3 metod (upload/competitor/actor clone — Reve edit/remix),
marketplace real-wiring + my-portfolio visibleMetrics, docs trim + support kanali.

### 2026-07-10 sessiyasi (2) — Agentic: real, boshqariladigan agent (PR #149)
Startap va'dasi **Vaqt · Pul · Ishonch** — AI agent biznes reklamasini o'zi
boshqaradi. Ikki mustaqil audit + to'g'ridan-to'g'ri tracing tasdiqladi:
katta agentic *skelet* bor edi (2-soatlik optimizatsiya cron, decision loop,
governance, autopilot rejimlar), lekin **real akkauntlarda amalda no-op** edi.
Ikki parallel yo'nalishda tuzatildi:

**Track A — Foundation (Ishonch + Pul): real, governed, ASSISTED agent**
- ✅ **A1: Real Meta datani ko'radi** — `DecisionLoopService` endi seed-only
  `campaigns` jadvali o'rniga `meta_campaign_syncs` + `meta_insights` (7 kunlik)
  dan o'qiydi (real userlarda bo'sh emas).
- ✅ **A2: Execution targeting** — LLM `targetId` endi tashlab yuborilmaydi;
  `ai_decisions`ga `target_external_id`/`target_platform` ustunlari (guarded
  migration 1763500), token `connected_accounts`dan decrypt qilinib
  `meta.connector.pauseCampaign`/`updateCampaignBudget` chaqiriladi.
- ✅ **A3: Governance + rejim gating** — MANUAL=faqat taklif; **ASSISTED=faqat
  low-risk auto, high-risk (pause/budget) tasdiqqa**; FULL_AUTO=hammasi. Cron
  faqat onboarded + active account + rejim≠MANUAL workspacelarga. Workspace
  default MANUAL→**ASSISTED**.
- ✅ **A4: Approval unify + IDOR fix** — bitta executing, owner-checked
  `/ai-agent/decisions/:id/approve` yo'li; `ai-decisions` sahifasi va MCP
  ham shu yo'lga o'tdi (userId owner check).
- ✅ **A5: Real confidence + impact** — har `AiDecision`ga haqiqiy confidence
  (0-1) va $ impact yoziladi; frontend soxta 0.8-0.95 stublar o'chirildi.

**Track B — Time (Vaqt): proaktiv + auto-config**
- ✅ **B6: Ad Launcher auto-to'ldirish** — onboarding javoblari (goal/CJM, geo,
  yosh, byudjet split) `workspace.aiStrategy`ga saqlanadi; Meta wizard
  objective/geo/yosh/byudjetni oldindan to'ldiradi ("AI tayyorladi" badge,
  hammasi tahrirlanadi). `prefill.ts` + 6 unit test.
- ✅ **B7: Bir-klik AI matn** — CreativeStep'da "AI matn yozib bersin" tugmasi
  ilgari ulanmagan `aiAgent.wizardAdCopy` endpoint'iga ulandi.
- ✅ **B8: Real kunlik Telegram digest** — 9:00 cron endi seed-only metrics
  o'rniga real `meta_insights` (kechagi spend/ROAS/konversiya) + agent kecha
  nima qildi/nima tasdiq kutmoqda narrativi + approve CTA. 4 processor test.

**Yakuniy holat:** API **305/305**, API lint toza, web build OK, web unit
**118/118**, i18n 2533×3, e2e **39/39**. Yangi migration Track B'da yo'q.

**Keyingi (Phase 2, kechiktirilgan):** adset-level pause/budget connector
metodlari, proaktiv anomaliya alertlari, cross-campaign byudjet reallokatsiya.

### 2026-07-10 sessiyasi — MVP-tayyorlik: real deploy blockerlari
Holat aniqlash: barcha CI darvozalari yashil edi (API 295/295, web unit 112/112,
lint/i18n/tsc/build/e2e 39/39), lekin ikki mustaqil audit real MVP blockerlarini topdi:

- ✅ **Migration zanjiri toza DB'da ishlamas edi** — `synchronize:false` prod'da
  `migration:run` deploy'ning yagona sxema manbai, ammo zanjir buzuq edi:
  - MVP-kritik jadvallar (`workspaces`, `workspace_members`, `connected_accounts`)
    umuman migration'siz edi → 3 ta yangi migration yozildi (`1763100/200/300`).
  - `AddMarketplaceSchema` — enum default'lar tirnoqsiz (`DEFAULT pending_review`
    → "column reference" xatosi). 5 ta tuzatildi.
  - `AddMarketplaceColumnsToExisting` — mavjud bo'lmagan `service_engagements`/
    `agent_reviews` jadvallariga ustun qo'shardi → `hasTable`/`hasColumn` guard,
    indekslar `IF NOT EXISTS`.
  - `AddFraudDetectionAudit` — `agent_profile_id varchar` → `uuid`ga FK mumkin emas edi.
  - **Natija:** toza Postgres'da butun zanjir exit 0, idempotent (real PG'da tekshirildi).
- ✅ **Meta CBO/ABO budget konflikti** — kampaniya ham, har AdSet ham `daily_budget`
  olardi → Meta har launchni rad etardi. Endi CBO=faqat kampaniya, ABO=faqat AdSet.
- ✅ **Meta placeholder `meta_oauth` account id** hech qachon real `act_<id>`'ga
  aylanmasdi → callback endi `getAdAccounts` bilan real ad-account'ni hal qiladi
  (eski placeholder record'larni ham tuzatadi).
- ✅ **`META_CALLBACK_URL` noto'g'ri handler'ga** ishora qilardi
  (`/platforms/meta/callback` ≠ frontend ishlatadigan `/meta/callback`) → render.yaml + DEPLOY.md tuzatildi.
- ✅ **Register → workspace hydration** — yangi foydalanuvchi `currentWorkspace=null`
  bilan dashboard'ga tushib, Ad Launcher/Meta connect dead-end bo'lardi → register
  endi login kabi workspace'ni hydrate qiladi.
- ✅ **Render health check `/health` → `/ready`** (DB/Redis o'lganda 503 qaytaradi).
- ✅ Graph API versiya birlashtirildi (v19→v20), OAuth `pages_*` scope qo'shildi.
- ✅ **Mock sahifalar halol qilindi** (MVP faqat Meta):
  - Launch Hub: Google/Yandex endi "Coming soon" (Telegram kabi) — ilgari soxta
    "launched" ko'rsatardi (faqat ichki `/campaigns` yozuvi, real platform launch yo'q).
  - `/settings/integrations` mock sahifasiga "Preview" banner + real `/settings/meta`
    havolasi; ai-decisions'dagi "Meta ulash" CTA endi real sahifaga qaratildi.
- **Yakuniy holat:** API 295/295, web unit 112/112, build/e2e 39/39, migration zanjiri
  toza PG'da exit 0. PR #149.

### Oldingi faol branch: `claude/hopeful-rubin-vTmX2` — 10/10 sprint (PR #131)

### 2026-06-03 sessiyasi — 10/10 sprint (faol PR #131)
- ✅ **Qadam 2: cheap strict TS flags** — `noFallthroughCasesInSwitch`,
  `noImplicitOverride`, `forceConsistentCasingInFileNames` API+web ikkalasiga,
  web qo'shimcha `allowUnreachableCode: false`. 0 ta xato.
- ✅ **Qadam 3: web unit testlar 12 → 97** (+85) — `lib/utils` (13),
  `reporting-export` (6), `local-subscription` (5), `validation` (35),
  `api-error` (9), `date-range` (7), `subscription-plans` (8).
- ✅ **Qadam 4: backend service specs 152 → 262** (+110, 6 ta service) —
  `AiDecisionsService` (11), `CampaignsService` (17), `TeamInvitesService` (25),
  `WorkspacesService` (19), `AuthService` (23 — auth-core: bcrypt 12 rounds,
  email-enumeration safety, refresh-token bcrypt-hashed, JWT secret fail-closed),
  `BillingService` (15 — read/write gate + "exactly one default card" invariant).
- ✅ **Qadam 5: CI hardening** — `.github/workflows/ci.yml`'da top-level
  `permissions: contents: read` (default-deny GITHUB_TOKEN); `.github/dependabot.yml`
  weekly grouped bumps (dev+prod, monthly actions). Dependency-review action
  o'chirildi (Dependency graph feature flip kerak edi).

### MVP fokus
**Ad Launcher (3-bosqichli flow) production deploy.**
Qolgan modullar (Marketplace, Portfolio, AmoCRM, Fraud, AI Agents va h.k.) kodda turaveradi, lekin MVP launch va sinov diqqati Ad Launcher'ga qaratiladi.

Batafsil deploy qadamlari: `DEPLOY.md`.

### 2026-06-02 sessiyasi — sifat sprinti + feature ulanishlar (10 PR merged)
- **#113** Launch refactor: 1610 → 34 qator orchestrator + `_components/`
- **#114** Dashboard freeze fix (effect cleanup, startTransition)
- **#115** 21 ta unique feature animatsiya + SEO sahifalar
- **#116** Conversational onboarding (CJM + AI byudjet taqsimlash)
- **#117** AI Agents redizayn (My Agents, runtime dashboard)
- **#118** AI Agents frontend → real `AiDecisions` backend
- **#119** `/launch` → real `launch-orchestrator` + inline Meta creative
- **#120** Sifat sprinti: testlar 84/87→**120/120**, GitHub Actions CI (yo'q edi),
  yashirin TS xatolar 27→**0** (`ignoreBuildErrors` o'chirildi), 4 real prod bug,
  4 mock sahifaga halol "Preview" badge, 14 Playwright smoke test, Payme checkout
  real backend'ga ulandi, API lint 135→**0**
- **#121** AI Agents approve → real platform bajarish (loop yopildi)
- **#122** Reports — real client-side CSV eksport

**Loyiha bahosi: 7.2 → ~8.6 / 10.**

### CI/CD (yangi — #120)
`.github/workflows/ci.yml` — har PR'da:
- api: `test` (120/120) + `build` + `lint:check` (0 error)
- web: `lint` + `i18n:check` + `tsc` + `build` + `test:e2e` (14 smoke)
- `prettier/prettier` = warning (style debt, bloklamaydi)

### 10/10 ga qolgan ish (credential yoki katta feature kerak)
- [ ] **To'lov live** — Render env: `PAYME_MERCHANT_ID` + `PAYME_MERCHANT_KEY`
  (webhook: `/billing/payme`). Kod tayyor (#120), faqat kalit kutadi.
- [ ] **Ad Library** — Meta `ads_archive` API (META_APP_ID/SECRET kerak)
- [ ] **Simulation** — real Meta tarixiy data (connected account kerak)
- [ ] **Reports PDF** — client-side PDF generatsiya (CSV tayyor)
- [ ] **prettier churn** — `pnpm --filter api lint` (--fix) bir martalik formatlash

### Bajarilgan va production-ga merged bo'lgan ishlar:
- Landing page qayta dizayni
- Ad Launcher 3-bosqichli flow (frontend)
- Marketplace, Portfolio Gamification, AmoCRM, Fraud detection
- i18n (Uzbek/Russian/English)
- Retargeting worker, Creative Hub, Meta Audit, Reporting, Budget pages

### Bu sessiyada qilingan ishlar (claude/hopeful-rubin-vTmX2 — Launch refactor Phase 1):
- ✅ `/launch/page.tsx` 1610 → 34 qator — boshqaruvchi orchestrator
- ✅ `_lib/` — `types.ts`, `meta-objectives.ts`, `utils.ts` (parsePositiveNumber, formatMoneyUsd, estimateAudienceReach), `use-launch-wizard.ts` (yagona state hook)
- ✅ `_components/` — `LaunchHub`, `ModePicker`, `PlatformGlyph`, `ProgressRibbon` (clickable, step nomlari bilan), `SummaryPanel` (jonli sticky panel), `WizardHeader`, `StepFooter`
- ✅ `_components/meta/` — ObjectiveStep, SettingsStep, AudienceStep, BudgetStep, CreativeStep, ReviewStep, MetaSummary, MetaWizard
- ✅ `_components/google/GoogleWizard.tsx` va `_components/yandex/YandexWizard.tsx` — eski mantiq saqlangan
- ✅ **Yangi UX qo'shimchalari:**
  - SummaryPanel — har wizard stepda jonli xulasa (Meta uchun)
  - ProgressRibbon — bosib steplar orasida sakrash (reachable steplar uchun)
  - AudienceStep'da davlat chiplari + reach estimate (heuristic, taxminiy)
  - BudgetStep'da Tezkor presetlar (Test/Standard/Masshtab) + duration chips
  - CreativeStep'da live preview + Creative Hub link
  - ObjectiveStep'da AI tavsiya hinti (Leads)
- ✅ `pnpm --filter web build` — muvaffaqiyatli, `/launch` 19 kB
- ✅ ESLint toza, `pnpm i18n:check` 2356 leaf key (3 tilda) saqlangan

### Oldingi sessiyada (claude/setup-mvp-ads-Rivx6):
- ✅ `pnpm install` — barcha bog'liqliklar o'rnatildi
- ✅ Lokal `.env` shabloni (random JWT/ENCRYPTION secret'lar bilan)
- ✅ `pnpm --filter api build` va `pnpm --filter web build` — har ikkalasi muvaffaqiyatli
- ✅ **Bug tuzatildi:** `launch-orchestrator.service.ts` endi `payload.objective`, `payload.dailyBudget`, `payload.audiences` qiymatlarini Meta'ga to'g'ri uzatadi
- ✅ Har audience uchun alohida Meta AdSet yaratiladi (ABO uchun budget bo'linadi)
- ✅ **Source kampaniyadan kreativ nusxalash** — `MetaConnector.getCampaignAds()` + `createAdFromExistingCreative()`, yangi AdSet'larga manba reklamadagi har kreativ qo'shiladi
- ✅ **Targeting frontend'ga ko'chirildi** — davlat (UZ/KZ/RU/...), yosh oralig'i, jins LaunchStep'da tanlanadi
- ✅ **`launch_jobs` migration yozildi** — production'da `synchronize: false` bo'lganligi sababli avval jadval umuman yaratilmas edi
- ✅ **Unit testlar** — `launch-orchestrator.service.spec.ts` (6 ta test, hammasi pass)
- ✅ DTO'da `dailyBudget` ixtiyoriy (backward compat, default $20)
- ✅ `render.yaml`'ga `AI_PROVIDER` va `ANTHROPIC_API_KEY` qo'shildi
- ✅ `DEPLOY.md` — Render + Vercel + Meta App qadam-baqadam yo'riqnomasi

### Keyingi qadamlar (faqat foydalanuvchi credentials kerak):
- [ ] Render.com'da Postgres + Redis + API web service yaratish
- [ ] Vercel'da web frontend deploy
- [ ] Meta for Developers'da App yaratish va credentials Render'ga qo'shish
- [ ] OAuth callback URL'ni Meta App'ga ro'yxatdan o'tkazish
- [ ] Birinchi sinov: register → workspace → Meta connect → Ad Launcher → real launch

---

## Dashboard sahifalari (apps/web/src/app/(dashboard)/)

| Sahifa | Yo'l | Holat |
|--------|------|-------|
| Campaigns | /campaigns | ✅ |
| Ad Launcher | /ad-launcher | ✅ |
| Creative Hub | /creative-hub | ✅ |
| Marketplace | /marketplace | ✅ |
| Meta Audit | /meta-audit | ✅ |
| Reports | /reports | ✅ |
| Budget | /budget | ✅ |
| Top Ads | /top-ads | ✅ |
| Automation | /automation | ✅ |
| My Portfolio | /my-portfolio | ✅ |
| AI Agents | /ai-agents | ✅ |
| Wizard | /wizard | ✅ |

---

## Asosiy fayllar

```
apps/
  web/src/app/
    (dashboard)/     — barcha dashboard sahifalari
    marketplace/     — mutaxassislar bozori
    lp/              — landing page
  api/src/
    amocrm/          — AmoCRM integration
    campaigns/       — kampaniya API
    fraud/           — fraud detection
packages/
  ui/                — umumiy UI komponentlar
```

---

## Git workflow

```bash
git log --oneline -10          # So'nggi commitlar
git status                     # Hozirgi holat
git checkout -b feature/...    # Yangi feature branch
git push -u origin <branch>    # Pushdan keyin PR oching
```

**Qoida:** Har yangi feature uchun yangi branch → PR → main-ga merge.

---

## Sessiya oxirida qilish kerak

1. `git status` — o'zgarishlar bor-yo'qligini tekshir
2. Commit va push qil
3. Bu fayldagi "Joriy holat" bo'limini yangilash (nima qilindi, nima qoldi)
