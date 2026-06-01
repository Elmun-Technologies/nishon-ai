# AdSpectr — To'liq Foydalanuvchi Sayohati Dizayn Brief

**Sana:** 2026-05-16
**Status:** Tasdiq kutilmoqda
**Hajm:** 7 ta katta ekran, 3-4 sessiya ish

---

## Maqsad

Yangi foydalanuvchi `adspectr.com`'ga kelganidan boshlab birinchi real kampaniya yaratguncha — har qadamda **aniq nima qilishini bilsin**, **adashmasin**, **ishonsin**.

Hozir nima muammo: 50+ sahifa, har biri o'zicha. Yagona narrative yo'q. Foydalanuvchi sayohatining ko'p qismi tushunarsiz.

---

## Hozirgi muammolar (audit asosida)

| # | Joy | Muammo |
|---|-----|--------|
| 1 | `/register` | "20+ modules", "3 languages" — mock stats ko'rsatiladi |
| 2 | `/login` | "Forgot password" yo'q (real foydalanuvchilarga muammo) |
| 3 | `/onboarding` | **UZ-only hardcode** — RU tanlasa ham UZ ko'rinadi |
| 4 | Onboarding "Pixel help $5" | UI bor, backend yo'q (foydalanuvchi yo'q narsani sotib oladi) |
| 5 | Onboarding tugagach | Workspace yaratiladi, dashboard'ga tushadi, lekin **nima qilish kerakligini bilmaydi** |
| 6 | `/dashboard` (yangi user) | KPI'lar "—" yoki "…" — Meta ulash CTA yo'q, foydalanuvchi adashadi |
| 7 | `/launch` vs `/ad-launcher` | Sidebar'da ikkalasi bor, farqi noma'lum |
| 8 | "Workspace — AI'ga uzatish" | "AI nima qiladi, men nima qilaman" — noaniq |

---

## Yangi narrative (asosi)

**Bir gap bilan:** "AdSpectr — Meta Ads'ni AI bilan boshqarish. Avval Meta hisobini ulang, audit oling, eng yaxshi kreativlardan yangi kampaniya yarating."

Bu narrative har sahifada bir xil bo'lib turishi kerak. Foydalanuvchi har doim **keyingi 1 ta qadamni** ko'rishi kerak.

---

## Yangi flow (7 ekran)

### Ekran 1 — Marketing Landing (`/`)
*(men hozir tegmayman — tegishimiz kerak bo'lsa, alohida brief)*

### Ekran 2 — Signup (`/register`)
**Maqsad:** Email/parol bilan yoki Google/Facebook orqali ro'yxat.

**Hozirgi muammolar:**
- Mock stats ("20+ Modules") — ishonchni pasaytiradi
- Onboarding draft summary chap tomonda — chalkash

**Yangi dizayn:**
```
┌──────────────────────────────────────────────────────┐
│  ✨ AdSpectr                              [Login]    │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │  Meta Ads'ni AI bilan boshqaring             │    │
│  │  Birinchi audit + birinchi kampaniya — bepul │    │
│  │                                              │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │  [G] Google bilan davom etish          │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │  [f] Facebook bilan davom etish        │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │                                              │    │
│  │  ─────────── yoki ─────────────              │    │
│  │                                              │    │
│  │  [Ism Familiya              ]                │    │
│  │  [you@email.com             ]                │    │
│  │  [Parol (kamida 8 belgi)    ]                │    │
│  │                                              │    │
│  │  [    Bepul boshlash    ]                    │    │
│  │                                              │    │
│  │  Akkauntingiz bor? Login                     │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ✓ 5 daqiqada audit  ✓ Bepul ulash  ✓ Hech qarz yo'q │
└──────────────────────────────────────────────────────┘
```

**O'zgarishlar:**
- Mock stats olib tashlanadi
- Onboarding draft summary olib tashlanadi (ekranni siqib chiqaradi)
- Asosiy CTA: **Google/Facebook social** (eng oson)
- Email faqat fallback
- Pastda 3 ta ishonch nuqtasi

### Ekran 3 — Welcome (`/welcome` yoki `/onboarding/0`)
*(YANGI ekran — register'dan keyin, onboarding'gacha)*

**Maqsad:** Foydalanuvchi tushunsin: "Men nima qilaman, AdSpectr nima qiladi".

```
┌──────────────────────────────────────────────────────┐
│  Salom, [Ism]! 👋                                     │
│                                                       │
│  Keling, 3 daqiqada sizning birinchi kampaniyangizni  │
│  ishga tushiramiz.                                    │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │  1   📝  Biznesingiz haqida 5 savol            │   │
│  │       Maqsad, byudjet, til                     │   │
│  ├───────────────────────────────────────────────┤   │
│  │  2   🔌  Meta hisobini ulaymiz                  │   │
│  │       Bir bosish, OAuth orqali xavfsiz          │   │
│  ├───────────────────────────────────────────────┤   │
│  │  3   🚀  Birinchi kampaniyani yaratamiz         │   │
│  │       AI taklif qiladi, siz tasdiqlaysiz        │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│         [    Boshlash    ]                            │
│                                                       │
│  Yoki bir ekran ko'rib chiqaman → Demo                │
└──────────────────────────────────────────────────────┘
```

**Foyda:**
- Foydalanuvchi 3 qadam **butun rasmni ko'radi** — nima bo'lishini biladi
- "AI'ga uzatish" o'rniga aniq tushuntirilgan
- Demo'ga ham yo'l qoldiriladi

### Ekran 4 — Onboarding (`/onboarding`, 5 step)

**Hozirgi:** 6 step (Welcome + 5 actual)
**Yangi:** 5 step (welcome alohida ekranga ko'chirildi)

#### Step 1 — Biznes turi
```
1/5 ●○○○○

Qaysi biznes uchun reklama qilasiz?

[🛍️ Onlayn do'kon]      [🎓 Kurs / ta'lim]
[🍔 Restoran / kafe]    [💼 Xizmat (klinika...)]
[📦 Boshqa]

                        [Davom → ]
```

#### Step 2 — Maqsad
```
2/5 ●●○○○

Kampaniyadan nima kutyapsiz?

┌─────────────────────────────────┐
│  💰  Sotuv / xarid              │
│  Mahsulot yoki xizmat sotish     │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  📞  Lid yig'ish                 │
│  Telefon, ariza, ro'yxat         │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  📣  Brendni tanitish           │
│  Yangi auditoriya, video views   │
└─────────────────────────────────┘

[← Orqaga]               [Davom →]
```

#### Step 3 — Davlat va til
*(YANGI step — hozir yo'q, lekin kerak)*
```
3/5 ●●●○○

Reklama qaerda ko'rinadi?

Davlat: [O'zbekiston ✓]  [Qozog'iston] [Rossiya] [Boshqa]

Til:    [O'zbek ✓]  [Rus]  [Ingliz]

[← Orqaga]               [Davom →]
```

**Bu step interfeys tili va kampaniya tilini ham aniqlaydi.** Foydalanuvchi RU tanlasa, butun keyingi UX RU bo'ladi.

#### Step 4 — Kunlik byudjet
```
4/5 ●●●●○

Kunlik reklama byudjeti?

       100 000 so'm
   ────●─────────────────
   50K           500K

≈ $8 / kun

📊 Bu byudjet bilan:
   Taxminiy reach:    8K-25K kishi/kun
   Taxminiy lidlar:   3-12 ta/kun

💡 Tavsiya: 100K so'm — eng yaxshi balans

[← Orqaga]               [Davom →]
```

**Bu sahifada hisoblash real ko'rinishi kerak** (Meta Audience Estimator API yoki yaqin yondashuv).

#### Step 5 — Meta Pixel
```
5/5 ●●●●●

Meta Pixel — saytdagi tashriflarni kuzatish

┌─────────────────────────────────┐
│  ✓  Pixel ID bor                 │
│  [Pixel ID kiriting          ]   │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  ○  Pixel yo'q — qo'shimcha     │
│     ma'lumot kerak               │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  ○  Hozir o'tkazib yuborish     │
│     (keyin sozlashingiz mumkin)  │
└─────────────────────────────────┘

[← Orqaga]               [Tugatish ✓]
```

**O'zgarish:** "$5 yordam" (mock service) olib tashlanadi, faqat "yo'q — qo'shimcha ma'lumot" qoladi. Bu real implement qilinmasa, vada bermaslik kerak.

### Ekran 5 — Connect Meta (`/onboarding/connect-meta`)
*(YANGI ekran — onboarding tugagach majburiy ulash)*

```
┌──────────────────────────────────────────────────────┐
│  ✓ Onboarding tugadi                                  │
│                                                       │
│  Endi Meta hisobini ulang                             │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │       ⓕ                                     │      │
│  │  Meta Business hisobi                       │      │
│  │                                              │      │
│  │  Biz quyidagilarni qilamiz:                 │      │
│  │  ✓ Reklama hisoblarini ko'rish              │      │
│  │  ✓ Kampaniyalar performansi sinx            │      │
│  │  ✓ Audit va tavsiyalar                      │      │
│  │  ✓ Sizning ruxsatingiz bilan kampaniya      │      │
│  │     yaratish (PAUSED holatda)               │      │
│  │                                              │      │
│  │  ✗ Hech narsani avtomatik o'zgartirmaymiz   │      │
│  │  ✗ Hech narsani sizsiz launch qilmaymiz     │      │
│  │                                              │      │
│  │  [  ⓕ Meta'ni ulash  ]                       │      │
│  │                                              │      │
│  │  Keyinroq ulash → Dashboard'ga              │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

**Nima muhim:**
- Foydalanuvchiga **biz nima qilamiz va nimani qilmaymiz** aniq aytiladi (ishonch)
- "Keyinroq ulash" — chiqish yo'li bor, lekin xato emas
- OAuth flow Meta tomonidan ochiq pop-up

### Ekran 6 — Dashboard (`/dashboard`, yangi user)
*Meta yo'q paytda — qo'llab-quvvatlash ekrani*

```
┌──────────────────────────────────────────────────────┐
│  Dashboard                                            │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  🎯 Birinchi qadamingiz                      │      │
│  │                                              │      │
│  │  1. ✓ Onboarding tugadi                     │      │
│  │  2. ○ Meta hisobini ulang  →  [ Ulash ]     │      │
│  │  3. ○ Birinchi audit oling                  │      │
│  │  4. ○ Birinchi kampaniyani yarating         │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  [Disabled KPI cards — Meta ulangach to'ladi]        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ —  │ │ —  │ │ —  │ │ —  │ │ —  │ │ —  │         │
│  │Sarf│ │ROAS│ │Konv│ │Camp│ │CTR │ │CPC │         │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘         │
│  ↑ Meta ulangach to'ladi                             │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Hozircha nimani sinab ko'rishingiz mumkin  │      │
│  │  ✦ AI Assistant'ga savol bering             │      │
│  │  ✦ Marketplace'da mutaxassis topish         │      │
│  │  ✦ Creative Hub'da kreativ yaratish         │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Ekran 7 — Dashboard (Meta ulanganidan keyin)
*Sync tugagach to'liq ko'rinish*

```
┌──────────────────────────────────────────────────────┐
│  Dashboard                                            │
│  Meta sinx: 2 daqiqa oldin                            │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  🎉 Audit tayyor!                           │      │
│  │  Sizning Meta hisobingiz uchun 360° audit    │      │
│  │  [ Auditni ko'rish → ]                       │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  KPI cards (haqiqiy ma'lumotlar)                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ $X │ │2.3x│ │ 45 │ │ 12 │ │1.8%│ │$0.4│         │
│  │Sarf│ │ROAS│ │Konv│ │Camp│ │CTR │ │CPC │         │
│  │ +5%│ │ +12│ │ +8%│ │   │ │ -2%│ │-1% │         │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘         │
│  ↑ Hammasi haqiqiy + period delta                     │
│                                                       │
│  [7-day chart]  [Active campaigns table]              │
│  [AI insights]  [Quick actions]                       │
└──────────────────────────────────────────────────────┘
```

---

## Sidebar tartibi (yangi)

Hozir 50+ link, foydalanuvchi adashadi. Yangi tartib **vazifa bo'yicha**, sub-darajada:

```
🏠 Dashboard
🚀 Kampaniya yaratish
    ├ Yangi kampaniya       (/launch — noldan)
    └ Mavjud nusxa          (/ad-launcher — copy)
📊 Tahlil
    ├ Audit 360°            (/meta-audit)
    ├ Top reklamalar        (/top-ads)
    ├ Performance           (/performance)
    └ Hisobotlar            (/reports)
🎯 Auditoriyalar           (/audiences)
🎨 Kreativlar              (/creative-hub)
⚙️ Sozlamalar
    ├ Workspace
    ├ Meta hisobi
    ├ To'lov
    └ Jamoa
```

Boshqalar (Marketplace, Site Generator, Triggersets, va h.k.) **alohida "Asboblar" bo'limiga ko'chiriladi** — asosiy flow'dan chetda.

---

## Phases (qadam-baqadam ish)

### Phase 1 — Onboarding flow (1 sessiya)
- `/register` mock stats olib tashlash
- Yangi `/welcome` ekrani (3 qadam preview)
- `/onboarding`: UZ hardcode → i18n keys (RU/UZ/EN ishlasin)
- 5 step (Welcome alohida)
- Step 3'da til/davlat tanlash
- "$5 help" olib tashlash

### Phase 2 — Connect Meta + Dashboard (1 sessiya)
- Yangi `/onboarding/connect-meta` ekrani
- `/dashboard` yangi user uchun checklist + disabled cards
- "Birinchi qadamingiz" widget — har step bossa keyingi sahifa

### Phase 3 — Sidebar va navigatsiya (0.5 sessiya)
- Sidebar qayta tartiblash
- `/launch` vs `/ad-launcher` — aniq farq qilib turuvchi nomlar va iconlar
- Marketing pages (Marketplace va h.k.) "Asboblar" ostiga

### Phase 4 — `/launch` qayta qurish (1-1.5 sessiya)
- 1610 qator → komponentlarga
- SummaryPanel, ProgressRibbon
- Real Meta API ulanishi

---

## Tasdiqlash savollari

1. **Welcome ekrani** (3 qadam preview) — kerakmi yoki onboarding bilan birga?
2. **Step 3 (til+davlat)** — onboarding ichida tanlash mantiqiymi? (Hozir til signup oldida)
3. **"Pixel help $5"** — to'liq olib tashlanadimi yoki implement qilamiz (foydalanuvchi $5 to'laydi, mutaxassis Pixel sozlab beradi)?
4. **Sidebar qayta tartiblash** — Marketplace/Site Generator/Triggersets'ni "Asboblar" ostiga ko'chirish mantiqiymi?
5. **Phase 1**'dan boshlaymizmi yoki dizayn'ni o'zgartirasizmi?

---

## Ko'rsatkichlar (KPI uchun)

Yangi flow bilan men kutaman:
- **Onboarding completion rate**: hozir taxminan ~30% → 60%+
- **Meta connect rate**: hozir taxminan ~20% → 50%+
- **First campaign rate**: hozir taxminan ~10% → 30%+

(Bular taxmin — real analitika kerak)
