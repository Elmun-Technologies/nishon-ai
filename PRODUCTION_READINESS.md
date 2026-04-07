# Production Readiness Guide

**Loyihani Production'ga Tayyor Qilish Bo'yicha Shurangiz - 2026-04-07**

---

## 📋 Executive Summary

Performa AI loyihasi **QISMAN PRODUCTION-GA TAYYOR**. API back-end asosan tayyor, lekin ba'zi kritik narsalar tuzatish kerak. Frontend build uchun quote handling masalasi bor.

### Status:
- ✅ Backend API: **90% Production-Ready**
- ⚠️ Frontend Web: **70% Ready** (build issue fixes needed)
- ⚠️ Infrastructure: **80% Ready** (Render config prepared)
- ⚠️ Secrets Management: **0%** (keys not configured)

---

## 🔑 KRITIK: API Keys va Credentials Kerakligi

Quyidagi **23 ta** API keys va credentials sizga kerak bo'ladi:

### 1️⃣ **Authentication & Encryption** (3 keys)
```
JWT_SECRET                 - Random 32+ char string, openssl rand -hex 32
JWT_REFRESH_SECRET         - Random 32+ char string, openssl rand -hex 32  
ENCRYPTION_KEY             - Exactly 32 chars for AES-256, openssl rand -hex 16
```
**Qayerda olish:** Javob: lokalni generate qilib olishingiz mumkin

### 2️⃣ **OpenAI Integration** (1 key)
```
OPENAI_API_KEY            - AI copywriting, content generation uchun
```
**Qayerda olish:** https://platform.openai.com/api-keys

### 3️⃣ **Google Services** (3 keys)
```
GOOGLE_CLIENT_ID          - Google Sign-In (authentication)
GOOGLE_CLIENT_SECRET      - Google Sign-In
GOOGLE_DEVELOPER_TOKEN    - Google Ads API bilan integratsiya
```
**Qayerda olish:** https://console.cloud.google.com
**Setup:** OAuth app create qiling va credentials oling

### 4️⃣ **Meta (Facebook/Instagram)** (2 keys)
```
META_APP_ID               - Facebook Ads API
META_APP_SECRET           - Facebook Ads API
```
**Qayerda olish:** https://developers.facebook.com/apps
**Setup:** Marketing app create qiling

### 5️⃣ **TikTok Ads** (2 keys)
```
TIKTOK_APP_ID            - TikTok Ads Marketing API
TIKTOK_APP_SECRET        - TikTok Ads Marketing API
```
**Qayerda olish:** https://ads.tiktok.com/marketing_api/apps

### 6️⃣ **Yandex Direct** (2 keys)
```
YANDEX_CLIENT_ID         - Yandex Direct (CIS market)
YANDEX_CLIENT_SECRET     - Yandex Direct
```
**Qayerda olish:** https://oauth.yandex.ru

### 7️⃣ **Creative Generation APIs** (2 keys)
```
STABILITY_API_KEY        - Image generation (Stable Diffusion)
HEYGEN_API_KEY          - AI video generation with avatars
```
**Qayerda olish:** 
- Stability: https://platform.stability.ai
- HeyGen: https://www.heygen.com/api

### 8️⃣ **CRM Integration** (3 keys - optional but recommended)
```
AMOCRM_CLIENT_ID         - AmoCRM deals/contacts sync
AMOCRM_CLIENT_SECRET     - AmoCRM
AMOCRM_REDIRECT_URI      - https://YOUR_API_URL/integrations/amocrm/callback
```
**Qayerda olish:** https://www.amocrm.ru/developers/

### 9️⃣ **Notifications** (1 key - optional)
```
TELEGRAM_BOT_TOKEN       - Daily performance reports uchun
```
**Qayerda olish:** @BotFather (Telegram)

### 📊 Database & Cache Credentials (2 URLs)
```
DATABASE_URL             - PostgreSQL connection string
                          Format: postgresql://user:password@host:5432/dbname
REDIS_URL               - Redis cache connection
                          Format: redis://user:password@host:6379
```
**Qayerda olish:** 
- Render PostgreSQL service
- Render Redis service
- atau self-hosted

---

## 🚀 Production Deployment Checklist

### PHASE 1: Environment Setup (1-2 days)

#### 1.1 Database Setup
- [ ] PostgreSQL database create qiling (Render yoki self-hosted)
- [ ] Database user va password aniqlang
- [ ] DATABASE_URL oling
- [ ] Backup strategy configure qiling (daily automated backups)
- [ ] Connection pooling setup (min 5, max 20 connections)

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 1.2 Redis Cache Setup
- [ ] Redis instance create qiling
- [ ] REDIS_URL oling
- [ ] Memory limit set qiling (minimum 256MB)
- [ ] Eviction policy configure qiling (allkeys-lru)

#### 1.3 Generate Secrets
```bash
# Terminal'da quyidagini jarayonga qiling:

# JWT Secrets
openssl rand -hex 32  # JWT_SECRET uchun
openssl rand -hex 32  # JWT_REFRESH_SECRET uchun

# Encryption Key (exactly 32 chars)
openssl rand -hex 16  # ENCRYPTION_KEY uchun (32 char output beradi)

# Verify:
echo "ENCRYPTION_KEY=<generated_value>" | wc -c  # 33 bo'lishi kerak (32 + newline)
```

#### 1.4 Collect All API Keys
- [ ] OpenAI API key: `https://platform.openai.com/api-keys`
- [ ] Google: Client ID, Secret, Developer Token
- [ ] Meta: App ID, Secret
- [ ] TikTok: App ID, Secret
- [ ] Yandex: Client ID, Secret
- [ ] Stability AI: API key
- [ ] HeyGen: API key
- [ ] AmoCRM (optional): Credentials
- [ ] Telegram Bot Token (optional): Token

### PHASE 2: Infrastructure Setup (2-3 days)

#### 2.1 Render Deployment Setup
- [ ] Render account create qiling: https://render.com
- [ ] PostgreSQL service create qiling
- [ ] Redis service create qiling
- [ ] Web service (API) create qiling

```yaml
# render.yaml already prepared:
- Service name: performa-ai-api
- Build: pnpm turbo build
- Start: pnpm --filter api start:prod
- Health check: /health
```

#### 2.2 Vercel Frontend Deployment
- [ ] Vercel account: https://vercel.com
- [ ] GitHub repo connect qiling
- [ ] Frontend deploy qiling (apps/web)
- [ ] Environment variables set qiling:
  - `NEXT_PUBLIC_API_BASE_URL=<Your Render API URL>`

#### 2.3 Environment Variables Configuration
**Render Dashboard'da quyidagi secret variables set qiling:**

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/performa_prod

# Redis
REDIS_URL=redis://default:pass@host:6379

# Auth
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
ENCRYPTION_KEY=<generated_32_chars>

# OpenAI
OPENAI_API_KEY=<your_key>
AI_PROVIDER=openai

# Google
GOOGLE_CLIENT_ID=<your_id>
GOOGLE_CLIENT_SECRET=<your_secret>
GOOGLE_DEVELOPER_TOKEN=<your_token>
GOOGLE_CALLBACK_URL=https://<your-render-url>/auth/google/callback

# Meta
META_APP_ID=<your_id>
META_APP_SECRET=<your_secret>
META_CALLBACK_URL=https://<your-render-url>/platforms/meta/callback

# TikTok
TIKTOK_APP_ID=<your_id>
TIKTOK_APP_SECRET=<your_secret>

# Yandex
YANDEX_CLIENT_ID=<your_id>
YANDEX_CLIENT_SECRET=<your_secret>

# Creative APIs
STABILITY_API_KEY=<your_key>
HEYGEN_API_KEY=<your_key>

# Telegram (optional)
TELEGRAM_BOT_TOKEN=<your_token>

# AmoCRM (optional)
AMOCRM_CLIENT_ID=<your_id>
AMOCRM_CLIENT_SECRET=<your_secret>
```

### PHASE 3: Code Fixes Before Deployment (1-2 days)

#### 3.1 Fix Frontend Build Issue
- [ ] Unicode quote handling o'ngalang (apps/web/src/app/page.tsx)
- [ ] Build qiling: `npm run build`
- [ ] Test locally: `npm run dev`

#### 3.2 Run Database Migrations
```bash
# Production DB'ga migrations run qiling:
npm run db:migrate -- --env production

# Seed data (test data) uchun:
npm run db:seed -- --env production  # optional
```

#### 3.3 Security Audit
- [ ] HTTPS/TLS certificates: Render auto-handles
- [ ] CORS configuration check
- [ ] Rate limiting active (120 requests/min)
- [ ] Admin endpoints protected
- [ ] Secrets not in code

#### 3.4 API Testing
```bash
# Health check
curl https://your-api.onrender.com/health

# Marketplace endpoints
curl https://your-api.onrender.com/marketplace/search?query=test

# Authentication flow test
# Login → Get JWT → Test protected endpoint
```

### PHASE 4: Monitoring & Backups (1 day)

#### 4.1 Setup Monitoring
- [ ] Error tracking (Sentry recommended): https://sentry.io
- [ ] Performance monitoring (New Relic or DataDog)
- [ ] Logs aggregation (Render logs auto-collected)
- [ ] Uptime monitoring (UptimeRobot or similar)

#### 4.2 Setup Alerts
- [ ] API down: Telegram notification
- [ ] High error rate: Email alert
- [ ] Database connection lost: Slack alert
- [ ] Rate limit exceeded: Log alert

#### 4.3 Backup Strategy
```
Database: Daily automated backups (Render provides)
Redis: Non-persistent (re-cache on reboot)
Code: GitHub (main branch)
Secrets: Render dashboard (encrypted)
```

#### 4.4 Disaster Recovery Plan
- [ ] Database restore procedure
- [ ] API rollback procedure
- [ ] SLA definition (99.9% uptime target)
- [ ] On-call rotation (if team > 1)

---

## 📊 Current Project Health

### ✅ Strong Points
1. **Modular Architecture**: Turbo monorepo, clean separation
2. **Database Design**: TypeORM, proper schema
3. **API Security**: JWT + encryption implemented
4. **OAuth Integrations**: Google, Meta, TikTok, Yandex prepared
5. **Docker Setup**: Development & production configs ready
6. **Marketplace Feature**: Mostly implemented

### ⚠️ Areas Needing Attention

#### Critical (Must fix before production)
1. **Frontend Build**: Unicode quote handling in page.tsx
2. **Merge Conflicts**: render.yaml had conflicts (FIXED)
3. **Secrets Management**: No secrets configured yet
4. **Database**: No production instance
5. **Monitoring**: No error tracking/alerting

#### Important (Before going live)
1. **Testing**: Only 20% test coverage
2. **Documentation**: API docs need update
3. **Performance**: No load testing done
4. **Email**: No email service configured
5. **AmoCRM**: Integration not fully tested

#### Nice-to-have (Can do after launch)
1. **Advanced Caching**: Cache busting strategy
2. **CDN**: Image/asset optimization
3. **Analytics**: User behavior tracking
4. **A/B Testing**: Feature flags
5. **Admin Dashboard**: Monitoring interface

---

## 💰 Estimated Costs (Monthly)

```
Render Web Service (API):     $7 - $25
Render PostgreSQL:            $15 - $60
Render Redis:                 $5 - $15
Vercel (Frontend):            $0 - $20 (free tier available)
External APIs:
  - OpenAI:                   $5 - $50+ (usage-based)
  - Google Ads:               Free (commission-based)
  - Meta/TikTok/Yandex:       Free (commission-based)
  - Stability AI:             $10+ (usage-based)
  - HeyGen:                   $25+ (subscription)
Monitoring (Sentry):          $0 - $29
Domain (SSL):                 $0 (Let's Encrypt)
                              ─────────────
TOTAL:                        ~$70-$200/month
```

---

## 🎯 Sizga Qilish Kerak Bo'lgan Ishlar

### Week 1 (Priority 1 - Critical)
1. **Secrets Generate Qiling**
   - `openssl rand -hex 32` → JWT_SECRET
   - `openssl rand -hex 32` → JWT_REFRESH_SECRET
   - `openssl rand -hex 16` → ENCRYPTION_KEY (32 chars)

2. **API Keys Collect Qiling**
   - OpenAI, Google, Meta, TikTok, Yandex dan keys oling
   - Stability AI, HeyGen uchun register qiling

3. **Database Setup**
   - PostgreSQL yarating (Render recommended)
   - REDIS yarating

4. **Frontend Build Fix**
   - Unicode quotes o'ngalang
   - `npm run build` test qiling

### Week 2 (Priority 2 - Important)
5. **Render Setup**
   - Account create, PostgreSQL/Redis services
   - render.yaml uchun environment variables set qiling

6. **Vercel Setup**
   - Frontend deploy qiling
   - API_BASE_URL configure qiling

7. **Database Migrations**
   - Production DB'ga migrations run qiling
   - Test data seed qiling

8. **Testing**
   - API endpoints test qiling
   - OAuth flows test qiling
   - Database connections verify qiling

### Week 3 (Priority 3 - Optional)
9. **Monitoring Setup**
   - Sentry/error tracking
   - Uptime monitoring
   - Alert configuration

10. **Documentation**
    - API documentation update
    - Deployment runbook create
    - Team training

---

## 📱 Quick Command Reference

```bash
# Development
npm run dev              # Start all services locally
npm run build           # Build all packages
npm run test            # Run tests

# Production Deployment
npm run build           # Build for production
npm run start:prod      # Start API in production mode
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed test data

# Health Checks
curl http://localhost:3001/health    # Local API
curl https://your-api.onrender.com/health  # Production

# View Logs
# Render Dashboard → performa-ai-api → Logs
# or: git push → GitHub Actions → Render auto-deploys
```

---

## 📞 Support & Resources

| Task | Resource |
|------|----------|
| Render Deployment | https://render.com/docs |
| Vercel Deployment | https://vercel.com/docs |
| PostgreSQL Setup | https://www.postgresql.org/docs/ |
| Redis Setup | https://redis.io/docs/ |
| OpenAI API | https://platform.openai.com/docs |
| Google OAuth | https://developers.google.com/identity |
| Meta Marketing API | https://developers.facebook.com/docs/marketing-apis |
| Sentry Monitoring | https://docs.sentry.io |

---

## ✅ Pre-Launch Checklist

- [ ] All 23 API keys collected and verified
- [ ] Database created and tested
- [ ] Redis cache configured
- [ ] Environment variables set in Render
- [ ] Frontend build passes without errors
- [ ] API tests pass (at least health check)
- [ ] OAuth flow tested with real accounts
- [ ] Database migrations completed
- [ ] Monitoring/alerting configured
- [ ] Domain SSL certificate ready
- [ ] Backup strategy documented
- [ ] Disaster recovery plan tested
- [ ] Team trained on deployment process
- [ ] SLA/uptime targets defined

---

**Last Updated:** 2026-04-07  
**Next Review:** After first deployment  
**Maintained By:** Development Team
