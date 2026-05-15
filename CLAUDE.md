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

## Joriy holat (so'nggi yangilash: 2026-05-15)

**Asosiy branch:** `main`
**Faol branch:** `claude/setup-mvp-ads-Rivx6`

### MVP fokus
**Ad Launcher (3-bosqichli flow) production deploy.**
Qolgan modullar (Marketplace, Portfolio, AmoCRM, Fraud, AI Agents va h.k.) kodda turaveradi, lekin MVP launch va sinov diqqati Ad Launcher'ga qaratiladi.

Batafsil deploy qadamlari: `DEPLOY.md`.

### Bajarilgan va production-ga merged bo'lgan ishlar:
- Landing page qayta dizayni
- Ad Launcher 3-bosqichli flow (frontend)
- Marketplace, Portfolio Gamification, AmoCRM, Fraud detection
- i18n (Uzbek/Russian/English)
- Retargeting worker, Creative Hub, Meta Audit, Reporting, Budget pages

### Bu sessiyada qilingan ishlar (claude/setup-mvp-ads-Rivx6):
- ✅ `pnpm install` — barcha bog'liqliklar o'rnatildi
- ✅ Lokal `.env` shabloni (random JWT/ENCRYPTION secret'lar bilan)
- ✅ `pnpm --filter api build` va `pnpm --filter web build` — har ikkalasi muvaffaqiyatli
- ✅ **Bug tuzatildi:** `launch-orchestrator.service.ts` endi `payload.objective`, `payload.dailyBudget`, `payload.audiences` qiymatlarini Meta'ga to'g'ri uzatadi (oldin hardcoded edi)
- ✅ Har audience uchun alohida Meta AdSet yaratiladi (ABO uchun budget bo'linadi)
- ✅ `CreateLaunchJobDto`'ga `dailyBudget` va `sourceCampaignIds` qo'shildi
- ✅ `render.yaml`'ga `AI_PROVIDER` va `ANTHROPIC_API_KEY` qo'shildi
- ✅ `DEPLOY.md` — Render + Vercel + Meta App qadam-baqadam yo'riqnomasi

### Keyingi qadamlar (MVP ishga tushirish uchun):
- [ ] Render.com'da Postgres + Redis + API web service yaratish
- [ ] Vercel'da web frontend deploy
- [ ] Meta for Developers'da App yaratish va credentials Render'ga qo'shish
- [ ] OAuth callback URL'ni Meta App'ga ro'yxatdan o'tkazish
- [ ] Birinchi sinov: register → workspace → Meta connect → Ad Launcher → real launch
- [ ] Keyingi iteratsiya: source kampaniyadan kreativ nusxalash (`MetaConnector.createAd()`)

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
