/**
 * Utilitare centrale pentru manipularea, curățarea și formatarea șirurilor de caractere.
 * Centralizează conversiile diacriticelor pentru rapoarte și fișiere PDF, formatarea telefoanelor
 * și normalizările de text din întreaga clinică.
 */

/**
 * Elimină diacriticele românești și simbolurile speciale pentru compatibilitate maximă cu PDF (jsPDF Helvetica).
 */
export const cleanStr = (str: any): string => {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/ă/g, "a")
    .replace(/Ă/g, "A")
    .replace(/â/g, "a")
    .replace(/Â/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/ș/g, "s")
    .replace(/Ș/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ț/g, "t")
    .replace(/Ț/g, "T")
    .replace(/ţ/g, "t")
    .replace(/Ţ/g, "T")
    .replace(/♂/g, "(M)")
    .replace(/♀/g, "(F)");
};

/**
 * Curăță diacriticele cu excepția literelor Ș și Ț atunci când se folosește randare specială cu virgulă dedesubt.
 */
export const cleanStrExceptTAndS = (str: any): string => {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/ă/g, "a")
    .replace(/Ă/g, "A")
    .replace(/â/g, "a")
    .replace(/Â/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/♂/g, "(M)")
    .replace(/♀/g, "(F)");
};

/**
 * Normalizare completă a textului pentru PDF (diacritice, emoticoane de zile de naștere, simboluri).
 */
export const normalizeForPDF = (text: string | undefined | null): string => {
  if (!text) return "";
  return String(text)
    .replace(/ă/g, "a")
    .replace(/Ă/g, "A")
    .replace(/â/g, "a")
    .replace(/Â/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/ș/g, "s")
    .replace(/Ș/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ț/g, "t")
    .replace(/Ț/g, "T")
    .replace(/ţ/g, "t")
    .replace(/Ţ/g, "T")
    .replace(/♂/g, "(M)")
    .replace(/♀/g, "(F)")
    .replace(/🎂/g, "")
    .replace(/🎈/g, "")
    .replace(/🎉/g, "")
    .replace(/✨/g, "");
};

/**
 * Formatează numărul de telefon în formatul standard românesc grupat (ex: 07xx xxx xxx sau 02xx xxx xxx).
 */
export const formatPhoneNumber = (value: string | undefined | null): string => {
  if (!value) return "";
  let s = String(value).replace(/\D/g, "");

  // Normalizare prefix românesc dacă e introdus cu 40 sau 0040
  if (s.startsWith("40") && s.length > 10) {
    s = "0" + s.slice(2);
  } else if (s.startsWith("0040") && s.length > 10) {
    s = "0" + s.slice(4);
  }

  const isSpecial =
    s.startsWith("07") || s.startsWith("02") || s.startsWith("03");
  const maxLength = isSpecial ? 10 : 15;
  const digits = s.slice(0, maxLength);
  const groups: string[] = [];

  if (digits.length > 0) groups.push(digits.slice(0, 4));
  if (digits.length > 4) groups.push(digits.slice(4, 7));
  if (digits.length > 7) groups.push(digits.slice(7, 10));
  if (digits.length > 10) groups.push(digits.slice(10));

  return groups.join(" ");
};

/**
 * Escapează un câmp pentru export CSV conform standardului RFC 4180 (Excel compatibil).
 */
export const escapeCsvField = (str: any): string => {
  if (str === undefined || str === null) return '""';
  const s = String(str).replace(/"/g, '""');
  return `"${s}"`;
};
