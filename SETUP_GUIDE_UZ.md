# 🚀 Production Setup - Boshlang'ich Qo'llanma (Uzbek)

## Qism 1: Secrets & API Keys Yaratish (30 minuta)

### 1.1 JWT va Encryption Keys Generate Qiling

Terminal'ni oching va quyidagini ishlating:

```bash
# JWT_SECRET yaratish (random 32+ char)
echo "JWT_SECRET=$(openssl rand -hex 32)" > keys.env

# JWT_REFRESH_SECRET yaratish  
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)" >> keys.env

# ENCRYPTION_KEY yaratish (exactly 32 chars)
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)" >> keys.env

# Tekshirish
cat keys.env
```

**Output qanday bo'lishi kerak:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
JWT_REFRESH_SECRET=b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
ENCRYPTION_KEY=c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9  # exactly 32 chars!
```

**Eslab qoling:** Bu keys'ni **XAVFSIZ SAQLANG** (password manager'da)

---

### 1.2 API Keys Collect Qiling

#### OpenAI uchun
1. https://platform.openai.com/api-keys ga boring
2. "Create new secret key" boshing
3. Key copy qilib saqlang

#### Google uchun (3 keys)
1. https://console.cloud.google.com ga boring
2. Yangi project create qiling yoki existing project tanlaing
3. "OAuth 2.0 Client ID" create qiling
4. Application type: "Web Application"
5. Callback URL qo'shing: `https://<your-render-url>/auth/google/callback`
6. Client ID va Client Secret copy qiling
7. Google Ads API enable qiling va Developer Token oling

#### Meta (Facebook) uchun (2 keys)
1. https://developers.facebook.com ga boring
2. My Apps → Create App
3. "Marketing" o'yninini tanlang
4. App ID va App Secret copy qiling
5. Valid OAuth Redirect URIs qo'shing: `https://<your-render-url>/platforms/meta/callback`

#### TikTok uchun (2 keys)
1. https://ads.tiktok.com/marketing_api/apps ga boring
2. "Create new app"
3. App ID va Secret Key oling

#### Yandex uchun (2 keys)
1. https://oauth.yandex.ru ga boring
2. "Register application" 
3. Yandex Direct'ni tanlang
4. Redirect URI: `https://<your-render-url>/platforms/yandex/callback`

#### Stability AI uchun (image generation)
1. https://platform.stability.ai ga boring
2. Sign up / Login
3. API Key oling

#### HeyGen uchun (video generation)
1. https://www.heygen.com/api ga boring
2. Account yarating
3. API Key oling

**Barcha keys'ni Excel yoki password manager'da saqlang:**
```
Service | Key Name | Value | Generated Date | Notes
--------|----------|-------|---|---
OpenAI | OPENAI_API_KEY | sk-... | 2026-04-07 | 
Google | GOOGLE_CLIENT_ID | 123...com | 2026-04-07 |
Google | GOOGLE_CLIENT_SECRET | GOCSPX-... | 2026-04-07 |
... va hokazo
```

---

## Qism 2: Database va Cache Yaratish (1 soat)

### 2.1 Render'da PostgreSQL Database Yaratish

1. https://render.com ga boring
2. Sign up (GitHub orqali tafsil)
3. Dashboard → "New +" → "PostgreSQL"
4. **Settings:**
   - Name: `performa-db`
   - Database: `performa_prod`
   - User: `postgres`
   - Plan: "Starter" ($15/month)
5. **"Create Database" boshing**
6. Database yaratilgach, "Internal Database URL" copy qiling:
   ```
   postgresql://username:password@host:5432/performa_prod
   ```
7. Bu `DATABASE_URL` sifatida saqlang

### 2.2 Render'da Redis Yaratish

1. Dashboard → "New +" → "Redis"
2. **Settings:**
   - Name: `performa-cache`
   - Plan: "Free" ($5/month)
3. **"Create Redis" boshing**
4. Yaratilgach, "Internal Database URL" copy qiling:
   ```
   redis://:password@host:6379
   ```
5. Bu `REDIS_URL` sifatida saqlang

### 2.3 Lokal'da Test Qiling (optional)

```bash
# PostgreSQL ulaning
psql postgresql://user:pass@host:5432/performa_prod -c "SELECT 1;"
# Agar "1" chiqsa, ulanish ok

# Redis ulaning
redis-cli -u redis://:pass@host:6379 ping
# Agar "PONG" chiqsa, ulanish ok
```

---

## Qism 3: Render'da Web Service (API) Setup Qiling (30 minuta)

### 3.1 GitHub Repo Connect Qiling

1. Render Dashboard → "New +" → "Web Service"
2. GitHub account connect qiling (agar qilmagani bo'lsa)
3. `nishon-ai` repository tanlaing
4. **Settings:**
   - Name: `performa-ai-api`
   - Environment: `Node`
   - Branch: `main` (yoki `claude/add-creative-section-2MHjz`)
   - Build Command: 
     ```
     NODE_ENV=development pnpm install --frozen-lockfile &&
     pnpm --filter @performa/shared build &&
     pnpm --filter @performa/ai-sdk build &&
     NODE_OPTIONS='--max-old-space-size=400' pnpm --filter api build
     ```
   - Start Command: `pnpm --filter api start:prod`
   - Health Check Path: `/health`
   - Plan: "Standard" ($7/month)

### 3.2 Environment Variables Set Qiling

Render Dashboard → performa-ai-api → Environment

**Quyidagini add qiling:**

```env
NODE_ENV=production
PORT=10000

# Public URLs (bu yo'l boshqa kerakli narsalar bilan o'rnatiladi)
API_BASE_URL=https://performa-ai-api.onrender.com
FRONTEND_URL=https://your-vercel-domain.vercel.app

# Database (DATABASE_URL - sync false)
DATABASE_URL=postgresql://user:pass@host/performa_prod

# Redis (REDIS_URL - sync false)
REDIS_URL=redis://:pass@host:6379

# Secrets (sync false bo'lsin!)
JWT_SECRET=<paste generated value>
JWT_REFRESH_SECRET=<paste generated value>
ENCRYPTION_KEY=<paste generated value>

JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Provider
AI_PROVIDER=openai
OPENAI_API_KEY=<your key>

# Google
GOOGLE_CLIENT_ID=<your id>
GOOGLE_CLIENT_SECRET=<your secret>
GOOGLE_DEVELOPER_TOKEN=<your token>

# Meta
META_APP_ID=<your id>
META_APP_SECRET=<your secret>
META_CALLBACK_URL=https://performa-ai-api.onrender.com/platforms/meta/callback

# TikTok
TIKTOK_APP_ID=<your id>
TIKTOK_APP_SECRET=<your secret>

# Yandex
YANDEX_CLIENT_ID=<your id>
YANDEX_CLIENT_SECRET=<your secret>

# Creative APIs
STABILITY_API_KEY=<your key>
HEYGEN_API_KEY=<your key>

# Optional: Telegram
TELEGRAM_BOT_TOKEN=<your token>

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=120
```

**IMPORTANT:** "Sync" ni **false** qilib qo'ying secret variables uchun!

### 3.3 Deploy Qiling

1. Render Dashboard → "Deploy" boshing
2. Build process ko'ring (3-5 minut)
3. **XATOLIGI bo'lsa:** Logs ko'ring va o'ngalang
4. Muvaffaqiyatli bo'lsa, URL olishingiz mumkin: `https://performa-ai-api.onrender.com`

### 3.4 Health Check Qiling

```bash
curl https://performa-ai-api.onrender.com/health
# Output: {"status":"ok"} bo'lishi kerak
```

---

## Qism 4: Vercel'da Frontend Deploy Qiling (20 minuta)

### 4.1 Vercel'da Project Create Qiling

1. https://vercel.com ga boring
2. GitHub ulaning
3. "nishon-ai" repository import qiling
4. **Settings:**
   - Framework: "Next.js"
   - Root Directory: `./apps/web`

### 4.2 Environment Variables Set Qiling

Vercel Dashboard → Settings → Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=https://performa-ai-api.onrender.com
```

### 4.3 Deploy Qiling

1. "Deploy" boshing
2. Build logs ko'ring
3. **Agar build fail bo'lsa:**
   - Frontend page.tsx'dagi unicode quote error'ni o'ngalang
   - `npm run build` lokal'da test qiling
   - Yana deploy qiling

4. Deploy muvaffaqiyatli bo'lsa, URL olishingiz mumkin:
   ```
   https://performa-ai.vercel.app
   ```

### 4.4 Render'da FRONTEND_URL Update Qiling

1. Render Dashboard → performa-ai-api → Environment
2. `FRONTEND_URL` Update qiling: `https://performa-ai.vercel.app`
3. "Save Changes" boshing
4. Yana deploy qiling

---

## Qism 5: Database Migrations Qiling (15 minuta)

### 5.1 Render'da Migrations Run Qiling

**Option 1: Shell Access'dan (Easiest)**

1. Render Dashboard → performa-ai-api → Shell
2. Quyidagini jarayonga qiling:
   ```bash
   cd apps/api
   npm run migration:run
   ```

**Option 2: Manual SSH**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/render_key
# Public key copy qilib Render'da qo'shing

ssh -i ~/.ssh/render_key username@host
npm run migration:run
```

### 5.2 Tekshirish

```bash
# Render Shell'da:
npm run migration:run --env production

# Output:
# ✓ CreateInitialSchema1234567890 migration
# ✓ AddAgentProfileTable migration
# ... hokazo
```

---

## Qism 6: Testing va Verification (1 soat)

### 6.1 API Health Check

```bash
# Production API
curl https://performa-ai-api.onrender.com/health
# Expected: {"status":"ok"}

# Marketplace endpoints
curl https://performa-ai-api.onrender.com/marketplace/filters
# Expected: JSON with filter options
```

### 6.2 OAuth Flow Test Qiling

1. Vercel frontend oching
2. "Sign In with Google" boshing
3. Google account'ni authorize qiling
4. JWT token olasiz
5. Dashboard'da authenticated qilinasiz

### 6.3 Database Ulang Test Qiling

```bash
# Render Shell'da:
npm run db:check-connection
# Expected: "Database connection successful"
```

---

## Qism 7: Monitoring Setup (1 soat)

### 7.1 Sentry'da Error Tracking

1. https://sentry.io ga boring
2. Account yarating
3. "Create Project" → "Node.js"
4. DSN (Data Source Name) oling
5. Render'da `SENTRY_DSN` environment variable qo'shing

### 7.2 Uptime Monitoring

1. https://uptimerobot.com ga boring
2. Account yarating
3. Monitor qo'shing:
   - URL: `https://performa-ai-api.onrender.com/health`
   - Interval: 5 minutes
   - Notification: Email yoki Slack

### 7.3 Logs Ko'ring

Render Dashboard → performa-ai-api → Logs

Quyidagini qidiring:
- "Server started on port 10000"
- "Connected to database"
- "Redis connected"

---

## 📋 Final Checklist

Barcha bu'larni bajaish kerak:

```
SECRETS & KEYS
[ ] JWT_SECRET generated va saqlandi
[ ] JWT_REFRESH_SECRET generated va saqlandi
[ ] ENCRYPTION_KEY generated va saqlandi (32 chars)
[ ] OpenAI API key olingan
[ ] Google keys olingan (3x)
[ ] Meta keys olingan (2x)
[ ] TikTok keys olingan (2x)
[ ] Yandex keys olingan (2x)
[ ] Stability AI key olingan
[ ] HeyGen key olingan

INFRASTRUCTURE
[ ] Render PostgreSQL created va DATABASE_URL olingan
[ ] Render Redis created va REDIS_URL olingan
[ ] Render Web Service yaratilgan
[ ] Vercel Frontend deployed
[ ] Environment variables set qilindi

DEPLOYMENT
[ ] API migrations run qilindi
[ ] Health check working (/health)
[ ] Frontend accessible
[ ] OAuth flow tested
[ ] API endpoints testing qilindi

MONITORING
[ ] Sentry setup qilindi
[ ] Uptime monitoring configured
[ ] Logs accessible
[ ] Error alerts configured
```

---

## 🆘 Masalalar va Hal Qilish

### Masala: "Database connection failed"
**Hal:** 
1. DATABASE_URL to'g'ri nusxalanganini tekshiring (copy-paste errors)
2. Render PostgreSQL running ekanini tekshiring
3. Connection pool settings tekshiring

### Masala: "ENCRYPTION_KEY must be 32 characters"
**Hal:**
```bash
# Exactly 32 chars yaratish
openssl rand -hex 16
# Output 32 chars bo'lishi kerak

# Tekshirish:
echo -n "YOUR_KEY" | wc -c
# 32 chiqishi kerak
```

### Masala: "API request timing out"
**Hal:**
1. Redis ulaning tekshiring
2. Database query logs tekshiring
3. Render CPU/Memory usage ko'ring

### Masala: Frontend build fail "Unicode quote"
**Hal:**
```bash
# Lokal'da:
cd apps/web
npm run build

# Agar error bo'lsa, apps/web/src/app/page.tsx'dagi
# Unicode quotes o'ngalang (double quotes ishlatish kerak)
```

---

## 📞 Emergency Contacts

| Xizmat | Status | URL |
|--------|--------|-----|
| API (Render) | https://render.com/status | https://performa-ai-api.onrender.com |
| Frontend (Vercel) | https://www.vercel-status.com | https://performa-ai.vercel.app |
| Database (Render) | Render Dashboard | - |
| Cache (Redis) | Render Dashboard | - |

---

## ✅ Keyingi Qadamlar

1. **Day 1-2:** Secrets generate qiling, API keys oling
2. **Day 2-3:** Infrastructure setup (Render, Vercel)
3. **Day 3-4:** Deploy qiling, testing
4. **Day 4-5:** Monitoring, documentation
5. **Day 5+:** Production monitoring, issues fixing

---

**Eslab qoling:** 
- Barcha secrets'ni **SAFE** qolib saqlang
- Environment variables'ni **case-sensitive** (JWT_SECRET ≠ jwt_secret)
- Before production: **Load testing** qiling
- Regular **backups** configure qiling

**Omad bo'lishini tilayman! 🚀**
