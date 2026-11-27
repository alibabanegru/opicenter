import { normalizeDiacritics } from "../appConstants";

export const DOC_TYPE_LABELS: Record<string, string> = {
  adeverinta: "Adeverință Medicală",
  referat: "Referat Medical",
  raport: "Raport Medical",
  certificat: "Certificat medical A5",
  expertiza: "Examen Expertiză Medicală",
};

export const getMedicalDocumentTypeLabel = (rawType?: string | null): string => {
  if (!rawType) return "Document Medical";
  const key = String(rawType).trim().toLowerCase();
  return DOC_TYPE_LABELS[key] || String(rawType).trim() || "Document Medical";
};

const normalizeNameForDocMatch = (name?: string | null): string => {
  if (!name) return "";
  return normalizeDiacritics(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getWordSignatureForDocMatch = (name?: string | null): string => {
  const clean = normalizeNameForDocMatch(name);
  if (!clean) return "";
  return clean.split(/\s+/).filter(Boolean).sort().join(" ");
};

const normalizePhoneForDocMatch = (phone?: string | null): string => {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
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

const phonesMatch = (p1: string, p2: string): boolean => {
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  if (p1.length >= 9 && p2.length >= 9 && p1.slice(-9) === p2.slice(-9)) {
    return true;
  }
  return false;
};

export interface PatientDocMatchTarget {
  id?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
  patientCnp?: string | null;
  patientBirthDate?: string | null;
}

export const doesMedicalDocumentBelongToPatient = (
  docItem: any,
  target?: PatientDocMatchTarget | null,
): boolean => {
  if (!docItem || docItem.isDeleted || !target) return false;

  const fv = docItem.formValues || {};

  const docCnp = String(
    docItem.patientCnp || fv.patientCnp || fv.cnp || "",
  )
    .replace(/\D/g, "")
    .trim();
  const targetCnp = String(target.patientCnp || "")
    .replace(/\D/g, "")
    .trim();

  // 1. If both have valid CNP, it is definitive
  if (targetCnp.length >= 6 && docCnp.length >= 6) {
    return targetCnp === docCnp;
  }

  // 2. Exact record ID match
  const targetId = String(target.id || "").trim();
  const docPatientId = String(docItem.patientId || "").trim();
  if (targetId && docPatientId && targetId === docPatientId) {
    return true;
  }

  // 3. Birth date conflict check (prevents mixing homonyms with different DOB)
  const docBirth = String(
    docItem.patientBirthDate || fv.patientBirthDate || fv.birthDate || "",
  ).trim();
  const targetBirth = String(target.patientBirthDate || "").trim();
  if (targetBirth && docBirth && targetBirth !== docBirth) {
    return false;
  }

  // 4. Name match (diacritic-insensitive + hyphen/word-order safe)
  const rawDocName =
    docItem.patientName ||
    fv.patientName ||
    [fv.lastName, fv.firstName].filter(Boolean).join(" ");
  const docNameNorm = normalizeNameForDocMatch(rawDocName);
  const targetNameNorm = normalizeNameForDocMatch(target.patientName);

  if (!docNameNorm || !targetNameNorm) return false;

  const docSig = getWordSignatureForDocMatch(rawDocName);
  const targetSig = getWordSignatureForDocMatch(target.patientName);
  const isNameMatch =
    docNameNorm === targetNameNorm ||
    (docSig.length >= 3 && docSig === targetSig);

  if (!isNameMatch) return false;

  // Same normalized name + same birthDate -> guaranteed match even if phone changed
  if (targetBirth && docBirth && targetBirth === docBirth) {
    return true;
  }

  // Phone verification: match if phone matches OR either side has no phone
  const docPhone = normalizePhoneForDocMatch(
    docItem.patientPhone || fv.patientPhone,
  );
  const targetPhone = normalizePhoneForDocMatch(target.patientPhone);

  if (!targetPhone || !docPhone) return true;
  return phonesMatch(targetPhone, docPhone);
};

export interface ExtractedMedicalDocumentDetails {
  docTypeLabel: string;
  docDate: string;
  diagnostic?: string;
  treatment?: string;
  recomandari?: string;
  concluzii?: string;
  servesTo?: string;
  recoveryPlan?: string;
  recoveryPrognosis?: string;
  exOftalmologic?: string;
}

const joinNonEmptyLines = (parts: Array<string | undefined | null>): string | undefined => {
  const unique = Array.from(
    new Set(
      parts
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter(Boolean),
    ),
  );
  return unique.length > 0 ? unique.join(" | ") : undefined;
};

export const extractMedicalDocumentSummaryDetails = (
  docItem: any,
): ExtractedMedicalDocumentDetails => {
  const fv = docItem?.formValues || docItem || {};
  const docTypeLabel = getMedicalDocumentTypeLabel(docItem?.type);

  let docDate = docItem?.date || docItem?.createdAt || "";
  if (!docDate && fv.eliberatZi && fv.eliberatAn) {
    const zi = String(fv.eliberatZi).padStart(2, "0");
    const luna = String(fv.eliberatLuna || "01").padStart(2, "0");
    docDate = `${zi}.${luna}.${fv.eliberatAn}`;
  }
  if (!docDate) {
    docDate = new Date().toISOString();
  }

  const diagnostic = joinNonEmptyLines([
    fv.diagnostic,
    docItem?.diagnostic,
    fv.diagnosticFunctional,
    fv.diag,
    fv.diagOd ? `OD: ${fv.diagOd}` : undefined,
    fv.diagOs ? `OS: ${fv.diagOs}` : undefined,
  ]);

  const treatment = joinNonEmptyLines([
    fv.treatment,
    docItem?.treatment,
    fv.tratament,
    fv.clinicalTreatment,
  ]);

  const recomandari = joinNonEmptyLines([
    fv.recomandari,
    docItem?.recomandari,
    fv.recomandare,
    fv.recomandariOd ? `OD: ${fv.recomandariOd}` : undefined,
    fv.recomandariOs ? `OS: ${fv.recomandariOs}` : undefined,
  ]);

  const concluzii = joinNonEmptyLines([
    fv.concluzii,
    docItem?.concluzii,
    fv.examinationInterpretation,
    fv.observations,
    docItem?.observations,
  ]);

  const servesTo = joinNonEmptyLines([
    fv.servesTo,
    fv.motivTrimitere,
    fv.motiveScutire,
    fv.scutire,
  ]);

  const exOftalmologic = joinNonEmptyLines([
    fv.exOftalmologic,
    fv.onsetAndEvolution,
  ]);

  return {
    docTypeLabel,
    docDate,
    diagnostic,
    treatment,
    recomandari,
    concluzii,
    servesTo,
    recoveryPlan:
      typeof fv.recoveryPlan === "string" && fv.recoveryPlan.trim()
        ? fv.recoveryPlan.trim()
        : undefined,
    recoveryPrognosis:
      typeof fv.recoveryPrognosis === "string" && fv.recoveryPrognosis.trim()
        ? fv.recoveryPrognosis.trim()
        : undefined,
    exOftalmologic,
  };
};
