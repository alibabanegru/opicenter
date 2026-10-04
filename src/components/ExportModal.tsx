import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn, Role } from "../appConstants";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  profile: any;
  selectedDoctorForExport: string;
  setSelectedDoctorForExport: (doc: string) => void;
  activeDoctorRoles: string[];
  getRoleLabel: (role: Role | string) => string;
  exportToPDF: (type: "day" | "week") => void;
  selectedDate: Date;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  profile,
  selectedDoctorForExport,
  setSelectedDoctorForExport,
  activeDoctorRoles,
  getRoleLabel,
  exportToPDF,
  selectedDate,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="export-modal-overlay"
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
                Exportă Programări
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

            {profile?.role === "admin" ||
            profile?.role === "frontdesk" ||
            profile?.role === "seller" ? (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Filtrează Medic / Optometrist
                </label>
                <select
                  value={selectedDoctorForExport}
                  onChange={(e) => setSelectedDoctorForExport(e.target.value)}
                  className={cn(
                    "w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-900",
                  )}
                >
                  <option value="all">Toți medicii și optometriștii</option>
                  <option value="admin">Ing. Optometrist</option>
                  {activeDoctorRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Filtrează Medic
                </label>
                <div
                  className={cn(
                    "w-full p-3 border rounded-xl bg-opacity-50",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600",
                  )}
                >
                  {getRoleLabel(profile?.role as Role)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => exportToPDF("day")}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all group",
                  darkMode
                    ? "bg-slate-800 border-slate-700 hover:border-blue-500"
                    : "bg-slate-50 border-slate-200 hover:border-blue-400",
                )}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-blue-600/20 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-bold",
                        darkMode ? "text-slate-100" : "text-slate-900",
                      )}
                    >
                      Exportă Ziua Curentă
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(selectedDate, "dd  MMMM  yyyy", { locale: ro })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </button>

              <button
                onClick={() => exportToPDF("week")}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all group",
                  darkMode
                    ? "bg-slate-800 border-slate-700 hover:border-emerald-500"
                    : "bg-slate-50 border-slate-200 hover:border-emerald-400",
                )}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-emerald-600/20 rounded-xl">
                    <Users className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-bold",
                        darkMode ? "text-slate-100" : "text-slate-900",
                      )}
                    >
                      Exportă Săptămâna
                    </p>
                    <p className="text-xs text-slate-500">Luni - Sâmbătă</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
