# MADGICX-LIKE MULTI AD NETWORK PLATFORM — Technical Spec v1.0

> This document is a clean-room blueprint for building a Madgicx-like platform (Meta + Google + Yandex + more), not a source-code copy.

## 1) Product goal
Unified platform to:
- connect multi-network ad accounts,
- normalize data and expose reporting,
- automate optimization actions,
- run attribution and business KPIs,
- provide AI recommendations/forecasting.

## 2) Supported ad networks
- Meta Ads
- Google Ads
- GA4
- Yandex Direct
- TikTok Ads
- LinkedIn Ads
- Snapchat Ads
- Pinterest Ads
- X Ads
- DV360
- Apple Search Ads (later)
- Amazon Ads (later)

## 3) Core value pillars
1. Data aggregation
2. Optimization automation
3. Intelligence (attribution + AI)

## 4) Functional modules
- Auth & IAM (RBAC, 2FA, SSO)
- Multi-tenant workspace/agency layer
- Integrations hub (OAuth, token refresh, hierarchy + insights sync)
- Unified domain model + canonical metrics layer
- Reporting and report builder
- Campaign action center (pause/resume/budget/bid)
- Rule engine + anomaly alerts
- Creative intelligence
- Audience intelligence
- Attribution/tracking
- Ecommerce/CRM revenue sync
- AI assistant (NL → analytics)
- Admin/ops panel

## 5) Unified hierarchy
```text
Network -> Account -> Campaign -> AdGroup/AdSet -> Ad -> Creative
```

With channel-specific extensions:
- search keywords/terms
- shopping/product groups
- asset groups
- placements detail

## 6) Canonical metrics
- spend, impressions, clicks, CTR, CPC, CPM
- conversions, revenue, CPA, ROAS
- reach, frequency, video_views
- add_to_cart, checkout, purchases
- leads, qualified_leads
- gross_profit, net_profit

## 7) High-level architecture
```text
Web/Admin -> API Gateway -> Domain services
                          -> Integration Service
                          -> Queue/Scheduler
                          -> Connector Workers
                          -> PostgreSQL + ClickHouse + Object Storage
                          -> AI/Attribution/Notifications
```

## 8) Recommended stack
- Frontend: Next.js + TS + Tailwind + TanStack Query + Zustand
- Backend API: NestJS
- Data/AI services: FastAPI (optional Go for heavy workers)
- OLTP: PostgreSQL
- Cache/Queue: Redis + BullMQ/RabbitMQ/Kafka
- Warehouse: ClickHouse
- Storage: S3/R2/GCS
- Observability: Prometheus/Grafana/Loki/Sentry

## 9) Service map
- Auth Service
- Org Service
- Integration Service
- Sync Service
- Reporting Service
- Automation Service
- Attribution Service
- Notification Service
- AI Service
- Billing Service

## 10) Data ingestion flow
1. OAuth connect
2. token encrypted storage
3. discovery job
4. hierarchy + insights fetch
5. raw payload archive
6. normalization
7. dimension upsert (PostgreSQL)
8. fact load (ClickHouse)
9. aggregates/materialized views

## 11) Key DB entity groups
- Identity/org: users, organizations, workspaces, memberships, roles, audit_logs
- Integrations: integrations, oauth_tokens, connected_accounts, sync_jobs, sync_states, webhooks
- Ads domain: ad_accounts, campaigns, ad_groups, ads, creatives, audiences
- Analytics: performance facts, events, attribution_results, ltv snapshots
- Automation: rules, conditions, actions, runs, action_logs
- Alerts: alerts, channels, deliveries
- Billing: plans, subscriptions, invoices, usage

## 12) Core API groups
- Integrations: connect/refresh/accounts
- Entities: campaigns/adgroups/ads/creatives/audiences
- Reports: query/saved/export
- Automation: rules CRUD, test-run, logs
- Actions: pause/resume/budget/bid updates
- Attribution: event collect, CRM import, order import, attribution report
- AI: query, recommendations, anomalies

## 13) Roadmap
### Phase 1 (MVP, 10–16 weeks)
- Meta + Google + Yandex
- dashboard + core reports
- basic alerts + simple rules

### Phase 2
- additional networks
- advanced report builder
- creative/audience analytics
- anomaly detection

### Phase 3
- first-party tracking + CRM/offline conversions
- LTV/cohort/profit dashboards

### Phase 4
- AI recommendations, forecasting, NL analytics assistant

### Phase 5
- enterprise scale: white-label, SSO/SAML, advanced compliance

## 14) Biggest risks
- multi-network normalization complexity
- attribution truth conflicts (network vs CRM)
- rate limits + token lifecycle
- automation safety/rollback
- warehouse performance/cost trade-offs

## 15) Practical start order
1. metric dictionary + schema contract
2. auth/org/workspace
3. integration adapter framework
4. Meta connector
5. Google connector
6. Yandex connector
7. normalization + warehouse
8. dashboard/reporting
9. basic rules + alerts
10. attribution + AI
