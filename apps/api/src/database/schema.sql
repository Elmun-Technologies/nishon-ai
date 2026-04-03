-- Performa Campaign Wizard Database Schema
-- Production-ready schema with proper relationships and constraints

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_workspaces_owner (owner_id)
);

-- Workspace members
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, user_id),
    INDEX idx_workspace_members_workspace (workspace_id),
    INDEX idx_workspace_members_user (user_id)
);

-- Connected accounts (OAuth tokens)
CREATE TABLE connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- meta, google, yandex, telegram
    account_id VARCHAR(255) NOT NULL, -- Platform-specific account ID
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    account_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id, platform),
    INDEX idx_connected_accounts_workspace (workspace_id),
    INDEX idx_connected_accounts_platform (platform)
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(50) NOT NULL, -- leads, traffic, sales, awareness
    budget DECIMAL(10,2) NOT NULL,
    budget_type VARCHAR(20) DEFAULT 'daily', -- daily, weekly
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE,
    always_on BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed, deleted
    autopilot_mode VARCHAR(20) DEFAULT 'manual', -- manual, ai_optimized
    bidding_strategy VARCHAR(50) DEFAULT 'maximize_clicks',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT campaigns_budget_positive CHECK (budget > 0),
    CONSTRAINT campaigns_valid_objective CHECK (objective IN ('leads', 'traffic', 'sales', 'awareness')),
    CONSTRAINT campaigns_valid_budget_type CHECK (budget_type IN ('daily', 'weekly')),
    CONSTRAINT campaigns_valid_status CHECK (status IN ('draft', 'active', 'paused', 'completed', 'deleted')),
    
    INDEX idx_campaigns_workspace (workspace_id),
    INDEX idx_campaigns_status (status),
    INDEX idx_campaigns_objective (objective),
    INDEX idx_campaigns_dates (start_date, end_date)
);

-- Campaign platforms (many-to-many)
CREATE TABLE campaign_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_campaign_id VARCHAR(255), -- Platform-specific campaign ID
    platform_status VARCHAR(50), -- active, paused, deleted, error
    sync_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(campaign_id, platform),
    INDEX idx_campaign_platforms_campaign (campaign_id),
    INDEX idx_campaign_platforms_platform (platform)
);

-- UTM Parameters
CREATE TABLE campaign_utms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    landing_page_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_campaign_utms_campaign (campaign_id)
);

-- Ad Groups table
CREATE TABLE ad_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scenario VARCHAR(50) DEFAULT 'all', -- all, new
    status VARCHAR(20) DEFAULT 'active',
    bid_adjustments JSONB DEFAULT '{}', -- {device: 1.2, audience: 0.8, format: 1.0}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT ad_groups_valid_scenario CHECK (scenario IN ('all', 'new')),
    CONSTRAINT ad_groups_valid_status CHECK (status IN ('active', 'paused', 'deleted')),
    
    INDEX idx_ad_groups_campaign (campaign_id),
    INDEX idx_ad_groups_status (status)
);

-- Geo Targeting
CREATE TABLE geo_targeting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    mode VARCHAR(20) DEFAULT 'list', -- list, map
    locations JSONB DEFAULT '[]', -- Array of location IDs/names
    radius_meters INTEGER, -- For map mode
    city VARCHAR(255), -- For map mode
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT geo_targeting_valid_mode CHECK (mode IN ('list', 'map')),
    
    INDEX idx_geo_targeting_ad_group (ad_group_id)
);

-- Keywords
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    phrase VARCHAR(500) NOT NULL,
    match_type VARCHAR(20) DEFAULT 'broad', -- broad, phrase, exact
    bid DECIMAL(8,4), -- Platform-specific bid
    status VARCHAR(20) DEFAULT 'active',
    is_negative BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT keywords_valid_match_type CHECK (match_type IN ('broad', 'phrase', 'exact')),
    CONSTRAINT keywords_valid_status CHECK (status IN ('active', 'paused', 'deleted')),
    
    INDEX idx_keywords_ad_group (ad_group_id),
    INDEX idx_keywords_match_type (match_type),
    INDEX idx_keywords_negative (is_negative)
);

-- Interests
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    interest_name VARCHAR(255) NOT NULL,
    interest_id VARCHAR(255), -- Platform-specific interest ID
    platform VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_interests_ad_group (ad_group_id),
    INDEX idx_interests_platform (platform)
);

-- Retargeting Rules
CREATE TABLE retargeting_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- buyers, abandoned_cart, frequent_buyers, lookalike
    rule_config JSONB DEFAULT '{}', -- Rule-specific configuration
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT retargeting_rules_valid_type CHECK (rule_type IN ('buyers', 'abandoned_cart', 'frequent_buyers', 'lookalike')),
    
    INDEX idx_retargeting_rules_ad_group (ad_group_id),
    INDEX idx_retargeting_rules_type (rule_type)
);

-- Creative Assets
CREATE TABLE creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    headline VARCHAR(300),
    description VARCHAR(500),
    primary_text TEXT,
    cta VARCHAR(50),
    image_url TEXT,
    video_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT creatives_valid_status CHECK (status IN ('active', 'paused', 'deleted')),
    
    INDEX idx_creatives_campaign (campaign_id),
    INDEX idx_creatives_ad_group (ad_group_id),
    INDEX idx_creatives_status (status)
);

-- Extensions
CREATE TABLE extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    extension_type VARCHAR(50) NOT NULL, -- sitelink, callout, promo
    extension_data JSONB NOT NULL, -- Extension-specific data
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT extensions_valid_type CHECK (extension_type IN ('sitelink', 'callout', 'promo')),
    CONSTRAINT extensions_valid_status CHECK (status IN ('active', 'paused', 'deleted')),
    
    INDEX idx_extensions_campaign (campaign_id),
    INDEX idx_extensions_ad_group (ad_group_id),
    INDEX idx_extensions_type (extension_type)
);

-- AI Generated Content
CREATE TABLE ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- ad_copy, keywords, image_prompt, budget_optimization
    content_data JSONB NOT NULL,
    prompt_input JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_used BOOLEAN DEFAULT false,
    
    CONSTRAINT ai_generated_valid_type CHECK (content_type IN ('ad_copy', 'keywords', 'image_prompt', 'budget_optimization')),
    
    INDEX idx_ai_generated_campaign (campaign_id),
    INDEX idx_ai_generated_ad_group (ad_group_id),
    INDEX idx_ai_generated_type (content_type),
    INDEX idx_ai_generated_used (is_used)
);

-- Performance Metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    spend DECIMAL(10,2) DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    conversions DECIMAL(10,2) DEFAULT 0,
    cpc DECIMAL(8,4) DEFAULT 0,
    cpm DECIMAL(8,4) DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    roas DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, ad_group_id, platform, date),
    INDEX idx_performance_campaign (campaign_id),
    INDEX idx_performance_ad_group (ad_group_id),
    INDEX idx_performance_platform (platform),
    INDEX idx_performance_date (date)
);

-- AI Recommendations
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    recommendation_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT ai_recommendations_valid_type CHECK (recommendation_type IN ('budget_optimization', 'creative_optimization', 'targeting_optimization', 'bidding_optimization')),
    
    INDEX idx_ai_recommendations_campaign (campaign_id),
    INDEX idx_ai_recommendations_ad_group (ad_group_id),
    INDEX idx_ai_recommendations_type (recommendation_type),
    INDEX idx_ai_recommendations_applied (is_applied)
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connected_accounts_updated_at BEFORE UPDATE ON connected_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ad_groups_updated_at BEFORE UPDATE ON ad_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Campaign summary view
CREATE VIEW campaign_summary AS
SELECT 
    c.id,
    c.name,
    c.objective,
    c.budget,
    c.budget_type,
    c.currency,
    c.status,
    c.autopilot_mode,
    COUNT(DISTINCT ag.id) as ad_group_count,
    COUNT(DISTINCT cp.platform) as platform_count,
    SUM(pm.spend) as total_spend,
    SUM(pm.clicks) as total_clicks,
    SUM(pm.conversions) as total_conversions,
    AVG(pm.roas) as avg_roas
FROM campaigns c
LEFT JOIN ad_groups ag ON c.id = ag.campaign_id
LEFT JOIN campaign_platforms cp ON c.id = cp.campaign_id
LEFT JOIN performance_metrics pm ON c.id = pm.campaign_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name, c.objective, c.budget, c.budget_type, c.currency, c.status, c.autopilot_mode;

-- Ad group performance view
CREATE VIEW ad_group_performance AS
SELECT 
    ag.id,
    ag.name,
    ag.scenario,
    ag.status,
    c.name as campaign_name,
    COUNT(k.id) as keyword_count,
    COUNT(DISTINCT k.is_negative) as negative_keyword_count,
    SUM(pm.spend) as total_spend,
    SUM(pm.clicks) as total_clicks,
    SUM(pm.conversions) as total_conversions,
    AVG(pm.cpc) as avg_cpc
FROM ad_groups ag
JOIN campaigns c ON ag.campaign_id = c.id
LEFT JOIN keywords k ON ag.id = k.ad_group_id
LEFT JOIN performance_metrics pm ON ag.id = pm.ad_group_id
WHERE c.deleted_at IS NULL
GROUP BY ag.id, ag.name, ag.scenario, ag.status, c.name;

-- Indexes for performance
CREATE INDEX idx_performance_date_range ON performance_metrics(date);
CREATE INDEX idx_performance_campaign_date ON performance_metrics(campaign_id, date);
CREATE INDEX idx_performance_ad_group_date ON performance_metrics(ad_group_id, date);
CREATE INDEX idx_ai_recommendations_created_at ON ai_recommendations(created_at);
CREATE INDEX idx_ai_generated_created_at ON ai_generated_content(created_at);