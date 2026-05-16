# /launch Sahifa Dizayn Brief

**Maqsad:** `/launch` sahifasini ideal UX/UI bilan qayta qurish — noldan kampaniya yaratish flow'i, lekin /ad-launcher (mavjud reklama nusxalash) bilan aralashmaslik.

**Sana:** 2026-05-16
**Status:** Tasdiq kutilmoqda

---

## 1. Joriy holat tahlili

### Mavjud kod
- `/launch/page.tsx` — **1610 qator**, bitta faylda
- `/launch/preview/page.tsx` — 175 qator
- `/launch/confirm/page.tsx` — 124 qator
- `/launch/execute/agent/` va `/launch/execute/specialist/` — yana sub-route'lar

### Hozirgi flow
1. **Platforma tanlash** — Meta / Google / Yandex (Telegram disabled)
2. **Launch mode tanlash** — Self / AI / Expert
3. **Multi-step form** — har platforma uchun alohida (Meta 6, Google 5, Yandex 4 step)
4. **Confirm → Preview → Execute**

### Muammolar
- ❌ `/launch` va `/ad-launcher` orasida aniq farq yo'q — foydalanuvchi adashishi mumkin
- ❌ Bitta faylda 1610 qator — texnik qarz, har qanday o'zgarish murakkab
- ❌ 3 ta platforma stepper logikasi takrorlanadi
- ❌ Mode picker (Self/AI/Expert) ↔ Platform picker tartibsiz
- ❌ Mobile responsive ko'rinmagan — keng layout
- ❌ Empty state / loading / error yo'q yoki sodda
- ❌ "Preview" — yarim mock
- ❌ Real Meta API integration emas (oddiy `campaignsApi.create`, Meta'ga to'g'ridan-to'g'ri yubormaydi)

---

## 2. Yangi vizual dizayn taklifi

### IA (Information Architecture)
Ikki sahifa farqini aniq qilish:

| Sahifa | Maqsad | Foydalanuvchi profili |
|--------|--------|----------------------|
| **`/launch`** | "Noldan yangi kampaniya" — kreativ tayyor emas, sozlamalardan boshlanadi | Yangi mahsulot egasi |
| **`/ad-launcher`** | "Mavjud reklamani nusxalash" — Meta'da ishlayotgan reklama bor, masshtablash | Mavjud kampaniya egasi |

Sidebar'da har biri **alohida ikon va aniq tushuntirish**:
- 🚀 **Launch** — Yangi kampaniya
- 🔄 **Ad Launcher** — Mavjud reklamadan nusxa

### Vizual til
- **Yashil brand ranglari** — saqlanadi (brand identity)
- **Card-based layout** — saqlanadi
- **YANGI: Hero section** — har bir asosiy qadamda katta ko'rinarli sarlavha + icon + bir gap qisqa tushuntirish
- **YANGI: Progress ribbon** — yuqorida har doim "1/4 — Platforma tanlash" + bosqich previewlar
- **YANGI: Side preview panel** — o'ng tomonda har doim "Hozirgi sozlamalar" jonli yangilanadigan card

### Layout tuzilishi (har bir step)
```
┌──────────────────────────────────────────────────────────┐
│  🚀 Yangi kampaniya yaratish                              │
│  Meta · 2/6: Auditoriya — kimga ko'rsatish?               │
│  [●●○○○○]  ← progress ribbon                              │
├────────────────────────────┬─────────────────────────────┤
│                            │  📋 KAMPANIYA XULASASI       │
│  ──────                    │                              │
│  [Hero card: step title    │  Platforma:    Meta          │
│   + 1 gap tushuntirish]    │  Maqsad:       Leads         │
│                            │  Davlat:       UZ            │
│                            │  Yosh:         18-45 (jonli) │
│  [Step content here]       │  Byudjet:      $20/kun       │
│                            │  Davom:        7 kun         │
│                            │                              │
│                            │  Hech narsa Meta'ga          │
│                            │  yuborilmagan — siz oxirgi   │
│                            │  qadamda tasdiqlaysiz.       │
│                            │                              │
│  [← Orqaga]  [Davom →]     │                              │
└────────────────────────────┴─────────────────────────────┘
```

### Step-by-step flow (Meta uchun namuna)

#### Step 0 — Platforma + Mode (yangilangan)
- 3 ta katta card: Meta / Google / Yandex
- Har birida: real-time "necha hisob ulangan", "ulangan emas" badge
- Tanlangach: mode picker (Self / AI / Expert) — kichik tab yoki radio group
- Modal qadamlarni xeshtab bilan ko'rsatish: "Bu rejim shu narsani qiladi"

#### Step 1 — Maqsad (Awareness, Traffic, Leads, Sales)
- 6 ta katta button-card, har biri:
  - Icon (Megaphone, Globe, Target, ShoppingCart, ...)
  - Sarlavha
  - 1 gap tushuntirish ("Kim uchun: yangi brendlar")
  - **YANGI: Realistic example** — "Masalan: 'Yangi cafe ochildi, atrofdagilar bilsin'"
  - Active state: green ring + check icon
- AI mode tanlangan bo'lsa: yuqorida AI tavsiyasi — "Sizning bizneszingiz uchun Leads tavsiya etiladi"

#### Step 2 — Auditoriya (Geo + Age + Gender)
- **Davlat:** karta variant chips (UZ, KZ, RU, TR, US) + "Boshqa" select
- **Yosh:** range slider (18→65), real-time "Taxminiy auditoriya: 2.3M kishi" (Meta Audience Insights API)
- **Jins:** Hammasi / Erkak / Ayol
- **YANGI: Tavsiya** — "Sizning maqsadingiz uchun ushbu segmentlar ishlaydi"

#### Step 3 — Byudjet va davom
- Daily slider $5–$500
- Davomi: chip variants (3 kun / 7 kun / 14 kun / 30 kun / cheksiz)
- **Real-time hisoblash:** "7 kun × $20 = $140 jami" + Meta reach estimate
- **YANGI: Smart presets** — "Test paketi: $35/kun × 3 kun" / "Standard: $20/kun × 7 kun"

#### Step 4 — Kreativ
- Upload zone (drag & drop)
- Yoki: **YANGI** — "Creative Hub'da kreativ yarating" link
- Text input: headline / body / CTA select
- **Live preview:** Meta feed/story formatda
- Multi-creative support: 2-5 ta turli kreativ (A/B test)

#### Step 5 — Targeting (advanced — collapsed by default)
- Interest layering
- Custom audiences (mavjud bo'lsa)
- Exclusions

#### Step 6 — Tasdiqlash
- Full summary card — har bir maydon
- "Meta'da nima yaratiladi" preview (1 Campaign + N AdSets + M Ads — /ad-launcher'dagi kabi)
- **Estimated metrics:** "Taxminiy reach: 12K-45K kishi, taxminiy CPL: $3-8"
- "Tasdiqlash va yaratish" tugmasi — Meta API'ga real chaqiruv

---

## 3. Texnik yondashuv

### Kod tashkili
Hozirgi 1610 qator bitta faylda — refactor:
```
launch/
├── page.tsx                          (asosiy, 300 qator)
├── _components/
│   ├── PlatformPicker.tsx           (250 qator)
│   ├── LaunchModeTabs.tsx           (100 qator)
│   ├── ProgressRibbon.tsx           (60 qator)
│   ├── SummaryPanel.tsx             (200 qator — o'ng panel)
│   ├── steps/
│   │   ├── ObjectiveStep.tsx        (150)
│   │   ├── AudienceStep.tsx         (200)
│   │   ├── BudgetStep.tsx           (180)
│   │   ├── CreativeStep.tsx         (250)
│   │   ├── TargetingStep.tsx        (200)
│   │   └── ConfirmStep.tsx          (180)
│   └── HeroCard.tsx
├── _lib/
│   ├── use-launch-wizard.ts         (state hook, 350)
│   ├── types.ts
│   └── meta-objective-presets.ts
```

### Real backend
- **Meta:** `launch-orchestrator` bilan ulash (mavjud, /ad-launcher ishlatadi)
- **Google:** `googleConnector.createCampaign` (mavjud, lekin stub)
- **Yandex:** keyingi PR — hozircha "Tezda" badge

### Empty / Connect state
Har platforma uchun:
- "Meta hisobi ulanmagan" → ulash CTA (boshqa sahifalar kabi)
- "Hech kampaniya yaratilmagan" sahifa boshida — agar boshlanmagan bo'lsa

### Mobile responsive
- Steplar vertikal, side panel pastga ko'chadi
- Sliderlar touch-friendly
- Form input larger tap targets (min 44px)

---

## 4. Mockup wireframe (matnli)

### Platforma tanlash (Step 0)
```
┌────────────────────────────────────────────────────────────┐
│  🚀 Yangi kampaniya yaratish                                │
│  Qaysi platformada reklama qilasiz?                         │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │     ⓕ        │ │     G       │ │    Y        │           │
│  │   Meta       │ │  Google     │ │  Yandex     │           │
│  │              │ │             │ │             │           │
│  │ Facebook,    │ │ Search,     │ │ Search,     │           │
│  │ Instagram    │ │ Display     │ │ Display     │           │
│  │              │ │             │ │             │           │
│  │ ● Ulangan    │ │ ● Ulangan   │ │ ○ Ulanmagan │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  Rejim:                                                     │
│  [● O'zim   ○ AI yordami   ○ Mutaxassis topish]            │
│                                                             │
│                                  [Davom →]                  │
└────────────────────────────────────────────────────────────┘
```

### Stepper (Meta · Step 2/6 namuna)
```
┌──────────────────────────────────────────────────────────┐
│  ⓕ Meta — Yangi kampaniya                              [×] │
│  ●●○○○○  2/6 — Auditoriya                                 │
├─────────────────────────────────┬────────────────────────┤
│                                 │ 📋 XULASA              │
│  👥 Kimga ko'rsatamiz?           │                        │
│  Aniq auditoriya = arzon CPL    │ Platforma   Meta        │
│                                 │ Maqsad      Leads       │
│  📍 Davlat                       │ Davlat      UZ          │
│  [UZ ✓] [KZ] [RU] [TR] [Other]  │ Yosh        18-45 ⓘ    │
│                                 │ Jins        Hammasi     │
│  🎂 Yosh                         │ Byudjet     —           │
│  ────●────────●─────             │ Davom       —           │
│  18                       45    │ Kreativ     —           │
│  Taxminiy reach: 2.3M           │                        │
│                                 │ ─────────              │
│  🚻 Jins                         │ Taxminiy reach:        │
│  [Hammasi ✓] [Erkak] [Ayol]     │   2.3M kishi           │
│                                 │ Taxminiy CPL:          │
│  💡 Tavsiya                      │   $3-8                 │
│  Leads uchun: 25-45 yosh        │                        │
│                                 │                        │
│  [← Orqaga]            [Davom →] │                        │
└─────────────────────────────────┴────────────────────────┘
```

---

## 5. Phase'lar (qadam-baqadam, agar tasdiqlasangiz)

### Phase 1 — Struktura va asosiy step'lar (1 sessiya)
- 1610 qatorli faylni 8-10 ta komponentga bo'lish
- ProgressRibbon + SummaryPanel asosiy layout
- Platforma + Mode picker yangilanishi
- Meta Step 1-3 (Objective, Audience, Budget) yangi UI

### Phase 2 — Kreativ va Confirm (0.5 sessiya)
- CreativeStep — drag&drop + live preview
- ConfirmStep — "Meta'da nima yaratiladi" + real chaqiruv

### Phase 3 — Google/Yandex (0.5 sessiya)
- Google Step UI (yoki "Tezda")
- Yandex Step UI (yoki "Tezda")

### Phase 4 — Boy detallar (0.5 sessiya)
- AI tavsiyalari (har stepda)
- Audience reach estimate (Meta API)
- Mobile responsive sayqallash
- Loading / error / success animatsiyalari

---

## 6. Sizdan tasdiq kerak

1. **IA aniqligi:** `/launch` = noldan yaratish, `/ad-launcher` = mavjuddan nusxalash — to'g'rimi?
2. **Layout:** Asosiy + o'ng SummaryPanel — yoqadimi?
3. **Vizual til:** Hozirgi yashil card UI saqlanadi — to'g'rimi?
4. **Mode picker:** Self/AI/Expert — saqlanadimi yoki olib tashlanadimi?
5. **Phase 1'dan boshlaymizmi yoki dizayn'ni o'zgartirasizmi?**
