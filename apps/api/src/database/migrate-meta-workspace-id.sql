-- Migration: Add workspace_id to Meta sync tables + create tables if missing
-- Run this ONCE against the production database before deploying the new backend.
--
-- Safe to run multiple times — all statements use IF NOT EXISTS / IF EXISTS guards.
--
-- Tables covered:
--   meta_ad_accounts       (create or add workspace_id)
--   meta_campaign_syncs    (create or add workspace_id)
--   meta_insights          (create or add workspace_id)
--   connected_accounts     (ensure schema is current — uuid PK, platform enum)
--
-- IMPORTANT: workspaces.id is a UUID column, NOT an integer SERIAL.
-- All workspace_id FK columns must be type UUID.

-- ─── 1. meta_ad_accounts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meta_ad_accounts (
  id              VARCHAR(50)  PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  currency        VARCHAR(10),
  timezone        VARCHAR(100),
  account_status  INTEGER      NOT NULL DEFAULT 1,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Add workspace_id if the table existed before this migration
ALTER TABLE meta_ad_accounts
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "IDX_meta_ad_accounts_workspace"
  ON meta_ad_accounts (workspace_id);

-- ─── 2. meta_campaign_syncs ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meta_campaign_syncs (
  id              VARCHAR(50)  PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  status          VARCHAR(50)  NOT NULL,
  objective       VARCHAR(100),
  ad_account_id   VARCHAR(50)  NOT NULL REFERENCES meta_ad_accounts(id) ON DELETE CASCADE,
  workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Add workspace_id if the table existed before this migration
ALTER TABLE meta_campaign_syncs
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "IDX_meta_campaign_syncs_workspace"
  ON meta_campaign_syncs (workspace_id);

-- ─── 3. meta_insights ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meta_insights (
  id              VARCHAR(100) PRIMARY KEY,
  spend           DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  impressions     BIGINT          NOT NULL DEFAULT 0,
  clicks          INTEGER         NOT NULL DEFAULT 0,
  ctr             DECIMAL(8, 4)   NOT NULL DEFAULT 0,
  cpc             DECIMAL(10, 4)  NOT NULL DEFAULT 0,
  date            DATE            NOT NULL,
  paging_cursor   TEXT,
  campaign_id     VARCHAR(50)     NOT NULL REFERENCES meta_campaign_syncs(id) ON DELETE CASCADE,
  workspace_id    UUID            NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Add workspace_id if the table existed before this migration
ALTER TABLE meta_insights
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "IDX_meta_insights_workspace"
  ON meta_insights (workspace_id);

CREATE INDEX IF NOT EXISTS "IDX_meta_insights_campaign_workspace"
  ON meta_insights (campaign_id, workspace_id);

-- ─── 4. connected_accounts ───────────────────────────────────────────────────
-- Ensure the table uses UUID PK and has the correct platform enum.
-- If you previously ran create-schema.sql (SERIAL PK), recreate this table.
-- SKIP this block if connected_accounts already has UUID PKs in production.

-- Safe guard: only create if it doesn't exist yet (uuid-based version)
CREATE TABLE IF NOT EXISTS connected_accounts_new_check (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
DROP TABLE connected_accounts_new_check;

-- Ensure platform enum type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_enum') THEN
    CREATE TYPE platform_enum AS ENUM ('META', 'GOOGLE', 'TIKTOK');
  END IF;
END
$$;

-- Add missing columns to connected_accounts if they don't exist
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS access_token     TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS external_account_id   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS external_account_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Verify the columns exist:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'meta_campaign_syncs' AND column_name = 'workspace_id';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'meta_insights' AND column_name = 'workspace_id';
