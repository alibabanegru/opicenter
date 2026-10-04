import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Clock,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  X,
  Sliders,
  Check,
  Zap,
  Info,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  analyzeWorkloadAndOptimizeSchedules,
  ClinicOptimizationOverview,
  DoctorOptimizationSummary,
  DayOptimizationResult,
  DURATION_BENCHMARKS,
} from "../lib/scheduleOptimizer";
import { Appointment, MedicalRecord, ScheduleConfig, DayConfig, cn } from "../appConstants";

interface ScheduleOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  configs: ScheduleConfig[];
  doctorNames: Record<string, string>;
  activeDoctorRoles: string[];
  onApplyOptimization: (
    doctorId: string,
    updates: { dayOfWeek: number; intervalMinutes: number; startHour?: number; endHour?: number }[]
  ) => Promise<void>;
}

export const ScheduleOptimizerModal: React.FC<ScheduleOptimizerModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  appointments,
  medicalRecords,
  configs,
  doctorNames,
  activeDoctorRoles,
  onApplyOptimization,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [lookbackDays, setLookbackDays] = useState<number>(60);
  const [applyHoursAdjustment, setApplyHoursAdjustment] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [appliedDoctors, setAppliedDoctors] = useState<Set<string>>(new Set());

  // Run the schedule optimization algorithm
  const overview: ClinicOptimizationOverview = useMemo(() => {
    return analyzeWorkloadAndOptimizeSchedules(
      appointments,
      medicalRecords,
      configs,
      doctorNames,
      selectedDoctorId === "all" ? undefined : selectedDoctorId,
      lookbackDays
    );
  }, [appointments, medicalRecords, configs, doctorNames, selectedDoctorId, lookbackDays]);

  const displayedDoctors = useMemo(() => {
    if (selectedDoctorId === "all") {
      return overview.doctors;
    }
    return overview.doctors.filter((d) => d.doctorId === selectedDoctorId);
  }, [overview, selectedDoctorId]);

  const handleApplyDoctor = async (docSummary: DoctorOptimizationSummary) => {
    setIsApplying(true);
    try {
      const updates = docSummary.days
        .filter((d) => d.isAvailable)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          intervalMinutes: d.recommendedInterval,
          ...(applyHoursAdjustment
            ? { startHour: d.recommendedStartHour, endHour: d.recommendedEndHour }
            : {}),
        }));

      await onApplyOptimization(docSummary.doctorId, updates);
      setAppliedDoctors((prev) => new Set([...prev, docSummary.doctorId]));
      setSuccessToast(`Orarul pentru ${docSummary.doctorName} a fost optimizat cu succes!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Error applying optimization:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplySingleDay = async (
    docSummary: DoctorOptimizationSummary,
    dayResult: DayOptimizationResult
  ) => {
    setIsApplying(true);
    try {
      const updates = [
        {
          dayOfWeek: dayResult.dayOfWeek,
          intervalMinutes: dayResult.recommendedInterval,
          ...(applyHoursAdjustment
            ? { startHour: dayResult.recommendedStartHour, endHour: dayResult.recommendedEndHour }
            : {}),
        },
      ];

      await onApplyOptimization(docSummary.doctorId, updates);
      setSuccessToast(
        `Ziua de ${dayResult.dayName} pentru ${docSummary.doctorName} a fost actualizată la intervalul de ${dayResult.recommendedInterval} min!`
      );
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error("Error applying single day:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyAllDoctors = async () => {
    setIsApplying(true);
    try {
      for (const doc of displayedDoctors) {
        const updates = doc.days
          .filter((d) => d.isAvailable)
          .map((d) => ({
            dayOfWeek: d.dayOfWeek,
            intervalMinutes: d.recommendedInterval,
            ...(applyHoursAdjustment
              ? { startHour: d.recommendedStartHour, endHour: d.recommendedEndHour }
              : {}),
          }));

        await onApplyOptimization(doc.doctorId, updates);
        setAppliedDoctors((prev) => new Set([...prev, doc.doctorId]));
      }

      setSuccessToast(
        `Intervalele tuturor medicilor au fost optimizate! Timpul mediu de așteptare scade cu ${overview.clinicWideAvgWaitBefore - overview.clinicWideAvgWaitAfter} min.`
      );
      setTimeout(() => setSuccessToast(null), 4500);
    } catch (err) {
      console.error("Error applying all:", err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="schedule-optimizer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="schedule-optimizer-modal-container"
        className={cn(
          "w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all",
          darkMode
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-800"
        )}
      >
        {/* Header */}
        <div
          id="schedule-optimizer-header"
          className={cn(
            "p-5 sm:p-6 border-b flex flex-wrap items-center justify-between gap-4 shrink-0",
            darkMode
              ? "bg-slate-900/90 border-slate-800"
              : "bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-slate-200"
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                  Optimizare Inteligentă a Orarului
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Algoritm Anti-Așteptare
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
                Ajustează automat intervalele orare ale medicilor pe baza istoricului de încărcare,
                a ponderii consultațiilor complexe și a duratelor reale de lucru.
              </p>
            </div>
          </div>

          <button
            id="close-optimizer-modal-btn"
            onClick={onClose}
            className={cn(
              "p-2.5 rounded-2xl border transition-all cursor-pointer",
              darkMode
                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white"
                : "bg-white border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            )}
            title="Închide fereastra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div
          id="optimizer-controls-bar"
          className={cn(
            "px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0",
            darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/80 border-slate-200"
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                Medic analizat:
              </span>
              <select
                id="optimizer-doctor-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-200"
                    : "bg-white border-slate-300 text-slate-800 shadow-sm"
                )}
              >
                <option value="all">Toți Medicii Clinicii</option>
                {configs.map((c) => (
                  <option key={c.doctorId} value={c.doctorId}>
                    {doctorNames[c.doctorId] || `Dr. ${c.doctorId}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                Istoric analizat:
              </span>
              <select
                id="optimizer-lookback-select"
                value={lookbackDays}
                onChange={(e) => setLookbackDays(Number(e.target.value))}
                className={cn(
                  "px-3 py-1.5 rounded-xl border font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-200"
                    : "bg-white border-slate-300 text-slate-800 shadow-sm"
                )}
              >
                <option value={30}>Ultimele 30 de zile</option>
                <option value={60}>Ultimele 60 de zile</option>
                <option value={90}>Ultimele 90 de zile</option>
                <option value={0}>Tot istoricul clinicii</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none ml-1">
              <input
                type="checkbox"
                id="optimizer-adjust-hours-checkbox"
                checked={applyHoursAdjustment}
                onChange={(e) => setApplyHoursAdjustment(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs">
                Ajustează și orele inactive (start/sfârșit)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="apply-all-optimizations-btn"
              onClick={handleApplyAllDoctors}
              disabled={isApplying}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md transition-all active:scale-95 cursor-pointer",
                isApplying
                  ? "bg-blue-400 opacity-60 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 hover:scale-[1.02]"
              )}
            >
              {isApplying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Ajustează Automat Toate Intervalele
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div id="optimizer-modal-body" className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* KPI Dashboard Cards */}
          <div
            id="optimizer-kpi-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Card 1: Wait Time Reduction */}
            <div
              className={cn(
                "p-4 rounded-2xl border flex flex-col justify-between transition-all",
                darkMode
                  ? "bg-slate-800/40 border-slate-800 hover:border-emerald-500/40"
                  : "bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-400"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" />
                  Timp Mediu de Așteptare
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-white shadow-sm">
                  -
                  {overview.clinicWideAvgWaitBefore > 0
                    ? Math.round(
                        ((overview.clinicWideAvgWaitBefore - overview.clinicWideAvgWaitAfter) /
                          overview.clinicWideAvgWaitBefore) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {overview.clinicWideAvgWaitAfter} min
                </span>
                <span className="text-xs line-through text-slate-400 font-mono">
                  {overview.clinicWideAvgWaitBefore} min
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Timp de așteptare estimat per pacient după recalculare
              </p>
            </div>

            {/* Card 2: Monthly Hours Saved */}
            <div
              className={cn(
                "p-4 rounded-2xl border flex flex-col justify-between transition-all",
                darkMode
                  ? "bg-slate-800/40 border-slate-800 hover:border-blue-500/40"
                  : "bg-blue-50/40 border-blue-200/80 hover:border-blue-400"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Economie Timp Pacienți
                </span>
                <span className="text-[10px] font-black text-blue-500">Estimare</span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                  ~{overview.clinicWideSavedHoursMonthly} ore
                </span>
                <span className="text-xs text-slate-500 font-semibold ml-1">/ lună</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Timp salvat din cozile de așteptare la recepție
              </p>
            </div>

            {/* Card 3: Consultations Processed */}
            <div
              className={cn(
                "p-4 rounded-2xl border flex flex-col justify-between transition-all",
                darkMode
                  ? "bg-slate-800/40 border-slate-800"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Volum Istoric Analizat
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">
                  {overview.totalPatientsAnalyzed}
                </span>
                <span className="text-xs text-slate-500 font-semibold ml-1">programări</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Corelate cu fișele medicale și prescripțiile din sistem
              </p>
            </div>

            {/* Card 4: Most Congested Period */}
            <div
              className={cn(
                "p-4 rounded-2xl border flex flex-col justify-between transition-all",
                darkMode
                  ? "bg-slate-800/40 border-slate-800 hover:border-amber-500/40"
                  : "bg-amber-50/40 border-amber-200/80 hover:border-amber-400"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Vârf de Încărcare
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Atenție
                </span>
              </div>
              <div className="mt-3">
                <span className="text-xl font-black text-amber-700 dark:text-amber-400">
                  {overview.mostCongestedDay}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Ziua cu cele mai mari decalaje cumulative
              </p>
            </div>
          </div>

          {/* Toast feedback */}
          <AnimatePresence>
            {successToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-xl shadow-emerald-500/20"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successToast}</span>
                </div>
                <button
                  onClick={() => setSuccessToast(null)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Informational Explanation banner */}
          <div
            className={cn(
              "p-4 rounded-2xl border flex items-start gap-3.5 text-xs leading-relaxed",
              darkMode
                ? "bg-blue-950/20 border-blue-900/50 text-blue-200"
                : "bg-blue-50/60 border-blue-200/80 text-blue-900"
            )}
          >
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-sm mb-0.5">
                Cum funcționează algoritmul de minimizare a timpului de așteptare:
              </span>
              Algoritmul analizează proporția reală a tipurilor de consultații (
              <strong className="font-bold text-blue-600 dark:text-blue-300">
                Consult Complet ({DURATION_BENCHMARKS.COMPLET} min)
              </strong>
              ,{" "}
              <strong className="font-bold text-blue-600 dark:text-blue-300">
                Standard ({DURATION_BENCHMARKS.STANDARD} min)
              </strong>
              ,{" "}
              <strong className="font-bold text-blue-600 dark:text-blue-300">
                Control ({DURATION_BENCHMARKS.CONTROL} min)
              </strong>
              ). Când un interval este setat prea mic (ex: 20 min) pentru o zi cu multe consultații complete,
              fiecare pacient generează o întârziere cumulativă (decalaj în lanț). Ajustarea intervalului la
              valoarea optimă elimină cozile de așteptare din clinică fără a pierde capacitatea operațională.
            </div>
          </div>

          {/* Doctor Recommendations List */}
          <div className="space-y-6">
            {displayedDoctors.map((doc) => {
              const isDoctorApplied = appliedDoctors.has(doc.doctorId);
              return (
                <div
                  key={doc.doctorId}
                  id={`optimizer-doctor-card-${doc.doctorId}`}
                  className={cn(
                    "p-5 rounded-3xl border transition-all shadow-sm",
                    darkMode
                      ? "bg-slate-900/70 border-slate-800"
                      : "bg-white border-slate-200 hover:shadow-md"
                  )}
                >
                  {/* Doctor Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                          {doc.doctorName}
                          {isDoctorApplied && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Optimizat
                            </span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          <span>
                            {doc.totalAppointmentsAnalyzed} programări în {doc.totalDaysAnalyzed}{" "}
                            zile de activitate
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Așteptare estimată:{" "}
                            <strong className="text-rose-500 font-bold line-through">
                              {doc.currentOverallAvgWaitTime} min
                            </strong>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {doc.optimizedOverallAvgWaitTime} min
                            </strong>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                              (-{doc.overallWaitReductionPct}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      id={`apply-doctor-btn-${doc.doctorId}`}
                      onClick={() => handleApplyDoctor(doc)}
                      disabled={isApplying}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
                        isDoctorApplied
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:scale-[1.02]"
                      )}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {isDoctorApplied ? "Re-ajustează Medic" : "Ajustează Acest Medic"}
                    </button>
                  </div>

                  {/* Day by Day Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                    {doc.days.map((day) => {
                      if (!day.isAvailable && day.historicalConsultationsCount === 0) {
                        return (
                          <div
                            key={day.dayOfWeek}
                            className={cn(
                              "p-3.5 rounded-2xl border border-dashed opacity-50 flex items-center justify-between text-xs font-semibold",
                              darkMode
                                ? "bg-slate-900/30 border-slate-800 text-slate-500"
                                : "bg-slate-50/50 border-slate-200 text-slate-400"
                            )}
                          >
                            <span>{day.dayName}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Inactiv
                            </span>
                          </div>
                        );
                      }

                      const congestionColors = {
                        scăzut:
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        moderat:
                          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                        ridicat:
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                        critic:
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse",
                      };

                      return (
                        <div
                          key={day.dayOfWeek}
                          id={`optimizer-day-card-${doc.doctorId}-${day.dayOfWeek}`}
                          className={cn(
                            "p-3.5 rounded-2xl border flex flex-col justify-between transition-all",
                            day.isDifferent
                              ? darkMode
                                ? "bg-blue-950/15 border-blue-900/60 shadow-sm"
                                : "bg-blue-50/30 border-blue-200/90 shadow-sm"
                              : darkMode
                              ? "bg-slate-800/30 border-slate-800"
                              : "bg-slate-50/60 border-slate-200"
                          )}
                        >
                          <div>
                            {/* Card Top: Day & Congestion Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black text-sm uppercase tracking-tight">
                                {day.dayName}
                              </span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                  congestionColors[day.congestionLevel]
                                )}
                              >
                                {day.congestionLevel}
                              </span>
                            </div>

                            {/* Intervals comparison */}
                            <div className="flex items-center gap-2 my-2.5 p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex-1 text-center">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                  Interval Curent
                                </span>
                                <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-300">
                                  {day.currentInterval} min
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
                              <div className="flex-1 text-center">
                                <span className="block text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                  Recomandat
                                </span>
                                <span
                                  className={cn(
                                    "text-sm font-black font-mono px-2 py-0.5 rounded-lg",
                                    day.isDifferent
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  {day.recommendedInterval} min
                                </span>
                              </div>
                            </div>

                            {/* Case Mix Bar */}
                            <div className="space-y-1 mb-2.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                <span>Structură Cazuri:</span>
                                <span>{day.avgConsultationsPerDay} pacienți/zi</span>
                              </div>
                              <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
                                <div
                                  style={{ width: `${day.caseMix.completPct}%` }}
                                  className="bg-blue-500 h-full"
                                  title={`Consult Complet: ${day.caseMix.completPct}%`}
                                />
                                <div
                                  style={{ width: `${day.caseMix.standardPct}%` }}
                                  className="bg-cyan-400 h-full"
                                  title={`Standard: ${day.caseMix.standardPct}%`}
                                />
                                <div
                                  style={{ width: `${day.caseMix.controlPct}%` }}
                                  className="bg-emerald-400 h-full"
                                  title={`Control: ${day.caseMix.controlPct}%`}
                                />
                                <div
                                  style={{ width: `${day.caseMix.gratisPct}%` }}
                                  className="bg-amber-400 h-full"
                                  title={`Gratis: ${day.caseMix.gratisPct}%`}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-semibold px-0.5">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                  {day.caseMix.completPct}% Compl.
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  {day.caseMix.controlPct}% Contr.
                                </span>
                                <span>Medie: {Math.round(day.avgDurationMinutes)} min</span>
                              </div>
                            </div>

                            {/* Wait Time Impact */}
                            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug mb-3">
                              <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">
                                Impact Asupra Așteptării:
                              </span>
                              Timp așteptare estimat:{" "}
                              <span className="line-through text-rose-500 font-bold font-mono">
                                {day.currentAvgWaitTimeMinutes}m
                              </span>{" "}
                              →{" "}
                              <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">
                                {day.optimizedAvgWaitTimeMinutes}m
                              </span>{" "}
                              <span className="text-emerald-600 font-bold text-[10px]">
                                (-{day.waitTimeReductionPct}%)
                              </span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                                {day.actionReason}
                              </p>
                            </div>
                          </div>

                          {/* Quick single day apply button */}
                          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">
                              Orar: {day.recommendedStartHour}:00 - {day.recommendedEndHour}:00
                            </span>
                            <button
                              id={`apply-day-btn-${doc.doctorId}-${day.dayOfWeek}`}
                              onClick={() => handleApplySingleDay(doc, day)}
                              disabled={isApplying}
                              className={cn(
                                "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                                day.isDifferent
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                  : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                              )}
                            >
                              Aplică Ziua
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          id="optimizer-modal-footer"
          className={cn(
            "p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 text-xs shrink-0",
            darkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
          )}
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              La aplicare, programările viitoare sunt realiniate automat fără suprapuneri sau
              conflicte de orar.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="close-optimizer-footer-btn"
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-xl font-bold border transition-all cursor-pointer",
                darkMode
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                  : "bg-white border-slate-300 hover:bg-slate-100 text-slate-700"
              )}
            >
              Închide
            </button>
            <button
              id="apply-all-footer-btn"
              onClick={handleApplyAllDoctors}
              disabled={isApplying}
              className="px-5 py-2 rounded-xl font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              Ajustează Toate Intervalele
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
