'use client'

import type { ComponentType } from 'react'
import { LaunchWizardAnim } from './per-feature/LaunchWizardAnim'
import { CampaignManagerAnim } from './per-feature/CampaignManagerAnim'
import { AudienceBuilderAnim } from './per-feature/AudienceBuilderAnim'
import { RetargetingAnim } from './per-feature/RetargetingAnim'
import { AiDecisionsAnim } from './per-feature/AiDecisionsAnim'
import { AutoOptimizationAnim } from './per-feature/AutoOptimizationAnim'
import { CreativeScorerAnim } from './per-feature/CreativeScorerAnim'
import { BudgetOptimizationAnim } from './per-feature/BudgetOptimizationAnim'
import { SimulationAnim } from './per-feature/SimulationAnim'
import { RoiCalculatorAnim } from './per-feature/RoiCalculatorAnim'
import { PerformanceAnalyticsAnim } from './per-feature/PerformanceAnalyticsAnim'
import { ReportingAnim } from './per-feature/ReportingAnim'
import { CompetitorIntelAnim } from './per-feature/CompetitorIntelAnim'
import { AutomationRulesAnim } from './per-feature/AutomationRulesAnim'
import { TopAdsAnim } from './per-feature/TopAdsAnim'
import { WorkspaceTeamAnim } from './per-feature/WorkspaceTeamAnim'
import { AdAccountsAnim } from './per-feature/AdAccountsAnim'
import { ProductsPlansAnim } from './per-feature/ProductsPlansAnim'
import { PaymentsInvoicesAnim } from './per-feature/PaymentsInvoicesAnim'
import { McpCredentialsAnim } from './per-feature/McpCredentialsAnim'
import { HelpCenterAnim } from './per-feature/HelpCenterAnim'

const REGISTRY: Record<string, ComponentType> = {
  'launch-wizard': LaunchWizardAnim,
  'campaign-manager': CampaignManagerAnim,
  'audience-builder': AudienceBuilderAnim,
  'retargeting': RetargetingAnim,
  'ai-decisions': AiDecisionsAnim,
  'auto-optimization': AutoOptimizationAnim,
  'creative-scorer': CreativeScorerAnim,
  'budget-optimization': BudgetOptimizationAnim,
  'simulation': SimulationAnim,
  'roi-calculator': RoiCalculatorAnim,
  'performance-analytics': PerformanceAnalyticsAnim,
  'reporting': ReportingAnim,
  'competitor-intel': CompetitorIntelAnim,
  'automation-rules': AutomationRulesAnim,
  'top-ads': TopAdsAnim,
  'workspace-team': WorkspaceTeamAnim,
  'ad-accounts': AdAccountsAnim,
  'products-plans': ProductsPlansAnim,
  'payments-invoices': PaymentsInvoicesAnim,
  'mcp-credentials': McpCredentialsAnim,
  'help-center': HelpCenterAnim,
}

export function FeatureAnim({ slug }: { slug: string }) {
  const Component = REGISTRY[slug]
  if (!Component) return null
  return <Component />
}
