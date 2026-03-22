# Nishon AI

An autonomous AI-powered advertising platform that manages digital ad campaigns better than a human media buyer (targetolog). Built for SMB businesses in the CIS/Central Asia market, with global expansion plans.

## Project Description

Nishon AI is an AI agent that autonomously manages digital advertising campaigns across multiple platforms (Meta, Google, TikTok, YouTube, Telegram). The platform uses advanced AI to:

- Generate data-driven advertising strategies
- Optimize campaign performance in real-time
- Automate budget allocation and bidding
- Provide competitor analysis and market insights
- Create compelling ad creatives and copy

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- [pnpm](https://pnpm.io/) (recommended package manager)

## Quick Start (local development)

1. Clone the repository:
```bash
git clone <repository-url>
cd nishon-ai
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Start database services (Postgres + Redis):
```bash
docker compose up -d postgres redis
```

4. Install dependencies with pnpm:
```bash
pnpm install
```

5. Start all apps in dev mode (API + Web):
```bash
pnpm dev
```

By default, the applications will be available at values from environment variables:
- **Frontend (Next.js)**: `FRONTEND_URL`
- **API (NestJS)**: `API_BASE_URL`

## Project Structure

```
nishon-ai/
├── apps/
│   ├── api/           # NestJS backend API
│   └── web/           # Next.js frontend
├── packages/
│   ├── shared/        # Shared DTOs, types, enums
│   └── ai-sdk/        # OpenAI wrapper and prompts
├── infrastructure/    # Docker configurations
└── ...
```

## Available Scripts

Root package (`nishon-ai/`) ichidan:

- `pnpm dev` - Turbo orqali barcha ilovalarni dev rejimida ishga tushirish
- `pnpm build` - Barcha paketlar uchun production build
- `pnpm test` - Testlarni ishga tushirish
- `pnpm lint` - Kodni lint qilish
- `pnpm db:migrate` - API uchun ma’lumotlar bazasi migratsiyalari
- `pnpm db:seed` - Demo/initial ma’lumotlar bilan bazani to‘ldirish

## Module Overview

| Module | Description | Status |
|--------|-------------|--------|
| Auth | JWT authentication with refresh tokens | ✅ Complete |
| Users | User management and profiles | ✅ Complete |
| Workspaces | Business workspace management | ✅ Complete |
| Campaigns | Campaign lifecycle management | ✅ Complete |
| Ad Sets | Ad set and targeting management | ✅ Complete |
| Ads | Ad creative and content management | ✅ Complete |
| Platforms | Multi-platform connectors | 🚧 In Progress |
| AI Agent | Autonomous campaign management | 🚧 In Progress |
| Budget | Budget optimization and allocation | 🚧 In Progress |
| Analytics | Performance metrics and reporting | 🚧 In Progress |
| Queue | Background job processing | 🚧 In Progress |

## License

MIT
