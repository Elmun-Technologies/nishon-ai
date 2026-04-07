# STEP 5: Infrastructure Deployment Guide

This guide walks through deploying the Nishon AI platform to production using Render (API) and Vercel (Frontend).

---

## Phase 1: Generate Required Secrets

Run these commands to generate secure keys:

```bash
# JWT Secret (64 hex chars)
openssl rand -hex 32

# JWT Refresh Secret (64 hex chars)
openssl rand -hex 32

# Encryption Key for tokens (32 hex chars - EXACTLY 32 for AES-256)
openssl rand -hex 16
```

Save these values securely. You'll need them in the next phases.

---

## Phase 2: Set Up Render Infrastructure

### Step 2.1: Create PostgreSQL Database

1. Go to https://render.com and sign in
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name:** `performa-ai-db`
   - **Database:** `performa_ai_db`
   - **User:** `performa_user`
   - **Region:** (choose closest to your users)
   - **Plan:** Standard (minimum for production)
4. Click "Create Database"
5. Wait for creation (~2-3 minutes)
6. Copy the connection string that appears in the "Connections" section
   - Format: `postgresql://performa_user:PASSWORD@host:5432/performa_ai_db`

### Step 2.2: Create Redis Instance

1. Go to https://render.com
2. Click "New +" → "Redis"
3. Configure:
   - **Name:** `performa-ai-redis`
   - **Region:** (same as database)
   - **Plan:** Standard (minimum for production)
4. Click "Create Redis"
5. Wait for creation (~1-2 minutes)
6. Copy the connection string from "Connections"
   - Format: `redis://:PASSWORD@host:6379`

---

## Phase 3: Deploy API to Render

### Step 3.1: Create Web Service

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository:
   - Click "Connect repository"
   - Select `Elmun-Technologies/nishon-ai`
   - Click "Connect"
4. Configure service:
   - **Name:** `performa-ai-api`
   - **Region:** (same as database and Redis)
   - **Branch:** `claude/add-creative-section-2MHjz`
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start:api`

### Step 3.2: Set Environment Variables

In the Render dashboard for this service, go to "Environment" and add:

#### Required Variables
```
NODE_ENV=production
PORT=3001
API_BASE_URL=https://performa-ai-api.onrender.com
FRONTEND_URL=https://performa-ai.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://performa-ai-api.onrender.com

# From Phase 1 - use the generated values
JWT_SECRET=[YOUR_GENERATED_JWT_SECRET]
JWT_REFRESH_SECRET=[YOUR_GENERATED_JWT_REFRESH_SECRET]
ENCRYPTION_KEY=[YOUR_GENERATED_ENCRYPTION_KEY]

JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database - from Step 2.1
DATABASE_URL=[POSTGRESQL_CONNECTION_STRING_FROM_STEP_2.1]

# Redis - from Step 2.2
REDIS_URL=[REDIS_CONNECTION_STRING_FROM_STEP_2.2]

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=120
```

#### AI Provider Variables (Choose One)
```
# Option A: OpenAI (Recommended for production)
AI_PROVIDER=openai
OPENAI_API_KEY=[GET_FROM_https://platform.openai.com/api-keys]

# Option B: Anthropic Claude
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=[GET_FROM_https://console.anthropic.com/settings/keys]
```

#### Platform Integration Variables (Required)
```
# Meta (Facebook/Instagram Ads)
# Get from: https://developers.facebook.com/apps
META_APP_ID=[YOUR_META_APP_ID]
META_APP_SECRET=[YOUR_META_APP_SECRET]
META_CALLBACK_URL=https://performa-ai-api.onrender.com/platforms/meta/callback

# Google Ads
# OAuth: https://console.cloud.google.com (enable Google Ads API)
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]
GOOGLE_CALLBACK_URL=https://performa-ai-api.onrender.com/auth/google/callback
GOOGLE_DEVELOPER_TOKEN=[GET_FROM_https://ads.google.com/home/tools/manager-accounts]

# TikTok Ads
# Create app at: https://ads.tiktok.com/marketing_api/apps
TIKTOK_APP_ID=[YOUR_TIKTOK_APP_ID]
TIKTOK_APP_SECRET=[YOUR_TIKTOK_APP_SECRET]

# Yandex Direct
# Create app at: https://oauth.yandex.ru
YANDEX_CLIENT_ID=[YOUR_YANDEX_CLIENT_ID]
YANDEX_CLIENT_SECRET=[YOUR_YANDEX_CLIENT_SECRET]
```

#### Optional Variables
```
# Telegram Notifications
# Create bot at: https://t.me/BotFather
TELEGRAM_BOT_TOKEN=[OPTIONAL]

# Creative Generation
STABILITY_API_KEY=[OPTIONAL_GET_FROM_https://platform.stability.ai]
HEYGEN_API_KEY=[OPTIONAL_GET_FROM_https://www.heygen.com/api]

# AmoCRM Integration
AMOCRM_CLIENT_ID=[OPTIONAL]
AMOCRM_CLIENT_SECRET=[OPTIONAL]
AMOCRM_REDIRECT_URI=https://performa-ai-api.onrender.com/integrations/amocrm/callback
```

### Step 3.3: Deploy

1. Click "Create Web Service"
2. Wait for build and deployment (~5-10 minutes)
3. Once deployed, note the API URL: `https://performa-ai-api.onrender.com`
4. Test health endpoint: `curl https://performa-ai-api.onrender.com/health`

---

## Phase 4: Deploy Frontend to Vercel

### Step 4.1: Connect to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Select `Elmun-Technologies/nishon-ai`
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Step 4.2: Set Environment Variables

In Vercel Project Settings → "Environment Variables", add:

```
NEXT_PUBLIC_API_BASE_URL=https://performa-ai-api.onrender.com
```

### Step 4.3: Deploy

1. Click "Deploy"
2. Wait for build completion (~3-5 minutes)
3. Once deployed, note the Frontend URL: `https://nishon-ai.vercel.app`
4. Test by visiting the URL

---

## Phase 5: Post-Deployment Verification

### Step 5.1: Run Database Migrations

SSH into the Render API service:

```bash
# Via Render shell
npm run typeorm migration:run -- --dataSource dist/database.config.js
```

Or use the Render "Shell" tab to run migrations.

### Step 5.2: Verify API Health

```bash
# Should return 200 with health status
curl https://performa-ai-api.onrender.com/health

# Check OpenAPI/Swagger
curl https://performa-ai-api.onrender.com/api
```

### Step 5.3: Verify Frontend

1. Visit https://nishon-ai.vercel.app
2. Try signing in
3. Navigate to dashboard
4. Check browser console for any API errors

### Step 5.4: Test Rate Limiting

Make rapid requests to verify rate limiting works:

```bash
for i in {1..150}; do
  curl -i https://performa-ai-api.onrender.com/health 2>&1 | grep -E "429|X-RateLimit"
done
```

Should see 429 status after ~120 requests (in 60 second window).

---

## Summary of Required API Keys

| Service | Count | Required | How to Get |
|---------|-------|----------|-----------|
| OpenAI | 1 | ✓ | https://platform.openai.com/api-keys |
| Meta | 2 | ✓ | https://developers.facebook.com/apps |
| Google | 3 | ✓ | https://console.cloud.google.com |
| TikTok | 2 | ✓ | https://ads.tiktok.com/marketing_api/apps |
| Yandex | 2 | ✓ | https://oauth.yandex.ru |
| Telegram | 1 | ✗ | https://t.me/BotFather |
| Stability AI | 1 | ✗ | https://platform.stability.ai |
| HeyGen | 1 | ✗ | https://www.heygen.com/api |
| AmoCRM | 2 | ✗ | https://www.amocrm.ru/developers/ |

**Total Required:** 12 keys  
**Total Optional:** 7 keys

---

## Troubleshooting

### Build Fails on Render
- Check "Logs" tab for specific error
- Most common: Missing environment variables
- Solution: Add missing vars and manually trigger rebuild

### API Can't Connect to Database
- Verify DATABASE_URL is correct (copy-paste from Render dashboard)
- Check if database is still running (Render dashboard)
- Try connecting via psql locally first to verify connection string

### Frontend Can't Reach API
- Verify NEXT_PUBLIC_API_BASE_URL matches API URL
- Check browser DevTools → Network tab for failed requests
- Ensure CORS is configured (should be automatic)

### Rate Limiting Not Working
- Check REDIS_URL is set correctly
- Verify Redis instance is running
- Check logs for "Rate limiting: Connected to Redis"

---

## Next Steps (After Deployment)

Once verified:
1. Run E2E tests against production
2. Monitor logs for errors
3. Setup Sentry for error tracking
4. Configure UptimeRobot for health monitoring
5. Complete marketplace service implementations

