# Performa Multi-Network AdTech Platform Blueprint

## Goal
Build a Madgicx-like platform with:
- multi-network integrations,
- full-funnel automation,
- analytics + attribution,
- AI recommendations.

## Legal/strategy note
Madgicx internal source code or private architecture should **not** be reverse-engineered illegally.  
Use public behavior/docs and implement a clean-room product spec.

## Network scope
- Meta / Facebook
- Google Ads (+ GA4)
- Yandex Direct
- TikTok Ads
- LinkedIn Ads
- Snapchat Ads
- X Ads
- Pinterest Ads
- DV360
- (future) Apple Search Ads, Amazon Ads

## Core modules
1. Auth/RBAC/Organizations
2. Multi-tenant workspaces (agency + client model)
3. Billing/subscriptions/usage metering
4. Connector adapter layer (OAuth, sync, token refresh, retries)
5. ETL/ELT + normalized data model
6. Unified reporting + custom report builder
7. Attribution + tracking (pixel, CAPI, UTM, click IDs, offline conversions)
8. Automation engine (rules, bid/budget changes, scaling logic, alerts)
9. Creative intelligence
10. Audience intelligence
11. AI insights + anomaly detection + forecasting
12. Admin/operations panel

## Suggested architecture
- Frontend: Next.js + TypeScript + Tailwind + TanStack Query + Zustand
- API layer: NestJS (or FastAPI)
- Worker layer: Python (analytics/ML), Node/Go (ingestion-heavy jobs)
- OLTP: PostgreSQL
- Cache: Redis
- Warehouse: ClickHouse or BigQuery
- Queue: BullMQ / RabbitMQ / Kafka (based on scale)
- Object storage: S3/R2/GCS
- Observability: Prometheus + Grafana + Sentry + structured logs

## Data model (minimum entities)
- users, organizations, workspaces, roles, permissions, audit_logs
- integrations, oauth_tokens, connected_accounts, sync_jobs, sync_errors, webhooks
- networks, ad_accounts, campaigns, ad_groups, ads, creatives, audiences, placements
- performance_daily, performance_hourly, conversion_events, attribution_results, ltv_snapshots
- rules, rule_conditions, rule_actions, automation_runs, automation_logs
- insights, anomalies, recommendations, notifications, user_feedback
- plans, subscriptions, invoices, usage_records

## Normalization challenge
Every network uses different naming and metric semantics.  
Recommended approach:
1. raw ingestion tables (source-native payload),
2. normalized canonical schema,
3. semantic metrics layer (harmonized KPIs).

## Phased roadmap
### Phase 1 (MVP, 3–5 months)
- Meta + Google + Yandex connect/sync
- unified dashboard (spend/click/impression/conversion/ROAS)
- basic exports + alerts + simple automation rules

### Phase 2 (advanced optimization)
- rule engine expansion
- budget pacing/scaling
- creative + audience analytics

### Phase 3 (attribution/CRM)
- server-side tracking
- CRM + offline conversion import
- LTV/cohort/funnel analytics

### Phase 4 (AI platform)
- recommendations, anomaly detection, forecasting, AI analyst chat

### Phase 5 (enterprise scale)
- white-label, approvals, advanced RBAC, region/multi-tenant hardening

## Recommended team
### Minimum
- 1 PM
- 1 UI/UX
- 2 FE
- 2 BE
- 1 Data Engineer
- 1 QA
- 1 DevOps

### Scale team
- 1 PM, 1 Architect, 2 FE, 3 BE, 1 Data, 1 ML, 1 QA, 1 DevOps, 1 Integration engineer

