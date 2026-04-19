import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserPlan } from "../users/entities/user.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { Campaign } from "../campaigns/entities/campaign.entity";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Budget } from "../budget/entities/budget.entity";
import { BudgetPeriod } from "../budget/entities/budget.entity";

// Import enums directly to avoid queue module issues
enum Platform {
  META = "meta",
  GOOGLE = "google",
  TIKTOK = "tiktok",
}

enum CampaignStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  DRAFT = "draft",
  STOPPED = "stopped",
}

enum CampaignObjective {
  SALES = "sales",
  LEADS = "leads",
  TRAFFIC = "traffic",
  AWARENESS = "awareness",
}

enum AiDecisionAction {
  SCALE_BUDGET = "scale_budget",
  PAUSE_AD = "pause_ad",
  STOP_CAMPAIGN = "stop_campaign",
  CREATE_AD = "create_ad",
  SHIFT_BUDGET = "shift_budget",
  GENERATE_STRATEGY = "generate_strategy",
}

enum AutopilotMode {
  MANUAL = "manual",
  ASSISTED = "assisted",
  FULL_AUTO = "full_auto",
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo: Repository<User> = app.get(getRepositoryToken(User));
  const workspaceRepo: Repository<Workspace> = app.get(
    getRepositoryToken(Workspace),
  );
  const campaignRepo: Repository<Campaign> = app.get(
    getRepositoryToken(Campaign),
  );
  const decisionRepo: Repository<AiDecision> = app.get(
    getRepositoryToken(AiDecision),
  );
  const budgetRepo: Repository<Budget> = app.get(getRepositoryToken(Budget));

  console.log("🌱 Seeding demo data...");

  // Check if demo user already exists
  const existing = await userRepo.findOne({
    where: { email: "demo@adspectr.com" },
  });
  if (existing) {
    console.log("✅ Demo user already exists — skipping seed");
    await app.close();
    return;
  }

  // Create demo user — password from env, never hardcoded
  const demoPassword = process.env.DEMO_USER_PASSWORD;
  if (!demoPassword) {
    console.error("❌ DEMO_USER_PASSWORD env var is not set. Aborting seed.");
    await app.close();
    return;
  }
  const hashedPassword = await bcrypt.hash(demoPassword, 12);
  const user = await userRepo.save(
    userRepo.create({
      email: "demo@adspectr.com",
      password: hashedPassword,
      name: "Demo User",
      plan: UserPlan.PRO,
      isEmailVerified: true,
    }),
  );
  console.log("✅ Demo user created:", user.email);

  // Create demo workspace
  const workspace = await workspaceRepo.save(
    workspaceRepo.create({
      userId: user.id,
      name: "TechShop Uzbekistan",
      industry: "ecommerce",
      productDescription:
        "Premium electronics and gadgets store in Tashkent. We sell smartphones, laptops, tablets, and accessories from top brands. Price range $50-2000. Fast delivery across Uzbekistan.",
      targetAudience:
        "Men and women aged 20-45 in Tashkent and major Uzbekistan cities. Tech-savvy, middle to upper income. Shop online regularly.",
      monthlyBudget: 1000,
      goal: CampaignObjective.SALES,
      autopilotMode: AutopilotMode.ASSISTED,
      targetLocation: "Uzbekistan",
      isOnboardingComplete: true,
      aiStrategy: {
        summary:
          "Focus on Meta and Google Ads with conversion-optimized campaigns targeting tech-savvy buyers in Tashkent. Use retargeting to capture high-intent visitors.",
        recommendedPlatforms: ["meta", "google"],
        budgetAllocation: { meta: 60, google: 40 },
        monthlyForecast: {
          estimatedLeads: 85,
          estimatedSales: 34,
          estimatedRoas: 3.2,
          estimatedCpa: 29.4,
          estimatedCtr: 0.024,
          confidence: "medium",
        },
        creativeGuidelines: {
          tone: "Professional and trustworthy, with urgency",
          keyMessages: [
            "Best prices in Uzbekistan",
            "Official warranty",
            "2-day delivery",
          ],
          callToActions: ["Buy Now", "Shop Today", "Get Yours"],
          visualStyle: "Clean product photography on white background",
          formatRecommendations: [
            "Carousel for multiple products",
            "Single image for hero product",
          ],
        },
        generatedAt: new Date(),
      },
    }),
  );
  console.log("✅ Demo workspace created:", workspace.name);

  // Create budget
  await budgetRepo.save(
    budgetRepo.create({
      workspaceId: workspace.id,
      totalBudget: 1000,
      platformSplit: { meta: 60, google: 40 },
      period: BudgetPeriod.MONTHLY,
      autoRebalance: true,
    }),
  );

  // Create demo campaigns
  const metaCampaign = await campaignRepo.save(
    campaignRepo.create({
      workspaceId: workspace.id,
      name: "Meta — Smartphone Sales Q1",
      platform: Platform.META,
      status: CampaignStatus.ACTIVE,
      objective: CampaignObjective.SALES,
      dailyBudget: 20,
      totalBudget: 600,
      externalId: "meta_demo_001",
      aiConfig: { optimizationGoal: "CONVERSIONS", bidStrategy: "LOWEST_COST" },
    }),
  );

  const googleCampaign = await campaignRepo.save(
    campaignRepo.create({
      workspaceId: workspace.id,
      name: "Google — Branded Search",
      platform: Platform.GOOGLE,
      status: CampaignStatus.ACTIVE,
      objective: CampaignObjective.SALES,
      dailyBudget: 13,
      totalBudget: 400,
      externalId: "google_demo_001",
      aiConfig: {
        matchType: "EXACT",
        bidStrategy: "TARGET_CPA",
        targetCpa: 30,
      },
    }),
  );

  const pausedCampaign = await campaignRepo.save(
    campaignRepo.create({
      workspaceId: workspace.id,
      name: "Meta — Laptop Remarketing",
      platform: Platform.META,
      status: CampaignStatus.PAUSED,
      objective: CampaignObjective.SALES,
      dailyBudget: 10,
      totalBudget: 200,
      aiConfig: {},
    }),
  );
  console.log("✅ Demo campaigns created: 3 campaigns");

  // Create demo AI decisions
  const decisions = [
    {
      workspaceId: workspace.id,
      campaignId: metaCampaign.id,
      actionType: AiDecisionAction.SCALE_BUDGET,
      reason:
        "Meta — Smartphone Sales campaign achieved ROAS of 4.1x over the last 3 days, significantly above the 3x target. Scaling daily budget from $18 to $22 to capture more high-intent buyers while performance is strong.",
      estimatedImpact:
        "Expected +12 additional sales per week, increasing monthly revenue by ~$340",
      beforeState: { dailyBudget: 18, roas: 4.1, conversions: 8 },
      afterState: { dailyBudget: 22, roas: 4.1, conversions: 10 },
      isApproved: null, // Pending — user needs to approve
      isExecuted: false,
    },
    {
      workspaceId: workspace.id,
      campaignId: pausedCampaign.id,
      actionType: AiDecisionAction.PAUSE_AD,
      reason:
        'Laptop Remarketing ad "Summer Sale Banner" has CTR of 0.3% with 2,400 impressions and zero conversions over 5 days. CPA is theoretically infinite. Pausing to prevent further budget waste.',
      estimatedImpact:
        "Saves approximately $8/day. Recommend creating new creative with stronger CTA.",
      beforeState: { ctr: 0.003, conversions: 0, spend: 42 },
      afterState: { status: "paused" },
      isApproved: true,
      isExecuted: true,
    },
    {
      workspaceId: workspace.id,
      campaignId: googleCampaign.id,
      actionType: AiDecisionAction.SHIFT_BUDGET,
      reason:
        "Google Branded Search is converting at $24 CPA vs $38 CPA on the Display campaign. Shifting 20% of Display budget to Search to improve overall account efficiency.",
      estimatedImpact:
        "Projected CPA improvement from $31 to $27 — saving ~$130/month",
      beforeState: { searchBudget: 13, displayBudget: 7 },
      afterState: { searchBudget: 15, displayBudget: 5 },
      isApproved: true,
      isExecuted: true,
    },
    {
      workspaceId: workspace.id,
      campaignId: null,
      actionType: AiDecisionAction.GENERATE_STRATEGY,
      reason:
        "Initial advertising strategy generated based on business profile. Recommended Meta + Google split with 60/40 budget allocation. Strategy prioritizes conversion campaigns over awareness for faster ROI.",
      estimatedImpact:
        "Estimated ROAS of 3.2x and 85 monthly leads based on industry benchmarks for Uzbekistan e-commerce.",
      beforeState: null,
      afterState: { strategySaved: true },
      isApproved: true,
      isExecuted: true,
    },
  ];

  for (const d of decisions) {
    await decisionRepo.save(decisionRepo.create(d as any));
  }
  console.log("✅ Demo AI decisions created: 4 decisions (1 pending approval)");

  console.log("");
  console.log("🎉 Seed complete! Demo credentials:");
  console.log("   Email:    demo@adspectr.com");
  console.log("   Password: demo1234");
  console.log("");

  await app.close();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
