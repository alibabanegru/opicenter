import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import {
  X,
  Printer,
  FileText,
  Calendar,
  User,
  Phone,
  Activity,
  ClipboardList,
  Sparkles,
  FileCheck2,
  ChevronRight,
  Eye,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import {
  MedicalRecord,
  PrescriptionHistoryItem,
  calculateAge,
  calculateDetailedAge,
  calculateTurningAge,
  MONTHS_RO,
} from "../appConstants";
import MyopiaChart from "./MyopiaChart";

interface PatientSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord;
  medicalDocuments?: any[];
  darkMode?: boolean;
  userRole?: string;
  clinicLogo?: string;
  getDoctorName?: (doctorId: string) => string;
  roleLabels?: Record<string, string>;
  initialReleaseDate?: {
    zi?: string;
    luna?: string;
    an?: string;
  };
  onReleaseDateChange?: (date: { zi: string; luna: string; an: string }) => void;
}

// Helper to parse any date string into a formatted RO string and numeric timestamp
const parseDateStr = (dateStr?: string): { formatted: string; timestamp: number } => {
  if (!dateStr) return { formatted: "N/A", timestamp: 0 };
  const str = dateStr.trim();
  if (!str) return { formatted: "N/A", timestamp: 0 };

  const ddmmyyyyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const d = new Date(year, month, day);
    const formatted = `${day.toString().padStart(2, "0")}.${(month + 1).toString().padStart(2, "0")}.${year}`;
    return { formatted, timestamp: d.getTime() };
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const formatted = d.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return { formatted, timestamp: d.getTime() };
  }

  return { formatted: str, timestamp: 0 };
};

// Helper to get non-empty diopter fields for an eye
const getEyeDiopters = (eyeObj?: any, dpVal?: string) => {
  if (!eyeObj) return [];
  const fields: { label: string; value: string; key: string }[] = [];

  if (eyeObj.sph !== undefined && eyeObj.sph !== null && String(eyeObj.sph).trim() !== "") {
    fields.push({ label: "Sferă", value: String(eyeObj.sph), key: "sph" });
  }
  if (eyeObj.cyl !== undefined && eyeObj.cyl !== null && String(eyeObj.cyl).trim() !== "") {
    fields.push({ label: "Cilindru", value: String(eyeObj.cyl), key: "cyl" });
  }
  if (eyeObj.axis !== undefined && eyeObj.axis !== null && String(eyeObj.axis).trim() !== "") {
    const ax = String(eyeObj.axis).trim();
    fields.push({ label: "Ax", value: ax.includes("°") ? ax : `${ax}°`, key: "axis" });
  }
  if (eyeObj.add !== undefined && eyeObj.add !== null && String(eyeObj.add).trim() !== "") {
    fields.push({ label: "Adiție", value: String(eyeObj.add), key: "add" });
  }
  if (dpVal && String(dpVal).trim() !== "") {
    fields.push({ label: "DP", value: `${dpVal} mm`, key: "dp" });
  }

  return fields;
};

// Helper to get visual acuity fields for an eye
const getEyeVisualAcuity = (eyeObj?: any) => {
  if (!eyeObj) return { vaWithout: null, vaWith: null };
  const vaWithout = eyeObj.va_without || eyeObj.va || null;
  const vaWith = eyeObj.va_with || null;
  return {
    vaWithout: vaWithout && String(vaWithout).trim() !== "" ? String(vaWithout).trim() : null,
    vaWith: vaWith && String(vaWith).trim() !== "" ? String(vaWith).trim() : null,
  };
};

export const PatientSummaryModal: React.FC<PatientSummaryModalProps> = ({
  isOpen,
  onClose,
  record,
  medicalDocuments = [],
  darkMode = false,
  userRole,
  clinicLogo,
  getDoctorName,
  roleLabels,
  initialReleaseDate,
  onReleaseDateChange,
}) => {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showA4Modal, setShowA4Modal] = useState<boolean>(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfNotification, setPdfNotification] = useState<string | null>(null);

  // Release date state (ca la raport medical: Zi, Lună, An, default current date)
  const [eliberatZi, setEliberatZi] = useState<string>(() => {
    return initialReleaseDate?.zi !== undefined && initialReleaseDate?.zi !== ""
      ? String(initialReleaseDate.zi)
      : String(new Date().getDate());
  });
  const [eliberatLuna, setEliberatLuna] = useState<string>(() => {
    return initialReleaseDate?.luna !== undefined && initialReleaseDate?.luna !== ""
      ? String(initialReleaseDate.luna)
      : MONTHS_RO[new Date().getMonth()];
  });
  const [eliberatAn, setEliberatAn] = useState<string>(() => {
    return initialReleaseDate?.an !== undefined && initialReleaseDate?.an !== ""
      ? String(initialReleaseDate.an)
      : String(new Date().getFullYear());
  });

  const formattedReleaseDate = useMemo(() => {
    const an = (eliberatAn || "").trim() || String(new Date().getFullYear());
    const monthIdx = (MONTHS_RO as readonly string[]).indexOf(eliberatLuna);
    const lunaNum = monthIdx >= 0 ? String(monthIdx + 1).padStart(2, "0") : String(new Date().getMonth() + 1).padStart(2, "0");
    const zi = (eliberatZi || "").trim() ? String(eliberatZi).trim().padStart(2, "0") : String(new Date().getDate()).padStart(2, "0");
    return `${zi}.${lunaNum}.${an}`;
  }, [eliberatZi, eliberatLuna, eliberatAn]);

  const updateReleaseDate = (ziVal: string, lunaVal: string, anVal: string) => {
    setEliberatZi(ziVal);
    setEliberatLuna(lunaVal);
    setEliberatAn(anVal);
    if (onReleaseDateChange) {
      onReleaseDateChange({ zi: ziVal, luna: lunaVal, an: anVal });
    }
  };

  const getDoctorFormattedName = (docNameOrId?: string): string => {
    if (!docNameOrId) return "Dr. Curant";

    if (getDoctorName) {
      const resolved = getDoctorName(docNameOrId);
      if (resolved && resolved !== docNameOrId) return resolved;
    }

    if (roleLabels && roleLabels[docNameOrId]) {
      return roleLabels[docNameOrId];
    }

    const normalized = docNameOrId.trim().toLowerCase();
    if (normalized === "doctor1" || normalized === "turcanu") return "Dr. Irina Țurcanu";
    if (normalized === "doctor2" || normalized === "zorila") return "Dr. Cristina Zorilă";
    if (normalized === "admin") return "Ing. Optometrist";

    if (docNameOrId.startsWith("doctor")) {
      const num = docNameOrId.replace("doctor", "");
      return `Medic ${num}`;
    }

    return docNameOrId;
  };

  const activeRole =
    userRole || (typeof window !== "undefined" ? localStorage.getItem("userRole") || "" : "");
  const isDoctorUser = Boolean(
    activeRole.startsWith("doctor") ||
      ["doctor1", "doctor2", "doctor3", "doctor4", "doctor5"].includes(activeRole)
  );

  // Gather and deduplicate chronological entries per exact date
  const timelineEntries = useMemo(() => {
    if (!record) return [];

    const rawEntries: Array<{
      id: string;
      date: string;
      formattedDate: string;
      timestamp: number;
      type: "consultation" | "prescription" | "document";
      doctorName?: string;
      od?: any;
      os?: any;
      cl_od?: any;
      cl_os?: any;
      dp?: string;
      dp_od?: string;
      dp_os?: string;
      treatment?: string;
      diagnostic?: string;
      recomandari?: string;
      specialMentions?: string;
      symptoms?: string;
      scutire?: string;
      isControl?: boolean;
      isGratis?: boolean;
      isConsultComplet?: boolean;
      axialLength?: { od?: string; os?: string };
      iop?: { od?: string; os?: string };
      anteriorSegment?: { od?: string; os?: string };
      posteriorSegment?: { od?: string; os?: string };
      documents?: Array<{
        docType: string;
        docNumber: string;
        diagnostic?: string;
        concluzii?: string;
        treatment?: string;
        recomandari?: string;
        details?: any;
      }>;
    }> = [];

    // 1. History items - strictly use history date (h.date)
    const history = record.prescriptionHistory || [];
    history.forEach((h: PrescriptionHistoryItem, idx: number) => {
      const dateStr = h.date || record.createdAt || new Date().toISOString();
      const parsed = parseDateStr(dateStr);
      rawEntries.push({
        id: `history-${idx}-${dateStr}`,
        date: dateStr,
        formattedDate: parsed.formatted,
        timestamp: parsed.timestamp || idx,
        type: "prescription",
        doctorName: h.doctorId,
        od: h.od,
        os: h.os,
        cl_od: h.cl_od,
        cl_os: h.cl_os,
        dp: h.dp,
        dp_od: h.dp_od,
        dp_os: h.dp_os,
        treatment: h.treatment,
        diagnostic: h.diagnostic,
        recomandari: h.recomandari,
        specialMentions: h.specialMentions,
        symptoms: h.symptoms,
        scutire: h.scutire,
        isControl: h.isControl,
        isGratis: h.isGratis,
        isConsultComplet: h.isConsultComplet,
        axialLength: h.axialLength,
        iop: h.iop,
        anteriorSegment: h.anteriorSegment,
        posteriorSegment: h.posteriorSegment,
      });
    });

    // 2. Add active top-level record if no prescription history exists
    if (history.length === 0) {
      const activeDateStr = record.createdAt || record.updatedAt || new Date().toISOString();
      const parsedActive = parseDateStr(activeDateStr);
      const hasActiveData =
        record.od?.sph ||
        record.os?.sph ||
        record.treatment ||
        record.diagnostic ||
        record.specialMentions ||
        record.cl_od?.sph ||
        record.cl_os?.sph;

      if (hasActiveData) {
        rawEntries.push({
          id: `active-${activeDateStr}`,
          date: activeDateStr,
          formattedDate: parsedActive.formatted,
          timestamp: parsedActive.timestamp || Date.now(),
          type: "consultation",
          od: record.od,
          os: record.os,
          cl_od: record.cl_od,
          cl_os: record.cl_os,
          dp: record.dp,
          dp_od: record.dp_od,
          dp_os: record.dp_os,
          treatment: record.treatment,
          diagnostic: record.diagnostic,
          recomandari: record.recomandari,
          specialMentions: record.specialMentions,
          symptoms: record.symptoms,
          scutire: record.scutire,
          isControl: record.isControl,
          isGratis: record.isGratis,
          isConsultComplet: record.isConsultComplet,
          axialLength: record.axialLength,
          iop: record.iop,
          anteriorSegment: record.anteriorSegment,
          posteriorSegment: record.posteriorSegment,
        });
      }
    }

    // 3. Medical Documents
    const patientNameLower = (record.patientName || "").trim().toLowerCase();
    const patientPhoneLower = (record.patientPhone || "").trim().toLowerCase();
    const patientCnp = (record.patientCnp || "").trim();

    const patientDocs = medicalDocuments.filter((docItem) => {
      if (!docItem) return false;
      const docName = (docItem.patientName || "").trim().toLowerCase();
      const docPhone = (docItem.patientPhone || "").trim().toLowerCase();
      const docCnp = (docItem.patientCnp || "").trim();

      if (patientCnp && docCnp && patientCnp === docCnp) return true;
      if (docName && patientNameLower && docName === patientNameLower) {
        if (!patientPhoneLower || !docPhone || patientPhoneLower === docPhone) return true;
      }
      return false;
    });

    patientDocs.forEach((docItem) => {
      const docDate = docItem.date || docItem.createdAt || new Date().toISOString();
      const parsedDoc = parseDateStr(docDate);
      const fv = docItem.formValues || docItem;

      const docOd = fv.od || docItem.od;
      const docOs = fv.os || docItem.os;
      const docClOd = fv.cl_od || docItem.cl_od;
      const docClOs = fv.cl_os || docItem.cl_os;
      const docDp = fv.dp || docItem.dp;
      const docDpOd = fv.dp_od || docItem.dp_od;
      const docDpOs = fv.dp_os || docItem.dp_os;
      const docTreatment = fv.treatment || docItem.treatment || fv.tratament;
      const docDiagnostic = fv.diagnostic || docItem.diagnostic || fv.diag || fv.diagOd || fv.diagOs;
      const docRecomandari = fv.recomandari || docItem.recomandari || fv.recomandare;
      const docSpecialMentions =
        fv.specialMentions ||
        docItem.specialMentions ||
        fv.mentiuni ||
        fv.observations ||
        docItem.observations ||
        fv.concluzii ||
        docItem.concluzii ||
        fv.exOftalmologic ||
        fv.motivTrimitere ||
        fv.motiveScutire;
      const docSymptoms = fv.symptoms || docItem.symptoms;
      const docScutire = fv.scutire || docItem.scutire;

      rawEntries.push({
        id: `doc-${docItem.id || Math.random()}`,
        date: docDate,
        formattedDate: parsedDoc.formatted,
        timestamp: parsedDoc.timestamp || Date.now(),
        type: "document",
        doctorName: docItem.doctorName || fv.doctorName,
        od: docOd,
        os: docOs,
        cl_od: docClOd,
        cl_os: docClOs,
        dp: docDp,
        dp_od: docDpOd,
        dp_os: docDpOs,
        treatment: docTreatment,
        diagnostic: docDiagnostic,
        recomandari: docRecomandari,
        specialMentions: docSpecialMentions,
        symptoms: docSymptoms,
        scutire: docScutire,
        axialLength: {
          od: fv.axialLengthOd || fv.axialLength?.od || docItem.axialLength?.od,
          os: fv.axialLengthOs || fv.axialLength?.os || docItem.axialLength?.os,
        },
        iop: {
          od: fv.iopOd || fv.iop?.od || docItem.iop?.od,
          os: fv.iopOs || fv.iop?.os || docItem.iop?.os,
        },
        documents: [
          {
            docType: docItem.type || "Document Medical",
            docNumber: docItem.documentNumber || docItem.docNumber || "N/A",
            diagnostic: docDiagnostic,
            concluzii: fv.concluzii || docItem.concluzii || fv.observations || docItem.observations || fv.exOftalmologic,
            treatment: docTreatment,
            recomandari: docRecomandari,
            details: fv,
          },
        ],
      });
    });

    // Group and Merge entries by formatted date
    const groupedByDate: { [dateStr: string]: typeof rawEntries } = {};
    rawEntries.forEach((item) => {
      const key = item.formattedDate || "N/A";
      if (!groupedByDate[key]) groupedByDate[key] = [];
      groupedByDate[key].push(item);
    });

    const mergedEntries = Object.keys(groupedByDate).map((dateKey) => {
      const group = groupedByDate[dateKey];

      const mergeEye = (eyeName: "od" | "os" | "cl_od" | "cl_os") => {
        let merged: any = {};
        group.forEach((item) => {
          const eyeObj = (item as any)[eyeName];
          if (eyeObj) {
            Object.keys(eyeObj).forEach((k) => {
              if (eyeObj[k] !== undefined && eyeObj[k] !== "" && eyeObj[k] !== null) {
                merged[k] = eyeObj[k];
              }
            });
          }
        });
        return Object.keys(merged).length > 0 ? merged : undefined;
      };

      const combineUniqueStrings = (fieldName: keyof typeof group[0]) => {
        const vals = group
          .map((item) => item[fieldName])
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
        const unique = Array.from(new Set(vals.map((v) => v.trim())));
        return unique.join("\n");
      };

      const maxTimestamp = Math.max(...group.map((g) => g.timestamp));
      const doctorName = group.find((g) => g.doctorName)?.doctorName;

      const docsList: Array<{
        docType: string;
        docNumber: string;
        diagnostic?: string;
        concluzii?: string;
        treatment?: string;
        recomandari?: string;
        details?: any;
      }> = [];
      group.forEach((g) => {
        if (g.documents) docsList.push(...g.documents);
      });

      return {
        id: `merged-${dateKey}`,
        date: group[0].date,
        formattedDate: dateKey,
        timestamp: maxTimestamp,
        type: group.some((g) => g.type === "consultation")
          ? ("consultation" as const)
          : group.some((g) => g.type === "prescription")
          ? ("prescription" as const)
          : ("document" as const),
        doctorName,
        od: mergeEye("od"),
        os: mergeEye("os"),
        cl_od: mergeEye("cl_od"),
        cl_os: mergeEye("cl_os"),
        dp: group.find((g) => g.dp)?.dp,
        dp_od: group.find((g) => g.dp_od)?.dp_od,
        dp_os: group.find((g) => g.dp_os)?.dp_os,
        treatment: combineUniqueStrings("treatment"),
        diagnostic: combineUniqueStrings("diagnostic"),
        recomandari: combineUniqueStrings("recomandari"),
        specialMentions: combineUniqueStrings("specialMentions"),
        symptoms: combineUniqueStrings("symptoms"),
        scutire: group.find((g) => g.scutire)?.scutire,
        isControl: group.some((g) => g.isControl),
        isGratis: group.some((g) => g.isGratis),
        isConsultComplet: group.some((g) => g.isConsultComplet),
        axialLength: {
          od: group.find((g) => g.axialLength?.od)?.axialLength?.od,
          os: group.find((g) => g.axialLength?.os)?.axialLength?.os,
        },
        iop: {
          od: group.find((g) => g.iop?.od)?.iop?.od,
          os: group.find((g) => g.iop?.os)?.iop?.os,
        },
        anteriorSegment: {
          od: group.find((g) => g.anteriorSegment?.od)?.anteriorSegment?.od,
          os: group.find((g) => g.anteriorSegment?.os)?.anteriorSegment?.os,
        },
        posteriorSegment: {
          od: group.find((g) => g.posteriorSegment?.od)?.posteriorSegment?.od,
          os: group.find((g) => g.posteriorSegment?.os)?.posteriorSegment?.os,
        },
        documents: docsList,
      };
    });

    return mergedEntries.sort((a, b) =>
      sortOrder === "desc" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
  }, [record, medicalDocuments, sortOrder]);

  // Axial length data for MyopiaChart
  const axialDataOD = useMemo(() => {
    if (!record) return [];
    const history = record.prescriptionHistory || [];
    const data = history
      .filter((item) => item.axialLength?.od)
      .map((item) => {
        const age = record.patientBirthDate
          ? calculateAge(record.patientBirthDate, new Date(item.date))
          : record.patientAge;
        return {
          date: item.date,
          age: age || 0,
          axialLength: parseFloat(item.axialLength?.od || "0"),
          isFromHistory: true,
          historyItem: item,
          eye: "OD",
        };
      })
      .filter((item) => (item.axialLength || 0) > 0);

    const currentAL = record.axialLength?.od;
    if (currentAL) {
      const currentAge = record.patientBirthDate
        ? calculateAge(record.patientBirthDate)
        : record.patientAge;
      const currentVal = parseFloat(currentAL);
      if (currentVal > 0 && !data.some((d) => d.age === currentAge)) {
        data.push({
          date: record.updatedAt || new Date().toISOString(),
          age: currentAge || 0,
          axialLength: currentVal,
          isFromHistory: false,
          historyItem: null,
          eye: "OD",
        });
      }
    }
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [record]);

  const axialDataOS = useMemo(() => {
    if (!record) return [];
    const history = record.prescriptionHistory || [];
    const data = history
      .filter((item) => item.axialLength?.os)
      .map((item) => {
        const age = record.patientBirthDate
          ? calculateAge(record.patientBirthDate, new Date(item.date))
          : record.patientAge;
        return {
          date: item.date,
          age: age || 0,
          axialLength: parseFloat(item.axialLength?.os || "0"),
          isFromHistory: true,
          historyItem: item,
          eye: "OS",
        };
      })
      .filter((item) => (item.axialLength || 0) > 0);

    const currentAL = record.axialLength?.os;
    if (currentAL) {
      const currentAge = record.patientBirthDate
        ? calculateAge(record.patientBirthDate)
        : record.patientAge;
      const currentVal = parseFloat(currentAL);
      if (currentVal > 0 && !data.some((d) => d.age === currentAge)) {
        data.push({
          date: record.updatedAt || new Date().toISOString(),
          age: currentAge || 0,
          axialLength: currentVal,
          isFromHistory: false,
          historyItem: null,
          eye: "OS",
        });
      }
    }
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [record]);

  const hasAxialLengthData = axialDataOD.length > 0 || axialDataOS.length > 0;

  if (!isOpen || !record) return null;

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    try {
      let element = document.getElementById("printable-a4-summary-sheet");
      if (!element) {
        element = document.getElementById("printable-patient-summary");
      }

      if (!element) {
        setPdfNotification("Nu s-a putut găsi conținutul pentru generarea PDF-ului.");
        setIsGeneratingPDF(false);
        return;
      }

      const targetWidth = element.clientWidth || 800;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetWidth,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.88);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      let heightLeft = scaledHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 2) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }

      const cleanName = (record?.patientName || "Pacient")
        .replace(/[^a-zA-Z0-9_\- ]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const safeMonthNum = String(
        (MONTHS_RO as readonly string[]).indexOf(eliberatLuna) >= 0
          ? (MONTHS_RO as readonly string[]).indexOf(eliberatLuna) + 1
          : new Date().getMonth() + 1,
      ).padStart(2, "0");
      const safeDay = String((eliberatZi || "").trim() || new Date().getDate()).padStart(2, "0");
      const safeYear = (eliberatAn || "").trim() || String(new Date().getFullYear());
      const dateStr = `${safeYear}-${safeMonthNum}-${safeDay}`;

      pdf.save(`Fisa_Medicala_${cleanName}_${dateStr}.pdf`);
      setPdfNotification(`Fișa pacient PDF a fost descărcată cu succes (Data eliberare: ${formattedReleaseDate})!`);
      setTimeout(() => setPdfNotification(null), 4000);
    } catch (err: any) {
      console.error("Eroare la generarea fișierului PDF:", err);
      setPdfNotification(`A apărut o eroare la generarea PDF: ${err?.message || "Încercați din nou."}`);
      setTimeout(() => setPdfNotification(null), 5000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const hasContactLenses = (cl_od?: any, cl_os?: any) => {
    if (!cl_od && !cl_os) return false;
    const odHasData =
      cl_od && (cl_od.sph || cl_od.cyl || cl_od.axis || cl_od.bc || cl_od.dia || cl_od.brand || cl_od.type);
    const osHasData =
      cl_os && (cl_os.sph || cl_os.cyl || cl_os.axis || cl_os.bc || cl_os.dia || cl_os.brand || cl_os.type);
    return Boolean(odHasData || osHasData);
  };

  const patientAgeDetailed = record.patientBirthDate
    ? calculateDetailedAge(record.patientBirthDate)
    : record.patientAge
    ? `${record.patientAge} ani`
    : "Nespecificat";

  const currentTurningAge = calculateTurningAge(record.patientBirthDate, record.patientAge);

  const activeParsed = parseDateStr(record.createdAt || record.updatedAt || new Date().toISOString());
  const selectedEntry =
    timelineEntries[selectedEntryIndex] ||
    timelineEntries[0] || {
      id: "active-record",
      date: record.createdAt || new Date().toISOString(),
      formattedDate: activeParsed.formatted,
      timestamp: activeParsed.timestamp,
      type: "consultation" as const,
      doctorName: "Dr. Curant",
      od: record.od,
      os: record.os,
      dp: record.dp,
      dp_od: record.dp_od,
      dp_os: record.dp_os,
      treatment: record.treatment,
      diagnostic: record.diagnostic,
      recomandari: record.recomandari,
      specialMentions: record.specialMentions,
    };

  // Helper to extract OD, OS and general diagnostic with smart deduplication
  const getParsedDiagnostics = (entry: any) => {
    let odDiag = (entry.od?.diagnostic || "").trim();
    let osDiag = (entry.os?.diagnostic || "").trim();
    const rawDiag = (entry.diagnostic || "").trim();

    const extraGeneralParts: string[] = [];

    if (rawDiag) {
      const lines = rawDiag.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);

      for (const line of lines) {
        let lineMatchedEye = false;

        // Try extracting OD diagnostic from line
        const odMatch = line.match(/(?:^|[\/\;,\s])(?:OD|Ochiul Drept|O\.D\.)\s*:\s*([^\/\;\n]+)/i);
        if (odMatch && odMatch[1] && odMatch[1].trim()) {
          if (!odDiag) {
            odDiag = odMatch[1].trim();
          }
          lineMatchedEye = true;
        }

        // Try extracting OS diagnostic from line
        const osMatch = line.match(/(?:^|[\/\;,\s])(?:OS|Ochiul Stâng|Ochiul Stang|O\.S\.)\s*:\s*([^\/\;\n]+)/i);
        if (osMatch && osMatch[1] && osMatch[1].trim()) {
          if (!osDiag) {
            osDiag = osMatch[1].trim();
          }
          lineMatchedEye = true;
        }

        if (!lineMatchedEye) {
          const cleanLine = line.replace(/^(?:OD|OS|Ochiul Drept|Ochiul Stang|Ochiul Stâng|O\.D\.|O\.S\.)\s*:\s*/i, "").trim();
          
          const matchesOD = odDiag && cleanLine.toLowerCase() === odDiag.toLowerCase();
          const matchesOS = osDiag && cleanLine.toLowerCase() === osDiag.toLowerCase();

          if (!matchesOD && !matchesOS) {
            extraGeneralParts.push(line);
          }
        }
      }
    }

    if (odDiag) {
      odDiag = odDiag.replace(/^(?:OD|Ochiul Drept|O\.D\.)\s*:\s*/i, "").trim();
    }
    if (osDiag) {
      osDiag = osDiag.replace(/^(?:OS|Ochiul Stâng|Ochiul Stang|O\.S\.)\s*:\s*/i, "").trim();
    }

    const filteredGeneral = extraGeneralParts.filter((part) => {
      const clean = part.replace(/^(?:OD|OS|Ochiul Drept|Ochiul Stang|Ochiul Stâng|O\.D\.|O\.S\.)\s*:\s*/i, "").trim().toLowerCase();
      if (!clean) return false;
      if (odDiag && clean === odDiag.toLowerCase()) return false;
      if (osDiag && clean === osDiag.toLowerCase()) return false;
      return true;
    });

    return {
      odDiag: odDiag || null,
      osDiag: osDiag || null,
      generalDiag: filteredGeneral.length > 0 ? filteredGeneral.join("\n") : null,
    };
  };

  // Render entry eye diopters & VA in side-by-side cards
  const renderEyePrescriptionCards = (entry: any) => {
    const odDiopters = getEyeDiopters(entry.od, entry.dp_od || entry.dp);
    const osDiopters = getEyeDiopters(entry.os, entry.dp_os || entry.dp);
    const odVA = getEyeVisualAcuity(entry.od);
    const osVA = getEyeVisualAcuity(entry.os);
    const odIop = entry.iop?.od;
    const osIop = entry.iop?.os;
    const { odDiag, osDiag } = getParsedDiagnostics(entry);

    const odAntSeg = entry.anteriorSegment?.od;
    const osAntSeg = entry.anteriorSegment?.os;
    const odPostSeg = entry.posteriorSegment?.od;
    const osPostSeg = entry.posteriorSegment?.os;

    const odHasData = odDiopters.length > 0 || odVA.vaWithout || odVA.vaWith || odIop || odDiag || odAntSeg || odPostSeg;
    const osHasData = osDiopters.length > 0 || osVA.vaWithout || osVA.vaWith || osIop || osDiag || osAntSeg || osPostSeg;

    if (!odHasData && !osHasData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* OD Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            darkMode
              ? "bg-slate-900/80 border-blue-900/50"
              : "bg-blue-50/40 border-blue-200/80"
          }`}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-blue-200/60 dark:border-blue-900/40">
            <span className="font-black text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              OD (Ochiul Drept)
            </span>
          </div>

          {odDiopters.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {odDiopters.map((d) => (
                <div
                  key={d.key}
                  className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-blue-100 dark:border-slate-700 shadow-2xs text-center"
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-tight">
                    {d.label}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mb-2">Fără dioptrii prescrise</p>
          )}

          {/* Visual Acuity & Tensiune Oculara (IOP) inside OD Card */}
          {(odVA.vaWithout || odVA.vaWith || odIop) && (
            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {(odVA.vaWithout || odVA.vaWith) && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                      Acuitate Vizuală
                    </span>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {odVA.vaWithout && (
                        <span>
                          f.c.: <strong className="text-base font-black text-slate-900 dark:text-slate-100">{odVA.vaWithout}</strong>
                        </span>
                      )}
                      {odVA.vaWith && (
                        <span>
                          c.c.: <strong className="text-base font-black text-slate-900 dark:text-slate-100">{odVA.vaWith}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {odIop && (
                  <div className="pl-3 border-l border-slate-300 dark:border-slate-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                      Tensiune Oculară
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {odIop} <span className="text-xs font-medium text-slate-500">mmHg</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnostic OD under OD eye */}
          {odDiag && (
            <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-0.5">
                Diagnostic OD
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                {odDiag}
              </p>
            </div>
          )}

          {/* Pol Anterior OD */}
          {odAntSeg && (
            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-0.5">
                Pol Anterior OD
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {odAntSeg}
              </p>
            </div>
          )}

          {/* Pol Posterior OD */}
          {odPostSeg && (
            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-0.5">
                Pol Posterior / Fund de Ochi OD
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {odPostSeg}
              </p>
            </div>
          )}
        </div>

        {/* OS Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            darkMode
              ? "bg-slate-900/80 border-emerald-900/50"
              : "bg-emerald-50/40 border-emerald-200/80"
          }`}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-emerald-200/60 dark:border-emerald-900/40">
            <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              OS (Ochiul Stâng)
            </span>
          </div>

          {osDiopters.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {osDiopters.map((d) => (
                <div
                  key={d.key}
                  className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-emerald-100 dark:border-slate-700 shadow-2xs text-center"
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-tight">
                    {d.label}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mb-2">Fără dioptrii prescrise</p>
          )}

          {/* Visual Acuity & Tensiune Oculara (IOP) inside OS Card */}
          {(osVA.vaWithout || osVA.vaWith || osIop) && (
            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {(osVA.vaWithout || osVA.vaWith) && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                      Acuitate Vizuală
                    </span>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {osVA.vaWithout && (
                        <span>
                          f.c.: <strong className="text-base font-black text-slate-900 dark:text-slate-100">{osVA.vaWithout}</strong>
                        </span>
                      )}
                      {osVA.vaWith && (
                        <span>
                          c.c.: <strong className="text-base font-black text-slate-900 dark:text-slate-100">{osVA.vaWith}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {osIop && (
                  <div className="pl-3 border-l border-slate-300 dark:border-slate-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                      Tensiune Oculară
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {osIop} <span className="text-xs font-medium text-slate-500">mmHg</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnostic OS under OS eye */}
          {osDiag && (
            <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-0.5">
                Diagnostic OS
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                {osDiag}
              </p>
            </div>
          )}

          {/* Pol Anterior OS */}
          {osAntSeg && (
            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-0.5">
                Pol Anterior OS
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {osAntSeg}
              </p>
            </div>
          )}

          {/* Pol Posterior OS */}
          {osPostSeg && (
            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-0.5">
                Pol Posterior / Fund de Ochi OS
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {osPostSeg}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-hidden">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-patient-summary, #printable-patient-summary *,
          .print-a4-area, .print-a4-area * {
            visibility: visible !important;
          }
          #printable-patient-summary, .print-a4-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-patient-summary .overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Patient Summary Dialog */}
      <div
        id="printable-patient-summary"
        className={`w-full max-w-[1280px] h-[95vh] flex flex-col rounded-2xl shadow-2xl border transition-all ${
          darkMode
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        } overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            darkMode ? "border-slate-800 bg-slate-950/80" : "border-slate-100 bg-slate-50/90"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                Istoric Clinic Cronologic
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {timelineEntries.length} vizite
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sortează:</span>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {sortOrder === "desc" ? "Recente primele" : "Vechi primele"}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Identity Banner */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          <div
            className={`px-6 py-4 rounded-2xl border ${
              darkMode ? "bg-slate-800/60 border-slate-700/80" : "bg-blue-50/70 border-blue-100 shadow-xs"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Pacient:
                </span>
                <strong className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                  {record.patientName}
                </strong>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Vârstă / Naștere:
                </span>
                <strong className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  {patientAgeDetailed}
                </strong>
                {record.patientBirthDate && (
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">
                    ({parseDateStr(record.patientBirthDate).formatted})
                  </span>
                )}
              </div>

              {!isDoctorUser && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Tel:
                  </span>
                  <strong className="font-bold text-slate-800 dark:text-slate-200">
                    {record.patientPhone || "Fără telefon"}
                  </strong>
                </div>
              )}

              {record.patientCnp && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    CNP:
                  </span>
                  <strong className="font-bold text-slate-700 dark:text-slate-300">
                    {record.patientCnp}
                  </strong>
                </div>
              )}

              {record.occupation && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Ocupație:
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {record.occupation}
                  </span>
                </div>
              )}

              {record.scutire && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Scutire:
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {record.scutire}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Entries List */}
          {timelineEntries.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">
                Nu există consultații sau prescripții anterioare înregistrate.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineEntries.map((entry, idx) => {
                const showContactLenses = hasContactLenses(entry.cl_od, entry.cl_os);
                const entryDate = entry.date ? new Date(entry.date) : new Date();
                const entryAgeYears = record.patientBirthDate
                  ? calculateAge(record.patientBirthDate, entryDate)
                  : record.patientAge;
                const entryDetailedAge = record.patientBirthDate
                  ? calculateDetailedAge(record.patientBirthDate, entryDate)
                  : entryAgeYears !== undefined
                  ? `${entryAgeYears} ani`
                  : null;
                const entryTurningAge = calculateTurningAge(
                  record.patientBirthDate,
                  record.patientAge,
                  entryDate
                );

                return (
                  <div
                    key={entry.id}
                    className={`rounded-2xl border transition-all p-4 ${
                      darkMode
                        ? "bg-slate-800/60 border-slate-700/80 hover:border-slate-600"
                        : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Entry Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-black text-sm shadow-xs">
                          {entry.formattedDate}
                        </span>

                        {entryAgeYears !== undefined && (
                          <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 flex-wrap shadow-2xs">
                            <span>Vârstă la examinare: <strong className="text-sm font-black text-blue-700 dark:text-blue-300">{entryDetailedAge || `${entryAgeYears} ani`}</strong></span>
                          </span>
                        )}

                        {entry.isConsultComplet && (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Consult Complet
                          </span>
                        )}
                        {entry.isControl && (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Control
                          </span>
                        )}
                        {entry.isGratis && (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Gratuit
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {entry.doctorName && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Medic:{" "}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {getDoctorFormattedName(entry.doctorName)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Documents / Reports details */}
                    {entry.documents && entry.documents.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {entry.documents.map((doc, docIdx) => (
                          <div
                            key={docIdx}
                            className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between border-b border-indigo-200/60 dark:border-indigo-900/40 pb-1.5">
                              <span className="font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                {doc.docType} (Nr. {doc.docNumber})
                              </span>
                            </div>
                            {doc.diagnostic && (
                              <p className="text-slate-800 dark:text-slate-200 text-xs">
                                <strong>Diagnostic:</strong> {doc.diagnostic}
                              </p>
                            )}
                            {doc.treatment && (
                              <p className="text-slate-800 dark:text-slate-200 text-xs">
                                <strong>Tratament:</strong> {doc.treatment}
                              </p>
                            )}
                            {doc.recomandari && (
                              <p className="text-slate-800 dark:text-slate-200 text-xs">
                                <strong>Recomandări:</strong> {doc.recomandari}
                              </p>
                            )}
                            {doc.concluzii && (
                              <p className="text-slate-800 dark:text-slate-200 text-xs">
                                <strong>Concluzii / Detalii:</strong> {doc.concluzii}
                              </p>
                            )}
                            {doc.details?.exOftalmologic && (
                              <p className="text-slate-800 dark:text-slate-200 text-xs">
                                <strong>Examen Oftalmologic:</strong> {doc.details.exOftalmologic}
                              </p>
                            )}
                            {doc.details?.motivTrimitere && (
                              <p className="text-slate-800 dark:text-slate-200 text-xs">
                                <strong>Motiv trimitere / examinare:</strong> {doc.details.motivTrimitere}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Eye Prescription side-by-side cards (OD left, OS right) */}
                    {renderEyePrescriptionCards(entry)}

                    {/* Contact Lenses Section */}
                    {showContactLenses && (
                      <div className="p-3 mb-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Lentile de Contact Prescrise
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {entry.cl_od && (
                            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/40">
                              <span className="font-black text-purple-700 dark:text-purple-400 block mb-1 text-xs">
                                OD (Ochiul Drept)
                              </span>
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                Sferă: {entry.cl_od.sph || "-"} | Cil: {entry.cl_od.cyl || "-"} |
                                Ax: {entry.cl_od.axis ? `${entry.cl_od.axis}°` : "-"}
                              </p>
                              {(entry.cl_od.bc || entry.cl_od.dia || entry.cl_od.brand) && (
                                <p className="text-xs text-slate-500 mt-1">
                                  BC: {entry.cl_od.bc || "-"} | DIA: {entry.cl_od.dia || "-"} |
                                  Brand: {entry.cl_od.brand || entry.cl_od.type || "-"}
                                </p>
                              )}
                            </div>
                          )}

                          {entry.cl_os && (
                            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/40">
                              <span className="font-black text-purple-700 dark:text-purple-400 block mb-1 text-xs">
                                OS (Ochiul Stâng)
                              </span>
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                Sferă: {entry.cl_os.sph || "-"} | Cil: {entry.cl_os.cyl || "-"} |
                                Ax: {entry.cl_os.axis ? `${entry.cl_os.axis}°` : "-"}
                              </p>
                              {(entry.cl_os.bc || entry.cl_os.dia || entry.cl_os.brand) && (
                                <p className="text-xs text-slate-500 mt-1">
                                  BC: {entry.cl_os.bc || "-"} | DIA: {entry.cl_os.dia || "-"} |
                                  Brand: {entry.cl_os.brand || entry.cl_os.type || "-"}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Treatment & Recommendations (Full width across the page) */}
                    {(() => {
                      const { generalDiag } = getParsedDiagnostics(entry);
                      if (!generalDiag && !entry.treatment && !entry.recomandari && !entry.specialMentions && !entry.symptoms) return null;

                      return (
                        <div className="flex flex-col gap-2.5 text-xs pt-2 w-full">
                          {generalDiag && (
                            <div className="w-full p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 shadow-2xs">
                              <span className="font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider block mb-1 text-[11px]">
                                Diagnostic General / Mențiuni Diagnostic
                              </span>
                              <p className="text-slate-900 dark:text-slate-100 font-bold text-sm leading-relaxed whitespace-pre-line">
                                {generalDiag}
                              </p>
                            </div>
                          )}

                        {entry.treatment && (
                          <div className="w-full p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs">
                            <span className="font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block mb-1 text-[11px]">
                              Tratament Prescris
                            </span>
                            <p className="text-slate-900 dark:text-slate-100 font-bold text-sm leading-relaxed whitespace-pre-line">
                              {entry.treatment}
                            </p>
                          </div>
                        )}

                        {entry.recomandari && (
                          <div className="w-full p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
                            <span className="font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider block mb-1 text-[11px]">
                              Recomandări
                            </span>
                            <p className="text-slate-900 dark:text-slate-100 font-bold text-xs leading-relaxed whitespace-pre-line">
                              {entry.recomandari}
                            </p>
                          </div>
                        )}

                        {entry.specialMentions && (
                          <div className="w-full p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <span className="font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider block mb-1 text-[11px]">
                              Mențiuni Speciale
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-line">
                              {entry.specialMentions}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                    {/* Axial Length */}
                    {(entry.axialLength?.od || entry.axialLength?.os) && (
                      <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs">
                          📏 Lungime Axială: OD {entry.axialLength?.od || "-"} mm | OS{" "}
                          {entry.axialLength?.os || "-"} mm
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Section: Axial Length Myopia Charts - ONLY IF DATA EXISTS */}
          {hasAxialLengthData && (
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Grafice Lungime Axială (Control Miopie)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Evoluția percentilelor de creștere a lungimii axiale în timp
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {/* OD Chart */}
                {axialDataOD.length > 0 && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/80 border-slate-200"
                    }`}
                  >
                    <h4 className="text-xs font-black text-center text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                      Ochiul Drept (OD)
                    </h4>
                    <MyopiaChart
                      sex={record.patientSex || ""}
                      patientData={axialDataOD}
                      darkMode={darkMode}
                    />
                  </div>
                )}

                {/* OS Chart */}
                {axialDataOS.length > 0 && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/80 border-slate-200"
                    }`}
                  >
                    <h4 className="text-xs font-black text-center text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                      Ochiul Stâng (OS)
                    </h4>
                    <MyopiaChart
                      sex={record.patientSex || ""}
                      patientData={axialDataOS}
                      darkMode={darkMode}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Dată Eliberare Fișă Pacient (ca la raport medical) - Sub Istoric Pacienți */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              darkMode
                ? "bg-slate-800/50 border-slate-700/80"
                : "bg-slate-100/70 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-[11px] font-black tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                  Dată Eliberare Fișă Pacient
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                  ca la raport medical
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  updateReleaseDate(
                    String(today.getDate()),
                    MONTHS_RO[today.getMonth()],
                    String(today.getFullYear()),
                  );
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Setează data curentă
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <div>
                  <label className="block text-[8px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Zi
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 text-center text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={eliberatZi}
                    onChange={(e) =>
                      updateReleaseDate(e.target.value, eliberatLuna, eliberatAn)
                    }
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Lună
                  </label>
                  <select
                    className="w-full p-2 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={eliberatLuna}
                    onChange={(e) =>
                      updateReleaseDate(eliberatZi, e.target.value, eliberatAn)
                    }
                  >
                    {MONTHS_RO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-700 dark:text-slate-300 uppercase mb-1">
                    An
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 text-center text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={eliberatAn}
                    onChange={(e) =>
                      updateReleaseDate(eliberatZi, eliberatLuna, e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/70 text-xs">
                <span className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">
                  Data pe Fișa Pacient PDF:
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {formattedReleaseDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3 border-t flex flex-wrap items-center justify-between gap-3 no-print ${
            darkMode ? "border-slate-800 bg-slate-950/80" : "border-slate-100 bg-slate-50/90"
          }`}
        >
          {/* Bottom Left GREEN Descarcă PDF button + notification */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Descarcă istoricul clinic A4 în format PDF cu data de eliberare specificată"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPDF ? "Se generează PDF..." : "Descarcă PDF"}</span>
            </button>

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/80">
              Data eliberare: <strong className="text-slate-900 dark:text-white font-black">{formattedReleaseDate}</strong>
            </span>

            {pdfNotification && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                {pdfNotification}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Pacient: <strong className="text-slate-800 dark:text-slate-200 font-bold">{record.patientName}</strong>
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all"
            >
              Închide
            </button>
          </div>
        </div>
      </div>

      {/* Offscreen Printable Sheet for PDF Export */}
      <div
        id="pdf-export-wrapper"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0px",
          width: "210mm",
          backgroundColor: "#ffffff",
          zIndex: -9999,
          pointerEvents: "none",
          opacity: 1,
        }}
      >
        <div id="printable-a4-summary-sheet" className="p-8 bg-white text-slate-900 space-y-4 font-sans text-xs leading-tight">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {clinicLogo ? (
                <img src={clinicLogo} alt="Logo Clinica" className="h-12 w-auto object-contain max-w-[120px]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-base shrink-0">
                  N
                </div>
              )}
              <div>
                <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Clinica Oftalmologică Negreanu
                </h1>
                <p className="text-[11px] font-semibold text-slate-700">
                  tel: 0248223162, Pitești, Argeș
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700 mt-0.5">
                  Fișă Medicală - Istoric Clinic Cronologic Pacient
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-800 shrink-0">
              <p><strong>Data eliberare:</strong> {formattedReleaseDate}</p>
            </div>
          </div>

          {/* Patient Identity Box */}
          <div className="p-2.5 border border-slate-900 rounded bg-white text-xs space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-bold">
              <span>Pacient: <span className="text-sm uppercase font-black">{record.patientName}</span></span>
              <span>
                Vârstă: {patientAgeDetailed}
              </span>
              {record.patientBirthDate && <span>Data nașterii: {parseDateStr(record.patientBirthDate).formatted}</span>}
              {record.patientCnp && <span>CNP: {record.patientCnp}</span>}
              {record.patientPhone && <span>Tel: {record.patientPhone}</span>}
            </div>
          </div>

          {/* Title */}
          <div className="border-b border-slate-900 pb-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Consultații & Vizite Cronologice ({timelineEntries.length})
            </h2>
          </div>

          {/* Chronological Entries */}
          <div className="space-y-3">
            {timelineEntries.map((entry, idx) => {
              const odDiopters = getEyeDiopters(entry.od, entry.dp_od || entry.dp);
              const osDiopters = getEyeDiopters(entry.os, entry.dp_os || entry.dp);
              const odVA = getEyeVisualAcuity(entry.od);
              const osVA = getEyeVisualAcuity(entry.os);
              const odIop = entry.iop?.od;
              const osIop = entry.iop?.os;
              const { odDiag, osDiag, generalDiag } = getParsedDiagnostics(entry);
              const odAntSeg = entry.anteriorSegment?.od;
              const osAntSeg = entry.anteriorSegment?.os;
              const odPostSeg = entry.posteriorSegment?.od;
              const osPostSeg = entry.posteriorSegment?.os;

              const entryDate = entry.date ? new Date(entry.date) : new Date();
              const entryAgeYears = record.patientBirthDate
                ? calculateAge(record.patientBirthDate, entryDate)
                : record.patientAge;
              const entryDetailedAge = record.patientBirthDate
                ? calculateDetailedAge(record.patientBirthDate, entryDate)
                : entryAgeYears !== undefined
                ? `${entryAgeYears} ani`
                : null;
              const entryTurningAge = calculateTurningAge(
                record.patientBirthDate,
                record.patientAge,
                entryDate
              );

              return (
                <div
                  key={entry.id || idx}
                  className="p-2.5 border border-slate-400 rounded space-y-1.5 text-xs text-slate-900 bg-white"
                >
                  {/* Entry Header line */}
                  <div className="flex flex-wrap items-center justify-between font-bold border-b border-slate-300 pb-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        Data vizită: <span className="text-sm font-black">{entry.formattedDate}</span>
                      </span>
                      {entryAgeYears !== undefined && (
                        <span className="font-semibold text-slate-800">
                          — Vârstă: <strong className="font-black text-slate-900">{entryDetailedAge || `${entryAgeYears} ani`}</strong>
                        </span>
                      )}
                      <span className="font-bold text-slate-900">
                        — Medic: <strong>{getDoctorFormattedName(entry.doctorName)}</strong>
                      </span>
                      {entry.isConsultComplet ? " (Consult Complet)" : entry.isControl ? " (Control)" : ""}
                    </div>
                  </div>

                  {/* Side by side eyes OD & OS */}
                  {(odDiopters.length > 0 || osDiopters.length > 0 || odVA.vaWithout || osVA.vaWithout || odIop || osIop || odDiag || osDiag || odAntSeg || osAntSeg || odPostSeg || osPostSeg) && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {/* OD */}
                      <div className="p-1.5 border border-slate-300 rounded">
                        <span className="font-bold uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-0.5 mb-1">
                          OD (Ochiul Drept)
                        </span>
                        {odDiopters.length > 0 && (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                            {odDiopters.map((d) => (
                              <span key={d.key}>
                                {d.label}: <strong>{d.value}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-semibold mt-1">
                          {odVA.vaWithout && <span>AV f.c.: <strong>{odVA.vaWithout}</strong></span>}
                          {odVA.vaWith && <span>AV c.c.: <strong>{odVA.vaWith}</strong></span>}
                          {odIop && <span>Tensiune (IOP): <strong>{odIop} mmHg</strong></span>}
                        </div>
                        {odDiag && (
                          <div className="mt-1 pt-0.5 border-t border-slate-200">
                            <strong>Diag OD:</strong> {odDiag}
                          </div>
                        )}
                        {odAntSeg && (
                          <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                            <strong>Pol Ant. OD:</strong> {odAntSeg}
                          </div>
                        )}
                        {odPostSeg && (
                          <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                            <strong>Pol Post. OD:</strong> {odPostSeg}
                          </div>
                        )}
                      </div>

                      {/* OS */}
                      <div className="p-1.5 border border-slate-300 rounded">
                        <span className="font-bold uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-0.5 mb-1">
                          OS (Ochiul Stâng)
                        </span>
                        {osDiopters.length > 0 && (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                            {osDiopters.map((d) => (
                              <span key={d.key}>
                                {d.label}: <strong>{d.value}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-semibold mt-1">
                          {osVA.vaWithout && <span>AV f.c.: <strong>{osVA.vaWithout}</strong></span>}
                          {osVA.vaWith && <span>AV c.c.: <strong>{osVA.vaWith}</strong></span>}
                          {osIop && <span>Tensiune (IOP): <strong>{osIop} mmHg</strong></span>}
                        </div>
                        {osDiag && (
                          <div className="mt-1 pt-0.5 border-t border-slate-200">
                            <strong>Diag OS:</strong> {osDiag}
                          </div>
                        )}
                        {osAntSeg && (
                          <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                            <strong>Pol Ant. OS:</strong> {osAntSeg}
                          </div>
                        )}
                        {osPostSeg && (
                          <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                            <strong>Pol Post. OS:</strong> {osPostSeg}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents / Reports */}
                  {entry.documents && entry.documents.length > 0 && (
                    <div className="p-2 border border-indigo-200 rounded bg-indigo-50/40 text-xs space-y-1 mt-1">
                      {entry.documents.map((doc, docIdx) => (
                        <div key={docIdx} className="space-y-0.5">
                          <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px] block border-b border-indigo-200 pb-0.5">
                            {doc.docType} (Nr. {doc.docNumber})
                          </span>
                          {doc.diagnostic && <div><strong>Diagnostic:</strong> {doc.diagnostic}</div>}
                          {doc.treatment && <div><strong>Tratament:</strong> {doc.treatment}</div>}
                          {doc.recomandari && <div><strong>Recomandări:</strong> {doc.recomandari}</div>}
                          {doc.concluzii && <div><strong>Concluzii / Detalii:</strong> {doc.concluzii}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General Diagnostic */}
                  {generalDiag && (
                    <div className="pt-0.5">
                      <strong>Diagnostic general:</strong>{" "}
                      <span className="font-medium">{generalDiag.replace(/\n/g, " | ")}</span>
                    </div>
                  )}

                  {/* Treatment */}
                  {entry.treatment && (
                    <div className="pt-0.5">
                      <strong>Tratament prescris:</strong>{" "}
                      <span className="font-medium">{entry.treatment.replace(/\n/g, " | ")}</span>
                    </div>
                  )}

                  {/* Recomandari / Mentiuni */}
                  {(entry.recomandari || entry.specialMentions) && (
                    <div className="pt-0.5 space-y-0.5">
                      {entry.recomandari && <div><strong>Recomandări:</strong> {entry.recomandari}</div>}
                      {entry.specialMentions && <div><strong>Mențiuni:</strong> {entry.specialMentions}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* A4 Full Chronological History Printable Modal (Condensed, B&W, No Tables) */}
      {showA4Modal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[210mm] my-auto bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden print-a4-area">
            {/* Modal Controls (Hidden in print) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 no-print">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">Previzualizare A4 - Istoric Clinic Complet</h3>
                  <p className="text-[11px] text-slate-400">
                    Format A4 condensat optimizat pentru descărcare PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-md disabled:opacity-50"
                >
                  {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Descarcă PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowA4Modal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Sheet Paper Content (Condensed, B&W, No Tables) */}
            <div className="p-6 sm:p-8 bg-white text-slate-900 space-y-4 font-sans text-xs leading-tight">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {clinicLogo ? (
                    <img src={clinicLogo} alt="Logo Clinica" className="h-12 w-auto object-contain max-w-[120px]" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-base shrink-0">
                      N
                    </div>
                  )}
                  <div>
                    <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                      Clinica Oftalmologică Negreanu
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-700">
                      tel: 0248223162, Pitești, Argeș
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700 mt-0.5">
                      Fișă Medicală - Istoric Clinic Cronologic Pacient
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-800 shrink-0">
                  <p><strong>Data eliberare:</strong> {formattedReleaseDate}</p>
                </div>
              </div>

              {/* Patient Identity Box (No Tables) */}
              <div className="p-2.5 border border-slate-900 rounded bg-white text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-bold">
                  <span>Pacient: <span className="text-sm uppercase font-black">{record.patientName}</span></span>
                  <span>
                    Vârstă: {patientAgeDetailed}
                  </span>
                  {record.patientBirthDate && <span>Data nașterii: {parseDateStr(record.patientBirthDate).formatted}</span>}
                  {record.patientCnp && <span>CNP: {record.patientCnp}</span>}
                  {record.patientPhone && <span>Tel: {record.patientPhone}</span>}
                </div>
              </div>

              {/* Title */}
              <div className="border-b border-slate-900 pb-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Consultații & Vizite Cronologice ({timelineEntries.length})
                </h2>
              </div>

              {/* Chronological Entries (Condensed, B&W, No Tables) */}
              <div className="space-y-3">
                {timelineEntries.map((entry, idx) => {
                  const odDiopters = getEyeDiopters(entry.od, entry.dp_od || entry.dp);
                  const osDiopters = getEyeDiopters(entry.os, entry.dp_os || entry.dp);
                  const odVA = getEyeVisualAcuity(entry.od);
                  const osVA = getEyeVisualAcuity(entry.os);
                  const odIop = entry.iop?.od;
                  const osIop = entry.iop?.os;
                  const { odDiag, osDiag, generalDiag } = getParsedDiagnostics(entry);
                  const odAntSeg = entry.anteriorSegment?.od;
                  const osAntSeg = entry.anteriorSegment?.os;
                  const odPostSeg = entry.posteriorSegment?.od;
                  const osPostSeg = entry.posteriorSegment?.os;

                  const entryDate = entry.date ? new Date(entry.date) : new Date();
                  const entryAgeYears = record.patientBirthDate
                    ? calculateAge(record.patientBirthDate, entryDate)
                    : record.patientAge;
                  const entryDetailedAge = record.patientBirthDate
                    ? calculateDetailedAge(record.patientBirthDate, entryDate)
                    : entryAgeYears !== undefined
                    ? `${entryAgeYears} ani`
                    : null;
                  const entryTurningAge = calculateTurningAge(
                    record.patientBirthDate,
                    record.patientAge,
                    entryDate
                  );

                  return (
                    <div
                      key={entry.id || idx}
                      className="p-2.5 border border-slate-400 rounded space-y-1.5 text-xs text-slate-900 bg-white"
                    >
                      {/* Entry Header line */}
                      <div className="flex flex-wrap items-center justify-between font-bold border-b border-slate-300 pb-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>
                            Data vizită: <span className="text-sm font-black">{entry.formattedDate}</span>
                          </span>
                          {entryAgeYears !== undefined && (
                            <span className="font-semibold text-slate-800">
                              — Vârstă: <strong className="font-black text-slate-900">{entryDetailedAge || `${entryAgeYears} ani`}</strong>
                            </span>
                          )}
                          <span className="font-bold text-slate-900">
                            — Medic: <strong>{getDoctorFormattedName(entry.doctorName)}</strong>
                          </span>
                          {entry.isConsultComplet ? " (Consult Complet)" : entry.isControl ? " (Control)" : ""}
                        </div>
                      </div>

                      {/* Side by side eyes OD & OS */}
                      {(odDiopters.length > 0 || osDiopters.length > 0 || odVA.vaWithout || osVA.vaWithout || odIop || osIop || odDiag || osDiag || odAntSeg || osAntSeg || odPostSeg || osPostSeg) && (
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          {/* OD */}
                          <div className="p-1.5 border border-slate-300 rounded">
                            <span className="font-bold uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-0.5 mb-1">
                              OD (Ochiul Drept)
                            </span>
                            {odDiopters.length > 0 && (
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                                {odDiopters.map((d) => (
                                  <span key={d.key}>
                                    {d.label}: <strong>{d.value}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-semibold mt-1">
                              {odVA.vaWithout && <span>AV f.c.: <strong>{odVA.vaWithout}</strong></span>}
                              {odVA.vaWith && <span>AV c.c.: <strong>{odVA.vaWith}</strong></span>}
                              {odIop && <span>Tensiune (IOP): <strong>{odIop} mmHg</strong></span>}
                            </div>
                            {odDiag && (
                              <div className="mt-1 pt-0.5 border-t border-slate-200">
                                <strong>Diag OD:</strong> {odDiag}
                              </div>
                            )}
                            {odAntSeg && (
                              <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                                <strong>Pol Ant. OD:</strong> {odAntSeg}
                              </div>
                            )}
                            {odPostSeg && (
                              <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                                <strong>Pol Post. OD:</strong> {odPostSeg}
                              </div>
                            )}
                          </div>

                          {/* OS */}
                          <div className="p-1.5 border border-slate-300 rounded">
                            <span className="font-bold uppercase tracking-wider text-[11px] block border-b border-slate-200 pb-0.5 mb-1">
                              OS (Ochiul Stâng)
                            </span>
                            {osDiopters.length > 0 && (
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                                {osDiopters.map((d) => (
                                  <span key={d.key}>
                                    {d.label}: <strong>{d.value}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-semibold mt-1">
                              {osVA.vaWithout && <span>AV f.c.: <strong>{osVA.vaWithout}</strong></span>}
                              {osVA.vaWith && <span>AV c.c.: <strong>{osVA.vaWith}</strong></span>}
                              {osIop && <span>Tensiune (IOP): <strong>{osIop} mmHg</strong></span>}
                            </div>
                            {osDiag && (
                              <div className="mt-1 pt-0.5 border-t border-slate-200">
                                <strong>Diag OS:</strong> {osDiag}
                              </div>
                            )}
                            {osAntSeg && (
                              <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                                <strong>Pol Ant. OS:</strong> {osAntSeg}
                              </div>
                            )}
                            {osPostSeg && (
                              <div className="mt-0.5 pt-0.5 border-t border-slate-200 text-[11px]">
                                <strong>Pol Post. OS:</strong> {osPostSeg}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* General Diagnostic */}
                      {generalDiag && (
                        <div className="pt-0.5">
                          <strong>Diagnostic general:</strong>{" "}
                          <span className="font-medium">{generalDiag.replace(/\n/g, " | ")}</span>
                        </div>
                      )}

                      {/* Treatment (No tables) */}
                      {entry.treatment && (
                        <div className="pt-0.5">
                          <strong>Tratament prescris:</strong>{" "}
                          <span className="font-medium">{entry.treatment.replace(/\n/g, " | ")}</span>
                        </div>
                      )}

                      {/* Recomandari / Mentuni */}
                      {(entry.recomandari || entry.specialMentions) && (
                        <div className="pt-0.5 space-y-0.5">
                          {entry.recomandari && <div><strong>Recomandări:</strong> {entry.recomandari}</div>}
                          {entry.specialMentions && <div><strong>Mențiuni:</strong> {entry.specialMentions}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSummaryModal;
