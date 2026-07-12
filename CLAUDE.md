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

## Joriy holat (so'nggi yangilash: 2026-07-12)

**Asosiy branch:** `main` (PR #150 gacha merge qilingan)
**Faol branch:** `claude/github-updates-optimization-jy2ut6` — GitHub holatini tekshirish + optimizatsiya

### 2026-07-12 sessiyasi — GitHub sinxronizatsiya tekshiruvi
`main`'dan so'nggi o'zgarishlar tortib olindi, branch `origin/main` (b80c4ae) bilan
bir xil holatda ekanligi tasdiqlandi. Ochiq PR'lar tekshirildi:

- **PR #150** (merged, hujjatlanmagan edi — endi quyida yozildi): dashboard N+1
  so'rov tuzatildi, `1763400000000-AddPerformanceIndexes` migration qo'shildi
  (ad-sets/ai-decisions/meta-campaign-sync indekslari), `useRealtimeRefresh`dagi
  stale closure bug tuzatildi, campaign toolbar'dagi o'lik tugmalar olib
  tashlandi, real vs disconnected holatlar aniqlashtirildi, brand SVG
  illyustratsiyalar (`features`/`marketplace`/`solutions` sahifalari) qo'shildi,
  RevenueAreaChart komponenti qo'shildi, budget/billing fix'lar.
- ⚠️ **3 ta ochiq dependabot PR** (major versiya bumplari, hali merge qilinmagan):
  - #144 `@nestjs/platform-express` 10.4.22→11.1.26 — CI ✅ yashil
  - #143 `eslint-config-next` 14.0.4→16.2.7 — CI ❌ Web lint+i18n+build failure
    (2026-06-08'dagi eski run, `main`'dan orqada qolgan bo'lishi mumkin)
  - #141 `eslint` 8.56.0→10.4.1 — CI ❌ ham API ham Web build failure
  - Bu ikkalasi `dependabot.yml`dagi weekly grouped bump'lardan oldingi/tashqi
    PR'lar bo'lib, eski va stale ko'rinadi — qayta baholash yoki yopish kerak.

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
