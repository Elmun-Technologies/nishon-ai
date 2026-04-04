# Vercel (Frontend) + Render (Backend) deployment guide

## Architecture
- Frontend: **Vercel** (`apps/web`)
- Backend API: **Render** (`apps/api`)

## 1) Render (API) required env vars
- `API_BASE_URL=https://<your-render-service>.onrender.com`
- `FRONTEND_URL=https://<your-vercel-domain>,*.vercel.app`
- `DATABASE_URL=...`
- `REDIS_URL=...`
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- OAuth/API secrets (Meta/Google/TikTok/Yandex etc.)

`FRONTEND_URL` supports:
- exact domain (production)
- wildcard style `*.vercel.app` (preview deployments)

## 2) Vercel (Web) required env vars
- `NEXT_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com`

Fallback behavior in code:
- In production, if `NEXT_PUBLIC_API_BASE_URL` is missing, frontend defaults to:
  - `https://performa-ai-api.onrender.com`

## 3) CORS behavior
Backend now supports:
- exact origins from `FRONTEND_URL`
- wildcard origins via `*.domain.com` pattern
- preview Vercel domains when wildcard is configured

## 4) Common issue checklist
If login/API calls fail:
1. Confirm Render API is healthy (`/health`)
2. Confirm Vercel has `NEXT_PUBLIC_API_BASE_URL`
3. Confirm Render `FRONTEND_URL` includes your Vercel production + preview domain pattern
4. Confirm OAuth callback URLs use Render API domain
