import React, { useMemo, useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInDays, differenceInYears } from "date-fns";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  CloudLightning,
  Droplets,
  CloudSnow,
  CloudFog,
  CloudDrizzle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export const MONTHS_RO = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export let globalDbErrorHandler: ((err: string) => void) | null = null;
let lastQuotaLogTime = 0;

export function setGlobalDbErrorHandler(handler: ((err: string) => void) | null) {
  globalDbErrorHandler = handler;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const lowerMsg = errMsg.toLowerCase();
  const isQuotaOrRateLimit =
    lowerMsg.includes("quota") ||
    lowerMsg.includes("rate") ||
    lowerMsg.includes("exhausted") ||
    lowerMsg.includes("limit") ||
    lowerMsg.includes("429") ||
    lowerMsg.includes("exceeded") ||
    lowerMsg.includes("resource");
  const now = Date.now();

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (!isQuotaOrRateLimit || now - lastQuotaLogTime > 180000) {
    if (isQuotaOrRateLimit) lastQuotaLogTime = now;
    console.warn("Firestore Notice: ", JSON.stringify(errInfo));
  }

  // Only trigger global modal/banner for actual non-rate-limit operational errors
  // Quota and rate-limit are handled transparently by Firestore localCache (IndexedDB)
  if (globalDbErrorHandler && !isQuotaOrRateLimit) {
    globalDbErrorHandler(errInfo.error);
  }

  // Do not throw fatal uncaught exceptions for Quota/Rate limit exceeded, offline or network errors
  // Firestore localCache (IndexedDB) continues serving stored application data gracefully
  if (
    isQuotaOrRateLimit ||
    lowerMsg.includes("offline") ||
    lowerMsg.includes("unavailable") ||
    lowerMsg.includes("network") ||
    lowerMsg.includes("timeout")
  ) {
    return;
  }

  console.error("Firestore Error handled without crash:", errMsg);
}

// Capitalize each word and remove numbers
export const capitalizeWords = (str: string) => {
  return str
    .replace(/[0-9]/g, "")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Unified helper for Romanian characters and other PDF-safe normalization
export const normalizeForPDF = (text: string | undefined): string => {
  if (!text) return "";
  return text
    .replace(/ă/g, "a")
    .replace(/Ă/g, "A")
    .replace(/â/g, "a")
    .replace(/Â/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/ș/g, "s")
    .replace(/Ș/g, "S")
    .replace(/ț/g, "t")
    .replace(/Ț/g, "T")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ţ/g, "t")
    .replace(/Ţ/g, "T")
    .replace(/♂/g, "(M)")
    .replace(/♀/g, "(F)")
    .replace(/🎂/g, "")
    .replace(/🎈/g, "")
    .replace(/🎉/g, "")
    .replace(/✨/g, "");
};

export const checkEmailPermissionForAccount = (
  user: any,
  googleEmail: string | null | undefined,
): { allowed: boolean; message?: string } => {
  const role: string = user?.role || "";
  const id: string = user?.id || "";
  const name: string = user?.name || "";

  // TV display and Reception staff can log in directly with account password
  if (role === "tv" || id === "tv" || role === "frontdesk" || id === "receptie") {
    return { allowed: true };
  }

  if (!googleEmail) {
    return {
      allowed: false,
      message: "Trebuie să fiți în prealabil conectat cu un cont Google.",
    };
  }
  const email = googleEmail.toLowerCase().trim();

  // alibabamosu@gmail.com has total access to everything
  if (email === "alibabamosu@gmail.com") {
    return { allowed: true };
  }

  if (role === "admin" || id === "admin") {
    const allowedAdmins = [
      "optinoemaster@yahoo.com",
      "optinoemaster@gmail.com",
      "negreanuovidiu@gmail.com",
      "lil_liviaa@yahoo.com",
      "electrioad@gmail.com",
      "alibabamosu@gmail.com",
      "puliverzilamuje@gmail.com",
      "spiderboy011985@gmail.com",
    ];
    if (!allowedAdmins.includes(email)) {
      return {
        allowed: false,
        message: `Adresa de email (${googleEmail}) cu care v-ați conectat nu are acces la acest cont.`,
      };
    }
  }

  if (
    role === "doctor1" ||
    id === "turcanu" ||
    name.toLowerCase().includes("turcanu")
  ) {
    const allowedTurcanu = [
      "irina.turcanu.dr@gmail.com",
      "alibabamosu@gmail.com",
    ];
    if (!allowedTurcanu.includes(email)) {
      return {
        allowed: false,
        message: `Adresa de email (${googleEmail}) cu care v-ați conectat nu are acces la acest cont.`,
      };
    }
  }

  if (
    role === "doctor2" ||
    id === "zorila" ||
    name.toLowerCase().includes("zorila")
  ) {
    const allowedZorila = [
      "cristina_zorila@yahoo.com",
      "alibabamosu@gmail.com",
    ];
    if (!allowedZorila.includes(email)) {
      return {
        allowed: false,
        message: `Adresa de email (${googleEmail}) cu care v-ați conectat nu are acces la acest cont.`,
      };
    }
  }

  if (
    role === "doctor3" ||
    id === "ilie" ||
    name.toLowerCase().includes("larisa") ||
    name.toLowerCase().includes("ilie")
  ) {
    const allowedIlie = ["laryssa1907@yahoo.com", "alibabamosu@gmail.com"];
    if (!allowedIlie.includes(email)) {
      return {
        allowed: false,
        message: `Adresa de email (${googleEmail}) cu care v-ați conectat nu are acces la acest cont.`,
      };
    }
  }

  return { allowed: true };
};

export const vertexCompensation = (
  powerStr: string,
  distance: number = 0.012,
): string => {
  let val = powerStr.trim();
  if (!val) return "";
  const p = parseFloat(val);
  if (isNaN(p)) return powerStr;
  if (Math.abs(p) < 4) return powerStr;
  const compensated = p / (1 - distance * p);
  // Round to nearest 0.25
  const rounded = Math.round(compensated * 4) / 4;
  const sign = rounded >= 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}`;
};

export const normalizeDiacritics = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[țȚţŢ]/g, (c) => (c === "Ț" || c === "Ţ" ? "T" : "t"))
    .replace(/[șȘşŞ]/g, (c) => (c === "Ș" || c === "Ş" ? "S" : "s"))
    .replace(/[ăĂ]/g, (c) => (c === "Ă" ? "A" : "a"))
    .replace(/[âÂ]/g, (c) => (c === "Â" ? "A" : "a"))
    .replace(/[îÎ]/g, (c) => (c === "Î" ? "I" : "i"));
};

export const normalizeNameWords = (n: string): string[] => {
  const normalized = normalizeDiacritics(n).toLowerCase().trim();
  return normalized
    .replace(/[-_//\\+]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
};

/**
 * Searches for a query string anywhere within a patient name.
 * Supports:
 * - Substring matching inside any part of the name (e.g. "escu" -> "Popescu", "dan" -> "Bogdan")
 * - Diacritic insensitivity (e.g. "stefan" -> "Ștefan", "parvan" -> "Pârvan")
 * - Multi-word / token search in any order (e.g. "dan popa" -> "Popa Bogdan")
 * - Punctuation/hyphen normalization (e.g. "popa-radu" -> "Popa Radu")
 */
export const matchPatientName = (
  patientName: string | undefined | null,
  query: string | undefined | null,
): boolean => {
  if (!query || !query.trim()) return true;
  if (!patientName || !patientName.trim()) return false;

  const normPatient = normalizeDiacritics(patientName)
    .toLowerCase()
    .replace(/[-_//\\+.,]/g, " ")
    .trim();
  const normQuery = normalizeDiacritics(query)
    .toLowerCase()
    .replace(/[-_//\\+.,]/g, " ")
    .trim();

  if (!normQuery) return true;

  // Direct substring match anywhere in the name
  if (normPatient.includes(normQuery)) return true;

  // Multi-word / token matching in any order
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length > 0) {
    return queryTokens.every((token) => normPatient.includes(token));
  }

  return false;
};

// Types
export type Role =
  | "admin"
  | "doctor1"
  | "doctor2"
  | "doctor3"
  | "doctor4"
  | "doctor5"
  | "frontdesk"
  | "seller"
  | "patient"
  | "tv";

export interface UserProfile {
  uid: string;
  displayName: string;
  role: Role;
  color: string;
  email?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientAge: number;
  patientBirthDate?: string;
  patientPhone: string;
  patientNotes?: string;
  patientSex?: "M" | "F" | "";
  doctorId: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: "scheduled" | "cancelled" | "pending_validation";
  isControl?: boolean;
  isConsultComplet?: boolean;
  isGratis?: boolean;
  patientCnp?: string;
  createdAt?: string;
  age?: number | null;
  allMentions?: string[];
  isFromHistoryOnly?: boolean;
  patientEmail?: string;
  isOnline?: boolean;
  ignoreSeen?: boolean;
  forceSeen?: boolean;
}

export interface EyePrescription {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
  pd: string;
  prism?: string;
  base?: string;
  va_without?: string; // Visual acuity without correction
  va_with?: string; // Visual acuity with correction
  near_sph?: string;
  near_cyl?: string;
  near_axis?: string;
  radius?: string;
  brand?: string;
}

export interface ContactLensPrescription {
  sph: string;
  cyl: string;
  axis: string;
  base: string; // Base / BC
  radius: string; // Radius / DIA
  brand: string;
  wearingType?: string;
}

export interface GlassesOrder {
  orderNumber: string;
  orderType?: "distance" | "near" | "both" | "contact_lens" | "progressive_bifocal";
  frameCode: string;
  framePrice: number;
  lensRightName: string;
  lensRightPrice: number;
  lensLeftName: string;
  lensLeftPrice: number;
  cl_od?: EyePrescription;
  cl_os?: EyePrescription;
  laborPrice: number;
  diverseName?: string;
  diversePrice?: number;
  nearLensRightName?: string;
  nearLensRightPrice?: number;
  nearLensLeftName?: string;
  nearLensLeftPrice?: number;
  nearLaborPrice?: number;
  nearFrameCode?: string;
  nearFramePrice?: number;
  nearIsUrgent?: boolean;
  total: number;
  advance: number;
  balance: number;
  deliveryDate: string;
  nearDeliveryDate?: string;
  isUrgent: boolean;
  createdAt: string;
  note?: string;
  status?: "pending" | "completed" | "in-progress" | "ready_for_pickup";
  stockDeducted?: boolean;
  stockDeductedFrames?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  sellerId?: string;
  sellerName?: string;
  whatsappNotifiedAt?: string;
  whatsappNotifiedBy?: string;
  deliveredAt?: string;
  deliveredBy?: string;
  balanceCollectedAt?: string;
  balanceCollectedBy?: string;
  dp?: string;
  dp_od?: string;
  dp_os?: string;
  nearDp?: string;
  nearDp_od?: string;
  nearDp_os?: string;
  frameShape?: number;
  frameDeformsList?: string;
  frameDeformX?: number;
  frameDeformY?: number;
  frameDeformAngle?: number;
  frameRotation?: number;
  frameType?: "full" | "groove" | "drill" | "";
  lensWidth?: string;
  lensHeight?: string;
  bridgeSize?: string;
  bridgeAngle?: number;
  fittingHeight_od?: string;
  fittingHeight_os?: string;
  lensDiameter?: string;
  nearFrameShape?: number;
  nearFrameDeformsList?: string;
  nearFrameDeformX?: number;
  nearFrameDeformY?: number;
  nearFrameDeformAngle?: number;
  nearFrameRotation?: number;
  nearFrameType?: "full" | "groove" | "drill" | "";
  nearLensWidth?: string;
  nearLensHeight?: string;
  nearBridgeSize?: string;
  nearBridgeAngle?: number;
  nearFittingHeight_od?: string;
  nearFittingHeight_os?: string;
  nearLensDiameter?: string;
  lensType?: string;
  lensStyle?: "progressive" | "bifocal" | "";
  nearLensStyle?: "progressive" | "bifocal" | "";
  lensMaterial?: string;
  lensTreatment?: string;
  lensHeliomat?: string;
  prescriptionDate?: string;
  od?: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    prism?: string;
    base?: "NAZAL" | "TEMPORAL" | "SUS" | "JOS" | "";
  };
  os?: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    prism?: string;
    base?: "NAZAL" | "TEMPORAL" | "SUS" | "JOS" | "";
  };
  nearOd?: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    prism?: string;
    base?: "NAZAL" | "TEMPORAL" | "SUS" | "JOS" | "";
  };
  nearOs?: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    prism?: string;
    base?: "NAZAL" | "TEMPORAL" | "SUS" | "JOS" | "";
  };
}

export interface FrameStockItem {
  id: string;
  code: string;
  brand: string;
  manufacturer?: string;
  category?: string;
  quantity: number;
  price?: number;
  location?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Examinations {
  control: string;
  consultatieCompleta: string;
  topografieOculara: string;
  oct: string;
  campVizual: string;
  ecografieOculara: string;
  refractometriePediatrica: string;
  testSchirmer: boolean;
  biometrie: string;
  gonioscopieAplanotonometrie: string;
  pahimetrie: string;
  sondajCaiLacrimale: string;
  iridotomieLaser: string;
  capsulotomieLaser: string;
  slt: string;
}

export interface Cycloplegia {
  enabled: boolean;
  od: { sph: string; cyl: string; axis: string };
  os: { sph: string; cyl: string; axis: string };
}

export interface PrescriptionHistoryItem {
  date: string; // ISO
  doctorId?: string;
  od: EyePrescription;
  os: EyePrescription;
  dp: string;
  dp_od?: string;
  dp_os?: string;
  dp_aproape?: string;
  dp_aproape_od?: string;
  dp_aproape_os?: string;
  specialMentions: string;
  treatment?: string;
  diagnostic?: string;
  recomandari?: string;
  symptoms?: string;
  history?: string;
  onsetAndEvolution?: string;
  recentHospitalizations?: string;
  clinicalTreatment?: string;
  dependencyStatus?: string;
  mobilityStatus?: string;
  recoveryPlan?: string;
  recoveryPrognosis?: string;
  medications?: string;
  iop?: { od: string; os: string };
  correctedIop?: { od: string; os: string };
  pachymetry?: { od: string; os: string };
  axialLength?: { od: string; os: string };
  anteriorSegment?: { od: string; os: string };
  posteriorSegment?: { od: string; os: string };
  otherEyeDiseases?: string;
  scutire?: string;
  keratometry?: {
    od: string;
    os: string;
    od_k1?: string;
    od_k2?: string;
    os_k1?: string;
    os_k2?: string;
  };
  examinations?: Examinations;
  examinationInterpretation?: string;
  lensType?: string;
  lensMaterial?: string;
  lensTreatment?: string;
  lensHeliomat?: string;
  heliomat_od?: boolean;
  heliomat_os?: boolean;
  progresiv_od?: boolean;
  progresiv_os?: boolean;
  bifocal_od?: boolean;
  bifocal_os?: boolean;
  degresiv_od?: boolean;
  degresiv_os?: boolean;
  cycloplegia?: Cycloplegia;
  nonCycloplegic?: Cycloplegia;
  cl_od?: ContactLensPrescription;
  cl_os?: ContactLensPrescription;
  isControl?: boolean;
  isGratis?: boolean;
  isConsultComplet?: boolean;
}

export interface WeatherData {
  current: {
    temp: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
  };
  daily: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
  };
  hourly: {
    time: string[];
    temp: number[];
    weatherCode: number[];
  };
}

export interface MedicalRecord {
  id: string; // patientName + patientPhone
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientBirthDate?: string;
  patientCnp?: string;
  patientAddress?: string; // Legacy field
  patientJudet?: string;
  patientLocalitate?: string;
  patientStrada?: string;
  patientBloc?: string;
  patientScara?: string;
  patientApartament?: string;
  patientSeries?: string;
  patientNumber?: string;
  patientStreetNumber?: string;
  occupation?: string;
  institution?: string;
  scutire?: string;
  cl_od?: ContactLensPrescription;
  cl_os?: ContactLensPrescription;
  od: EyePrescription; // Right eye
  os: EyePrescription; // Left eye
  dp: string; // Single DP field
  dp_od?: string;
  dp_os?: string;
  dp_aproape?: string;
  dp_aproape_od?: string;
  dp_aproape_os?: string;
  treatment: string;
  diagnostic?: string;
  recomandari?: string;
  symptoms?: string;
  history?: string;
  onsetAndEvolution?: string;
  recentHospitalizations?: string;
  clinicalTreatment?: string;
  dependencyStatus?: string;
  mobilityStatus?: string;
  recoveryPlan?: string;
  recoveryPrognosis?: string;
  medications?: string;
  iop?: { od: string; os: string };
  correctedIop?: { od: string; os: string };
  pachymetry?: { od: string; os: string };
  anteriorSegment?: { od: string; os: string };
  anteriorSegmentAo?: boolean;
  posteriorSegment?: { od: string; os: string };
  posteriorSegmentAo?: boolean;
  specialMentions: string;
  keratometry?: {
    od: string;
    os: string;
    od_k1?: string;
    od_k2?: string;
    os_k1?: string;
    os_k2?: string;
  };
  axialLength?: { od: string; os: string };
  examinations?: Examinations;
  examinationInterpretation?: string;
  otherEyeDiseases?: string;
  patientSex?: "M" | "F" | "";
  lensType?: string;
  lensMaterial?: string;
  lensTreatment?: string;
  lensHeliomat?: string;
  heliomat_od?: boolean;
  heliomat_os?: boolean;
  progresiv_od?: boolean;
  progresiv_os?: boolean;
  bifocal_od?: boolean;
  bifocal_os?: boolean;
  degresiv_od?: boolean;
  degresiv_os?: boolean;
  glassesOrder?: GlassesOrder;
  orderHistory?: GlassesOrder[];
  prescriptionHistory?: PrescriptionHistoryItem[];
  axialLengthHistory?: { date: string; od?: string; os?: string; age?: number; note?: string }[];
  gdprSigned?: boolean;
  gdprSignature?: string; // base64
  gdprSignedAt?: string;
  createdAt?: string;
  updatedAt: string;
  doctorId?: string;
  doctorName?: string;
  cycloplegia?: Cycloplegia;
  nonCycloplegic?: Cycloplegia;
  isControl?: boolean;
  isGratis?: boolean;
  isConsultComplet?: boolean;
}

export interface ClinicConfig {
  logoUrl: string;
  secondaryLogoUrl?: string;
  inactivityTimeoutMinutes?: number;
}

export interface DayConfig {
  startHour: number;
  endHour: number;
  intervalMinutes: number;
  isAvailable: boolean;
}

export interface CustomDateConfig {
  date: string; // ISO strings (YYYY-MM-DD)
  startHour: number;
  endHour: number;
  intervalMinutes: number;
}

export interface ScheduleConfig {
  id: string;
  doctorId: string;
  dayConfigs: Record<number, DayConfig>; // 0-6 (Sun-Sat)
  blockedDates?: string[]; // ISO strings (YYYY-MM-DD)
  activeSaturdays?: string[]; // ISO strings (YYYY-MM-DD)
  customActiveDates?: CustomDateConfig[]; // Specific custom unique dates with individual start/end/interval
}

export const DOCTOR_ROLES: Role[] = [
  "doctor1",
  "doctor2",
  "doctor3",
  "doctor4",
  "doctor5",
];

export const useActiveDoctorRoles = (availableUsers: any[]) => {
  return useMemo(() => {
    const roles: Role[] = [];
    availableUsers.forEach((u) => {
      if (
        DOCTOR_ROLES.includes(u.role as Role) &&
        !roles.includes(u.role as Role)
      ) {
        roles.push(u.role as Role);
      }
    });
    return roles;
  }, [availableUsers]);
};
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  doctor1: "Medic",
  doctor2: "Medic",
  doctor3: "Medic",
  doctor4: "Medic",
  doctor5: "Medic",
  frontdesk: "Recepție",
  seller: "Vânzător",
  patient: "Pacient",
  tv: "TV",
};

export const SYMPTOM_OPTIONS = [
  "Schimbarea de ochelari",
  "Prescriptie Lentile de contact",
  "Vedere incetosata",
  "Scaderea acuitatii vizuale la aproape",
  "Scaderea acuitatii vizuale la distanta",
  "Durere de cap (cefalee)",
  "Durere oculara",
  "Senzatie de corp strain in ochi",
  "Ochi rosii",
  "Lacrimare excesiva",
  "Mancarime oculara",
  "Secretii oculare",
  "Uscaciune oculara",
  "Umflarea ploapei/lor",
  "Cadetea ploapei (ptoza)",
  "Aparitia unor pete negre plutitoare (musculite zburătoare)",
  "Fulgeratii luminoase (fotopsii)",
  "Dificultati de focalizare",
  "Oboseala oculara(astenopie)",
  "Halouri in jurul luminilor",
  "Dificultati la diferentierea culorilor",
  "Traumatisme oculare sau suspiciune de corp strain cornean",
  "Necesitatea apropierii excesive de obiecte (carti, ecrane)",
  "Clipit excesiv (blefarospasm)",
];

export const DEFAULT_DIAGNOSTICS = [
  "Miopie (diagnostic CIM - H52.1)",
  "Astigmatism (diagnostic CIM - H52.2)",
  "Hipermetropie (diagnostic CIM - H52.0)",
  "Presbiopie (diagnostic CIM - H52.4)",
  "Anizometropie (diagnostic CIM - H52.3)",
  "Spasm de acomodare (diagnostic CIM - H52.51)",
  "Pareză de acomodare (diagnostic CIM - H52.52)",
  "Tulburări de acomodare (diagnostic CIM - H52.5)",
  "Alte vicii de refracție (diagnostic CIM - H52.6)",
  "Viciu de refracție, nespecificat (diagnostic CIM - H52.7)",
  "Miopie degenerativă (diagnostic CIM - H44.2)",
  "Cataractă senilă (diagnostic CIM - H25.9)",
  "Glaucom primitiv cu unghi deschis (diagnostic CIM - H40.1)",
  "Glaucom secundar (diagnostic CIM - H40.5)",
  "Conjunctivită acută (diagnostic CIM - H10.1)",
  "Blefarită cronică (diagnostic CIM - H01.0)",
  "Degenerescență maculară (DMLV) (diagnostic CIM - H35.3)",
  "Sindrom de ochi uscat (diagnostic CIM - H04.1)",
  "Chalazion acut (diagnostic CIM - H00.1)",
  "Hordeolum (Ulcior) (diagnostic CIM - H00.0)",
  "Pterigion (diagnostic CIM - H11.0)",
  "Pingueculă (diagnostic CIM - H11.1)",
];

export const DEFAULT_RECOMMENDATIONS = [
  "Purtarea permanentă a ochelarilor recomandați.",
  "Purtarea ochelarilor doar la citit și lucrul de aproape.",
  "Purtarea ochelarilor doar la distanță (stradă, TV, condus-dacă este cazul).",
  "Măsurarea tensiunii arteriale.",
  "Urmărirea tensiunii intraoculare la 6 luni.",
  "Tratament antiseptic și hialuronat de sodiu (picături de 3-4 ori/zi).",
  "Evitarea expunerii prelungite la ecrane fără pauze (regula 20-20-20).",
  "Revenire la control peste 6 luni sau la nevoie în caz de urgență.",
  "Purtarea ochelarilor de soare cu filtru UV polarizat.",
  "Igiena zilnică a pleoapelor cu șervețele sterile.",
];

export const DEFAULT_ANTERIOR_SEGMENT = [
  "Relații anatomice normale",
  "Conjunctivă curată, normohemica",
  "Cornee transparentă, fără depozite",
  "Cameră anterioară de aspect normal",
  "Pupilă rotundă, reactivă",
  "Cristalin transparent"
];

export const DEFAULT_POSTERIOR_SEGMENT = [
  "Papilă nerv optic cu contur net, colorit roz, excavatie fiziologică",
  "Maculă cu reflex foveolar prezent",
  "Artere și vene de calibru normal, fãră încrucișări patologice",
  "Retină aplicată"
];

export const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-slate-500",
  doctor1: "bg-blue-500",
  doctor2: "bg-purple-500",
  doctor3: "bg-emerald-500",
  doctor4: "bg-rose-500",
  doctor5: "bg-amber-500",
  frontdesk: "bg-orange-500",
  seller: "bg-cyan-500",
  patient: "bg-blue-600",
  tv: "bg-indigo-500",
};

export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const WeatherIcon = ({
  code,
  className,
}: {
  code: number;
  className?: string;
}) => {
  if (code === 0) return <Sun className={className} />;
  if ([1, 2, 3].includes(code)) return <Cloud className={className} />;
  if ([45, 48].includes(code)) return <CloudFog className={className} />;
  if ([51, 53, 55, 56, 57].includes(code))
    return <CloudDrizzle className={className} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain className={className} />;
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return <CloudSnow className={className} />;
  if ([95, 96, 99].includes(code))
    return <CloudLightning className={className} />;
  return <Cloud className={className} />;
};

export const getWeatherDescription = (code: number): string => {
  if (code === 0) return "Senin";
  if (code === 1) return "Preponderent senin";
  if (code === 2) return "Parțial noros";
  if (code === 3) return "Noros";
  if (code === 45) return "Ceață";
  if (code === 48) return "Ceață cu chiciură";
  if (code === 51) return "Burniță ușoară";
  if (code === 53) return "Burniță moderată";
  if (code === 55) return "Burniță densă";
  if (code === 61) return "Ploaie ușoară";
  if (code === 63) return "Ploaie moderată";
  if (code === 65) return "Ploaie puternică";
  if (code === 71) return "Zăpadă ușoară";
  if (code === 73) return "Zăpadă moderată";
  if (code === 75) return "Zăpadă puternică";
  if (code === 80) return "Averse de ploaie ușoare";
  if (code === 81) return "Averse de ploaie moderate";
  if (code === 82) return "Averse de ploaie violente";
  if (code === 95) return "Furtună";
  return "Variabil";
};

export const TREATMENT_CATEGORIES: Record<string, { name: string; full: string }[]> = {
  "Lacrimi artificiale": [
    {
      name: "Lacrisek spray",
      full: "Lacrisek spray (Ambii ochi : 1 pic / 3 ori pe zi sau la nevoie)",
    },
    {
      name: "Thealoz pic",
      full: "Thealoz pic (Ambii ochi 1 pic /3 ori pe zi sau la nevoie)",
    },
    { name: "Blefagel", full: "Blefagel (Ambii ochi : 1 /2 ori )" },
    {
      name: "Thealoz duogel",
      full: "Thealoz duogel (Ambii ochi : 1 x 2 ori )",
    },
    {
      name: "Xailin HA",
      full: "Xailin HA (Ambii ochi 1 pic /3 ori pe zi sau la nevoie)",
    },
    {
      name: "Visuxl",
      full: "Visuxl (Ambii ochi 1 pic /3 ori pe zi sau la nevoie)",
    },
    {
      name: "Xailin Night",
      full: "Xailin Night (Ambii ochi 1 picx2ori pe zi)",
    },
    {
      name: "Xanterdes (nevoie)",
      full: "Xanterdes (Ambii ochi 1 pic /3 ori pe zi sau la nevoie)",
    },
    {
      name: "Dropsept",
      full: "Dropsept (Ambii ochi 1 pic /3 ori pe zi sau la nevoie)",
    },
    {
      name: "Xanterdes (2 sapt)",
      full: "Xanterdes (Ambii ochi 1 pic /3 ori pe zi 2 saptamani)",
    },
    {
      name: "Hylo Gel",
      full: "Hylo Gel (Ambii ochi 1 pic /3 ori pe zi sau la nevoie)",
    },
    {
      name: "Sysane Ultra",
      full: "Systane Ultra (Ambii ochi 1 pic /3 ori pe zi)",
    },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  Antiglaucomatoase: [
    {
      name: "Cosopt",
      full: "Cosopt (Ambii ochi 1 pic /2 ori pe zi - la distanță de 12 ore)",
    },
    { name: "Xalatan", full: "Xalatan (Ambii ochi 1 pic seara)" },
    { name: "Azopt", full: "Azopt (Ambii ochi 1 pic /2 ori pe zi)" },
    { name: "Alphagan", full: "Alphagan (Ambii ochi 1 pic /2 ori pe zi)" },
    { name: "Ganfort", full: "Ganfort (Ambii ochi 1 pic seara)" },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  Miopie: [
    {
      name: "Myoops",
      full: "Myoops ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Mirtilene Puro",
      full: "Mirtilene Puro ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Mirtilene Ginkgo",
      full: "Mirtilene Ginkgo ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Difrarel 100",
      full: "Difrarel 100 ( 1 tableta /2 ori pe zi, 20 zile pe luna, 3 luni)",
    },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  Diabet: [
    {
      name: "MAXIVEN",
      full: "MAXIVEN ( 1 capsula pe zi 30 zile timp de 3 luni).",
    },
    { name: "Ocuvite Adult", full: "Ocuvite Adult ( 1 capsula pe zi)" },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  DMLV: [
    {
      name: "Adrusen Vera",
      full: "Adrusen Vera ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Adruisen Vera",
      full: "Adruisen Vera ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Macuofta Forte",
      full: "Macuofta Forte( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Macuofta",
      full: "Macuofta ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Retaron",
      full: "Retaron ( 1 capsula pe zi 30 zile timp de 6 luni)",
    },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  Miodezopsii: [
    {
      name: "Vireoclar",
      full: "Vireoclar ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
    {
      name: "Vitreoxigen",
      full: "Vitreoxigen ( 1 capsula pe zi 30 zile timp de 3 luni)",
    },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  "Servetele Umede": [
    {
      name: "Blefademodex",
      full: "Blefademodex ( Amandoi ochii :o aplicare de 3 ori pe zii)",
    },
    {
      name: "Ilast Wipes",
      full: "Ilast Wipes (Curățarea pleoapelor dimineața și seara)",
    },
    {
      name: "Sistane Wipes",
      full: "Systane Lid Wipes (Curățarea pleoapelor la nevoie)",
    },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  Antibiotice: [
    {
      name: "Betabioptal picaturi",
      full: "Betabioptal picaturi (Ambii ochi 1 pic /3 ori pe zi)",
    },
    { name: "Netacin", full: "Netacin (Ambii ochi 1 pic /3 ori pe zi)" },
    { name: "Tobradex", full: "Tobradex (Ambii ochi 1 pic /3 ori pe zi)" },
    { name: "Tobrex", full: "Tobrex (Ambii ochi 1 pic /3 ori pe zi)" },
    { name: "Xanternet", full: "Xanternet (1 aplicare 3 ori pe zi 3 zile)" },
    {
      name: "Vigamox",
      full: "Vigamox (Ambii ochi 1 pic /3 ori pe zi, 7 zile)",
    },
    { name: "Oflocet", full: "Oflocet (Ambii ochi 1 pic /4 ori pe zi)" },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  Antiinflamatoare: [
    { name: "Nevanac", full: "Nevanac (Ambii ochi 1 pic /3 ori pe zi)" },
    {
      name: "Indocollyre",
      full: "Indocollyre (Ambii ochi 1 pic /4 ori pe zi)",
    },
    { name: "Dicloabak", full: "Dicloabak (Ambii ochi 1 pic /4 ori pe zi)" },
  ].sort((a, b) => a.name.localeCompare(b.name)),
};

export const TREATMENT_PROTOCOLS: Record<string, string[]> = {
  "Conjunctivită Bacteriană": [
    "Netacin (Ambii ochi 1 pic /4 ori pe zi, 7-10 zile)",
    "Thealoz pic (Ambii ochi 1 pic /3 ori pe zi sau la nevoie)",
  ],
  Blefarită: [
    "Blefademodex (Curățarea marginilor palpebrale dimineața și seara)",
    "Lacrisek spray (Ambii ochi : 1 pic / 3 ori pe zi)",
    "Netacin unguent (Aplicare pe marginea pleoapelor seara, 7 zile)",
  ],
  "Ochi Uscat Sever": [
    "Thealoz duogel (Ambii ochi: 1 pic/3 ori pe zi)",
    "Xailin Night (Ambii ochi înainte de culcare)",
    "Lacrisek spray (La nevoie)",
  ],
  "Profilaxie Post-Op": [
    "Vigamox (Ambii ochi 1 pic /3 ori pe zi, 7 zile)",
    "Nevanac (Ambii ochi 1 pic /3 ori pe zi, 14 zile)",
    "Thealoz pic (La nevoie)",
  ],
  "Corp strain cornean": [
    "Xanternet solutie oftalmica Ds Intern 1 pic x 4ori pe zi  (5-7zile) doar la ochiul care a avut corp strain cornean",
  ],
  "Glaucom (Tratament Inițial)": [
    "Cosopt (Ambii ochi 1 pic /2 ori pe zi)",
    "Thealoz pic (Ambii ochi 1 pic /3 ori pe zi)",
  ],
  "Tratament post laser PCO": [
    "Tratamentul se aplică doar la ochiul care a avut intervenția cu laser YAG post capsulotomie:",
    "Betabioptal sol oftalmică, DS: 1 pic/3 ori pe zi",
    "Yellox sau Nevanac sol oft 1%, DS: 1 pic/3 ori pe zi",
    "Tratamentul se urmează timp de 1 săptămână până la controlul post laser.",
  ],
};

export const TREATMENT_SHORTCUTS: Record<string, string> = {
  B: "betabioptal 1pic/3ori pe zi",
  T: "Trium 1pic 3ori/zi A",
};

export const calculateNearSphereDefault = (
  sph: string | undefined,
  add: string | undefined,
) => {
  const s = parseFloat(String(sph || "0").replace(",", ".")) || 0;
  const a = parseFloat(String(add || "0").replace(",", ".")) || 0;
  if (!add || a === 0) return "-";
  const sum = s + a;
  const sign = sum >= 0 ? "+" : "";
  return sign + sum.toFixed(2);
};

export const getEyeDiag = (eye: EyePrescription, prefix: string) => {
  let sphVal = parseFloat(eye.sph);
  let cylVal = parseFloat(eye.cyl);
  let addVal = eye.add;
  let axisVal = eye.axis;

  const hasSph = !isNaN(sphVal);
  const hasCyl = !isNaN(cylVal) && cylVal !== 0;
  const hasAxis = axisVal && axisVal.trim() !== "" && axisVal !== "0";
  const hasAdd = addVal && addVal !== "";

  if (!hasSph && !hasCyl && !hasAdd) return "";

  const isOD = prefix.toUpperCase().includes("OD");
  const isOS = prefix.toUpperCase().includes("OS");
  const myopiaCode = isOD ? "H52.11" : isOS ? "H52.12" : "H52.1";
  const hyperCode = isOD ? "H52.01" : isOS ? "H52.02" : "H52.0";

  let parts = [];

  if (hasCyl) {
    const s = hasSph ? sphVal : 0;
    const c = cylVal;
    const p1 = s;
    const p2 = s + c;

    if (Math.abs(p1) < 0.01 || Math.abs(p2) < 0.01) {
      const nonZeroMeridian = Math.abs(p1) < 0.01 ? p2 : p1;
      if (nonZeroMeridian < 0) {
        parts.push("Astigmatism miopic simplu (diagnostic CIM - H52.22)");
      } else if (nonZeroMeridian > 0) {
        parts.push("Astigmatism hipermetropic simplu (diagnostic CIM - H52.22)");
      } else {
        parts.push("Emetropie");
      }
    } else {
      if (p1 * p2 < 0) {
        parts.push("Astigmatism mixt (diagnostic CIM - H52.2)");
      } else if (p1 < 0 && p2 < 0) {
        if (sphVal < 0) {
          const absSph = Math.abs(sphVal);
          let severity = "";
          let grad = "";
          if (absSph <= 3) {
            severity = "mică";
            grad = "gr. I";
          } else if (absSph <= 6) {
            severity = "medie";
            grad = "gr. II";
          } else if (absSph <= 9) {
            severity = "mare";
            grad = "gr. III";
          } else {
            severity = "forte";
            grad = "gr. IV";
          }
          const finalMyopiaCode = absSph > 6 ? "H44.2" : myopiaCode;
          parts.push(`Miopie ${severity} (${grad}) (diagnostic CIM - ${finalMyopiaCode}), astigmatism miopic compus (diagnostic CIM - H52.22)`);
        } else {
          parts.push("Astigmatism miopic compus (diagnostic CIM - H52.22)");
        }
      } else if (p1 > 0 && p2 > 0) {
        if (sphVal > 0) {
          const absSph = Math.abs(sphVal);
          let severity = "";
          if (absSph <= 3) severity = "mică";
          else if (absSph <= 6) severity = "medie";
          else if (absSph <= 9) severity = "mare";
          else severity = "forte";
          parts.push(`Hipermetropie ${severity} (diagnostic CIM - ${hyperCode}), astigmatism hipermetropic compus (diagnostic CIM - H52.22)`);
        } else {
          parts.push("Astigmatism hipermetropic compus (diagnostic CIM - H52.22)");
        }
      }
    }
  } else {
    if (hasSph) {
      if (sphVal === 0) {
        if (!hasAxis) {
          parts.push("Emetropie");
        }
      } else {
        const absSph = Math.abs(sphVal);
        let type = sphVal < 0 ? "Miopie" : "Hipermetropie";
        let severity = "";
        if (sphVal < 0) {
          let grad = "";
          if (absSph <= 3) {
            severity = "mică";
            grad = "gr. I";
          } else if (absSph <= 6) {
            severity = "medie";
            grad = "gr. II";
          } else if (absSph <= 9) {
            severity = "mare";
            grad = "gr. III";
          } else {
            severity = "forte";
            grad = "gr. IV";
          }
          const finalMyopiaCode = absSph > 6 ? "H44.2" : myopiaCode;
          parts.push(`Miopie ${severity} (${grad}) (diagnostic CIM - ${finalMyopiaCode})`);
        } else {
          if (absSph <= 3) severity = "mică";
          else if (absSph <= 6) severity = "medie";
          else if (absSph <= 9) severity = "mare";
          else severity = "forte";
          parts.push(`${type} ${severity} (diagnostic CIM - ${hyperCode})`);
        }
      }
    }
  }

  if (hasAdd) {
    parts.push("Presbiopie (diagnostic CIM - H52.4)");
  }

  const vaWithVal = parseFloat(eye.va_with);
  if (!isNaN(vaWithVal)) {
    if (vaWithVal >= 0.5 && vaWithVal <= 0.7) parts.push("Ambliopie usoara (diagnostic CIM - H53.0)");
    else if (vaWithVal >= 0.2 && vaWithVal <= 0.4)
      parts.push("Ambliopie moderata (diagnostic CIM - H53.0)");
    else if (vaWithVal < 0.2) parts.push("Ambliopie severa (diagnostic CIM - H53.0)");
  }

  if (parts.length === 0) return "";
  if (parts.length === 1) return `${prefix}: ${parts[0]}`;

  let fullString = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.toLowerCase().startsWith("astigmatism")) {
      fullString += " cu " + part;
    } else {
      if (i === parts.length - 1) {
        fullString += " si " + part;
      } else {
        fullString += ", " + part; // Still use comma for non-"cu" series unless it's just two items
      }
    }
  }
  // Remove any double commas or commas before "si" just in case
  fullString = fullString.replace(/, si/g, " si");
  return `${prefix}: ${fullString}`;
};

export const appendTreatment = (current: string, item: string) => {
  const header = "Medicamentele se administreaza in ordinea prescrisa :";
  let content = (current || "").trim();

  if (!content.includes(header)) {
    content = header + (content ? "\n" + content : "");
  }

  let lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  // Count existing numbered items
  let itemCount = 0;
  lines.forEach((l) => {
    if (/^\d+\./.test(l)) itemCount++;
  });

  const nextNum = itemCount + 1;
  const newLine = `${nextNum}. ${item}`;

  lines.push(newLine);

  return lines.join("\n");
};

export const updateDiagnosticSuggestions = (
  currentDiag: string,
  od: EyePrescription,
  os: EyePrescription,
) => {
  const odNew = getEyeDiag(od, "OD");
  const osNew = getEyeDiag(os, "OS");

  let lines = (currentDiag || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  const odIdx = lines.findIndex((l) => l.startsWith("OD:"));
  if (odNew) {
    if (odIdx !== -1) lines[odIdx] = odNew;
    else lines.unshift(odNew);
  } else if (odIdx !== -1) {
    lines.splice(odIdx, 1);
  }

  const osIdxNew = lines.findIndex((l) => l.startsWith("OS:"));
  if (osNew) {
    if (osIdxNew !== -1) lines[osIdxNew] = osNew;
    else {
      const odIdxNow = lines.findIndex((l) => l.startsWith("OD:"));
      if (odIdxNow !== -1) lines.splice(odIdxNow + 1, 0, osNew);
      else lines.unshift(osNew);
    }
  } else if (osIdxNew !== -1) {
    lines.splice(osIdxNew, 1);
  }

  // Remove any previous anisometropia mentions to avoid duplicates
  lines = lines.filter((l) => !l.includes("Anizometropie"));

  // Calculate Anizometropie
  const sphOD = parseFloat(od.sph);
  const sphOS = parseFloat(os.sph);

  if (!isNaN(sphOD) && !isNaN(sphOS)) {
    const diff = Math.abs(sphOD - sphOS);
    if (diff >= 1 && diff <= 2) {
      lines.push("Anizometropie mica (diagnostic CIM - H52.3)");
    } else if (diff > 2) {
      lines.push("Anizometropie clinic semnificativă (diagnostic CIM - H52.3)");
    }
  }

  return lines.join("\n");
};

export const validateCNP = (cnp: string): boolean => {
  const clean = cnp.trim();
  if (clean.length !== 13) return false;
  if (!/^\d{13}$/.test(clean)) return false;

  const digits = clean.split("").map(Number);
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 11;
  const controlDigit = remainder === 10 ? 1 : remainder;

  return controlDigit === digits[12];
};

export const getSexFromCNP = (cnp: string): "M" | "F" | null => {
  const clean = cnp.trim();
  if (clean.length === 0) return null;
  const firstDigit = clean.charAt(0);
  if (["1", "3", "5"].includes(firstDigit)) {
    return "M";
  }
  if (["2", "4", "6"].includes(firstDigit)) {
    return "F";
  }
  return null;
};

export const calculateAge = (
  birthDate: string,
  referenceDate: Date = new Date(),
): number | undefined => {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return undefined;
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const m = referenceDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getEstimatedAddByAge = (
  age?: number,
): string | null => {
  if (age === undefined || age === null || isNaN(age) || age < 40) return null;
  if (age < 44) return "+1.00";
  if (age < 47) return "+1.25"; // ex. 45 ani: +1.25
  if (age < 50) return "+1.50";
  if (age < 53) return "+1.75"; // ex. 50 ani: +1.75
  if (age < 57) return "+2.00";
  if (age < 60) return "+2.25"; // ex. 55-58 ani: +2.25
  if (age < 65) return "+2.50"; // 60+ ani: +2.50
  return "+2.50"; // max fiziologic uzual este +2.50 / +2.75
};

export const calculateDetailedAge = (
  birthDate: string,
  referenceDate: Date = new Date(),
): string | undefined => {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return undefined;
  let years = referenceDate.getFullYear() - birth.getFullYear();
  let months = referenceDate.getMonth() - birth.getMonth();

  if (referenceDate.getDate() < birth.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const yearText = years === 1 ? "an" : "ani";
  const monthText = months === 1 ? "lună" : "luni";

  if (years === 0) {
    return `${months}${monthText}`;
  }

  if (months === 0) {
    return `${years}${yearText}`;
  }

  return `${years}${yearText},${months}${monthText}`;
};

export const calculateTurningAge = (
  birthDate?: string,
  patientAge?: number,
  referenceDate: Date = new Date(),
): number | undefined => {
  if (birthDate) {
    const age = calculateAge(birthDate, referenceDate);
    if (age !== undefined) return age + 1;
  }
  if (patientAge !== undefined && patientAge !== null && !isNaN(patientAge) && patientAge > 0) {
    return Number(patientAge) + 1;
  }
  return undefined;
};

export const isValidPhone = (phone: string) => {
  if (!phone) return false;
  let digits = phone.replace(/\D/g, "");

  // Normalize Romanian prefix if started with 40 or 0040
  if (digits.startsWith("40") && digits.length > 10) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0040") && digits.length > 10) {
    digits = digits.slice(4);
  }

  // Prepend 0 if they typed 9 digits starting with 7, 2, 3
  if (
    digits.length === 9 &&
    (digits.startsWith("7") || digits.startsWith("2") || digits.startsWith("3"))
  ) {
    digits = "0" + digits;
  }

  if (digits.length === 10) {
    return true;
  }
  return digits.length >= 10 && digits.length <= 15;
};

export const formatPhoneNumber = (value: string) => {
  if (!value) return "";
  let s = value.replace(/\D/g, "");

  // Normalize Romanian prefix if started with 40 or 0040
  if (s.startsWith("40") && s.length > 10) {
    s = "0" + s.slice(2);
  } else if (s.startsWith("0040") && s.length > 10) {
    s = "0" + s.slice(4);
  }

  const isSpecial =
    s.startsWith("07") || s.startsWith("02") || s.startsWith("03");
  const maxLength = isSpecial ? 10 : 15;
  const digits = s.slice(0, maxLength);

  const groups = [];
  if (digits.length > 0) groups.push(digits.slice(0, 4));
  if (digits.length > 4) groups.push(digits.slice(4, 7));
  if (digits.length > 7) groups.push(digits.slice(7, 10));
  if (digits.length > 10) groups.push(digits.slice(10, 13));
  if (digits.length > 13) groups.push(digits.slice(13, 16));

  return groups.join(" ");
};

export const DEFAULT_EXAMINATIONS: Examinations = {
  control: "",
  consultatieCompleta: "",
  topografieOculara: "",
  oct: "",
  campVizual: "",
  ecografieOculara: "",
  refractometriePediatrica: "",
  testSchirmer: false,
  biometrie: "",
  gonioscopieAplanotonometrie: "",
  pahimetrie: "",
  sondajCaiLacrimale: "",
  iridotomieLaser: "",
  capsulotomieLaser: "",
  slt: "",
};

export const TODAY_STR = new Date().toISOString().split("T")[0];

export const MYOPIA_GIRLS_DATA = [
  {
    age: 6,
    p2: 20.8,
    p5: 21.2,
    p10: 21.5,
    p25: 22.0,
    p50: 22.5,
    p75: 23.0,
    p90: 23.5,
    p95: 23.8,
    p98: 24.2,
  },
  {
    age: 9,
    p2: 21.3,
    p5: 21.8,
    p10: 22.2,
    p25: 22.7,
    p50: 23.2,
    p75: 23.8,
    p90: 24.4,
    p95: 24.8,
    p98: 25.3,
  },
  {
    age: 12,
    p2: 21.6,
    p5: 22.2,
    p10: 22.6,
    p25: 23.1,
    p50: 23.5,
    p75: 24.3,
    p90: 25.0,
    p95: 25.5,
    p98: 26.1,
  },
  {
    age: 15,
    p2: 21.7,
    p5: 22.3,
    p10: 22.7,
    p25: 23.2,
    p50: 23.7,
    p75: 24.6,
    p90: 25.5,
    p95: 26.2,
    p98: 26.8,
  },
  {
    age: 21,
    p2: 21.6,
    p5: 22.2,
    p10: 22.6,
    p25: 23.2,
    p50: 23.8,
    p75: 24.8,
    p90: 25.8,
    p95: 26.5,
    p98: 27.2,
  },
];

export const MYOPIA_BOYS_DATA = [
  {
    age: 6,
    p2: 21.3,
    p5: 21.7,
    p10: 22.0,
    p25: 22.5,
    p50: 23.0,
    p75: 23.5,
    p90: 24.0,
    p95: 24.3,
    p98: 24.7,
  },
  {
    age: 9,
    p2: 21.8,
    p5: 22.3,
    p10: 22.7,
    p25: 23.2,
    p50: 23.7,
    p75: 24.3,
    p90: 24.9,
    p95: 25.3,
    p98: 25.8,
  },
  {
    age: 12,
    p2: 22.1,
    p5: 22.7,
    p10: 23.1,
    p25: 23.6,
    p50: 24.0,
    p75: 24.8,
    p90: 25.5,
    p95: 26.0,
    p98: 26.6,
  },
  {
    age: 15,
    p2: 22.2,
    p5: 22.8,
    p10: 23.2,
    p25: 23.7,
    p50: 24.2,
    p75: 25.1,
    p90: 26.0,
    p95: 26.7,
    p98: 27.3,
  },
  {
    age: 21,
    p2: 22.1,
    p5: 22.7,
    p10: 23.1,
    p25: 23.7,
    p50: 24.3,
    p75: 25.3,
    p90: 26.3,
    p95: 27.0,
    p98: 27.7,
  },
];

export const getExpectedAxialLength = (
  birthDate: string | undefined,
  ageNum: number | undefined,
  sex: string | undefined,
): string => {
  if (!sex) return "23.50";
  const data =
    sex === "M" ? MYOPIA_BOYS_DATA : sex === "F" ? MYOPIA_GIRLS_DATA : null;
  if (!data) return "23.50";

  let ageInYears = ageNum || 0;
  if (birthDate) {
    const birth = new Date(birthDate);
    const diffTime = new Date().getTime() - birth.getTime();
    ageInYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  }

  if (ageInYears <= data[0].age) return data[0].p50.toFixed(2);
  if (ageInYears >= data[data.length - 1].age)
    return data[data.length - 1].p50.toFixed(2);

  for (let i = 0; i < data.length - 1; i++) {
    const d1 = data[i];
    const d2 = data[i + 1];
    if (ageInYears >= d1.age && ageInYears <= d2.age) {
      const fraction = (ageInYears - d1.age) / (d2.age - d1.age);
      const interpolatedAL = d1.p50 + fraction * (d2.p50 - d1.p50);
      return interpolatedAL.toFixed(2);
    }
  }
  return "23.50";
};

export const sanitizeAxialLengthInput = (val: string): string => {
  // Replace comma with dot
  let cleaned = val.replace(",", ".");

  // Allow only digits and a single dot
  let dotCount = 0;
  cleaned = cleaned
    .split("")
    .filter((char) => {
      if (char === ".") {
        dotCount++;
        return dotCount === 1;
      }
      return /[0-9]/.test(char);
    })
    .join("");

  // Limit decimal places to 2
  if (cleaned.includes(".")) {
    const [integerPart, decimalPart] = cleaned.split(".");
    cleaned = `${integerPart}.${decimalPart.slice(0, 2)}`;
  }

  // Prevent values strictly larger than 27.99
  const parsed = parseFloat(cleaned);
  if (!isNaN(parsed) && parsed > 27.99) {
    return "27.99";
  }

  return cleaned;
};

export const validateAxialLengthOnBlur = (val: string): string => {
  const trimmed = val.trim();
  if (!trimmed) return "";

  const parsed = parseFloat(trimmed.replace(",", "."));
  if (isNaN(parsed)) return "";

  if (parsed < 21.0) return "21.00";
  if (parsed > 27.99) return "27.99";

  return parsed.toFixed(2);
};

export const GIRLS_RISK: Record<string, string> = {
  p98: "Risc de miopie 100%, risc de miopie forte 31%",
  p95: "Risc de miopie 100%, risc de miopie forte 16%",
  p90: "Risc de miopie 87%, risc de miopie forte 9%",
  p75: "Risc de miopie 61%, risc de miopie forte 1%",
  p50: "Risc de miopie 33%, fără risc de miopie forte",
  p25: "Risc de miopie 16%, fără risc de miopie forte",
  p10: "Risc de miopie 8%, fără risc de miopie forte",
  p5: "Risc de miopie 4%, fără risc de miopie forte",
  p2: "Fără risc de miopie",
};

export const BOYS_RISK: Record<string, string> = {
  p98: "Risc de miopie 100%, risc de miopie forte 43%",
  p95: "Risc de miopie 94%, risc de miopie forte 16%",
  p90: "Risc de miopie 94%, risc de miopie forte 8%",
  p75: "Risc de miopie 73%, fără risc de miopie forte",
  p50: "Risc de miopie 26%, risc de miopie forte 0.2%",
  p25: "Risc de miopie 12%, risc de miopie forte 0.2%",
  p10: "Risc de miopie 5%, fără risc de miopie forte",
  p5: "Risc de miopie 1%, fără risc de miopie forte",
  p2: "Risc de miopie 2%, fără risc de miopie forte",
};

export const USERS_DATA: Record<string, { name: string; role: Role; pass: string }> = {
  admin: { name: "Administrator Sistem", role: "admin", pass: "123612" },
  turcanu: { name: "Dr. Turcanu Irina", role: "doctor1", pass: "123" },
  zorila: { name: "Dr. Zorila Cristina", role: "doctor2", pass: "123" },
  ilie: { name: "Dr. Ilie Larisa", role: "doctor3", pass: "123" },
  receptie: { name: "Personal Recepție", role: "frontdesk", pass: "123" },
  tv: { name: "TV", role: "tv", pass: "123" },
};

export const getDoctorDisplayName = (docRole: string) => {
  const found = Object.values(USERS_DATA).find((u) => u.role === docRole);
  return found ? found.name : docRole;
};

export const Protractor = ({ axis, color }: { axis: string; color: string }) => {
  const angle = parseInt(axis) || 0;
  const rad = (angle * Math.PI) / 180;

  return (
    <div className="relative w-32 h-16 mb-2">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        {/* Semicircle */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-300"
        />
        {/* Tick marks */}
        {[0, 30, 60, 90, 120, 150, 180].map((tick) => {
          const tickRad = (tick * Math.PI) / 180;
          const x1 = 50 + 35 * Math.cos(tickRad);
          const y1 = 50 - 35 * Math.sin(tickRad);
          const x2 = 50 + 40 * Math.cos(tickRad);
          const y2 = 50 - 40 * Math.sin(tickRad);
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-400"
            />
          );
        })}
        {/* Axis line */}
        <line
          x1="50"
          y1="50"
          x2={50 + 40 * Math.cos(rad)}
          y2={50 - 40 * Math.sin(rad)}
          stroke="red"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Center point */}
        <circle
          cx="50"
          cy="50"
          r="2"
          fill="currentColor"
          className="text-slate-400"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] font-bold text-slate-400 px-1">
        <span>180</span>
        <span>90</span>
        <span>0</span>
      </div>
    </div>
  );
};

export const ROLE_TEXT_COLORS: Record<Role, string> = {
  admin: "text-slate-500",
  doctor1: "text-blue-500",
  doctor2: "text-purple-500",
  doctor3: "text-emerald-500",
  doctor4: "text-rose-500",
  doctor5: "text-amber-500",
  frontdesk: "text-orange-500",
  seller: "text-cyan-500",
  patient: "text-blue-600",
  tv: "text-indigo-500",
};

export const ROLE_PULSE_CLASSES: Record<
  Role,
  { ring: string; bg: string; text: string }
> = {
  admin: {
    ring: "ring-slate-500",
    bg: "bg-slate-500/5 dark:bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
  },
  doctor1: {
    ring: "ring-blue-500",
    bg: "bg-blue-500/5 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  doctor2: {
    ring: "ring-purple-500",
    bg: "bg-purple-500/5 dark:bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
  },
  doctor3: {
    ring: "ring-emerald-500",
    bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  doctor4: {
    ring: "ring-rose-500",
    bg: "bg-rose-500/5 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
  },
  doctor5: {
    ring: "ring-amber-500",
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  frontdesk: {
    ring: "ring-orange-500",
    bg: "bg-orange-500/5 dark:bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
  },
  seller: {
    ring: "ring-cyan-500",
    bg: "bg-cyan-500/5 dark:bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  patient: {
    ring: "ring-blue-600",
    bg: "bg-blue-600/5 dark:bg-blue-600/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  tv: {
    ring: "ring-indigo-500",
    bg: "bg-indigo-500/5 dark:bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

export const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)]),
    );
  }
  return obj;
};

export const CurrencyRow = ({
  currency,
  rate,
  darkMode,
  trend,
  onClickIcon,
}: {
  currency: string;
  rate: number;
  darkMode: boolean;
  trend?: "up" | "down" | "flat";
  onClickIcon?: () => void;
}) => {
  const [currencyValue, setCurrencyValue] = useState<string>("1");
  const [ronValue, setRonValue] = useState<string>(rate.toFixed(4));

  const handleCurrencyChange = (val: string) => {
    setCurrencyValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setRonValue((num * rate).toFixed(4));
    } else {
      setRonValue("");
    }
  };

  const handleRonChange = (val: string) => {
    setRonValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setCurrencyValue((num / rate).toFixed(4));
    } else {
      setCurrencyValue("");
    }
  };

  const getCurrencyName = (code: string) => {
    const names: any = {
      EUR: "Euro",
      USD: "Dolar American",
      GBP: "Lira Sterlină",
      CHF: "Franc Elvețian",
      HUF: "100 Forinți",
      BGN: "Leva Bulgară",
    };
    return names[code] || code;
  };

  return (
    <div
      className={cn(
        "p-6 rounded-[1.5rem] border transition-all hover:shadow-md",
        darkMode
          ? "bg-slate-800 border-slate-700 hover:bg-slate-700/50"
          : "bg-white border-slate-100 hover:bg-white shadow-sm",
      )}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="flex items-center gap-4 min-w-[180px]">
          <div
            onClick={onClickIcon}
            title="Vezi istoric grafic"
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner cursor-pointer hover:scale-110 active:scale-95 transition-all group relative",
              darkMode
                ? "bg-slate-900 text-amber-400"
                : "bg-amber-50 text-amber-600",
            )}
          >
            <span className="group-hover:opacity-0 transition-opacity">
              {currency === "EUR"
                ? "€"
                : currency === "USD"
                  ? "$"
                  : currency === "GBP"
                    ? "£"
                    : currency === "CHF"
                      ? "Fr"
                      : "¤"}
            </span>
            <TrendingUp className="w-5 h-5 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest">
              {getCurrencyName(currency)}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p
                className={cn(
                  "font-black uppercase tracking-tighter",
                  darkMode ? "text-slate-200" : "text-slate-800",
                  "text-lg sm:text-xl md:text-2xl",
                )}
              >
                1 {currency} = {rate.toFixed(4)} RON
              </p>
              {trend && trend !== "flat" && (
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full shrink-0",
                    trend === "up"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-green-500/10 text-green-500",
                  )}
                >
                  {trend === "up" ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">
              {currency}
            </span>
            <input
              type="number"
              value={currencyValue}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl font-mono font-bold text-lg border focus:ring-2 focus:outline-none transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-white focus:ring-amber-500/20"
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20",
              )}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">
              RON
            </span>
            <input
              type="number"
              value={ronValue}
              onChange={(e) => handleRonChange(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl font-mono font-bold text-lg border focus:ring-2 focus:outline-none transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-white focus:ring-amber-500/20"
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:ring-amber-500/20",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export interface WindowsScreenSaverProps {
  onClose: () => void;
  darkMode: boolean;
  userAvatar?: string | null;
}

export const WindowsScreenSaver: React.FC<WindowsScreenSaverProps> = ({
  onClose,
  darkMode,
  userAvatar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const initialMouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      setCurrentTime(
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      );

      const days = [
        "Duminică",
        "Luni",
        "Marți",
        "Miercuri",
        "Joi",
        "Vineri",
        "Sâmbătă",
      ];
      const months = [
        "Ianuarie",
        "Februarie",
        "Martie",
        "Aprilie",
        "Mai",
        "Iunie",
        "Iulie",
        "August",
        "Septembrie",
        "Octombrie",
        "Noiembrie",
        "Decembrie",
      ];
      setCurrentDate(
        `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
      );
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleAction = () => {
      onClose();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!initialMouseRef.current) {
        initialMouseRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
      const dx = Math.abs(e.clientX - initialMouseRef.current.x);
      const dy = Math.abs(e.clientY - initialMouseRef.current.y);
      if (dx > 15 || dy > 15) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleAction);
    window.addEventListener("mousedown", handleAction);
    window.addEventListener("touchstart", handleAction);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleAction);
      window.removeEventListener("mousedown", handleAction);
      window.removeEventListener("touchstart", handleAction);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [onClose]);

  useEffect(() => {
    if (userAvatar) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const numStars = 220;
    const stars: Array<{ x: number; y: number; z: number; color: string }> = [];
    const colors = [
      "#ffffff",
      "#cbd5e1",
      "#94a3b8",
      "#64748b",
      "#38bdf8",
      "#818cf8",
    ];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const speed = 1.3;

    let textX = width / 2;
    let textY = height / 2;
    let textDx = 1.2;
    let textYOffset = 0.8;
    const boxW = 320;
    const boxH = 180;

    const render = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 1)";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.z -= speed;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = 1000;
        }

        const px = (star.x / star.z) * 350 + width / 2;
        const py = (star.y / star.z) * 350 + height / 2;
        const size = (1 - star.z / 1000) * 4;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = 1 - star.z / 1000;
          ctx.beginPath();
          ctx.arc(px, py, size < 0.5 ? 0.5 : size, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      textX += textDx;
      textY += textYOffset;

      if (textX - boxW / 2 <= 0) {
        textX = boxW / 2;
        textDx = -textDx;
      } else if (textX + boxW / 2 >= width) {
        textX = width - boxW / 2;
        textDx = -textDx;
      }

      if (textY - boxH / 2 <= 0) {
        textY = boxH / 2;
        textYOffset = -textYOffset;
      } else if (textY + boxH / 2 >= height) {
        textY = height - boxH / 2;
        textYOffset = -textYOffset;
      }

      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(99, 102, 241, 0.35)";
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
      ctx.lineWidth = 1.5;

      const rx = textX - boxW / 2;
      const ry = textY - boxH / 2;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(rx, ry, boxW, boxH, 16);
      } else {
        ctx.rect(rx, ry, boxW, boxH);
      }
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      const logoSize = 18;
      const lx = textX - 100;
      const ly = textY - 45;

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(lx, ly, logoSize, logoSize);
      ctx.fillRect(lx + logoSize + 2, ly, logoSize, logoSize);
      ctx.fillRect(lx, ly + logoSize + 2, logoSize, logoSize);
      ctx.fillRect(lx + logoSize + 2, ly + logoSize + 2, logoSize, logoSize);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.fillText("OPTICENTER STYLE", lx + logoSize * 2 + 10, ly + 14);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "medium 10px 'JetBrains Mono', sans-serif";
      ctx.fillText("WINDOWS ACTIVE SCREEN", lx + logoSize * 2 + 10, ly + 28);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(currentTime, textX, textY + 22);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "bold 11px 'Inter', sans-serif";
      ctx.fillText(currentDate, textX, textY + 46);

      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 9px 'Inter', sans-serif";
      ctx.fillText("MIȘCĂ MOUSE-UL PENTRU REVENIRE", textX, textY + 68);
      ctx.textAlign = "left";

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentTime, currentDate, userAvatar]);

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden bg-slate-950 select-none cursor-none animate-fade-in flex items-center justify-center">
      {userAvatar ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img
            src={userAvatar}
            alt="Screensaver active"
            className="w-full h-full object-contain pointer-events-none"
          />
          {/* Subtle elegant clock in the bottom right corner */}
          <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-right pointer-events-none">
            <p className="text-white font-black text-2xl tracking-wider leading-none">
              {currentTime.split(":").slice(0, 2).join(":")}
            </p>
            <p className="text-slate-400 font-bold text-[9px] mt-1.5 uppercase tracking-widest leading-none">
              {currentDate}
            </p>
          </div>
        </div>
      ) : (
        <canvas ref={canvasRef} className="block w-full h-full" />
      )}
    </div>
  );
};

export const DEFAULT_RECAPTCHA_KEY = "6LfdM_osAAAAACYD8TKknkLxm1mFJ2pHxqjZsPTS";

export const sanitizeSiteKey = (key: string | undefined): string => {
  if (!key) return DEFAULT_RECAPTCHA_KEY;
  const trimmed = key.trim().replace(/^["']|["']$/g, "");
  // Fix the common typo where capital "I" is used instead of lowercase "i" for the standard test key
  if (
    trimmed.toLowerCase() === "6leixactaaaaajczvrqyhh71umiegnq_mxjizkhi"
  ) {
    return "6LeixAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  }
  if (trimmed.length < 20 || !trimmed.startsWith("6L") || trimmed === "LALU") {
    return DEFAULT_RECAPTCHA_KEY;
  }
  return trimmed;
};

export const loadRecaptchaScript = (siteKey: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const scriptId = "recaptcha-enterprise-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (script) {
      // If the existing script matches the siteKey, reuse it
      if (script.src.includes(`render=${siteKey}`)) {
        if ((window as any).grecaptcha?.enterprise) {
          resolve(true);
          return;
        }
      } else {
        // Site key mismatch: remove old script and clear window.grecaptcha to force a reload
        script.remove();
        try {
          delete (window as any).grecaptcha;
        } catch (e) {
          (window as any).grecaptcha = undefined;
        }
        script = null as any;
      }
    }

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        let checkCount = 0;
        const interval = setInterval(() => {
          if ((window as any).grecaptcha?.enterprise) {
            clearInterval(interval);
            resolve(true);
          } else if (checkCount > 50) {
            clearInterval(interval);
            resolve(false);
          }
          checkCount++;
        }, 100);
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    } else {
      resolve(true);
    }
  });
};

export const executeRecaptcha = async (action: string): Promise<string | null> => {
  const envKey = (import.meta as any).env.VITE_RECAPTCHA_ENTERPRISE_KEY;
  const siteKey = sanitizeSiteKey(envKey);

  // Detect if we are using the default mock/test key, empty key, or placeholder
  const isDefaultOrMissingKey =
    !siteKey ||
    siteKey === DEFAULT_RECAPTCHA_KEY ||
    siteKey === "6LfdM_osAAAAACYD8TKknkLxm1mFJ2pHxqjZsPTS" ||
    siteKey === "6LeixAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" ||
    siteKey === "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" ||
    siteKey.includes("PLACEHOLDER") ||
    siteKey === "LALU";

  if (isDefaultOrMissingKey) {
    return `mock_recaptcha_enterprise_token_${action}_${Date.now()}`;
  }

  // Safety wrapper with a 2-second timeout to avoid any hangs
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(`mock_recaptcha_enterprise_token_${action}_timeout_fallback`);
      }
    }, 2000);

    loadRecaptchaScript(siteKey)
      .then((loaded) => {
        if (!loaded) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve("recaptcha_bypass_success_token_fallback");
          }
          return;
        }

        const gre = (window as any).grecaptcha?.enterprise;
        if (!gre) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve("recaptcha_bypass_success_token_fallback");
          }
          return;
        }

        gre.ready(async () => {
          try {
            const token = await gre.execute(siteKey, { action });
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(token || "recaptcha_bypass_success_token_fallback");
            }
          } catch (err) {
            console.error("reCAPTCHA Enterprise execution error:", err);
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve("recaptcha_bypass_success_token_fallback");
            }
          }
        });
      })
      .catch((e) => {
        console.error("reCAPTCHA script load error:", e);
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve("recaptcha_bypass_success_token_fallback");
        }
      });
  });
};

export const getRomanianPublicHoliday = (day: Date): string | null => {
  const m = day.getMonth(); // 0-indexed (Jan=0, Feb=1, etc.)
  const d = day.getDate();  // 1-indexed (1-31)
  const y = day.getFullYear();

  // Fixed holidays
  if (m === 0 && d === 1) return "Anul Nou";
  if (m === 0 && d === 2) return "Anul Nou";
  if (m === 0 && d === 6) return "Boboteaza";
  if (m === 0 && d === 7) return "Sfântul Ioan Botezătorul";
  if (m === 0 && d === 24) return "Unirea Principatelor Române";
  if (m === 4 && d === 1) return "Ziua Muncii";
  if (m === 5 && d === 1) return "Ziua Copilului";
  if (m === 7 && d === 15) return "Adormirea Maicii Domnului";
  if (m === 10 && d === 30) return "Sfântul Andrei";
  if (m === 11 && d === 1) return "Ziua Națională a României";
  if (m === 11 && d === 25) return "Crăciunul";
  if (m === 11 && d === 26) return "Crăciunul";

  // Dynamic (mostly Orthodox Easter / Pentecost / Rusalii)
  if (y === 2026) {
    if (m === 3 && d === 10) return "Vinerea Mare";
    if (m === 3 && d === 12) return "Paștele Ortodox";
    if (m === 3 && d === 13) return "A doua zi de Paște";
    if (m === 4 && d === 31) return "Rusalii";
    if (m === 5 && d === 1) return "A doua zi de Rusalii";
  } else if (y === 2025) {
    if (m === 3 && d === 18) return "Vinerea Mare";
    if (m === 3 && d === 20) return "Paștele Ortodox";
    if (m === 3 && d === 21) return "A doua zi de Paște";
    if (m === 5 && d === 8) return "Rusalii";
    if (m === 5 && d === 9) return "A doua zi de Rusalii";
  } else if (y === 2027) {
    if (m === 3 && d === 30) return "Vinerea Mare";
    if (m === 4 && d === 2) return "Paștele Ortodox";
    if (m === 4 && d === 3) return "A doua zi de Paște";
    if (m === 5 && d === 20) return "Rusalii";
    if (m === 5 && d === 21) return "A doua zi de Rusalii";
  } else if (y === 2028) {
    if (m === 3 && d === 14) return "Vinerea Mare";
    if (m === 3 && d === 16) return "Paștele Ortodox";
    if (m === 3 && d === 17) return "A doua zi de Paște";
    if (m === 5 && d === 4) return "Rusalii";
    if (m === 5 && d === 5) return "A doua zi de Rusalii";
  }

  return null;
};

export function deformPoint(
  x: number,
  y: number,
  deforms: { x: number; y: number; angle: number }[]
): { x: number; y: number } {
  let curX = x;
  let curY = y;
  for (const def of deforms) {
    if (def.x === 0 && def.y === 0) continue;

    // Protection for nasal bridge (DBL): if deformation point is on nasal side (cos(angle) > 0),
    // clamp def.x so it cannot expand into the nasal bridge area between lenses
    let defX = def.x;
    if (Math.cos(def.angle) > 0 && defX > 0) {
      defX = 0;
    }

    const theta = Math.atan2(y - 25, x - 40);
    const diff = Math.abs(theta - def.angle);
    const wrappedDiff = Math.min(diff, 2 * Math.PI - diff);
    const weight = Math.pow(Math.max(0, Math.cos(wrappedDiff)), 2.5);
    curX += defX * weight;
    curY += def.y * weight;
  }
  return { x: curX, y: curY };
}

export function deformPath(
  pathStr: string,
  deformsOrDeformX: any,
  deformY?: number,
  deformAngle?: number,
  rotation?: number
): string {
  let deforms: { x: number; y: number; angle: number }[] = [];
  let rotationVal = 0;

  if (typeof rotation === "number") {
    rotationVal = rotation;
  }

  if (Array.isArray(deformsOrDeformX)) {
    deforms = deformsOrDeformX;
  } else if (typeof deformsOrDeformX === "string" && deformsOrDeformX.trim().startsWith("[")) {
    try {
      deforms = JSON.parse(deformsOrDeformX);
    } catch {
      deforms = [];
    }
    if (typeof deformY === "number") {
      rotationVal = deformY;
    }
  } else {
    const dX = parseFloat(deformsOrDeformX) || 0;
    const dY = parseFloat(deformY as any) || 0;
    const dAngle = parseFloat(deformAngle as any) || 0;
    if (dX !== 0 || dY !== 0) {
      deforms = [{ x: dX, y: dY, angle: dAngle }];
    }
  }

  if (deforms.length === 0 && rotationVal === 0) return pathStr;

  const regex = /([MLHVCSQTAZmlhvcssqtaz])|(-?\d*\.?\d+)/g;
  const tokens: { type: "cmd" | "num"; value: string }[] = [];
  let match;
  while ((match = regex.exec(pathStr)) !== null) {
    if (match[1]) {
      tokens.push({ type: "cmd", value: match[1] });
    } else if (match[2]) {
      tokens.push({ type: "num", value: match[2] });
    }
  }

  const numTokenIndices: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === "num") {
      numTokenIndices.push(i);
    }
  }

  for (let i = 0; i < numTokenIndices.length; i += 2) {
    if (i + 1 < numTokenIndices.length) {
      const idxX = numTokenIndices[i];
      const idxY = numTokenIndices[i + 1];
      const x = parseFloat(tokens[idxX].value);
      const y = parseFloat(tokens[idxY].value);

      let curX = x;
      let curY = y;

      for (const def of deforms) {
        if (def.x === 0 && def.y === 0) continue;
        const theta = Math.atan2(y - 25, x - 40);
        const diff = Math.abs(theta - def.angle);
        const wrappedDiff = Math.min(diff, 2 * Math.PI - diff);

        const weight = Math.pow(Math.max(0, Math.cos(wrappedDiff)), 2.5);

        curX += def.x * weight;
        curY += def.y * weight;
      }

      if (rotationVal !== 0) {
        const rad = (rotationVal * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = curX - 40;
        const dy = curY - 25;
        curX = 40 + dx * cos - dy * sin;
        curY = 25 + dx * sin + dy * cos;
      }

      tokens[idxX].value = curX.toFixed(2);
      tokens[idxY].value = curY.toFixed(2);
    }
  }

  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "cmd") {
      result += (result ? " " : "") + token.value;
    } else {
      const numSeqIndex = numTokenIndices.indexOf(i);
      if (numSeqIndex % 2 === 0) {
        result += " " + token.value;
      } else {
        result += "," + token.value;
      }
    }
  }

  return result;
}

export function samplePathPoints(pathStr: string, numSamplesPerSegment = 20): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const regex = /([MLHVCSQTAZmlhvcssqtaz])|(-?\d*\.?\d+)/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(pathStr)) !== null) {
    tokens.push(match[1] || match[2]);
  }

  let cx = 40;
  let cy = 25;
  let startX = 40;
  let startY = 25;

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (/[MLHVCSQTAZmlhvcssqtaz]/.test(token)) {
      const cmd = token;
      i++;
      if (cmd === 'M' || cmd === 'm') {
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        cx = cmd === 'm' ? cx + x : x;
        cy = cmd === 'm' ? cy + y : y;
        startX = cx;
        startY = cy;
        points.push({ x: cx, y: cy });
      } else if (cmd === 'L' || cmd === 'l') {
        const x = parseFloat(tokens[i++]);
        const y = parseFloat(tokens[i++]);
        const targetX = cmd === 'l' ? cx + x : x;
        const targetY = cmd === 'l' ? cy + y : y;
        for (let t = 0; t <= numSamplesPerSegment; t++) {
          const ratio = t / numSamplesPerSegment;
          points.push({
            x: cx + (targetX - cx) * ratio,
            y: cy + (targetY - cy) * ratio
          });
        }
        cx = targetX;
        cy = targetY;
      } else if (cmd === 'C' || cmd === 'c') {
        const x1_val = parseFloat(tokens[i++]);
        const y1_val = parseFloat(tokens[i++]);
        const x2_val = parseFloat(tokens[i++]);
        const y2_val = parseFloat(tokens[i++]);
        const x3_val = parseFloat(tokens[i++]);
        const y3_val = parseFloat(tokens[i++]);

        const cp1x = cmd === 'c' ? cx + x1_val : x1_val;
        const cp1y = cmd === 'c' ? cy + y1_val : y1_val;
        const cp2x = cmd === 'c' ? cx + x2_val : x2_val;
        const cp2y = cmd === 'c' ? cy + y2_val : y2_val;
        const endx = cmd === 'c' ? cx + x3_val : x3_val;
        const endy = cmd === 'c' ? cy + y3_val : y3_val;

        for (let t = 0; t <= numSamplesPerSegment; t++) {
          const mt = t / numSamplesPerSegment;
          const u = 1 - mt;
          const tt = mt * mt;
          const uu = u * u;
          const uuu = uu * u;
          const ttt = tt * mt;

          const px = uuu * cx + 3 * uu * mt * cp1x + 3 * u * tt * cp2x + ttt * endx;
          const py = uuu * cy + 3 * uu * mt * cp1y + 3 * u * tt * cp2y + ttt * endy;
          points.push({ x: px, y: py });
        }
        cx = endx;
        cy = endy;
      } else if (cmd === 'Z' || cmd === 'z') {
        for (let t = 0; t <= numSamplesPerSegment; t++) {
          const ratio = t / numSamplesPerSegment;
          points.push({
            x: cx + (startX - cx) * ratio,
            y: cy + (startY - cy) * ratio
          });
        }
        cx = startX;
        cy = startY;
      }
    } else {
      i++;
    }
  }
  return points;
}

export function getPointOnPathAtAngle(
  pathStr: string,
  targetAngle: number,
  centerX = 40,
  centerY = 25
): { x: number; y: number } {
  const points = samplePathPoints(pathStr);
  if (points.length === 0) return { x: centerX, y: centerY };

  let bestPoint = points[0];
  let minDiff = 2 * Math.PI;

  for (const pt of points) {
    const angle = Math.atan2(pt.y - centerY, pt.x - centerX);
    const diff = Math.abs(angle - targetAngle) % (2 * Math.PI);
    const wrappedDiff = Math.min(diff, 2 * Math.PI - diff);
    if (wrappedDiff < minDiff) {
      minDiff = wrappedDiff;
      bestPoint = pt;
    }
  }

  return bestPoint;
}

export function normalizePath(pathStr: string): string {
  const points = samplePathPoints(pathStr);
  if (points.length === 0) return pathStr;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  if (width === 0 || height === 0) return pathStr;

  const regex = /([MLHVCSQTAZmlhvcssqtaz])|(-?\d*\.?\d+)/g;
  const tokens: { type: "cmd" | "num"; value: string }[] = [];
  let match;
  while ((match = regex.exec(pathStr)) !== null) {
    if (match[1]) {
      tokens.push({ type: "cmd", value: match[1] });
    } else if (match[2]) {
      tokens.push({ type: "num", value: match[2] });
    }
  }

  const numTokenIndices: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === "num") {
      numTokenIndices.push(i);
    }
  }

  for (let i = 0; i < numTokenIndices.length; i += 2) {
    if (i + 1 < numTokenIndices.length) {
      const idxX = numTokenIndices[i];
      const idxY = numTokenIndices[i + 1];
      const x = parseFloat(tokens[idxX].value);
      const y = parseFloat(tokens[idxY].value);

      const curX = ((x - minX) / width) * 80;
      const curY = ((y - minY) / height) * 50;

      tokens[idxX].value = curX.toFixed(2);
      tokens[idxY].value = curY.toFixed(2);
    }
  }

  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "cmd") {
      result += (result ? " " : "") + token.value;
    } else {
      const numSeqIndex = numTokenIndices.indexOf(i);
      if (numSeqIndex % 2 === 0) {
        result += " " + token.value;
      } else {
        result += "," + token.value;
      }
    }
  }

  return result;
}

export function getBottomYAtX(pathStr: string, targetViewBoxX: number): number {
  const points = samplePathPoints(pathStr);
  if (points.length === 0) return 45; // default bottom in viewBox
  
  // We want the bottom part of the lens, so we consider points with y >= 25 (the bottom half)
  const bottomPoints = points.filter(p => p.y >= 25);
  if (bottomPoints.length === 0) return 45;

  // Find the point whose X is closest to targetViewBoxX
  let bestPoint = bottomPoints[0];
  let minDiff = Infinity;
  for (const pt of bottomPoints) {
    const diff = Math.abs(pt.x - targetViewBoxX);
    if (diff < minDiff) {
      minDiff = diff;
      bestPoint = pt;
    }
  }
  return bestPoint.y;
}


