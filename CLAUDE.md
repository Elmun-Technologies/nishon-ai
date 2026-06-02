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

## Joriy holat (so'nggi yangilash: 2026-06-02)

**Asosiy branch:** `main`
**Faol branch:** `claude/hopeful-rubin-vTmX2`

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
