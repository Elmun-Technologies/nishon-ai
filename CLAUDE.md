# Nishon AI — Loyiha Xaritasi

## Har sessiya boshida o'qi

Bu fayl har safar loyihaga kirganda yo'nalish beradi. Har yangi ish tugagach, "Joriy holat" bo'limini yangilash.

---

## Loyiha haqida qisqacha

**Nishon AI** — performance marketing platformasi. Reklama yaratish, kampaniya boshqarish, ROAS/ROI hisoblash, AI agent'lar va mutaxassislar bozori.

> **Eslatma:** Mahsulot brendi — **Nishon AI**, lekin repo/paket ichki nomi hali ham
> `adspectr` (`@adspectr/shared`, `@adspectr/ai-sdk`, `@adspectr/creative-hub-core`).
> Kod ichida `adspectr` uchrasa — bu shu loyiha.

**Tech stack:**
- **Monorepo:** pnpm workspaces + Turborepo (`pnpm@8.15.5`, Node **22** — `.nvmrc`)
- **Frontend:** Next.js 14 App Router (`apps/web`) — React 18, Tailwind + Radix UI,
  TanStack Query, Zustand, Zod, next-themes, recharts, Socket.IO client
- **Backend:** NestJS 10 (`apps/api`) — TypeORM + PostgreSQL, Redis + Bull (queue),
  Passport (JWT/local/facebook/google), WebSockets (Socket.IO), Swagger
- **Worker:** `apps/retargeting-worker` — mustaqil retargeting signal ishlovchisi (tsx/tsc)
- **Umumiy paketlar:** `packages/shared`, `packages/ai-sdk`, `packages/creative-hub-core`
- **AI:** `AI_PROVIDER` orqali OpenAI yoki Anthropic (`ai-sdk` paketi)
- **Deploy:** API + worker → Render (`render.yaml`), web → Vercel (`vercel.json`).
  Batafsil: `DEPLOY.md`.

**Ishga tushirish:**
```bash
pnpm install            # Bog'liqliklarni o'rnatish (frozen-lockfile CI'da)
pnpm dev                # Hamma applar (turbo)
pnpm --filter web dev   # Faqat frontend (localhost:3000)
pnpm --filter api dev   # Faqat backend (nest --watch)
```
Lokal DB/Redis uchun: `docker-compose.yml`. Env shabloni: `.env.example`.

---

## Muhim buyruqlar (commands)

Ishni tugatishdan oldin **doim** CI darvozalarini lokal qaytar — CI aynan shularni tekshiradi:

```bash
# API (apps/api)
pnpm --filter api test           # Jest unit testlar (*.spec.ts)
pnpm --filter api build          # Nest build (avval shared + ai-sdk build bo'ladi)
pnpm --filter api lint:check     # ESLint (--fix'siz, CI shu variantni ishlatadi)
pnpm --filter api lint           # ESLint --fix (lokal tuzatish uchun)

# Web (apps/web)
pnpm --filter web test:unit      # Vitest unit testlar (*.test.ts / *.test.tsx)
pnpm --filter web test:e2e       # Playwright smoke (request API, brauzersiz)
pnpm --filter web i18n:check     # uz/ru/en kalit pariteti (scripts/check-i18n-keys.mjs)
pnpm --filter web exec tsc --noEmit   # Typecheck
pnpm --filter web build          # next build
pnpm --filter web lint           # next lint

# Migration (apps/api — prod'da synchronize:false, sxema faqat shu yerdan)
pnpm --filter api build                  # avval build (migration dist'dan ishlaydi)
cd apps/api && npm run migration:run     # migration'larni qo'llash
npm run migration:revert                 # oxirgisini qaytarish
npm run migration:generate               # entity'lardan yangi migration
npm run seed                             # seed data
```

**Bitta testni ishga tushirish:** `pnpm --filter api test -- campaigns.service` /
`pnpm --filter web test:unit -- validation`.

---

## CI/CD

`.github/workflows/ci.yml` — har PR va `main` push'da (Node 22, pnpm 8.15.5):
- **api job:** `test` → `build` → `lint:check`
- **web job:** `lint` → `i18n:check` → `tsc --noEmit` → `test:unit` (vitest) → `build` → `test:e2e`
- Top-level `permissions: contents: read` (default-deny GITHUB_TOKEN, hardening)
- `concurrency` bilan eski run'lar bekor qilinadi
- Dependabot: `.github/dependabot.yml` — weekly grouped bump'lar
- `prettier/prettier` = warning (bloklamaydi, style debt)

**Qoida:** CI hech qachon prettier whitespace'ni jimgina qayta yozmasin —
shuning uchun `lint:check` (`--fix`'siz) ishlatiladi.

---

## Joriy holat (so'nggi yangilash: 2026-07-21)

**Asosiy branch:** `main`
**Faol branch:** `claude/loyihani-davom-254pgx` — Agent rejasini haqiqiy holatga aylantirish

### 2026-07-21 sessiyasi — AI Agent rejasini serverda haqiqiy holat qilish (4 commit)
Agent'ning "rejasi" (link + maqsad + byudjet + stop-loss) faqat brauzer localStorage'da
edi — backend optimizatsiya loop'i uni ko'rmasdi ("client-side teatr"). Endi reja
serverda saqlanadigan holat: engine unga tayanadi. Har biri test bilan; barcha darvozalar
yashil (api 348 test, web 141 unit + 39 e2e).
- ✅ **AgentConfig serverda saqlanadi** — yangi `agent_configs` jadvali (workspace bo'yicha
  bitta, idempotent migration; toza Postgres'da tekshirildi: to'liq zanjir o'tadi, qayta
  ishga tushirish no-op, revert toza). `AgentConfigService` funnel allokatsiyani hisoblaydi
  va byudjet + Hard Stop-Loss'ni `workspace.optimizationPolicy`'ga sinxronlaydi (mavjud
  maydonlar saqlanadi) → engine (auto-optimization) uni o'qiydi. `GET/PUT
  /ai-agent/workspaces/:id/config`, ikkalasi `assertWorkspaceOwner` bilan. (+13 test)
- ✅ **Funnel allocator `@adspectr/shared`'da** — kanonik toza matematik (maqsad + byudjet →
  TOFU/MOFU/BOFU × kanallar, butun-son aniq). Backend manba; web presentatsion nusxasini
  saqlaydi.
- ✅ **Web: reja backenddan hidratsiya** — localStorage bo'sh bo'lsa dashboard rejani
  `GET config`'dan yuklaydi → "agent faol" holati qurilmalar aro saqlanadi. Config
  helper'lari `@/lib/agent-config`'ga ajratildi (test uchun). AgentSetupCard approve'da
  serverga saqlaydi (best-effort). (+7 web unit)
- ✅ **Agent Plan kartasi (dashboard)** — bir qatorli banner o'rniga: maqsad, byudjet,
  stop-loss + funnel/kanal taqsimoti. `AgentPlanSummary` (i18n uz/ru/en, parity 2448).
- ✅ **Xavfsizlik: competitor-analysis owner check** — `/competitor-analysis[-batch]`
  workspace-scoped edi lekin faqat JWT bilan → har kim boshqa tenant workspace'iga qarshi
  paid AI ishlata olardi. `assertWorkspaceOwner` qo'shildi. (+4 test)
- ⏳ **Qolgan follow-up:** funnel allokatsiyasini real platforma byudjetlariga qo'llash
  (Meta/Google execution, credential kerak); avtonom kampaniya yaratish (link→launch);
  score-creative/wizard endpoint'lariga workspace scoping; AI Decisions "Namuna" fallback.

### 2026-07-14 sessiyasi — Xavfsizlik mustahkamlash (audit + fix, 4 commit)
3 ta parallel security audit → tasdiqlangan cross-tenant va payment kamchiliklari tuzatildi.
Har biri test bilan; barcha api darvozalari yashil (331 test).
- ✅ **Payme webhook fail-open (critical)** — `verifyAuth` merchant key yo'q bo'lsa
  `Basic Paycom:` ni qabul qilardi (payment forgery). Endi fail-closed + constant-time
  compare; web stub ham. (`billing/services/payme.service.ts`, +4 test)
- ✅ **ai-agent BOLA (critical, yangi surface)** — har workspace/decision endpoint JWT'li
  edi lekin ownership tekshirmasdi (boshqa tenant'ni optimize/chat/approve qilish mumkin).
  `assertWorkspaceOwner`/`assertDecisionAccess` qo'shildi, `req.user.id` ulandi. Cron yo'li
  o'zgarmadi. (+7 test)
- ✅ **integrations IDOR + token exposure (critical)** — `req.workspace?.id` hech qачон
  to'ldirilmasdi → TypeORM filter tushib qolardi → har kim boshqa tenant'ning ulanishini
  (shifrlangan OAuth token'lar bilan) o'qishi mumkin edi. `assertConnectionOwner` +
  `listConnectionsForUser`. (+7 test)
- ✅ **platforms select-account IDOR (high)** — Meta/Google ad-account bind'ni ownership'siz
  qayta yozardi. Endi `assertWorkspaceOwner`.
- ✅ **creatives IDOR (high)** — har qanday creative'ni id bo'yicha o'qish/o'zgartirish/o'chirish.
  `assertCreativeOwner` + list owned workspaces'ga cheklandi. (+5 test)
- ✅ **CORS fail-closed (prod)** + **encryption fallback key'lar olib tashlandi** (fail-closed).
- ⏳ **Qolgan follow-up:** rate-limiting (auth/AI, Redis), audience-segment/commission
  segment-level IDOR, retarget `/signals` PII scoping, heygen status, CBC→GCM.

### 2026-07-13 sessiyasi — "Virtual AI Marketing Agent" pivot (feature-flag'li)
Mahsulotni avtonom media-buyer modeliga burish. **Hech narsa o'chirilmadi** — hammasi
`AGENT_MODE` (web) va `AGENT_AUTONOMOUS_MODE` (backend) flaglari ortida, qaytariladigan.
- ✅ **Feature-flag qatlami** — `apps/web/src/lib/agent-mode.ts` (`AGENT_MODE`, `FROZEN_ROUTES`,
  `isRouteFrozen`, `filterFrozenNavItems`). Default: web ON, backend OFF (live behavior saqlanadi).
- ✅ **Funnel Allocator** — `apps/web/src/lib/funnel-allocator.ts`: umumiy byudjet + maqsad →
  TOFU/MOFU/BOFU × Meta/Google/TikTok/Telegram (integer-exact, 12 unit test).
- ✅ **AI Agent Setup (3 input)** — `components/agent/AgentSetupCard.tsx` (Havola → Maqsad:
  Sotuv/Brend → Byudjet) jonli allokatsiya preview bilan; dashboard landing endi shu hero'ni
  ko'rsatadi (`dashboard/page.tsx`), analitika o'rniga. Activate → real `aiAgent.optimize()`.
- ✅ **Manual modullar muzlatildi** — Sidebar'dan olib tashlandi + har route'da
  `AutomatedByAgent` locked overlay: `/launch`, `/campaigns`, `/ad-launcher` (Campaign Builder),
  `/audiences` (Audience Builder), `/retargeting`, `/retarget`, `/triggersets` (Retargeting).
  Har page = guard wrapper + `…Inner` (rules-of-hooks toza).
- ✅ **Hard Stop-Loss guardrail** — `auto-optimization/policy/action-policy.ts`:
  `allowAutoStopLossPause` (default false, opt-in). Yoqilsa agent zarar keltiruvchi
  creative/adset'ni avtonom pauza qiladi va AI Decisions log'ga yozadi (4 unit test).
- ✅ **24h Hard Stop-Loss (kengaytirilgan)** — `rules/rules-engine.ts` `hardStopLoss`
  (24h + $15 + 0 klik/0 konversiya → `hard_stop_loss_no_result`); `rules/stop-loss.ts`
  `buildStopLossActions` → pause_adset/pause_creative; service `mergeAndDeduplicateActions`'ga
  ulandi; window/min-spend workspace policy'dan sozlanadi. Perf tiplariga `ageHours` qo'shildi
  (Meta sync plumbing kutilmoqda). 11 unit test.
- ✅ **"Wow" UX (frontend)** — AgentSetupCard: bosqichli "AI Agent is thinking…" animatsiya +
  interaktiv recharts donut (`AllocationDonut`, code-split); dashboard'da faollashtirilgandan
  keyin jonli **AI Decisions chat feed** (`AgentDecisionsFeed`, real API + "Namuna" fallback).
- ✅ **Manual worker'lar gated** — `queue/cron.service.ts` (triggersets) va
  `retargeting-worker` (manual `syncAudiences`) `AGENT_AUTONOMOUS_MODE` ortida; default OFF.
- ✅ i18n: `agent.*` uz/ru/en (parity 2393). Barcha CI darvozalari yashil (web+api+e2e 39).

### 2026-07-12 sessiyasi — CLAUDE.md ni real holatga keltirish
- ✅ CLAUDE.md yangilandi: to'liq command reference, CI tafsiloti, to'g'ri paket/modul
  strukturasi (`packages/` = shared/ai-sdk/creative-hub-core; `apps/` = web/api/retargeting-worker),
  Node 22 + pnpm 8.15.5, ichki `adspectr` nomi haqida eslatma.

### 2026-07-11 sessiyasi — Internal MVP pass (PR #150 merged)
Dashboard bug'lari, halollik (honesty) tuzatishlari, brend va performans:
- ✅ **Brand illustration'lar** — public marketing image slot'lariga real brend
  rasmlar (Phase 1); `docs/` ichida project-wide image plan + generatsiya prompt'lari.
- ✅ **Dashboard bug'lari** — N+1 so'rov tuzatildi, o'lik campaign toolbar,
  "empty vs disconnected" holatlar farqlandi, brend nomlanishi.
- ✅ **`useRealtimeRefresh`** endi stale `onRefresh`/events'ga bog'lanmaydi
  (realtime socket refresh to'g'ri ishlaydi).
- ✅ Honesty: Meta-only MVP uchun soxta "launched"/"connected" holatlar tozalandi.

### 2026-07-10 sessiyasi — MVP-tayyorlik: real deploy blockerlari (PR #149)
Barcha CI darvozalari yashil edi, lekin ikki mustaqil audit real MVP blockerlarini topdi:

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
  aylanmasdi → callback endi `getAdAccounts` bilan real ad-account'ni hal qiladi.
- ✅ **`META_CALLBACK_URL` noto'g'ri handler'ga** ishora qilardi → render.yaml + DEPLOY.md tuzatildi.
- ✅ **Register → workspace hydration** — register endi login kabi workspace'ni hydrate qiladi.
- ✅ **Render health check `/health` → `/ready`** (DB/Redis o'lganda 503 qaytaradi).
- ✅ Graph API versiya birlashtirildi (v19→v20), OAuth `pages_*` scope qo'shildi.
- ✅ **Mock sahifalar halol qilindi** (MVP faqat Meta): Launch Hub Google/Yandex
  "Coming soon"; `/settings/integrations` mock'iga "Preview" banner + real `/settings/meta` havolasi.

### Oldingi sessiyalar (qisqacha)
- **2026-06-03 — 10/10 sprint (PR #131):** cheap strict TS flag'lar; web unit 12→97;
  backend service spec 152→262 (6 service); CI hardening (default-deny GITHUB_TOKEN, dependabot).
- **2026-06-02 — sifat sprinti (10 PR):** Launch refactor 1610→34 qator orchestrator (#113);
  dashboard freeze fix (#114); SEO + animatsiya (#115); conversational onboarding (#116);
  AI Agents redizayn + real backend ulanish (#117/#118/#121); `/launch` → real orchestrator (#119);
  sifat sprinti — testlar 120/120, GitHub Actions CI, `ignoreBuildErrors` o'chirildi, Payme
  checkout real backend (#120); Reports CSV eksport (#122). **Loyiha bahosi 7.2 → ~8.6/10.**

### MVP fokus
**Ad Launcher (Meta, 3-bosqichli flow) production deploy.**
Qolgan modullar (Marketplace, Portfolio, AmoCRM, AI Agents, Fraud audit va h.k.) kodda
turaveradi, lekin MVP launch va sinov diqqati Ad Launcher'ga qaratiladi. Deploy: `DEPLOY.md`.

### 10/10 ga qolgan ish (credential yoki katta feature kerak)
- [ ] **To'lov live** — Render env: `PAYME_MERCHANT_ID` + `PAYME_MERCHANT_KEY` (webhook `/billing/payme`)
- [ ] **Ad Library** — Meta `ads_archive` API (META_APP_ID/SECRET kerak)
- [ ] **Simulation** — real Meta tarixiy data (connected account kerak)
- [ ] **Reports PDF** — client-side PDF (CSV tayyor)
- [ ] Render'da Postgres+Redis+API, Vercel'da web, Meta App credentials va OAuth callback ro'yxati
- [ ] Birinchi sinov: register → workspace → Meta connect → Ad Launcher → real launch

---

## Repo strukturasi

```
apps/
  web/                 — Next.js 14 App Router frontend
    src/
      app/
        (auth)/        — login / register
        (dashboard)/   — barcha dashboard sahifalari (quyidagi jadval)
        marketplace/   — mutaxassislar bozori (public)
        lp/            — landing page
        solutions/, features/, onboarding/, privacy/, terms/, ...
      components/      — umumiy React komponentlar
      hooks/           — React hook'lar (masalan useRealtimeRefresh)
      lib/, utils/     — helper'lar (test qamrovi shu yerda)
      stores/          — Zustand store'lar
      i18n/            — uz/ru/en tarjimalar (i18n:check paritet tekshiradi)
      types/, content/, middleware.ts
  api/                 — NestJS 10 backend
    src/
      auth/            — JWT/local/OAuth, refresh token, workspace guard
      campaigns/, ads/, ad-sets/, creatives/  — reklama domeni
      launch-orchestrator/  — Ad Launcher backend (Meta launch flow)
      meta/            — Meta Graph API: ads, audit, sync, cron, AI engine
      platforms/       — platform OAuth callback'lar (meta/google/yandex)
      integrations/    — tashqi integratsiyalar (AmoCRM connector shu yerda)
      ai-agent/, ai-decisions/, agents/  — AI agent runtime va qarorlar
      auto-optimization/, budget/, analytics/, conversions/  — optimallashtirish
      workspaces/, workspace-members/, workspace-service/, team-invites/  — multi-tenant
      billing/         — obuna + Payme
      marketplace bilan bog'liq: agents/, landing-pages/, heygen/
      retarget-signal/, triggersets/, events/, queue/  — realtime + Bull queue
      health/          — /ready, /health probe'lar
      database/        — TypeORM datasource + migrations/ + seed
      common/, config/, dto/, mcp/
  retargeting-worker/  — mustaqil worker (Bull consumer, SQL sql/ ichida)
packages/
  shared/              — @adspectr/shared (umumiy tiplar/util)
  ai-sdk/              — @adspectr/ai-sdk (OpenAI/Anthropic abstraksiya)
  creative-hub-core/   — @adspectr/creative-hub-core (kreativ generatsiya yadrosi)
```

> Turbo bog'liqlik tartibi: `api` build'i avval `@adspectr/shared` va `@adspectr/ai-sdk`
> ni build qiladi; `web` `@adspectr/creative-hub-core`'ga bog'liq. Jest/Vitest bu paketlarga
> `moduleNameMapper` orqali to'g'ridan-to'g'ri `src`'ni map qiladi.

---

## Dashboard sahifalari (apps/web/src/app/(dashboard)/)

| Sahifa | Yo'l | | Sahifa | Yo'l |
|--------|------|-|--------|------|
| Dashboard | /dashboard | | Reports / Reporting | /reports, /reporting |
| Campaigns | /campaigns | | Budget | /budget |
| Ad Launcher | /ad-launcher | | Billing | /billing |
| Launch (wizard) | /launch | | Automation | /automation |
| Creative Hub | /creative-hub | | Auto-optimization | /auto-optimization |
| Creative Scorer | /creative-scorer | | Top Ads | /top-ads |
| Creative Audit | /creative-audit | | Competitors | /competitors |
| Meta Audit | /meta-audit | | Simulation | /simulation |
| Ad Library | /ad-library | | ROI Calculator | /roi-calculator |
| AI Agents | /ai-agents | | Retargeting | /retarget, /retargeting |
| Create Agent | /create-agent | | Triggersets | /triggersets |
| AI Decisions | /ai-decisions | | Audiences | /audiences |
| Marketplace | /marketplace | | Performance | /performance |
| My Portfolio | /my-portfolio | | Team | /team |
| Landing Page | /landing-page | | Settings | /settings |
| Site Generator | /site-generator | | Platforms | /platforms |
| Wizard | /wizard | | Service | /service |

> MVP diqqati: **Ad Launcher / Launch**. Ba'zi sahifalar "Preview"/"Coming soon"
> badge bilan halol belgilangan (real integratsiya hali yo'q).

---

## Git workflow

```bash
git log --oneline -10          # So'nggi commitlar
git status                     # Hozirgi holat
git checkout -b feature/...    # Yangi feature branch
git push -u origin <branch>    # Pushdan keyin PR oching
```

**Qoida:** Har yangi feature uchun yangi branch → PR → `main`ga merge. Har PR CI'dan o'tishi shart.

---

## Konvensiyalar

- **Kod uslubi:** mavjud fayllarga moslash. API'da NestJS module/service/controller
  namunasi; web'da App Router server/client component ajratmasi.
- **Testlar:** API — `*.spec.ts` (Jest, service yonida); web — `*.test.ts(x)` (Vitest,
  asosan `lib`/`utils`); e2e — Playwright smoke (`test:e2e`, brauzersiz request API).
- **i18n:** har yangi UI matn uz/ru/en uchtasida bo'lishi kerak — aks holda `i18n:check` yiqiladi.
- **DB o'zgarishi:** prod'da `synchronize:false`. Sxema o'zgarsa **migration yoz**
  (idempotent: `IF NOT EXISTS`, `hasTable`/`hasColumn` guard) va toza PG'da sinab ko'r.
- **Halollik (honesty):** real integratsiyasiz feature'ni "launched/connected" deb
  ko'rsatma — "Preview"/"Coming soon" badge qo'y.
- **Xavfsizlik:** bcrypt 12 round, refresh token hash'langan, JWT secret fail-closed,
  email-enumeration'dan himoya. Bularni buzma.

---

## Sessiya oxirida qilish kerak

1. `git status` — o'zgarishlarni tekshir
2. Tegishli CI darvozalarini lokal qaytar (test / lint:check / tsc / i18n:check / build)
3. Commit va push (`git push -u origin <branch>`)
4. Bu fayldagi "Joriy holat" bo'limini yangilash (nima qilindi, nima qoldi)
```
