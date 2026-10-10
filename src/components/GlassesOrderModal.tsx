import React, { Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Glasses,
  Phone,
  Edit2,
  Plus,
  User,
  Zap,
  SlidersHorizontal,
  X,
  Trash2,
  CircleDot,
  Eye,
  Package,
  Store,
  AlertTriangle,
  CheckCircle2,
  Check,
  Triangle,
  Calendar,
  CalendarClock,
  MessageSquare,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  cn,
  MedicalRecord,
  UserProfile,
  FrameStockItem,
  GlassesOrder,
  formatPhoneNumber,
  removeUndefined,
  deformPath,
} from "../appConstants";
import { FrameConfigurator, FRAME_SHAPES } from "./FrameConfigurator";

export interface GlassesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentMedicalRecord: MedicalRecord | null;
  setCurrentMedicalRecord: (record: MedicalRecord | null) => void;
  activeOrderIndex: number;
  profile: UserProfile | null;
  isDoctor: boolean;
  frameStockList: FrameStockItem[];
  frameSuggestions: string[];
  lensSuggestions: string[];
  orderViewMode: "rapid" | "advanced";
  handleSetOrderViewMode: (mode: "rapid" | "advanced") => void;
  orderModalError: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  finalizeOrder: () => Promise<void>;
  isFinalizeConfirmationOpen: boolean;
  setIsFinalizeConfirmationOpen: (open: boolean) => void;
  updateOrder: (fieldOrUpdates: keyof GlassesOrder | string | Record<string, any>, value?: any) => void;
  validateOrderAxisHelper: (order: any) => boolean;
  saveAndPrintGlassesOrder: () => void;
  isDistanceFrameConfigOpen: boolean;
  setIsDistanceFrameConfigOpen: (open: boolean) => void;
  isNearFrameConfigOpen: boolean;
  setIsNearFrameConfigOpen: (open: boolean) => void;
  setFramePickerTarget: (target: "distance" | "near" | null) => void;
  setFramePickerCategory: (category: string) => void;
  setFramePickerSearch: (search: string) => void;
  setIsPrismModalOpen: (open: boolean) => void;
  setPrismEye: (eye: "OD" | "OS") => void;
  setPrismTarget: (target: any) => void;
  setTempPrismValue: (val: string) => void;
  setTempPrismBase: (val: any) => void;
  setIsPhoneEditModalOpen: (open: boolean) => void;
  setTempEditPhone: (phone: string) => void;
  isGlassesOrderModalOpen?: boolean;
  setIsGlassesOrderModalOpen?: (open: boolean) => void;
}

export const GlassesOrderModal: React.FC<GlassesOrderModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  currentMedicalRecord,
  setCurrentMedicalRecord,
  activeOrderIndex,
  profile,
  isDoctor,
  frameStockList,
  frameSuggestions,
  lensSuggestions,
  orderViewMode,
  handleSetOrderViewMode,
  orderModalError,
  loading,
  setLoading,
  finalizeOrder,
  isFinalizeConfirmationOpen,
  setIsFinalizeConfirmationOpen,
  updateOrder,
  validateOrderAxisHelper,
  saveAndPrintGlassesOrder,
  isDistanceFrameConfigOpen,
  setIsDistanceFrameConfigOpen,
  isNearFrameConfigOpen,
  setIsNearFrameConfigOpen,
  setFramePickerTarget,
  setFramePickerCategory,
  setFramePickerSearch,
  setIsPrismModalOpen,
  setPrismEye,
  setPrismTarget,
  setTempPrismValue,
  setTempPrismBase,
  setIsPhoneEditModalOpen,
  setTempEditPhone,
  setIsGlassesOrderModalOpen = (open: boolean) => { if (!open) onClose(); },
}) => {
  const isGlassesOrderModalOpen = isOpen;
  if (!currentMedicalRecord) return null;

  return (
    <AnimatePresence>
      {isGlassesOrderModalOpen && (
          <motion.div
            key="glasses-order-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col mx-4",
                darkMode ? "bg-slate-900 border border-slate-800" : "bg-white",
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  "p-8 border-b border-white/10 flex justify-between items-center transition-colors duration-500 bg-blue-600 shadow-lg shadow-blue-900/20",
                )}
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                    <Glasses className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-4xl font-black text-white uppercase tracking-tight drop-shadow-sm">
                        {currentMedicalRecord.patientName}
                      </h3>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border-2",
                          currentMedicalRecord.patientSex === "M"
                            ? "bg-blue-500/50 border-white text-white"
                            : "bg-rose-500/50 border-white text-white",
                        )}
                      >
                        {currentMedicalRecord.patientSex === "M"
                          ? "Masculin"
                          : "Feminin"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-white font-bold text-sm">
                      {!isDoctor && (
                        <>
                          {currentMedicalRecord.patientPhone && currentMedicalRecord.patientPhone.trim() ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTempEditPhone(currentMedicalRecord.patientPhone || "");
                                setIsPhoneEditModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 px-4 py-1.5 rounded-lg border border-white/20 shadow-md transition-all cursor-pointer group"
                              title="Apasă pentru a edita numărul de telefon"
                            >
                              <Phone className="w-4 h-4 text-white" />
                              <span className="text-white tracking-wider">
                                {formatPhoneNumber(currentMedicalRecord.patientPhone)}
                              </span>
                              <Edit2 className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors ml-1" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setTempEditPhone("");
                                setIsPhoneEditModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 px-4 py-1.5 rounded-lg border-2 border-white shadow-lg shadow-rose-900/50 animate-pulse transition-all cursor-pointer group"
                              title="Număr de telefon indisponibil. Apasă pentru a adăuga!"
                            >
                              <Phone className="w-4 h-4 text-white animate-bounce" />
                              <span className="text-white font-black text-xs tracking-wider uppercase">
                                NR. TELEFON INDISPONIBIL - ADAUGĂ
                              </span>
                              <Plus className="w-4 h-4 text-white group-hover:scale-125 transition-transform" />
                            </button>
                          )}
                        </>
                      )}
                      {currentMedicalRecord.patientAge && (
                        <span className="flex items-center gap-1.5 bg-black/40 px-4 py-1.5 rounded-lg border border-white/20 shadow-md">
                          <User className="w-4 h-4 text-white" />
                          <span className="text-white">
                            {currentMedicalRecord.patientAge} ani
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {currentMedicalRecord.glassesOrder?.orderType !== "contact_lens" && (
                  <div className="flex items-center bg-black/35 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleSetOrderViewMode("rapid")}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        orderViewMode === "rapid"
                          ? "bg-amber-500 text-white shadow-md shadow-amber-500/40 scale-100"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                      title="Mod Rapid (90% din cazuri): Nume ramă/cod, tip lentile, dioptrii preluate automat, total și avans"
                    >
                      <Zap className="w-4 h-4 fill-current text-white" />
                      <span>Mod Rapid (90%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetOrderViewMode("advanced")}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        orderViewMode === "advanced"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/40 scale-100"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                      title="Mod Avansat: Reglaje grafice fine de montaj, forme de rame, parametri de punte/înălțime și axe detaliate"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-white" />
                      <span>Mod Avansat / Montaj</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col items-end gap-1">
                  <span className="text-white font-black text-[12px] uppercase tracking-[0.2em] opacity-90 drop-shadow-md">
                    {currentMedicalRecord.glassesOrder?.orderType ===
                    "contact_lens"
                      ? "Comandă Lentile de contact"
                      : "Gestiune Comenzi de Ochelari"}
                  </span>
                  <div className="flex items-center gap-4 bg-black/40 p-2 px-6 rounded-3xl border border-white/20 shadow-xl group">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-colors">
                      Nr. Comandă
                    </span>
                    <span className="text-2xl font-black text-white tracking-widest leading-none drop-shadow-lg">
                      {currentMedicalRecord.glassesOrder?.orderNumber || "..."}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsGlassesOrderModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-black/20 rounded-2xl transition-all text-white border border-white/20 ml-4 shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[85vh] custom-scrollbar">
                {currentMedicalRecord.glassesOrder?.isDeleted && (
                  <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-rose-500 uppercase tracking-wide">
                          Această comandă este în coșul de gunoi
                        </h4>
                        <p className="text-xs text-rose-400 font-bold mt-0.5">
                          Ștearsă la {currentMedicalRecord.glassesOrder.deletedAt ? format(new Date(currentMedicalRecord.glassesOrder.deletedAt), "dd.MM.yyyy HH:mm", { locale: ro }) : "-"} de către {currentMedicalRecord.glassesOrder.deletedBy || "Anonim"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "grid gap-6",
                    (currentMedicalRecord.glassesOrder?.orderType as string) === "both" ||
                      currentMedicalRecord.glassesOrder?.orderType ===
                        "contact_lens"
                      ? "lg:grid-cols-2"
                      : "grid-cols-1",
                  )}
                >
                  {currentMedicalRecord.glassesOrder?.orderType ===
                  "contact_lens" ? (
                    <Fragment>
                      {/* Contact Lens OD */}
                      <div className="p-5 rounded-[2rem] border-2 space-y-5 transition-all bg-cyan-50/30 border-cyan-100 dark:bg-cyan-900/5 dark:border-cyan-900/20">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                          <CircleDot className="w-4 h-4" />
                          Lentile de contact OD
                        </h4>

                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-cyan-500/5 border-2 border-cyan-500/20 shadow-inner relative group">
                            <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest block mb-1">
                              Dioptrii și Detalii Lentile Contact OD
                            </span>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-cyan-600 uppercase">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_od
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_od.sph", e.target.value)
                                  }
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-cyan-500/30 rounded-xl p-2 text-xl font-black text-center outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-cyan-600 uppercase">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_od
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_od.cyl", e.target.value)
                                  }
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-cyan-500/30 rounded-xl p-2 text-xl font-black text-center outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-cyan-600 uppercase">
                                  Ax
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_od
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /\D/g,
                                      "",
                                    );
                                    updateOrder("cl_od.axis", val);
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      const clamped = Math.max(
                                        0,
                                        Math.min(180, val),
                                      );
                                      updateOrder(
                                        "cl_od.axis",
                                        clamped.toString(),
                                      );
                                    }
                                  }}
                                  placeholder="0, 10, 20..."
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-cyan-500/30 rounded-xl p-2 text-xl font-black text-center outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-cyan-500/10">
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-cyan-600 uppercase">
                                  Rază (BC)
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_od
                                      ?.base || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_od.base", e.target.value)
                                  }
                                  placeholder="Ex: 8.4, 8.6"
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-cyan-500/30 rounded-xl p-2 text-sm font-black text-center outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-cyan-600 uppercase">
                                  Diametru (DIA)
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_od
                                      ?.radius || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_od.radius", e.target.value)
                                  }
                                  placeholder="Ex: 14.0, 14.2"
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-cyan-500/30 rounded-xl p-2 text-sm font-black text-center outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              Nume Lentilă OD
                            </label>
                            <input
                              type="text"
                              value={
                                currentMedicalRecord.glassesOrder
                                  ?.lensRightName || ""
                              }
                              onChange={(e) =>
                                updateOrder("lensRightName", e.target.value)
                              }
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-sm",
                                darkMode
                                  ? "bg-slate-900 border-slate-700 text-white"
                                  : "bg-white border-slate-200",
                              )}
                              placeholder="Ex: Biofinity, Acuvue..."
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              Preț Lentilă OD
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={
                                  currentMedicalRecord.glassesOrder
                                    ?.lensRightPrice ?? ""
                                }
                                onChange={(e) =>
                                  updateOrder(
                                    "lensRightPrice",
                                    e.target.value === ""
                                      ? undefined
                                      : parseFloat(e.target.value),
                                  )
                                }
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-cyan-500 transition-all pl-9 shadow-sm",
                                  darkMode
                                    ? "bg-slate-900 border-slate-700 text-white"
                                    : "bg-white border-slate-200",
                                )}
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                RON
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Lens OS */}
                      <div className="p-5 rounded-[2rem] border-2 space-y-5 transition-all bg-indigo-50/30 border-indigo-100 dark:bg-indigo-900/5 dark:border-indigo-900/20">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <CircleDot className="w-4 h-4" />
                          Lentile de contact OS
                        </h4>

                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-indigo-500/5 border-2 border-indigo-500/20 shadow-inner relative group">
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest block mb-1">
                              Dioptrii și Detalii Lentile Contact OS
                            </span>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-indigo-600 uppercase">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_os
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_os.sph", e.target.value)
                                  }
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-xl p-2 text-xl font-black text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-indigo-600 uppercase">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_os
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_os.cyl", e.target.value)
                                  }
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-xl p-2 text-xl font-black text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-indigo-600 uppercase">
                                  Ax
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_os
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /\D/g,
                                      "",
                                    );
                                    updateOrder("cl_os.axis", val);
                                  }}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      const clamped = Math.max(
                                        0,
                                        Math.min(180, val),
                                      );
                                      updateOrder(
                                        "cl_os.axis",
                                        clamped.toString(),
                                      );
                                    }
                                  }}
                                  placeholder="0, 10, 20..."
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-xl p-2 text-xl font-black text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-indigo-500/10">
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-indigo-600 uppercase">
                                  Rază (BC)
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_os
                                      ?.base || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_os.base", e.target.value)
                                  }
                                  placeholder="Ex: 8.4, 8.6"
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-xl p-2 text-sm font-black text-center outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] font-black text-indigo-600 uppercase">
                                  Diametru (DIA)
                                </span>
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.glassesOrder?.cl_os
                                      ?.radius || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("cl_os.radius", e.target.value)
                                  }
                                  placeholder="Ex: 14.0, 14.2"
                                  className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-xl p-2 text-sm font-black text-center outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              Nume Lentilă OS
                            </label>
                            <input
                              type="text"
                              value={
                                currentMedicalRecord.glassesOrder
                                  ?.lensLeftName || ""
                              }
                              onChange={(e) =>
                                updateOrder("lensLeftName", e.target.value)
                              }
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm",
                                darkMode
                                  ? "bg-slate-900 border-slate-700 text-white"
                                  : "bg-white border-slate-200",
                              )}
                              placeholder="Ex: Biofinity, Acuvue..."
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              Preț Lentilă OS
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={
                                  currentMedicalRecord.glassesOrder
                                    ?.lensLeftPrice ?? ""
                                }
                                onChange={(e) =>
                                  updateOrder(
                                    "lensLeftPrice",
                                    e.target.value === ""
                                      ? undefined
                                      : parseFloat(e.target.value),
                                  )
                                }
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-9 shadow-sm",
                                  darkMode
                                    ? "bg-slate-900 border-slate-700 text-white"
                                    : "bg-white border-slate-200",
                                )}
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                RON
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  ) : (
                    <Fragment>
                      {/* Distance Column / Only Pair */}
                      <div
                        className={cn(
                          "p-5 rounded-[2rem] border-2 space-y-5 transition-all relative overflow-hidden",
                          currentMedicalRecord.glassesOrder?.isUrgent
                            ? darkMode
                              ? "bg-rose-900/20 border-rose-500/50"
                              : "bg-rose-50 border-rose-200"
                            : darkMode
                              ? "bg-blue-900/5 border-blue-900/20"
                              : "bg-blue-50/30 border-blue-100",
                        )}
                      >
                        {currentMedicalRecord.glassesOrder?.isUrgent && (
                          <div className="absolute top-0 right-0 px-4 py-1 bg-white/90 dark:bg-slate-900/90 text-red-600 text-[30px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg border-l border-b border-red-500/30">
                            Urgent
                          </div>
                        )}
                        <div
                          className={cn(
                            "flex items-center justify-between border-b pb-3",
                            currentMedicalRecord.glassesOrder?.isUrgent
                              ? "border-rose-100 dark:border-rose-900/30"
                              : "border-blue-100 dark:border-blue-900/30",
                          )}
                        >
                          <h4
                            className={cn(
                              "text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2",
                              currentMedicalRecord.glassesOrder?.isUrgent
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-blue-600 dark:text-blue-400",
                            )}
                          >
                            <Eye className="w-4 h-4" />
                            {currentMedicalRecord.glassesOrder?.orderType === "near"
                              ? "Ochelar Aproape"
                              : currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal"
                                ? "Ochelar Progresiv / Bifocal"
                                : "Ochelar Distanță"}
                          </h4>
                          <div
                            className={cn(
                              "text-[10px] font-black px-3 py-1 rounded-full uppercase",
                              currentMedicalRecord.glassesOrder?.isUrgent
                                ? "text-rose-400 dark:text-rose-600 bg-rose-100 dark:bg-rose-900/40"
                                : "text-blue-400 dark:text-blue-600 bg-blue-100 dark:bg-blue-900/40",
                            )}
                          >
                            Pachet 1
                          </div>
                        </div>

                        {/* Frame Section for Distance */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between w-full flex-wrap gap-1">
                              <label
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                  currentMedicalRecord.glassesOrder?.isUrgent
                                    ? "text-rose-500"
                                    : "text-slate-500",
                                )}
                              >
                                <Package className="w-3 h-3" />
                                Cod Ramă
                              </label>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFramePickerSearch("");
                                    setFramePickerCategory("Toate");
                                    setFramePickerTarget("distance");
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                                  title="Alege o ramă din stocul de inventar (Brand, Cod, Preț)"
                                >
                                  <Store className="w-3 h-3" />
                                  <span>Alege din Stoc</span>
                                </button>

                                {/* Shape Trigger Icon */}
                                {orderViewMode === "advanced" ? (
                                  <button
                                    type="button"
                                    onClick={() => setIsDistanceFrameConfigOpen(!isDistanceFrameConfigOpen)}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-xs cursor-pointer",
                                      isDistanceFrameConfigOpen
                                        ? "bg-blue-600 border-blue-500 text-white shadow-xs"
                                        : darkMode
                                          ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                                          : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-xs"
                                    )}
                                    title="Alege forma ramei și parametri montaj"
                                  >
                                    {currentMedicalRecord.glassesOrder?.frameShape ? (() => {
                                      const shapeObj = FRAME_SHAPES.find(s => s.id === currentMedicalRecord.glassesOrder?.frameShape);
                                      const rawPath = shapeObj?.path || "";
                                      const deformsListStr = currentMedicalRecord.glassesOrder?.frameDeformsList || "";
                                      const deformX = Number(currentMedicalRecord.glassesOrder?.frameDeformX) || 0;
                                      const deformY = Number(currentMedicalRecord.glassesOrder?.frameDeformY) || 0;
                                      const deformAngle = Number(currentMedicalRecord.glassesOrder?.frameDeformAngle) || 0;
                                      const frameRotation = Number(currentMedicalRecord.glassesOrder?.frameRotation) || 0;
                                      const shapePath = deformsListStr
                                        ? deformPath(rawPath, deformsListStr, frameRotation)
                                        : deformPath(rawPath, deformX, deformY, deformAngle, frameRotation);
                                      return (
                                        <>
                                          <svg viewBox="0 0 80 50" className="w-4 h-3 text-current fill-none">
                                            <path
                                              d={shapePath}
                                              stroke="currentColor"
                                              strokeWidth="5"
                                            />
                                          </svg>
                                          <span>Forma #{currentMedicalRecord.glassesOrder.frameShape}</span>
                                        </>
                                      );
                                    })() : (
                                      <>
                                        <Glasses className="w-3 h-3" />
                                        <span>Alege Formă Ramă</span>
                                      </>
                                    )}
                                  </button>
                                ) : currentMedicalRecord.glassesOrder?.frameShape ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSetOrderViewMode("advanced")}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                                    title="Formă selectată. Apasă pentru a deschide reglajele avansate de montaj"
                                  >
                                    <Glasses className="w-3 h-3" />
                                    <span>Forma #{currentMedicalRecord.glassesOrder.frameShape}</span>
                                  </button>
                                ) : null}
                            </div>
                            </div>
                            <input
                              type="text"
                              list="frame-suggestions"
                              value={
                                currentMedicalRecord.glassesOrder?.frameCode ||
                                ""
                              }
                              onChange={(e) =>
                                updateOrder("frameCode", e.target.value)
                              }
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm",
                                darkMode
                                  ? "bg-slate-900 border-slate-700 text-white"
                                  : "bg-white border-slate-200",
                              )}
                              placeholder="Cod Ramă"
                            />
                            {(() => {
                              const codeVal = currentMedicalRecord.glassesOrder?.frameCode || "";
                              if (!codeVal) return null;
                              const matched = frameStockList.find((i) => {
                                const full = i.brand ? `${i.brand} - ${i.code}` : i.code;
                                const fullMfr = i.manufacturer ? `${i.manufacturer} - ${i.code}` : i.code;
                                return (
                                  full.trim().toLowerCase() === codeVal.trim().toLowerCase() ||
                                  fullMfr.trim().toLowerCase() === codeVal.trim().toLowerCase() ||
                                  i.code.trim().toLowerCase() === codeVal.trim().toLowerCase()
                                );
                              });
                              if (!matched) return null;
                              const qty = Number(matched.quantity) || 0;
                              if (qty <= 0) {
                                return (
                                  <div className="mt-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>Atenție: Această ramă ({matched.brand ? `${matched.brand} - ` : ""}{matched.code}) are STOC 0 în inventar!</span>
                                  </div>
                                );
                              }
                              if (qty === 1) {
                                return (
                                  <div className="mt-1.5 p-2.5 rounded-xl bg-amber-500/20 border-2 border-amber-500/60 text-amber-900 dark:text-amber-200 text-[11px] font-black flex items-center justify-between gap-2 shadow-xs animate-pulse">
                                    <div className="flex items-center gap-1.5">
                                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                      <span>Atenție, această ramă este ultima pe stoc! ({matched.brand ? `${matched.brand} - ` : ""}{matched.code})</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-600 text-white shrink-0">
                                      Ultima bucată
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div className="mt-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>
                                      Stoc disponibil: <strong>{qty} buc.</strong> ({matched.brand ? `${matched.brand} - ` : ""}{matched.code})
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    Scade automat 1 buc. la salvare
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="space-y-1.5 flex flex-col justify-end">
                            <label
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                currentMedicalRecord.glassesOrder?.isUrgent
                                  ? "text-rose-500"
                                  : "text-slate-500",
                              )}
                            >
                              Preț Ramă
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={
                                  currentMedicalRecord.glassesOrder
                                    ?.framePrice ?? ""
                                }
                                onChange={(e) =>
                                  updateOrder(
                                    "framePrice",
                                    e.target.value === ""
                                      ? undefined
                                      : parseFloat(e.target.value),
                                  )
                                }
                                onFocus={(e) => e.target.select()}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9 shadow-sm",
                                  darkMode
                                    ? "bg-slate-900 border-slate-700 text-white"
                                    : "bg-white border-slate-200",
                                )}
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                RON
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rendering Distance Frame Configurator */}
                        {orderViewMode === "advanced" && (
                          <FrameConfigurator
                            isOpen={isDistanceFrameConfigOpen}
                            darkMode={darkMode}
                            prefix=""
                            order={currentMedicalRecord.glassesOrder}
                            onUpdate={updateOrder}
                          />
                        )}

                        {/* Dioptrii Large Summary */}
                        <div className="flex items-center justify-between px-1 pt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Dioptrii Montaj
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Preluate automat din fișă
                          </span>
                        </div>
                        <div
                          className={cn(
                            "grid grid-cols-[1fr_auto_1fr] items-center",
                            currentMedicalRecord.glassesOrder?.orderType ===
                              "both"
                              ? "gap-0.5"
                              : "gap-1.5 sm:gap-2",
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-[1.5rem] bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900 shadow-md space-y-1.5",
                              currentMedicalRecord.glassesOrder?.orderType ===
                                "both"
                                ? "p-1.5"
                                : "p-2.5 sm:p-3",
                            )}
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span
                                className={cn(
                                  "font-black text-blue-600 uppercase tracking-widest",
                                  currentMedicalRecord.glassesOrder
                                    ?.orderType === "both"
                                    ? "text-[8px]"
                                    : "text-[10px]",
                                )}
                              >
                                Dreapta (OD)
                              </span>
                            </div>
                             <div
                              className={cn(
                                "flex",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "gap-1"
                                  : "gap-1.5",
                              )}
                            >
                              <div className="flex-[1.2] min-w-0">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("od.sph", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "od.sph",
                                          num > 0
                                            ? `+${num.toFixed(2)}`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500 tracking-tight",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-base"
                                      : "text-xl sm:text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("od.cyl", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "od.cyl",
                                          num > 0
                                            ? `+${num.toFixed(2)}`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.8] min-w-0">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Ax
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={
                                    currentMedicalRecord.glassesOrder?.od
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num = parseInt(val);
                                      if (num > 180) val = "180";
                                      if (num < 0) val = "0";
                                    }
                                    updateOrder("od.axis", val);
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-2xl",
                                  )}
                                  placeholder="0"
                                />
                              </div>
                              
                              {currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal" && (
                                <div className="flex-[1.1] border-l border-blue-100 dark:border-blue-900/50 pl-1.5 flex flex-col">
                                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 block uppercase leading-none mb-0.5">
                                    Adiție (ADD)
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      currentMedicalRecord.glassesOrder?.od
                                        ?.add || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder("od.add", e.target.value)
                                    }
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (val) {
                                        let num = parseFloat(val);
                                        if (!isNaN(num)) {
                                          num = Math.round(num * 4) / 4;
                                          updateOrder(
                                            "od.add",
                                            num > 0
                                              ? `+${num.toFixed(2)}`
                                              : num.toFixed(2),
                                          );
                                        }
                                      }
                                    }}
                                    className={cn(
                                      "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500 mt-auto",
                                      (currentMedicalRecord.glassesOrder?.orderType as string) === "both"
                                        ? "text-lg"
                                        : "text-3xl",
                                    )}
                                    placeholder="Ex: +2.00"
                                  />
                                </div>
                              )}
                            </div>

                            {currentMedicalRecord.glassesOrder?.od?.prism && (
                              <div className="mt-2 pt-1.5 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between px-1">
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <Triangle className="w-2.5 h-2.5 fill-current shrink-0" />
                                  Prismă: {currentMedicalRecord.glassesOrder.od.prism} pdpt
                                </span>
                                {currentMedicalRecord.glassesOrder.od.base && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                    Baza {currentMedicalRecord.glassesOrder.od.base}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-1 px-0.5 shrink-0">
                            <div className="w-[1px] h-2 bg-blue-200 dark:bg-blue-900" />
                            <div
                              className={cn(
                                "rounded-xl bg-white dark:bg-slate-800 border-2 border-blue-500 shadow-lg flex flex-col items-center relative transition-all",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "w-16 p-1.5"
                                  : "w-20 p-2",
                              )}
                            >
                              <span
                                className={cn(
                                  "font-black text-blue-500 uppercase tracking-tighter leading-tight whitespace-nowrap",
                                  currentMedicalRecord.glassesOrder?.orderType ===
                                    "both"
                                    ? "text-[9px]"
                                    : "text-[10px]",
                                )}
                              >
                                Total DP
                              </span>
                              <input
                                type="text"
                                value={
                                  currentMedicalRecord.glassesOrder?.dp || ""
                                }
                                onChange={(e) =>
                                  updateOrder("dp", e.target.value)
                                }
                                className={cn(
                                  "w-full bg-transparent text-center font-black text-slate-800 dark:text-white outline-none",
                                  currentMedicalRecord.glassesOrder?.orderType ===
                                    "both"
                                    ? "text-xl"
                                    : "text-3xl",
                                )}
                                placeholder="-"
                              />
                            </div>

                            {(orderViewMode === "advanced" ||
                              currentMedicalRecord.glassesOrder?.od?.prism ||
                              currentMedicalRecord.glassesOrder?.os?.prism) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPrismTarget("glassesOrder");
                                  setPrismEye("OD");
                                  setTempPrismValue(
                                    currentMedicalRecord.glassesOrder?.od?.prism || ""
                                  );
                                  setTempPrismBase(
                                    (currentMedicalRecord.glassesOrder?.od?.base || "") as any
                                  );
                                  setIsPrismModalOpen(true);
                                }}
                                className={cn(
                                  "mt-0.5 py-1 px-0.5 rounded-lg border font-black flex flex-col items-center justify-center text-center shadow-sm transition-all cursor-pointer overflow-hidden shrink-0",
                                  currentMedicalRecord.glassesOrder?.orderType === "both"
                                    ? "w-16 text-[8px]"
                                    : "w-20 text-[9px]",
                                  (currentMedicalRecord.glassesOrder?.od?.prism ||
                                  currentMedicalRecord.glassesOrder?.os?.prism)
                                    ? "bg-blue-600 border-blue-500 text-white shadow-blue-500/20"
                                    : darkMode
                                      ? "bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700"
                                      : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                                )}
                              >
                                <div className="flex items-center justify-center gap-0.5 uppercase tracking-tight font-black leading-tight w-full">
                                  <Triangle className="w-2.5 h-2.5 fill-current shrink-0" />
                                  <span>Prismă</span>
                                </div>
                                {(currentMedicalRecord.glassesOrder?.od?.prism ||
                                currentMedicalRecord.glassesOrder?.os?.prism) && (
                                  <div className="flex flex-col items-center text-[8px] font-extrabold leading-tight tracking-tight opacity-95 w-full mt-0.5">
                                    {currentMedicalRecord.glassesOrder?.od?.prism && (
                                      <div className="whitespace-nowrap">
                                        OD:{currentMedicalRecord.glassesOrder.od.prism}
                                        {currentMedicalRecord.glassesOrder.od.base
                                          ? ` ${currentMedicalRecord.glassesOrder.od.base.charAt(0)}`
                                          : ""}
                                      </div>
                                    )}
                                    {currentMedicalRecord.glassesOrder?.os?.prism && (
                                      <div className="whitespace-nowrap">
                                        OS:{currentMedicalRecord.glassesOrder.os.prism}
                                        {currentMedicalRecord.glassesOrder.os.base
                                          ? ` ${currentMedicalRecord.glassesOrder.os.base.charAt(0)}`
                                          : ""}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </button>
                            )}

                            <div className="w-[1px] h-2 bg-blue-200 dark:bg-blue-900" />
                          </div>

                          <div
                            className={cn(
                              "rounded-[1.5rem] bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900 shadow-md space-y-1.5",
                              currentMedicalRecord.glassesOrder?.orderType ===
                                "both"
                                ? "p-1.5"
                                : "p-2.5 sm:p-3",
                            )}
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span
                                className={cn(
                                  "font-black text-blue-600 uppercase tracking-widest",
                                  currentMedicalRecord.glassesOrder
                                    ?.orderType === "both"
                                    ? "text-[8px]"
                                    : "text-[10px]",
                                )}
                              >
                                Stânga (OS)
                              </span>
                            </div>
                             <div
                              className={cn(
                                "flex",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "gap-1"
                                  : "gap-1.5",
                              )}
                            >
                              <div className="flex-[1.2] min-w-0">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Sph
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.sph || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("os.sph", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "os.sph",
                                          num > 0
                                            ? `+${num.toFixed(2)}`
                                            : num.toFixed(2),
                                        );
                                      }
                                    } 
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500 tracking-tight",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-base"
                                      : "text-xl sm:text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Cyl
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.cyl || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("os.cyl", e.target.value)
                                  }
                                  onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (val) {
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        updateOrder(
                                          "os.cyl",
                                          num > 0
                                            ? `+${num.toFixed(2)}`
                                            : num.toFixed(2),
                                        );
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-2xl",
                                  )}
                                />
                              </div>
                              <div className="flex-[0.8] min-w-0">
                                <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                  Ax
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={
                                    currentMedicalRecord.glassesOrder?.os
                                      ?.axis || ""
                                  }
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num = parseInt(val);
                                      if (num > 180) val = "180";
                                      if (num < 0) val = "0";
                                    }
                                    updateOrder("os.axis", val);
                                  }}
                                  className={cn(
                                    "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-blue-500",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "text-lg"
                                      : "text-2xl",
                                  )}
                                  placeholder="0"
                                />
                              </div>
                              
                              {currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal" && (
                                <div className="flex-[1.1] border-l border-blue-100 dark:border-blue-900/50 pl-1.5 flex flex-col">
                                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 block uppercase leading-none mb-0.5">
                                    Adiție (ADD)
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      currentMedicalRecord.glassesOrder?.os
                                        ?.add || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder("os.add", e.target.value)
                                    }
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (val) {
                                        let num = parseFloat(val);
                                        if (!isNaN(num)) {
                                          num = Math.round(num * 4) / 4;
                                          updateOrder(
                                            "os.add",
                                            num > 0
                                              ? `+${num.toFixed(2)}`
                                              : num.toFixed(2),
                                          );
                                        }
                                      }
                                    }}
                                    className={cn(
                                      "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-blue-500 mt-auto",
                                      (currentMedicalRecord.glassesOrder?.orderType as string) === "both"
                                        ? "text-lg"
                                        : "text-3xl",
                                    )}
                                    placeholder="Ex: +2.00"
                                  />
                                </div>
                              )}
                            </div>

                            {currentMedicalRecord.glassesOrder?.os?.prism && (
                              <div className="mt-2 pt-1.5 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between px-1">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Triangle className="w-2.5 h-2.5 fill-current shrink-0" />
                                  Prismă: {currentMedicalRecord.glassesOrder.os.prism} pdpt
                                </span>
                                {currentMedicalRecord.glassesOrder.os.base && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                    Baza {currentMedicalRecord.glassesOrder.os.base}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dioptrii Large Summary */}
                        <div className="space-y-4">
                          {/* Right Lens */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                Nume Lentilă Dreapta
                              </label>
                              <input
                                type="text"
                                list="lens-suggestions"
                                value={
                                  currentMedicalRecord.glassesOrder
                                    ?.lensRightName || ""
                                }
                                onChange={(e) =>
                                  updateOrder("lensRightName", e.target.value)
                                }
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm",
                                  darkMode
                                    ? "bg-slate-900 border-slate-700 text-white"
                                    : "bg-white border-slate-200",
                                )}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                Preț Dreapta
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={
                                    currentMedicalRecord.glassesOrder
                                      ?.lensRightPrice ?? ""
                                  }
                                  onChange={(e) =>
                                    updateOrder(
                                      "lensRightPrice",
                                      e.target.value === ""
                                        ? undefined
                                        : parseFloat(e.target.value),
                                    )
                                  }
                                  onFocus={(e) => e.target.select()}
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9 shadow-sm",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-blue-400"
                                      : "bg-white border-slate-200 text-blue-600",
                                  )}
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                  RON
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Left Lens */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                  Nume Lentilă Stânga
                                </label>
                                {currentMedicalRecord.glassesOrder?.lensRightName && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rName = currentMedicalRecord.glassesOrder?.lensRightName || "";
                                      const rPrice = currentMedicalRecord.glassesOrder?.lensRightPrice;
                                      if (rName) updateOrder("lensLeftName", rName);
                                      if (rPrice !== undefined) updateOrder("lensLeftPrice", rPrice);
                                    }}
                                    className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer hover:underline"
                                    title="Copiază automat numele și prețul din dreapta (OD ➔ OS)"
                                  >
                                    <span>Copiază OD ➔ OS</span>
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                list="lens-suggestions"
                                value={
                                  currentMedicalRecord.glassesOrder
                                    ?.lensLeftName || ""
                                }
                                onChange={(e) =>
                                  updateOrder("lensLeftName", e.target.value)
                                }
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm",
                                  darkMode
                                    ? "bg-slate-900 border-slate-700 text-white"
                                    : "bg-white border-slate-200",
                                )}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                Preț Stânga
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={
                                    currentMedicalRecord.glassesOrder
                                      ?.lensLeftPrice ?? ""
                                  }
                                  onChange={(e) =>
                                    updateOrder(
                                      "lensLeftPrice",
                                      e.target.value === ""
                                        ? undefined
                                        : parseFloat(e.target.value),
                                    )
                                  }
                                  onFocus={(e) => e.target.select()}
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9 shadow-sm",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-blue-400"
                                      : "bg-white border-slate-200 text-blue-600",
                                  )}
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                  RON
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 items-end pt-2">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                Manoperă
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={
                                    currentMedicalRecord.glassesOrder
                                      ?.laborPrice ?? ""
                                  }
                                  onChange={(e) =>
                                    updateOrder(
                                      "laborPrice",
                                      e.target.value === ""
                                        ? undefined
                                        : parseFloat(e.target.value),
                                    )
                                  }
                                  onFocus={(e) => e.target.select()}
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9 shadow-sm",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-white border-slate-200 shadow-sm",
                                  )}
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                  RON
                                </span>
                              </div>
                            </div>
                            <div
                              className={cn(
                                "p-4 rounded-2xl flex flex-col items-end transition-all",
                                darkMode
                                  ? "bg-blue-500/10"
                                  : "bg-blue-100/50 shadow-inner",
                              )}
                            >
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                Subtotal Distanță
                              </span>
                              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                                {(
                                  (currentMedicalRecord.glassesOrder
                                    ?.framePrice || 0) +
                                  (currentMedicalRecord.glassesOrder
                                    ?.lensRightPrice || 0) +
                                  (currentMedicalRecord.glassesOrder
                                    ?.lensLeftPrice || 0) +
                                  (currentMedicalRecord.glassesOrder
                                    ?.laborPrice || 0)
                                ).toFixed(0)}{" "}
                                <span className="text-xs">RON</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 items-end pt-2">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                Diverse (Explicație)
                              </label>
                              <input
                                type="text"
                                value={
                                  currentMedicalRecord.glassesOrder
                                    ?.diverseName ?? ""
                                }
                                onChange={(e) =>
                                  updateOrder("diverseName", e.target.value)
                                }
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm",
                                  darkMode
                                    ? "bg-slate-900 border-slate-700 text-white"
                                    : "bg-white border-slate-200 shadow-sm",
                                )}
                                placeholder="Toc, Lavetă, Accesorii..."
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                Valoare Diverse
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={
                                    currentMedicalRecord.glassesOrder
                                      ?.diversePrice ?? ""
                                  }
                                  onChange={(e) =>
                                    updateOrder(
                                      "diversePrice",
                                      e.target.value === ""
                                        ? undefined
                                        : parseFloat(e.target.value),
                                    )
                                  }
                                  onFocus={(e) => e.target.select()}
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9 shadow-sm",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-white border-slate-200 shadow-sm",
                                  )}
                                  placeholder="0"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                  RON
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delivery & Urgent for Distance Pair */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1.5 p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-blue-100 dark:border-blue-900/20">
                            <label
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                darkMode ? "text-white" : "text-slate-500",
                              )}
                            >
                              <Calendar className="w-3 h-3 text-blue-500" />
                              Data Comandă
                            </label>
                            <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                              {currentMedicalRecord.glassesOrder?.createdAt
                                ? format(
                                    new Date(
                                      currentMedicalRecord.glassesOrder
                                        .createdAt,
                                    ),
                                    "dd MMM yyyy",
                                    { locale: ro },
                                  )
                                : format(new Date(), "dd MMM yyyy", {
                                    locale: ro,
                                  })}
                            </p>
                          </div>
                          <div className="space-y-1.5 p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-blue-100 dark:border-blue-900/20">
                            <label
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                darkMode ? "text-white" : "text-slate-500",
                              )}
                            >
                              <CalendarClock className="w-3 h-3 text-blue-500" />
                              Termen Livrare
                            </label>
                            <input
                              type="date"
                              value={
                                currentMedicalRecord.glassesOrder
                                  ?.deliveryDate || ""
                              }
                              onChange={(e) =>
                                updateOrder("deliveryDate", e.target.value)
                              }
                              className={cn(
                                "w-full bg-transparent border-none p-0 text-sm font-black outline-none",
                                darkMode
                                  ? "text-white [color-scheme:dark]"
                                  : "text-slate-800",
                              )}
                            />
                          </div>
                          <label
                            className={cn(
                              "col-span-2 flex items-center justify-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer",
                              currentMedicalRecord.glassesOrder?.isUrgent
                                ? "bg-rose-50 dark:bg-rose-900/20 border-rose-600 text-rose-600 shadow-lg shadow-rose-500/20"
                                : "bg-white/40 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-white",
                            )}
                          >
                            <span className="text-[30px] font-black uppercase tracking-widest text-red-600">
                              Urgent
                            </span>
                            <input
                              type="checkbox"
                              checked={
                                currentMedicalRecord.glassesOrder?.isUrgent ||
                                false
                              }
                              onChange={(e) =>
                                updateOrder("isUrgent", e.target.checked)
                              }
                              className="w-8 h-8 rounded-lg border-2 border-red-500 bg-white/10 checked:bg-red-600 accent-red-600 transition-all scale-110"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Near Column (Only if both) */}
                      {currentMedicalRecord.glassesOrder?.orderType ===
                        "both" && (
                        <Fragment>
                          <div
                            className={cn(
                              "p-5 rounded-[2rem] border-2 space-y-5 transition-all relative overflow-hidden",
                              currentMedicalRecord.glassesOrder?.nearIsUrgent
                                ? darkMode
                                  ? "bg-rose-900/20 border-rose-500/50"
                                  : "bg-rose-50 border-rose-200"
                                : darkMode
                                  ? "bg-emerald-900/5 border-emerald-900/20"
                                  : "bg-emerald-50/30 border-emerald-100",
                            )}
                          >
                            {currentMedicalRecord.glassesOrder
                              ?.nearIsUrgent && (
                              <div className="absolute top-0 right-0 px-4 py-1 bg-white/90 dark:bg-slate-900/90 text-red-600 text-[30px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg border-l border-b border-red-500/30">
                                Urgent
                              </div>
                            )}
                            <div
                              className={cn(
                                "flex items-center justify-between border-b pb-3",
                                currentMedicalRecord.glassesOrder?.nearIsUrgent
                                  ? "border-rose-100 dark:border-rose-900/30"
                                  : "border-emerald-100 dark:border-emerald-900/30",
                              )}
                            >
                              <h4
                                className={cn(
                                  "text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2",
                                  currentMedicalRecord.glassesOrder
                                    ?.nearIsUrgent
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-emerald-600 dark:text-emerald-400",
                                )}
                              >
                                <Glasses className="w-4 h-4" />
                                Ochelar Aproape
                              </h4>
                              <div
                                className={cn(
                                  "text-[10px] font-black px-3 py-1 rounded-full uppercase",
                                  currentMedicalRecord.glassesOrder
                                    ?.nearIsUrgent
                                    ? "text-rose-400 dark:text-rose-600 bg-rose-100 dark:bg-rose-900/40"
                                    : "text-emerald-400 dark:text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40",
                                )}
                              >
                                Pachet 2
                              </div>
                            </div>

                            {/* Frame Section for Near */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between w-full flex-wrap gap-1">
                                  <label
                                    className={cn(
                                      "text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                      currentMedicalRecord.glassesOrder
                                        ?.nearIsUrgent
                                        ? "text-rose-500"
                                        : "text-slate-500",
                                    )}
                                  >
                                    <Package className="w-3 h-3" />
                                    Cod Ramă
                                  </label>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFramePickerSearch("");
                                        setFramePickerCategory("Toate");
                                        setFramePickerTarget("near");
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                                      title="Alege o ramă din stocul de inventar (Brand, Cod, Preț)"
                                    >
                                      <Store className="w-3 h-3" />
                                      <span>Alege din Stoc</span>
                                    </button>

                                    {/* Shape Trigger Icon */}
                                    {(orderViewMode === "advanced" || currentMedicalRecord.glassesOrder?.nearFrameShape) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (orderViewMode === "advanced") {
                                          setIsNearFrameConfigOpen(!isNearFrameConfigOpen);
                                        } else {
                                          handleSetOrderViewMode("advanced");
                                        }
                                      }}
                                      className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-xs cursor-pointer",
                                        isNearFrameConfigOpen
                                          ? "bg-emerald-600 border-emerald-500 text-white shadow-xs"
                                          : darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs"
                                      )}
                                      title="Alege forma ramei și parametri montaj"
                                    >
                                    {currentMedicalRecord.glassesOrder?.nearFrameShape ? (() => {
                                      const shapeObj = FRAME_SHAPES.find(s => s.id === currentMedicalRecord.glassesOrder?.nearFrameShape);
                                      const rawPath = shapeObj?.path || "";
                                      const deformX = Number(currentMedicalRecord.glassesOrder?.nearFrameDeformX) || 0;
                                      const deformY = Number(currentMedicalRecord.glassesOrder?.nearFrameDeformY) || 0;
                                      const deformAngle = Number(currentMedicalRecord.glassesOrder?.nearFrameDeformAngle) || 0;
                                      const deformsListStr = currentMedicalRecord.glassesOrder?.nearFrameDeformsList || "";
                                      const nearFrameRotation = Number(currentMedicalRecord.glassesOrder?.nearFrameRotation) || 0;
                                      const shapePath = deformsListStr
                                        ? deformPath(rawPath, deformsListStr, nearFrameRotation)
                                        : deformPath(rawPath, deformX, deformY, deformAngle, nearFrameRotation);
                                      return (
                                        <>
                                          <svg viewBox="0 0 80 50" className="w-4 h-3 text-current fill-none">
                                            <path
                                              d={shapePath}
                                              stroke="currentColor"
                                              strokeWidth="5"
                                            />
                                          </svg>
                                          <span>Forma #{currentMedicalRecord.glassesOrder.nearFrameShape}</span>
                                        </>
                                      );
                                    })() : (
                                      <>
                                        <Glasses className="w-3 h-3" />
                                        <span>Alege Formă Ramă</span>
                                      </>
                                    )}
                                  </button>
                                  )}
                                </div>
                               </div>
                                <input
                                  type="text"
                                  list="frame-suggestions"
                                  value={
                                    currentMedicalRecord.glassesOrder
                                      ?.nearFrameCode || ""
                                  }
                                  onChange={(e) =>
                                    updateOrder("nearFrameCode", e.target.value)
                                  }
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-white border-slate-200",
                                  )}
                                  placeholder="Cod Ramă"
                                />
                                {(() => {
                                  const codeVal = currentMedicalRecord.glassesOrder?.nearFrameCode || "";
                                  if (!codeVal) return null;
                                  const matched = frameStockList.find((i) => {
                                    const full = i.brand ? `${i.brand} - ${i.code}` : i.code;
                                    const fullMfr = i.manufacturer ? `${i.manufacturer} - ${i.code}` : i.code;
                                    return (
                                      full.trim().toLowerCase() === codeVal.trim().toLowerCase() ||
                                      fullMfr.trim().toLowerCase() === codeVal.trim().toLowerCase() ||
                                      i.code.trim().toLowerCase() === codeVal.trim().toLowerCase()
                                    );
                                  });
                                  if (!matched) return null;
                                  const qty = Number(matched.quantity) || 0;
                                  if (qty <= 0) {
                                    return (
                                      <div className="mt-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        <span>Atenție: Această ramă ({matched.brand ? `${matched.brand} - ` : ""}{matched.code}) are STOC 0 în inventar!</span>
                                      </div>
                                    );
                                  }
                                  if (qty === 1) {
                                    return (
                                      <div className="mt-1.5 p-2.5 rounded-xl bg-amber-500/20 border-2 border-amber-500/60 text-amber-900 dark:text-amber-200 text-[11px] font-black flex items-center justify-between gap-2 shadow-xs animate-pulse">
                                        <div className="flex items-center gap-1.5">
                                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                          <span>Atenție, această ramă este ultima pe stoc! ({matched.brand ? `${matched.brand} - ` : ""}{matched.code})</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-600 text-white shrink-0">
                                          Ultima bucată
                                        </span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="mt-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span>
                                          Stoc disponibil: <strong>{qty} buc.</strong> ({matched.brand ? `${matched.brand} - ` : ""}{matched.code})
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        Scade automat 1 buc. la salvare
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="space-y-1.5 flex flex-col justify-end">
                                <label
                                  className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    currentMedicalRecord.glassesOrder
                                      ?.nearIsUrgent
                                      ? "text-rose-500"
                                      : "text-slate-500",
                                  )}
                                >
                                  Preț Ramă
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={
                                      currentMedicalRecord.glassesOrder
                                        ?.nearFramePrice ?? ""
                                    }
                                    onChange={(e) =>
                                      updateOrder(
                                        "nearFramePrice",
                                        e.target.value === ""
                                          ? undefined
                                          : parseFloat(e.target.value),
                                      )
                                    }
                                    onFocus={(e) => e.target.select()}
                                    className={cn(
                                      "w-full p-2.5 border rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all pl-9 shadow-sm",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-white"
                                        : "bg-white border-slate-200 shadow-sm",
                                    )}
                                  />
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                    RON
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Rendering Near Frame Configurator */}
                            {orderViewMode === "advanced" && (
                              <FrameConfigurator
                                isOpen={isNearFrameConfigOpen}
                                darkMode={darkMode}
                                prefix="near"
                                order={currentMedicalRecord.glassesOrder}
                                onUpdate={updateOrder}
                              />
                            )}

                            {/* Dioptrii Large Summary - Near */}
                            <div className="flex items-center justify-between px-1 pt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                Dioptrii Montaj (Aproape)
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Preluate automat din fișă
                              </span>
                            </div>
                            <div
                              className={cn(
                                "grid grid-cols-[1fr_auto_1fr] items-center",
                                currentMedicalRecord.glassesOrder?.orderType ===
                                  "both"
                                  ? "gap-0.5"
                                  : "gap-1.5 sm:gap-2",
                              )}
                            >
                              <div
                                className={cn(
                                  "rounded-[1.5rem] bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-900 shadow-md space-y-1.5",
                                  currentMedicalRecord.glassesOrder
                                    ?.orderType === "both"
                                    ? "p-1.5"
                                    : "p-4",
                                )}
                              >
                                <div className="flex justify-between items-center mb-0.5">
                                  <span
                                    className={cn(
                                      "font-black text-emerald-600 uppercase tracking-widest",
                                      currentMedicalRecord.glassesOrder
                                        ?.orderType === "both"
                                        ? "text-[8px]"
                                        : "text-[10px]",
                                    )}
                                  >
                                    Dreapta (OD)
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    "flex",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "gap-1"
                                      : "gap-3",
                                  )}
                                >
                                  <div className="flex-1">
                                    <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                      Sph
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        (
                                          currentMedicalRecord.glassesOrder
                                            ?.nearOd as any
                                        )?.sph || ""
                                      }
                                      onChange={(e) =>
                                        updateOrder(
                                          "nearOd.sph",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        let val = e.target.value.trim();
                                        if (val) {
                                          let num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            num = Math.round(num * 4) / 4;
                                            updateOrder(
                                              "nearOd.sph",
                                              num > 0
                                                ? `+${num.toFixed(2)}`
                                                : num.toFixed(2),
                                            );
                                          }
                                        }
                                      }}
                                      className={cn(
                                        "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-emerald-500",
                                        currentMedicalRecord.glassesOrder
                                          ?.orderType === "both"
                                          ? "text-lg"
                                          : "text-3xl",
                                      )}
                                    />
                                  </div>
                                  <div className="flex-[0.8]">
                                    <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                      Cyl
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        (
                                          currentMedicalRecord.glassesOrder
                                            ?.nearOd as any
                                        )?.cyl || ""
                                      }
                                      onChange={(e) =>
                                        updateOrder(
                                          "nearOd.cyl",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        let val = e.target.value.trim();
                                        if (val) {
                                          let num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            num = Math.round(num * 4) / 4;
                                            updateOrder(
                                              "nearOd.cyl",
                                              num > 0
                                                ? `+${num.toFixed(2)}`
                                                : num.toFixed(2),
                                            );
                                          }
                                        }
                                      }}
                                      className={cn(
                                        "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-emerald-500",
                                        currentMedicalRecord.glassesOrder
                                          ?.orderType === "both"
                                          ? "text-sm"
                                          : "text-2xl",
                                      )}
                                    />
                                  </div>
                                  <div className="flex-[0.6]">
                                    <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                      Ax
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="180"
                                      value={
                                        (
                                          currentMedicalRecord.glassesOrder
                                            ?.nearOd as any
                                        )?.axis || ""
                                      }
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (val !== "") {
                                          let num = parseInt(val);
                                          if (num > 180) val = "180";
                                          if (num < 0) val = "0";
                                        }
                                        updateOrder("nearOd.axis", val);
                                      }}
                                      className={cn(
                                        "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-emerald-500",
                                        currentMedicalRecord.glassesOrder
                                          ?.orderType === "both"
                                          ? "text-sm"
                                          : "text-2xl",
                                      )}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-center gap-0.5 px-0.5">
                                <div className="w-[1px] h-2 bg-emerald-200 dark:bg-emerald-900" />
                                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-lg flex flex-col items-center w-20">
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter leading-tight">
                                    DP
                                  </span>
                                  <input
                                    type="text"
                                    value={
                                      currentMedicalRecord.glassesOrder
                                        ?.nearDp || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder("nearDp", e.target.value)
                                    }
                                    className="w-full bg-transparent text-center text-3xl font-black text-slate-800 dark:text-white outline-none"
                                    placeholder="-"
                                  />
                                </div>
                                <div className="w-[1px] h-2 bg-emerald-200 dark:bg-emerald-900" />
                              </div>

                              <div
                                className={cn(
                                  "rounded-[1.5rem] bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-900 shadow-md space-y-1.5",
                                  currentMedicalRecord.glassesOrder
                                    ?.orderType === "both"
                                    ? "p-1.5"
                                    : "p-4",
                                )}
                              >
                                <div className="flex justify-between items-center mb-0.5">
                                  <span
                                    className={cn(
                                      "font-black text-emerald-600 uppercase tracking-widest",
                                      currentMedicalRecord.glassesOrder
                                        ?.orderType === "both"
                                        ? "text-[8px]"
                                        : "text-[10px]",
                                    )}
                                  >
                                    Stânga (OS)
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    "flex",
                                    currentMedicalRecord.glassesOrder
                                      ?.orderType === "both"
                                      ? "gap-1"
                                      : "gap-3",
                                  )}
                                >
                                  <div className="flex-1">
                                    <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                      Sph
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        (
                                          currentMedicalRecord.glassesOrder
                                            ?.nearOs as any
                                        )?.sph || ""
                                      }
                                      onChange={(e) =>
                                        updateOrder(
                                          "nearOs.sph",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        let val = e.target.value.trim();
                                        if (val) {
                                          let num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            num = Math.round(num * 4) / 4;
                                            updateOrder(
                                              "nearOs.sph",
                                              num > 0
                                                ? `+${num.toFixed(2)}`
                                                : num.toFixed(2),
                                            );
                                          }
                                        }
                                      }}
                                      className={cn(
                                        "w-full bg-transparent font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-emerald-500",
                                        currentMedicalRecord.glassesOrder
                                          ?.orderType === "both"
                                          ? "text-lg"
                                          : "text-3xl",
                                      )}
                                    />
                                  </div>
                                  <div className="flex-[0.8]">
                                    <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                      Cyl
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        (
                                          currentMedicalRecord.glassesOrder
                                            ?.nearOs as any
                                        )?.cyl || ""
                                      }
                                      onChange={(e) =>
                                        updateOrder(
                                          "nearOs.cyl",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        let val = e.target.value.trim();
                                        if (val) {
                                          let num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            num = Math.round(num * 4) / 4;
                                            updateOrder(
                                              "nearOs.cyl",
                                              num > 0
                                                ? `+${num.toFixed(2)}`
                                                : num.toFixed(2),
                                            );
                                          }
                                        }
                                      }}
                                      className={cn(
                                        "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-emerald-500",
                                        currentMedicalRecord.glassesOrder
                                          ?.orderType === "both"
                                          ? "text-sm"
                                          : "text-2xl",
                                      )}
                                    />
                                  </div>
                                  <div className="flex-[0.6]">
                                    <span className="text-[9px] font-black text-slate-400 block uppercase leading-none mb-0.5">
                                      Ax
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="180"
                                      value={
                                        (
                                          currentMedicalRecord.glassesOrder
                                            ?.nearOs as any
                                        )?.axis || ""
                                      }
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (val !== "") {
                                          let num = parseInt(val);
                                          if (num > 180) val = "180";
                                          if (num < 0) val = "0";
                                        }
                                        updateOrder("nearOs.axis", val);
                                      }}
                                      className={cn(
                                        "w-full bg-transparent font-black text-slate-600 dark:text-slate-300 outline-none border-b border-transparent focus:border-emerald-500",
                                        currentMedicalRecord.glassesOrder
                                          ?.orderType === "both"
                                          ? "text-sm"
                                          : "text-2xl",
                                      )}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {/* Near Right Lens */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    Nume Dreapta Aproape
                                  </label>
                                  <input
                                    type="text"
                                    list="lens-suggestions"
                                    value={
                                      currentMedicalRecord.glassesOrder
                                        ?.nearLensRightName || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder(
                                        "nearLensRightName",
                                        e.target.value,
                                      )
                                    }
                                    className={cn(
                                      "w-full p-2.5 border rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-white"
                                        : "bg-white border-slate-200",
                                    )}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    Preț Dreapta
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={
                                        currentMedicalRecord.glassesOrder
                                          ?.nearLensRightPrice ?? ""
                                      }
                                      onChange={(e) =>
                                        updateOrder(
                                          "nearLensRightPrice",
                                          e.target.value === ""
                                            ? undefined
                                            : parseFloat(e.target.value),
                                        )
                                      }
                                      onFocus={(e) => e.target.select()}
                                      className={cn(
                                        "w-full p-2.5 border rounded-xl text-base font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all pl-9 shadow-sm",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-emerald-400"
                                          : "bg-white border-slate-200 text-emerald-600",
                                      )}
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                      RON
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Near Left Lens */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                      Nume Stânga Aproape
                                    </label>
                                    {currentMedicalRecord.glassesOrder?.nearLensRightName && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const rName = currentMedicalRecord.glassesOrder?.nearLensRightName || "";
                                          const rPrice = currentMedicalRecord.glassesOrder?.nearLensRightPrice;
                                          if (rName) updateOrder("nearLensLeftName", rName);
                                          if (rPrice !== undefined) updateOrder("nearLensLeftPrice", rPrice);
                                        }}
                                        className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer hover:underline"
                                        title="Copiază automat numele și prețul din dreapta (OD ➔ OS)"
                                      >
                                        <span>Copiază OD ➔ OS</span>
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    list="lens-suggestions"
                                    value={
                                      currentMedicalRecord.glassesOrder
                                        ?.nearLensLeftName || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder(
                                        "nearLensLeftName",
                                        e.target.value,
                                      )
                                    }
                                    className={cn(
                                      "w-full p-2.5 border rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-white"
                                        : "bg-white border-slate-200",
                                    )}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    Preț Stânga
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={
                                        currentMedicalRecord.glassesOrder
                                          ?.nearLensLeftPrice ?? ""
                                      }
                                      onChange={(e) =>
                                        updateOrder(
                                          "nearLensLeftPrice",
                                          e.target.value === ""
                                            ? undefined
                                            : parseFloat(e.target.value),
                                        )
                                      }
                                      onFocus={(e) => e.target.select()}
                                      className={cn(
                                        "w-full p-2.5 border rounded-xl text-base font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all pl-9 shadow-sm",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-emerald-400"
                                          : "bg-white border-slate-200 text-emerald-600",
                                      )}
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                      RON
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 items-end pt-2">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                    Manoperă
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={
                                        currentMedicalRecord.glassesOrder
                                          ?.nearLaborPrice ?? ""
                                      }
                                      onChange={(e) =>
                                        updateOrder(
                                          "nearLaborPrice",
                                          e.target.value === ""
                                            ? undefined
                                            : parseFloat(e.target.value),
                                        )
                                      }
                                      onFocus={(e) => e.target.select()}
                                      className={cn(
                                        "w-full p-2.5 border rounded-xl text-base font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all pl-9 shadow-sm",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-white"
                                          : "bg-white border-slate-200 shadow-sm",
                                      )}
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">
                                      RON
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    "p-4 rounded-2xl flex flex-col items-end transition-all",
                                    darkMode
                                      ? "bg-emerald-500/10"
                                      : "bg-emerald-100/50 shadow-inner",
                                  )}
                                >
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    Subtotal Aproape
                                  </span>
                                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                    {(
                                      (currentMedicalRecord.glassesOrder
                                        ?.nearFramePrice || 0) +
                                      (currentMedicalRecord.glassesOrder
                                        ?.nearLensRightPrice || 0) +
                                      (currentMedicalRecord.glassesOrder
                                        ?.nearLensLeftPrice || 0) +
                                      (currentMedicalRecord.glassesOrder
                                        ?.nearLaborPrice || 0)
                                    ).toFixed(0)}{" "}
                                    <span className="text-xs">RON</span>
                                  </span>
                                </div>
                              </div>

                              {/* Delivery & Urgent for Near Pair */}
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1.5 p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-emerald-100 dark:border-emerald-900/20">
                                  <label
                                    className={cn(
                                      "text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                      darkMode
                                        ? "text-white"
                                        : "text-slate-500",
                                    )}
                                  >
                                    <Calendar className="w-3 h-3 text-emerald-500" />
                                    Data Comandă
                                  </label>
                                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                    {currentMedicalRecord.glassesOrder
                                      ?.createdAt
                                      ? format(
                                          new Date(
                                            currentMedicalRecord.glassesOrder
                                              .createdAt,
                                          ),
                                          "dd MMM yyyy",
                                          { locale: ro },
                                        )
                                      : format(new Date(), "dd MMM yyyy", {
                                          locale: ro,
                                        })}
                                  </p>
                                </div>
                                <div className="space-y-1.5 p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-emerald-100 dark:border-emerald-900/20">
                                  <label
                                    className={cn(
                                      "text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                      darkMode
                                        ? "text-white"
                                        : "text-slate-500",
                                    )}
                                  >
                                    <CalendarClock className="w-3 h-3 text-emerald-500" />
                                    Termen Livrare
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      currentMedicalRecord.glassesOrder
                                        ?.nearDeliveryDate || ""
                                    }
                                    onChange={(e) =>
                                      updateOrder(
                                        "nearDeliveryDate",
                                        e.target.value,
                                      )
                                    }
                                    className={cn(
                                      "w-full bg-transparent border-none p-0 text-sm font-black outline-none",
                                      darkMode
                                        ? "text-white [color-scheme:dark]"
                                        : "text-slate-800",
                                    )}
                                  />
                                </div>
                                <label
                                  className={cn(
                                    "col-span-2 flex items-center justify-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer",
                                    currentMedicalRecord.glassesOrder
                                      ?.nearIsUrgent
                                      ? "bg-rose-50 dark:bg-rose-900/20 border-rose-600 text-rose-600 shadow-lg shadow-rose-500/20"
                                      : "bg-white/40 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-white",
                                  )}
                                >
                                  <span className="text-[30px] font-black uppercase tracking-widest text-red-600">
                                    Urgent
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={
                                      currentMedicalRecord.glassesOrder
                                        ?.nearIsUrgent || false
                                    }
                                    onChange={(e) =>
                                      updateOrder(
                                        "nearIsUrgent",
                                        e.target.checked,
                                      )
                                    }
                                    className="w-8 h-8 rounded-lg border-2 border-red-500 bg-white/10 checked:bg-red-600 accent-red-600 transition-all scale-110"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </Fragment>
                      )}
                    </Fragment>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Mode Banner & Fast Toggle */}
                  {currentMedicalRecord.glassesOrder?.orderType !== "contact_lens" && (
                    <div
                      className={cn(
                        "p-4 rounded-3xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md",
                        orderViewMode === "rapid"
                          ? darkMode
                            ? "bg-amber-950/20 border-amber-800/40"
                            : "bg-amber-50/80 border-amber-200"
                          : darkMode
                            ? "bg-blue-950/20 border-blue-800/40"
                            : "bg-blue-50/80 border-blue-200",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                            orderViewMode === "rapid"
                              ? "bg-amber-500 text-white"
                              : "bg-blue-600 text-white",
                          )}
                        >
                          {orderViewMode === "rapid" ? (
                            <Zap className="w-5 h-5 fill-current" />
                          ) : (
                            <SlidersHorizontal className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                            <span>
                              {orderViewMode === "rapid"
                                ? "Mod Rapid Activ (90% din cazuri)"
                                : "Mod Avansat Activ (Montaj & Axe Fin Reglate)"}
                            </span>
                            <span
                              className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                                orderViewMode === "rapid"
                                  ? "bg-amber-500 text-white"
                                  : "bg-blue-600 text-white",
                              )}
                            >
                              {orderViewMode === "rapid"
                                ? "Simplificat"
                                : "Complet"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {orderViewMode === "rapid"
                              ? "Configuratorul grafic cu forme SVG și reglajele fine de montaj sunt ascunse pentru viteză."
                              : "Formele grafice de rame, deformațiile milimetrice, parametrii de punte/înălțime și axele prismă sunt expandate."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleSetOrderViewMode(
                            orderViewMode === "rapid" ? "advanced" : "rapid",
                          )
                        }
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 active:scale-95",
                          orderViewMode === "rapid"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
                            : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30",
                        )}
                      >
                        {orderViewMode === "rapid" ? (
                          <>
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Deschide Mod Avansat</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-current" />
                            <span>Comută pe Mod Rapid</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Observation Field - Full Width Header */}
                  <div
                    className={cn(
                      "p-6 rounded-[2.5rem] space-y-3",
                      darkMode
                        ? "bg-slate-800/20 border border-slate-700"
                        : "bg-slate-50 border border-slate-100 shadow-xl",
                    )}
                  >
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      Observații Lab / Indicații Speciale
                    </label>
                    <textarea
                      value={
                        (currentMedicalRecord.glassesOrder as any)?.notes || ""
                      }
                      onChange={(e) => updateOrder("notes", e.target.value)}
                      rows={2}
                      className={cn(
                        "w-full p-4 border-2 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/20 transition-all resize-none",
                        darkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-slate-100 text-slate-900 shadow-inner",
                      )}
                      placeholder="Adăugați detalii suplimentare pentru montaj sau specificații lentile..."
                    />
                  </div>

                  {/* Summary Row: Subtotals & Total */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subtotals Card */}
                    <div
                      className={cn(
                        "p-6 rounded-[2.5rem] border-2 border-dashed flex flex-col justify-center",
                        darkMode
                          ? "bg-slate-900/40 border-slate-800"
                          : "bg-white border-slate-100",
                      )}
                    >
                      <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-3 mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Defalcare Costuri
                        </span>
                        <div className="flex items-center gap-1 opacity-40">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between items-center text-xs font-black">
                          <span className="text-slate-400 uppercase tracking-tight">
                            {currentMedicalRecord.glassesOrder?.orderType === "contact_lens"
                              ? "Lentile Contact"
                              : currentMedicalRecord.glassesOrder?.orderType === "progressive_bifocal"
                                ? "Progresiv / Bifocal"
                                : "Distanță"}
                          </span>
                          <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                            {(
                              (currentMedicalRecord.glassesOrder?.framePrice ||
                                0) +
                              (currentMedicalRecord.glassesOrder
                                ?.lensRightPrice || 0) +
                              (currentMedicalRecord.glassesOrder
                                ?.lensLeftPrice || 0) +
                              (currentMedicalRecord.glassesOrder?.laborPrice ||
                                0)
                            ).toFixed(0)}{" "}
                            RON
                          </span>
                        </div>
                        {currentMedicalRecord.glassesOrder?.orderType ===
                          "both" && (
                          <div className="flex justify-between items-center text-xs font-black pt-1">
                            <span className="text-slate-400 uppercase tracking-tight">
                              Aproape
                            </span>
                            <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg">
                              {(
                                (currentMedicalRecord.glassesOrder
                                  ?.nearFramePrice || 0) +
                                (currentMedicalRecord.glassesOrder
                                  ?.nearLensRightPrice || 0) +
                                (currentMedicalRecord.glassesOrder
                                  ?.nearLensLeftPrice || 0) +
                                (currentMedicalRecord.glassesOrder
                                  ?.nearLaborPrice || 0)
                              ).toFixed(0)}{" "}
                              RON
                            </span>
                          </div>
                        )}
                        {currentMedicalRecord.glassesOrder?.diversePrice ? (
                          <div className="flex justify-between items-center text-xs font-black pt-1">
                            <span className="text-slate-400 uppercase tracking-tight">
                              {currentMedicalRecord.glassesOrder?.diverseName ||
                                "Diverse"}
                            </span>
                            <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                              {(
                                currentMedicalRecord.glassesOrder
                                  ?.diversePrice || 0
                              ).toFixed(0)}{" "}
                              RON
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Grand Total Card */}
                    <div
                      className={cn(
                        "p-6 rounded-[2.5rem] border-4 flex flex-col items-end gap-1 shadow-2xl relative overflow-hidden",
                        darkMode
                          ? "bg-blue-600 border-blue-500"
                          : "bg-blue-600 border-blue-500",
                      )}
                    >
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
                      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />

                      <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em] relative z-20">
                        Total Comandă
                      </span>
                      <div className="flex items-baseline gap-1 relative z-20">
                        <span className="text-5xl font-black text-white drop-shadow-xl">
                          {(
                            currentMedicalRecord.glassesOrder?.total || 0
                          ).toFixed(0)}
                        </span>
                        <span className="text-xl font-black text-white/60">
                          RON
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        Avans Plătit
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={
                            currentMedicalRecord.glassesOrder?.advance ?? ""
                          }
                          onChange={(e) =>
                            updateOrder(
                              "advance",
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                            )
                          }
                          onFocus={(e) => e.target.select()}
                          className={cn(
                            "w-full p-4 pr-16 border-2 rounded-2xl font-black text-2xl outline-none focus:ring-2 focus:ring-emerald-500",
                            darkMode
                              ? "bg-slate-800 border-emerald-500/30 text-emerald-400"
                              : "bg-emerald-50 border-emerald-200 text-emerald-700",
                          )}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          RON
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 mb-1 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateOrder("status", "in-progress")}
                          className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all",
                            (currentMedicalRecord.glassesOrder?.status || "in-progress") === "in-progress"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          )}
                          title="Status: În lucru"
                        >
                          În lucru
                        </button>
                        <button
                          type="button"
                          onClick={() => updateOrder("status", "ready_for_pickup")}
                          className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all",
                            currentMedicalRecord.glassesOrder?.status === "ready_for_pickup"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          )}
                          title="Status: Gata de ridicare"
                        >
                          Gata de ridicare
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (validateOrderAxisHelper(currentMedicalRecord.glassesOrder)) {
                              setIsFinalizeConfirmationOpen(true);
                            }
                          }}
                          className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all",
                            currentMedicalRecord.glassesOrder?.status === "completed"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          )}
                          title="Status: Finalizată"
                        >
                          Finalizată
                        </button>
                      </div>

                      {currentMedicalRecord.glassesOrder?.whatsappNotifiedAt && (
                        <span
                          className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
                          title={`Notificare WhatsApp trimisă la ${format(new Date(currentMedicalRecord.glassesOrder.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}${currentMedicalRecord.glassesOrder.whatsappNotifiedBy ? ` (${currentMedicalRecord.glassesOrder.whatsappNotifiedBy})` : ""}`}
                        >
                          <span>📲</span>
                          <span>Notificat WhatsApp la {format(new Date(currentMedicalRecord.glassesOrder.whatsappNotifiedAt), "dd.MM HH:mm")}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        {currentMedicalRecord.glassesOrder?.status === "ready_for_pickup" && (
                          <button
                            type="button"
                            onClick={() => {
                              let rawPhone = (currentMedicalRecord.patientPhone || "").trim();
                              let cleanDigits = rawPhone.replace(/\D/g, "");
                              if (!cleanDigits) {
                                const inputPhone = window.prompt("Introduceți numărul de telefon al pacientului pentru notificarea WhatsApp:");
                                if (!inputPhone) return;
                                cleanDigits = inputPhone.replace(/\D/g, "");
                              }
                              if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
                                cleanDigits = "4" + cleanDigits;
                              } else if (!cleanDigits.startsWith("40") && cleanDigits.length === 9) {
                                cleanDigits = "40" + cleanDigits;
                              }
                              const message = "Bună ziua, vă informăm că ochelarii dumneavoastră sunt gata la Clinica Negreanu din Pitesti (Piata Ceair). Vă așteptăm cu drag pentru ridicare și ajustare! Pentru alte informatii sunati va rog pe  0248223162";
                              window.open(`https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`, "_blank");

                              const nowIso = new Date().toISOString();
                              const notifierName = profile?.displayName || (profile as any)?.name || "Recepție";
                              updateOrder({
                                whatsappNotifiedAt: nowIso,
                                whatsappNotifiedBy: notifierName,
                              });
                            }}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer animate-pulse-subtle"
                            title={currentMedicalRecord.glassesOrder?.whatsappNotifiedAt ? `Notificat WhatsApp la ${format(new Date(currentMedicalRecord.glassesOrder.whatsappNotifiedAt), "dd.MM.yyyy HH:mm")}. Click pentru retrimitere.` : "Trimite mesaj WhatsApp pacientului"}
                          >
                            <span className="text-sm">📲</span>
                            <span>{currentMedicalRecord.glassesOrder?.whatsappNotifiedAt ? "Retrimite WhatsApp" : "Trimite WhatsApp"}</span>
                          </button>
                        )}

                        {currentMedicalRecord.glassesOrder?.status !== "completed" && (
                          <button
                            type="button"
                            onClick={() => {
                              const nowIso = new Date().toISOString();
                              const totalVal = currentMedicalRecord.glassesOrder?.total || 0;
                              updateOrder({
                                status: "completed",
                                advance: totalVal,
                                balance: 0,
                                deliveredAt: nowIso,
                                deliveredBy: profile?.displayName || (profile as any)?.name || "Recepție",
                              });
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                            title="1-Click: Încasează restul automat (sold 0) și marchează comanda ca Finalizată / Predată"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>Predat & Încasat Restul {(currentMedicalRecord.glassesOrder?.balance || 0) > 0 ? `(${currentMedicalRecord.glassesOrder?.balance} lei)` : ""}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest text-right block">
                        Rest de Plată
                      </label>
                      <div
                        className={cn(
                          "w-full p-4 border-2 rounded-2xl font-black text-2xl flex items-center justify-center shadow-inner",
                          darkMode
                            ? "bg-slate-800 border-rose-500/30 text-rose-400"
                            : "bg-rose-50 border-rose-200 text-rose-700",
                        )}
                      >
                        {(
                          currentMedicalRecord.glassesOrder?.balance || 0
                        ).toFixed(0)}{" "}
                        <span className="ml-2 text-[10px] opacity-60 uppercase">
                          Rest
                        </span>
                      </div>
                    </div>
                  </div>

                  {orderModalError && (
                    <div id="order-modal-error-banner" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed shadow-sm">
                      {orderModalError}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setIsGlassesOrderModalOpen(false)}
                        className="py-4 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl"
                      >
                        Anulează
                      </button>
                      <button
                        onClick={finalizeOrder}
                        className="py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl"
                      >
                        Salvează
                      </button>
                      <button
                        onClick={saveAndPrintGlassesOrder}
                        className="py-4 rounded-2xl bg-slate-400 text-white font-black uppercase tracking-widest hover:bg-slate-500 transition-all shadow-xl flex items-center justify-center gap-3"
                      >
                        <Printer className="w-5 h-5" />
                        Salvează și Printează
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datalists for Autocomplete */}
              <datalist id="frame-suggestions">
                {frameSuggestions.map((s, idx) => (
                  <option key={`frame-${s}-${idx}`} value={s} />
                ))}
              </datalist>
              <datalist id="lens-suggestions">
                {lensSuggestions.map((s, idx) => (
                  <option key={`lens-${s}-${idx}`} value={s} />
                ))}
              </datalist>

              {/* Finalize Confirmation Popup */}
              <AnimatePresence>
                {isFinalizeConfirmationOpen && (
                  <motion.div
                    key="finalize-confirmation-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className={cn(
                        "w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border text-center space-y-6",
                        darkMode
                          ? "bg-slate-900 border-slate-800"
                          : "bg-white border-slate-100",
                      )}
                    >
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          Finalizare Comandă
                        </h4>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Sunteți sigur că această comandă a fost achitată
                          integral și finalizată?
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                          onClick={() => setIsFinalizeConfirmationOpen(false)}
                          className="py-3 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                        >
                          Nu
                        </button>
                        <button
                          onClick={async () => {
                            const total =
                              currentMedicalRecord?.glassesOrder?.total || 0;

                            const updatedOrder = {
                              ...currentMedicalRecord.glassesOrder!,
                              advance: total,
                              balance: 0,
                              status: "completed" as const,
                            };

                            let newHistory = [
                              ...(currentMedicalRecord.orderHistory || []),
                            ];
                            if (
                              activeOrderIndex !== null &&
                              newHistory[activeOrderIndex]
                            ) {
                              newHistory[activeOrderIndex] = updatedOrder;
                            } else if (
                              newHistory.length > 0 &&
                              newHistory[0].orderNumber ===
                                updatedOrder.orderNumber
                            ) {
                              newHistory[0] = updatedOrder;
                            } else {
                              newHistory = [updatedOrder, ...newHistory];
                            }

                            const updatedRecord = {
                              ...currentMedicalRecord,
                              glassesOrder: updatedOrder,
                              orderHistory: newHistory,
                            };

                            setLoading(true);
                            try {
                              await setDoc(
                                doc(
                                  db,
                                  "medicalRecords",
                                  currentMedicalRecord.id,
                                ),
                                removeUndefined(updatedRecord),
                              );
                              setCurrentMedicalRecord(updatedRecord);
                              setIsFinalizeConfirmationOpen(false);
                              setIsGlassesOrderModalOpen(false);
                            } catch (error) {
                              console.error(
                                "Error finalizing order shortcut:",
                                error,
                              );
                              alert("Eroare la finalizare!");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="py-3 px-6 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
                          disabled={loading}
                        >
                          {loading ? "Se finalizează..." : "Da"}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  );
};
