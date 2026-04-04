const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'performa_ai_db',
  user: process.env.DB_USER || 'performa',
  password: process.env.DB_PASSWORD || 'performa_secret',
})

async function seed() {
  console.log('🌱 Seeding demo data...')

  try {
    // Check if demo user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@performa.ai']
    )

    if (existing.rows.length > 0) {
      console.log('✅ Demo user already exists — skipping seed')
      return
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo1234', 12)
    const userResult = await pool.query(
      'INSERT INTO users (email, password, name, plan, is_email_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id',
      ['demo@performa.ai', hashedPassword, 'Demo User', 'PRO', true]
    )
    const userId = userResult.rows[0].id
    console.log('✅ Demo user created:', 'demo@performa.ai')

    // Create demo workspace
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

    // Create budget
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

    // Create demo campaigns
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

    // Get campaign IDs
    const campaignsResult = await pool.query(
      'SELECT id, name FROM campaigns WHERE workspace_id = $1 ORDER BY id',
      [workspaceId]
    )
    const metaCampaign = campaignsResult.rows.find(c => c.name.includes('Smartphone'))
    const googleCampaign = campaignsResult.rows.find(c => c.name.includes('Branded'))
    const pausedCampaign = campaignsResult.rows.find(c => c.name.includes('Laptop'))

    // Create demo AI decisions
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
    console.log('🎉 Seed complete! Demo credentials:')
    console.log('   Email:    demo@performa.ai')
    console.log('   Password: demo1234')
    console.log('')

  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seed()
