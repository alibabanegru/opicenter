import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Glasses,
  Search,
  User,
  Users,
  Layout,
  Eye,
  Database,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  FileText,
  AlertTriangle,
  CalendarClock,
  RotateCcw,
  Check,
  CheckCircle2,
  CreditCard,
  X,
} from "lucide-react";
import { ro } from "date-fns/locale";
import {
  format,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";
import {
  doc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  writeBatch,
  deleteField,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  cn,
  MedicalRecord,
  ScheduleConfig,
  UserProfile,
  matchPatientName,
  removeUndefined,
} from "../appConstants";

export interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  medicalRecords: MedicalRecord[];
  setMedicalRecords: React.Dispatch<React.SetStateAction<MedicalRecord[]>>;
  profile: UserProfile | null;
  isDoctor: boolean;
  configs: ScheduleConfig[];
  clinicConfig: any;
  setPatientName: (name: string) => void;
  setPatientPhone: (phone: string) => void;
  setPatientBirthDate: (date: string) => void;
  setFaraTelefon: (fara: boolean) => void;
  setHasStoredPhone: (has: boolean) => void;
  setPatientSex: (sex: "" | "M" | "F") => void;
  setBookingError: (err: string | null) => void;
  setIsNewOrderPatientModalOpen: (open: boolean) => void;
  setCurrentMedicalRecord: (rec: MedicalRecord | null) => void;
  setActiveOrderIndex: (index: number | null) => void;
  setIsGlassesOrderModalOpen: (open: boolean) => void;
  setOrderToDelete: (order: any) => void;
  setIsOrderDeleteConfirmOpen: (open: boolean) => void;
  setIsPermanentDelete: (perm: boolean) => void;
  availableUsers?: { id: string; name: string }[];
  handleExportData?: () => void;
  handleImportData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  medicalRecords,
  setMedicalRecords,
  profile,
  isDoctor,
  configs,
  clinicConfig,
  setPatientName,
  setPatientPhone,
  setPatientBirthDate,
  setFaraTelefon,
  setHasStoredPhone,
  setPatientSex,
  setBookingError,
  setIsNewOrderPatientModalOpen,
  setCurrentMedicalRecord,
  setActiveOrderIndex,
  setIsGlassesOrderModalOpen,
  setOrderToDelete,
  setIsOrderDeleteConfirmOpen,
  setIsPermanentDelete,
  availableUsers = [],
  handleExportData: propHandleExportData,
  handleImportData: propHandleImportData,
}) => {
  const usersList = availableUsers && availableUsers.length > 0
    ? availableUsers
    : configs.map((c) => ({ id: c.doctorId, name: (c as any).doctorName || c.doctorId }));

  const handleExportData = propHandleExportData || (() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(medicalRecords, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `comenzi_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  const handleImportData = propHandleImportData || ((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          alert(`Fișier valid! Conține ${parsed.length} înregistrări.`);
        }
      } catch {
        alert("Fișier JSON invalid.");
      }
    };
    reader.readAsText(file);
  });

  const [ordersSearchQuery, setOrdersSearchQuery] = useState("");
  const [patientOrdersSearchQuery, setPatientOrdersSearchQuery] = useState("");
  const [ordersTab, setOrdersTab] = useState<
    "in-progress" | "ready" | "with-balance" | "completed" | "stats" | "deleted"
  >("in-progress");
  const [statsYear, setStatsYear] = useState<number>(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [statsView, setStatsView] = useState<"general" | "items">("general");
  const [ordersSellerFilter, setOrdersSellerFilter] = useState<string>("all");
  const [selectedDeletedOrders, setSelectedDeletedOrders] = useState<string[]>([]);
  const [selectedCompletedOrders, setSelectedCompletedOrders] = useState<string[]>([]);
  const [bulkSoftDeleteMode, setBulkSoftDeleteMode] = useState<"selected" | "all" | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<"selected" | "all" | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [hasLoadedFullArchive, setHasLoadedFullArchive] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const sendWhatsAppNotification = async (order: {
    patientPhone?: string;
    patientName?: string;
    orderNumber?: string;
    patientId?: string;
    [key: string]: any;
  }) => {
    let rawPhone = (order.patientPhone || "").trim();
    let cleanDigits = rawPhone.replace(/\D/g, "");

    if (!cleanDigits) {
      const inputPhone = window.prompt(
        "Introduceți numărul de telefon al pacientului pentru notificarea WhatsApp:",
      );
      if (!inputPhone) return;
      cleanDigits = inputPhone.replace(/\D/g, "");
    }

    if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
      cleanDigits = "4" + cleanDigits;
    } else if (!cleanDigits.startsWith("40") && cleanDigits.length === 9) {
      cleanDigits = "40" + cleanDigits;
    }

    const message =
      "Bună ziua, vă informăm că ochelarii dumneavoastră sunt gata la Clinica Negreanu din Pitesti (Piata Ceair). Vă așteptăm cu drag pentru ridicare și ajustare! Pentru alte informatii sunati va rog pe  0248223162";
    const url = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    // Salvare automată confirmare notificare WhatsApp & trecere pe ready_for_pickup
    try {
      const nowIso = new Date().toISOString();
      const notifierName = profile?.displayName || (profile as any)?.name || "Recepție";

      const targetRecord = (medicalRecords || []).find(
        (r) =>
          (order.patientId && r.id === order.patientId) ||
          r.glassesOrder?.orderNumber === order.orderNumber ||
          (r.orderHistory || []).some((o) => o.orderNumber === order.orderNumber),
      );

      const patientDocId = order.patientId || targetRecord?.id;
      if (patientDocId) {
        const docRef = doc(db, "medicalRecords", patientDocId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as MedicalRecord;
          const history = [...(data.orderHistory || [])];
          const orderIdx = history.findIndex(
            (o) => o.orderNumber === order.orderNumber,
          );

          let updatedOrder: any = null;
          if (orderIdx !== -1) {
            const currentOrd = history[orderIdx];
            const newStatus = currentOrd.status === "completed" ? "completed" : "ready_for_pickup";
            updatedOrder = {
              ...currentOrd,
              status: newStatus,
              whatsappNotifiedAt: nowIso,
              whatsappNotifiedBy: notifierName,
            };
            history[orderIdx] = updatedOrder;
          }

          const isMainOrder = data.glassesOrder?.orderNumber === order.orderNumber;
          let updatedMainGlasses = data.glassesOrder;
          if (isMainOrder && data.glassesOrder) {
            const newStatus = data.glassesOrder.status === "completed" ? "completed" : "ready_for_pickup";
            updatedMainGlasses = {
              ...data.glassesOrder,
              status: newStatus,
              whatsappNotifiedAt: nowIso,
              whatsappNotifiedBy: notifierName,
            };
            if (!updatedOrder) updatedOrder = updatedMainGlasses;
          }

          await updateDoc(
            docRef,
            removeUndefined({
              orderHistory: history,
              ...(isMainOrder && updatedMainGlasses ? { glassesOrder: updatedMainGlasses } : {}),
            }),
          );

          setMedicalRecords((prev) =>
            prev.map((r) =>
              r.id === patientDocId
                ? {
                    ...r,
                    orderHistory: history,
                    ...(isMainOrder && updatedMainGlasses ? { glassesOrder: updatedMainGlasses } : {}),
                  }
                : r,
            ),
          );

          try {
            const qStandalone = query(
              collection(db, "glasses_orders"),
              where("orderNumber", "==", order.orderNumber),
            );
            const snapStandalone = await getDocs(qStandalone);
            if (!snapStandalone.empty) {
              const batch = writeBatch(db);
              snapStandalone.docs.forEach((d) => {
                const cur = d.data();
                const newStatus = cur.status === "completed" ? "completed" : "ready_for_pickup";
                batch.update(d.ref, {
                  status: newStatus,
                  whatsappNotifiedAt: nowIso,
                  whatsappNotifiedBy: notifierName,
                });
              });
              await batch.commit();
            }
          } catch (e) {
            console.warn("Could not update standalone glasses_orders:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error setting whatsapp notification status:", err);
    }
  };

  const handleHandoverAndCollect = async (order: any) => {
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const handlerName = profile?.displayName || (profile as any)?.name || "Recepție";
      const targetRecord = (medicalRecords || []).find(
        (r) =>
          (order.patientId && r.id === order.patientId) ||
          r.glassesOrder?.orderNumber === order.orderNumber ||
          (r.orderHistory || []).some((o) => o.orderNumber === order.orderNumber),
      );

      const patientDocId = order.patientId || targetRecord?.id;
      if (!patientDocId) {
        alert("Fișa pacientului nu a putut fi identificată.");
        return;
      }

      const docRef = doc(db, "medicalRecords", patientDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as MedicalRecord;
        const history = [...(data.orderHistory || [])];
        const orderIdx = history.findIndex(
          (o) => o.orderNumber === order.orderNumber,
        );

        const currentTotal = orderIdx !== -1 ? (history[orderIdx].total || 0) : (order.total || 0);
        const updatedOrder = orderIdx !== -1 
          ? {
              ...history[orderIdx],
              status: "completed" as const,
              advance: currentTotal,
              balance: 0,
              deliveredAt: nowIso,
              deliveredBy: handlerName,
            }
          : {
              ...order,
              status: "completed" as const,
              advance: currentTotal,
              balance: 0,
              deliveredAt: nowIso,
              deliveredBy: handlerName,
            };

        if (orderIdx !== -1) {
          history[orderIdx] = updatedOrder;
        }

        const isMainGlassesOrder = data.glassesOrder?.orderNumber === order.orderNumber;
        const mainGlassesUpdated = isMainGlassesOrder ? updatedOrder : data.glassesOrder;

        await updateDoc(
          docRef,
          removeUndefined({
            orderHistory: history,
            ...(isMainGlassesOrder ? { glassesOrder: updatedOrder } : {}),
          }),
        );

        try {
          const qStandalone = query(
            collection(db, "glasses_orders"),
            where("orderNumber", "==", order.orderNumber),
          );
          const snapStandalone = await getDocs(qStandalone);
          if (!snapStandalone.empty) {
            const batch = writeBatch(db);
            snapStandalone.docs.forEach((d) => {
              batch.update(d.ref, {
                status: "completed",
                advance: currentTotal,
                balance: 0,
                deliveredAt: nowIso,
                deliveredBy: handlerName,
              });
            });
            await batch.commit();
          }
        } catch (e) {
          console.warn("Could not update standalone glasses_orders:", e);
        }

        setMedicalRecords((prev) =>
          prev.map((r) =>
            r.id === patientDocId
              ? {
                  ...r,
                  orderHistory: history,
                  ...(isMainGlassesOrder ? { glassesOrder: updatedOrder } : {}),
                }
              : r,
          ),
        );
        setFeedbackBanner({
          text: `✓ Comanda #${order.orderNumber} a fost predată și restul de plată a fost încasat integral!`,
          type: "success",
        });
        setTimeout(() => setFeedbackBanner(null), 4000);
      }
    } catch (err) {
      console.error("Error in handover & collect:", err);
      setFeedbackBanner({
        text: "A apărut o eroare la predarea comenzii.",
        type: "error",
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSetOrderStatus = async (
    order: any,
    newStatus: "in-progress" | "ready_for_pickup" | "completed",
  ) => {
    setLoading(true);
    try {
      const docRef = doc(db, "medicalRecords", order.patientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as MedicalRecord;
        const history = [...(data.orderHistory || [])];
        const orderIdx = history.findIndex(
          (o) => o.orderNumber === order.orderNumber,
        );

        if (orderIdx !== -1) {
          const updatedOrder = {
            ...history[orderIdx],
            status: newStatus as any,
            ...(newStatus === "completed"
              ? { advance: history[orderIdx].total, balance: 0 }
              : {}),
          };
          history[orderIdx] = updatedOrder;

          await updateDoc(
            docRef,
            removeUndefined({
              orderHistory: history,
              ...(data.glassesOrder?.orderNumber === order.orderNumber
                ? { glassesOrder: updatedOrder }
                : {}),
            }),
          );

          setMedicalRecords((prev) =>
            prev.map((r) =>
              r.id === order.patientId
                ? {
                    ...r,
                    orderHistory: history,
                    ...(r.glassesOrder?.orderNumber === order.orderNumber
                      ? { glassesOrder: updatedOrder }
                      : {}),
                  }
                : r,
            ),
          );
        }
      }
    } catch (err) {
      console.error("Error setting order status:", err);
    } finally {
      setLoading(false);
    }
  };

  const readyOrdersCount = useMemo(() => {
    return (medicalRecords || [])
      .flatMap((r) => [
        ...(r.orderHistory || []),
        ...(r.glassesOrder ? [r.glassesOrder] : []),
      ])
      .filter(
        (o, idx, arr) =>
          !o.isDeleted &&
          o.status === "ready_for_pickup" &&
          arr.findIndex((x) => x.orderNumber === o.orderNumber) === idx,
      ).length;
  }, [medicalRecords]);

  const unpaidOrdersCount = useMemo(() => {
    return (medicalRecords || [])
      .flatMap((r) => [
        ...(r.orderHistory || []),
        ...(r.glassesOrder ? [r.glassesOrder] : []),
      ])
      .filter(
        (o, idx, arr) =>
          !o.isDeleted &&
          Math.max(0, (o.total || 0) - (o.advance || 0)) > 0 &&
          arr.findIndex((x) => x.orderNumber === o.orderNumber) === idx,
      ).length;
  }, [medicalRecords]);

  const handleCollectRemainingBalance = async (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentTotal = Number(order.total || 0);
    const currentAdvance = Number(order.advance || 0);
    const restAmount = Math.max(0, currentTotal - currentAdvance);
    if (restAmount <= 0) {
      setFeedbackBanner({
        text: `Comanda #${order.orderNumber} este deja achitată integral (rest 0 RON).`,
        type: "success",
      });
      setTimeout(() => setFeedbackBanner(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const handlerName = profile?.displayName || (profile as any)?.name || "Recepție";
      const targetRecord = (medicalRecords || []).find(
        (r) =>
          (order.patientId && r.id === order.patientId) ||
          r.glassesOrder?.orderNumber === order.orderNumber ||
          (r.orderHistory || []).some((o) => o.orderNumber === order.orderNumber),
      );

      const patientDocId = order.patientId || targetRecord?.id;
      if (!patientDocId) {
        setFeedbackBanner({
          text: "Fișa pacientului nu a putut fi identificată.",
          type: "error",
        });
        setTimeout(() => setFeedbackBanner(null), 4000);
        return;
      }

      const docRef = doc(db, "medicalRecords", patientDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as MedicalRecord;
        const history = [...(data.orderHistory || [])];
        const orderIdx = history.findIndex(
          (o) => o.orderNumber === order.orderNumber,
        );

        let updatedOrder: any = null;
        if (orderIdx !== -1) {
          const cur = history[orderIdx];
          updatedOrder = {
            ...cur,
            advance: currentTotal,
            balance: 0,
            balanceCollectedAt: nowIso,
            balanceCollectedBy: handlerName,
          };
          history[orderIdx] = updatedOrder;
        }

        const isMainGlassesOrder = data.glassesOrder?.orderNumber === order.orderNumber;
        let updatedMainGlasses = data.glassesOrder;
        if (isMainGlassesOrder && data.glassesOrder) {
          updatedMainGlasses = {
            ...data.glassesOrder,
            advance: currentTotal,
            balance: 0,
            balanceCollectedAt: nowIso,
            balanceCollectedBy: handlerName,
          };
          if (!updatedOrder) updatedOrder = updatedMainGlasses;
        }

        await updateDoc(
          docRef,
          removeUndefined({
            ...(history.length > 0 ? { orderHistory: history } : {}),
            ...(isMainGlassesOrder && updatedMainGlasses ? { glassesOrder: updatedMainGlasses } : {}),
          }),
        );

        try {
          const qStandalone = query(
            collection(db, "glasses_orders"),
            where("orderNumber", "==", order.orderNumber),
          );
          const snapStandalone = await getDocs(qStandalone);
          if (!snapStandalone.empty) {
            const batch = writeBatch(db);
            snapStandalone.docs.forEach((d) => {
              batch.update(d.ref, {
                advance: currentTotal,
                balance: 0,
                balanceCollectedAt: nowIso,
                balanceCollectedBy: handlerName,
              });
            });
            await batch.commit();
          }
        } catch (e) {
          console.warn("Could not update standalone glasses_orders:", e);
        }

        setMedicalRecords((prev) =>
          prev.map((r) =>
            r.id === patientDocId
              ? {
                  ...r,
                  ...(history.length > 0 ? { orderHistory: history } : {}),
                  ...(isMainGlassesOrder && updatedMainGlasses ? { glassesOrder: updatedMainGlasses } : {}),
                }
              : r,
          ),
        );

        setFeedbackBanner({
          text: `✓ Încasare confirmată: Restul de ${restAmount.toFixed(2)} RON pentru ${order.patientName || "pacient"} a fost achitat cu succes! Soldul comenzii #${order.orderNumber} este acum 0 RON.`,
          type: "success",
        });
        setTimeout(() => setFeedbackBanner(null), 4500);
      }
    } catch (err) {
      console.error("Error collecting remaining balance:", err);
      setFeedbackBanner({
        text: "A apărut o problemă la încasarea restului de plată.",
        type: "error",
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFullArchiveOrders = async () => {
    if (isLoadingArchive || hasLoadedFullArchive) return;
    setIsLoadingArchive(true);
    try {
      const snap = await getDocs(collection(db, "medicalRecords"));
      const allMeds = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
      setMedicalRecords(allMeds);
      setHasLoadedFullArchive(true);
    } catch (e) {
      console.error("Error loading full archive for orders:", e);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return (medicalRecords || [])
      .flatMap((record) => {
        const history = record.orderHistory || [];
        const current = record.glassesOrder ? [record.glassesOrder] : [];
        const combined = [...history];
        current.forEach((c) => {
          if (!combined.some((h) => h.orderNumber === c.orderNumber)) {
            combined.push(c);
          }
        });

        return combined.map((order) => ({
          ...order,
          patientId: record.id,
          patientName: record.patientName,
          patientPhone: record.patientPhone,
        }));
      })
      .filter((order) => {
        const matchesOrderNum = (order.orderNumber || "")
          .toLowerCase()
          .includes(ordersSearchQuery.toLowerCase());
        const cleanDigits = patientOrdersSearchQuery.replace(/\D/g, "");
        const matchesPatient =
          matchPatientName(order.patientName, patientOrdersSearchQuery) ||
          (order.patientPhone || "").includes(patientOrdersSearchQuery) ||
          (cleanDigits.length >= 3 && (order.patientPhone || "").replace(/\D/g, "").includes(cleanDigits));

        const isCompleted = order.status === "completed";
        const isReady = order.status === "ready_for_pickup";
        const hasUnpaidBalance = Math.max(0, (order.total || 0) - (order.advance || 0)) > 0;
        const matchesTab =
          ordersTab === "deleted"
            ? order.isDeleted
            : !order.isDeleted &&
              (ordersTab === "completed"
                ? isCompleted
                : ordersTab === "ready"
                  ? isReady
                  : ordersTab === "with-balance"
                    ? hasUnpaidBalance
                    : ordersTab === "in-progress"
                      ? !isCompleted
                      : true);

        const sellerMatch =
          ordersSellerFilter === "all" ||
          order.sellerId === ordersSellerFilter;

        return (
          matchesOrderNum &&
          matchesPatient &&
          matchesTab &&
          sellerMatch
        );
      })
      .sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;

        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;

        if (ordersTab === "in-progress") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
  }, [
    medicalRecords,
    ordersSearchQuery,
    patientOrdersSearchQuery,
    ordersTab,
    ordersSellerFilter,
  ]);

  const filteredStatsOrders = useMemo(() => {
    return (medicalRecords || [])
      .flatMap((record) => {
        const history = record.orderHistory || [];
        const current = record.glassesOrder ? [record.glassesOrder] : [];
        const combined = [...history];
        current.forEach((c) => {
          if (!combined.some((h) => h.orderNumber === c.orderNumber)) {
            combined.push(c);
          }
        });
        return combined;
      })
      .filter((order) => !order.isDeleted)
      .filter((order) => {
        const date = new Date(order.createdAt || order.deliveryDate);
        const yearMatch = date.getFullYear() === statsYear;
        const monthMatch =
          statsMonth === 0 || date.getMonth() + 1 === statsMonth;
        const sellerMatch =
          ordersSellerFilter === "all" ||
          order.sellerId === ordersSellerFilter;
        return yearMatch && monthMatch && sellerMatch;
      });
  }, [medicalRecords, statsYear, statsMonth, ordersSellerFilter]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
          <motion.div
            key="orders-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 z-[60] overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "rounded-3xl w-full max-w-[98vw] shadow-2xl border overflow-hidden flex flex-col h-[95vh]",
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200",
              )}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-amber-600 shrink-0">
                <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Glasses className="w-6 h-6" />
                  Gestiune Comenzi de Ochelari
                </h2>
                <div className="flex items-center gap-2">
                  {!hasLoadedFullArchive && (
                    <button
                      onClick={handleLoadFullArchiveOrders}
                      disabled={isLoadingArchive}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition-all border border-white/20 disabled:opacity-50 cursor-pointer shadow-xs"
                      title="Încarcă toate comenzile istorice din baza de date"
                    >
                      <Database className={cn("w-3.5 h-3.5", isLoadingArchive && "animate-spin")} />
                      {isLoadingArchive ? "Se descarcă..." : "Încarcă tot istoricul"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPatientName("");
                      setPatientPhone("");
                      setPatientBirthDate("");
                      setFaraTelefon(true);
                      setHasStoredPhone(false);
                      setPatientSex("");
                      setBookingError(null);
                      setIsNewOrderPatientModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/30"
                  >
                    <Glasses className="w-4 h-4" />
                    Comandă Nouă
                  </button>
                  <button
                    onClick={() => onClose()}
                    className="p-2 hover:bg-white/10 rounded-full transition-all text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                {/* Search Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nr. Comandă..."
                      value={ordersSearchQuery}
                      onChange={(e) => setOrdersSearchQuery(e.target.value)}
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm",
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-100"
                          : "bg-slate-50 border-slate-200 text-slate-900",
                      )}
                    />
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nume sau Telefon Pacient..."
                      value={patientOrdersSearchQuery}
                      onChange={(e) =>
                        setPatientOrdersSearchQuery(e.target.value)
                      }
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm",
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-100"
                          : "bg-slate-50 border-slate-200 text-slate-900",
                      )}
                    />
                  </div>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={ordersSellerFilter}
                      onChange={(e) => setOrdersSellerFilter(e.target.value)}
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm appearance-none",
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-100"
                          : "bg-slate-50 border-slate-200 text-slate-900",
                      )}
                    >
                      <option value="all">Toți Vânzătorii</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    onClick={() => {
                      setOrdersTab("in-progress");
                      setSelectedDeletedOrders([]);
                      setSelectedCompletedOrders([]);
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      ordersTab === "in-progress"
                        ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                    )}
                  >
                    Comenzi în lucru
                  </button>
                  <button
                    onClick={() => {
                      setOrdersTab("ready");
                      setSelectedDeletedOrders([]);
                      setSelectedCompletedOrders([]);
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                      ordersTab === "ready"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                    )}
                  >
                    <span>Gata de ridicare</span>
                    {readyOrdersCount > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                        ordersTab === "ready" ? "bg-white text-emerald-700" : "bg-emerald-500 text-white"
                      )}>
                        {readyOrdersCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setOrdersTab("with-balance");
                      setSelectedDeletedOrders([]);
                      setSelectedCompletedOrders([]);
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                      ordersTab === "with-balance"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                    )}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Rest de Plată</span>
                    {unpaidOrdersCount > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                        ordersTab === "with-balance" ? "bg-white text-amber-700" : "bg-amber-500 text-white"
                      )}>
                        {unpaidOrdersCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setOrdersTab("completed");
                      setSelectedDeletedOrders([]);
                      setSelectedCompletedOrders([]);
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      ordersTab === "completed"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                    )}
                  >
                    Comenzi finalizate
                  </button>
                  {profile?.role === "admin" && (
                    <button
                      onClick={() => {
                        setOrdersTab("stats");
                        setSelectedDeletedOrders([]);
                        setSelectedCompletedOrders([]);
                      }}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        ordersTab === "stats"
                          ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                      )}
                    >
                      Centralizator
                    </button>
                  )}
                  {profile?.role === "admin" && (
                    <button
                      onClick={() => {
                        setOrdersTab("deleted");
                        setSelectedDeletedOrders([]);
                        setSelectedCompletedOrders([]);
                      }}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        ordersTab === "deleted"
                          ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                      )}
                    >
                      Șterse
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {feedbackBanner && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      "p-3 rounded-2xl text-xs font-black flex items-center justify-between gap-3 shadow-md",
                      feedbackBanner.type === "success"
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                        : "bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-200"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className={cn("w-4 h-4 shrink-0", feedbackBanner.type === "success" ? "text-emerald-500" : "text-rose-500")} />
                      <span>{feedbackBanner.text}</span>
                    </div>
                    <button
                      onClick={() => setFeedbackBanner(null)}
                      className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg font-black text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}

                {/* Orders List / Stats */}
                <div className="space-y-3">
                  {ordersTab === "stats" ? (
                    <div className="space-y-6">
                      <div className="flex gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                            An
                          </label>
                          <select
                            value={statsYear}
                            onChange={(e) =>
                              setStatsYear(parseInt(e.target.value))
                            }
                            className={cn(
                              "w-full p-2.5 rounded-xl border font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                              darkMode
                                ? "bg-slate-800 border-slate-700 text-white"
                                : "bg-white border-slate-200",
                            )}
                          >
                            {Array.from(
                              { length: 5 },
                              (_, i) => new Date().getFullYear() - i,
                            ).map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                            Lună (0 pentru tot anul)
                          </label>
                          <select
                            value={statsMonth}
                            onChange={(e) =>
                              setStatsMonth(parseInt(e.target.value))
                            }
                            className={cn(
                              "w-full p-2.5 rounded-xl border font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                              darkMode
                                ? "bg-slate-800 border-slate-700 text-white"
                                : "bg-white border-slate-200",
                            )}
                          >
                            <option value={0}>Tot anul {statsYear}</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (m) => (
                                <option key={`month-opt-${m}`} value={m}>
                                  {format(new Date(2000, m - 1), "MMMM", {
                                    locale: ro,
                                  })}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                          onClick={() => setStatsView("general")}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            statsView === "general"
                              ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                          )}
                        >
                          General
                        </button>
                        <button
                          onClick={() => setStatsView("items")}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            statsView === "items"
                              ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                          )}
                        >
                          Rame & Lentile
                        </button>
                      </div>

                      {(() => {
                        const totalAmount = filteredStatsOrders.reduce(
                          (sum, o) => sum + (o.total || 0),
                          0,
                        );
                        const collectedAmount = filteredStatsOrders.reduce(
                          (sum, o) => sum + (o.advance || 0),
                          0,
                        );
                        const pendingAmount = totalAmount - collectedAmount;

                        if (statsView === "items") {
                          const aggregatedFrames = new Map<string, number>();
                          const aggregatedLenses = new Map<string, number>();

                          filteredStatsOrders.forEach((order) => {
                            if (order.frameCode) {
                              aggregatedFrames.set(
                                order.frameCode,
                                (aggregatedFrames.get(order.frameCode) || 0) +
                                  1,
                              );
                            }
                            if (order.nearFrameCode) {
                              aggregatedFrames.set(
                                order.nearFrameCode,
                                (aggregatedFrames.get(order.nearFrameCode) ||
                                  0) + 1,
                              );
                            }

                            if (order.lensRightName) {
                              aggregatedLenses.set(
                                order.lensRightName,
                                (aggregatedLenses.get(order.lensRightName) ||
                                  0) + 1,
                              );
                            }
                            if (order.lensLeftName) {
                              aggregatedLenses.set(
                                order.lensLeftName,
                                (aggregatedLenses.get(order.lensLeftName) ||
                                  0) + 1,
                              );
                            }
                            if (order.nearLensRightName) {
                              aggregatedLenses.set(
                                order.nearLensRightName,
                                (aggregatedLenses.get(
                                  order.nearLensRightName,
                                ) || 0) + 1,
                              );
                            }
                            if (order.nearLensLeftName) {
                              aggregatedLenses.set(
                                order.nearLensLeftName,
                                (aggregatedLenses.get(order.nearLensLeftName) ||
                                  0) + 1,
                              );
                            }
                          });

                          const sortedFrames = Array.from(
                            aggregatedFrames.entries(),
                          ).sort((a, b) => b[1] - a[1]);
                          const sortedLenses = Array.from(
                            aggregatedLenses.entries(),
                          ).sort((a, b) => b[1] - a[1]);

                          return (
                            <div className="space-y-6 pb-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Frames Section */}
                                <div
                                  className={cn(
                                    "p-5 rounded-2xl border space-y-4",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700"
                                      : "bg-slate-50 border-slate-200",
                                  )}
                                >
                                  <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                      Rame Utilizate
                                    </h3>
                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                      {sortedFrames.reduce(
                                        (acc, curr) => acc + curr[1],
                                        0,
                                      )}{" "}
                                      Total
                                    </span>
                                  </div>
                                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {sortedFrames.length > 0 ? (
                                      sortedFrames.map(([code, count]) => (
                                        <div
                                          key={code}
                                          className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.01]",
                                            darkMode
                                              ? "bg-slate-900/50 border-slate-700 hover:border-blue-500/50"
                                              : "bg-white border-slate-100 hover:border-blue-200 shadow-sm",
                                          )}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                              <Layout className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                              {code}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-blue-600 bg-blue-500/10 px-2 py-1 rounded-lg">
                                              {count} buc.
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-10 opacity-40">
                                        <p className="text-xs">
                                          Nicio ramă în această perioadă
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Lenses Section */}
                                <div
                                  className={cn(
                                    "p-5 rounded-2xl border space-y-4",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700"
                                      : "bg-slate-50 border-slate-200",
                                  )}
                                >
                                  <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                      Lentile Utilizate
                                    </h3>
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                      {sortedLenses.reduce(
                                        (acc, curr) => acc + curr[1],
                                        0,
                                      )}{" "}
                                      Total
                                    </span>
                                  </div>
                                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {sortedLenses.length > 0 ? (
                                      sortedLenses.map(([name, count]) => (
                                        <div
                                          key={name}
                                          className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.01]",
                                            darkMode
                                              ? "bg-slate-900/50 border-slate-700 hover:border-emerald-500/50"
                                              : "bg-white border-slate-100 hover:border-emerald-200 shadow-sm",
                                          )}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                              <Eye className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                                              {name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                              {count} buc.
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-10 opacity-40">
                                        <p className="text-xs">
                                          Nicio lentilă în această perioadă
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-6 pb-6">
                            {/* Backup & Restore Section */}
                            <div
                              className={cn(
                                "p-5 rounded-2xl border space-y-4",
                                darkMode
                                  ? "bg-blue-900/10 border-blue-800/50"
                                  : "bg-blue-50 border-blue-100",
                              )}
                            >
                              <div className="flex items-center gap-3 px-1">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                  <Database className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                  <h3 className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">
                                    Backup & Import Date
                                  </h3>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                    Exportați sau importați întreaga bază de
                                    date a aplicației
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  onClick={handleExportData}
                                  className={cn(
                                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all",
                                    darkMode
                                      ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
                                  )}
                                >
                                  <Download className="w-4 h-4 text-blue-500" />
                                  Descarcă Backup (Export JSON)
                                </button>
                                <div className="relative group">
                                  <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportData}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <button
                                    className={cn(
                                      "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all",
                                      darkMode
                                        ? "bg-slate-800 group-hover:bg-slate-700 text-slate-100 border border-slate-700"
                                        : "bg-white group-hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
                                    )}
                                  >
                                    <Upload className="w-4 h-4 text-emerald-500" />
                                    Importă Date (Restaurare)
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                              <div
                                className={cn(
                                  "p-4 rounded-2xl border flex flex-col items-center justify-center text-center",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700"
                                    : "bg-white border-slate-200 shadow-sm",
                                )}
                              >
                                <span className="text-[10px] font-black uppercase text-slate-400 mb-1 leading-none">
                                  Comenzi
                                </span>
                                <span className="text-2xl font-black text-blue-600 leading-tight">
                                  {filteredStatsOrders.length}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "p-4 rounded-2xl border flex flex-col items-center justify-center text-center",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700"
                                    : "bg-white border-slate-200 shadow-sm",
                                )}
                              >
                                <span className="text-[10px] font-black uppercase text-slate-400 mb-1 leading-none text-center">
                                  Valoare Tot.
                                </span>
                                <span className="text-xl font-black text-slate-700 dark:text-slate-200 leading-tight">
                                  {totalAmount}{" "}
                                  <span className="text-[10px]">RON</span>
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "p-4 rounded-2xl border flex flex-col items-center justify-center text-center",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700"
                                    : "bg-white border-slate-200 shadow-sm",
                                )}
                              >
                                <span className="text-[10px] font-black uppercase text-slate-400 mb-1 leading-none">
                                  Incasat
                                </span>
                                <span className="text-xl font-black text-emerald-600 leading-tight">
                                  {collectedAmount}{" "}
                                  <span className="text-[10px]">RON</span>
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "p-4 rounded-2xl border flex flex-col items-center justify-center text-center",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700"
                                    : "bg-white border-slate-200 shadow-sm",
                                )}
                              >
                                <span className="text-[10px] font-black uppercase text-slate-400 mb-1 leading-none text-center">
                                  In Curs
                                </span>
                                <span className="text-xl font-black text-amber-600 leading-tight">
                                  {
                                    filteredStatsOrders.filter(
                                      (o) => o.status !== "completed",
                                    ).length
                                  }
                                </span>
                              </div>
                              <div
                                onClick={() => {
                                  setOrdersTab("with-balance");
                                }}
                                className={cn(
                                  "p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:border-amber-500 hover:scale-[1.02] active:scale-98 group",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 hover:bg-slate-750"
                                    : "bg-white border-slate-200 shadow-sm hover:bg-amber-50/40",
                                )}
                                title="Click pentru a filtra direct comenzile cu rest de plată"
                              >
                                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1 leading-none flex items-center gap-1">
                                  <CreditCard className="w-3 h-3 text-amber-500" />
                                  Rest de Plată
                                </span>
                                <span className="text-xl font-black text-rose-600 dark:text-rose-400 leading-tight">
                                  {pendingAmount}{" "}
                                  <span className="text-[10px]">RON</span>
                                </span>
                                <span className="text-[9px] font-bold text-amber-600 underline mt-1 opacity-80 group-hover:opacity-100">
                                  Filtrează {unpaidOrdersCount} &rarr;
                                </span>
                              </div>
                            </div>

                            {/* Monthly Breakdown (Only if full year selected) */}
                            {statsMonth === 0 && (
                              <div
                                className={cn(
                                  "p-5 rounded-2xl border space-y-4",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700"
                                    : "bg-slate-50 border-slate-200",
                                )}
                              >
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                                  Evoluție Lunară
                                </h3>
                                <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                  {Array.from(
                                    { length: 12 },
                                    (_, i) => i + 1,
                                  ).map((m) => {
                                    const monthOrders =
                                      filteredStatsOrders.filter((o) => {
                                        const d = new Date(
                                          o.createdAt || o.deliveryDate,
                                        );
                                        return d.getMonth() + 1 === m;
                                      });
                                    if (monthOrders.length === 0) return null;
                                    const mTotal = monthOrders.reduce(
                                      (sum, o) => sum + (o.total || 0),
                                      0,
                                    );
                                    const mCollected = monthOrders.reduce(
                                      (sum, o) => sum + (o.advance || 0),
                                      0,
                                    );
                                    return (
                                      <div
                                        key={`month-card-${m}`}
                                        className={cn(
                                          "flex justify-between items-center p-3 rounded-xl border",
                                          darkMode
                                            ? "bg-slate-900 border-slate-700"
                                            : "bg-white border-slate-100",
                                        )}
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                                            {format(
                                              new Date(2000, m - 1),
                                              "MMMM",
                                              { locale: ro },
                                            )}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-bold">
                                            {monthOrders.length} comenzi
                                          </span>
                                        </div>
                                        <div className="text-right flex flex-col">
                                          <span className="text-sm font-black text-emerald-600">
                                            {mCollected} RON
                                          </span>
                                          <span className="text-[10px] font-bold text-slate-400">
                                            din {mTotal} RON total
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Category Breakdown */}
                            <div
                              className={cn(
                                "p-5 rounded-2xl border space-y-4",
                                darkMode
                                  ? "bg-slate-800 border-slate-700"
                                  : "bg-white border-slate-200 shadow-sm",
                              )}
                            >
                              <div className="flex justify-between items-center px-1">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                  Defalcat pe Tip Comandă
                                </h3>
                                <span className="text-[10px] font-bold text-amber-600">
                                  Statistici{" "}
                                  {statsMonth === 0
                                    ? statsYear
                                    : `${format(new Date(2000, statsMonth - 1), "MMMM", { locale: ro })}  ${statsYear}`}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {(["distance", "near", "both", "progressive_bifocal", "contact_lens"] as const).map(
                                  (type) => {
                                    const typeOrders =
                                      filteredStatsOrders.filter(
                                        (o) => o.orderType === type,
                                      );
                                    const typeTotal = typeOrders.reduce(
                                      (sum, o) => sum + (o.total || 0),
                                      0,
                                    );
                                    const typeCollected = typeOrders.reduce(
                                      (sum, o) => sum + (o.advance || 0),
                                      0,
                                    );
                                    if (typeOrders.length === 0) return null;
                                    return (
                                      <div
                                        key={type}
                                        className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={cn(
                                              "w-3 h-3 rounded-full shadow-sm",
                                              type === "distance"
                                                ? "bg-blue-500"
                                                : type === "near"
                                                  ? "bg-emerald-500"
                                                  : type === "both"
                                                    ? "bg-purple-500"
                                                    : type === "progressive_bifocal"
                                                      ? "bg-pink-500"
                                                      : "bg-cyan-500",
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                                              {type === "distance"
                                                ? "Distanță"
                                                : type === "near"
                                                  ? "Aproape"
                                                  : type === "both"
                                                    ? "Ambii"
                                                    : type === "progressive_bifocal"
                                                      ? "Progresiv / Bifocal"
                                                      : "Lentile Contact"}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                              {typeOrders.length} comenzi
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                                            {typeCollected}{" "}
                                            <span className="text-[10px] opacity-70 italic">
                                              incasat
                                            </span>
                                          </div>
                                          <div className="text-[10px] font-bold text-slate-400">
                                            Total: {typeTotal} RON
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>

                            {/* List of Orders in Period */}
                            <div className="space-y-3">
                              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                                Listă Comenzi Perioadă
                              </h3>
                              <div className="space-y-2">
                                {filteredStatsOrders
                                  .slice(0, 50)
                                  .sort(
                                    (a, b) =>
                                      new Date(
                                        b.createdAt || b.deliveryDate,
                                      ).getTime() -
                                      new Date(
                                        a.createdAt || a.deliveryDate,
                                      ).getTime(),
                                  )
                                  .map((order, oIdx) => {
                                    const patient = medicalRecords.find(
                                      (p) =>
                                        p.glassesOrder?.orderNumber ===
                                          order.orderNumber ||
                                        (p.orderHistory || []).some(
                                          (h) =>
                                            h.orderNumber === order.orderNumber,
                                        ),
                                    );

                                    const statsDiffDays =
                                      order.status !== "completed" &&
                                      !order.isDeleted &&
                                      !!order.deliveryDate
                                        ? differenceInCalendarDays(
                                            new Date(order.deliveryDate),
                                            startOfDay(new Date())
                                          )
                                        : null;

                                    const isStatsOverdue = statsDiffDays !== null && statsDiffDays < 0;
                                    const isStatsDueToday = statsDiffDays !== null && statsDiffDays === 0;

                                    return (
                                      <div
                                        key={`${order.orderNumber}-${oIdx}`}
                                        className={cn(
                                          "p-3 rounded-xl border flex items-center justify-between gap-4 transition-all hover:scale-[1.01]",
                                          isStatsOverdue
                                            ? "animate-pulse-soft-red border-rose-300 dark:border-rose-600/80"
                                            : isStatsDueToday
                                              ? "animate-pulse-soft-orange border-amber-300 dark:border-amber-600/80"
                                              : darkMode
                                              ? "bg-slate-800 border-slate-700"
                                              : "bg-white border-slate-100 shadow-sm",
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={cn(
                                              "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]",
                                              order.status === "completed"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700",
                                            )}
                                          >
                                            #{order.orderNumber.slice(-3)}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs font-black dark:text-white uppercase truncate max-w-[120px]">
                                              {patient?.patientName || "Anonim"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                              {format(
                                                new Date(
                                                  order.createdAt ||
                                                    order.deliveryDate,
                                                ),
                                                "dd MMM yyyy",
                                                { locale: ro },
                                              )}
                                            </span>
                                            {order.whatsappNotifiedAt && (
                                              <span
                                                className="mt-0.5 text-[8px] font-black uppercase tracking-tight text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit"
                                                title={`Notificare WhatsApp trimisă la ${format(new Date(order.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}${order.whatsappNotifiedBy ? ` (${order.whatsappNotifiedBy})` : ""}`}
                                              >
                                                <span>📲</span>
                                                <span>Notificat {format(new Date(order.whatsappNotifiedAt), "dd.MM HH:mm")}</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                          <div className="text-right">
                                            <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                                              {order.total} RON
                                            </div>
                                            <div className="text-[9px] font-bold text-emerald-600">
                                              {order.advance} înc.
                                            </div>
                                          </div>
                                          {order.status !== "completed" && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleHandoverAndCollect({
                                                  ...order,
                                                  patientId: patient?.id || (order as any).patientId,
                                                });
                                              }}
                                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                                              title="1-Click: Încasează restul automat (sold 0) și finalizează / predă comanda"
                                            >
                                              <CheckCircle2 className="w-3 h-3 text-white" />
                                              <span className="hidden sm:inline">Predat</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              sendWhatsAppNotification({
                                                ...order,
                                                patientPhone: patient?.patientPhone || (order as any).patientPhone,
                                                patientName: patient?.patientName || (order as any).patientName,
                                                patientId: (order as any).patientId || patient?.id,
                                              });
                                            }}
                                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                                            title={order.whatsappNotifiedAt ? `Notificat la ${format(new Date(order.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}. Click pentru retrimitere.` : "Trimite mesaj WhatsApp (ochelari gata de ridicare)"}
                                          >
                                            <span className="text-xs">📲</span>
                                            <span className="hidden sm:inline">{order.whatsappNotifiedAt ? "Retrimite" : "WhatsApp"}</span>
                                          </button>
                                          {(profile?.role === "admin" ||
                                            profile?.role === "frontdesk" ||
                                            profile?.role === "seller") && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOrderToDelete({
                                                  patientId: patient?.id || "",
                                                  orderNumber:
                                                    order.orderNumber,
                                                  patientName:
                                                    patient?.patientName ||
                                                    "Anonim",
                                                });
                                                setIsOrderDeleteConfirmOpen(
                                                  true,
                                                );
                                              }}
                                              className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-all group/del"
                                            >
                                              <Trash2 className="w-4 h-4 text-rose-400 group-hover/del:text-rose-500" />
                                            </button>
                                          )}
                                          <button
                                            onClick={async () => {
                                              if (!patient) return;
                                              const history =
                                                patient.orderHistory || [];
                                              const orderIdx =
                                                history.findIndex(
                                                  (o) =>
                                                    o.orderNumber ===
                                                    order.orderNumber,
                                                );
                                              setCurrentMedicalRecord({
                                                ...patient,
                                                glassesOrder: order,
                                              });
                                              setActiveOrderIndex(
                                                orderIdx !== -1
                                                  ? orderIdx
                                                  : null,
                                              );
                                              setIsGlassesOrderModalOpen(true);
                                              onClose();
                                            }}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                          >
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                {filteredStatsOrders.length > 50 && (
                                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase italic">
                                    Se afișează doar ultimele 50 de comenzi...
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <>
                      {ordersTab === "completed" && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mb-2 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={
                                  filteredOrders.length > 0 &&
                                  selectedCompletedOrders.length === filteredOrders.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCompletedOrders(
                                      filteredOrders.map(
                                        (o) => `${o.patientId}___${o.orderNumber}`
                                      )
                                    );
                                  } else {
                                    setSelectedCompletedOrders([]);
                                  }
                                }}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                Selectează toate ({filteredOrders.length})
                              </span>
                            </label>
                            {selectedCompletedOrders.length > 0 && (
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                                {selectedCompletedOrders.length} selectat{selectedCompletedOrders.length > 1 ? "e" : "ă"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={selectedCompletedOrders.length === 0}
                              onClick={() => {
                                if (selectedCompletedOrders.length > 0) {
                                  setBulkSoftDeleteMode("selected");
                                }
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs",
                                selectedCompletedOrders.length > 0
                                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                              )}
                              title="Trimite în coș comenzile finalizate bifate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Duc în coș Selectate ({selectedCompletedOrders.length})
                            </button>

                            <button
                              disabled={filteredOrders.length === 0}
                              onClick={() => {
                                if (filteredOrders.length > 0) {
                                  setBulkSoftDeleteMode("all");
                                }
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs border",
                                filteredOrders.length > 0
                                  ? "bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 cursor-pointer"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed opacity-60"
                              )}
                              title="Trimite în coș toate comenzile finalizate afișate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Duc în coș Toate ({filteredOrders.length})
                            </button>
                          </div>
                        </div>
                      )}

                      {ordersTab === "deleted" && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mb-2 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 shadow-xs">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={
                                  filteredOrders.length > 0 &&
                                  selectedDeletedOrders.length === filteredOrders.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDeletedOrders(
                                      filteredOrders.map(
                                        (o) => `${o.patientId}___${o.orderNumber}`
                                      )
                                    );
                                  } else {
                                    setSelectedDeletedOrders([]);
                                  }
                                }}
                                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                              />
                              <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                Selectează toate ({filteredOrders.length})
                              </span>
                            </label>
                            {selectedDeletedOrders.length > 0 && (
                              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2.5 py-0.5 rounded-full">
                                {selectedDeletedOrders.length} selectat{selectedDeletedOrders.length > 1 ? "e" : "ă"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={selectedDeletedOrders.length === 0}
                              onClick={() => {
                                if (selectedDeletedOrders.length > 0) {
                                  setBulkDeleteMode("selected");
                                }
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs",
                                selectedDeletedOrders.length > 0
                                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                              )}
                              title="Șterge definitiv doar comenzile bifate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Șterge Selectate ({selectedDeletedOrders.length})
                            </button>

                            <button
                              disabled={filteredOrders.length === 0}
                              onClick={() => {
                                if (filteredOrders.length > 0) {
                                  setBulkDeleteMode("all");
                                }
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs border",
                                filteredOrders.length > 0
                                  ? "bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 cursor-pointer"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed opacity-60"
                              )}
                              title="Șterge definitiv toate comenzile din coș"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Șterge Toate ({filteredOrders.length})
                            </button>
                          </div>
                        </div>
                      )}

                      {filteredOrders.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            {ordersTab === "deleted"
                              ? "Nu există nicio comandă în coșul de gunoi."
                              : "Nu a fost găsită nicio comandă."}
                          </p>
                        </div>
                      ) : (
                        filteredOrders.map((order, idx) => {
                          const diffDays =
                            order.status !== "completed" &&
                            !order.isDeleted &&
                            !!order.deliveryDate
                              ? differenceInCalendarDays(
                                  new Date(order.deliveryDate),
                                  startOfDay(new Date())
                                )
                              : null;

                          const isOverdue = diffDays !== null && diffDays < 0;
                          const isDueToday = diffDays !== null && diffDays === 0;

                          return (
                        <div
                          key={`${order.patientId || 'order'}-${order.orderNumber}-${idx}`}
                          role="button"
                          tabIndex={0}
                          onClick={async () => {
                            // Find in memory first for instant, zero-latency loading
                            const foundRecord = medicalRecords.find(
                              (r) => r.id === order.patientId,
                            );

                            if (foundRecord) {
                              const history = foundRecord.orderHistory || [];
                              const orderToLoad = history.find(
                                (o) => o.orderNumber === order.orderNumber,
                              );
                              const orderIdx = history.findIndex(
                                (o) => o.orderNumber === order.orderNumber,
                              );

                              setCurrentMedicalRecord({
                                ...foundRecord,
                                glassesOrder:
                                  orderToLoad || foundRecord.glassesOrder,
                              });

                              setActiveOrderIndex(
                                orderIdx !== -1 ? orderIdx : null,
                              );
                              setIsGlassesOrderModalOpen(true);
                              onClose();
                              return;
                            }

                            // Fallback to fetch from Firestore if not found in memory
                            setLoading(true);
                            try {
                              const docRef = doc(
                                db,
                                "medicalRecords",
                                order.patientId,
                              );
                              const docSnap = await getDoc(docRef);
                              if (docSnap.exists()) {
                                const data = docSnap.data() as MedicalRecord;
                                const history = data.orderHistory || [];
                                const orderToLoad = history.find(
                                  (o) => o.orderNumber === order.orderNumber,
                                );
                                const orderIdx = history.findIndex(
                                  (o) => o.orderNumber === order.orderNumber,
                                );

                                setCurrentMedicalRecord({
                                  ...data,
                                  id: docSnap.id,
                                  glassesOrder:
                                    orderToLoad || data.glassesOrder,
                                });

                                setActiveOrderIndex(
                                  orderIdx !== -1 ? orderIdx : null,
                                );
                                setIsGlassesOrderModalOpen(true);
                                onClose();
                              }
                            } catch (err) {
                              console.error(
                                "Error opening record from orders:",
                                err,
                              );
                            } finally {
                              setLoading(false);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.currentTarget.click();
                            }
                          }}
                          className={cn(
                            "w-full p-4 rounded-2xl border transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer",
                            isOverdue
                              ? "animate-pulse-soft-red border-rose-300 dark:border-rose-600/80 shadow-xs shadow-rose-500/10"
                              : isDueToday
                                ? "animate-pulse-soft-orange border-amber-300 dark:border-amber-600/80 shadow-xs shadow-amber-500/10"
                                : darkMode
                                  ? order.isUrgent
                                    ? "bg-rose-900/20 border-rose-500/50 hover:bg-rose-900/30"
                                    : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                                  : order.isUrgent
                                    ? "bg-rose-50 border-rose-200 hover:border-rose-300 hover:bg-rose-100/50"
                                    : "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            {(ordersTab === "deleted" || ordersTab === "completed") && (
                              <div
                                className="p-1 -ml-1 flex items-center justify-center shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    ordersTab === "deleted"
                                      ? selectedDeletedOrders.includes(
                                          `${order.patientId}___${order.orderNumber}`
                                        )
                                      : selectedCompletedOrders.includes(
                                          `${order.patientId}___${order.orderNumber}`
                                        )
                                  }
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const key = `${order.patientId}___${order.orderNumber}`;
                                    if (ordersTab === "deleted") {
                                      if (e.target.checked) {
                                        setSelectedDeletedOrders((prev) => [...prev, key]);
                                      } else {
                                        setSelectedDeletedOrders((prev) =>
                                          prev.filter((k) => k !== key)
                                        );
                                      }
                                    } else {
                                      if (e.target.checked) {
                                        setSelectedCompletedOrders((prev) => [...prev, key]);
                                      } else {
                                        setSelectedCompletedOrders((prev) =>
                                          prev.filter((k) => k !== key)
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-5 h-5 rounded border-slate-300 dark:border-slate-600 cursor-pointer",
                                    ordersTab === "deleted"
                                      ? "text-rose-600 focus:ring-rose-500"
                                      : "text-emerald-600 focus:ring-emerald-500"
                                  )}
                                />
                              </div>
                            )}
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                isOverdue
                                  ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                                  : isDueToday
                                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                    : ordersTab === "in-progress"
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-emerald-100 text-emerald-600",
                              )}
                            >
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                                  {order.patientName}
                                </h4>
                                {order.whatsappNotifiedAt && (
                                  <span
                                    className="text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200 bg-emerald-500/15 dark:bg-emerald-950/40 border border-emerald-500/35 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
                                    title={`Notificare WhatsApp trimisă la ${format(new Date(order.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}${order.whatsappNotifiedBy ? ` de către ${order.whatsappNotifiedBy}` : ""}`}
                                  >
                                    <span className="text-emerald-600 dark:text-emerald-400">📲</span>
                                    <span>Notificat WhatsApp la {format(new Date(order.whatsappNotifiedAt), "dd.MM HH:mm")}</span>
                                  </span>
                                )}
                                {order.deliveredAt && (
                                  <span
                                    className="text-[9px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-200 bg-blue-500/15 dark:bg-blue-950/40 border border-blue-500/35 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
                                    title={`Predat la ${format(new Date(order.deliveredAt), "dd.MM.yyyy HH:mm")}${order.deliveredBy ? ` de către ${order.deliveredBy}` : ""}`}
                                  >
                                    <span>🤝</span>
                                    <span>Predat la {format(new Date(order.deliveredAt), "dd.MM HH:mm")}</span>
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-500/15 dark:bg-rose-900/40 border border-rose-300/60 dark:border-rose-700/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                    Termen depășit
                                  </span>
                                )}
                                {isDueToday && (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-200 bg-amber-500/20 dark:bg-amber-900/40 border border-amber-400/50 dark:border-amber-700/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                    <CalendarClock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    Ultima zi (Azi)
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {order.orderNumber} {!isDoctor && order.patientPhone ? `• ${order.patientPhone}` : ""}
                              </p>
                              {order.sellerName && (
                                <p className="text-[9px] font-bold text-blue-500 uppercase flex items-center gap-1 mt-0.5">
                                  <User className="w-2.5 h-2.5" />
                                  Vânzător: {order.sellerName}
                                </p>
                              )}
                              {order.isDeleted && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                  <p className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                    <Trash2 className="w-2.5 h-2.5" />
                                    Șters la:{" "}
                                    {order.deletedAt
                                      ? format(
                                          new Date(order.deletedAt),
                                          "dd.MM.yyyy HH:mm",
                                          { locale: ro },
                                        )
                                      : "-"}
                                  </p>
                                  <p className="text-[9px] font-bold text-rose-400 uppercase flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" />
                                    De: {order.deletedBy || "Anonim"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {ordersTab === "deleted" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setOrderToDelete({
                                      patientId: order.patientId,
                                      orderNumber: order.orderNumber,
                                      patientName: order.patientName,
                                    });
                                    setIsPermanentDelete(true);
                                    setIsOrderDeleteConfirmOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 transition-all flex items-center gap-2"
                                  title="Șterge definitiv comanda din baza de date"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Șterge Definitiv
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setLoading(true);
                                    try {
                                      const docRef = doc(
                                        db,
                                        "medicalRecords",
                                        order.patientId,
                                      );
                                      const docSnap = await getDoc(docRef);
                                      if (docSnap.exists()) {
                                        const data =
                                          docSnap.data() as MedicalRecord;

                                        const updatePayload: any = {};
                                        let updatedGlassesOrder = data.glassesOrder;
                                        let updatedHistory = data.orderHistory || [];
                                        let modified = false;

                                        if (data.glassesOrder?.orderNumber === order.orderNumber) {
                                          const updated = { ...data.glassesOrder };
                                          delete (updated as any).isDeleted;
                                          delete (updated as any).deletedAt;
                                          delete (updated as any).deletedBy;
                                          updatedGlassesOrder = updated;
                                          updatePayload.glassesOrder = updated;
                                          modified = true;
                                        }

                                        const hasMatchingInHistory = updatedHistory.some(
                                          (o) => o.orderNumber === order.orderNumber
                                        );
                                        if (hasMatchingInHistory) {
                                          updatedHistory = updatedHistory.map((o) => {
                                            if (o.orderNumber === order.orderNumber) {
                                              const updated = { ...o };
                                              delete (updated as any).isDeleted;
                                              delete (updated as any).deletedAt;
                                              delete (updated as any).deletedBy;
                                              return updated;
                                            }
                                            return o;
                                          });
                                          updatePayload.orderHistory = updatedHistory;
                                          modified = true;
                                        }

                                        if (modified) {
                                          await updateDoc(docRef, updatePayload);
                                          setMedicalRecords((prev) =>
                                            prev.map((r) =>
                                              r.id === order.patientId
                                                ? {
                                                    ...r,
                                                    ...(updatePayload.glassesOrder ? { glassesOrder: updatedGlassesOrder } : {}),
                                                    ...(updatePayload.orderHistory ? { orderHistory: updatedHistory } : {}),
                                                  }
                                                : r
                                            )
                                          );
                                        }

                                        const qStandalone = query(
                                          collection(db, "glasses_orders"),
                                          where(
                                            "orderNumber",
                                            "==",
                                            order.orderNumber,
                                          ),
                                        );
                                        const snapStandalone =
                                          await getDocs(qStandalone);
                                        const batch = writeBatch(db);
                                        snapStandalone.docs.forEach((d) => {
                                          batch.update(d.ref, {
                                            isDeleted: deleteField(),
                                            deletedAt: deleteField(),
                                            deletedBy: deleteField(),
                                          });
                                        });
                                        await batch.commit();
                                        alert("Comandă restaurată.");
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Error restoring order:",
                                        err,
                                      );
                                      alert("Eroare la restaurare.");
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Restaurare
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {(ordersTab === "in-progress" || ordersTab === "ready") && (
                                  <div className="flex flex-col items-center gap-2">
                                  <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-tighter bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    {order.orderType === "near"
                                      ? "Aproape"
                                      : order.orderType === "both"
                                        ? "Ambele"
                                        : order.orderType === "progressive_bifocal"
                                          ? "Bifocal/Progr"
                                          : "Distanță"}
                                  </span>

                                  {order.status === "ready_for_pickup" ? (
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                        ✓ Gata de ridicare
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          sendWhatsAppNotification(order);
                                        }}
                                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer animate-pulse-subtle"
                                        title={order.whatsappNotifiedAt ? `Notificat WhatsApp la ${format(new Date(order.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}. Click pentru retrimitere.` : "Deschide WhatsApp cu mesajul prestabilit pentru ridicarea ochelarilor"}
                                      >
                                        <span className="text-sm">📲</span>
                                        <span>{order.whatsappNotifiedAt ? "Retrimite WhatsApp" : "Trimite WhatsApp"}</span>
                                      </button>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetOrderStatus(order, "completed");
                                          }}
                                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                                          title="1-Click: Încasează restul automat (sold 0) și finalizează / predă comanda"
                                        >
                                          <CheckCircle2 className="w-3 h-3 text-white" />
                                          <span>Predat & Încasat Restul {order.balance > 0 ? `(${order.balance} lei)` : ""}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetOrderStatus(order, "in-progress");
                                          }}
                                          className="text-[9px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                                          title="Revenire la status În Lucru"
                                        >
                                          În lucru
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSetOrderStatus(order, "ready_for_pickup");
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                        title="Bifează statusul Gata de ridicare (activează butonul WhatsApp)"
                                      >
                                        <span>👓 Gata de ridicare</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          sendWhatsAppNotification(order);
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer"
                                        title={order.whatsappNotifiedAt ? `Notificat WhatsApp la ${format(new Date(order.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}. Click pentru retrimitere.` : "Deschide WhatsApp cu mesajul prestabilit pentru ridicarea ochelarilor"}
                                      >
                                        <span className="text-sm">📲</span>
                                        <span>{order.whatsappNotifiedAt ? "Retrimite WhatsApp" : "Trimite WhatsApp"}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleHandoverAndCollect(order);
                                        }}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                                        title="1-Click: Încasează restul automat (sold 0) și finalizează / predă comanda"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                        <span>Predat & Încasat {order.balance > 0 ? `(${order.balance} lei)` : ""}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              {ordersTab === "completed" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sendWhatsAppNotification(order);
                                  }}
                                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer shrink-0"
                                  title={order.whatsappNotifiedAt ? `Notificat WhatsApp la ${format(new Date(order.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}. Click pentru retrimitere.` : "Deschide WhatsApp cu mesajul prestabilit pentru ridicarea ochelarilor"}
                                >
                                  <span className="text-sm">📲</span>
                                  <span>{order.whatsappNotifiedAt ? "Retrimite WhatsApp" : "Trimite WhatsApp"}</span>
                                </button>
                              )}
                            </div>
                          )}
                            <div className="flex items-center gap-6">
                              {(profile?.role === "admin" ||
                                profile?.role === "frontdesk" ||
                                profile?.role === "seller") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrderToDelete({
                                      patientId: order.patientId,
                                      orderNumber: order.orderNumber,
                                      patientName: order.patientName,
                                    });
                                    setIsOrderDeleteConfirmOpen(true);
                                  }}
                                  className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-all group/del"
                                >
                                  <Trash2 className="w-5 h-5 text-rose-400 group-hover/del:text-rose-500" />
                                </button>
                              )}
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 dark:text-white uppercase tracking-widest">
                                  Data Comandă
                                </p>
                                <p className="text-xs font-black text-slate-600 dark:text-slate-300">
                                  {order.createdAt
                                    ? format(
                                        new Date(order.createdAt),
                                        "dd MMM yyyy",
                                        { locale: ro },
                                      )
                                    : "-"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 dark:text-white uppercase tracking-widest">
                                  Termen Livrare
                                </p>
                                <p
                                  className={cn(
                                    "text-sm font-black flex items-center justify-end gap-1",
                                    isOverdue
                                      ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                      : isDueToday
                                        ? "text-amber-600 dark:text-amber-400 font-extrabold"
                                        : ordersTab === "in-progress"
                                          ? "text-amber-600"
                                          : "text-slate-500",
                                  )}
                                  title={
                                    order.deliveryDate
                                      ? format(
                                          new Date(order.deliveryDate),
                                          "dd  MMMM  yyyy",
                                          { locale: ro },
                                        )
                                      : ""
                                  }
                                >
                                  {isOverdue && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  )}
                                  {isDueToday && (
                                    <CalendarClock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  )}
                                  {(() => {
                                    if (!order.deliveryDate) return "-";
                                    const diff = differenceInCalendarDays(
                                      new Date(order.deliveryDate),
                                      startOfDay(new Date()),
                                    );
                                    if (diff === 0) return "Azi (Ultima zi)";
                                    if (diff === 1) return "Mâine";
                                    if (diff === -1) return "Ieri (Depășit)";
                                    if (diff > 0) return `În ${diff} zile`;
                                    return `${Math.abs(diff)} zile depășit`;
                                  })()}
                                </p>
                              </div>
                              {(() => {
                                const orderTotal = Number(order.total || 0);
                                const orderAdvance = Number(order.advance || 0);
                                const orderBalance = Math.max(0, orderTotal - orderAdvance);
                                return (
                                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-right">
                                        <div className="text-[9px] font-black uppercase text-slate-400 leading-none mb-0.5">Total</div>
                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                          {orderTotal.toFixed(2)} RON
                                        </span>
                                      </div>
                                      <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-right">
                                        <div className="text-[9px] font-black uppercase text-slate-400 leading-none mb-0.5">Avans</div>
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                          {orderAdvance.toFixed(2)} RON
                                        </span>
                                      </div>
                                      <div className={cn(
                                        "px-2.5 py-1 rounded-xl text-right border transition-all",
                                        orderBalance > 0
                                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                                          : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                      )}>
                                        <div className="text-[9px] font-black uppercase opacity-75 leading-none mb-0.5">
                                          {orderBalance > 0 ? "Rest de plată" : "Sold"}
                                        </div>
                                        <span className="text-xs font-black">
                                          {orderBalance > 0 ? `${orderBalance.toFixed(2)} RON` : "Achitat (0 RON)"}
                                        </span>
                                      </div>
                                    </div>

                                    {orderBalance > 0 && !order.isDeleted && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleCollectRemainingBalance(order, e)}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer shrink-0"
                                        title={`Încasează rapid diferența de ${orderBalance.toFixed(2)} RON fără a deschide fereastra complexă de configurare`}
                                      >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        <span>Încasează Restul ({orderBalance.toFixed(0)} RON)</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
                </div>
              </div>
            </motion.div>
          </motion.div>
    </AnimatePresence>
  );
};
