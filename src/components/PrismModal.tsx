import React from "react";
import { motion } from "motion/react";
import { Triangle, X } from "lucide-react";
import { cn } from "../appConstants";

export interface PrismModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  prismEye: "OD" | "OS";
  setPrismEye: (eye: "OD" | "OS") => void;
  prismTarget: string;
  tempPrismValue: string;
  setTempPrismValue: (val: string) => void;
  tempPrismBase: string;
  setTempPrismBase: (base: any) => void;
  currentMedicalRecord: any;
  setCurrentMedicalRecord: (rec: any) => void;
  updateOrder: (updates: any) => void;
}

export const PrismModal: React.FC<PrismModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  prismEye,
  setPrismEye,
  prismTarget,
  tempPrismValue,
  setTempPrismValue,
  tempPrismBase,
  setTempPrismBase,
  currentMedicalRecord,
  setCurrentMedicalRecord,
  updateOrder,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[110]"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "rounded-3xl p-8 w-full max-w-sm shadow-2xl border transition-all",
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200",
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={cn(
              "text-xl font-bold flex items-center gap-2",
              darkMode ? "text-slate-100" : "text-slate-900",
            )}
          >
            <Triangle
              className={cn(
                "w-5 h-5 transition-transform duration-300",
                prismEye === "OD"
                  ? tempPrismBase === "SUS"
                    ? "rotate-180"
                    : tempPrismBase === "JOS"
                      ? "rotate-0"
                      : tempPrismBase === "NAZAL"
                        ? "-rotate-90"
                        : tempPrismBase === "TEMPORAL"
                          ? "rotate-90"
                          : "rotate-0"
                  : tempPrismBase === "SUS"
                    ? "rotate-180"
                    : tempPrismBase === "JOS"
                      ? "rotate-0"
                      : tempPrismBase === "NAZAL"
                        ? "rotate-90"
                        : tempPrismBase === "TEMPORAL"
                          ? "-rotate-90"
                          : "rotate-0",
                prismEye === "OD"
                  ? "text-blue-500 fill-blue-500/20"
                  : "text-emerald-500 fill-emerald-500/20",
              )}
            />
            Prismă {prismEye}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-full transition-colors",
              darkMode
                ? "hover:bg-slate-800 text-slate-400"
                : "hover:bg-slate-100 text-slate-500",
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Eye Switcher for Prism Modal */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setPrismEye("OD");
              if (prismTarget === "glassesOrder") {
                setTempPrismValue(currentMedicalRecord?.glassesOrder?.od?.prism || "");
                setTempPrismBase((currentMedicalRecord?.glassesOrder?.od?.base || "") as any);
              } else {
                setTempPrismValue(currentMedicalRecord?.od?.prism || "");
                setTempPrismBase((currentMedicalRecord?.od?.base || "") as any);
              }
            }}
            className={cn(
              "flex-1 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5",
              prismEye === "OD"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            OD (Ochi Drept)
          </button>
          <button
            type="button"
            onClick={() => {
              setPrismEye("OS");
              if (prismTarget === "glassesOrder") {
                setTempPrismValue(currentMedicalRecord?.glassesOrder?.os?.prism || "");
                setTempPrismBase((currentMedicalRecord?.glassesOrder?.os?.base || "") as any);
              } else {
                setTempPrismValue(currentMedicalRecord?.os?.prism || "");
                setTempPrismBase((currentMedicalRecord?.os?.base || "") as any);
              }
            }}
            className={cn(
              "flex-1 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5",
              prismEye === "OS"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            OS (Ochi Stâng)
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label
              className={cn(
                "block text-xs font-black uppercase tracking-widest",
                darkMode ? "text-slate-400" : "text-slate-500",
              )}
            >
              Dioptrie prismatică
            </label>
            <input
              type="text"
              value={tempPrismValue}
              onChange={(e) =>
                setTempPrismValue(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="Ex: 1.5"
              className={cn(
                "w-full p-4 border-2 rounded-2xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-900",
              )}
            />
          </div>
          <div className="space-y-2">
            <label
              className={cn(
                "block text-xs font-black uppercase tracking-widest",
                darkMode ? "text-slate-400" : "text-slate-500",
              )}
            >
              BAZA
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["NAZAL", "TEMPORAL", "SUS", "JOS"].map((base) => (
                <button
                  key={base}
                  onClick={() => setTempPrismBase(base as any)}
                  className={cn(
                    "py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-2",
                    tempPrismBase === base
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                      : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {base}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className={cn(
                "flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
              )}
            >
              Anulează
            </button>
            <button
              disabled={!tempPrismValue || !tempPrismBase}
              onClick={() => {
                if (currentMedicalRecord) {
                  const eyeKey = prismEye.toLowerCase() as "od" | "os";
                  if (prismTarget === "glassesOrder") {
                    updateOrder({
                      [`${eyeKey}.prism`]: tempPrismValue,
                      [`${eyeKey}.base`]: tempPrismBase,
                    });
                  } else {
                    const updatedEye = {
                      ...currentMedicalRecord[eyeKey],
                      prism: tempPrismValue,
                      base: tempPrismBase as any,
                    };
                    setCurrentMedicalRecord({
                      ...currentMedicalRecord,
                      [eyeKey]: updatedEye,
                    });
                  }
                  onClose();
                }
              }}
              className={cn(
                "flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:grayscale",
              )}
            >
              Salvează
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
