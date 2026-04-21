/** Test rejimi: 3 kun — keyin Agent Store ga chiqarish (workflow stub). */

export function testPhaseLabel(daysLeft: number): string {
  if (daysLeft <= 0) return 'Test tugadi — tasdiqlang yoki rad eting'
  return `${daysLeft} kun qoldi (test rejim)`
}
