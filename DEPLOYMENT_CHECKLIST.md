# STEP 5: Deployment Checklist

Track your progress through infrastructure deployment.

## Phase 1: Generate Secrets ⬜

- [ ] Generate JWT_SECRET (openssl rand -hex 32)
- [ ] Generate JWT_REFRESH_SECRET (openssl rand -hex 32)
- [ ] Generate ENCRYPTION_KEY (openssl rand -hex 16)
- [ ] Save all three in secure location (password manager, 1Password, etc.)

## Phase 2: Render Infrastructure ⬜

### PostgreSQL Database
- [ ] Create PostgreSQL on Render.com
- [ ] Wait for creation (~2-3 min)
- [ ] Copy DATABASE_URL connection string
- [ ] Test connection locally (optional): `psql [DATABASE_URL]`

### Redis Instance
- [ ] Create Redis on Render.com
- [ ] Wait for creation (~1-2 min)
- [ ] Copy REDIS_URL connection string

## Phase 3: Deploy API to Render ⬜

### Create Service
- [ ] Create Web Service on Render
- [ ] Connect GitHub repo (Elmun-Technologies/nishon-ai)
- [ ] Set branch: `claude/add-creative-section-2MHjz`
- [ ] Set build: `npm run build`
- [ ] Set start: `npm run start:api`

### Environment Variables
- [ ] NODE_ENV = production
- [ ] PORT = 3001
- [ ] API_BASE_URL = https://performa-ai-api.onrender.com
- [ ] FRONTEND_URL = https://performa-ai.vercel.app
- [ ] JWT_SECRET (from Phase 1)
- [ ] JWT_REFRESH_SECRET (from Phase 1)
- [ ] ENCRYPTION_KEY (from Phase 1)
- [ ] DATABASE_URL (from PostgreSQL)
- [ ] REDIS_URL (from Redis)
- [ ] AI_PROVIDER = openai
- [ ] OPENAI_API_KEY (get from OpenAI)
- [ ] META_APP_ID (get from Meta)
- [ ] META_APP_SECRET (get from Meta)
- [ ] GOOGLE_CLIENT_ID (get from Google Cloud)
- [ ] GOOGLE_CLIENT_SECRET (get from Google Cloud)
- [ ] GOOGLE_DEVELOPER_TOKEN (get from Google Ads)
- [ ] TIKTOK_APP_ID (get from TikTok)
- [ ] TIKTOK_APP_SECRET (get from TikTok)
- [ ] YANDEX_CLIENT_ID (get from Yandex)
- [ ] YANDEX_CLIENT_SECRET (get from Yandex)

### Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build (~5-10 min)
- [ ] Verify deployment successful
- [ ] Copy API URL from Render

## Phase 4: Deploy Frontend to Vercel ⬜

### Create Project
- [ ] Go to Vercel.com and sign in
- [ ] Create new project from git
- [ ] Select Elmun-Technologies/nishon-ai
- [ ] Set root directory: apps/web

### Environment Variables
- [ ] NEXT_PUBLIC_API_BASE_URL = https://performa-ai-api.onrender.com

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for build (~3-5 min)
- [ ] Verify deployment successful
- [ ] Copy Frontend URL from Vercel

## Phase 5: Post-Deployment Verification ⬜

### Database Migrations
- [ ] Access Render API service shell
- [ ] Run: `npm run typeorm migration:run`
- [ ] Verify no migration errors

### API Health
- [ ] Test: `curl https://performa-ai-api.onrender.com/health`
- [ ] Verify returns 200 with health status
- [ ] Check Swagger: https://performa-ai-api.onrender.com/api

### Frontend Health
- [ ] Visit frontend URL in browser
- [ ] Verify page loads without errors
- [ ] Check DevTools → Network for failed requests
- [ ] Try signing in (should show error if backend issue)

### Rate Limiting
- [ ] Make 150+ requests in 60 seconds
- [ ] Verify 429 responses after ~120 requests
- [ ] Check X-RateLimit headers in responses

## Production Verification ✅

- [ ] API health endpoint responds
- [ ] Frontend loads without console errors
- [ ] Rate limiting works (429 after 120 requests)
- [ ] Database migrations completed
- [ ] All required API keys configured

---

## Help & Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Render logs → add missing env vars |
| DB connection fails | Verify DATABASE_URL, check Render DB status |
| API unreachable | Check Render service logs, verify PORT=3001 |
| Frontend can't reach API | Verify NEXT_PUBLIC_API_BASE_URL, check CORS |
| Rate limiting not working | Verify REDIS_URL, check Redis running |

---

## Environment Variables Summary

**Required (12):**
- NODE_ENV, PORT, API_BASE_URL, FRONTEND_URL
- JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
- DATABASE_URL, REDIS_URL
- OPENAI_API_KEY, META_APP_ID, GOOGLE_CLIENT_ID

**Platform-Specific (8):**
- META_APP_SECRET, GOOGLE_CLIENT_SECRET, GOOGLE_DEVELOPER_TOKEN
- TIKTOK_APP_ID, TIKTOK_APP_SECRET
- YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET

**Optional (7):**
- TELEGRAM_BOT_TOKEN, STABILITY_API_KEY, HEYGEN_API_KEY
- AMOCRM_CLIENT_ID, AMOCRM_CLIENT_SECRET, AMOCRM_REDIRECT_URI

---

Last Updated: 2026-04-07  
Status: Ready for deployment

