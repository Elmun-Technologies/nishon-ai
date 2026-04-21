-- Retargeting worker — audience definitions + Meta mapping
CREATE TABLE IF NOT EXISTS retargeting_audiences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  platform VARCHAR(32) NOT NULL DEFAULT 'meta',
  rule JSONB NOT NULL DEFAULT '{}',
  meta_audience_id VARCHAR(64),
  creative_set_key VARCHAR(64),
  budget_share_pct NUMERIC(5, 2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retargeting_audiences_platform
  ON retargeting_audiences (platform);
