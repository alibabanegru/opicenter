export interface NonGrataPatient {
  id: string;
  patientName: string;
  normalizedName: string;
  patientPhone: string;
  normalizedPhone: string;
  patientCnp?: string;
  reason: string;
  addedBy: string;
  addedByRole?: string;
  createdAt: string;
  updatedAt: string;
}

export const normalizeNonGrataName = (name?: string | null): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[țţ]/g, "t")
    .replace(/[șş]/g, "s")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const normalizeNonGrataWordSignature = (name?: string | null): string => {
  const norm = normalizeNonGrataName(name);
  if (!norm) return "";
  return norm.split(/\s+/).filter(Boolean).sort().join(" ");
};

export const normalizeNonGrataPhone = (phone?: string | null): string => {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0040") && digits.length > 10) {
    digits = "0" + digits.slice(4);
  } else if (digits.startsWith("40") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  } else if (
    digits.length === 9 &&
    (digits.startsWith("7") || digits.startsWith("2") || digits.startsWith("3"))
  ) {
    digits = "0" + digits;
  }
  return digits;
};

export interface NonGrataLookupInput {
  patientName?: string | null;
  patientPhone?: string | null;
  patientCnp?: string | null;
}

export const findNonGrataMatch = (
  list: NonGrataPatient[],
  target?: NonGrataLookupInput | null,
): NonGrataPatient | null => {
  if (!list || list.length === 0 || !target) return null;

  const cleanCnp = (target.patientCnp || "").replace(/\D/g, "").trim();
  const cleanPhone = normalizeNonGrataPhone(target.patientPhone);
  const cleanName = normalizeNonGrataName(target.patientName);
  const targetSig = normalizeNonGrataWordSignature(target.patientName);

  // 1. Exact CNP match
  if (cleanCnp.length >= 6) {
    const byCnp = list.find(
      (entry) =>
        (entry.patientCnp || "").replace(/\D/g, "").trim() === cleanCnp,
    );
    if (byCnp) return byCnp;
  }

  // 2. Normalized Phone match (if >= 6 digits)
  if (cleanPhone.length >= 6) {
    const byPhone = list.find((entry) => {
      const ePhone = normalizeNonGrataPhone(
        entry.normalizedPhone || entry.patientPhone,
      );
      if (!ePhone || ePhone.length < 6) return false;
      if (ePhone === cleanPhone) return true;
      if (
        ePhone.length >= 9 &&
        cleanPhone.length >= 9 &&
        ePhone.slice(-9) === cleanPhone.slice(-9)
      ) {
        return true;
      }
      return false;
    });
    if (byPhone) return byPhone;
  }

  // 3. Exact or word-reordered Name match (diacritics-insensitive, requires at least 2 chars)
  if (cleanName.length >= 2) {
    const byName = list.find((entry) => {
      const eName = normalizeNonGrataName(
        entry.normalizedName || entry.patientName,
      );
      if (!eName) return false;
      if (eName === cleanName) return true;
      if (targetSig && targetSig === normalizeNonGrataWordSignature(entry.patientName)) {
        return true;
      }
      return false;
    });
    if (byName) return byName;
  }

  return null;
};

export const filterNonGrataByQuery = (
  list: NonGrataPatient[],
  rawQuery: string,
): NonGrataPatient[] => {
  const q = rawQuery.trim();
  if (!q || q.length < 2 || !list || list.length === 0) return [];

  const qNorm = normalizeNonGrataName(q);
  const qTokens = qNorm.split(/\s+/).filter(Boolean);
  const qDigits = normalizeNonGrataPhone(q);
  const rawDigits = q.replace(/\D/g, "");

  return list.filter((entry) => {
    const eName = normalizeNonGrataName(entry.normalizedName || entry.patientName);
    const ePhone = normalizeNonGrataPhone(entry.normalizedPhone || entry.patientPhone);
    const eCnp = (entry.patientCnp || "").replace(/\D/g, "");

    const nameMatch =
      qTokens.length > 0 && qTokens.every((token) => eName.includes(token));
    const phoneMatch =
      (rawDigits.length >= 3 && ePhone.includes(rawDigits)) ||
      (qDigits.length >= 3 && ePhone.includes(qDigits));
    const cnpMatch = rawDigits.length >= 3 && eCnp.includes(rawDigits);

    return nameMatch || phoneMatch || cnpMatch;
  });
};
