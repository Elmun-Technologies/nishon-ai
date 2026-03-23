import type {
  CampaignPerformance,
  OptimizationGoal,
  RuleAnalysisResult,
} from '../types/optimization.types';

// ─── System prompt ────────────────────────────────────────────────────────────

export const OPTIMIZER_SYSTEM_PROMPT = `
You are an expert paid media optimizer with 10+ years running performance
campaigns on Meta, TikTok, and Google for small and medium businesses.

Your job is to analyze campaign performance data and produce a ranked list
of specific, actionable improvements — not generic advice.

PRINCIPLES:
- Every action must target a specific ad, adset, or campaign by ID
- Prioritize actions by expected ROI, not by complexity
- Low data volume = lower confidence = softer recommendations
- Creative fatigue is the #1 silent killer — always check frequency
- Budget efficiency over volume: better to spend less and convert more
- Never recommend drastic changes (pause major campaign) without strong evidence

OUTPUT FORMAT: Respond with VALID JSON ONLY. No text outside the JSON object.
`.trim();

// ─── User prompt builder ──────────────────────────────────────────────────────

export function buildOptimizerPrompt(
  campaign: CampaignPerformance,
  ruleAnalysis: RuleAnalysisResult,
  goal?: OptimizationGoal,
): string {
  const goalBlock = goal
    ? [
        `Type: ${goal.type}`,
        goal.targetRoas  != null ? `Target ROAS: ${goal.targetRoas}x`   : null,
        goal.targetCpa   != null ? `Target CPA: $${goal.targetCpa}`      : null,
        goal.targetCtr   != null ? `Target CTR: ${goal.targetCtr}%`      : null,
      ].filter(Boolean).join(' | ')
    : 'Not specified — optimize for overall efficiency';

  const adSetRows = campaign.adSets.map(s => {
    const adRows = s.ads.map(a =>
      `    • "${a.adName}" [${a.adId}]` +
      ` spend=$${a.spend} ctr=${a.ctr}% cpc=$${a.cpc}` +
      ` freq=${a.frequency} conv=${a.conversions}` +
      (a.cpa     != null ? ` cpa=$${a.cpa}`       : '') +
      ` roas=${a.roas}x` +
      (a.hookRate != null ? ` hook=${a.hookRate}%` : '') +
      (a.holdRate != null ? ` hold=${a.holdRate}%` : '') +
      (a.creative?.headline ? ` headline="${a.creative.headline}"` : '')
    ).join('\n');

    return (
      `  AdSet: "${s.adSetName}" [${s.adSetId}]\n` +
      `  spend=$${s.spend} ctr=${s.ctr}% cpc=$${s.cpc}` +
      ` conv=${s.conversions} roas=${s.roas}x` +
      (s.cpa != null ? ` cpa=$${s.cpa}` : '') + '\n' +
      adRows
    );
  }).join('\n\n');

  const problemBlock = ruleAnalysis.problems.length
    ? ruleAnalysis.problems
        .map(p => `  [${p.severity.toUpperCase()}] ${p.type} | ${p.targetType} ${p.targetId} | ${p.message}`)
        .join('\n')
    : '  None detected by rules engine';

  const opportunityBlock = ruleAnalysis.opportunities.length
    ? ruleAnalysis.opportunities
        .map(o => `  ${o.type} | ${o.targetType} ${o.targetId} | ${o.message}`)
        .join('\n')
    : '  None detected';

  return `
CAMPAIGN GOAL: ${goalBlock}

─── CAMPAIGN OVERVIEW ────────────────────────────────────────────────────────
Name:       ${campaign.campaignName}
Platform:   ${campaign.platform}  |  Objective: ${campaign.objective}
Budget:     $${campaign.dailyBudget}/day  |  Total spend: $${campaign.spend}
Performance: CTR=${campaign.ctr}%  CPC=$${campaign.cpc}  ROAS=${campaign.roas}x
             Impressions=${campaign.impressions}  Conversions=${campaign.conversions}${campaign.cpa != null ? `  CPA=$${campaign.cpa}` : ''}

─── AD SETS & ADS ────────────────────────────────────────────────────────────
${adSetRows}

─── RULE-BASED PRE-ANALYSIS ──────────────────────────────────────────────────
Data quality: ${ruleAnalysis.dataQuality}  |  Confidence: ${Math.round(ruleAnalysis.confidence * 100)}%
Winners (high performers): ${ruleAnalysis.winners.join(', ') || 'none'}
Losers  (poor performers): ${ruleAnalysis.losers.join(', ') || 'none'}

Problems detected:
${problemBlock}

Opportunities detected:
${opportunityBlock}

─── YOUR TASK ────────────────────────────────────────────────────────────────
Analyze the above data. Validate or expand on the rule-based findings.
Recommend the 3–7 highest-impact actions to improve campaign performance.

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence plain-language summary of campaign health",
  "overallHealthScore": 65,
  "keyInsights": [
    "Specific insight 1 with numbers",
    "Specific insight 2 with numbers",
    "Specific insight 3 with numbers"
  ],
  "actions": [
    {
      "type": "pause_creative",
      "targetId": "exact-ad-id-from-data",
      "targetType": "ad",
      "reason": "Specific reason citing actual metrics from the data",
      "expectedImpact": "Concrete expected improvement, e.g. reduce wasted spend by ~$X/day",
      "priority": "high",
      "risk": "medium",
      "autoApplicable": false
    }
  ]
}

VALID action types:
  pause_creative | pause_adset | increase_budget | decrease_budget |
  shift_budget | duplicate_winner | refresh_creative | test_new_angle |
  broaden_audience | narrow_audience | rewrite_headline |
  rewrite_primary_text | generate_video_script | rotate_creative | flag_fatigue

priority: critical | high | medium | low
risk: low | medium | high

Set autoApplicable=true ONLY for content-generation actions that do not mutate
ad platform state: flag_fatigue, rotate_creative, rewrite_headline,
rewrite_primary_text, generate_video_script, test_new_angle, refresh_creative
`.trim();
}

// ─── Creative refresh prompt ──────────────────────────────────────────────────

export const CREATIVE_REFRESH_SYSTEM_PROMPT = `
You are an elite direct-response copywriter specializing in CIS markets
(Uzbekistan, Kazakhstan, Russia). You write high-converting ad scripts
and headlines in Uzbek that stop the scroll and drive action.

Respond with VALID JSON ONLY.
`.trim();

export function buildCreativeRefreshPrompt(
  campaignName: string,
  platform: string,
  objective: string,
  problemDescription: string,
  existingCreatives: Array<{ headline?: string; primaryText?: string }>,
): string {
  const existingBlock = existingCreatives
    .filter(c => c.headline || c.primaryText)
    .map((c, i) => `  ${i + 1}. Headline: "${c.headline ?? 'N/A'}" | Text: "${c.primaryText ?? 'N/A'}"`)
    .join('\n');

  return `
Campaign: "${campaignName}" on ${platform} (objective: ${objective})

PROBLEM WITH EXISTING CREATIVES:
${problemDescription}

EXISTING CREATIVE COPY (do not replicate, use as reference only):
${existingBlock || '  None provided'}

Generate 3 replacement creative concepts. Each concept must be distinctly
different in angle, hook, and tone.

{
  "concepts": [
    {
      "concept": 1,
      "angle": "One-word angle label (e.g. Social Proof, Fear, Curiosity, Offer)",
      "headline": "Max 40 chars. Scroll-stopping headline in Uzbek",
      "primaryText": "Main ad copy in Uzbek. 2-3 sentences. Problem → Solution → CTA",
      "hook": "First 3 seconds of video (if video format)",
      "whyThisWorks": "1 sentence reasoning in English"
    }
  ]
}
`.trim();
}
