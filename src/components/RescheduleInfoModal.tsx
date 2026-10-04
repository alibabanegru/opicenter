import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarClock, X } from "lucide-react";
import { cn } from "../appConstants";

export interface RescheduleInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  reschedulingAppointment: any;
  setReschedulingAppointment: (app: any) => void;
  setAppointmentToCancel: (app: any) => void;
  setIsDeleteConfirmModalOpen: (open: boolean) => void;
  setRescheduleAsControl: (val: boolean) => void;
}

export const RescheduleInfoModal: React.FC<RescheduleInfoModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  reschedulingAppointment,
  setReschedulingAppointment,
  setAppointmentToCancel,
  setIsDeleteConfirmModalOpen,
  setRescheduleAsControl,
}) => {
  return (
    <AnimatePresence>
      {isOpen && reschedulingAppointment && (
        <motion.div
          key="reschedule-info-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "rounded-3xl p-8 w-full max-w-md shadow-2xl border transition-all",
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200",
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={cn(
                  "text-xl font-bold",
                  darkMode ? "text-slate-100" : "text-slate-900",
                )}
              >
                Mod Reprogramare
              </h2>
              <button
                onClick={() => {
                  onClose();
                  setReschedulingAppointment(null);
                }}
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

            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="p-4 bg-blue-600/20 rounded-full">
                <CalendarClock className="w-10 h-10 text-blue-500" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-300" : "text-slate-700",
                  )}
                >
                  Ați activat modul de reprogramare pentru:
                </p>
                <p className="text-4xl font-black text-red-600 uppercase tracking-tighter mb-2">
                  {reschedulingAppointment.patientName}
                </p>
                <div
                  className={cn(
                    "flex flex-col items-center space-y-2 mt-2",
                    darkMode ? "text-slate-200" : "text-slate-700",
                  )}
                >
                  <div className="flex items-center gap-3 text-lg font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-2xl shadow-inner uppercase tracking-wider">
                    <span>{reschedulingAppointment.patientAge} ani</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>
                      {reschedulingAppointment.patientSex === "M"
                        ? "Masculin"
                        : reschedulingAppointment.patientSex === "F"
                          ? "Feminin"
                          : "Nespecificat"}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-blue-600 bg-blue-500/10 px-6 py-2 rounded-2xl border-2 border-blue-500/20 shadow-sm font-mono">
                    {reschedulingAppointment.patientPhone}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "text-xs",
                  darkMode ? "text-slate-400" : "text-slate-500",
                )}
              >
                Vă rugăm să navigați în calendar și să alegeți o nouă zi sau
                un nou interval orar. Datele pacientului vor fi mutate automat.
              </p>
            </div>

            <div className="space-y-3 w-full">
              <button
                onClick={() => {
                  setAppointmentToCancel(reschedulingAppointment);
                  onClose();
                  setIsDeleteConfirmModalOpen(true);
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-900/20"
              >
                Anulează Consultația
              </button>
              <button
                onClick={() => {
                  setRescheduleAsControl(true);
                  onClose();
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/20"
              >
                Programează revenire
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                Am înțeles, aleg noua dată
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
