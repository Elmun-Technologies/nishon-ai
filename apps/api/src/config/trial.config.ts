/**
 * Product trial: new FREE users get full access until this window ends.
 * Paid plans (anything other than FREE) are not blocked by trial.
 */
export const USER_TRIAL_DAYS = 7;

export function trialEndsAtFromNow(now = new Date()): Date {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + USER_TRIAL_DAYS);
  return end;
}
