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
- npm or yarn

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd nishon-ai
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Start database services:
```bash
docker-compose up -d postgres redis
```

4. Install dependencies:
```bash
npm install
```

5. Start development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001

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

- `npm run dev` - Start development servers
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database

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