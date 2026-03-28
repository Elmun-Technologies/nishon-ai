export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  COMPLETED = 'completed',
  PENDING_REVIEW = 'pending_review',
}

export enum CampaignObjective {
  TRAFFIC = 'traffic',
  LEADS = 'leads',
  SALES = 'sales',
  AWARENESS = 'awareness',
  ENGAGEMENT = 'engagement',
  APP_INSTALLS = 'app_installs',
}

export enum BudgetType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export enum CampaignCurrency {
  USD = 'USD',
  UZS = 'UZS',
}