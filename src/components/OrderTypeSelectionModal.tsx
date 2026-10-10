import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CalendarClock,
  Layers,
  Eye,
  Glasses,
  CircleDot,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  cn,
  MedicalRecord,
  PrescriptionHistoryItem,
  formatPhoneNumber,
} from "../appConstants";

export interface OrderTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentMedicalRecord: MedicalRecord | null;
  isDoctor: boolean;
  currentPatientMedicalRecords: MedicalRecord[];
  selectedHistoricalPrescriptionIndex: number | string | null;
  setSelectedHistoricalPrescriptionIndex: (val: number | string | null) => void;
  saveAndSwitchOrder: (
    targetIndex: number | null,
    newType: any,
    targetRecord?: MedicalRecord | null,
    initialDiopters?: any
  ) => void;
}

export const OrderTypeSelectionModal: React.FC<OrderTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  currentMedicalRecord,
  isDoctor,
  currentPatientMedicalRecords,
  selectedHistoricalPrescriptionIndex,
  setSelectedHistoricalPrescriptionIndex,
  saveAndSwitchOrder,
}) => {
  if (!currentMedicalRecord) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="order-type-selection-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={cn(
              "w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden border transition-all flex flex-col gap-6",
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3
                  className={cn(
                    "text-2xl font-black uppercase tracking-tighter",
                    darkMode ? "text-white" : "text-slate-900"
                  )}
                >
                  Creează Comandă
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                      darkMode
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-blue-100 text-blue-600"
                    )}
                  >
                    {currentMedicalRecord.patientName}
                  </span>
                  {!isDoctor && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        currentMedicalRecord.patientPhone &&
                          currentMedicalRecord.patientPhone.trim()
                          ? "text-slate-400"
                          : "text-rose-500 animate-pulse font-extrabold"
                      )}
                    >
                      {currentMedicalRecord.patientPhone &&
                      currentMedicalRecord.patientPhone.trim()
                        ? formatPhoneNumber(currentMedicalRecord.patientPhone)
                        : "FĂRĂ TELEFON"}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setSelectedHistoricalPrescriptionIndex(null);
                }}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Diopters Source Selection */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  1. Alege Dioptriile (Data)
                </h4>
                <div className="space-y-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {(() => {
                    const patientRecords = currentPatientMedicalRecords;

                    let allPrescriptions: PrescriptionHistoryItem[] = [];
                    patientRecords.forEach((r) => {
                      if (r.od && (r.od.sph || r.od.cyl)) {
                        allPrescriptions.push({
                          date: r.updatedAt,
                          od: r.od,
                          os: r.os,
                          dp: r.dp || "",
                          dp_od: r.dp_od,
                          dp_os: r.dp_os,
                          lensType: r.lensType,
                          lensMaterial: r.lensMaterial,
                          lensTreatment: r.lensTreatment,
                          lensHeliomat: r.lensHeliomat,
                          specialMentions: r.specialMentions || "",
                        });
                      }
                      if (r.prescriptionHistory) {
                        allPrescriptions = [
                          ...allPrescriptions,
                          ...r.prescriptionHistory,
                        ];
                      }
                    });

                    // Sort descending first to ensure we keep the latest prescription for each calendar day when filtering
                    allPrescriptions.sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );

                    const seenDates = new Set();
                    const filteredHistory = allPrescriptions.filter((item) => {
                      const isCyclo = item.cycloplegia?.enabled;
                      if (isCyclo) return false;
                      if (!item.date) return false;
                      try {
                        const dateObj = new Date(item.date);
                        if (isNaN(dateObj.getTime())) return false;
                        const dateKey = format(dateObj, "yyyy-MM-dd");
                        if (seenDates.has(dateKey)) return false;
                        seenDates.add(dateKey);
                        return true;
                      } catch {
                        if (seenDates.has(item.date)) return false;
                        seenDates.add(item.date);
                        return true;
                      }
                    });

                    return filteredHistory.map((item) => (
                      <div key={item.date} className="relative group/item">
                        <button
                          onClick={() => {
                            setSelectedHistoricalPrescriptionIndex(
                              item.date as any
                            );
                          }}
                          className={cn(
                            "w-full p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left",
                            selectedHistoricalPrescriptionIndex === item.date
                              ? darkMode
                                ? "bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-[1.02]"
                                : "bg-blue-50 border-blue-300 shadow-md scale-[1.02]"
                              : darkMode
                              ? "bg-slate-800/30 border-slate-800 hover:bg-slate-800/50 shadow-lg"
                              : "bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md"
                          )}
                        >
                          <div className="flex items-center justify-between w-full border-b border-slate-200 dark:border-slate-700 pb-2">
                            <p
                              className={cn(
                                "text-xs font-black uppercase tracking-wider",
                                darkMode ? "text-white" : "text-slate-900"
                              )}
                            >
                              {selectedHistoricalPrescriptionIndex ===
                                item.date && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                              )}
                              {format(
                                new Date(item.date),
                                "dd MMM yyyy HH:mm",
                                { locale: ro }
                              )}
                            </p>
                            {(() => {
                              const patientRecords =
                                currentPatientMedicalRecords;
                              const allOrders = patientRecords
                                .flatMap((r) => [
                                  ...(r.orderHistory || []),
                                  ...(r.glassesOrder ? [r.glassesOrder] : []),
                                ])
                                .filter((o) => !o.isDeleted);
                              const wasUsed = allOrders.some(
                                (o) => o.prescriptionDate === item.date
                              );
                              if (wasUsed) {
                                return (
                                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-full ml-auto mr-2">
                                    ochelari efectuați
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {selectedHistoricalPrescriptionIndex ===
                              item.date && (
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase px-3 py-1 rounded-full",
                                  darkMode
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                )}
                              >
                                Selectat
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {/* OD Row */}
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-[11px] font-black text-blue-500 shrink-0">
                                OD
                              </span>
                              <div
                                className={cn(
                                  "flex-1 grid grid-cols-5 gap-2 text-[10px] font-bold uppercase",
                                  selectedHistoricalPrescriptionIndex ===
                                    item.date
                                    ? darkMode
                                      ? "text-blue-200"
                                      : "text-blue-700"
                                    : darkMode
                                    ? "text-slate-400"
                                    : "text-slate-600"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Sfera
                                  </span>
                                  <span>{item.od.sph || "0.00"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Cil
                                  </span>
                                  <span>{item.od.cyl || "0.00"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Ax
                                  </span>
                                  <span>{item.od.axis || "0"}°</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Add
                                  </span>
                                  <span>{item.od.add || "---"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Prismă
                                  </span>
                                  <span>
                                    {item.od.prism
                                      ? `${item.od.prism} ${item.od.base}`
                                      : "---"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* OS Row */}
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-[11px] font-black text-indigo-500 shrink-0">
                                OS
                              </span>
                              <div
                                className={cn(
                                  "flex-1 grid grid-cols-5 gap-2 text-[10px] font-bold uppercase",
                                  selectedHistoricalPrescriptionIndex ===
                                    item.date
                                    ? darkMode
                                      ? "text-blue-200"
                                      : "text-blue-700"
                                    : darkMode
                                    ? "text-slate-400"
                                    : "text-slate-600"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Sfera
                                  </span>
                                  <span>{item.os.sph || "0.00"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Cil
                                  </span>
                                  <span>{item.os.cyl || "0.00"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Ax
                                  </span>
                                  <span>{item.os.axis || "0"}°</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Add
                                  </span>
                                  <span>{item.os.add || "---"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-60">
                                    Prismă
                                  </span>
                                  <span>
                                    {item.os.prism
                                      ? `${item.os.prism} ${item.os.base}`
                                      : "---"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Order Type Selection */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  2. Alege tipul de comandă
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      id: "distance",
                      label: "Distanță",
                      icon: <Eye className="w-4 h-4" />,
                      color: "blue",
                    },
                    {
                      id: "near",
                      label: "Aproape",
                      icon: <Glasses className="w-4 h-4" />,
                      color: "emerald",
                    },
                    {
                      id: "both",
                      label: "Ambii",
                      icon: <Layers className="w-4 h-4" />,
                      color: "purple",
                    },
                    {
                      id: "progressive_bifocal",
                      label: "Bifocal / Progresiv",
                      icon: <Layers className="w-4 h-4" />,
                      color: "amber",
                    },
                    {
                      id: "contact_lens",
                      label: "Lentile de contact",
                      icon: <CircleDot className="w-4 h-4" />,
                      color: "cyan",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (selectedHistoricalPrescriptionIndex !== null) {
                          const patientRecords = currentPatientMedicalRecords;

                          let allHistory: PrescriptionHistoryItem[] = [];
                          patientRecords.forEach((r) => {
                            if (r.od && (r.od.sph || r.od.cyl)) {
                              allHistory.push({
                                date: r.updatedAt,
                                od: r.od,
                                os: r.os,
                                dp: r.dp || "",
                                dp_od: r.dp_od,
                                dp_os: r.dp_os,
                                lensType: r.lensType,
                                lensMaterial: r.lensMaterial,
                                lensTreatment: r.lensTreatment,
                                lensHeliomat: r.lensHeliomat,
                                specialMentions: r.specialMentions || "",
                              });
                            }
                            if (r.prescriptionHistory) {
                              allHistory = [
                                ...allHistory,
                                ...r.prescriptionHistory,
                              ];
                            }
                          });

                          const item = allHistory.find(
                            (h) =>
                              h.date ===
                              (selectedHistoricalPrescriptionIndex as any)
                          );

                          if (item) {
                            saveAndSwitchOrder(
                              null,
                              option.id as any,
                              currentMedicalRecord,
                              {
                                od: item.od,
                                os: item.os,
                                dp: item.dp || "",
                                dp_od: item.dp_od,
                                dp_os: item.dp_os,
                                lensType: item.lensType,
                                lensMaterial: item.lensMaterial,
                                lensTreatment: item.lensTreatment,
                                lensHeliomat: item.lensHeliomat,
                                date: item.date,
                              }
                            );
                          } else {
                            saveAndSwitchOrder(null, option.id as any);
                          }
                        } else {
                          saveAndSwitchOrder(null, option.id as any);
                        }
                        setSelectedHistoricalPrescriptionIndex(null);
                      }}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group hover:scale-[1.02] active:scale-95",
                        darkMode
                          ? `bg-slate-800/50 border-slate-800 hover:border-${option.color}-500/50`
                          : `bg-${option.color}-50/30 border-slate-100 hover:border-${option.color}-500/30`
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-xl shadow-sm transition-colors flex items-center justify-center",
                          darkMode
                            ? `bg-slate-700 text-${option.color}-400`
                            : `bg-white text-${option.color}-600`
                        )}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-black uppercase tracking-tight",
                            darkMode ? "text-white" : "text-slate-900"
                          )}
                        >
                          {option.label}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
