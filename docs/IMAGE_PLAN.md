# Nishon AI — Rasm rejasi (Image Plan)

Loyihani "ochib beradigan" rasmlar uchun to'liq xarita. Har bir slot uchun:
joylashuv, fayl, o'lcham/nisbat, maqsad va **tayyor generatsiya prompti**.

Generatsiya qilinganda: `.webp` formatida, aniq o'lchamda eksport qilib,
ko'rsatilgan fayl yo'liga qo'yamiz, so'ng kerak bo'lsa `imageSrc`ni yangilaymiz.

---

## Umumiy brand uslubi (har promptga qo'shiladi)

> **STYLE:** Premium modern SaaS marketing illustration for a performance-marketing
> platform. Brand palette: lime green `#b0ed6f` and `#93c75b` as primary accents,
> deep forest-ink `#152508`/`#1b2e06` for depth, off-white `#f7fcf2` backgrounds.
> Clean and minimal, generous negative space, soft gradients, glassmorphic 3D,
> subtle grain, cinematic soft lighting. **No text, no numbers, no logos, no
> watermarks, no real human faces.** High detail, crisp, professional.

Har bir promptni ishlatganda oxiriga qo'shing: `Aspect ratio <X:Y>.`

---

## Faza 1 — Public marketing sahifalari ✅ BAJARILDI

6 slot ilgari bitta takroriy demo SVG'ni ko'rsatardi. Endi har biriga alohida,
brand'ga mos SVG illyustratsiya yaratildi va `imageSrc` ulandi (build + e2e ✅).
Placeholder "Illustration / motion" caption'lar ham olib tashlandi.
Keyinroq xohlansa bu vektor illyustratsiyalarni raster/AI rasmlarga almashtirish mumkin.

| # | Slot / Fayl | Sahifa | Nisbat / Piksel |
|---|-------------|--------|-----------------|
| 1 | `public/stock/features-hero.webp` | `/features` hero | 21:9 · 1600×686 |
| 2 | `public/stock/features-pillar.webp` | `/features` pillar | 16:9 · 1280×720 |
| 3 | `public/stock/solutions-hero.webp` | `/solutions` hero | 21:9 · 1600×686 |
| 4 | `public/stock/solutions-steps.webp` | `/solutions` steps | 16:9 · 1280×720 |
| 5 | `public/stock/marketplace-hero.webp` | `/marketplace` hero | 21:9 · 1600×686 |
| 6 | `public/stock/marketplace-catalog.webp` | `/marketplace` katalog | 16:9 · 1280×720 |

### 1. Features hero (21:9)
```
A premium floating dashboard scene for an ad-analytics platform: translucent
green-tinted glass UI cards showing an upward-trending line chart, a bar chart,
and a circular performance gauge, arranged in soft 3D depth over an off-white
#f7fcf2 background with a gentle lime #b0ed6f glow. Airy, lots of empty space on
the LEFT third for headline text. Soft studio lighting, subtle grain.
Aspect ratio 21:9.
```

### 2. Features pillar — AI avtomatika (16:9)
```
An AI automation pipeline for ad campaigns: a glowing lime-green AI core node
connected by smooth curved lines to abstract platform glyphs (a rounded ads/social
icon, a chart, a target), forming an intelligent workflow graph. Green #93c75b and
lime #b0ed6f accents, deep forest-ink shadows, off-white background, glassmorphic
3D nodes. Centered, minimal, premium. Aspect ratio 16:9.
```

### 3. Solutions hero — o'sish voronkasi (21:9)
```
An abstract growth funnel: a smooth 3D pipeline that narrows from many small green
particles into a single bright upward arrow / rocket trail, symbolizing leads
converting into sales. Lime #b0ed6f to mid-green #93c75b gradient, off-white
backdrop, soft depth-of-field, generous empty space on one side. Elegant,
optimistic. Aspect ratio 21:9.
```

### 4. Solutions — 3 bosqichli flow (16:9)
```
A simple 3-step launch flow shown as three connected glassmorphic green cards on a
subtle horizontal path, each carrying an abstract icon (a source/folder, a
checklist, a rocket), gently ascending from left to right. Lime and forest-green
palette on off-white, soft shadows, clean and minimal. Aspect ratio 16:9.
```

### 5. Marketplace hero — mutaxassislar bozori (21:9)
```
A marketplace of marketing specialists: a constellation of floating rounded profile
cards (abstract faceless silhouette avatars in green tones) connected by thin
glowing lines to a central storefront/business glyph. Lime #b0ed6f highlights,
off-white background, premium glass cards, airy with room for a headline.
Trustworthy and modern. Aspect ratio 21:9.
```

### 6. Marketplace katalog (16:9)
```
A specialist catalog: a clean grid of glassmorphic profile cards, each hinting at a
star rating, a verified shield/check badge, and a green performance sparkline. Green
and lime palette on off-white, soft depth, orderly and premium. Abstract, no
readable text. Aspect ratio 16:9.
```

---

## Faza 2 — Auth va social (kuchli birinchi taassurot)

| # | Fayl | Joy | Nisbat / Piksel | Holat |
|---|------|-----|-----------------|-------|
| 7 | `public/onboarding/register-hero.webp` | `/register` hero sloti | 16:9 · 1280×720 | slot bor, `imageSrc` ulash kerak |
| 8 | `public/stock/home-hero-demo.webp` | Landing OG + ijtimoiy ulashish | 1200×630 | `page.tsx:17` OG_IMAGE'ni yangilash |

### 7. Register hero — birinchi kampaniya (16:9)
```
A welcoming, optimistic scene for a sign-up page of an AI ad platform: a small
stylized rocket lifting off a glass dashboard tile with a rising green chart trail,
surrounded by soft floating UI chips (a target, a coin, a play button). Bright lime
#b0ed6f and mid-green, off-white with a warm soft glow. Inviting, clean, premium 3D.
Aspect ratio 16:9.
```

### 8. Landing / OG social kartasi (1200×630)
```
A bold social-share hero for an AI performance-marketing platform: a glowing
lime-green upward growth arc / rocket trail over an abstract campaign dashboard,
deep forest-ink #152508 background with lime #b0ed6f and #93c75b accents and soft
floating particles. Cinematic lighting, one clear focal point, calm space near
center-left (text is added later in code). Striking yet minimal. Aspect ratio ~1.91:1
(1200×630).
```

---

## Faza 3 — Onboarding qadamlari (ixtiyoriy; slot kodda ulanishi kerak)

`public/onboarding/assets.json`da 7 slot bor, lekin hozir onboarding sahifasida
render qilinmagan. Rasm qilish uchun avval `ContentMediaSlot`ni har qadamga ulash
kerak. Fayl nomlari `assets.json`dagi `recommendedFile` bilan mos.

| Fayl | Qadam | Nisbat / Piksel |
|------|-------|-----------------|
| `welcome.webp` | 0 · Xush kelibsiz | 4:3 · 1200×900 |
| `goal.webp` | 1 · Maqsad | 21:9 · 1600×686 |
| `budget.webp` | 2 · Byudjet | 21:9 · 1600×686 |
| `industry.webp` | 3 · Soha | 21:9 · 1600×686 |
| `split-diagram.webp` | 4 · Kanal taqsimoti | 4:3 · 960×720 |
| `geo-map.webp` | 5 · Geografiya | 16:9 · 1280×720 |
| `summary-success.webp` | 6 · Yakun | 16:9 · 1280×720 |

### 0. Welcome (4:3)
```
A warm welcome illustration: an abstract friendly dashboard waking up — soft green
glass panels gently lighting up with a small waving/greeting motif and a rising
sparkle. Lime and mid-green on off-white, calm and inviting. Aspect ratio 4:3.
```
### 1. Goal — maqsad (21:9)
```
An abstract 'choose your goal' scene: three glowing green target/objective orbs
(leads, sales, awareness) floating with soft trails, one highlighted in bright lime
#b0ed6f. Off-white, airy, minimal. Aspect ratio 21:9.
```
### 2. Budget — byudjet (21:9)
```
An abstract budget-allocation scene: smooth green coins/chips flowing into balanced
stacks and a gentle slider/gauge, suggesting smart spend. Lime and forest-green on
off-white, clean, premium. Aspect ratio 21:9.
```
### 3. Industry — soha (21:9)
```
An abstract industry-selection scene: soft glass tiles each holding a simple sector
glyph (shop bag, storefront, services gear) in green tones, one gently highlighted.
Off-white, minimal, airy. Aspect ratio 21:9.
```
### 4. Channel split — kanal taqsimoti (4:3)
```
An elegant abstract donut/segmented-bar diagram splitting budget across ad channels,
rendered as glossy green 3D segments (lime #b0ed6f, mid #93c75b, forest #3d5626) on
off-white. Clean data-viz feel, no text. Aspect ratio 4:3.
```
### 5. Geo — Markaziy Osiyo (16:9)
```
A stylized minimal map of Central Asia (Uzbekistan highlighted) as smooth green
glass landforms with soft glowing location pins and connection arcs. Lime accents on
off-white, premium and clean, no country labels. Aspect ratio 16:9.
```
### 6. Summary success — yakun (16:9)
```
A celebratory but tasteful success scene: a green checkmark orb rising above a
glass dashboard with an upward chart and soft confetti particles in lime and green.
Off-white, optimistic, premium 3D. Aspect ratio 16:9.
```

---

## Generatsiyadan keyingi qadamlar (men bajaraman)

1. `.webp` fayllarni to'g'ri yo'llarga joylash.
2. Public sahifalarda `imageSrc`ni har slot uchun alohida faylga yangilash
   (`marketplace/page.tsx`, `solutions/page.tsx`, `features/page.tsx`).
3. `register/page.tsx` sloti + `page.tsx` OG_IMAGE'ni ulash.
4. (Faza 3) Onboarding'ga `ContentMediaSlot`larni ulash.
5. `pnpm --filter web build` + e2e bilan tekshirish, commit + push (PR #149).
