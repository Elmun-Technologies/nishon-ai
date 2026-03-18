-- Demo data for Nishon AI
-- Run this SQL script to create demo data

-- Create demo user
INSERT INTO users (email, password, name, plan, is_email_verified, created_at, updated_at)
VALUES (
  'demo@nishon.ai',
  '$2a$12$demo1234hashedpassword', -- This is a placeholder, we'll update it
  'Demo User',
  'PRO',
  true,
  NOW(),
  NOW()
);

-- Get the user ID
SET @demo_user_id = LAST_INSERT_ID();

-- Create demo workspace
INSERT INTO workspaces (
  user_id,
  name,
  industry,
  product_description,
  target_audience,
  monthly_budget,
  goal,
  autopilot_mode,
  target_location,
  is_onboarding_complete,
  ai_strategy,
  created_at,
  updated_at
) VALUES (
  @demo_user_id,
  'TechShop Uzbekistan',
  'ecommerce',
  'Premium electronics and gadgets store in Tashkent. We sell smartphones, laptops, tablets, and accessories from top brands. Price range $50-2000. Fast delivery across Uzbekistan.',
  'Men and women aged 20-45 in Tashkent and major Uzbekistan cities. Tech-savvy, middle to upper income. Shop online regularly.',
  1000,
  'SALES',
  'ASSISTED',
  'Uzbekistan',
  true,
  '{"summary": "Focus on Meta and Google Ads with conversion-optimized campaigns targeting tech-savvy buyers in Tashkent. Use retargeting to capture high-intent visitors.", "recommendedPlatforms": ["meta", "google"], "budgetAllocation": {"meta": 60, "google": 40}, "monthlyForecast": {"estimatedLeads": 85, "estimatedSales": 34, "estimatedRoas": 3.2, "estimatedCpa": 29.4, "estimatedCtr": 0.024, "confidence": "medium"}, "creativeGuidelines": {"tone": "Professional and trustworthy, with urgency", "keyMessages": ["Best prices in Uzbekistan", "Official warranty", "2-day delivery"], "callToActions": ["Buy Now", "Shop Today", "Get Yours"], "visualStyle": "Clean product photography on white background", "formatRecommendations": ["Carousel for multiple products", "Single image for hero product"]}, "generatedAt": "2025-03-18T10:00:00.000Z"}',
  NOW(),
  NOW()
);

-- Get the workspace ID
SET @demo_workspace_id = LAST_INSERT_ID();

-- Create budget
INSERT INTO budgets (
  workspace_id,
  total_budget,
  platform_split,
  period,
  auto_rebalance,
  created_at,
  updated_at
) VALUES (
  @demo_workspace_id,
  1000,
  '{"meta": 60, "google": 40}',
  'MONTHLY',
  true,
  NOW(),
  NOW()
);

-- Create demo campaigns
INSERT INTO campaigns (
  workspace_id,
  name,
  platform,
  status,
  objective,
  daily_budget,
  total_budget,
  external_id,
  ai_config,
  created_at,
  updated_at
) VALUES
(@demo_workspace_id, 'Meta — Smartphone Sales Q1', 'meta', 'ACTIVE', 'SALES', 20, 600, 'meta_demo_001', '{"optimizationGoal": "CONVERSIONS", "bidStrategy": "LOWEST_COST"}', NOW(), NOW()),
(@demo_workspace_id, 'Google — Branded Search', 'google', 'ACTIVE', 'SALES', 13, 400, 'google_demo_001', '{"matchType": "EXACT", "bidStrategy": "TARGET_CPA", "targetCpa": 30}', NOW(), NOW()),
(@demo_workspace_id, 'Meta — Laptop Remarketing', 'meta', 'PAUSED', 'SALES', 10, 200, 'meta_demo_002', '{}', NOW(), NOW());

-- Get campaign IDs
SET @meta_campaign_id = LAST_INSERT_ID() - 2; -- Smartphone Sales
SET @google_campaign_id = LAST_INSERT_ID() - 1; -- Branded Search
SET @paused_campaign_id = LAST_INSERT_ID(); -- Laptop Remarketing

-- Create demo AI decisions
INSERT INTO ai_decisions (
  workspace_id,
  campaign_id,
  action_type,
  reason,
  estimated_impact,
  before_state,
  after_state,
  is_approved,
  is_executed,
  created_at,
  updated_at
) VALUES
(@demo_workspace_id, @meta_campaign_id, 'SCALE_BUDGET', 'Meta — Smartphone Sales campaign achieved ROAS of 4.1x over the last 3 days, significantly above the 3x target. Scaling daily budget from $18 to $22 to capture more high-intent buyers while performance is strong.', 'Expected +12 additional sales per week, increasing monthly revenue by ~$340', '{"dailyBudget": 18, "roas": 4.1, "conversions": 8}', '{"dailyBudget": 22, "roas": 4.1, "conversions": 10}', NULL, false, NOW(), NOW()),
(@demo_workspace_id, @paused_campaign_id, 'PAUSE_AD', 'Laptop Remarketing ad "Summer Sale Banner" has CTR of 0.3% with 2,400 impressions and zero conversions over 5 days. CPA is theoretically infinite. Pausing to prevent further budget waste.', 'Saves approximately $8/day. Recommend creating new creative with stronger CTA.', '{"ctr": 0.003, "conversions": 0, "spend": 42}', '{"status": "paused"}', true, true, NOW(), NOW()),
(@demo_workspace_id, @google_campaign_id, 'SHIFT_BUDGET', 'Google Branded Search is converting at $24 CPA vs $38 CPA on the Display campaign. Shifting 20% of Display budget to Search to improve overall account efficiency.', 'Projected CPA improvement from $31 to $27 — saving ~$130/month', '{"searchBudget": 13, "displayBudget": 7}', '{"searchBudget": 15, "displayBudget": 5}', true, true, NOW(), NOW()),
(@demo_workspace_id, NULL, 'GENERATE_STRATEGY', 'Initial advertising strategy generated based on business profile. Recommended Meta + Google split with 60/40 budget allocation. Strategy prioritizes conversion campaigns over awareness for faster ROI.', 'Estimated ROAS of 3.2x and 85 monthly leads based on industry benchmarks for Uzbekistan e-commerce.', NULL, '{"strategySaved": true}', true, true, NOW(), NOW());