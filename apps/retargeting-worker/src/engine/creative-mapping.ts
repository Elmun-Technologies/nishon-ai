/**
 * Kreativ charchashini kamaytirish: retargeting bosqichiga qarab avtomatik set.
 * CTR tushganda boshqa setga o‘tkazish — keyingi bosqichda performance signal bilan bog‘lanadi.
 */
export type CreativeSetKey = 'video_remind' | 'carousel_benefits' | 'static_discount_10';

export function selectCreativeSetByRecencyDays(daysInFunnel: number): CreativeSetKey {
  if (daysInFunnel <= 3) return 'video_remind';
  if (daysInFunnel <= 7) return 'carousel_benefits';
  if (daysInFunnel <= 14) return 'static_discount_10';
  return 'static_discount_10';
}
