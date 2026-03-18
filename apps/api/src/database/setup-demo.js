const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nishon_ai_db',
  user: process.env.DB_USER || 'nishon',
  password: process.env.DB_PASSWORD || 'nishon_secret',
})

async function setupDemo() {
  console.log('🚀 Setting up Nishon AI demo database...')

  try {
    // Step 1: Create schema
    console.log('📋 Creating database schema...')
    await pool.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'FREE',
        is_email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Workspaces table
      CREATE TABLE IF NOT EXISTS workspaces (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        product_description TEXT,
        target_audience TEXT,
        monthly_budget DECIMAL(10,2),
        goal VARCHAR(50),
        autopilot_mode VARCHAR(50),
        target_location VARCHAR(100),
        is_onboarding_complete BOOLEAN DEFAULT false,
        ai_strategy JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Budgets table
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        total_budget DECIMAL(10,2) NOT NULL,
        platform_split JSONB,
        period VARCHAR(50),
        auto_rebalance BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Campaigns table
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'DRAFT',
        objective VARCHAR(50),
        daily_budget DECIMAL(10,2),
        total_budget DECIMAL(10,2),
        external_id VARCHAR(255),
        ai_config JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- AI Decisions table
      CREATE TABLE IF NOT EXISTS ai_decisions (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        reason TEXT NOT NULL,
        estimated_impact TEXT,
        before_state JSONB,
        after_state JSONB,
        is_approved BOOLEAN,
        is_executed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Performance Metrics table
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        spend DECIMAL(10,2) DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        revenue DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Connected Accounts table
      CREATE TABLE IF NOT EXISTS connected_accounts (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        account_id VARCHAR(255),
        account_name VARCHAR(255),
        is_connected BOOLEAN DEFAULT false,
        credentials_encrypted TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Ad Sets table
      CREATE TABLE IF NOT EXISTS ad_sets (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'DRAFT',
        daily_budget DECIMAL(10,2),
        target_audience JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Ads table
      CREATE TABLE IF NOT EXISTS ads (
        id SERIAL PRIMARY KEY,
        ad_set_id INTEGER REFERENCES ad_sets(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'DRAFT',
        creative JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
      CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_ai_decisions_workspace_id ON ai_decisions(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_ai_decisions_campaign_id ON ai_decisions(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_campaign_id ON performance_metrics(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_connected_accounts_workspace_id ON connected_accounts(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_id ON ad_sets(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_ads_ad_set_id ON ads(ad_set_id);
    `)
    console.log('✅ Database schema created successfully')

    // Step 2: Check if demo user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@nishon.ai']
    )

    if (existing.rows.length > 0) {
      console.log('✅ Demo user already exists — skipping seed')
      return
    }

    // Step 3: Create demo user
    console.log('👤 Creating demo user...')
    const hashedPassword = await bcrypt.hash('demo1234', 12)
    const userResult = await pool.query(
      'INSERT INTO users (email, password, name, plan, is_email_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id',
      ['demo@nishon.ai', hashedPassword, 'Demo User', 'PRO', true]
    )
    const userId = userResult.rows[0].id
    console.log('✅ Demo user created:', 'demo@nishon.ai')

    // Step 4: Create demo workspace
    console.log('🏢 Creating demo workspace...')
    const workspaceResult = await pool.query(
      `INSERT INTO workspaces (
        user_id, name, industry, product_description, target_audience, 
        monthly_budget, goal, autopilot_mode, target_location, is_onboarding_complete,
        ai_strategy, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) 
      RETURNING id`,
      [
        userId,
        'TechShop Uzbekistan',
        'ecommerce',
        'Premium electronics and gadgets store in Tashkent. We sell smartphones, laptops, tablets, and accessories from top brands. Price range $50-2000. Fast delivery across Uzbekistan.',
        'Men and women aged 20-45 in Tashkent and major Uzbekistan cities. Tech-savvy, middle to upper income. Shop online regularly.',
        1000,
        'SALES',
        'ASSISTED',
        'Uzbekistan',
        true,
        JSON.stringify({
          summary: 'Focus on Meta and Google Ads with conversion-optimized campaigns targeting tech-savvy buyers in Tashkent. Use retargeting to capture high-intent visitors.',
          recommendedPlatforms: ['meta', 'google'],
          budgetAllocation: { meta: 60, google: 40 },
          monthlyForecast: {
            estimatedLeads: 85,
            estimatedSales: 34,
            estimatedRoas: 3.2,
            estimatedCpa: 29.4,
            estimatedCtr: 0.024,
            confidence: 'medium',
          },
          creativeGuidelines: {
            tone: 'Professional and trustworthy, with urgency',
            keyMessages: ['Best prices in Uzbekistan', 'Official warranty', '2-day delivery'],
            callToActions: ['Buy Now', 'Shop Today', 'Get Yours'],
            visualStyle: 'Clean product photography on white background',
            formatRecommendations: ['Carousel for multiple products', 'Single image for hero product'],
          },
          generatedAt: new Date().toISOString(),
        })
      ]
    )
    const workspaceId = workspaceResult.rows[0].id
    console.log('✅ Demo workspace created:', 'TechShop Uzbekistan')

    // Step 5: Create budget
    console.log('💰 Creating budget...')
    await pool.query(
      `INSERT INTO budgets (
        workspace_id, total_budget, platform_split, period, auto_rebalance, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        workspaceId,
        1000,
        JSON.stringify({ meta: 60, google: 40 }),
        'MONTHLY',
        true
      ]
    )

    // Step 6: Create demo campaigns
    console.log('📢 Creating demo campaigns...')
    const campaigns = [
      {
        name: 'Meta — Smartphone Sales Q1',
        platform: 'meta',
        status: 'ACTIVE',
        objective: 'SALES',
        dailyBudget: 20,
        totalBudget: 600,
        externalId: 'meta_demo_001',
        aiConfig: JSON.stringify({ optimizationGoal: 'CONVERSIONS', bidStrategy: 'LOWEST_COST' })
      },
      {
        name: 'Google — Branded Search',
        platform: 'google',
        status: 'ACTIVE',
        objective: 'SALES',
        dailyBudget: 13,
        totalBudget: 400,
        externalId: 'google_demo_001',
        aiConfig: JSON.stringify({ matchType: 'EXACT', bidStrategy: 'TARGET_CPA', targetCpa: 30 })
      },
      {
        name: 'Meta — Laptop Remarketing',
        platform: 'meta',
        status: 'PAUSED',
        objective: 'SALES',
        dailyBudget: 10,
        totalBudget: 200,
        externalId: 'meta_demo_002',
        aiConfig: JSON.stringify({})
      }
    ]

    for (const campaign of campaigns) {
      await pool.query(
        `INSERT INTO campaigns (
          workspace_id, name, platform, status, objective, daily_budget, total_budget,
          external_id, ai_config, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          workspaceId,
          campaign.name,
          campaign.platform,
          campaign.status,
          campaign.objective,
          campaign.dailyBudget,
          campaign.totalBudget,
          campaign.externalId,
          campaign.aiConfig
        ]
      )
    }
    console.log('✅ Demo campaigns created: 3 campaigns')

    // Step 7: Get campaign IDs
    const campaignsResult = await pool.query(
      'SELECT id, name FROM campaigns WHERE workspace_id = $1 ORDER BY id',
      [workspaceId]
    )
    const metaCampaign = campaignsResult.rows.find(c => c.name.includes('Smartphone'))
    const googleCampaign = campaignsResult.rows.find(c => c.name.includes('Branded'))
    const pausedCampaign = campaignsResult.rows.find(c => c.name.includes('Laptop'))

    // Step 8: Create demo AI decisions
    console.log('🤖 Creating demo AI decisions...')
    const decisions = [
      {
        campaignId: metaCampaign.id,
        actionType: 'SCALE_BUDGET',
        reason: 'Meta — Smartphone Sales campaign achieved ROAS of 4.1x over the last 3 days, significantly above the 3x target. Scaling daily budget from $18 to $22 to capture more high-intent buyers while performance is strong.',
        estimatedImpact: 'Expected +12 additional sales per week, increasing monthly revenue by ~$340',
        beforeState: JSON.stringify({ dailyBudget: 18, roas: 4.1, conversions: 8 }),
        afterState: JSON.stringify({ dailyBudget: 22, roas: 4.1, conversions: 10 }),
        isApproved: null,
        isExecuted: false
      },
      {
        campaignId: pausedCampaign.id,
        actionType: 'PAUSE_AD',
        reason: 'Laptop Remarketing ad "Summer Sale Banner" has CTR of 0.3% with 2,400 impressions and zero conversions over 5 days. CPA is theoretically infinite. Pausing to prevent further budget waste.',
        estimatedImpact: 'Saves approximately $8/day. Recommend creating new creative with stronger CTA.',
        beforeState: JSON.stringify({ ctr: 0.003, conversions: 0, spend: 42 }),
        afterState: JSON.stringify({ status: 'paused' }),
        isApproved: true,
        isExecuted: true
      },
      {
        campaignId: googleCampaign.id,
        actionType: 'SHIFT_BUDGET',
        reason: 'Google Branded Search is converting at $24 CPA vs $38 CPA on the Display campaign. Shifting 20% of Display budget to Search to improve overall account efficiency.',
        estimatedImpact: 'Projected CPA improvement from $31 to $27 — saving ~$130/month',
        beforeState: JSON.stringify({ searchBudget: 13, displayBudget: 7 }),
        afterState: JSON.stringify({ searchBudget: 15, displayBudget: 5 }),
        isApproved: true,
        isExecuted: true
      },
      {
        campaignId: null,
        actionType: 'GENERATE_STRATEGY',
        reason: 'Initial advertising strategy generated based on business profile. Recommended Meta + Google split with 60/40 budget allocation. Strategy prioritizes conversion campaigns over awareness for faster ROI.',
        estimatedImpact: 'Estimated ROAS of 3.2x and 85 monthly leads based on industry benchmarks for Uzbekistan e-commerce.',
        beforeState: null,
        afterState: JSON.stringify({ strategySaved: true }),
        isApproved: true,
        isExecuted: true
      }
    ]

    for (const decision of decisions) {
      await pool.query(
        `INSERT INTO ai_decisions (
          workspace_id, campaign_id, action_type, reason, estimated_impact,
          before_state, after_state, is_approved, is_executed, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          workspaceId,
          decision.campaignId,
          decision.actionType,
          decision.reason,
          decision.estimatedImpact,
          decision.beforeState,
          decision.afterState,
          decision.isApproved,
          decision.isExecuted
        ]
      )
    }
    console.log('✅ Demo AI decisions created: 4 decisions (1 pending approval)')

    console.log('')
    console.log('🎉 Demo setup complete! Demo credentials:')
    console.log('   Email:    demo@nishon.ai')
    console.log('   Password: demo1234')
    console.log('')
    console.log('🚀 You can now:')
    console.log('   1. Start the API: cd apps/api && npm run start:dev')
    console.log('   2. Start the web app: cd apps/web && npm run dev')
    console.log('   3. Visit http://localhost:3000 and click "Try Demo Account"')
    console.log('')

  } catch (err) {
    console.error('❌ Setup failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupDemo()