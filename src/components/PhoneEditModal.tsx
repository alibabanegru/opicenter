import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, X, Save } from "lucide-react";
import { cn, MedicalRecord } from "../appConstants";
import { BufferedPhoneInput } from "./BufferedPhoneInput";

export interface PhoneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentMedicalRecord: MedicalRecord | null;
  tempEditPhone: string;
  setTempEditPhone: (val: string) => void;
  handleQuickSavePhone: () => void;
}

export const PhoneEditModal: React.FC<PhoneEditModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  currentMedicalRecord,
  tempEditPhone,
  setTempEditPhone,
  handleQuickSavePhone,
}) => {
  if (!currentMedicalRecord) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="phone-edit-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={cn(
              "w-full max-w-md rounded-[2rem] p-6 shadow-2xl overflow-hidden border transition-all flex flex-col gap-5",
              darkMode
                ? "bg-slate-900 border-slate-800 text-slate-100"
                : "bg-white border-slate-200 text-slate-900",
            )}
          >
            <div className="flex justify-between items-center border-b pb-4 dark:border-slate-800 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Adaugă / Editează Telefon</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentMedicalRecord.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Număr de Telefon
              </label>
              <BufferedPhoneInput
                value={tempEditPhone}
                onChange={setTempEditPhone}
                placeholder="07xx xxx xxx"
                className={cn(
                  "w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold tracking-wider",
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100"
                    : "bg-white border-slate-200 text-slate-900",
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border dark:border-slate-700 border-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Renunță
              </button>
              <button
                type="button"
                onClick={handleQuickSavePhone}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvează Telefon
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
