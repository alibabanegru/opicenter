/**
 * Unified WhatsApp Utilities for Optical Clinic Negreanu
 * Handles robust phone number formatting, diacritics normalization/stripping,
 * invisible character removal, and safe URL building for WhatsApp Web/Desktop/Mobile.
 */

/**
 * Standardizes phone numbers for WhatsApp international format (without + or leading zeroes).
 * Supports Romanian formats:
 * - 07xxxxxxxx -> 407xxxxxxxx
 * - 02xxxxxxxx / 03xxxxxxxx -> 402xxxxxxxx / 403xxxxxxxx
 * - +407xxxxxxxx -> 407xxxxxxxx
 * - 00407xxxxxxxx -> 407xxxxxxxx
 * - 7xxxxxxxx (9 digits) -> 407xxxxxxxx
 * Also supports international numbers (Italy, UK, Germany, etc.).
 */
export const cleanWhatsAppPhone = (phone: string | undefined | null): {
  cleanPhone: string;
  isValid: boolean;
  error?: string;
} => {
  if (!phone || typeof phone !== "string") {
    return { cleanPhone: "", isValid: false, error: "Număr de telefon lipsă" };
  }

  // 1. Remove non-numeric characters (spaces, dashes, parentheses, dots, slashes)
  let cleaned = phone.replace(/\D/g, "");

  if (!cleaned) {
    return { cleanPhone: "", isValid: false, error: "Numărul nu conține cifre valide" };
  }

  // 2. Handle international prefix "00" (e.g. 00407... or 0039...)
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  }

  // 3. Romanian number transformations
  // e.g. 0722123456 -> 40722123456
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "4" + cleaned; // "4" + "07..." -> "407..."
  } else if (!cleaned.startsWith("40") && cleaned.length === 9) {
    // e.g. 722123456 -> 40722123456
    cleaned = "40" + cleaned;
  }

  // 4. Validate reasonable length for international phone numbers (E.164: 8 to 15 digits)
  if (cleaned.length < 8 || cleaned.length > 15) {
    return {
      cleanPhone: cleaned,
      isValid: false,
      error: `Număr cu lungime neobișnuită (${cleaned.length} cifre)`,
    };
  }

  return {
    cleanPhone: cleaned,
    isValid: true,
  };
};

/**
 * Completely removes Romanian diacritics and special characters for 100% bulletproof
 * compatibility across legacy WhatsApp Web, Windows Desktop, SMS gateways, and older phones.
 * Prevents "BunÄƒ ziua, vÄƒ informÄƒm..." encoding corruptions.
 */
export const stripDiacritics = (text: string): string => {
  if (!text) return "";

  return text
    // Replace non-breaking spaces & zero-width characters
    .replace(/[\u00A0\u202F\u2007]/g, " ")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    // Romanian lowercase
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    // Romanian uppercase
    .replace(/[ĂÂ]/g, "A")
    .replace(/Î/g, "I")
    .replace(/[ȘŞ]/g, "S")
    .replace(/[ȚŢ]/g, "T")
    // Smart / curly quotes to standard ASCII
    .replace(/[„“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    // Special dashes to standard hyphen
    .replace(/[—–]/g, "-")
    // Normalize excessive consecutive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * Normalizes Romanian diacritics into standard modern Unicode (comma-below: ș, ț),
 * fixing legacy cedilla characters (ş, ţ) and stripping invisible control characters.
 */
export const normalizeRomanianDiacritics = (text: string): string => {
  if (!text) return "";

  return text
    // Standardize composed unicode NFC
    .normalize("NFC")
    // Replace non-breaking spaces & zero-width characters
    .replace(/[\u00A0\u202F\u2007]/g, " ")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    // Legacy cedillas to standard Romanian comma-below
    .replace(/ş/g, "ș")
    .replace(/Ş/g, "Ș")
    .replace(/ţ/g, "ț")
    .replace(/Ţ/g, "Ț")
    // Smart quotes & dashes
    .replace(/[„“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    // Normalize excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export interface BuildWhatsAppUrlOptions {
  /** If true, converts all diacritics to clean ASCII (e.g. ă->a, ș->s) */
  removeDiacritics?: boolean;
  /** If true, uses https://api.whatsapp.com/send instead of https://wa.me/ */
  useApiEndpoint?: boolean;
}

/**
 * Builds a secure, properly encoded WhatsApp URL.
 */
export const buildWhatsAppUrl = (
  phone: string | undefined | null,
  message: string,
  options: BuildWhatsAppUrlOptions = {}
): {
  url: string;
  cleanPhone: string;
  sanitizedMessage: string;
  isValidPhone: boolean;
  error?: string;
} => {
  const { cleanPhone, isValid, error } = cleanWhatsAppPhone(phone);

  const sanitizedMessage = options.removeDiacritics
    ? stripDiacritics(message)
    : normalizeRomanianDiacritics(message);

  const encodedMessage = encodeURIComponent(sanitizedMessage);

  const baseUrl = options.useApiEndpoint
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
    : `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  return {
    url: baseUrl,
    cleanPhone,
    sanitizedMessage,
    isValidPhone: isValid,
    error,
  };
};

/**
 * Generates the standardized "Ochelarii dvs. sunt gata" notification message.
 */
export const buildGlassesReadyMessage = (params?: {
  patientName?: string;
  removeDiacritics?: boolean;
  clinicPhone?: string;
}): string => {
  const phone = params?.clinicPhone || "0248223162";
  const nameSalutation = params?.patientName?.trim()
    ? ` ${params.patientName.trim()}`
    : "";

  const baseText = params?.removeDiacritics
    ? `Buna ziua${nameSalutation}! Va informam ca ochelarii dumneavoastra sunt gata la Clinica Negreanu din Pitesti (Piata Ceair). Va asteptam cu drag pentru ridicare si ajustare! Pentru alte informatii, va rugam sa ne sunati la ${phone}.`
    : `Bună ziua${nameSalutation}! Vă informăm că ochelarii dumneavoastră sunt gata la Clinica Negreanu din Pitești (Piața Ceair). Vă așteptăm cu drag pentru ridicare și ajustare! Pentru alte informații, vă rugăm să ne sunați la ${phone}.`;

  return baseText;
};

/**
 * Safely opens a WhatsApp URL in a new tab, handling browser popup blocker detection.
 */
export const openWhatsAppUrl = (url: string): boolean => {
  try {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      // Popup might have been blocked
      return false;
    }
    return true;
  } catch (e) {
    console.error("Failed to open WhatsApp window:", e);
    return false;
  }
};
