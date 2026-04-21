/** Bir foydalanuvchi kaliti: `u_` + telefonning oxirgi 9 raqami (signal bridge). */
export function unifiedUserHash(phoneRaw: string): string {
  const d = phoneRaw.replace(/\D/g, "");
  const tail = d.length >= 9 ? d.slice(-9) : d;
  return `u_${tail}`;
}
