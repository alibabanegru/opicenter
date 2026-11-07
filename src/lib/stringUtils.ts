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
/**
 * Curăță diacriticele cu excepția literelor speciale românești (Ș, Ț, â, î) când se folosește randare cu accente grafice.
 */
export const cleanStrExceptTAndS = (str: any): string => {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/ă/g, "a")
    .replace(/Ă/g, "A")
    .replace(/♂/g, "(M)")
    .replace(/♀/g, "(F)");
};

/**
 * Normalizare completă a textului pentru PDF (diacritice, emoticoane de zile de naștere, simboluri).
 */
export const normalizeForPDF = (text: string | undefined | null): string => {
  if (!text) return "";
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ă|â/gi, "a")
    .replace(/î/gi, "i")
    .replace(/ș|ş/gi, "s")
    .replace(/ț|ţ/gi, "t")
    .replace(/♂/g, "(M)")
    .replace(/♀/g, "(F)")
    .replace(/°/g, "")
    .replace(/🎂|🎈|🎉|✨/g, "");
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

/**
 * Asigură formatul corect de imagine Base64 sau URL pentru jsPDF (PNG sau JPEG).
 * Tratează automat atât png, jpeg, jpg, webp sau prefixe data:image.
 */
export const getImageFormatForPdf = (dataUrlOrUri: string | undefined | null): "PNG" | "JPEG" | "WEBP" => {
  if (!dataUrlOrUri) return "PNG";
  const lower = dataUrlOrUri.toLowerCase();
  if (lower.startsWith("data:image/jpeg") || lower.startsWith("data:image/jpg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "JPEG";
  }
  if (lower.startsWith("data:image/webp") || lower.endsWith(".webp")) {
    return "WEBP";
  }
  return "PNG";
};

/**
 * Recalculează cilindrul pentru lentile de contact conform disponibilității standard de fabricație:
 * Lentilele torice standard se fabrică doar în treptele: -0.75, -1.25, -1.75, -2.25, -2.75.
 * Dacă cilindrul din fișă este mai mare de 2.75 (ex: -3.00, -3.50 etc.), se păstrează cilindrul din fișa pacientului.
 * Dacă cilindrul este sub 0.75 (ex: -0.25, -0.50), nu justifică lentilă torică (poate fi 0 sau convertit în echivalent sferic).
 */
export const recalculateContactLensCylinder = (rawCyl: string | undefined | null): string => {
  if (!rawCyl || !rawCyl.trim()) return "";
  const cleanVal = rawCyl.trim().replace(",", ".");
  const p = parseFloat(cleanVal);
  if (isNaN(p)) return rawCyl;

  const absP = Math.abs(p);
  // Dacă cilindrul este 0 sau neglijabil sub 0.50
  if (absP < 0.5) return "";

  // Dacă este mai mare de 2.75, se păstrează cilindrul din fișa pacientului
  if (absP > 2.75) {
    const sign = p < 0 ? "-" : "+";
    return `${sign}${absP.toFixed(2)}`;
  }

  // Trepte standard torice pentru lentile de contact: 0.75, 1.25, 1.75, 2.25, 2.75
  const standardSteps = [0.75, 1.25, 1.75, 2.25, 2.75];
  let closest = standardSteps[0];
  let minDiff = Math.abs(absP - closest);

  for (let i = 1; i < standardSteps.length; i++) {
    const diff = Math.abs(absP - standardSteps[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = standardSteps[i];
    }
  }

  // Lentilele de contact torice sunt aproape exclusiv notate cu cilindru negativ (-)
  return `-${closest.toFixed(2)}`;
};

/**
 * Trunchiază textul la o lățime maximă specificată în milimetri pentru jsPDF, adăugând "..." dacă depășește.
 */
export const truncateTextToWidth = (
  doc: any,
  text: string | undefined | null,
  maxWidth: number
): string => {
  if (!text) return "";
  const str = String(text);
  if (doc.getTextWidth(cleanStrExceptTAndS(str)) <= maxWidth) return str;
  let candidate = str;
  while (
    candidate.length > 0 &&
    doc.getTextWidth(cleanStrExceptTAndS(candidate) + "...") > maxWidth
  ) {
    candidate = candidate.slice(0, -1);
  }
  return candidate.trim() + "...";
};

/**
 * Randează text cu diacritice românești complete (ș, Ș, ț, Ț, ă, Ă, â, Â, î, Î) în jsPDF
 * folosind fontul Helvetica prin desenarea precisă a virgulei/semnelor specifice,
 * cu suport opțional pentru aliniere și lățime maximă (maxWidth).
 */
export const drawPdfTextWithDiacritics = (
  doc: any,
  text: string | undefined | null,
  x: number,
  y: number,
  options?: { align?: "left" | "center" | "right"; maxWidth?: number }
) => {
  if (!text) return;
  const align = options?.align || "left";
  const maxWidth = options?.maxWidth;
  const currentFontSize = doc.getFontSize();

  let targetText = String(text);
  if (maxWidth && maxWidth > 0) {
    targetText = truncateTextToWidth(doc, targetText, maxWidth);
  }

  const widthMeasureText = cleanStrExceptTAndS(
    targetText
      .replace(/[țţ]/g, "t")
      .replace(/[ȚŢ]/g, "T")
      .replace(/[șş]/g, "s")
      .replace(/[ȘŞ]/g, "S")
      .replace(/ă/g, "a")
      .replace(/Ă/g, "A")
  );
  const totalWidth = doc.getTextWidth(widthMeasureText);

  let startX = x;
  if (align === "center") {
    startX = x - totalWidth / 2;
  } else if (align === "right") {
    startX = x - totalWidth;
  }

  let currentX = startX;

  for (let i = 0; i < targetText.length; i++) {
    const char = targetText[i];
    if (char === "ț" || char === "ţ") {
      doc.text("t", currentX, y);
      const wt = doc.getTextWidth("t");

      doc.setFontSize(currentFontSize * 0.5);
      const commaText = ",";
      const wComma = doc.getTextWidth(commaText);
      const commaX = currentX + wt / 2 - wComma / 2;
      const fontSizeInMm = currentFontSize * 0.352778;
      const commaY_mm = y + fontSizeInMm * 0.22;
      doc.text(commaText, commaX, commaY_mm);

      doc.setFontSize(currentFontSize);
      currentX += wt;
    } else if (char === "Ț" || char === "Ţ") {
      doc.text("T", currentX, y);
      const wT = doc.getTextWidth("T");

      doc.setFontSize(currentFontSize * 0.5);
      const commaText = ",";
      const wComma = doc.getTextWidth(commaText);
      const commaX = currentX + wT / 2 - wComma / 2;
      const fontSizeInMm = currentFontSize * 0.352778;
      const commaY_mm = y + fontSizeInMm * 0.22;
      doc.text(commaText, commaX, commaY_mm);

      doc.setFontSize(currentFontSize);
      currentX += wT;
    } else if (char === "ș" || char === "ş") {
      doc.text("s", currentX, y);
      const ws = doc.getTextWidth("s");

      doc.setFontSize(currentFontSize * 0.5);
      const commaText = ",";
      const wComma = doc.getTextWidth(commaText);
      const commaX = currentX + ws / 2 - wComma / 2;
      const fontSizeInMm = currentFontSize * 0.352778;
      const commaY_mm = y + fontSizeInMm * 0.22;
      doc.text(commaText, commaX, commaY_mm);

      doc.setFontSize(currentFontSize);
      currentX += ws;
    } else if (char === "Ș" || char === "Ş") {
      doc.text("S", currentX, y);
      const wS = doc.getTextWidth("S");

      doc.setFontSize(currentFontSize * 0.5);
      const commaText = ",";
      const wComma = doc.getTextWidth(commaText);
      const commaX = currentX + wS / 2 - wComma / 2;
      const fontSizeInMm = currentFontSize * 0.352778;
      const commaY_mm = y + fontSizeInMm * 0.22;
      doc.text(commaText, commaX, commaY_mm);

      doc.setFontSize(currentFontSize);
      currentX += wS;
    } else if (char === "ă") {
      doc.text("a", currentX, y);
      const wa = doc.getTextWidth("a");
      const fontSizeInMm = currentFontSize * 0.352778;
      const breveY = y - fontSizeInMm * 0.65;
      const breveW = wa * 0.45;
      const breveLeft = currentX + (wa - breveW) / 2;
      doc.setLineWidth(0.15);
      doc.line(breveLeft, breveY - 0.18, breveLeft + breveW / 2, breveY);
      doc.line(breveLeft + breveW / 2, breveY, breveLeft + breveW, breveY - 0.18);
      currentX += wa;
    } else if (char === "Ă") {
      doc.text("A", currentX, y);
      const wA = doc.getTextWidth("A");
      const fontSizeInMm = currentFontSize * 0.352778;
      const breveY = y - fontSizeInMm * 0.95;
      const breveW = wA * 0.42;
      const breveLeft = currentX + (wA - breveW) / 2;
      doc.setLineWidth(0.18);
      doc.line(breveLeft, breveY - 0.22, breveLeft + breveW / 2, breveY);
      doc.line(breveLeft + breveW / 2, breveY, breveLeft + breveW, breveY - 0.22);
      currentX += wA;
    } else {
      const cleanChar = cleanStrExceptTAndS(char);
      doc.text(cleanChar, currentX, y);
      currentX += doc.getTextWidth(cleanChar);
    }
  }
};
