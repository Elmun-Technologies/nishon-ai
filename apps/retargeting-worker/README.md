# Retargeting worker (`@adspectr/retargeting-worker`)

Signal bridge dan keladigan eventlar asosida Meta **Custom Audience** ga telefon (`PH`) va Telegram (`EXTERN_ID` hash) yuklaydi, 5 ta retargeting blokining backend qismini bir joyda ushlab turadi.

## 5 blok (implementatsiya xaritasi)

| Blok | Kod | Izoh |
|------|-----|------|
| 1. Audience Builder | `src/audience/builder.ts`, `syncAudiences` | Eventdan auditoriya: 7 kun issiq, 3 kun savat, Telegram narx so‘rovi, VIP 180 kun, saytsiz `chat` start. |
| 2. Logic Engine | `builder.ts` + `evaluate-retargeting.ts` | Kirish: event + purchase emas; chiqish: `Purchase` yoki vaqt oynasi; charchash: `workers/frequency.ts` + `AdImpression`/`recordDelivery`. |
| 3. Creative Mapping | `src/engine/creative-mapping.ts` | 1–3 / 4–7 / 8–14 kun uchun set kalitlari (ulanish keyingi bosqichda adset/creative ID bilan). |
| 4. Cross-platform sync | `src/engine/cross-platform.ts` | `signal_bridge_id` bir kalit; Telegram matn namunasi. |
| 5. Auto-optimization | `src/engine/evaluate-retargeting.ts` | CPA → byudjet yoki pauza (`CPA_STRATEGY`), ROAS → lookalike, `< MIN_AUDIENCE_SIZE` → `active=false`. |

## Texnik talablar (MVP)

- **Event bus**: Redis Stream `REDIS_EVENTS_STREAM` yoki list `events:{signal_bridge_id}`.
- **Worker**: har **15 daqiqada** `syncAudiences`.
- **Qoidalar**: `evaluateRetargeting` soatlik + haftalik cron (dushanba 04:00).
- **Postgres**: `sql/schema.sql` + ixtiyoriy `sql/seed.sql`.
- **Xavfsizlik**: diskda faqat hash; onboarding roziligi va token yangilash — tashqi servislar (API) zimmasi.

## Event shakli (majburiy: `event_id`)

```json
{
  "event_id": "uuid-1",
  "event": "ViewContent",
  "ts": 1710000000000,
  "signal_bridge_id": "sb_123",
  "phone": "+998901112233",
  "telegram_id": "123456789",
  "action_source": "chat",
  "metadata": { "intent": "price_ask" }
}
```

## Ishga tushirish

```bash
pnpm install
cd apps/retargeting-worker
cp .env.example .env
pnpm dev
```

## API funksiyalari (Cursor promptlari bilan mos)

- `createAudience({ name, rule, platform })` — `src/db/audiences.ts`
- `syncAudiences` — `src/workers/syncAudiences.ts`
- `evaluateRetargeting()` — `src/engine/evaluate-retargeting.ts`

## O‘zbekiston uchun eslatmalar

- Cookie kam ishlashi: **telefon hash** + **Telegram ID hash** + **`signal_bridge_id`**.
- Pixel bo‘lmasa: `action_source: "chat"` va `TelegramStart` / `ConversationStarted` eventlari.
