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

## Joriy holat (so'nggi yangilash: 2026-05-11)

**Asosiy branch:** `main`
**Faol branch:** `claude/review-project-status-Ccbxh`

### Bajarilgan va production-ga merged bo'lgan ishlar (PR merged):
- Landing page qayta dizayni (PR #87–#97)
- Ad Launcher 3-bosqichli flow
- Marketplace (mutaxassislar bozori)
- Portfolio Gamification (badge, level, leaderboard)
- i18n (Uzbek/Russian/English)
- AmoCRM integration (OAuth, sync, ROAS hisoblash)
- Fraud detection
- Creative Hub, Meta Audit, Reporting, Budget pages qayta dizayni
- Retargeting worker

### Hozir nima ishlashim kerak?
> **Bu bo'limni har sessiya boshida tekshir va yangilash.**

- [ ] Hali aniqlanmadi — foydalanuvchi ko'rsatmasi kutilmoqda

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
