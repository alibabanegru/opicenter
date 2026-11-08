import React, { useState, useMemo } from "react";
import {
  CalendarClock,
  Search,
  Filter,
  MessageSquare,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Eye,
  Check,
  Phone,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  X,
  Send,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { format, parseISO, addMonths, differenceInDays, isBefore } from "date-fns";
import { ro } from "date-fns/locale";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MedicalRecord, Appointment, cn } from "../appConstants";
import { cleanWhatsAppPhone, buildWhatsAppUrl, openWhatsAppUrl } from "../utils/whatsappUtils";

export type RecallType = "all" | "periodic" | "contact_lenses" | "glaucoma";
export type OverdueFilter = "all" | "recent" | "gt_3m" | "gt_6m" | "gt_1y" | "gt_2y";

export interface RecallPatientItem {
  id: string; // medicalRecord.id
  recordId: string;
  patientName: string;
  patientPhone: string;
  patientCnp?: string;
  patientAge?: number;
  lastVisitDate: Date;
  lastVisitFormatted: string;
  recallType: "periodic" | "contact_lenses" | "glaucoma";
  recallReason: string;
  recommendedInterval: string;
  targetDueDate: Date;
  targetDueDateFormatted: string;
  daysOverdue: number;
  overdueCategory: "upcoming" | "recent" | "gt_3m" | "gt_6m" | "gt_1y" | "gt_2y";
  doctorId?: string;
  doctorName?: string;
  diagnostic?: string;
  hasUpcomingAppointment: boolean;
  recallNotifiedAt?: string;
  recallDismissed?: boolean;
}

export interface PatientRecallPanelProps {
  darkMode: boolean;
  medicalRecords: MedicalRecord[];
  setMedicalRecords: React.Dispatch<React.SetStateAction<MedicalRecord[]>>;
  appointments: Appointment[];
  onOpenWhatsApp: (
    patientName: string,
    patientPhone: string,
    customMessage: string,
    recordId: string
  ) => void;
  onOpenMedicalRecord: (record: MedicalRecord) => void;
  onQuickSchedule: (patientName: string, patientPhone: string) => void;
  logActivity: (action: string, details: string) => void;
  getDoctorDisplayName: (doctorId: string) => string;
  onClose: () => void;
}

export const PatientRecallPanel: React.FC<PatientRecallPanelProps> = ({
  darkMode,
  medicalRecords,
  setMedicalRecords,
  appointments,
  onOpenWhatsApp,
  onOpenMedicalRecord,
  onQuickSchedule,
  logActivity,
  getDoctorDisplayName,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecallType>("all");
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>("all");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);
  const [panelNotification, setPanelNotification] = useState<{
    text: string;
    type: "error" | "success" | "info";
  } | null>(null);

  const showNotification = (
    text: string,
    type: "error" | "success" | "info" = "info",
    duration = 4500
  ) => {
    setPanelNotification({ text, type });
    setTimeout(() => {
      setPanelNotification((prev) => (prev?.text === text ? null : prev));
    }, duration);
  };

  // 1. Analyze and extract all recall candidate patients
  const allRecallItems = useMemo<RecallPatientItem[]>(() => {
    const now = new Date();
    const items: RecallPatientItem[] = [];

    // Map latest future appointment per patient
    const futureAppointmentMap = new Map<string, boolean>();
    appointments.forEach((a) => {
      if (a.status === "scheduled" && a.startTime) {
        try {
          const appDate = parseISO(a.startTime);
          if (appDate.getTime() >= now.getTime()) {
            const nameKey = (a.patientName || "").trim().toLowerCase();
            const phoneKey = (a.patientPhone || "").replace(/\D/g, "");
            if (nameKey) futureAppointmentMap.set(nameKey, true);
            if (phoneKey) futureAppointmentMap.set(phoneKey, true);
          }
        } catch {}
      }
    });

    // Map latest past appointment date per patient
    const latestPastAppointmentMap = new Map<string, Date>();
    appointments.forEach((a) => {
      if (a.startTime && a.status !== "cancelled") {
        try {
          const appDate = parseISO(a.startTime);
          if (appDate.getTime() <= now.getTime()) {
            const nameKey = (a.patientName || "").trim().toLowerCase();
            const phoneKey = (a.patientPhone || "").replace(/\D/g, "");
            if (nameKey) {
              const current = latestPastAppointmentMap.get(nameKey);
              if (!current || appDate.getTime() > current.getTime()) {
                latestPastAppointmentMap.set(nameKey, appDate);
              }
            }
            if (phoneKey) {
              const current = latestPastAppointmentMap.get(phoneKey);
              if (!current || appDate.getTime() > current.getTime()) {
                latestPastAppointmentMap.set(phoneKey, appDate);
              }
            }
          }
        } catch {}
      }
    });

    for (const record of medicalRecords) {
      // If already dismissed, skip
      if (record.recallDismissed) continue;

      const pName = (record.patientName || "").trim();
      const pPhone = (record.patientPhone || "").trim();
      if (!pName) continue;

      const nameLower = pName.toLowerCase();
      const phoneDigits = pPhone.replace(/\D/g, "");

      // Determine most accurate latest visit date
      let lastVisit: Date | null = null;
      if (phoneDigits && latestPastAppointmentMap.has(phoneDigits)) {
        lastVisit = latestPastAppointmentMap.get(phoneDigits)!;
      } else if (latestPastAppointmentMap.has(nameLower)) {
        lastVisit = latestPastAppointmentMap.get(nameLower)!;
      }

      if (!lastVisit) {
        if (record.updatedAt) {
          try {
            const d = parseISO(record.updatedAt);
            if (!isNaN(d.getTime())) lastVisit = d;
          } catch {}
        }
        if (!lastVisit && record.createdAt) {
          try {
            const d = parseISO(record.createdAt);
            if (!isNaN(d.getTime())) lastVisit = d;
          } catch {}
        }
      }

      // If no valid visit date can be inferred, skip
      if (!lastVisit || isNaN(lastVisit.getTime())) continue;

      const hasUpcomingAppointment = Boolean(
        (phoneDigits && futureAppointmentMap.has(phoneDigits)) ||
          futureAppointmentMap.has(nameLower)
      );

      const combinedText = `
        ${record.recomandari || ""}
        ${record.treatment || ""}
        ${record.specialMentions || ""}
        ${record.diagnostic || ""}
        ${record.history || ""}
      `.toLowerCase();

      // Detection A: Check Periodic Control / Revenire (6 luni, 1-2 ani, 2 ani, 1 an, 3 luni)
      let periodicDetected = false;
      let recommendedInterval = "";
      let monthsToAdd = 0;
      let recallReason = "";

      if (
        combinedText.includes("6 luni") ||
        combinedText.includes("6l") ||
        /(?:reevaluare|revenire|control)\s*(?:la|peste)?\s*6\s*luni/i.test(combinedText)
      ) {
        periodicDetected = true;
        recommendedInterval = "6 luni";
        monthsToAdd = 6;
        recallReason = "Revenire recomandată la 6 luni";
      } else if (
        combinedText.includes("1-2 ani") ||
        combinedText.includes("1 - 2 ani") ||
        /(?:reevaluare|revenire|control)\s*(?:la|peste)?\s*1\s*-\s*2\s*ani/i.test(combinedText)
      ) {
        periodicDetected = true;
        recommendedInterval = "1-2 ani";
        monthsToAdd = 18;
        recallReason = "Revenire recomandată la 1-2 ani";
      } else if (
        combinedText.includes("2 ani") ||
        /(?:reevaluare|revenire|control)\s*(?:la|peste)?\s*2\s*ani/i.test(combinedText)
      ) {
        periodicDetected = true;
        recommendedInterval = "2 ani";
        monthsToAdd = 24;
        recallReason = "Revenire recomandată la 2 ani";
      } else if (
        combinedText.includes("1 an") ||
        /(?:reevaluare|revenire|control)\s*(?:la|peste)?\s*1\s*an/i.test(combinedText)
      ) {
        periodicDetected = true;
        recommendedInterval = "1 an";
        monthsToAdd = 12;
        recallReason = "Revenire recomandată la 1 an";
      } else if (
        combinedText.includes("3 luni") ||
        /(?:reevaluare|revenire|control)\s*(?:la|peste)?\s*3\s*luni/i.test(combinedText)
      ) {
        periodicDetected = true;
        recommendedInterval = "3 luni";
        monthsToAdd = 3;
        recallReason = "Revenire recomandată la 3 luni";
      }

      // Detection B: Contact Lenses (expired after 6 or 12 months)
      const hasContactLenses = Boolean(
        record.cl_od?.sph ||
          record.cl_od?.base ||
          record.cl_os?.sph ||
          record.cl_os?.base ||
          record.glassesOrder?.cl_od?.sph ||
          record.glassesOrder?.cl_os?.sph ||
          combinedText.includes("lentile de contact") ||
          combinedText.includes("lentila contact")
      );

      // Detection C: Glaucoma / Intraocular Pressure monitoring
      const iopOdVal = parseFloat(record.iop?.od || "0");
      const iopOsVal = parseFloat(record.iop?.os || "0");
      const hasGlaucoma = Boolean(
        /(glaucom|hio|hipertensiune\s*ocular|tensiune\s*ocular|pio\s*crescut)/i.test(
          record.diagnostic || ""
        ) ||
          /(timolol|xalatan|latanoprost|tafluprost|cosopt|azopt|brimonidina|duotrav|travoprost|glaucom)/i.test(
            record.treatment || ""
          ) ||
          /(glaucom)/i.test(record.history || "") ||
          iopOdVal >= 21 ||
          iopOsVal >= 21
      );

      // We determine the best recall match for this patient
      let finalType: "periodic" | "contact_lenses" | "glaucoma" | null = null;
      let finalReason = "";
      let finalMonths = 0;
      let finalInterval = "";

      if (periodicDetected) {
        finalType = "periodic";
        finalReason = recallReason;
        finalMonths = monthsToAdd;
        finalInterval = recommendedInterval;
      } else if (hasGlaucoma) {
        finalType = "glaucoma";
        finalInterval = iopOdVal >= 21 || iopOsVal >= 21 ? "3 luni" : "6 luni";
        finalMonths = iopOdVal >= 21 || iopOsVal >= 21 ? 3 : 6;
        finalReason = `Monitorizare Glaucom & Tensiune Oculară (PIO: ${record.iop?.od || "-"}/${record.iop?.os || "-"})`;
      } else if (hasContactLenses) {
        finalType = "contact_lenses";
        const monthsPassedSinceVisit = Math.floor(
          differenceInDays(now, lastVisit) / 30.4
        );
        if (monthsPassedSinceVisit >= 12) {
          finalInterval = "12 luni";
          finalMonths = 12;
          finalReason = "Prescripție Lentile de Contact Expirată (termen 12 luni)";
        } else {
          finalInterval = "6 luni";
          finalMonths = 6;
          finalReason = "Verificare / Reînnoire Lentile Contact (termen 6 luni)";
        }
      }

      if (!finalType) continue;

      const targetDueDate = addMonths(lastVisit, finalMonths);
      const daysOverdue = differenceInDays(now, targetDueDate);

      // Determine overdue category
      let overdueCategory: "upcoming" | "recent" | "gt_3m" | "gt_6m" | "gt_1y" | "gt_2y" =
        "upcoming";
      if (daysOverdue >= 730) {
        overdueCategory = "gt_2y"; // > 2 ani
      } else if (daysOverdue >= 365) {
        overdueCategory = "gt_1y"; // > 1 an
      } else if (daysOverdue >= 180) {
        overdueCategory = "gt_6m"; // > 6 luni
      } else if (daysOverdue >= 90) {
        overdueCategory = "gt_3m"; // > 3 luni
      } else if (daysOverdue >= 0) {
        overdueCategory = "recent"; // Recent scadent (< 3 luni)
      } else {
        overdueCategory = "upcoming"; // În curând
      }

      items.push({
        id: record.id,
        recordId: record.id,
        patientName: pName,
        patientPhone: pPhone,
        patientCnp: record.patientCnp,
        patientAge: record.patientAge,
        lastVisitDate: lastVisit,
        lastVisitFormatted: format(lastVisit, "dd.MM.yyyy"),
        recallType: finalType,
        recallReason: finalReason,
        recommendedInterval: finalInterval,
        targetDueDate,
        targetDueDateFormatted: format(targetDueDate, "dd.MM.yyyy"),
        daysOverdue,
        overdueCategory,
        doctorId: record.doctorId,
        doctorName: record.doctorName,
        diagnostic: record.diagnostic,
        hasUpcomingAppointment,
        recallNotifiedAt: record.recallNotifiedAt,
        recallDismissed: record.recallDismissed,
      });
    }

    // Sort by days overdue descending (most overdue first)
    return items.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [medicalRecords, appointments]);

  // 2. Filtered list based on user selections
  const filteredItems = useMemo(() => {
    return allRecallItems.filter((item) => {
      // Type filter
      if (typeFilter !== "all" && item.recallType !== typeFilter) return false;

      // Doctor filter
      if (doctorFilter !== "all" && item.doctorId !== doctorFilter) return false;

      // Overdue status filter
      if (overdueFilter === "recent" && item.overdueCategory !== "recent") return false;
      if (overdueFilter === "gt_3m") {
        // > 3 luni includes gt_3m, gt_6m, gt_1y, gt_2y
        if (item.daysOverdue < 90) return false;
      }
      if (overdueFilter === "gt_6m") {
        // > 6 luni includes gt_6m, gt_1y, gt_2y
        if (item.daysOverdue < 180) return false;
      }
      if (overdueFilter === "gt_1y") {
        // > 1 an includes gt_1y, gt_2y
        if (item.daysOverdue < 365) return false;
      }
      if (overdueFilter === "gt_2y") {
        // > 2 ani
        if (item.daysOverdue < 730) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const n = item.patientName.toLowerCase();
        const p = item.patientPhone.toLowerCase();
        const c = (item.patientCnp || "").toLowerCase();
        const r = item.recallReason.toLowerCase();
        const d = (item.diagnostic || "").toLowerCase();
        if (
          !n.includes(q) &&
          !p.includes(q) &&
          !c.includes(q) &&
          !r.includes(q) &&
          !d.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allRecallItems, typeFilter, overdueFilter, doctorFilter, searchQuery]);

  // Counts for category badges
  const stats = useMemo(() => {
    let periodic = 0;
    let cl = 0;
    let glaucoma = 0;
    let gt3m = 0;
    let gt6m = 0;
    let gt1y = 0;
    let gt2y = 0;
    let notified = 0;

    allRecallItems.forEach((item) => {
      if (item.recallType === "periodic") periodic++;
      if (item.recallType === "contact_lenses") cl++;
      if (item.recallType === "glaucoma") glaucoma++;
      if (item.daysOverdue >= 90) gt3m++;
      if (item.daysOverdue >= 180) gt6m++;
      if (item.daysOverdue >= 365) gt1y++;
      if (item.daysOverdue >= 730) gt2y++;
      if (item.recallNotifiedAt) notified++;
    });

    return {
      total: allRecallItems.length,
      periodic,
      cl,
      glaucoma,
      gt3m,
      gt6m,
      gt1y,
      gt2y,
      notified,
    };
  }, [allRecallItems]);

  // Generate customized WhatsApp message according to recall type
  const buildRecallMessage = (item: RecallPatientItem): string => {
    const docDisplayName = item.doctorId ? getDoctorDisplayName(item.doctorId) : "";
    const docPart = docDisplayName ? ` (${docDisplayName})` : "";

    if (item.recallType === "glaucoma") {
      return (
        `Bună ziua, ${item.patientName}!\n\n` +
        `Vă contactăm din partea clinicii de oftalmologie Optik${docPart}.\n` +
        `Conform evidenței dumneavoastră medicale și a recomandării medicului oftalmolog, a sosit momentul pentru efectuarea controlului periodic de monitorizare a tensiunii intraoculare (PIO) și a sănătății vederii.\n\n` +
        `Controlul regulat este esențial pentru menținerea presiunii în parametri optimi și protejarea nervului optic.\n\n` +
        `Pentru a programa o consultație la o dată și oră convenabilă, vă rugăm să ne răspundeți la acest mesaj sau să ne apelați.\n\n` +
        `Vă dorim multă sănătate!`
      );
    }

    if (item.recallType === "contact_lenses") {
      return (
        `Bună ziua, ${item.patientName}!\n\n` +
        `Vă contactăm din partea clinicii Optik${docPart}.\n` +
        `Prescripția dumneavoastră pentru lentile de contact a atins termenul recomandat de verificare și reînnoire (${item.recommendedInterval}).\n\n` +
        `Pentru a vă asigura un confort vizual excelent și sănătatea corneei, vă invităm la un control de rutină și reactualizarea parametrilor lentilelor.\n\n` +
        `Pentru stabilirea unei programări, vă rugăm să ne răspundeți la acest mesaj sau să ne contactați telefonic.\n\n` +
        `Vă dorim o zi excelentă!`
      );
    }

    // Default: Periodic recall (6 luni, 1-2 ani, etc.)
    return (
      `Bună ziua, ${item.patientName}!\n\n` +
      `Vă contactăm din partea clinicii de oftalmologie Optik${docPart}.\n` +
      `Conform fișei dumneavoastră medicale din data de ${item.lastVisitFormatted}, a sosit momentul pentru controlul periodic oftalmologic recomandat (${item.recallReason}).\n\n` +
      `Evaluarea periodică a dioptriilor și a fundului de ochi este esențială pentru prevenirea oboselii oculare și menținerea unei vederi clare.\n\n` +
      `Vă rugăm să ne răspundeți la acest mesaj sau să ne apelați pentru a stabili o dată convenabilă pentru consultație.\n\n` +
      `Vă dorim o zi frumoasă!`
    );
  };

  // Trigger WhatsApp sending
  const handleSendWhatsAppNotification = async (item: RecallPatientItem) => {
    if (!item.patientPhone) {
      showNotification(`Pacientul ${item.patientName} nu are un număr de telefon înregistrat!`, "error");
      return;
    }

    const { cleanPhone, isValid, error } = cleanWhatsAppPhone(item.patientPhone);
    if (!isValid) {
      showNotification(`Numărul de telefon "${item.patientPhone}" nu este valid: ${error}`, "error");
      return;
    }

    const message = buildRecallMessage(item);

    // Call WhatsApp modal handler
    onOpenWhatsApp(item.patientName, item.patientPhone, message, item.recordId);

    // Mark as notified in Firestore and memory
    const nowIso = new Date().toISOString();
    try {
      await updateDoc(doc(db, "medical_records", item.recordId), {
        recallNotifiedAt: nowIso,
      });

      setMedicalRecords((prev) =>
        prev.map((r) =>
          r.id === item.recordId ? { ...r, recallNotifiedAt: nowIso } : r
        )
      );

      logActivity(
        "Alerte Rechemare (Recall)",
        `Notificare WhatsApp trimisă către ${item.patientName} (${item.recommendedInterval} - ${item.recallReason})`
      );
    } catch (err) {
      console.warn("Could not mark recall notification date:", err);
    }
  };

  // Quick Direct WhatsApp Send
  const handleQuickDirectWhatsApp = async (item: RecallPatientItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.patientPhone) {
      showNotification(`Pacientul ${item.patientName} nu are un număr de telefon înregistrat!`, "error");
      return;
    }

    const message = buildRecallMessage(item);
    const { url, isValidPhone, error } = buildWhatsAppUrl(item.patientPhone, message);

    if (!isValidPhone) {
      showNotification(`Eroare număr de telefon: ${error}`, "error");
      return;
    }

    const opened = openWhatsAppUrl(url);
    if (!opened) {
      navigator.clipboard?.writeText(message);
      showNotification(
        "Fereastra pop-up WhatsApp a fost blocată de browser. Mesajul a fost copiat în clipboard! Deschideți WhatsApp și lipiți mesajul (Ctrl+V).",
        "info",
        7000
      );
    }

    // Mark as notified
    const nowIso = new Date().toISOString();
    try {
      await updateDoc(doc(db, "medical_records", item.recordId), {
        recallNotifiedAt: nowIso,
      });

      setMedicalRecords((prev) =>
        prev.map((r) =>
          r.id === item.recordId ? { ...r, recallNotifiedAt: nowIso } : r
        )
      );

      logActivity(
        "Alerte Rechemare (Recall)",
        `Trimis WhatsApp direct către ${item.patientName}`
      );
    } catch {}
  };

  // Dismiss single item from recall
  const handleDismissSingle = async (item: RecallPatientItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Eliminați pacientul "${item.patientName}" din lista curentă de rechemare? Fișa medicală rămâne intactă.`
      )
    ) {
      return;
    }

    const nowIso = new Date().toISOString();
    try {
      await updateDoc(doc(db, "medical_records", item.recordId), {
        recallDismissed: true,
        recallDismissedAt: nowIso,
      });

      setMedicalRecords((prev) =>
        prev.map((r) =>
          r.id === item.recordId
            ? { ...r, recallDismissed: true, recallDismissedAt: nowIso }
            : r
        )
      );

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.recordId);
        return next;
      });

      logActivity(
        "Alerte Rechemare (Recall)",
        `Eliminat din lista de rechemare: ${item.patientName}`
      );
    } catch (err) {
      showNotification("A apărut o eroare la actualizarea fișei.", "error");
      console.error(err);
    }
  };

  // Bulk dismissal handler with specific criteria
  const handleBulkDismiss = async (criteria: "selected" | "gt_3m" | "gt_6m" | "gt_1y" | "gt_2y" | "all_filtered") => {
    let targets: RecallPatientItem[] = [];
    let label = "";

    if (criteria === "selected") {
      targets = allRecallItems.filter((i) => selectedIds.has(i.recordId));
      label = `${targets.length} pacienți selectați manual`;
    } else if (criteria === "gt_3m") {
      targets = allRecallItems.filter((i) => i.daysOverdue >= 90);
      label = `${targets.length} pacienți cu reveniri mai vechi de 3 luni`;
    } else if (criteria === "gt_6m") {
      targets = allRecallItems.filter((i) => i.daysOverdue >= 180);
      label = `${targets.length} pacienți cu reveniri mai vechi de 6 luni`;
    } else if (criteria === "gt_1y") {
      targets = allRecallItems.filter((i) => i.daysOverdue >= 365);
      label = `${targets.length} pacienți cu reveniri mai vechi de 1 an`;
    } else if (criteria === "gt_2y") {
      targets = allRecallItems.filter((i) => i.daysOverdue >= 730);
      label = `${targets.length} pacienți cu reveniri mai vechi de 2 ani`;
    } else if (criteria === "all_filtered") {
      targets = filteredItems;
      label = `toți cei ${targets.length} pacienți filtrați în vizualizarea curentă`;
    }

    if (targets.length === 0) {
      showNotification("Nu există pacienți care corespund acestui criteriu de eliminare!", "info");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Confirmare Ștergere / Arhivare Rechemări",
      description: `Sigur doriți să eliminați din lista de rechemare ${label}? Fișele medicale și prescripțiile pacienților rămân salvate integral în arhivă.`,
      action: async () => {
        setIsProcessingBulk(true);
        const nowIso = new Date().toISOString();
        const targetIds = new Set(targets.map((t) => t.recordId));

        try {
          // Process updates in chunks of 20 to avoid throttling
          const chunkSize = 20;
          for (let i = 0; i < targets.length; i += chunkSize) {
            const chunk = targets.slice(i, i + chunkSize);
            await Promise.all(
              chunk.map((item) =>
                updateDoc(doc(db, "medical_records", item.recordId), {
                  recallDismissed: true,
                  recallDismissedAt: nowIso,
                }).catch((e) => console.warn("Failed update doc", item.recordId, e))
              )
            );
          }

          // Update local state
          setMedicalRecords((prev) =>
            prev.map((r) =>
              targetIds.has(r.id)
                ? { ...r, recallDismissed: true, recallDismissedAt: nowIso }
                : r
            )
          );

          setSelectedIds(new Set());
          logActivity(
            "Alerte Rechemare (Recall)",
            `Eliminare în masă: ${targets.length} pacienți (${criteria})`
          );
        } catch (err) {
          showNotification("A apărut o problemă în timpul procesării în masă.", "error");
          console.error(err);
        } finally {
          setIsProcessingBulk(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Toggle selection
  const toggleSelect = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.recordId)));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h4 className="text-base font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
              Alerte de Rechemare a Pacienților (Recall)
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Monitorizați pacienții programați pentru revenire (<strong>6 luni</strong>, <strong>1-2 ani</strong>, <strong>2 ani</strong>), prescripțiile de lentile de contact expirate (<strong>6 / 12 luni</strong>) și pacienții cu <strong>glaucom / tensiune oculară</strong> pentru trimiterea rapidă a notificărilor pe WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Rechemări Active
            </div>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {stats.total} pacienți
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Reveniri Periodice */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter("periodic");
            setOverdueFilter("all");
          }}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs",
            typeFilter === "periodic"
              ? "bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30"
              : darkMode
                ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Revenire Periodică
            </span>
            <CalendarCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              {stats.periodic}
            </span>
            <span className="text-[11px] text-slate-500">6 luni, 1-2 ani</span>
          </div>
        </button>

        {/* Card 2: Lentile de Contact */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter("contact_lenses");
            setOverdueFilter("all");
          }}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs",
            typeFilter === "contact_lenses"
              ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30"
              : darkMode
                ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Lentile Contact
            </span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.cl}
            </span>
            <span className="text-[11px] text-slate-500">expirate 6/12l</span>
          </div>
        </button>

        {/* Card 3: Glaucom / Tensiune */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter("glaucoma");
            setOverdueFilter("all");
          }}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs",
            typeFilter === "glaucoma"
              ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30"
              : darkMode
                ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Glaucom & PIO
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {stats.glaucoma}
            </span>
            <span className="text-[11px] text-slate-500">tensiune oculară</span>
          </div>
        </button>

        {/* Card 4: Deja Notificați */}
        <div
          className={cn(
            "p-3.5 rounded-2xl border text-left flex flex-col justify-between shadow-2xs",
            darkMode
              ? "bg-slate-800/60 border-slate-700 text-slate-300"
              : "bg-white border-slate-200 text-slate-700"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Notificați WhatsApp
            </span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.notified}
            </span>
            <span className="text-[11px] text-slate-500">din {stats.total} total</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Quick Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Căutare */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută după nume pacient, telefon, CNP sau diagnostic..."
              className={cn(
                "w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none transition-all",
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500"
                  : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 shadow-2xs"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtru Tip Rechemare */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as RecallType)}
              className={cn(
                "px-3 py-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer",
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-200"
                  : "bg-white border-slate-200 text-slate-700 shadow-2xs"
              )}
            >
              <option value="all">Toate Tipurile de Rechemare</option>
              <option value="periodic">Revenire Periodică (6 luni / 1-2 ani)</option>
              <option value="contact_lenses">Prescripții Lentile Contact (expirate)</option>
              <option value="glaucoma">Glaucom & Tensiune Oculară (PIO)</option>
            </select>
          </div>

          {/* Filtru Vechime Scadență */}
          <select
            value={overdueFilter}
            onChange={(e) => setOverdueFilter(e.target.value as OverdueFilter)}
            className={cn(
              "px-3 py-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer",
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-white border-slate-200 text-slate-700 shadow-2xs"
            )}
          >
            <option value="all">Toate Scadențele</option>
            <option value="recent">Recent Scadente (&lt; 3 luni)</option>
            <option value="gt_3m">Mai vechi de 3 luni (&gt; 3 luni)</option>
            <option value="gt_6m">Mai vechi de 6 luni (&gt; 6 luni)</option>
            <option value="gt_1y">Mai vechi de 1 an (&gt; 1 an)</option>
            <option value="gt_2y">Mai vechi de 2 ani (&gt; 2 ani)</option>
          </select>
        </div>

        {/* 4. Action bar for Bulk Dismissals requested by user */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs",
                selectedIds.size === filteredItems.length && filteredItems.length > 0
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              )}
            >
              <Check className="w-3 h-3" />
              <span>
                {selectedIds.size === filteredItems.length && filteredItems.length > 0
                  ? "Deselectează Toți"
                  : "Selectează Toți"}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => handleBulkDismiss("selected")}
                disabled={isProcessingBulk}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-black flex items-center gap-1 hover:bg-rose-700 shadow-xs cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Șterge Selectați ({selectedIds.size})</span>
              </button>
            )}
          </div>

          {/* Quick Bulk Delete Buttons as explicitly requested */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mr-1">
              Ștergere în masă:
            </span>

            <button
              type="button"
              onClick={() => handleBulkDismiss("gt_3m")}
              disabled={isProcessingBulk || stats.gt3m === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              title="Șterge toți pacienții cu scadență depășită de peste 3 luni"
            >
              <Trash2 className="w-3 h-3" />
              <span>&gt; 3 luni ({stats.gt3m})</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkDismiss("gt_6m")}
              disabled={isProcessingBulk || stats.gt6m === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              title="Șterge toți pacienții cu scadență depășită de peste 6 luni"
            >
              <Trash2 className="w-3 h-3" />
              <span>&gt; 6 luni ({stats.gt6m})</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkDismiss("gt_1y")}
              disabled={isProcessingBulk || stats.gt1y === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              title="Șterge toți pacienții cu scadență depășită de peste 1 an"
            >
              <Trash2 className="w-3 h-3" />
              <span>&gt; 1 an ({stats.gt1y})</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkDismiss("gt_2y")}
              disabled={isProcessingBulk || stats.gt2y === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              title="Șterge toți pacienții cu scadență depășită de peste 2 ani"
            >
              <Trash2 className="w-3 h-3" />
              <span>&gt; 2 ani ({stats.gt2y})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Patient List Table */}
      <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <CalendarCheck className="w-12 h-12 mx-auto text-indigo-500/50" />
            <h5 className="font-black text-sm text-slate-700 dark:text-slate-200">
              Nicio alertă de rechemare activă
            </h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nu s-au găsit pacienți care să corespundă criteriilor sau toți pacienții au fost deja notificați ori arhivati.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.recordId);
            const phoneValid = cleanWhatsAppPhone(item.patientPhone).isValid;

            return (
              <div
                key={item.id}
                onClick={(e) => toggleSelect(item.recordId, e)}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs cursor-pointer shadow-2xs hover:shadow-sm",
                  isSelected
                    ? "bg-indigo-500/10 border-indigo-500/60 ring-2 ring-indigo-500/20"
                    : darkMode
                      ? "bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/50"
                      : "bg-white border-slate-200/90 hover:border-indigo-300"
                )}
              >
                {/* Left col: Checkbox + Patient Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {item.patientName}
                      </span>

                      {item.patientAge && (
                        <span className="text-[11px] text-slate-400 font-semibold">
                          ({item.patientAge} ani)
                        </span>
                      )}

                      {/* Type Badge */}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                          item.recallType === "glaucoma"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : item.recallType === "contact_lenses"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        )}
                      >
                        {item.recommendedInterval}
                      </span>

                      {/* Overdue Age Badge */}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                          item.daysOverdue >= 730
                            ? "bg-rose-500 text-white"
                            : item.daysOverdue >= 365
                              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              : item.daysOverdue >= 180
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {item.daysOverdue >= 730
                          ? "> 2 ani întârziere"
                          : item.daysOverdue >= 365
                            ? "> 1 an întârziere"
                            : item.daysOverdue >= 180
                              ? "> 6 luni întârziere"
                              : item.daysOverdue >= 90
                                ? "> 3 luni întârziere"
                                : `${item.daysOverdue} zile de la scadență`}
                      </span>

                      {/* Already scheduled badge */}
                      {item.hasUpcomingAppointment && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Programat deja
                        </span>
                      )}
                    </div>

                    {/* Details row */}
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px] flex-wrap">
                      <span>
                        Ultimul consult: <strong className="text-slate-700 dark:text-slate-200">{item.lastVisitFormatted}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Scadență calculată: <strong className="text-slate-700 dark:text-slate-200">{item.targetDueDateFormatted}</strong>
                      </span>
                      <span>•</span>
                      <span className="italic text-indigo-600 dark:text-indigo-400 font-medium">
                        {item.recallReason}
                      </span>
                    </div>

                    {/* Notified timestamp badge */}
                    {item.recallNotifiedAt && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold pt-0.5">
                        <MessageSquare className="w-3 h-3" />
                        <span>
                          Notificat WhatsApp la{" "}
                          {format(parseISO(item.recallNotifiedAt), "dd.MM.yyyy HH:mm")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right col: Phone & Action buttons */}
                <div className="flex items-center gap-2 justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Phone */}
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 mr-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.patientPhone || <span className="italic text-slate-400 text-[10px]">Fără telefon</span>}</span>
                  </div>

                  {/* 1. Send WhatsApp Notification Button (Main feature) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!phoneValid}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendWhatsAppNotification(item);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer",
                        !phoneValid
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      )}
                      title="Deschide și trimite mesajul pre-completat pe WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Notificare WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      disabled={!phoneValid}
                      onClick={(e) => handleQuickDirectWhatsApp(item, e)}
                      className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                      title="Trimite direct cu 1-click în WhatsApp Web"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 2. Open Medical Record */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rec = medicalRecords.find((r) => r.id === item.recordId);
                      if (rec) onOpenMedicalRecord(rec);
                    }}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Deschide fișa medicală completă a pacientului"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {/* 3. Quick Schedule button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickSchedule(item.patientName, item.patientPhone);
                    }}
                    className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    title="Programează pacientul în calendar"
                  >
                    <CalendarClock className="w-4 h-4" />
                  </button>

                  {/* 4. Dismiss / Șterge Individual */}
                  <button
                    type="button"
                    onClick={(e) => handleDismissSingle(item, e)}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 transition-colors cursor-pointer"
                    title="Șterge / elimină pacientul din lista de rechemare"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Footer Close Button */}
      <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
        <span className="font-bold">
          Afișați {filteredItems.length} din {allRecallItems.length} pacienți în lista de rechemare
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 font-bold transition-all shadow-md cursor-pointer"
        >
          Închide Rubrica Rechemări
        </button>
      </div>

      {/* Confirmation Modal for Bulk Actions */}
      {/* Floating in-app toast notification */}
      {panelNotification && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-2 ${
            panelNotification.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/95 dark:text-rose-200 dark:border-rose-800"
              : panelNotification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/95 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/95 dark:text-indigo-200 dark:border-indigo-800"
          }`}
        >
          <span className="text-base">
            {panelNotification.type === "error" ? "⚠️" : panelNotification.type === "success" ? "✓" : "ℹ️"}
          </span>
          <span className="flex-1 leading-relaxed">{panelNotification.text}</span>
          <button
            type="button"
            onClick={() => setPanelNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[110]">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Anulează
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={confirmModal.action}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {isProcessingBulk ? "Se procesează..." : "Confirmă Eliminarea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
