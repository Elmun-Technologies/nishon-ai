-- Performa — Complete Database Schema
-- Run this for fresh deployments. For existing production databases,
-- run migrate-meta-workspace-id.sql instead to add missing columns.
--
-- All primary keys are UUIDs (gen_random_uuid()).
-- All timestamp columns default to NOW().
-- All monetary values are DECIMAL (never FLOAT — precision matters for budgets).

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ─── Enum types ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_plan_enum AS ENUM ('free', 'starter', 'growth', 'pro', 'agency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE autopilot_mode_enum AS ENUM ('manual', 'assisted', 'full_auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_objective_enum AS ENUM (
    'traffic', 'leads', 'sales', 'awareness', 'engagement', 'app_installs'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status_enum AS ENUM (
    'draft', 'active', 'paused', 'stopped', 'completed', 'pending_review'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE platform_enum AS ENUM (
    'meta', 'google', 'tiktok', 'youtube', 'telegram', 'snapchat', 'linkedin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_decision_action_enum AS ENUM (
    'pause_ad', 'scale_budget', 'stop_campaign', 'create_ad',
    'shift_budget', 'generate_strategy', 'adjust_targeting', 'rotate_creative'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Core tables ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password          VARCHAR(255) NOT NULL,
  name              VARCHAR(100),
  plan              user_plan_enum NOT NULL DEFAULT 'free',
  is_email_verified BOOLEAN      NOT NULL DEFAULT false,
  refresh_token     TEXT,
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id                     UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID            REFERENCES users(id) ON DELETE CASCADE,
  name                   VARCHAR(255)    NOT NULL,
  industry               VARCHAR(100)    NOT NULL,
  product_description    TEXT,
  target_audience        TEXT,
  monthly_budget         DECIMAL(10, 2),
  goal                   campaign_objective_enum NOT NULL DEFAULT 'leads',
  autopilot_mode         autopilot_mode_enum     NOT NULL DEFAULT 'manual',
  ai_strategy            JSONB,
  is_onboarding_complete BOOLEAN         NOT NULL DEFAULT false,
  target_location        VARCHAR(100)    NOT NULL DEFAULT 'Uzbekistan',
  created_at             TIMESTAMP       NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connected_accounts (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID          NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform              platform_enum NOT NULL,
  access_token          TEXT          NOT NULL,   -- AES-256 encrypted
  refresh_token         TEXT,                     -- AES-256 encrypted
  external_account_id   VARCHAR(255)  NOT NULL,
  external_account_name VARCHAR(255)  NOT NULL,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  token_expires_at      TIMESTAMP,
  created_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID          NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  total_budget    DECIMAL(10, 2) NOT NULL,
  platform_split  JSONB,
  period          VARCHAR(50),
  auto_rebalance  BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id           UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID                   NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(255)           NOT NULL,
  platform     platform_enum          NOT NULL,
  status       campaign_status_enum   NOT NULL DEFAULT 'draft',
  objective    campaign_objective_enum,
  daily_budget DECIMAL(10, 2),
  total_budget DECIMAL(10, 2),
  external_id  VARCHAR(255),
  ai_config    JSONB,
  created_at   TIMESTAMP              NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP              NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_decisions (
  id               UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID                      NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id      UUID                      REFERENCES campaigns(id) ON DELETE CASCADE,
  action_type      ai_decision_action_enum   NOT NULL,
  reason           TEXT                      NOT NULL,
  estimated_impact TEXT,
  before_state     JSONB,
  after_state      JSONB,
  is_approved      BOOLEAN,
  is_executed      BOOLEAN                   NOT NULL DEFAULT false,
  created_at       TIMESTAMP                 NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP                 NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_metrics (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID          NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date        DATE          NOT NULL,
  impressions INTEGER       NOT NULL DEFAULT 0,
  clicks      INTEGER       NOT NULL DEFAULT 0,
  spend       DECIMAL(10, 2) NOT NULL DEFAULT 0,
  conversions INTEGER       NOT NULL DEFAULT 0,
  revenue     DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_sets (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID          NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name             VARCHAR(255)  NOT NULL,
  platform         platform_enum NOT NULL,
  status           VARCHAR(50)   NOT NULL DEFAULT 'draft',
  daily_budget     DECIMAL(10, 2),
  target_audience  JSONB,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id   UUID          NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
  name        VARCHAR(255)  NOT NULL,
  platform    platform_enum NOT NULL,
  status      VARCHAR(50)   NOT NULL DEFAULT 'draft',
  creative    JSONB,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─── Meta Ads sync tables ─────────────────────────────────────────────────────
-- These tables mirror data from the Meta Graph API for analysis and AI decisions.
-- All rows include workspace_id for O(1) tenant isolation — no JOIN required.

CREATE TABLE IF NOT EXISTS meta_ad_accounts (
  id             VARCHAR(50)  PRIMARY KEY,    -- Meta's act_xxx ID
  name           VARCHAR(255) NOT NULL,
  currency       VARCHAR(10),
  timezone       VARCHAR(100),
  account_status INTEGER      NOT NULL DEFAULT 1,
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  workspace_id   UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_campaign_syncs (
  id            VARCHAR(50)  PRIMARY KEY,    -- Meta's campaign ID
  name          VARCHAR(255) NOT NULL,
  status        VARCHAR(50)  NOT NULL,
  objective     VARCHAR(100),
  ad_account_id VARCHAR(50)  NOT NULL REFERENCES meta_ad_accounts(id) ON DELETE CASCADE,
  workspace_id  UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_insights (
  id            VARCHAR(100)    PRIMARY KEY,  -- deterministic: campaignId_YYYY-MM-DD
  spend         DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  impressions   BIGINT          NOT NULL DEFAULT 0,
  clicks        INTEGER         NOT NULL DEFAULT 0,
  ctr           DECIMAL(8, 4)   NOT NULL DEFAULT 0,
  cpc           DECIMAL(10, 4)  NOT NULL DEFAULT 0,
  date          DATE            NOT NULL,
  paging_cursor TEXT,
  campaign_id   VARCHAR(50)     NOT NULL REFERENCES meta_campaign_syncs(id) ON DELETE CASCADE,
  workspace_id  UUID            NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at    TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id
  ON workspaces (user_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id
  ON campaigns (workspace_id);

CREATE INDEX IF NOT EXISTS idx_ai_decisions_workspace_id
  ON ai_decisions (workspace_id);

CREATE INDEX IF NOT EXISTS idx_ai_decisions_campaign_id
  ON ai_decisions (campaign_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_campaign_id
  ON performance_metrics (campaign_id);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_workspace_id
  ON connected_accounts (workspace_id);

CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_id
  ON ad_sets (campaign_id);

CREATE INDEX IF NOT EXISTS idx_ads_ad_set_id
  ON ads (ad_set_id);

-- Meta sync table indexes
CREATE INDEX IF NOT EXISTS "IDX_meta_ad_accounts_workspace"
  ON meta_ad_accounts (workspace_id);

CREATE INDEX IF NOT EXISTS "IDX_meta_campaign_syncs_workspace"
  ON meta_campaign_syncs (workspace_id);

CREATE INDEX IF NOT EXISTS "IDX_meta_insights_workspace"
  ON meta_insights (workspace_id);

CREATE INDEX IF NOT EXISTS "IDX_meta_insights_campaign_workspace"
  ON meta_insights (campaign_id, workspace_id);
