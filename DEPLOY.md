# Nishon AI — MVP Deploy Yo'riqnomasi

MVP fokus: **Ad Launcher** (3-bosqichli flow: Manba → Tanlash → Ishga tushirish).

Arxitektura:
- **Backend (API)** → Render.com (NestJS + Postgres + Redis)
- **Frontend (Web)** → Vercel (Next.js)
- **Reklama integratsiyasi** → Meta (Facebook) Ads API

---

## 1. Tayyorgarlik — Kerakli hisoblar

| Servis | Maqsad | Link |
|--------|--------|------|
| Render.com | API + Postgres + Redis | https://dashboard.render.com |
| Vercel | Web frontend | https://vercel.com |
| Meta for Developers | Meta App (OAuth + Ads API) | https://developers.facebook.com/apps |
| OpenAI yoki Anthropic | AI insights | https://platform.openai.com / https://console.anthropic.com |

---

## 2. Meta App sozlash (eng muhim qadam)

1. https://developers.facebook.com/apps → **Create App** → Business turini tanlang
2. **App ID** va **App Secret** ni nusxalang
3. Mahsulot qo'shing: **Facebook Login** va **Marketing API**
4. **Facebook Login → Settings → Valid OAuth Redirect URIs**'ga qo'shing:
   - `https://<sizning-api-render-domain>/platforms/meta/callback`
5. **App Review → Permissions and Features** — quyidagilarni so'rang:
   - `ads_management`
   - `ads_read`
   - `business_management`
6. Test paytida: **Roles → Test Users** orqali test foydalanuvchi yarating

---

## 3. Render — API deploy

### 3.1 Database va Redis

Render dashboard'da:
1. **New → PostgreSQL** → plan: Free → DB nomi: `nishon-ai-db` → yarating
2. **New → Redis** → plan: Free → nom: `nishon-ai-redis` → yarating
3. Har biridan **Internal Database URL** ni nusxalang

### 3.2 Web Service

1. **New → Blueprint** → bu repo'ni ulang → `render.yaml` avtomatik o'qiladi
2. Yoki qo'lda: **New → Web Service** → repo → quyidagilar:
   - **Build Command:**
     ```
     NODE_ENV=development pnpm install --frozen-lockfile && \
     pnpm --filter @adspectr/shared build && \
     pnpm --filter @adspectr/ai-sdk build && \
     NODE_OPTIONS='--max-old-space-size=400' pnpm --filter api build
     ```
   - **Start Command:** `pnpm --filter api run start:prod:with-migrations`
   - **Health Check:** `/health`

### 3.3 Environment Variables (Render API service)

**Majburiy (sync:false — qo'lda kiriting):**
```
DATABASE_URL=<3.1-dagi Postgres Internal URL>
REDIS_URL=<3.1-dagi Redis Internal URL>
JWT_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
ENCRYPTION_KEY=<openssl rand -hex 16>   # 32 char hex
META_APP_ID=<2-bosqichdan>
META_APP_SECRET=<2-bosqichdan>
META_CALLBACK_URL=https://<api-domain>/platforms/meta/callback
OPENAI_API_KEY=<optional, AI insights uchun>
```

**Render avtomatik (render.yaml'dan):**
```
NODE_ENV=production
PORT=10000
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AI_PROVIDER=openai
```

**Birinchi deploy:** `TYPEORM_SYNCHRONIZE=true` ni vaqtincha qo'shing, deploy o'tgach o'chiring. Yoki migration fayllari mavjudligini tekshiring: `apps/api/src/database/migrations/`.

---

## 4. Vercel — Web deploy

1. Vercel dashboard → **Add New → Project** → repo'ni import qiling
2. `vercel.json` avtomatik o'qiladi (Next.js, `pnpm --filter web build`)
3. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://<render-api-domain>
   ```
4. Deploy → domeningizni `apps/web` uchun ulang

---

## 5. Birinchi sinov

1. Render'da API ko'tarilgach: `https://<api-domain>/health` → `{"status":"ok"}`
2. Vercel'da web ko'tarilgach: `https://<web-domain>/register`
3. Foydalanuvchi yarating → email/parol bilan kiring
4. **Settings → Workspace** → workspace yarating
5. **Settings → Integrations → Meta** → "Connect" tugmasi → OAuth oqimi
6. **Ad Launcher** sahifasiga o'ting → 3-bosqich:
   - **Manba:** Meta hisobi va sana oralig'i
   - **Tanlash:** mavjud kampaniyalardan belgilang
   - **Ishga tushirish:** budget + objective + audiences → "Launch" tugmasi
7. Meta'da yangi kampaniya `PAUSED` holatda yaratilishi kerak

---

## 6. Lokal dev

Docker bilan:
```bash
cp .env.example .env
# .env ni to'ldiring (JWT_SECRET, ENCRYPTION_KEY, META_*)

docker compose up -d postgres redis
pnpm install
pnpm --filter @adspectr/shared build
pnpm --filter @adspectr/ai-sdk build
pnpm dev
```

API: http://localhost:3001 — Web: http://localhost:3000

Demo mode: agar autentifikatsiya tokeni `demo-` bilan boshlansa, Ad Launcher mock data ko'rsatadi va real Meta API chaqirilmaydi.

---

## 7. MVP scope — nima kiradi, nima yo'q

### ✅ MVP'ga kiradi
- Auth (email/parol + JWT)
- Workspace yaratish
- Meta OAuth va akkaunt ulash
- Ad Launcher 3-bosqichli flow
- Launch Orchestrator: draft → validate → launch
- Meta'da real Campaign + AdSet'lar yaratish (`PAUSED` holatda)
- Launch history

### ⏸ MVP'dan keyin (kod bor, lekin MVP uchun majburiy emas)
- Google/TikTok/Yandex launch (Meta yetadi)
- Manba ad'larining kreativlarini avtomatik nusxalash (hozir AdSet yaratamiz, Ad yaratish keyingi iteratsiyada)
- Creative Hub / HeyGen / Higgsfield video
- AmoCRM integratsiyasi
- Marketplace, Portfolio Gamification
- Fraud detection, Auto-optimization

---

## 8. Ma'lum cheklovlar / TODO

- ✅ Source kampaniyadan creative nusxalash — endi ishlaydi (`MetaConnector.getCampaignAds()` + `createAdFromExistingCreative()`)
- ✅ Targeting (mamlakat, yosh, jins) frontend'dan keladi
- ✅ `launch_jobs` jadvali uchun migration mavjud
- `splitByFunnelStage` flag DTO'ga keladi, lekin orchestrator har doim har audience uchun alohida AdSet yaratadi — flag amalda har doim "true" kabi ishlaydi.
- Google Ads launch kod jihatdan ishlaydi, lekin real Google Ads sandbox bilan qo'lda tekshirilmagan.
- TikTok/Yandex launch — connector stub'lar mavjud, lekin orchestrator hozir faqat Meta va Google'ni qabul qiladi.

---

## 9. Xatolarni topish

| Xato | Sabab | Yechim |
|------|-------|--------|
| `JWT_SECRET must be set` | env yo'q | Render env tab'da qo'shing |
| `No active meta account` | OAuth qilinmagan | Settings → Integrations → Meta connect |
| `Failed to fetch /meta/dashboard` | Meta token muddati tugagan | Disconnect → qayta connect |
| 500'ler stack-trace yo'q | `EXPOSE_INTERNAL_ERROR_MESSAGE=false` | Vaqtincha `true` qiling debug uchun |
| Migration ishlamaydi | `start:prod` ishlatilgan | `start:prod:with-migrations` ga o'zgartiring |
