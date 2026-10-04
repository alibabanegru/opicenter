import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cake, X, Search, CheckCircle2, Send } from "lucide-react";
import { cn, matchPatientName } from "../appConstants";

export interface BirthdayStatus {
  isToday: boolean;
  daysRemaining: number;
  age: number;
  bMonth: number;
  bDay: number;
  formattedDate: string;
}

export interface PatientBirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  getAllPatients: () => any[];
  sentBirthdayPatients: string[];
  markBirthdayAsSent: (patientId: string) => void;
  sendBirthdayWhatsAppMessage: (phone: string, message: string) => void;
  generatePatientBirthdayMessage: (name: string, birthDate?: string) => string;
  getBirthdayStatus: (birthDateStr: string | undefined | null) => BirthdayStatus | null;
}

export const PatientBirthdayModal: React.FC<PatientBirthdayModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  getAllPatients,
  sentBirthdayPatients,
  markBirthdayAsSent,
  sendBirthdayWhatsAppMessage,
  generatePatientBirthdayMessage,
  getBirthdayStatus,
}) => {
  const [birthdaySearchQuery, setBirthdaySearchQuery] = useState("");
  const [birthdaySelectedPatientID, setBirthdaySelectedPatientID] = useState<string | null>(null);
  const [birthdayCustomMessage, setBirthdayCustomMessage] = useState("");

  const all = getAllPatients();
  const patientsWithBirthdays = all
    .map((p) => {
      const bStatus = getBirthdayStatus(p.birthDate);
      return { ...p, bStatus };
    })
    .filter((p) => p.bStatus !== null) as Array<
    (typeof all)[0] & {
      bStatus: BirthdayStatus;
    }
  >;

  const filteredPatients = patientsWithBirthdays.filter((p) => {
    if (!birthdaySearchQuery) return true;
    const q = birthdaySearchQuery.trim();
    const cleanDigits = q.replace(/\D/g, "");
    return (
      matchPatientName(p.name, q) ||
      (p.phone && p.phone.includes(q)) ||
      (cleanDigits.length >= 3 && p.phone && p.phone.replace(/\D/g, "").includes(cleanDigits)) ||
      (p.cnp && p.cnp.includes(q))
    );
  });

  const todayBirthdays = filteredPatients.filter((p) => p.bStatus.isToday);
  const upcomingBirthdays = filteredPatients
    .filter(
      (p) =>
        !p.bStatus.isToday &&
        (birthdaySearchQuery ? true : p.bStatus.daysRemaining <= 45),
    )
    .sort((a, b) => a.bStatus.daysRemaining - b.bStatus.daysRemaining);

  const selectedPatient =
    patientsWithBirthdays.find((p) => p.id === birthdaySelectedPatientID) ||
    todayBirthdays[0] ||
    upcomingBirthdays[0] ||
    null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="birthday-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99]"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              "rounded-3xl p-6 sm:p-8 w-full max-w-5xl shadow-2xl border flex flex-col max-h-[90vh] transition-all",
              darkMode
                ? "bg-slate-900 border-slate-800 text-slate-100"
                : "bg-white border-slate-200 text-slate-900",
            )}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl">
                  <Cake className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                    Aniversări Pacienți
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Clienții care își serbează ziua de naștere. Trimiteți urări speciale pe WhatsApp dintr-un singur click!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                    : "hover:bg-slate-100 text-slate-500 hover:text-black",
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden flex-1 min-h-0">
              {/* Left Panel: List (2 cols) */}
              <div className="lg:col-span-2 flex flex-col min-h-0 h-full max-h-[45vh] lg:max-h-none border-r border-slate-100 dark:border-slate-800/60 pr-0 lg:pr-4 overflow-hidden">
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={birthdaySearchQuery}
                    onChange={(e) => setBirthdaySearchQuery(e.target.value)}
                    placeholder="Caută după nume, telefon..."
                    className={cn(
                      "w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none font-medium transition-all",
                      darkMode
                        ? "bg-slate-800/50 border-slate-700 focus:border-pink-500 text-slate-200"
                        : "bg-slate-50 border-slate-200 focus:border-pink-500 text-slate-800",
                    )}
                  />
                  {birthdaySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBirthdaySearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Scrollable list */}
                <div className="overflow-y-auto flex-1 pr-1.5 space-y-4">
                  {/* Section 1: Astăzi */}
                  <div>
                    <h3 className="text-[10px] font-black tracking-widest text-pink-500 uppercase mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                      Astăzi ({todayBirthdays.length})
                    </h3>
                    {todayBirthdays.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-2 py-1">
                        Nicio aniversare programată pentru astăzi.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {todayBirthdays.map((p) => {
                          const isSelected = selectedPatient && p.id === selectedPatient.id;
                          const isSent = sentBirthdayPatients.includes(p.id);
                          return (
                            <div
                              key={`today-${p.id}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setBirthdaySelectedPatientID(p.id);
                                const generatedMessage = generatePatientBirthdayMessage(p.name, p.birthDate);
                                setBirthdayCustomMessage(generatedMessage);
                              }}
                              className={cn(
                                "w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1 outline-none cursor-pointer select-none relative group",
                                isSelected
                                  ? "bg-pink-50 dark:bg-pink-950/30 border-pink-400 dark:border-pink-700 ring-2 ring-pink-500/30 shadow-md"
                                  : darkMode
                                    ? "bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50",
                              )}
                            >
                              <div className="flex justify-between items-start gap-2 w-full">
                                <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100 flex-1">
                                  {p.name}
                                </span>
                                {isSent ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Trimis
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shrink-0 shadow-sm animate-pulse">
                                    Azi! ({p.bStatus.age} ani)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{p.phone || "Fără telefon"}</span>
                                <span>{p.bStatus.formattedDate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 2: În curând */}
                  <div>
                    <h3 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">
                      În Curând ({upcomingBirthdays.length})
                    </h3>
                    {upcomingBirthdays.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-2 py-1">
                        Nicio aniversare în următoarele 45 de zile.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingBirthdays.map((p) => {
                          const isSelected = selectedPatient && p.id === selectedPatient.id;
                          const isSent = sentBirthdayPatients.includes(p.id);
                          return (
                            <div
                              key={`upcoming-${p.id}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setBirthdaySelectedPatientID(p.id);
                                const generatedMessage = generatePatientBirthdayMessage(p.name, p.birthDate);
                                setBirthdayCustomMessage(generatedMessage);
                              }}
                              className={cn(
                                "w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1 outline-none cursor-pointer select-none relative group",
                                isSelected
                                  ? "bg-pink-50 dark:bg-pink-950/30 border-pink-400 dark:border-pink-700 ring-2 ring-pink-500/30 shadow-md"
                                  : darkMode
                                    ? "bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50",
                              )}
                            >
                              <div className="flex justify-between items-start gap-2 w-full">
                                <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100 flex-1">
                                  {p.name}
                                </span>
                                {isSent ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Trimis
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                    În {p.bStatus.daysRemaining} zile
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{p.phone || "Fără telefon"}</span>
                                <span>{p.bStatus.formattedDate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel: WhatsApp Preview & Message Box (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-between p-4 sm:p-5 rounded-2xl border bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 h-full overflow-y-auto space-y-4">
                {selectedPatient ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/60 mb-3">
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                            {selectedPatient.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {selectedPatient.phone || "Număr de telefon neînregistrat"}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                          {selectedPatient.bStatus.isToday
                            ? `Împlinește ${selectedPatient.bStatus.age} ani astăzi!`
                            : `Peste ${selectedPatient.bStatus.daysRemaining} zile (${selectedPatient.bStatus.age} ani)`}
                        </span>
                      </div>

                      {/* Message Customization */}
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Mesaj Personalizat WhatsApp:
                      </label>
                      <textarea
                        rows={5}
                        value={birthdayCustomMessage}
                        onChange={(e) => setBirthdayCustomMessage(e.target.value)}
                        className={cn(
                          "w-full p-3 border rounded-xl outline-none text-xs sm:text-sm transition-all font-medium resize-none",
                          darkMode
                            ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-pink-500"
                            : "bg-white border-slate-200 text-slate-900 focus:border-pink-500",
                        )}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPatient) {
                            sendBirthdayWhatsAppMessage(selectedPatient.phone, birthdayCustomMessage);
                            markBirthdayAsSent(selectedPatient.id);
                          }
                        }}
                        disabled={!selectedPatient.phone}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-all",
                          selectedPatient.phone
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 active:scale-95"
                            : "bg-slate-400 cursor-not-allowed opacity-60",
                        )}
                      >
                        <Send className="w-4 h-4" />
                        Trimite pe WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBirthdayCustomMessage(
                            generatePatientBirthdayMessage(
                              selectedPatient.name,
                              selectedPatient.birthDate,
                            ),
                          );
                        }}
                        className={cn(
                          "px-4 py-3 rounded-xl text-xs font-bold border transition-all",
                          darkMode
                            ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                            : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700",
                        )}
                      >
                        Resetează Mesajul
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400">
                    <Cake className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold">Selectați un pacient din listă</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
