import { UserPlan } from "../users/entities/user.entity";

/**
 * Per-plan limits for AdSpectr subscription tiers.
 * These are enforced server-side — never trust the frontend.
 */
export interface PlanLimits {
  maxWorkspaces: number;
  maxCampaigns: number;        // per workspace
  maxConnectedAccounts: number; // per workspace
  canHireAgents: boolean;       // access to marketplace
  canCreateAgentProfile: boolean; // can list themselves as targetologist
  canBuildAiAgent: boolean;     // can create custom AI agent
  aiStrategyGenerations: number; // per month (-1 = unlimited)
  landingPageGenerations: number; // per month (-1 = unlimited)
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  [UserPlan.FREE]: {
    maxWorkspaces: 1,
    maxCampaigns: 3,
    maxConnectedAccounts: 1,
    canHireAgents: false,
    canCreateAgentProfile: false,
    canBuildAiAgent: false,
    aiStrategyGenerations: 1,
    landingPageGenerations: 1,
  },
  [UserPlan.STARTER]: {
    maxWorkspaces: 2,
    maxCampaigns: 10,
    maxConnectedAccounts: 2,
    canHireAgents: true,
    canCreateAgentProfile: false,
    canBuildAiAgent: false,
    aiStrategyGenerations: 5,
    landingPageGenerations: 3,
  },
  [UserPlan.GROWTH]: {
    maxWorkspaces: 5,
    maxCampaigns: 30,
    maxConnectedAccounts: 5,
    canHireAgents: true,
    canCreateAgentProfile: true,
    canBuildAiAgent: false,
    aiStrategyGenerations: 20,
    landingPageGenerations: 10,
  },
  [UserPlan.PRO]: {
    maxWorkspaces: 15,
    maxCampaigns: 100,
    maxConnectedAccounts: 10,
    canHireAgents: true,
    canCreateAgentProfile: true,
    canBuildAiAgent: true,
    aiStrategyGenerations: -1,
    landingPageGenerations: -1,
  },
  [UserPlan.AGENCY]: {
    maxWorkspaces: -1,
    maxCampaigns: -1,
    maxConnectedAccounts: -1,
    canHireAgents: true,
    canCreateAgentProfile: true,
    canBuildAiAgent: true,
    aiStrategyGenerations: -1,
    landingPageGenerations: -1,
  },
};

export function getLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[UserPlan.FREE];
}
