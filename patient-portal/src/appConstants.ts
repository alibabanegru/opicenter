export function validateCNP(cnp: string): boolean {
  if (!cnp || typeof cnp !== "string") return false;
  const clean = cnp.trim();
  if (!/^\d{13}$/.test(clean)) return false;

  const sex = parseInt(clean[0], 10);
  if (sex === 0) return false;

  const month = parseInt(clean.substring(3, 5), 10);
  if (month < 1 || month > 12) return false;

  const day = parseInt(clean.substring(5, 7), 10);
  if (day < 1 || day > 31) return false;

  const controlKey = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * controlKey[i];
  }
  const remainder = sum % 11;
  const expectedControl = remainder === 10 ? 1 : remainder;
  const actualControl = parseInt(clean[12], 10);

  return expectedControl === actualControl;
}
