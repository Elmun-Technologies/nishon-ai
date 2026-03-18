export enum AutopilotMode {
  MANUAL = 'manual',       // AI suggests, human decides everything
  ASSISTED = 'assisted',   // AI acts but asks approval for big changes
  FULL_AUTO = 'full_auto', // AI acts completely autonomously
}

export enum AiDecisionAction {
  PAUSE_AD = 'pause_ad',
  SCALE_BUDGET = 'scale_budget',
  STOP_CAMPAIGN = 'stop_campaign',
  CREATE_AD = 'create_ad',
  SHIFT_BUDGET = 'shift_budget',
  GENERATE_STRATEGY = 'generate_strategy',
  ADJUST_TARGETING = 'adjust_targeting',
  ROTATE_CREATIVE = 'rotate_creative',
}