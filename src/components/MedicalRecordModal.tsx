import * as React from "react";
import { Fragment, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  Cake,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Download,
  Droplet,
  DropletOff,
  Eye,
  FileText,
  Glasses,
  Pencil,
  Phone,
  Plus,
  Printer,
  Save,
  Shield,
  Stethoscope,
  Trash2,
  Triangle,
  User,
  X,
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  cn,
  calculateAge,
  calculateDetailedAge,
  calculateNearSphereDefault,
  capitalizeFirstLetter,
  getEstimatedAddByAge,
  getExpectedAxialLength,
  getSexFromCNP,
  removeUndefined,
  sanitizeAxialLengthInput,
  updateDiagnosticSuggestions,
  validateAxialLengthOnBlur,
  vertexCompensation,
  appendTreatment,
  DEFAULT_EXAMINATIONS,
  Examinations,
  EyePrescription,
  Protractor,
  Appointment,
  MedicalRecord,
  GlassesOrder,
  UserProfile,
  FrameStockItem,
  TREATMENT_SHORTCUTS,
} from "../appConstants";

const cleanString = (s: string) =>
  s
    ? s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim()
    : "";

const processTreatmentValue = (newVal: string): string => {
  const header = "Medicamentele se utilizeaza in ordinea prescrisa :";
  let processed = newVal;
  Object.entries(TREATMENT_SHORTCUTS).forEach(([key, shortcut]) => {
    const lastChar = processed.slice(-1);
    if (lastChar === " ") {
      const beforeLast = processed.slice(0, -1);
      if (
        beforeLast.endsWith(" " + key) ||
        beforeLast === key ||
        beforeLast.endsWith("\n" + key)
      ) {
        const base = beforeLast.slice(0, beforeLast.length - key.length);
        if (!base.includes(header)) {
          processed = header + "\n1. " + shortcut + " ";
        } else {
          let currentLines = base
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l !== "");
          let itemCount = 0;
          currentLines.forEach((l) => {
            if (/^\d+\./.test(l)) itemCount++;
          });
          processed =
            currentLines.join("\n") +
            `\n${itemCount + 1}. ` +
            shortcut +
            " ";
        }
      }
    }
  });
  return processed;
};

interface BufferedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (val: string) => void;
  processValue?: (val: string) => string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const BufferedInput: React.FC<BufferedInputProps> = ({
  value,
  onChange,
  processValue,
  inputRef,
  className,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isFocused = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, 350);
    return () => clearTimeout(timer);
  }, [localValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (processValue) {
      val = processValue(val);
    }
    setLocalValue(val);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = true;
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = false;
    if (localValue !== value) {
      onChangeRef.current(localValue);
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <input
      {...props}
      ref={inputRef}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
    />
  );
};

interface BufferedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string;
  onChange: (val: string) => void;
  processValue?: (val: string) => string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const BufferedTextarea: React.FC<BufferedTextareaProps> = ({
  value,
  onChange,
  processValue,
  textareaRef,
  className,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isFocused = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, 350);
    return () => clearTimeout(timer);
  }, [localValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (processValue) {
      val = processValue(val);
    }
    setLocalValue(val);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    isFocused.current = true;
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    isFocused.current = false;
    if (localValue !== value) {
      onChangeRef.current(localValue);
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
    />
  );
};

export interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentMedicalRecord: MedicalRecord | null;
  setCurrentMedicalRecord: (record: MedicalRecord | null | ((prev: MedicalRecord | null) => MedicalRecord | null)) => void;
  activeMedicalTab: any;
  setActiveMedicalTab: (tab: any) => void;
  currentPatientAppointment: any;
  examiningDoctorName: string;
  getBirthdayStatus: any;
  isEditingPatientName: boolean;
  setIsEditingPatientName: (val: boolean) => void;
  tempPatientName: string;
  setTempPatientName: (val: string) => void;
  renamePatientEverywhere: (oldName: string, newName: string, phone?: string, cnp?: string, oldRecordId?: string) => Promise<boolean>;
  syncPatientDetailsInDB: (field: any, val: any) => Promise<void>;
  syncPatientUniversal: any;
  setIsPatientSummaryModalOpen: (val: boolean) => void;
  setIsGdprModalOpen: (val: boolean) => void;
  openDocumentModal: any;
  showDocDropdown: boolean;
  setShowDocDropdown: (val: boolean | ((prev: boolean) => boolean)) => void;
  medicalRecords: MedicalRecord[];
  setAppointments: any;
  activeAppointment: Appointment | null;
  setActiveAppointment: React.Dispatch<React.SetStateAction<Appointment | null>>;
  saveMedicalRecord: (shouldClose?: boolean) => Promise<boolean>;
  handleDiscardDraft: () => void;
  lastLocalSavedAt: Date | null;
  draftRestoredNotice: string | null;
  setDraftRestoredNotice: (msg: string | null) => void;
  bookingError: string | null;
  diagnosticOptionsState: string[];
  recommendationOptionsState: string[];
  treatmentCategoriesState: Record<string, { name: string; full: string; active?: boolean; }[]>;
  treatmentProtocolsState: Record<string, string[]>;
  anteriorSegmentOptionsState: string[];
  posteriorSegmentOptionsState: string[];
  categoryOrderState: string[];
  setErrorMessage: (msg: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;
  printPrescription: () => void;
  printTreatment: () => Promise<void>;
  isDoctor: boolean;
  canManageOrders: boolean;
  handlePreOrderCheck: () => void;
  logActivity: (action: string, details: string) => Promise<void>;
  profile: UserProfile | null;
  loading: boolean;
  renderReleaseDateCard: () => React.ReactNode;
  activePrescriptionIndex: number;
  editingPrescriptionDateIndex: number | null;
  setEditingPrescriptionDateIndex: (val: number | null) => void;
  tempPrescriptionDate: string;
  setTempPrescriptionDate: (val: string) => void;
  saveAndSwitchPrescription: (idx: number | null) => void;
  startNewPrescription: () => void;
  setIsDeletePrescriptionConfirmModalOpen: (val: boolean) => void;
  setPrescriptionToDeleteIndex: (idx: number | null) => void;
  forceShowAddition: boolean;
  setForceShowAddition: (val: boolean | ((prev: boolean) => boolean)) => void;
  isNearEmptyOnFocus: boolean;
  setIsNearEmptyOnFocus: (val: boolean) => void;
  isDistEmptyOnFocus: boolean;
  setIsDistEmptyOnFocus: (val: boolean) => void;
  odSphRef: React.RefObject<HTMLInputElement | null>;
  odCylRef: React.RefObject<HTMLInputElement | null>;
  odAxisRef: React.RefObject<HTMLInputElement | null>;
  odAddRef: React.RefObject<HTMLSelectElement | null>;
  osSphRef: React.RefObject<HTMLInputElement | null>;
  osCylRef: React.RefObject<HTMLInputElement | null>;
  osAxisRef: React.RefObject<HTMLInputElement | null>;
  osAddRef: React.RefObject<HTMLSelectElement | null>;
  dpRef: React.RefObject<HTMLInputElement | null>;
  updateLensRecommendation: (field: string, val: string) => void;
  setIsPrismModalOpen: (val: boolean) => void;
  setPrismEye: (eye: "OD" | "OS") => void;
  setTempPrismValue: (val: string) => void;
  setTempPrismBase: (val: any) => void;
  setIsContactLensModalOpen: (val: boolean) => void;
  setClEye: (eye: "OD" | "OS") => void;
  setTempClData: any;
  setClOriginalData: any;
  setClModalError: any;
  setClEqSfericActive: any;
  isEditingSymptoms: boolean;
  setIsEditingSymptoms: (val: boolean) => void;
  isObjectiveExamExpanded: boolean;
  setIsObjectiveExamExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  getKFieldStyle: (val: string) => any;
  setIsMyopiaChartOpen: (val: boolean) => void;
  setMyopiaChartEye: (eye: "OD" | "OS") => void;
  getIopInputClass: any;
  isExaminationsExpanded: boolean;
  setIsExaminationsExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  isVaAlExpanded: boolean;
  setIsVaAlExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  isOrderHistoryExpanded: boolean;
  setIsOrderHistoryExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  isPrescriptionHistoryExpanded: boolean;
  setIsPrescriptionHistoryExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeOrderIndex: number;
  saveAndSwitchOrder: (idx: number | null, type?: string) => void;
  setIsMedicalRecordModalOpen?: (val: boolean) => void;
}

export const MedicalRecordModal: React.FC<MedicalRecordModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    darkMode,
    currentMedicalRecord,
    setCurrentMedicalRecord,
    activeMedicalTab,
    setActiveMedicalTab,
    currentPatientAppointment,
    examiningDoctorName,
    getBirthdayStatus,
    isEditingPatientName,
    setIsEditingPatientName,
    tempPatientName,
    setTempPatientName,
    renamePatientEverywhere,
    syncPatientDetailsInDB,
    syncPatientUniversal,
    setIsPatientSummaryModalOpen,
    setIsGdprModalOpen,
    openDocumentModal,
    showDocDropdown,
    setShowDocDropdown,
    medicalRecords,
    setAppointments,
    activeAppointment,
    setActiveAppointment,
    saveMedicalRecord,
    handleDiscardDraft,
    lastLocalSavedAt,
    draftRestoredNotice,
    setDraftRestoredNotice,
    bookingError,
    diagnosticOptionsState,
    recommendationOptionsState,
    treatmentCategoriesState,
    treatmentProtocolsState,
    anteriorSegmentOptionsState,
    posteriorSegmentOptionsState,
    categoryOrderState,
    setErrorMessage,
    setSuccessMessage,
    printPrescription,
    printTreatment,
    isDoctor,
    canManageOrders,
    handlePreOrderCheck,
    logActivity,
    profile,
    loading,
    renderReleaseDateCard,
    activePrescriptionIndex,
    editingPrescriptionDateIndex,
    setEditingPrescriptionDateIndex,
    tempPrescriptionDate,
    setTempPrescriptionDate,
    saveAndSwitchPrescription,
    startNewPrescription,
    setIsDeletePrescriptionConfirmModalOpen,
    setPrescriptionToDeleteIndex,
    forceShowAddition,
    setForceShowAddition,
    isNearEmptyOnFocus,
    setIsNearEmptyOnFocus,
    isDistEmptyOnFocus,
    setIsDistEmptyOnFocus,
    odSphRef,
    odCylRef,
    odAxisRef,
    odAddRef,
    osSphRef,
    osCylRef,
    osAxisRef,
    osAddRef,
    dpRef,
    updateLensRecommendation,
    setIsPrismModalOpen,
    setPrismEye,
    setTempPrismValue,
    setTempPrismBase,
    setIsContactLensModalOpen,
    setClEye,
    setTempClData,
    setClOriginalData,
    setClModalError,
    setClEqSfericActive,
    isEditingSymptoms,
    setIsEditingSymptoms,
    isObjectiveExamExpanded,
    setIsObjectiveExamExpanded,
    getKFieldStyle,
    setIsMyopiaChartOpen,
    setMyopiaChartEye,
    getIopInputClass,
    isExaminationsExpanded,
    setIsExaminationsExpanded,
    isVaAlExpanded,
    setIsVaAlExpanded,
    isOrderHistoryExpanded,
    setIsOrderHistoryExpanded,
    isPrescriptionHistoryExpanded,
    setIsPrescriptionHistoryExpanded,
    activeOrderIndex,
    saveAndSwitchOrder,
    setIsMedicalRecordModalOpen = onClose,
  } = props;

  const isMedicalRecordModalOpen = isOpen;

  if (!isOpen || !currentMedicalRecord) return null;

  return (
          <motion.div
            key="medical-record-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "rounded-3xl p-5 sm:p-6 w-full max-w-[96vw] xl:max-w-[98vw] 2xl:max-w-[1560px] shadow-2xl border overflow-hidden flex flex-col h-[96vh] max-h-[96vh] transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <div className="border-b border-slate-100 dark:border-slate-800/60 pb-2.5 mb-3 space-y-1.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left side: Title and Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div
                      className={cn(
                        "p-1.5 rounded-xl transition-colors",
                        darkMode
                          ? "bg-slate-800 text-blue-400"
                          : "bg-blue-50 text-blue-600",
                      )}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">
                        Fișă Pacient
                      </span>
                      {currentPatientAppointment && (() => {
                        const appDate = parseISO(currentPatientAppointment.startTime);
                        
                        const hasRecordForToday = medicalRecords.some((r) => {
                          const rName = cleanString(r.patientName || "");
                          const rPhone = cleanString(r.patientPhone || "");
                          const cName = cleanString(currentPatientAppointment.patientName || "");
                          const cPhone = cleanString(currentPatientAppointment.patientPhone || "");
                          const nameMatch = rName && cName && rName === cName;
                          const phoneMatch = rPhone && cPhone && rPhone === cPhone;
                          if (!nameMatch && !phoneMatch) return false;
                          return r.updatedAt && isSameDay(parseISO(r.updatedAt), appDate);
                        });

                        const isConsultedInCalendar =
                          ((hasRecordForToday || currentPatientAppointment.forceSeen) &&
                          !currentPatientAppointment.ignoreSeen);

                        return (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                let newIgnoreSeen = false;
                                let newForceSeen = false;

                                if (isConsultedInCalendar) {
                                  // Currently VĂZUT (Gri) -> Doctor wants to make it ACTIV (Vizibil)
                                  newIgnoreSeen = true;
                                  newForceSeen = false;
                                } else {
                                  // Currently ACTIV (Vizibil) -> Doctor wants to make it VĂZUT (Gri)
                                  newIgnoreSeen = false;
                                  newForceSeen = true;
                                }

                                await updateDoc(
                                  doc(db, "appointments", currentPatientAppointment.id),
                                  { ignoreSeen: newIgnoreSeen, forceSeen: newForceSeen },
                                );

                                const updatedApp = {
                                  ...currentPatientAppointment,
                                  ignoreSeen: newIgnoreSeen,
                                  forceSeen: newForceSeen,
                                };

                                setActiveAppointment(updatedApp);
                                setAppointments((prev) =>
                                  prev.map((app) =>
                                    app.id === currentPatientAppointment.id ? updatedApp : app
                                  )
                                );

                                await logActivity(
                                  "Modificare Status Calendar",
                                  `Pacientul ${currentPatientAppointment.patientName} a fost marcat ca ${
                                    newIgnoreSeen ? "ACTIV (Vizibil)" : "VĂZUT (Gri-transparent)"
                                  } în calendar.`
                                );
                              } catch (error) {
                                console.error("Error toggling appointment visibility:", error);
                              }
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer select-none border shadow-xs",
                              isConsultedInCalendar
                                ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 border-emerald-400 shadow-emerald-500/20"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700"
                            )}
                            title={
                              isConsultedInCalendar
                                ? "Programarea apare VĂZUTĂ (gri în calendar). Apasă pentru a o face VIZIBILĂ (activă) iar."
                                : "Programarea apare VIZIBILĂ (activă în calendar). Apasă pentru a o face VĂZUTĂ (gri)."
                            }
                          >
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              isConsultedInCalendar ? "bg-white" : "bg-emerald-500 animate-ping"
                            )} />
                            <span>
                              {isConsultedInCalendar ? "Fă vizibil iar" : "Fă invizibil (Văzut)"}
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isEditingPatientName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempPatientName}
                          onChange={(e) => setTempPatientName(e.target.value)}
                          className={cn(
                            "px-2 py-0.5 border rounded-lg text-2xl sm:text-3xl outline-none focus:ring-2 focus:ring-blue-500 font-black",
                            darkMode
                              ? "bg-slate-800 border-slate-700 text-slate-100"
                              : "bg-white border-slate-200 text-slate-900",
                          )}
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              const newName = tempPatientName.trim();
                              if (newName && newName !== currentMedicalRecord.patientName) {
                                await renamePatientEverywhere(
                                  currentMedicalRecord.patientName,
                                  newName,
                                  currentMedicalRecord.patientPhone,
                                  currentMedicalRecord.patientCnp,
                                  currentMedicalRecord.id,
                                );
                              }
                              setIsEditingPatientName(false);
                            } else if (e.key === "Escape") {
                              setIsEditingPatientName(false);
                            }
                          }}
                        />
                        <button
                          onClick={async () => {
                            const newName = tempPatientName.trim();
                            if (newName && newName !== currentMedicalRecord.patientName) {
                              await renamePatientEverywhere(
                                currentMedicalRecord.patientName,
                                newName,
                                currentMedicalRecord.patientPhone,
                                currentMedicalRecord.patientCnp,
                                currentMedicalRecord.id,
                              );
                            }
                            setIsEditingPatientName(false);
                          }}
                          className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded-full transition-colors cursor-pointer"
                          title="Confirmă noul nume peste tot"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsEditingPatientName(false)}
                          className="p-1 hover:bg-rose-500/20 text-rose-500 rounded-full transition-colors cursor-pointer"
                          title="Anulează editarea numelui"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group max-w-full">
                        <h2
                          className={cn(
                            "text-2xl sm:text-4xl font-black tracking-tight flex items-center flex-wrap gap-2 max-w-full",
                            darkMode ? "text-slate-50" : "text-slate-900",
                          )}
                        >
                          <span className="break-words whitespace-normal select-text min-w-0 max-w-full">{currentMedicalRecord.patientName}</span>
                          {(() => {
                            const bStatus = getBirthdayStatus(currentMedicalRecord.patientBirthDate);

                            if (bStatus?.isToday) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-2xl sm:text-3xl font-black shrink-0 align-middle shadow-md ml-1 border border-slate-700 dark:border-slate-300">
                                  <Cake className="w-6 h-6 text-amber-400 dark:text-amber-500 shrink-0" />
                                  <span>Aniversare azi! ({bStatus.age} ani)</span>
                                </span>
                              );
                            }

                            if (bStatus && !bStatus.isToday && bStatus.daysRemaining <= 45) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-700 text-xl sm:text-2xl font-black shrink-0 align-middle ml-1">
                                  <span>în {bStatus.daysRemaining} {bStatus.daysRemaining === 1 ? 'zi' : 'zile'} vârsta de {bStatus.age} ani</span>
                                </span>
                              );
                            }

                            return null;
                          })()}
                          {isEditingSymptoms ? (
                            <span className="inline-flex items-center gap-1.5 ml-2 align-middle normal-case font-sans tracking-normal select-none">
                              <BufferedInput
                                type="text"
                                value={currentMedicalRecord.symptoms || ""}
                                onChange={(val) => {
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    symptoms: val,
                                  });
                                }}
                                placeholder="Scrie simptome..."
                                className={cn(
                                  "px-2 py-1 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 font-medium w-48 sm:w-64",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                                autoFocus
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    setIsEditingSymptoms(false);

                                    const newVal = currentMedicalRecord.symptoms || "";
                                    const now = new Date().toISOString();
                                    const updatedRecord = {
                                      ...currentMedicalRecord,
                                      symptoms: newVal,
                                      updatedAt: now,
                                    };
                                    try {
                                      await setDoc(
                                        doc(db, "medicalRecords", currentMedicalRecord.id),
                                        removeUndefined(updatedRecord),
                                      );
                                      setCurrentMedicalRecord(updatedRecord);
                                    } catch (err) {
                                      console.error("Eroare la salvarea simptomelor:", err);
                                    }
                                    if (activeAppointment) {
                                      try {
                                        await updateDoc(
                                          doc(db, "appointments", activeAppointment.id),
                                          {
                                            patientSymptomText: newVal,
                                            patientSymptomSelect: "",
                                          }
                                        );
                                        setActiveAppointment((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                patientSymptomText: newVal,
                                                patientSymptomSelect: "",
                                              }
                                            : null,
                                        );
                                      } catch (err) {
                                        console.error("Eroare la programare:", err);
                                      }
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={async () => {
                                  setIsEditingSymptoms(false);
                                  const newVal = currentMedicalRecord.symptoms || "";
                                  const now = new Date().toISOString();
                                  const updatedRecord = {
                                    ...currentMedicalRecord,
                                    symptoms: newVal,
                                    updatedAt: now,
                                  };
                                  try {
                                    await setDoc(
                                      doc(db, "medicalRecords", currentMedicalRecord.id),
                                      removeUndefined(updatedRecord),
                                    );
                                    setCurrentMedicalRecord(updatedRecord);
                                  } catch (err) {
                                    console.error("Eroare la salvarea simptomelor:", err);
                                  }
                                  if (activeAppointment) {
                                    try {
                                      await updateDoc(
                                        doc(db, "appointments", activeAppointment.id),
                                        {
                                          patientSymptomText: newVal,
                                          patientSymptomSelect: "",
                                        }
                                      );
                                      setActiveAppointment((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              patientSymptomText: newVal,
                                              patientSymptomSelect: "",
                                            }
                                          : null,
                                      );
                                    } catch (err) {
                                      console.error("Eroare la programare:", err);
                                    }
                                  }
                                }}
                                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors shrink-0 flex items-center justify-center font-bold"
                                title="Confirmă simptome"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ) : (() => {
                            const appointmentSymptoms = [
                              (activeAppointment as any)?.patientSymptomSelect,
                              (activeAppointment as any)?.patientSymptomText
                            ].filter(Boolean).join(" - ");
                            const recordSymptoms = currentMedicalRecord.symptoms;
                            const displaySymptoms = appointmentSymptoms || recordSymptoms;

                            return (
                              <span className="inline-flex items-center gap-1 ml-2 align-middle normal-case font-sans tracking-normal select-none relative group/symptom">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-extrabold text-[11px] border shadow-sm animate-fade-in shrink-0",
                                  displaySymptoms
                                    ? "bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20"
                                    : "bg-slate-500/10 dark:bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/20"
                                )}>
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    displaySymptoms ? "bg-red-500 animate-pulse" : "bg-slate-400"
                                  )} />
                                  <span className="font-black uppercase text-[9px] tracking-wider shrink-0">Simptome:</span>
                                  <span className="max-w-[150px] sm:max-w-md truncate" title={displaySymptoms || "Fără simptome"}>
                                    {displaySymptoms || "Fără simptome"}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditingSymptoms(true);
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-75 hover:opacity-100 shrink-0 cursor-pointer ml-1"
                                  title="Editează simptome"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-red-500 dark:text-red-400 font-bold" />
                                </button>
                              </span>
                            );
                          })()}
                        </h2>
                        <button
                          onClick={() => {
                            setTempPatientName(currentMedicalRecord.patientName);
                            setIsEditingPatientName(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-65 hover:opacity-100 cursor-pointer"
                          title="Editează numele pacientului peste tot"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: The 4 metadata cards & Close button nestled into a single row to the right of the name card */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 max-w-full lg:max-w-4xl">
                  {/* Phone & Age Card */}
                  <div
                    className={cn(
                      "p-2 rounded-xl border flex flex-col justify-center gap-0.5 min-w-[124px] sm:min-w-[150px] flex-1",
                      darkMode
                        ? "bg-slate-800/40 border-slate-800"
                        : "bg-slate-50 border-slate-100 shadow-sm",
                    )}
                  >
                    <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest leading-none">
                      {isDoctor ? "Vârstă" : "Vârstă & Contact"}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 leading-tight py-0.5 flex-wrap">
                        <User className="w-4 h-4 shrink-0 text-blue-500/85" />
                        {(() => {
                          const age = currentMedicalRecord.patientBirthDate
                            ? calculateDetailedAge(
                                currentMedicalRecord.patientBirthDate,
                              )
                            : `${currentMedicalRecord.patientAge} ani`;
                          return <span>{age}</span>;
                        })()}
                      </span>
                      {!isDoctor && (
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1 leading-none mt-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          {currentMedicalRecord.patientPhone || "Fără telefon"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Birth Date Input Card */}
                  <div
                    className={cn(
                      "p-2 rounded-xl border flex flex-col justify-center gap-0.5 min-w-[120px] sm:min-w-[145px] flex-1",
                      darkMode
                        ? "bg-slate-800/40 border-slate-800"
                        : "bg-slate-50 border-slate-100 shadow-sm",
                    )}
                  >
                    <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest leading-none">
                      Data Nașterii
                    </span>
                    <div className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-amber-500/50 rounded-lg py-0.5">
                      <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="ZZ-LL-AAAA"
                        value={
                          currentMedicalRecord.patientBirthDate
                            ? currentMedicalRecord.patientBirthDate.includes(
                                "-",
                              ) &&
                              currentMedicalRecord.patientBirthDate.split(
                                "-",
                              )[0].length === 4
                              ? currentMedicalRecord.patientBirthDate
                                  .split("-")
                                  .reverse()
                                  .join("-")
                              : currentMedicalRecord.patientBirthDate
                            : ""
                        }
                        onChange={(e) => {
                          let inputVal = e.target.value;
                          const cleanDigits = inputVal.replace(/\D/g, "");
                          let formatted = "";
                          if (cleanDigits.length <= 2) {
                            formatted = cleanDigits;
                          } else if (cleanDigits.length <= 4) {
                            formatted = `${cleanDigits.slice(0, 2)}-${cleanDigits.slice(2, 4)}`;
                          } else {
                            formatted = `${cleanDigits.slice(0, 2)}-${cleanDigits.slice(2, 4)}-${cleanDigits.slice(4, 8)}`;
                          }

                          let dbDate = formatted;
                          if (formatted.length === 10) {
                            const parts = formatted.split("-");
                            dbDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                          }

                          const calculatedAge = calculateAge(dbDate);
                          setCurrentMedicalRecord({
                            ...currentMedicalRecord,
                            patientBirthDate: dbDate,
                            patientAge:
                              calculatedAge ?? currentMedicalRecord.patientAge,
                          });
                          if (dbDate.length === 10) {
                            syncPatientDetailsInDB("birthDate", dbDate);
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val && val.length === 10) {
                            const parts = val.split("-");
                            const dbDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                            const calculatedAge = calculateAge(dbDate);
                            setCurrentMedicalRecord({
                              ...currentMedicalRecord,
                              patientBirthDate: dbDate,
                              patientAge:
                                calculatedAge ??
                                currentMedicalRecord.patientAge,
                            });
                            syncPatientDetailsInDB("birthDate", dbDate);
                          }
                        }}
                        className={cn(
                          "bg-transparent text-base sm:text-lg font-black outline-none w-full text-slate-950 dark:text-white focus:text-blue-600 dark:focus:text-blue-400 transition-colors",
                        )}
                      />
                    </div>
                  </div>

                  {/* Gender (Sex) Picker Card */}
                  <div
                    className={cn(
                      "p-2 rounded-xl border flex flex-col justify-center gap-0.5 min-w-[90px] sm:min-w-[110px] flex-1",
                      darkMode
                        ? "bg-slate-800/40 border-slate-800"
                        : "bg-slate-50 border-slate-100 shadow-sm",
                    )}
                  >
                    <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest leading-none">
                      Sex / Gen
                    </span>
                    <div className="flex gap-1.5 mt-0.5">
                      {["M", "F"].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setCurrentMedicalRecord({
                              ...currentMedicalRecord,
                              patientSex: s as "M" | "F",
                            });
                            syncPatientDetailsInDB("sex", s);
                          }}
                          className={cn(
                            "flex-1 py-1 text-sm sm:text-base font-black rounded-lg border transition-all hover:scale-105 active:scale-95 cursor-pointer",
                            currentMedicalRecord.patientSex === s
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-md font-black"
                              : darkMode
                                ? "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700/80"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visit Status / Label Indicator Card */}
                  <div
                    className={cn(
                      "p-2 rounded-xl border flex flex-col justify-center gap-0.5 min-w-[120px] sm:min-w-[130px] flex-1",
                      darkMode
                        ? "bg-slate-800/40 border-slate-800"
                        : "bg-slate-50 border-slate-100 shadow-sm",
                    )}
                  >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                      Status Consult
                    </span>
                    <div className="flex items-center min-h-[20px]">
                      {(() => {
                        let typeLabel = "NESPECIFICAT";
                        let typeColorBg =
                          "bg-slate-100 dark:bg-slate-800 text-slate-500";
                        if (currentMedicalRecord.isConsultComplet) {
                          typeLabel = "CONSULT COMPLET";
                          typeColorBg =
                            "bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 shadow-sm";
                        } else if (currentMedicalRecord.isControl) {
                          typeLabel = "REVENIRE";
                          typeColorBg =
                            "bg-orange-50 dark:bg-orange-950/45 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/50 shadow-sm";
                        } else if (currentMedicalRecord.isGratis) {
                          typeLabel = "GRATIS";
                          typeColorBg =
                            "bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 shadow-sm";
                        }

                        return (
                          <div
                            className={cn(
                              "w-full px-2 py-1.5 rounded-lg text-center flex items-center justify-center transition-all",
                              typeColorBg,
                            )}
                          >
                            <span className="text-[10px] font-black tracking-wider uppercase leading-none">
                              {typeLabel}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Auto-Save Draft Status Pill */}
                  <div
                    className={cn(
                      "p-2 rounded-xl border flex flex-col justify-center gap-0.5 min-w-[120px] sm:min-w-[130px]",
                      darkMode
                        ? "bg-slate-800/40 border-slate-800"
                        : "bg-slate-50 border-slate-100 shadow-sm",
                    )}
                    title="Protecție anti-pană de curent: ciorna fișei este salvată automat în memoria locală la fiecare 2 secunde"
                  >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-Save Ciornă
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight truncate">
                      {lastLocalSavedAt
                        ? `Salvat ${lastLocalSavedAt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                        : "Anti-Pană Activ"}
                    </span>
                  </div>

                  {/* Close button at the end to keep layout clean */}
                  <button
                    onClick={() => setIsMedicalRecordModalOpen(false)}
                    className={cn(
                      "p-2 rounded-xl transition-colors border self-stretch flex items-center justify-center min-w-[36px]",
                      darkMode
                        ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-slate-200"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm",
                    )}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Doctor & Date info in a clean row moved all the way to the right */}
              {(examiningDoctorName ||
                currentMedicalRecord.prescriptionHistory?.[
                  activePrescriptionIndex
                ]) && (
                <div className="flex items-center justify-end gap-4 flex-wrap ml-auto px-0.5">
                  {examiningDoctorName && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">
                        Medic:
                      </span>
                      <span className="text-base font-extrabold italic font-signature text-rose-600 tracking-wide leading-none">
                        {examiningDoctorName}
                      </span>
                    </div>
                  )}
                  {currentMedicalRecord.prescriptionHistory?.[
                    activePrescriptionIndex
                  ] && (
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Consult:{" "}
                        {format(
                          new Date(
                            currentMedicalRecord.prescriptionHistory[
                              activePrescriptionIndex
                            ].date,
                          ),
                          "dd.MM.yyyy HH:mm",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

              {/* Draft Restored Banner (Protecție anti-pană de curent) */}
              {draftRestoredNotice && (
                <div className="mb-2 p-2.5 sm:p-3 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">🛡️</span>
                    <div>
                      <strong className="font-black uppercase tracking-wider block text-[11px] text-amber-800 dark:text-amber-300">
                        Protecție Anti-Pană Activată • Ciornă Locală Recuperată
                      </strong>
                      <span className="text-[11px] leading-relaxed opacity-95">
                        {draftRestoredNotice}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setDraftRestoredNotice(null)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      title="Păstrează datele recuperate din ciornă"
                    >
                      ✓ Păstrează ciorna
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
                      title="Revino la versiunea salvată pe server"
                    >
                      Încarcă de pe server
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setActiveMedicalTab("ochelari")}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                    activeMedicalTab === "ochelari"
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                      : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  <Eye className="w-4 h-4" />
                  Prescripție ochelari
                </button>
                <button
                  onClick={() => setActiveMedicalTab("tratament")}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                    activeMedicalTab === "tratament"
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                      : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  <Stethoscope className="w-4 h-4" />
                  Tratament
                </button>
              </div>

              {/* Fixed Prescription Controls */}
              <div
                className={cn(
                  "mb-1.5 p-2.5 rounded-2xl border transition-all flex flex-col gap-2",
                  darkMode
                    ? "bg-slate-800/30 border-slate-800"
                    : "bg-slate-50 border-slate-200",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {currentMedicalRecord.prescriptionHistory &&
                      currentMedicalRecord.prescriptionHistory.length > 0 && (
                        <button
                          onClick={() =>
                            setIsPrescriptionHistoryExpanded(
                              !isPrescriptionHistoryExpanded,
                            )
                          }
                          className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase hover:text-blue-600 transition-colors whitespace-nowrap"
                        >
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform duration-300",
                              isPrescriptionHistoryExpanded && "rotate-180",
                            )}
                          />
                          <CalendarClock className="w-3.5 h-3.5" />
                          Istoric Prescripții
                        </button>
                      )}

                    <button
                      onClick={startNewPrescription}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3" />
                      Prescripție Nouă
                    </button>

                    {profile?.role !== "tv" && profile?.uid !== "tv" && (
                      <button
                        type="button"
                        onClick={() => setIsPatientSummaryModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap"
                      >
                        <FileText className="w-3 h-3" />
                        Sumar
                      </button>
                    )}
                  </div>

                  {/* Mentions spanning horizontally on the right */}
                  <div className="flex items-center justify-end gap-3 flex-1 max-w-[500px]">
                    <div className="flex items-center gap-4 mr-2">
                      <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={
                            currentMedicalRecord.isConsultComplet || false
                          }
                          onChange={(e) =>
                            setCurrentMedicalRecord({
                              ...currentMedicalRecord,
                              isConsultComplet: e.target.checked,
                            })
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-blue-500 text-blue-600 transition-all cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-tight whitespace-nowrap group-hover:text-blue-400 pb-0.5">
                          Consult complet
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={currentMedicalRecord.isControl || false}
                          onChange={(e) =>
                            setCurrentMedicalRecord({
                              ...currentMedicalRecord,
                              isControl: e.target.checked,
                              isGratis: e.target.checked
                                ? false
                                : currentMedicalRecord.isGratis,
                            })
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-blue-500 text-blue-600 transition-all cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-tight whitespace-nowrap group-hover:text-orange-400 pb-0.5">
                          Revenire
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={currentMedicalRecord.isGratis || false}
                          onChange={(e) =>
                            setCurrentMedicalRecord({
                              ...currentMedicalRecord,
                              isGratis: e.target.checked,
                              isControl: e.target.checked
                                ? false
                                : currentMedicalRecord.isControl,
                            })
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-green-500 text-green-600 transition-all cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest leading-tight whitespace-nowrap group-hover:text-green-400 pb-0.5">
                          Gratis
                        </span>
                      </label>
                    </div>
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-tight whitespace-nowrap">
                      Mențiuni{" "}
                      <span className="text-[7px] lowercase opacity-70">
                        (intern)
                      </span>
                    </label>
                    <BufferedInput
                      type="text"
                      value={currentMedicalRecord.specialMentions || ""}
                      onChange={(val) =>
                        setCurrentMedicalRecord({
                          ...currentMedicalRecord,
                          specialMentions: val,
                        })
                      }
                      className={cn(
                        "flex-1 p-2 border-2 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all min-w-[200px]",
                        darkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-amber-500/20 text-slate-900",
                      )}
                      placeholder="..."
                    />
                  </div>
                </div>

                {isPrescriptionHistoryExpanded &&
                  currentMedicalRecord.prescriptionHistory &&
                  currentMedicalRecord.prescriptionHistory.length > 0 && (
                    <div
                      className="grid grid-flow-col auto-cols-max gap-2 p-2 rounded-xl border transition-all overflow-x-auto custom-scrollbar no-scrollbar"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {[...currentMedicalRecord.prescriptionHistory]
                        .reverse()
                        .map((item, revIndex) => {
                          const index =
                            currentMedicalRecord.prescriptionHistory!.length -
                            1 -
                            revIndex;
                          return (
                            <div
                              key={`presc-${index}`}
                              className="flex items-center group"
                            >
                              {editingPrescriptionDateIndex === index ? (
                                <input
                                  type="datetime-local"
                                  value={tempPrescriptionDate}
                                  onChange={(e) =>
                                    setTempPrescriptionDate(e.target.value)
                                  }
                                  onBlur={() => {
                                    if (
                                      tempPrescriptionDate &&
                                      currentMedicalRecord.prescriptionHistory
                                    ) {
                                      const newHistory = [
                                        ...currentMedicalRecord.prescriptionHistory,
                                      ];
                                      newHistory[index] = {
                                        ...newHistory[index],
                                        date: new Date(
                                          tempPrescriptionDate,
                                        ).toISOString(),
                                      };
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        prescriptionHistory: newHistory,
                                      });
                                    }
                                    setEditingPrescriptionDateIndex(null);
                                  }}
                                  autoFocus
                                  className={cn(
                                    "px-3 py-2 text-base sm:text-lg font-bold font-mono rounded-l-xl border outline-none focus:ring-2 focus:ring-blue-500 shadow-md min-h-[44px]",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-white"
                                      : "bg-white border-blue-300 text-slate-900",
                                  )}
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    saveAndSwitchPrescription(index)
                                  }
                                  onDoubleClick={() => {
                                    setEditingPrescriptionDateIndex(index);
                                    setTempPrescriptionDate(
                                      format(
                                        new Date(item.date),
                                        "yyyy-MM-dd'T'HH:mm",
                                      ),
                                    );
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 text-[10px] font-medium font-mono rounded-l-xl border transition-all flex items-center gap-2 shrink-0 h-auto min-h-[38px]",
                                    activePrescriptionIndex === index
                                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/30 ring-2 ring-blue-500/20"
                                      : darkMode
                                        ? "bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700 hover:translate-y-[-1px]"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:translate-y-[-1px] shadow-sm",
                                  )}
                                >
                                  {((item.nonCycloplegic?.od &&
                                    (item.nonCycloplegic.od.sph !== "" ||
                                      item.nonCycloplegic.od.cyl !== "" ||
                                      (item.nonCycloplegic.od.axis !== "" &&
                                        item.nonCycloplegic.od.axis !==
                                          "0"))) ||
                                    (item.nonCycloplegic?.os &&
                                      (item.nonCycloplegic.os.sph !== "" ||
                                        item.nonCycloplegic.os.cyl !== "" ||
                                        (item.nonCycloplegic.os.axis !== "" &&
                                          item.nonCycloplegic.os.axis !==
                                            "0")))) && (
                                    <DropletOff
                                      className={cn(
                                        "w-3 h-3",
                                        activePrescriptionIndex === index
                                          ? "text-rose-100 fill-rose-100"
                                          : "text-rose-500 fill-rose-500",
                                      )}
                                    />
                                  )}
                                  {((item.cycloplegia?.od &&
                                    (item.cycloplegia.od.sph !== "" ||
                                      item.cycloplegia.od.cyl !== "" ||
                                      (item.cycloplegia.od.axis !== "" &&
                                        item.cycloplegia.od.axis !== "0"))) ||
                                    (item.cycloplegia?.os &&
                                      (item.cycloplegia.os.sph !== "" ||
                                        item.cycloplegia.os.cyl !== "" ||
                                        (item.cycloplegia.os.axis !== "" &&
                                          item.cycloplegia.os.axis !==
                                            "0")))) && (
                                    <Droplet
                                      className={cn(
                                        "w-3 h-3 animate-pulse",
                                        activePrescriptionIndex === index
                                          ? "text-emerald-100 fill-emerald-100"
                                          : "text-emerald-500 fill-emerald-500",
                                      )}
                                    />
                                  )}
                                  <div className="flex flex-col items-start leading-none">
                                    <span className="text-[13px] font-black flex items-center gap-1.5">
                                      {format(new Date(item.date), "dd.MM.yy")}
                                      {item.isConsultComplet && (
                                        <span
                                          className={cn(
                                            "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black",
                                            activePrescriptionIndex === index
                                              ? "bg-white text-blue-600"
                                              : "bg-blue-600 text-white",
                                          )}
                                        >
                                          C
                                        </span>
                                      )}
                                      {item.isControl && (
                                        <span
                                          className={cn(
                                            "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black border",
                                            activePrescriptionIndex === index
                                              ? "bg-white text-orange-600 border-orange-400"
                                              : "bg-orange-500 text-white border-orange-600",
                                          )}
                                        >
                                          R
                                        </span>
                                      )}
                                      {item.isGratis && (
                                        <span
                                          className={cn(
                                            "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black",
                                            activePrescriptionIndex === index
                                              ? "bg-white text-green-600"
                                              : "bg-green-600 text-white",
                                          )}
                                        >
                                          G
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[9px] opacity-75 font-bold uppercase tracking-wider mt-0.5">
                                      {format(new Date(item.date), "HH:mm")}
                                    </span>
                                    {currentMedicalRecord.patientBirthDate && (
                                      <span
                                        className={cn(
                                          "text-[9px] font-black mt-0.5",
                                          activePrescriptionIndex === index
                                            ? "text-blue-100"
                                            : "text-blue-600",
                                        )}
                                      >
                                        {calculateDetailedAge(
                                          currentMedicalRecord.patientBirthDate,
                                          new Date(item.date),
                                        )}
                                      </span>
                                    )}
                                    {(() => {
                                      const allOrders = [
                                        ...(currentMedicalRecord.orderHistory ||
                                          []),
                                        ...(currentMedicalRecord.glassesOrder
                                          ? [currentMedicalRecord.glassesOrder]
                                          : []),
                                      ];
                                      const wasUsed = allOrders.some(
                                        (o) => o.prescriptionDate === item.date,
                                      );
                                      if (wasUsed) {
                                        return (
                                          <span className="text-[7px] font-black text-emerald-500 uppercase mt-0.5 leading-tight">
                                            ochelari efectuati
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </button>
                              )}
                              <button
                                title="Șterge Prescripție"
                                onClick={() => {
                                  setPrescriptionToDeleteIndex(index);
                                  setIsDeletePrescriptionConfirmModalOpen(true);
                                }}
                                className={cn(
                                  "px-2 py-1.5 rounded-r-xl border border-l-0 transition-all shrink-0 self-stretch h-auto min-h-[38px] flex items-center justify-center w-8",
                                  darkMode
                                    ? "bg-slate-950 border-slate-700 text-rose-500 hover:bg-rose-900/30"
                                    : "bg-white border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 shadow-sm",
                                )}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {activeMedicalTab === "ochelari" ? (
                  <div className="space-y-2">
                    <div className="flex flex-col items-center gap-2">
                      {/* Moved Prescription button to DP section */}
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Age-Based Physiological ADD Estimation Suggestion */}
                      {(() => {
                        const patientCalculatedAge = currentMedicalRecord.patientBirthDate
                          ? calculateAge(currentMedicalRecord.patientBirthDate)
                          : (currentMedicalRecord.patientAge ? parseInt(String(currentMedicalRecord.patientAge), 10) : undefined);
                        const estimatedAdd = getEstimatedAddByAge(patientCalculatedAge);
                        const cleanEstimatedAdd = estimatedAdd ? estimatedAdd.replace("+", "") : null;
                        const hasDistanceDiopters = Boolean(currentMedicalRecord.od?.sph || currentMedicalRecord.os?.sph);
                        const isApplied = currentMedicalRecord.od?.add === cleanEstimatedAdd && currentMedicalRecord.os?.add === cleanEstimatedAdd;

                        if (!cleanEstimatedAdd || !hasDistanceDiopters) return null;

                        return (
                          <div
                            className={cn(
                              "p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all shadow-xs",
                              isApplied
                                ? darkMode
                                  ? "bg-emerald-950/25 border-emerald-800/40 text-emerald-200"
                                  : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                : darkMode
                                  ? "bg-blue-950/30 border-blue-800/60 text-blue-200"
                                  : "bg-blue-50/90 border-blue-200 text-blue-950"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">💡</span>
                              <div>
                                <span className="font-black text-[11px] uppercase tracking-wider block">
                                  Sugestie Fiziologică Adaos de Aproape (ADD)
                                </span>
                                <span className="text-[11px] leading-relaxed opacity-90">
                                  La vârsta de <strong>{patientCalculatedAge} ani</strong>, adaosul fiziologic recomandat este <strong>+{cleanEstimatedAdd} dpt</strong>.
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedOD = {
                                  ...currentMedicalRecord.od,
                                  add: cleanEstimatedAdd,
                                  near_sph: undefined,
                                  near_cyl: undefined,
                                  near_axis: undefined,
                                };
                                const updatedOS = {
                                  ...currentMedicalRecord.os,
                                  add: cleanEstimatedAdd,
                                  near_sph: undefined,
                                  near_cyl: undefined,
                                  near_axis: undefined,
                                };
                                setCurrentMedicalRecord({
                                  ...currentMedicalRecord,
                                  od: updatedOD,
                                  os: updatedOS,
                                  diagnostic: updateDiagnosticSuggestions(
                                    currentMedicalRecord.diagnostic || "",
                                    updatedOD,
                                    updatedOS,
                                  ),
                                });
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 self-end sm:self-auto",
                                isApplied
                                  ? "bg-emerald-600 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                              )}
                              title={`Aplică adaosul recomandat de +${cleanEstimatedAdd} la ambii ochi`}
                            >
                              {isApplied ? (
                                <>
                                  <span>✓</span>
                                  <span>ADD +{cleanEstimatedAdd} Aplicat</span>
                                </>
                              ) : (
                                <>
                                  <span>⚡</span>
                                  <span>Aplică ADD +{cleanEstimatedAdd} (OD + OS)</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-start">
                        {/* Right Eye (OD) */}
                        <div
                          className={cn(
                            "p-3 rounded-2xl border transition-all flex flex-col items-center",
                            darkMode
                              ? "bg-slate-800/50 border-slate-700/50"
                              : "bg-[#eff6ff] border-cyan-200/80 shadow-sm",
                          )}
                          style={darkMode ? undefined : { backgroundColor: "#eff6ff" }}
                        >
                          <div className="flex flex-col gap-2 mb-3 w-full">
                            <h4
                              className={cn(
                                "text-xl font-black uppercase flex items-center gap-2 w-full flex-nowrap",
                                darkMode ? "text-slate-300" : "text-slate-500",
                              )}
                            >
                              <div className="w-1.5 h-6 bg-blue-500 rounded-full shrink-0" />
                              <span className="whitespace-nowrap">
                                Ochi Drept
                              </span>
                              {(() => {
                                const age =
                                  currentMedicalRecord.patientBirthDate
                                    ? calculateAge(
                                        currentMedicalRecord.patientBirthDate,
                                      )
                                    : currentMedicalRecord.patientAge;
                                const isManagementEligible = (age || 0) <= 25;
                                return (
                                  isManagementEligible && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMyopiaChartEye("OD");
                                        setIsMyopiaChartOpen(true);
                                      }}
                                      className="ml-auto flex items-center justify-center px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition-all shrink-0"
                                      title="Management Miopie - Grafic Lungime Axială"
                                    >
                                      <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-center">
                                        Miopia
                                        <br />
                                        Management
                                      </span>
                                    </button>
                                  )
                                );
                              })()}
                            </h4>

                            <div className="flex items-center gap-2">
                              {currentMedicalRecord && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrismEye("OD");
                                      setTempPrismValue(
                                        currentMedicalRecord.od.prism || "",
                                      );
                                      setTempPrismBase(
                                        (currentMedicalRecord.od.base || "") as any,
                                      );
                                      setIsPrismModalOpen(true);
                                    }}
                                    className={cn(
                                      "ml-3.5 flex items-center justify-start gap-1 px-2 py-1 rounded-lg transition-all border shrink-0 w-fit",
                                      currentMedicalRecord.od.prism
                                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/20"
                                        : darkMode
                                          ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm",
                                    )}
                                  >
                                    <Triangle
                                      className={cn(
                                        "w-3 h-3 transition-transform duration-300",
                                        currentMedicalRecord.od.prism
                                          ? "fill-white/20"
                                          : "fill-blue-500/20",
                                        currentMedicalRecord.od.base ===
                                          "SUS" && "rotate-180",
                                        currentMedicalRecord.od.base ===
                                          "JOS" && "rotate-0",
                                        currentMedicalRecord.od.base ===
                                          "NAZAL" && "-rotate-90",
                                        currentMedicalRecord.od.base ===
                                          "TEMPORAL" && "rotate-90",
                                      )}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-wider">
                                      {currentMedicalRecord.od.prism
                                        ? `${currentMedicalRecord.od.prism} ${currentMedicalRecord.od.base === "NAZAL" ? "BN" : currentMedicalRecord.od.base === "TEMPORAL" ? "BT" : currentMedicalRecord.od.base === "SUS" ? "BS" : "BJ"}`
                                        : "Prismă"}
                                    </span>
                                  </button>
                                  {currentMedicalRecord.od.prism && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: {
                                            ...currentMedicalRecord.od,
                                            prism: "",
                                            base: "",
                                          },
                                        });
                                      }}
                                      className={cn(
                                        "absolute -top-1 -right-1 p-0.5 rounded-full border shadow-sm z-10 transition-colors",
                                        darkMode
                                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-rose-600 hover:text-white"
                                          : "bg-white border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white",
                                      )}
                                    >
                                      <X size={8} />
                                    </button>
                                  )}
                                </div>
                              )}

                              {currentMedicalRecord && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setClEye("OD");
                                      setClModalError(null);
                                      setClEqSfericActive(false);
                                      setClOriginalData(null);
                                      setTempClData(
                                        currentMedicalRecord.cl_od || {
                                          sph: currentMedicalRecord.od?.sph
                                            ? vertexCompensation(
                                                currentMedicalRecord.od.sph,
                                              )
                                            : "",
                                          cyl: currentMedicalRecord.od?.cyl || "",
                                          axis: currentMedicalRecord.od?.axis || "",
                                          base: "8.6",
                                          radius: "14.2",
                                          brand: "",
                                          wearingType: "Lunară",
                                        },
                                      );
                                      setIsContactLensModalOpen(true);
                                    }}
                                    className={cn(
                                      "flex items-center justify-start gap-1 px-2 py-1 rounded-lg transition-all border shrink-0 w-fit cursor-pointer active:scale-95",
                                      currentMedicalRecord.cl_od?.sph ||
                                        currentMedicalRecord.cl_od?.base
                                        ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-900/20"
                                        : darkMode
                                          ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm",
                                    )}
                                  >
                                    <CircleDot
                                      className={cn(
                                        "w-3 h-3",
                                        currentMedicalRecord.cl_od?.sph ||
                                          currentMedicalRecord.cl_od?.base
                                          ? "text-white fill-white/20"
                                          : "text-rose-500 fill-rose-500/20",
                                      )}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-wider">
                                      Lentilă Contact
                                    </span>
                                  </button>
                                  {(currentMedicalRecord.cl_od?.sph ||
                                    currentMedicalRecord.cl_od?.base) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          cl_od: undefined,
                                        });
                                      }}
                                      className={cn(
                                        "absolute -top-1 -right-1 p-0.5 rounded-full border shadow-sm z-10 transition-colors",
                                        darkMode
                                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-rose-600 hover:text-white"
                                          : "bg-white border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white",
                                      )}
                                    >
                                      <X size={8} />
                                    </button>
                                  )}
                                </div>
                              )}

                              {(() => {
                                const age =
                                  currentMedicalRecord.patientBirthDate
                                    ? calculateAge(
                                        currentMedicalRecord.patientBirthDate,
                                      )
                                    : currentMedicalRecord.patientAge;
                                const showAddBtn = (age || 0) < 35;
                                if (!showAddBtn) return null;
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForceShowAddition(!forceShowAddition)
                                    }
                                    className={cn(
                                      "flex items-center justify-start gap-1 px-2 py-1 rounded-lg transition-all border shrink-0 w-fit",
                                      forceShowAddition
                                        ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/20"
                                        : darkMode
                                          ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm",
                                    )}
                                    title={
                                      forceShowAddition
                                        ? "Ascunde câmpul de adiție"
                                        : "Adaugă câmpul de adiție pe rețetă"
                                    }
                                  >
                                    <Plus
                                      className={cn(
                                        "w-3 h-3 text-emerald-500 transition-transform",
                                        forceShowAddition &&
                                          "rotate-45 text-white",
                                      )}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-wider">
                                      {forceShowAddition
                                        ? "Adiție Activă"
                                        : "Adiție"}
                                    </span>
                                  </button>
                                );
                              })()}
                            </div>
                          </div>

                          {currentMedicalRecord && (
                            <div className="relative flex flex-col items-center w-full">
                              <Protractor
                                axis={currentMedicalRecord.od.axis}
                                color="blue"
                              />
                            </div>
                          )}

                          <div
                            className={cn(
                              "grid gap-1 w-full",
                              (() => {
                                const age =
                                  currentMedicalRecord.patientBirthDate
                                    ? calculateAge(
                                        currentMedicalRecord.patientBirthDate,
                                      )
                                    : currentMedicalRecord.patientAge;
                                return (age || 0) >= 35 || forceShowAddition
                                  ? "grid-cols-[1fr_1.2fr_0.8fr_1.2fr]"
                                  : "grid-cols-[0.8fr_1.2fr_0.8fr]";
                              })(),
                            )}
                          >
                            {["sph", "cyl", "axis", "add"]
                              .filter((field) => {
                                if (field === "add") {
                                  const age =
                                    currentMedicalRecord.patientBirthDate
                                      ? calculateAge(
                                          currentMedicalRecord.patientBirthDate,
                                        )
                                      : currentMedicalRecord.patientAge;
                                  return (age || 0) >= 35 || forceShowAddition;
                                }
                                return true;
                              })
                              .map((field) => (
                                <div key={`od-${field}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <label
                                      className={cn(
                                        "block text-[20px] font-black uppercase tracking-tighter",
                                        darkMode ? "text-white" : "text-black",
                                      )}
                                    >
                                      {field}
                                    </label>
                                    {field === "add" && (() => {
                                      const pAge = currentMedicalRecord.patientBirthDate
                                        ? calculateAge(currentMedicalRecord.patientBirthDate)
                                        : (currentMedicalRecord.patientAge ? parseInt(String(currentMedicalRecord.patientAge), 10) : undefined);
                                      const est = getEstimatedAddByAge(pAge);
                                      const cleanEst = est ? est.replace("+", "") : null;
                                      if (!cleanEst) return null;
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedOD = {
                                              ...currentMedicalRecord.od,
                                              add: cleanEst,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            const updatedOS = {
                                              ...currentMedicalRecord.os,
                                              add: cleanEst,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              od: updatedOD,
                                              os: updatedOS,
                                              diagnostic: updateDiagnosticSuggestions(
                                                currentMedicalRecord.diagnostic || "",
                                                updatedOD,
                                                updatedOS,
                                              ),
                                            });
                                          }}
                                          className={cn(
                                            "text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded transition-all cursor-pointer",
                                            currentMedicalRecord.od?.add === cleanEst
                                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                              : "bg-blue-500/10 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400"
                                          )}
                                          title={`Vârstă ${pAge} ani: sugestie fiziologică estimată +${cleanEst}. Click pentru aplicare rapidă.`}
                                        >
                                          💡 +{cleanEst} ({pAge} ani)
                                        </button>
                                      );
                                    })()}
                                  </div>
                                  {field === "add" ? (
                                    <select
                                      ref={odAddRef}
                                      onKeyDown={(e) => {
                                        if (e.key === "Tab" && !e.shiftKey) {
                                          e.preventDefault();
                                          dpRef.current?.focus();
                                        }
                                      }}
                                      value={currentMedicalRecord.od.add}
                                      onChange={(e) => {
                                        const newVal = e.target.value;
                                        const updatedOD = {
                                          ...currentMedicalRecord.od,
                                          add: newVal,
                                          near_sph: undefined,
                                          near_cyl: undefined,
                                          near_axis: undefined,
                                        };
                                        const updatedOS = {
                                          ...currentMedicalRecord.os,
                                          add:
                                            currentMedicalRecord.os.add ||
                                            newVal,
                                          near_sph: undefined,
                                          near_cyl: undefined,
                                          near_axis: undefined,
                                        };
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: updatedOD,
                                          os: updatedOS,
                                          diagnostic:
                                            updateDiagnosticSuggestions(
                                              currentMedicalRecord.diagnostic ||
                                                "",
                                              updatedOD,
                                              updatedOS,
                                            ),
                                        });
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-base font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none",
                                        darkMode
                                          ? "bg-white border-slate-700 text-black"
                                          : "bg-white border-slate-300 text-slate-900",
                                      )}
                                    >
                                      <option value="">-</option>
                                      {[
                                        "4.00",
                                        "3.75",
                                        "3.50",
                                        "3.25",
                                        "3.00",
                                        "2.75",
                                        "2.50",
                                        "2.25",
                                        "2.00",
                                        "1.75",
                                        "1.50",
                                        "1.25",
                                        "1.00",
                                        "0.75",
                                        "0.50",
                                        "0.25",
                                        "0.00",
                                      ].map((val) => {
                                        const pAge = currentMedicalRecord.patientBirthDate
                                          ? calculateAge(currentMedicalRecord.patientBirthDate)
                                          : (currentMedicalRecord.patientAge ? parseInt(String(currentMedicalRecord.patientAge), 10) : undefined);
                                        const est = getEstimatedAddByAge(pAge);
                                        const cleanEst = est ? est.replace("+", "") : null;
                                        const isSug = cleanEst === val;
                                        return (
                                          <option key={`od-add-${val}`} value={val}>
                                            {val} {isSug ? `(💡 Sugerat - ${pAge} ani)` : ""}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  ) : (
                                    <input
                                      ref={
                                        field === "sph"
                                          ? odSphRef
                                          : field === "cyl"
                                            ? odCylRef
                                            : odAxisRef
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Tab" && !e.shiftKey) {
                                          if (field === "sph") {
                                            e.preventDefault();
                                            odCylRef.current?.focus();
                                          } else if (field === "cyl") {
                                            e.preventDefault();
                                            odAxisRef.current?.focus();
                                          } else if (field === "axis") {
                                            const age =
                                              currentMedicalRecord.patientBirthDate
                                                ? calculateAge(
                                                    currentMedicalRecord.patientBirthDate,
                                                  )
                                                : currentMedicalRecord.patientAge;
                                            if ((age || 0) >= 35) {
                                              e.preventDefault();
                                              odAddRef.current?.focus();
                                            } else {
                                              e.preventDefault();
                                              dpRef.current?.focus();
                                            }
                                          }
                                        }
                                      }}
                                      type="text"
                                      value={(() => {
                                        if (field === "axis") {
                                          const cylVal =
                                            currentMedicalRecord.od.cyl;
                                          const isZeroOrEmpty =
                                            !cylVal ||
                                            parseFloat(
                                              String(cylVal).replace(",", "."),
                                            ) === 0;
                                          if (isZeroOrEmpty) return "";
                                        }
                                        return (
                                          currentMedicalRecord.od[
                                            field as keyof EyePrescription
                                          ] || ""
                                        );
                                      })()}
                                      disabled={
                                        field === "axis" &&
                                        (() => {
                                          const cylVal =
                                            currentMedicalRecord.od.cyl;
                                          return (
                                            !cylVal ||
                                            parseFloat(
                                              String(cylVal).replace(",", "."),
                                            ) === 0
                                          );
                                        })()
                                      }
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (field === "axis") {
                                          val = val.replace(/\D/g, "");
                                          if (val !== "" && parseInt(val) > 180)
                                            val = "180";
                                        } else if (
                                          field === "sph" ||
                                          field === "cyl"
                                        ) {
                                          val = val.replace(/[^0-9.,+-]/g, "").replace(",", ".");
                                        }
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: (() => {
                                            const updatedOD = {
                                              ...currentMedicalRecord.od,
                                              [field]: val,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            if (field === "cyl") {
                                              const parsed =
                                                parseFloat(
                                                  String(val).replace(",", "."),
                                                ) || 0;
                                              if (val === "" || parsed === 0) {
                                                updatedOD.axis = "";
                                              }
                                            }
                                            return updatedOD;
                                          })(),
                                        });
                                      }}
                                      onBlur={(e) => {
                                        if (
                                          (field === "sph" ||
                                            field === "cyl") &&
                                          e.target.value
                                        ) {
                                          let val = e.target.value.trim();
                                          let num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            num = Math.round(num * 4) / 4;
                                            if (field === "sph") {
                                              num = Math.max(
                                                -25,
                                                Math.min(22, num),
                                              );
                                            } else {
                                              num = Math.max(
                                                -7,
                                                Math.min(7, num),
                                              );
                                            }
                                            const sign = num >= 0 ? "+" : "";
                                            const formatted = `${sign}${num.toFixed(2)}`;
                                            const parsedNum =
                                              parseFloat(formatted) || 0;
                                            const updatedOD = {
                                              ...currentMedicalRecord.od,
                                              [field]: formatted,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              od: (() => {
                                                if (
                                                  field === "cyl" &&
                                                  parsedNum === 0
                                                ) {
                                                  updatedOD.axis = "";
                                                }
                                                return updatedOD;
                                              })(),
                                              diagnostic:
                                                updateDiagnosticSuggestions(
                                                  currentMedicalRecord.diagnostic ||
                                                    "",
                                                  updatedOD,
                                                  currentMedicalRecord.os,
                                                ),
                                            });
                                          }
                                        } else if (field === "axis") {
                                          setCurrentMedicalRecord({
                                            ...currentMedicalRecord,
                                            diagnostic:
                                              updateDiagnosticSuggestions(
                                                currentMedicalRecord.diagnostic ||
                                                  "",
                                                currentMedicalRecord.od,
                                                currentMedicalRecord.os,
                                              ),
                                          });
                                        }
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-base font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                        darkMode
                                          ? "bg-white border-slate-700 text-black"
                                          : "bg-white border-slate-300 text-slate-900",
                                      )}
                                    />
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* Customizable Near Vision Diopters Section (OD) */}
                          {currentMedicalRecord.od.add && (
                            <div
                              className={cn(
                                "mt-4 w-full p-3 rounded-xl border transition-all",
                                darkMode
                                  ? "bg-slate-900 border-slate-800"
                                  : "bg-blue-50/40 border-blue-100 shadow-sm",
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={cn(
                                    "block text-[11px] font-bold uppercase tracking-wider",
                                    darkMode
                                      ? "text-blue-400"
                                      : "text-blue-700",
                                  )}
                                >
                                  Aproape OD
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label
                                    className={cn(
                                      "block text-[10px] font-black uppercase mb-1",
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-600",
                                    )}
                                  >
                                    Near SPH
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={calculateNearSphereDefault(
                                      currentMedicalRecord.od.sph,
                                      currentMedicalRecord.od.add,
                                    )}
                                    value={
                                      currentMedicalRecord.od.near_sph !==
                                      undefined
                                        ? currentMedicalRecord.od.near_sph
                                        : calculateNearSphereDefault(
                                              currentMedicalRecord.od.sph,
                                              currentMedicalRecord.od.add,
                                            ) === "-"
                                          ? ""
                                          : calculateNearSphereDefault(
                                              currentMedicalRecord.od.sph,
                                              currentMedicalRecord.od.add,
                                            )
                                    }
                                    onChange={(e) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.,+-]/g,
                                        "",
                                      ).replace(",", ".");
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        od: {
                                          ...currentMedicalRecord.od,
                                          near_sph: val,
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (!val) {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: {
                                            ...currentMedicalRecord.od,
                                            near_sph: "",
                                          },
                                        });
                                        return;
                                      }
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        num = Math.max(-25, Math.min(22, num));
                                        const sign = num >= 0 ? "+" : "";
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: {
                                            ...currentMedicalRecord.od,
                                            near_sph: `${sign}${num.toFixed(2)}`,
                                          },
                                        });
                                      }
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-center",
                                      darkMode
                                        ? "bg-white border-slate-700 text-black animate-none"
                                        : "bg-white border-slate-300 text-slate-900 animate-none",
                                    )}
                                  />
                                </div>
                                <div>
                                  <label
                                    className={cn(
                                      "block text-[10px] font-black uppercase mb-1",
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-600",
                                    )}
                                  >
                                    Near CYL
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={(() => {
                                      const addNum =
                                        parseFloat(
                                          String(
                                            currentMedicalRecord.od.add || "0",
                                          ).replace(",", "."),
                                        ) || 0;
                                      if (
                                        !currentMedicalRecord.od.add ||
                                        addNum === 0
                                      )
                                        return "-";
                                      return currentMedicalRecord.od.cyl || "-";
                                    })()}
                                    value={
                                      currentMedicalRecord.od.near_cyl !==
                                      undefined
                                        ? currentMedicalRecord.od.near_cyl
                                        : (() => {
                                            const addNum =
                                              parseFloat(
                                                String(
                                                  currentMedicalRecord.od.add ||
                                                    "0",
                                                ).replace(",", "."),
                                              ) || 0;
                                            if (
                                              !currentMedicalRecord.od.add ||
                                              addNum === 0
                                            )
                                              return "";
                                            return (
                                              currentMedicalRecord.od.cyl || ""
                                            );
                                          })()
                                    }
                                    onChange={(e) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.,+-]/g,
                                        "",
                                      ).replace(",", ".");
                                      const parsed =
                                        parseFloat(
                                          String(val).replace(",", "."),
                                        ) || 0;
                                      const isZeroOrEmpty =
                                        !val || parsed === 0;
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        od: {
                                          ...currentMedicalRecord.od,
                                          near_cyl: val,
                                          near_axis: isZeroOrEmpty
                                            ? ""
                                            : currentMedicalRecord.od
                                                  .near_axis !== undefined
                                              ? currentMedicalRecord.od
                                                  .near_axis
                                              : currentMedicalRecord.od.axis ||
                                                "",
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (!val) {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: {
                                            ...currentMedicalRecord.od,
                                            near_cyl: "",
                                            near_axis: "",
                                          },
                                        });
                                        return;
                                      }
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        num = Math.max(-7, Math.min(7, num));
                                        const sign = num >= 0 ? "+" : "";
                                        const formatted = `${sign}${num.toFixed(2)}`;
                                        const parsedNum =
                                          parseFloat(formatted) || 0;
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: {
                                            ...currentMedicalRecord.od,
                                            near_cyl: formatted,
                                            near_axis:
                                              parsedNum === 0
                                                ? ""
                                                : currentMedicalRecord.od
                                                      .near_axis !== undefined
                                                  ? currentMedicalRecord.od
                                                      .near_axis
                                                  : currentMedicalRecord.od
                                                      .axis || "",
                                          },
                                        });
                                      }
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/25 transition-all text-center",
                                      darkMode
                                        ? "bg-white border-slate-700 text-black animate-none"
                                        : "bg-white border-slate-300 text-slate-900 animate-none",
                                    )}
                                  />
                                </div>
                                <div>
                                  <label
                                    className={cn(
                                      "block text-[10px] font-black uppercase mb-1",
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-600",
                                    )}
                                  >
                                    Near AXIS
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={(() => {
                                      const addNum =
                                        parseFloat(
                                          String(
                                            currentMedicalRecord.od.add || "0",
                                          ).replace(",", "."),
                                        ) || 0;
                                      if (
                                        !currentMedicalRecord.od.add ||
                                        addNum === 0
                                      )
                                        return "-";
                                      const effectiveNearCyl =
                                        currentMedicalRecord.od.near_cyl !==
                                        undefined
                                          ? currentMedicalRecord.od.near_cyl
                                          : currentMedicalRecord.od.cyl;
                                      const isNearCylZeroOrEmpty =
                                        !effectiveNearCyl ||
                                        parseFloat(
                                          String(effectiveNearCyl).replace(
                                            ",",
                                            ".",
                                          ),
                                        ) === 0;
                                      if (isNearCylZeroOrEmpty) return "-";
                                      return (
                                        currentMedicalRecord.od.axis || "-"
                                      );
                                    })()}
                                    value={(() => {
                                      const effectiveNearCyl =
                                        currentMedicalRecord.od.near_cyl !==
                                        undefined
                                          ? currentMedicalRecord.od.near_cyl
                                          : currentMedicalRecord.od.cyl;
                                      const isNearCylZeroOrEmpty =
                                        !effectiveNearCyl ||
                                        parseFloat(
                                          String(effectiveNearCyl).replace(
                                            ",",
                                            ".",
                                          ),
                                        ) === 0;
                                      if (isNearCylZeroOrEmpty) return "";
                                      return currentMedicalRecord.od
                                        .near_axis !== undefined
                                        ? currentMedicalRecord.od.near_axis
                                        : (() => {
                                            const addNum =
                                              parseFloat(
                                                String(
                                                  currentMedicalRecord.od.add ||
                                                    "0",
                                                ).replace(",", "."),
                                              ) || 0;
                                            if (
                                              !currentMedicalRecord.od.add ||
                                              addNum === 0
                                            )
                                              return "";
                                            return (
                                              currentMedicalRecord.od.axis || ""
                                            );
                                          })();
                                    })()}
                                    disabled={(() => {
                                      const effectiveNearCyl =
                                        currentMedicalRecord.od.near_cyl !==
                                        undefined
                                          ? currentMedicalRecord.od.near_cyl
                                          : currentMedicalRecord.od.cyl;
                                      return (
                                        !effectiveNearCyl ||
                                        parseFloat(
                                          String(effectiveNearCyl).replace(
                                            ",",
                                            ".",
                                          ),
                                        ) === 0
                                      );
                                    })()}
                                    onChange={(e) => {
                                      let val = e.target.value.replace(
                                        /\D/g,
                                        "",
                                      );
                                      if (val !== "" && parseInt(val) > 180) {
                                        val = "180";
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        od: {
                                          ...currentMedicalRecord.od,
                                          near_axis: val,
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      let val = e.target.value.replace(
                                        /\D/g,
                                        "",
                                      );
                                      if (val === "") {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: {
                                            ...currentMedicalRecord.od,
                                            near_axis: "",
                                          },
                                        });
                                        return;
                                      }
                                      let n = parseInt(val);
                                      if (!isNaN(n)) {
                                        if (n > 180) n = 180;
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          od: {
                                            ...currentMedicalRecord.od,
                                            near_axis: n.toString(),
                                          },
                                        });
                                      }
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/25 transition-all text-center",
                                      darkMode
                                        ? "bg-white border-slate-700 text-black animate-none"
                                        : "bg-white border-slate-300 text-slate-900 animate-none",
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Visual Acuity OD (Always Visible) */}
                          <div
                            className={cn(
                              "mt-4 grid grid-cols-2 gap-4 w-full p-3 rounded-xl border transition-all",
                              darkMode
                                ? "bg-emerald-950/30 border-emerald-800/60"
                                : "bg-[#fffef0] border-amber-200/80 shadow-sm",
                            )}
                            style={darkMode ? undefined : { backgroundColor: "#fffef0" }}
                          >
                            <div className="col-span-2 text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-1.5">
                              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Acuitate Vizuală OD
                            </div>
                            <div>
                              <label
                                className={cn(
                                  "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                  darkMode ? "text-white" : "text-black",
                                )}
                              >
                                AV Fără Corecție
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.od.va_without || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    od: {
                                      ...currentMedicalRecord.od,
                                      va_without: e.target.value,
                                    },
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-white border-slate-700 text-black"
                                    : "bg-white border-slate-300 text-slate-900",
                                )}
                              />
                            </div>
                            <div>
                              <label
                                className={cn(
                                  "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                  darkMode ? "text-white" : "text-black",
                                )}
                              >
                                AV Cu Corecție
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.od.va_with || ""}
                                onChange={(e) => {
                                  const updatedOD = {
                                    ...currentMedicalRecord.od,
                                    va_with: e.target.value,
                                  };
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    od: updatedOD,
                                    diagnostic: updateDiagnosticSuggestions(
                                      currentMedicalRecord.diagnostic || "",
                                      updatedOD,
                                      currentMedicalRecord.os,
                                    ),
                                  });
                                }}
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-white border-slate-700 text-black"
                                    : "bg-white border-slate-300 text-slate-900",
                                )}
                              />
                            </div>
                          </div>

                          {/* IOP, CCT, Corrected IOP OD */}
                          <div
                            className={cn(
                              "mt-2 grid grid-cols-1 gap-2 w-full p-3 rounded-xl border transition-all",
                              darkMode
                                ? "bg-slate-900 border-slate-800"
                                : "bg-white border-slate-200 shadow-sm",
                            )}
                          >
                            <div>
                              <label
                                className={cn(
                                  "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                  darkMode ? "text-white" : "text-black",
                                )}
                              >
                                Tensiune Oculară (OD)
                              </label>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={currentMedicalRecord.iop?.od || ""}
                                    onChange={(e) => {
                                      let iopVal = e.target.value;
                                      iopVal = iopVal
                                        .replace(/[^0-9.,]/g, "")
                                        .replace(",", ".");

                                      const parts = iopVal.split(".");
                                      if (parts[0].length > 2) {
                                        parts[0] = parts[0].substring(0, 2);
                                        iopVal = parts.join(".");
                                      }

                                      const num = parseFloat(iopVal);
                                      if (!isNaN(num) && num > 90) {
                                        iopVal = "90";
                                      }

                                      const cctVal =
                                        currentMedicalRecord.pachymetry?.od ||
                                        "";
                                      let corrected = "";
                                      if (iopVal && cctVal) {
                                        const iop = parseFloat(iopVal);
                                        const cct = parseFloat(cctVal);
                                        if (!isNaN(iop) && !isNaN(cct)) {
                                          corrected = (
                                            iop +
                                            (545 - cct) * 0.05
                                          ).toFixed(1);
                                        }
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        iop: {
                                          ...(currentMedicalRecord.iop || {
                                            od: "",
                                            os: "",
                                          }),
                                          od: iopVal,
                                        },
                                        correctedIop: {
                                          ...(currentMedicalRecord.correctedIop || {
                                            od: "",
                                            os: "",
                                          }),
                                          od:
                                            corrected ||
                                            currentMedicalRecord.correctedIop
                                              ?.od ||
                                            "",
                                        },
                                      });
                                    }}
                                    className={getIopInputClass(
                                      currentMedicalRecord.iop?.od,
                                      true,
                                    )}
                                    placeholder="mmHg"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={
                                      currentMedicalRecord.pachymetry?.od || ""
                                    }
                                    onChange={(e) => {
                                      const cctVal = e.target.value;
                                      const iopVal =
                                        currentMedicalRecord.iop?.od || "";
                                      let corrected = "";
                                      if (iopVal && cctVal) {
                                        const iop = parseFloat(iopVal);
                                        const cct = parseFloat(cctVal);
                                        if (!isNaN(iop) && !isNaN(cct)) {
                                          corrected = (
                                            iop +
                                            (545 - cct) * 0.05
                                          ).toFixed(1);
                                        }
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        pachymetry: {
                                          ...(currentMedicalRecord.pachymetry || {
                                            od: "",
                                            os: "",
                                          }),
                                          od: cctVal,
                                        },
                                        correctedIop: {
                                          ...(currentMedicalRecord.correctedIop || {
                                            od: "",
                                            os: "",
                                          }),
                                          od:
                                            corrected ||
                                            currentMedicalRecord.correctedIop
                                              ?.od ||
                                            "",
                                        },
                                      });
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-white"
                                        : "bg-white border-slate-300 text-slate-900",
                                    )}
                                    placeholder="CCT (µm)"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={
                                      currentMedicalRecord.correctedIop?.od ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        correctedIop: {
                                          ...(currentMedicalRecord.correctedIop || {
                                            od: "",
                                            os: "",
                                          }),
                                          od: e.target.value,
                                        },
                                      })
                                    }
                                    className={getIopInputClass(
                                      currentMedicalRecord.correctedIop?.od,
                                      true,
                                    )}
                                    placeholder="Corectată"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Axial Length OD Dropdown */}
                          {(() => {
                            const age = currentMedicalRecord.patientBirthDate
                              ? calculateAge(
                                  currentMedicalRecord.patientBirthDate,
                                )
                              : currentMedicalRecord.patientAge;
                            if ((age || 0) >= 1 && (age || 0) <= 25) {
                              return (
                                <div className="mt-2 w-full">
                                  <button
                                    onClick={() =>
                                      setIsVaAlExpanded(!isVaAlExpanded)
                                    }
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed transition-all w-full",
                                      darkMode
                                        ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                        : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50",
                                    )}
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "w-3.5 h-3.5 transition-transform duration-300",
                                        isVaAlExpanded && "rotate-180",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        darkMode
                                          ? "text-white"
                                          : "text-slate-500",
                                      )}
                                    >
                                      Lungime Axială
                                    </span>
                                  </button>

                                  {isVaAlExpanded && (
                                    <div
                                      className={cn(
                                        "mt-2 w-full p-3 rounded-xl border transition-all",
                                        darkMode
                                          ? "bg-slate-900 border-slate-800"
                                          : "bg-white border-slate-200 shadow-sm",
                                      )}
                                    >
                                      <div>
                                        <label
                                          className={cn(
                                            "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                            darkMode
                                              ? "text-white"
                                              : "text-black",
                                          )}
                                        >
                                          Lungime Axială (OD)
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            currentMedicalRecord.axialLength
                                              ?.od || ""
                                          }
                                          onChange={(e) => {
                                            const sanitized =
                                              sanitizeAxialLengthInput(
                                                e.target.value,
                                              );
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              axialLength: {
                                                ...(currentMedicalRecord.axialLength || {
                                                  od: "",
                                                  os: "",
                                                }),
                                                od: sanitized,
                                              },
                                            });
                                          }}
                                          onBlur={(e) => {
                                            const validated =
                                              validateAxialLengthOnBlur(
                                                e.target.value,
                                              );
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              axialLength: {
                                                ...(currentMedicalRecord.axialLength || {
                                                  od: "",
                                                  os: "",
                                                }),
                                                od: validated,
                                              },
                                            });
                                          }}
                                          className={cn(
                                            "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                            darkMode
                                              ? "bg-slate-900 border-slate-700 text-white"
                                              : "bg-white border-slate-300 text-slate-900",
                                          )}
                                          placeholder={`Ex: ${getExpectedAxialLength(currentMedicalRecord.patientBirthDate, currentMedicalRecord.patientAge, currentMedicalRecord.patientSex)} mm`}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* DP and Mentions field between eyes on desktop, below on mobile */}
                        <div className="flex flex-col items-center gap-2 py-2 md:py-0 w-full">
                          <div className="flex items-center justify-center gap-2 w-full mb-1">
                            {/* Refracție fără Ciclopegie (Aparat) */}
                            <button
                              type="button"
                              onClick={() => {
                                const isEnabled =
                                  !currentMedicalRecord.nonCycloplegic?.enabled;
                                setCurrentMedicalRecord({
                                  ...currentMedicalRecord,
                                  nonCycloplegic: {
                                    ...(currentMedicalRecord.nonCycloplegic || {
                                      enabled: false,
                                      od: { sph: "", cyl: "", axis: "" },
                                      os: { sph: "", cyl: "", axis: "" },
                                    }),
                                    enabled: isEnabled,
                                  },
                                });
                              }}
                              className={cn(
                                "flex items-center justify-center gap-1 px-2 py-1.5 rounded-2xl border transition-all shadow-sm group shrink-0",
                                currentMedicalRecord.nonCycloplegic?.enabled
                                  ? "bg-rose-500 border-rose-400 text-white shadow-rose-500/20"
                                  : darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-rose-400"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600",
                              )}
                            >
                              <DropletOff
                                className={cn(
                                  "w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0",
                                  currentMedicalRecord.nonCycloplegic?.enabled
                                    ? "fill-white"
                                    : "fill-rose-500/20",
                                )}
                              />
                              <div className="flex flex-col items-start leading-[1.1]">
                                <span className="text-[9px] font-black uppercase tracking-wide">
                                  Refracție
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wide leading-none">
                                  Fără Ciclo
                                </span>
                              </div>
                            </button>

                            <div className="flex flex-col items-center justify-center shrink-0">
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-wide",
                                  darkMode
                                    ? "text-slate-500"
                                    : "text-slate-400",
                                )}
                              >
                                Data consultației:
                              </span>
                              <span
                                className={cn(
                                  "text-xl font-black leading-tight",
                                  activePrescriptionIndex !== null
                                    ? "text-blue-600"
                                    : "text-emerald-600",
                                )}
                              >
                                {format(
                                  activePrescriptionIndex !== null &&
                                    currentMedicalRecord.prescriptionHistory?.[
                                      activePrescriptionIndex
                                    ]
                                    ? new Date(
                                        currentMedicalRecord
                                          .prescriptionHistory[
                                          activePrescriptionIndex
                                        ].date,
                                      )
                                    : new Date(),
                                  "dd.MM.yyyy",
                                )}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const isEnabled =
                                  !currentMedicalRecord.cycloplegia?.enabled;
                                setCurrentMedicalRecord({
                                  ...currentMedicalRecord,
                                  cycloplegia: {
                                    ...(currentMedicalRecord.cycloplegia || {
                                      enabled: false,
                                      od: { sph: "", cyl: "", axis: "" },
                                      os: { sph: "", cyl: "", axis: "" },
                                    }),
                                    enabled: isEnabled,
                                  },
                                });
                              }}
                              className={cn(
                                "flex items-center justify-center gap-1 px-2 py-1.5 rounded-2xl border transition-all shadow-sm group shrink-0",
                                currentMedicalRecord.cycloplegia?.enabled
                                  ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20"
                                  : darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-emerald-400"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600",
                              )}
                            >
                              <Droplet
                                className={cn(
                                  "w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0",
                                  currentMedicalRecord.cycloplegia?.enabled
                                    ? "fill-white"
                                    : "fill-emerald-500/20",
                                )}
                              />
                              <div className="flex flex-col items-start leading-[1.1]">
                                <span className="text-[9px] font-black uppercase tracking-wide">
                                  Refracție
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wide">
                                  Ciclopegie
                                </span>
                              </div>
                            </button>
                          </div>

                          {currentMedicalRecord.nonCycloplegic?.enabled && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              className="w-full max-w-[400px] mt-1 mb-2 p-4 rounded-2xl border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 flex flex-col gap-3"
                            >
                              <div className="flex justify-between gap-4">
                                {/* OD Non-Cyc */}
                                <div className="flex-1 space-y-2">
                                  <label className="block text-[8px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest">
                                    OD Refracție Aparat
                                  </label>
                                  <div className="flex gap-1.5">
                                    {(["sph", "cyl", "axis"] as const).map(
                                      (field) => (
                                        <div
                                          key={`noncyc-od-${field}`}
                                          className="flex flex-col items-center flex-1"
                                        >
                                          <span className="text-[9px] font-bold text-rose-600/70 dark:text-rose-500/70 uppercase mb-0.5 whitespace-nowrap">
                                            {field === "sph"
                                              ? "SF"
                                              : field === "cyl"
                                                ? "CYL"
                                                : "AX"}
                                          </span>
                                          <input
                                            type="text"
                                            placeholder={
                                              field === "sph"
                                                ? "SF"
                                                : field === "cyl"
                                                  ? "CYL"
                                                  : "AX"
                                            }
                                            value={
                                              currentMedicalRecord
                                                .nonCycloplegic?.od[field] || ""
                                            }
                                            onChange={(e) => {
                                              let val = e.target.value;
                                              if (field === "axis") {
                                                val = val.replace(/\D/g, "");
                                                if (
                                                  val !== "" &&
                                                  parseInt(val) > 180
                                                )
                                                  val = "180";
                                              } else if (
                                                field === "sph" ||
                                                field === "cyl"
                                              ) {
                                                val = val.replace(
                                                  /[^0-9.,+-]/g,
                                                  "",
                                                ).replace(",", ".");
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                nonCycloplegic: {
                                                  ...currentMedicalRecord.nonCycloplegic!,
                                                  od: {
                                                    ...currentMedicalRecord
                                                      .nonCycloplegic!.od,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            onBlur={(e) => {
                                              let val = e.target.value;
                                              if (
                                                (field === "sph" ||
                                                  field === "cyl") &&
                                                val
                                              ) {
                                                let num = parseFloat(val);
                                                if (!isNaN(num)) {
                                                  num = Math.round(num * 4) / 4;
                                                  num =
                                                    field === "sph"
                                                      ? Math.max(
                                                          -25,
                                                          Math.min(22, num),
                                                        )
                                                      : Math.max(
                                                          -7,
                                                          Math.min(7, num),
                                                        );
                                                  const sign =
                                                    num >= 0 ? "+" : "";
                                                  val = `${sign}${num.toFixed(2)}`;
                                                }
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                nonCycloplegic: {
                                                  ...currentMedicalRecord.nonCycloplegic!,
                                                  od: {
                                                    ...currentMedicalRecord
                                                      .nonCycloplegic!.od,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            className={cn(
                                              "w-full p-2 border rounded-lg text-xs font-black text-center outline-none focus:ring-1 focus:ring-rose-500/30 transition-all",
                                              darkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-slate-200 text-slate-900",
                                            )}
                                          />
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                                <div className="w-[1px] bg-rose-200 dark:bg-rose-900/30" />
                                {/* OS Non-Cyc */}
                                <div className="flex-1 space-y-2">
                                  <label className="block text-[8px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest">
                                    OS Refracție Aparat
                                  </label>
                                  <div className="flex gap-1.5">
                                    {(["sph", "cyl", "axis"] as const).map(
                                      (field) => (
                                        <div
                                          key={`noncyc-os-${field}`}
                                          className="flex flex-col items-center flex-1"
                                        >
                                          <span className="text-[9px] font-bold text-rose-600/70 dark:text-rose-500/70 uppercase mb-0.5 whitespace-nowrap">
                                            {field === "sph"
                                              ? "SF"
                                              : field === "cyl"
                                                ? "CYL"
                                                : "AX"}
                                          </span>
                                          <input
                                            type="text"
                                            placeholder={
                                              field === "sph"
                                                ? "SF"
                                                : field === "cyl"
                                                  ? "CYL"
                                                  : "AX"
                                            }
                                            value={
                                              currentMedicalRecord
                                                .nonCycloplegic?.os[field] || ""
                                            }
                                            onChange={(e) => {
                                              let val = e.target.value;
                                              if (field === "axis") {
                                                val = val.replace(/\D/g, "");
                                                if (
                                                  val !== "" &&
                                                  parseInt(val) > 180
                                                )
                                                  val = "180";
                                              } else if (
                                                field === "sph" ||
                                                field === "cyl"
                                              ) {
                                                val = val.replace(
                                                  /[^0-9.,+-]/g,
                                                  "",
                                                ).replace(",", ".");
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                nonCycloplegic: {
                                                  ...currentMedicalRecord.nonCycloplegic!,
                                                  os: {
                                                    ...currentMedicalRecord
                                                      .nonCycloplegic!.os,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            onBlur={(e) => {
                                              let val = e.target.value;
                                              if (
                                                (field === "sph" ||
                                                  field === "cyl") &&
                                                val
                                              ) {
                                                let num = parseFloat(val);
                                                if (!isNaN(num)) {
                                                  num = Math.round(num * 4) / 4;
                                                  num =
                                                    field === "sph"
                                                      ? Math.max(
                                                          -25,
                                                          Math.min(22, num),
                                                        )
                                                      : Math.max(
                                                          -7,
                                                          Math.min(7, num),
                                                        );
                                                  const sign =
                                                    num >= 0 ? "+" : "";
                                                  val = `${sign}${num.toFixed(2)}`;
                                                }
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                nonCycloplegic: {
                                                  ...currentMedicalRecord.nonCycloplegic!,
                                                  os: {
                                                    ...currentMedicalRecord
                                                      .nonCycloplegic!.os,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            className={cn(
                                              "w-full p-2 border rounded-lg text-xs font-black text-center outline-none focus:ring-1 focus:ring-rose-500/30 transition-all",
                                              darkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-slate-200 text-slate-900",
                                            )}
                                          />
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {currentMedicalRecord.cycloplegia?.enabled && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              className="w-full max-w-[400px] mt-1 mb-2 p-4 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 flex flex-col gap-3"
                            >
                              <div className="flex justify-between gap-4">
                                {/* OD Cyc */}
                                <div className="flex-1 space-y-2">
                                  <label className="block text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                                    OD Ciclopegie
                                  </label>
                                  <div className="flex gap-1.5">
                                    {(["sph", "cyl", "axis"] as const).map(
                                      (field) => (
                                        <div
                                          key={`cyc-od-${field}`}
                                          className="flex flex-col items-center flex-1"
                                        >
                                          <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase mb-0.5 whitespace-nowrap">
                                            {field === "sph"
                                              ? "SF"
                                              : field === "cyl"
                                                ? "CYL"
                                                : "AX"}
                                          </span>
                                          <input
                                            type="text"
                                            placeholder={
                                              field === "sph"
                                                ? "SF"
                                                : field === "cyl"
                                                  ? "CYL"
                                                  : "AX"
                                            }
                                            value={
                                              currentMedicalRecord.cycloplegia
                                                ?.od[field] || ""
                                            }
                                            onChange={(e) => {
                                              let val = e.target.value;
                                              if (field === "axis") {
                                                val = val.replace(/\D/g, "");
                                                if (
                                                  val !== "" &&
                                                  parseInt(val) > 180
                                                )
                                                  val = "180";
                                              } else if (
                                                field === "sph" ||
                                                field === "cyl"
                                              ) {
                                                val = val.replace(
                                                  /[^0-9.,+-]/g,
                                                  "",
                                                ).replace(",", ".");
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                cycloplegia: {
                                                  ...currentMedicalRecord.cycloplegia!,
                                                  od: {
                                                    ...currentMedicalRecord
                                                      .cycloplegia!.od,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            onBlur={(e) => {
                                              let val = e.target.value;
                                              if (
                                                (field === "sph" ||
                                                  field === "cyl") &&
                                                val
                                              ) {
                                                let num = parseFloat(val);
                                                if (!isNaN(num)) {
                                                  num = Math.round(num * 4) / 4;
                                                  num =
                                                    field === "sph"
                                                      ? Math.max(
                                                          -25,
                                                          Math.min(22, num),
                                                        )
                                                      : Math.max(
                                                          -7,
                                                          Math.min(7, num),
                                                        );
                                                  const sign =
                                                    num >= 0 ? "+" : "";
                                                  val = `${sign}${num.toFixed(2)}`;
                                                }
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                cycloplegia: {
                                                  ...currentMedicalRecord.cycloplegia!,
                                                  od: {
                                                    ...currentMedicalRecord
                                                      .cycloplegia!.od,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            className={cn(
                                              "w-full p-2 border rounded-lg text-xs font-black text-center outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all",
                                              darkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-slate-200 text-slate-900",
                                            )}
                                          />
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                                <div className="w-[1px] bg-emerald-200 dark:bg-emerald-900/30" />
                                {/* OS Cyc */}
                                <div className="flex-1 space-y-2">
                                  <label className="block text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                                    OS Ciclopegie
                                  </label>
                                  <div className="flex gap-1.5">
                                    {(["sph", "cyl", "axis"] as const).map(
                                      (field) => (
                                        <div
                                          key={`cyc-os-${field}`}
                                          className="flex flex-col items-center flex-1"
                                        >
                                          <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase mb-0.5 whitespace-nowrap">
                                            {field === "sph"
                                              ? "SF"
                                              : field === "cyl"
                                                ? "CYL"
                                                : "AX"}
                                          </span>
                                          <input
                                            type="text"
                                            placeholder={
                                              field === "sph"
                                                ? "SF"
                                                : field === "cyl"
                                                  ? "CYL"
                                                  : "AX"
                                            }
                                            value={
                                              currentMedicalRecord.cycloplegia
                                                ?.os[field] || ""
                                            }
                                            onChange={(e) => {
                                              let val = e.target.value;
                                              if (field === "axis") {
                                                val = val.replace(/\D/g, "");
                                                if (
                                                  val !== "" &&
                                                  parseInt(val) > 180
                                                )
                                                  val = "180";
                                              } else if (
                                                field === "sph" ||
                                                field === "cyl"
                                              ) {
                                                val = val.replace(
                                                  /[^0-9.,+-]/g,
                                                  "",
                                                ).replace(",", ".");
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                cycloplegia: {
                                                  ...currentMedicalRecord.cycloplegia!,
                                                  os: {
                                                    ...currentMedicalRecord
                                                      .cycloplegia!.os,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            onBlur={(e) => {
                                              let val = e.target.value;
                                              if (
                                                (field === "sph" ||
                                                  field === "cyl") &&
                                                val
                                              ) {
                                                let num = parseFloat(val);
                                                if (!isNaN(num)) {
                                                  num = Math.round(num * 4) / 4;
                                                  num =
                                                    field === "sph"
                                                      ? Math.max(
                                                          -25,
                                                          Math.min(22, num),
                                                        )
                                                      : Math.max(
                                                          -7,
                                                          Math.min(7, num),
                                                        );
                                                  const sign =
                                                    num >= 0 ? "+" : "";
                                                  val = `${sign}${num.toFixed(2)}`;
                                                }
                                              }
                                              setCurrentMedicalRecord({
                                                ...currentMedicalRecord,
                                                cycloplegia: {
                                                  ...currentMedicalRecord.cycloplegia!,
                                                  os: {
                                                    ...currentMedicalRecord
                                                      .cycloplegia!.os,
                                                    [field]: val,
                                                  },
                                                },
                                              });
                                            }}
                                            className={cn(
                                              "w-full p-2 border rounded-lg text-xs font-black text-center outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all",
                                              darkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-slate-200 text-slate-900",
                                            )}
                                          />
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div
                            className={cn(
                              "p-3 rounded-3xl border shadow-xl flex flex-col items-center border-blue-500/20",
                              darkMode ? "bg-slate-800" : "bg-white",
                            )}
                          >
                            <div className="flex items-end gap-2.5">
                              {/* DP OD */}
                              <div className="flex flex-col items-center">
                                <label
                                  className={cn(
                                    "text-[10px] font-black mb-1 uppercase tracking-widest",
                                    darkMode
                                      ? "text-slate-400"
                                      : "text-slate-500",
                                  )}
                                >
                                  OD
                                </label>
                                <input
                                  type="text"
                                  value={currentMedicalRecord.dp_od || ""}
                                  placeholder="0"
                                  onFocus={(e) => {
                                    e.target.select();
                                    if (currentMedicalRecord) {
                                      setIsNearEmptyOnFocus(
                                        !currentMedicalRecord.dp_aproape &&
                                        !currentMedicalRecord.dp_aproape_od &&
                                        !currentMedicalRecord.dp_aproape_os
                                      );
                                    }
                                  }}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    if (val.length > 4) val = val.slice(0, 4);

                                    let newOS =
                                      currentMedicalRecord.dp_os || "";
                                    if (
                                      !currentMedicalRecord.dp_os ||
                                      currentMedicalRecord.dp_os ===
                                        currentMedicalRecord.dp_od
                                    ) {
                                      newOS = val;
                                    }

                                    const numVal = parseFloat(val) || 0;
                                    const finalOSNum = parseFloat(newOS) || 0;
                                    const total = numVal + finalOSNum;

                                    const updates: any = {
                                      dp_od: val,
                                      dp_os: newOS,
                                      dp: total > 0 ? total.toString() : "",
                                    };

                                    if (isNearEmptyOnFocus && total > 0) {
                                      const nearVal = total - 2;
                                      updates.dp_aproape = nearVal > 0 ? nearVal.toString() : "";
                                      updates.dp_aproape_od = nearVal > 0 ? (nearVal / 2).toString() : "";
                                      updates.dp_aproape_os = nearVal > 0 ? (nearVal / 2).toString() : "";
                                    }

                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      ...updates,
                                    });
                                  }}
                                  onBlur={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num =
                                        Math.round(parseFloat(val) * 2) / 2;
                                      let osNum =
                                        Math.round(
                                          parseFloat(
                                            currentMedicalRecord.dp_os || "0",
                                          ) * 2,
                                        ) / 2;
                                      const total = num + osNum;

                                      const updates: any = {
                                        dp_od: num.toString(),
                                        dp_os: osNum.toString(),
                                        dp: total > 0 ? total.toString() : "",
                                      };

                                      if (isNearEmptyOnFocus && total > 0) {
                                        const nearNum = total - 2;
                                        const nearHalf = (nearNum / 2).toString();
                                        updates.dp_aproape = nearNum.toString();
                                        updates.dp_aproape_od = nearHalf;
                                        updates.dp_aproape_os = nearHalf;
                                      }

                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        ...updates,
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "w-16 p-2 border-2 rounded-xl text-lg font-black text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-300 text-slate-900",
                                  )}
                                />
                              </div>

                              {/* DP Total */}
                              <div className="flex flex-col items-center">
                                <label
                                  className={cn(
                                    "text-[16px] font-black mb-1 uppercase tracking-widest",
                                    darkMode ? "text-white" : "text-black",
                                  )}
                                >
                                  DP Distanță
                                </label>
                                <input
                                  ref={dpRef}
                                  onKeyDown={(e) => {
                                    if (e.key === "Tab" && !e.shiftKey) {
                                      e.preventDefault();
                                      osSphRef.current?.focus();
                                    }
                                  }}
                                  type="text"
                                  value={currentMedicalRecord.dp}
                                  onFocus={(e) => {
                                    e.target.select();
                                    if (currentMedicalRecord) {
                                      setIsNearEmptyOnFocus(
                                        !currentMedicalRecord.dp_aproape &&
                                        !currentMedicalRecord.dp_aproape_od &&
                                        !currentMedicalRecord.dp_aproape_os
                                      );
                                    }
                                  }}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    const numVal = parseFloat(val);
                                    const updates: any = { dp: val };

                                    if (!isNaN(numVal)) {
                                      const half = (numVal / 2).toString();
                                      updates.dp_od = half;
                                      updates.dp_os = half;

                                      if (isNearEmptyOnFocus) {
                                        const nearVal = numVal - 2;
                                        updates.dp_aproape = nearVal > 0 ? nearVal.toString() : "";
                                        updates.dp_aproape_od = nearVal > 0 ? (nearVal / 2).toString() : "";
                                        updates.dp_aproape_os = nearVal > 0 ? (nearVal / 2).toString() : "";
                                      }
                                    }

                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      ...updates,
                                    });
                                  }}
                                  onBlur={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num =
                                        Math.round(parseFloat(val) * 2) / 2;
                                      if (num < 40 || num > 84) {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          dp: "",
                                          dp_od: "",
                                          dp_os: "",
                                        });
                                      } else {
                                        const half = (num / 2).toString();

                                        const updates: any = {
                                          dp: num.toString(),
                                          dp_od: half,
                                          dp_os: half,
                                        };

                                        if (isNearEmptyOnFocus) {
                                          const nearNum = num - 2;
                                          const nearHalf = (nearNum / 2).toString();
                                          updates.dp_aproape = nearNum.toString();
                                          updates.dp_aproape_od = nearHalf;
                                          updates.dp_aproape_os = nearHalf;
                                        }

                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          ...updates,
                                        });
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-40 p-2 border-2 rounded-xl text-2xl font-black text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border-blue-500/40 shadow-lg shadow-blue-500/10",
                                    darkMode
                                      ? "bg-slate-900 text-white"
                                      : "bg-white text-slate-900",
                                  )}
                                />
                              </div>

                              {/* DP OS */}
                              <div className="flex flex-col items-center">
                                <label
                                  className={cn(
                                    "text-[10px] font-black mb-1 uppercase tracking-widest",
                                    darkMode
                                      ? "text-slate-400"
                                      : "text-slate-500",
                                  )}
                                >
                                  OS
                                </label>
                                <input
                                  type="text"
                                  value={currentMedicalRecord.dp_os || ""}
                                  placeholder="0"
                                  onFocus={(e) => {
                                    e.target.select();
                                    if (currentMedicalRecord) {
                                      setIsNearEmptyOnFocus(
                                        !currentMedicalRecord.dp_aproape &&
                                        !currentMedicalRecord.dp_aproape_od &&
                                        !currentMedicalRecord.dp_aproape_os
                                      );
                                    }
                                  }}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    if (val.length > 4) val = val.slice(0, 4);
                                    const numVal = parseFloat(val) || 0;
                                    const currentODNum =
                                      parseFloat(
                                        currentMedicalRecord.dp_od || "0",
                                      ) || 0;
                                    const total = currentODNum + numVal;

                                    const updates: any = {
                                      dp_os: val,
                                      dp: total > 0 ? total.toString() : "",
                                    };

                                    if (isNearEmptyOnFocus && total > 0) {
                                      const nearVal = total - 2;
                                      updates.dp_aproape = nearVal > 0 ? nearVal.toString() : "";
                                      updates.dp_aproape_od = nearVal > 0 ? (nearVal / 2).toString() : "";
                                      updates.dp_aproape_os = nearVal > 0 ? (nearVal / 2).toString() : "";
                                    }

                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      ...updates,
                                    });
                                  }}
                                  onBlur={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num =
                                        Math.round(parseFloat(val) * 2) / 2;
                                      let odNum =
                                        Math.round(
                                          parseFloat(
                                            currentMedicalRecord.dp_od || "0",
                                          ) * 2,
                                        ) / 2;
                                      const total = odNum + num;

                                      const updates: any = {
                                        dp_os: num.toString(),
                                        dp_od: odNum.toString(),
                                        dp: total > 0 ? total.toString() : "",
                                      };

                                      if (isNearEmptyOnFocus && total > 0) {
                                        const nearNum = total - 2;
                                        const nearHalf = (nearNum / 2).toString();
                                        updates.dp_aproape = nearNum.toString();
                                        updates.dp_aproape_od = nearHalf;
                                        updates.dp_aproape_os = nearHalf;
                                      }

                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        ...updates,
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "w-16 p-2 border-2 rounded-xl text-lg font-black text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-300 text-slate-900",
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          {/* DP APROAPE */}
                          <div
                            className={cn(
                              "p-3 rounded-3xl border shadow-xl flex flex-col items-center mt-3 border-rose-500/20 transition-all",
                              darkMode ? "bg-slate-800" : "bg-white",
                            )}
                          >
                            <div className="flex items-end gap-2.5">
                              {/* DP OD APROAPE */}
                              <div className="flex flex-col items-center">
                                <label
                                  className={cn(
                                    "text-[10px] font-black mb-1 uppercase tracking-widest text-rose-600 dark:text-rose-400",
                                  )}
                                >
                                  OD
                                </label>
                                <input
                                  type="text"
                                  value={currentMedicalRecord.dp_aproape_od || ""}
                                  placeholder="0"
                                  onFocus={(e) => {
                                    e.target.select();
                                    if (currentMedicalRecord) {
                                      setIsDistEmptyOnFocus(
                                        !currentMedicalRecord.dp &&
                                        !currentMedicalRecord.dp_od &&
                                        !currentMedicalRecord.dp_os
                                      );
                                    }
                                  }}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    if (val.length > 4) val = val.slice(0, 4);

                                    let newOS =
                                      currentMedicalRecord.dp_aproape_os || "";
                                    if (
                                      !currentMedicalRecord.dp_aproape_os ||
                                      currentMedicalRecord.dp_aproape_os ===
                                        currentMedicalRecord.dp_aproape_od
                                    ) {
                                      newOS = val;
                                    }

                                    const numVal = parseFloat(val) || 0;
                                    const finalOSNum = parseFloat(newOS) || 0;
                                    const total = numVal + finalOSNum;

                                    const updates: any = {
                                      dp_aproape_od: val,
                                      dp_aproape_os: newOS,
                                      dp_aproape: total > 0 ? total.toString() : "",
                                    };

                                    if (isDistEmptyOnFocus && total > 0) {
                                      const distVal = total + 2;
                                      updates.dp = distVal > 0 ? distVal.toString() : "";
                                      updates.dp_od = distVal > 0 ? (distVal / 2).toString() : "";
                                      updates.dp_os = distVal > 0 ? (distVal / 2).toString() : "";
                                    }

                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      ...updates,
                                    });
                                  }}
                                  onBlur={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num =
                                        Math.round(parseFloat(val) * 2) / 2;
                                      let osNum =
                                        Math.round(
                                          parseFloat(
                                            currentMedicalRecord.dp_aproape_os || "0",
                                          ) * 2,
                                        ) / 2;
                                      const total = num + osNum;

                                      const updates: any = {
                                        dp_aproape_od: num.toString(),
                                        dp_aproape_os: osNum.toString(),
                                        dp_aproape: total > 0 ? total.toString() : "",
                                      };

                                      if (isDistEmptyOnFocus && total > 0) {
                                        const distNum = total + 2;
                                        const distHalf = (distNum / 2).toString();
                                        updates.dp = distNum.toString();
                                        updates.dp_od = distHalf;
                                        updates.dp_os = distHalf;
                                      }

                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        ...updates,
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "w-16 p-2 border-2 rounded-xl text-lg font-black text-center outline-none focus:ring-2 focus:ring-rose-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-300 text-slate-900",
                                  )}
                                />
                              </div>

                              {/* DP Aproape Total */}
                              <div className="flex flex-col items-center">
                                <label
                                  className={cn(
                                    "text-[16px] font-black mb-1 uppercase tracking-widest text-rose-700 dark:text-rose-300",
                                  )}
                                >
                                  DP Aproape
                                </label>
                                <input
                                  type="text"
                                  value={currentMedicalRecord.dp_aproape || ""}
                                  onFocus={(e) => {
                                    e.target.select();
                                    if (currentMedicalRecord) {
                                      setIsDistEmptyOnFocus(
                                        !currentMedicalRecord.dp &&
                                        !currentMedicalRecord.dp_od &&
                                        !currentMedicalRecord.dp_os
                                      );
                                    }
                                  }}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    const numVal = parseFloat(val);
                                    const updates: any = { dp_aproape: val };

                                    if (!isNaN(numVal)) {
                                      const half = (numVal / 2).toString();
                                      updates.dp_aproape_od = half;
                                      updates.dp_aproape_os = half;

                                      if (isDistEmptyOnFocus) {
                                        const distVal = numVal + 2;
                                        updates.dp = distVal > 0 ? distVal.toString() : "";
                                        updates.dp_od = distVal > 0 ? (distVal / 2).toString() : "";
                                        updates.dp_os = distVal > 0 ? (distVal / 2).toString() : "";
                                      }
                                    }

                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      ...updates,
                                    });
                                  }}
                                  onBlur={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num =
                                        Math.round(parseFloat(val) * 2) / 2;
                                      if (num < 40 || num > 84) {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          dp_aproape: "",
                                          dp_aproape_od: "",
                                          dp_aproape_os: "",
                                        });
                                      } else {
                                        const half = (num / 2).toString();

                                        const updates: any = {
                                          dp_aproape: num.toString(),
                                          dp_aproape_od: half,
                                          dp_aproape_os: half,
                                        };

                                        if (isDistEmptyOnFocus) {
                                          const distNum = num + 2;
                                          const distHalf = (distNum / 2).toString();
                                          updates.dp = distNum.toString();
                                          updates.dp_od = distHalf;
                                          updates.dp_os = distHalf;
                                        }

                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          ...updates,
                                        });
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-40 p-2 border-2 rounded-xl text-2xl font-black text-center outline-none focus:ring-2 focus:ring-rose-500/20 transition-all border-rose-400/40 shadow-lg shadow-rose-500/10",
                                    darkMode
                                      ? "bg-slate-900 text-white"
                                      : "bg-white text-slate-900",
                                  )}
                                />
                              </div>

                              {/* DP OS APROAPE */}
                              <div className="flex flex-col items-center">
                                <label
                                  className={cn(
                                    "text-[10px] font-black mb-1 uppercase tracking-widest text-rose-600 dark:text-rose-400",
                                  )}
                                >
                                  OS
                                </label>
                                <input
                                  type="text"
                                  value={currentMedicalRecord.dp_aproape_os || ""}
                                  placeholder="0"
                                  onFocus={(e) => {
                                    e.target.select();
                                    if (currentMedicalRecord) {
                                      setIsDistEmptyOnFocus(
                                        !currentMedicalRecord.dp &&
                                        !currentMedicalRecord.dp_od &&
                                        !currentMedicalRecord.dp_os
                                      );
                                    }
                                  }}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    if (val.length > 4) val = val.slice(0, 4);
                                    const numVal = parseFloat(val) || 0;
                                    const currentODNum =
                                      parseFloat(
                                        currentMedicalRecord.dp_aproape_od || "0",
                                      ) || 0;
                                    const total = currentODNum + numVal;

                                    const updates: any = {
                                      dp_aproape_os: val,
                                      dp_aproape: total > 0 ? total.toString() : "",
                                    };

                                    if (isDistEmptyOnFocus && total > 0) {
                                      const distVal = total + 2;
                                      updates.dp = distVal > 0 ? distVal.toString() : "";
                                      updates.dp_od = distVal > 0 ? (distVal / 2).toString() : "";
                                      updates.dp_os = distVal > 0 ? (distVal / 2).toString() : "";
                                    }

                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      ...updates,
                                    });
                                  }}
                                  onBlur={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                      let num =
                                        Math.round(parseFloat(val) * 2) / 2;
                                      let odNum =
                                        Math.round(
                                          parseFloat(
                                            currentMedicalRecord.dp_aproape_od || "0",
                                          ) * 2,
                                        ) / 2;
                                      const total = odNum + num;

                                      const updates: any = {
                                        dp_aproape_os: num.toString(),
                                        dp_aproape_od: odNum.toString(),
                                        dp_aproape: total > 0 ? total.toString() : "",
                                      };

                                      if (isDistEmptyOnFocus && total > 0) {
                                        const distNum = total + 2;
                                        const distHalf = (distNum / 2).toString();
                                        updates.dp = distNum.toString();
                                        updates.dp_od = distHalf;
                                        updates.dp_os = distHalf;
                                      }

                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        ...updates,
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "w-16 p-2 border-2 rounded-xl text-lg font-black text-center outline-none focus:ring-2 focus:ring-rose-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-900 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-300 text-slate-900",
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Left Eye (OS) */}
                        <div
                          className={cn(
                            "p-4 rounded-2xl border transition-all flex flex-col items-center",
                            darkMode
                              ? "bg-slate-800/50 border-slate-700/50"
                              : "bg-[#f0fdf4] border-lime-200/80 shadow-sm",
                          )}
                          style={darkMode ? undefined : { backgroundColor: "#f0fdf4" }}
                        >
                          <div className="flex flex-col gap-2 mb-3 w-full">
                            <h4
                              className={cn(
                                "text-xl font-black uppercase flex items-center gap-2 w-full flex-nowrap",
                                darkMode ? "text-slate-300" : "text-slate-500",
                              )}
                            >
                              <div className="w-1.5 h-6 bg-emerald-500 rounded-full shrink-0" />
                              <span className="whitespace-nowrap">
                                Ochi Stâng
                              </span>
                              {(() => {
                                const age =
                                  currentMedicalRecord.patientBirthDate
                                    ? calculateAge(
                                        currentMedicalRecord.patientBirthDate,
                                      )
                                    : currentMedicalRecord.patientAge;
                                const isManagementEligible = (age || 0) <= 25;
                                return (
                                  isManagementEligible && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMyopiaChartEye("OS");
                                        setIsMyopiaChartOpen(true);
                                      }}
                                      className="ml-auto flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 transition-all shrink-0"
                                      title="Management Miopie - Grafic Lungime Axială"
                                    >
                                      <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-center">
                                        Miopia
                                        <br />
                                        Management
                                      </span>
                                    </button>
                                  )
                                );
                              })()}
                            </h4>

                            <div className="flex items-center gap-2">
                              {currentMedicalRecord && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrismEye("OS");
                                      setTempPrismValue(
                                        currentMedicalRecord.os.prism || "",
                                      );
                                      setTempPrismBase(
                                        (currentMedicalRecord.os.base || "") as any,
                                      );
                                      setIsPrismModalOpen(true);
                                    }}
                                    className={cn(
                                      "ml-3.5 flex items-center justify-start gap-1 px-2 py-1 rounded-lg transition-all border shrink-0 w-fit",
                                      currentMedicalRecord.os.prism
                                        ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/20"
                                        : darkMode
                                          ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm",
                                    )}
                                  >
                                    <Triangle
                                      className={cn(
                                        "w-3 h-3 transition-transform duration-300",
                                        currentMedicalRecord.os.prism
                                          ? "fill-white/20"
                                          : "fill-emerald-500/20",
                                        currentMedicalRecord.os.base ===
                                          "SUS" && "rotate-180",
                                        currentMedicalRecord.os.base ===
                                          "JOS" && "rotate-0",
                                        currentMedicalRecord.os.base ===
                                          "NAZAL" && "rotate-90",
                                        currentMedicalRecord.os.base ===
                                          "TEMPORAL" && "-rotate-90",
                                      )}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-wider">
                                      {currentMedicalRecord.os.prism
                                        ? `${currentMedicalRecord.os.prism} B ${currentMedicalRecord.os.base}`
                                        : "Prismă"}
                                    </span>
                                  </button>
                                  {currentMedicalRecord.os.prism && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: {
                                            ...currentMedicalRecord.os,
                                            prism: "",
                                            base: "",
                                          },
                                        });
                                      }}
                                      className={cn(
                                        "absolute -top-1 -right-1 p-0.5 rounded-full border shadow-sm z-10 transition-colors",
                                        darkMode
                                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-rose-600 hover:text-white"
                                          : "bg-white border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white",
                                      )}
                                    >
                                      <X size={8} />
                                    </button>
                                  )}
                                </div>
                              )}

                              {currentMedicalRecord && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setClEye("OS");
                                      setClModalError(null);
                                      setClEqSfericActive(false);
                                      setClOriginalData(null);
                                      setTempClData(
                                        currentMedicalRecord.cl_os || {
                                          sph: currentMedicalRecord.os?.sph
                                            ? vertexCompensation(
                                                currentMedicalRecord.os.sph,
                                              )
                                            : "",
                                          cyl: currentMedicalRecord.os?.cyl || "",
                                          axis: currentMedicalRecord.os?.axis || "",
                                          base: "8.6",
                                          radius: "14.2",
                                          brand: "",
                                          wearingType: "Lunară",
                                        },
                                      );
                                      setIsContactLensModalOpen(true);
                                    }}
                                    className={cn(
                                      "flex items-center justify-start gap-1 px-2 py-1 rounded-lg transition-all border shrink-0 w-fit cursor-pointer active:scale-95",
                                      currentMedicalRecord.cl_os?.sph ||
                                        currentMedicalRecord.cl_os?.base
                                        ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-900/20"
                                        : darkMode
                                          ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm",
                                    )}
                                  >
                                    <CircleDot
                                      className={cn(
                                        "w-3 h-3",
                                        currentMedicalRecord.cl_os?.sph ||
                                          currentMedicalRecord.cl_os?.base
                                          ? "text-white fill-white/20"
                                          : "text-rose-500 fill-rose-500/20",
                                      )}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-wider">
                                      Lentilă Contact
                                    </span>
                                  </button>
                                  {(currentMedicalRecord.cl_os?.sph ||
                                    currentMedicalRecord.cl_os?.base) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          cl_os: undefined,
                                        });
                                      }}
                                      className={cn(
                                        "absolute -top-1 -right-1 p-0.5 rounded-full border shadow-sm z-10 transition-colors",
                                        darkMode
                                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-rose-600 hover:text-white"
                                          : "bg-white border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white",
                                      )}
                                    >
                                      <X size={8} />
                                    </button>
                                  )}
                                </div>
                              )}

                              {(() => {
                                const age =
                                  currentMedicalRecord.patientBirthDate
                                    ? calculateAge(
                                        currentMedicalRecord.patientBirthDate,
                                      )
                                    : currentMedicalRecord.patientAge;
                                const showAddBtn = (age || 0) < 35;
                                if (!showAddBtn) return null;
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForceShowAddition(!forceShowAddition)
                                    }
                                    className={cn(
                                      "flex items-center justify-start gap-1 px-2 py-1 rounded-lg transition-all border shrink-0 w-fit",
                                      forceShowAddition
                                        ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/20"
                                        : darkMode
                                          ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm",
                                    )}
                                    title={
                                      forceShowAddition
                                        ? "Ascunde câmpul de adiție"
                                        : "Adaugă câmpul de adiție pe rețetă"
                                    }
                                  >
                                    <Plus
                                      className={cn(
                                        "w-3 h-3 text-emerald-500 transition-transform",
                                        forceShowAddition &&
                                          "rotate-45 text-white",
                                      )}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-wider">
                                      {forceShowAddition
                                        ? "Adiție Activă"
                                        : "Adiție"}
                                    </span>
                                  </button>
                                );
                              })()}
                            </div>
                          </div>

                          {currentMedicalRecord && (
                            <div className="relative flex flex-col items-center w-full">
                              <Protractor
                                axis={currentMedicalRecord.os.axis}
                                color="emerald"
                              />
                            </div>
                          )}

                          <div
                            className={cn(
                              "grid gap-1 w-full",
                              (() => {
                                const age =
                                  currentMedicalRecord.patientBirthDate
                                    ? calculateAge(
                                        currentMedicalRecord.patientBirthDate,
                                      )
                                    : currentMedicalRecord.patientAge;
                                return (age || 0) >= 35 || forceShowAddition
                                  ? "grid-cols-[1fr_1.2fr_0.8fr_1.2fr]"
                                  : "grid-cols-[0.8fr_1.2fr_0.8fr]";
                              })(),
                            )}
                          >
                            {["sph", "cyl", "axis", "add"]
                              .filter((field) => {
                                if (field === "add") {
                                  const age =
                                    currentMedicalRecord.patientBirthDate
                                      ? calculateAge(
                                          currentMedicalRecord.patientBirthDate,
                                        )
                                      : currentMedicalRecord.patientAge;
                                  return (age || 0) >= 35 || forceShowAddition;
                                }
                                return true;
                              })
                              .map((field) => (
                                <div key={`os-${field}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <label
                                      className={cn(
                                        "block text-[20px] font-black uppercase tracking-tighter",
                                        darkMode ? "text-white" : "text-black",
                                      )}
                                    >
                                      {field}
                                    </label>
                                    {field === "add" && (() => {
                                      const pAge = currentMedicalRecord.patientBirthDate
                                        ? calculateAge(currentMedicalRecord.patientBirthDate)
                                        : (currentMedicalRecord.patientAge ? parseInt(String(currentMedicalRecord.patientAge), 10) : undefined);
                                      const est = getEstimatedAddByAge(pAge);
                                      const cleanEst = est ? est.replace("+", "") : null;
                                      if (!cleanEst) return null;
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedOS = {
                                              ...currentMedicalRecord.os,
                                              add: cleanEst,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            const updatedOD = {
                                              ...currentMedicalRecord.od,
                                              add: cleanEst,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              os: updatedOS,
                                              od: updatedOD,
                                              diagnostic: updateDiagnosticSuggestions(
                                                currentMedicalRecord.diagnostic || "",
                                                updatedOD,
                                                updatedOS,
                                              ),
                                            });
                                          }}
                                          className={cn(
                                            "text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded transition-all cursor-pointer",
                                            currentMedicalRecord.os?.add === cleanEst
                                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                              : "bg-blue-500/10 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400"
                                          )}
                                          title={`Vârstă ${pAge} ani: sugestie fiziologică estimată +${cleanEst}. Click pentru aplicare rapidă.`}
                                        >
                                          💡 +{cleanEst} ({pAge} ani)
                                        </button>
                                      );
                                    })()}
                                  </div>
                                  {field === "add" ? (
                                    <select
                                      ref={osAddRef}
                                      value={currentMedicalRecord.os.add}
                                      onChange={(e) => {
                                        const newVal = e.target.value;
                                        const updatedOS = {
                                          ...currentMedicalRecord.os,
                                          add: newVal,
                                          near_sph: undefined,
                                          near_cyl: undefined,
                                          near_axis: undefined,
                                        };
                                        const updatedOD = {
                                          ...currentMedicalRecord.od,
                                          add:
                                            currentMedicalRecord.od.add ||
                                            newVal,
                                          near_sph: undefined,
                                          near_cyl: undefined,
                                          near_axis: undefined,
                                        };
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: updatedOS,
                                          od: updatedOD,
                                          diagnostic:
                                            updateDiagnosticSuggestions(
                                              currentMedicalRecord.diagnostic ||
                                                "",
                                              updatedOD,
                                              updatedOS,
                                            ),
                                        });
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-base font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none",
                                        darkMode
                                          ? "bg-white border-slate-700 text-black"
                                          : "bg-white border-slate-300 text-slate-900",
                                      )}
                                    >
                                      <option value="">-</option>
                                      {[
                                        "4.00",
                                        "3.75",
                                        "3.50",
                                        "3.25",
                                        "3.00",
                                        "2.75",
                                        "2.50",
                                        "2.25",
                                        "2.00",
                                        "1.75",
                                        "1.50",
                                        "1.25",
                                        "1.00",
                                        "0.75",
                                        "0.50",
                                        "0.25",
                                        "0.00",
                                      ].map((val) => {
                                        const pAge = currentMedicalRecord.patientBirthDate
                                          ? calculateAge(currentMedicalRecord.patientBirthDate)
                                          : (currentMedicalRecord.patientAge ? parseInt(String(currentMedicalRecord.patientAge), 10) : undefined);
                                        const est = getEstimatedAddByAge(pAge);
                                        const cleanEst = est ? est.replace("+", "") : null;
                                        const isSug = cleanEst === val;
                                        return (
                                          <option key={`os-add-${val}`} value={val}>
                                            {val} {isSug ? `(💡 Sugerat - ${pAge} ani)` : ""}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  ) : (
                                    <input
                                      ref={
                                        field === "sph"
                                          ? osSphRef
                                          : field === "cyl"
                                            ? osCylRef
                                            : osAxisRef
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Tab" && !e.shiftKey) {
                                          if (field === "sph") {
                                            e.preventDefault();
                                            osCylRef.current?.focus();
                                          } else if (field === "cyl") {
                                            e.preventDefault();
                                            osAxisRef.current?.focus();
                                          } else if (field === "axis") {
                                            const age =
                                              currentMedicalRecord.patientBirthDate
                                                ? calculateAge(
                                                    currentMedicalRecord.patientBirthDate,
                                                  )
                                                : currentMedicalRecord.patientAge;
                                            if ((age || 0) >= 35) {
                                              e.preventDefault();
                                              osAddRef.current?.focus();
                                            }
                                          }
                                        }
                                      }}
                                      type="text"
                                      value={(() => {
                                        if (field === "axis") {
                                          const cylVal =
                                            currentMedicalRecord.os.cyl;
                                          const isZeroOrEmpty =
                                            !cylVal ||
                                            parseFloat(
                                              String(cylVal).replace(",", "."),
                                            ) === 0;
                                          if (isZeroOrEmpty) return "";
                                        }
                                        return (
                                          currentMedicalRecord.os[
                                            field as keyof EyePrescription
                                          ] || ""
                                        );
                                      })()}
                                      disabled={
                                        field === "axis" &&
                                        (() => {
                                          const cylVal =
                                            currentMedicalRecord.os.cyl;
                                          return (
                                            !cylVal ||
                                            parseFloat(
                                              String(cylVal).replace(",", "."),
                                            ) === 0
                                          );
                                        })()
                                      }
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (field === "axis") {
                                          val = val.replace(/\D/g, "");
                                          if (val !== "" && parseInt(val) > 180)
                                            val = "180";
                                        } else if (
                                          field === "sph" ||
                                          field === "cyl"
                                        ) {
                                          val = val.replace(/[^0-9.,+-]/g, "").replace(",", ".");
                                        }
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: (() => {
                                            const updatedOS = {
                                              ...currentMedicalRecord.os,
                                              [field]: val,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            if (field === "cyl") {
                                              const parsed =
                                                parseFloat(
                                                  String(val).replace(",", "."),
                                                ) || 0;
                                              if (val === "" || parsed === 0) {
                                                updatedOS.axis = "";
                                              }
                                            }
                                            return updatedOS;
                                          })(),
                                        });
                                      }}
                                      onBlur={(e) => {
                                        if (
                                          (field === "sph" ||
                                            field === "cyl") &&
                                          e.target.value
                                        ) {
                                          let val = e.target.value.trim();
                                          let num = parseFloat(val);
                                          if (!isNaN(num)) {
                                            num = Math.round(num * 4) / 4;
                                            if (field === "sph") {
                                              num = Math.max(
                                                -25,
                                                Math.min(22, num),
                                              );
                                            } else {
                                              num = Math.max(
                                                -7,
                                                Math.min(7, num),
                                              );
                                            }
                                            const sign = num >= 0 ? "+" : "";
                                            const formatted = `${sign}${num.toFixed(2)}`;
                                            const parsedNum =
                                              parseFloat(formatted) || 0;
                                            const updatedOS = {
                                              ...currentMedicalRecord.os,
                                              [field]: formatted,
                                              near_sph: undefined,
                                              near_cyl: undefined,
                                              near_axis: undefined,
                                            };
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              os: (() => {
                                                if (
                                                  field === "cyl" &&
                                                  parsedNum === 0
                                                ) {
                                                  updatedOS.axis = "";
                                                }
                                                return updatedOS;
                                              })(),
                                              diagnostic:
                                                updateDiagnosticSuggestions(
                                                  currentMedicalRecord.diagnostic ||
                                                    "",
                                                  currentMedicalRecord.od,
                                                  updatedOS,
                                                ),
                                            });
                                          }
                                        } else if (field === "axis") {
                                          setCurrentMedicalRecord({
                                            ...currentMedicalRecord,
                                            diagnostic:
                                              updateDiagnosticSuggestions(
                                                currentMedicalRecord.diagnostic ||
                                                  "",
                                                currentMedicalRecord.od,
                                                currentMedicalRecord.os,
                                              ),
                                          });
                                        }
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-base font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                        darkMode
                                          ? "bg-white border-slate-700 text-black"
                                          : "bg-white border-slate-300 text-slate-900",
                                      )}
                                    />
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* Customizable Near Vision Diopters Section (OS) */}
                          {currentMedicalRecord.os.add && (
                            <div
                              className={cn(
                                "mt-4 w-full p-3 rounded-xl border transition-all",
                                darkMode
                                  ? "bg-slate-900 border-slate-800"
                                  : "bg-blue-50/40 border-blue-100 shadow-sm",
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={cn(
                                    "block text-[11px] font-bold uppercase tracking-wider",
                                    darkMode
                                      ? "text-blue-400"
                                      : "text-blue-700",
                                  )}
                                >
                                  Aproape OS
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label
                                    className={cn(
                                      "block text-[10px] font-black uppercase mb-1",
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-600",
                                    )}
                                  >
                                    Near SPH
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={calculateNearSphereDefault(
                                      currentMedicalRecord.os.sph,
                                      currentMedicalRecord.os.add,
                                    )}
                                    value={
                                      currentMedicalRecord.os.near_sph !==
                                      undefined
                                        ? currentMedicalRecord.os.near_sph
                                        : calculateNearSphereDefault(
                                              currentMedicalRecord.os.sph,
                                              currentMedicalRecord.os.add,
                                            ) === "-"
                                          ? ""
                                          : calculateNearSphereDefault(
                                              currentMedicalRecord.os.sph,
                                              currentMedicalRecord.os.add,
                                            )
                                    }
                                    onChange={(e) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.,+-]/g,
                                        "",
                                      ).replace(",", ".");
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        os: {
                                          ...currentMedicalRecord.os,
                                          near_sph: val,
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (!val) {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: {
                                            ...currentMedicalRecord.os,
                                            near_sph: "",
                                          },
                                        });
                                        return;
                                      }
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        num = Math.max(-25, Math.min(22, num));
                                        const sign = num >= 0 ? "+" : "";
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: {
                                            ...currentMedicalRecord.os,
                                            near_sph: `${sign}${num.toFixed(2)}`,
                                          },
                                        });
                                      }
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-center",
                                      darkMode
                                        ? "bg-white border-slate-700 text-black animate-none"
                                        : "bg-white border-slate-300 text-slate-900 animate-none",
                                    )}
                                  />
                                </div>
                                <div>
                                  <label
                                    className={cn(
                                      "block text-[10px] font-black uppercase mb-1",
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-600",
                                    )}
                                  >
                                    Near CYL
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={(() => {
                                      const addNum =
                                        parseFloat(
                                          String(
                                            currentMedicalRecord.os.add || "0",
                                          ).replace(",", "."),
                                        ) || 0;
                                      if (
                                        !currentMedicalRecord.os.add ||
                                        addNum === 0
                                      )
                                        return "-";
                                      return currentMedicalRecord.os.cyl || "-";
                                    })()}
                                    value={
                                      currentMedicalRecord.os.near_cyl !==
                                      undefined
                                        ? currentMedicalRecord.os.near_cyl
                                        : (() => {
                                            const addNum =
                                              parseFloat(
                                                String(
                                                  currentMedicalRecord.os.add ||
                                                    "0",
                                                ).replace(",", "."),
                                              ) || 0;
                                            if (
                                              !currentMedicalRecord.os.add ||
                                              addNum === 0
                                            )
                                              return "";
                                            return (
                                              currentMedicalRecord.os.cyl || ""
                                            );
                                          })()
                                    }
                                    onChange={(e) => {
                                      let val = e.target.value.replace(
                                        /[^0-9.,+-]/g,
                                        "",
                                      ).replace(",", ".");
                                      const parsed =
                                        parseFloat(
                                          String(val).replace(",", "."),
                                        ) || 0;
                                      const isZeroOrEmpty =
                                        !val || parsed === 0;
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        os: {
                                          ...currentMedicalRecord.os,
                                          near_cyl: val,
                                          near_axis: isZeroOrEmpty
                                            ? ""
                                            : currentMedicalRecord.os
                                                  .near_axis !== undefined
                                              ? currentMedicalRecord.os
                                                  .near_axis
                                              : currentMedicalRecord.os.axis ||
                                                "",
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      let val = e.target.value.trim();
                                      if (!val) {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: {
                                            ...currentMedicalRecord.os,
                                            near_cyl: "",
                                            near_axis: "",
                                          },
                                        });
                                        return;
                                      }
                                      let num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        num = Math.round(num * 4) / 4;
                                        num = Math.max(-7, Math.min(7, num));
                                        const sign = num >= 0 ? "+" : "";
                                        const formatted = `${sign}${num.toFixed(2)}`;
                                        const parsedNum =
                                          parseFloat(formatted) || 0;
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: {
                                            ...currentMedicalRecord.os,
                                            near_cyl: formatted,
                                            near_axis:
                                              parsedNum === 0
                                                ? ""
                                                : currentMedicalRecord.os
                                                      .near_axis !== undefined
                                                  ? currentMedicalRecord.os
                                                      .near_axis
                                                  : currentMedicalRecord.os
                                                      .axis || "",
                                          },
                                        });
                                      }
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-center",
                                      darkMode
                                        ? "bg-white border-slate-700 text-black animate-none"
                                        : "bg-white border-slate-300 text-slate-900 animate-none",
                                    )}
                                  />
                                </div>
                                <div>
                                  <label
                                    className={cn(
                                      "block text-[10px] font-black uppercase mb-1",
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-600",
                                    )}
                                  >
                                    Near AXIS
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={(() => {
                                      const addNum =
                                        parseFloat(
                                          String(
                                            currentMedicalRecord.os.add || "0",
                                          ).replace(",", "."),
                                        ) || 0;
                                      if (
                                        !currentMedicalRecord.os.add ||
                                        addNum === 0
                                      )
                                        return "-";
                                      const effectiveNearCyl =
                                        currentMedicalRecord.os.near_cyl !==
                                        undefined
                                          ? currentMedicalRecord.os.near_cyl
                                          : currentMedicalRecord.os.cyl;
                                      const isNearCylZeroOrEmpty =
                                        !effectiveNearCyl ||
                                        parseFloat(
                                          String(effectiveNearCyl).replace(
                                            ",",
                                            ".",
                                          ),
                                        ) === 0;
                                      if (isNearCylZeroOrEmpty) return "-";
                                      return (
                                        currentMedicalRecord.os.axis || "-"
                                      );
                                    })()}
                                    value={(() => {
                                      const effectiveNearCyl =
                                        currentMedicalRecord.os.near_cyl !==
                                        undefined
                                          ? currentMedicalRecord.os.near_cyl
                                          : currentMedicalRecord.os.cyl;
                                      const isNearCylZeroOrEmpty =
                                        !effectiveNearCyl ||
                                        parseFloat(
                                          String(effectiveNearCyl).replace(
                                            ",",
                                            ".",
                                          ),
                                        ) === 0;
                                      if (isNearCylZeroOrEmpty) return "";
                                      return currentMedicalRecord.os
                                        .near_axis !== undefined
                                        ? currentMedicalRecord.os.near_axis
                                        : (() => {
                                            const addNum =
                                              parseFloat(
                                                String(
                                                  currentMedicalRecord.os.add ||
                                                    "0",
                                                ).replace(",", "."),
                                              ) || 0;
                                            if (
                                              !currentMedicalRecord.os.add ||
                                              addNum === 0
                                            )
                                              return "";
                                            return (
                                              currentMedicalRecord.os.axis || ""
                                            );
                                          })();
                                    })()}
                                    disabled={(() => {
                                      const effectiveNearCyl =
                                        currentMedicalRecord.os.near_cyl !==
                                        undefined
                                          ? currentMedicalRecord.os.near_cyl
                                          : currentMedicalRecord.os.cyl;
                                      return (
                                        !effectiveNearCyl ||
                                        parseFloat(
                                          String(effectiveNearCyl).replace(
                                            ",",
                                            ".",
                                          ),
                                        ) === 0
                                      );
                                    })()}
                                    onChange={(e) => {
                                      let val = e.target.value.replace(
                                        /\D/g,
                                        "",
                                      );
                                      if (val !== "" && parseInt(val) > 180) {
                                        val = "180";
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        os: {
                                          ...currentMedicalRecord.os,
                                          near_axis: val,
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      let val = e.target.value.replace(
                                        /\D/g,
                                        "",
                                      );
                                      if (val === "") {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: {
                                            ...currentMedicalRecord.os,
                                            near_axis: "",
                                          },
                                        });
                                        return;
                                      }
                                      let n = parseInt(val);
                                      if (!isNaN(n)) {
                                        if (n > 180) n = 180;
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          os: {
                                            ...currentMedicalRecord.os,
                                            near_axis: n.toString(),
                                          },
                                        });
                                      }
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-center",
                                      darkMode
                                        ? "bg-white border-slate-700 text-black animate-none"
                                        : "bg-white border-slate-300 text-slate-900 animate-none",
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Visual Acuity OS (Always Visible) */}
                          <div
                            className={cn(
                              "mt-4 grid grid-cols-2 gap-4 w-full p-3 rounded-xl border transition-all",
                              darkMode
                                ? "bg-emerald-950/30 border-emerald-800/60"
                                : "bg-[#fffef0] border-amber-200/80 shadow-sm",
                            )}
                            style={darkMode ? undefined : { backgroundColor: "#fffef0" }}
                          >
                            <div className="col-span-2 text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-1.5">
                              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Acuitate Vizuală OS
                            </div>
                            <div>
                              <label
                                className={cn(
                                  "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                  darkMode ? "text-white" : "text-black",
                                )}
                              >
                                AV Fără Corecție
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.os.va_without || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    os: {
                                      ...currentMedicalRecord.os,
                                      va_without: e.target.value,
                                    },
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all",
                                  darkMode
                                    ? "bg-white border-slate-700 text-black"
                                    : "bg-white border-slate-300 text-slate-900",
                                )}
                              />
                            </div>
                            <div>
                              <label
                                className={cn(
                                  "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                  darkMode ? "text-white" : "text-black",
                                )}
                              >
                                AV Cu Corecție
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.os.va_with || ""}
                                onChange={(e) => {
                                  const updatedOS = {
                                    ...currentMedicalRecord.os,
                                    va_with: e.target.value,
                                  };
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    os: updatedOS,
                                    diagnostic: updateDiagnosticSuggestions(
                                      currentMedicalRecord.diagnostic || "",
                                      currentMedicalRecord.od,
                                      updatedOS,
                                    ),
                                  });
                                }}
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all",
                                  darkMode
                                    ? "bg-white border-slate-700 text-black"
                                    : "bg-white border-slate-300 text-slate-900",
                                )}
                              />
                            </div>
                          </div>

                          {/* IOP, CCT, Corrected IOP OS */}
                          <div
                            className={cn(
                              "mt-2 grid grid-cols-1 gap-2 w-full p-3 rounded-xl border transition-all",
                              darkMode
                                ? "bg-slate-900 border-slate-800"
                                : "bg-white border-slate-200 shadow-sm",
                            )}
                          >
                            <div>
                              <label
                                className={cn(
                                  "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                  darkMode ? "text-white" : "text-black",
                                )}
                              >
                                Tensiune Oculară (OS)
                              </label>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={currentMedicalRecord.iop?.os || ""}
                                    onChange={(e) => {
                                      let iopVal = e.target.value;
                                      iopVal = iopVal
                                        .replace(/[^0-9.,]/g, "")
                                        .replace(",", ".");

                                      const parts = iopVal.split(".");
                                      if (parts[0].length > 2) {
                                        parts[0] = parts[0].substring(0, 2);
                                        iopVal = parts.join(".");
                                      }

                                      const num = parseFloat(iopVal);
                                      if (!isNaN(num) && num > 90) {
                                        iopVal = "90";
                                      }

                                      const cctVal =
                                        currentMedicalRecord.pachymetry?.os ||
                                        "";
                                      let corrected = "";
                                      if (iopVal && cctVal) {
                                        const iop = parseFloat(iopVal);
                                        const cct = parseFloat(cctVal);
                                        if (!isNaN(iop) && !isNaN(cct)) {
                                          corrected = (
                                            iop +
                                            (545 - cct) * 0.05
                                          ).toFixed(1);
                                        }
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        iop: {
                                          ...(currentMedicalRecord.iop || {
                                            od: "",
                                            os: "",
                                          }),
                                          os: iopVal,
                                        },
                                        correctedIop: {
                                          ...(currentMedicalRecord.correctedIop || {
                                            od: "",
                                            os: "",
                                          }),
                                          os:
                                            corrected ||
                                            currentMedicalRecord.correctedIop
                                              ?.os ||
                                            "",
                                        },
                                      });
                                    }}
                                    className={getIopInputClass(
                                      currentMedicalRecord.iop?.os,
                                      false,
                                    )}
                                    placeholder="mmHg"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={
                                      currentMedicalRecord.pachymetry?.os || ""
                                    }
                                    onChange={(e) => {
                                      const cctVal = e.target.value;
                                      const iopVal =
                                        currentMedicalRecord.iop?.os || "";
                                      let corrected = "";
                                      if (iopVal && cctVal) {
                                        const iop = parseFloat(iopVal);
                                        const cct = parseFloat(cctVal);
                                        if (!isNaN(iop) && !isNaN(cct)) {
                                          corrected = (
                                            iop +
                                            (545 - cct) * 0.05
                                          ).toFixed(1);
                                        }
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        pachymetry: {
                                          ...(currentMedicalRecord.pachymetry || {
                                            od: "",
                                            os: "",
                                          }),
                                          os: cctVal,
                                        },
                                        correctedIop: {
                                          ...(currentMedicalRecord.correctedIop || {
                                            od: "",
                                            os: "",
                                          }),
                                          os:
                                            corrected ||
                                            currentMedicalRecord.correctedIop
                                              ?.os ||
                                            "",
                                        },
                                      });
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-white"
                                        : "bg-white border-slate-300 text-slate-900",
                                    )}
                                    placeholder="CCT (µm)"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={
                                      currentMedicalRecord.correctedIop?.os ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        correctedIop: {
                                          ...(currentMedicalRecord.correctedIop || {
                                            od: "",
                                            os: "",
                                          }),
                                          os: e.target.value,
                                        },
                                      })
                                    }
                                    className={getIopInputClass(
                                      currentMedicalRecord.correctedIop?.os,
                                      false,
                                    )}
                                    placeholder="Corectată"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Axial Length OS Dropdown */}
                          {(() => {
                            const age = currentMedicalRecord.patientBirthDate
                              ? calculateAge(
                                  currentMedicalRecord.patientBirthDate,
                                )
                              : currentMedicalRecord.patientAge;
                            if ((age || 0) >= 1 && (age || 0) <= 25) {
                              return (
                                <div className="mt-2 w-full">
                                  <button
                                    onClick={() =>
                                      setIsVaAlExpanded(!isVaAlExpanded)
                                    }
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed transition-all w-full",
                                      darkMode
                                        ? "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                                        : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50",
                                    )}
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "w-3.5 h-3.5 transition-transform duration-300",
                                        isVaAlExpanded && "rotate-180",
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        darkMode
                                          ? "text-white"
                                          : "text-slate-500",
                                      )}
                                    >
                                      Lungime Axială
                                    </span>
                                  </button>

                                  {isVaAlExpanded && (
                                    <div
                                      className={cn(
                                        "mt-2 w-full p-3 rounded-xl border transition-all",
                                        darkMode
                                          ? "bg-slate-900 border-slate-800"
                                          : "bg-white border-slate-200 shadow-sm",
                                      )}
                                    >
                                      <div>
                                        <label
                                          className={cn(
                                            "block text-[10px] font-black uppercase mb-1 tracking-wider",
                                            darkMode
                                              ? "text-white"
                                              : "text-black",
                                          )}
                                        >
                                          Lungime Axială (OS)
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            currentMedicalRecord.axialLength
                                              ?.os || ""
                                          }
                                          onChange={(e) => {
                                            const sanitized =
                                              sanitizeAxialLengthInput(
                                                e.target.value,
                                              );
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              axialLength: {
                                                ...(currentMedicalRecord.axialLength || {
                                                  od: "",
                                                  os: "",
                                                }),
                                                os: sanitized,
                                              },
                                            });
                                          }}
                                          onBlur={(e) => {
                                            const validated =
                                              validateAxialLengthOnBlur(
                                                e.target.value,
                                              );
                                            setCurrentMedicalRecord({
                                              ...currentMedicalRecord,
                                              axialLength: {
                                                ...(currentMedicalRecord.axialLength || {
                                                  od: "",
                                                  os: "",
                                                }),
                                                os: validated,
                                              },
                                            });
                                          }}
                                          className={cn(
                                            "w-full p-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all",
                                            darkMode
                                              ? "bg-slate-900 border-slate-700 text-white"
                                              : "bg-white border-slate-300 text-slate-900",
                                          )}
                                          placeholder={`Ex: ${getExpectedAxialLength(currentMedicalRecord.patientBirthDate, currentMedicalRecord.patientAge, currentMedicalRecord.patientSex)} mm`}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      {/* Examen Obiectiv Suplimentar (Collapsible) */}
                      <div
                        className={cn(
                          "p-4 rounded-2xl border transition-all mb-4",
                          darkMode
                            ? "bg-slate-800/40 border-slate-700/60 shadow-lg shadow-black/10"
                            : "bg-slate-50 border-slate-200 shadow-sm",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setIsObjectiveExamExpanded(!isObjectiveExamExpanded)
                          }
                          className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center justify-between w-full text-left cursor-pointer group select-none"
                        >
                          <span className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Examen Obiectiv Suplimentar
                          </span>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform duration-300 transform",
                              isObjectiveExamExpanded && "rotate-180",
                            )}
                          />
                        </button>

                        {isObjectiveExamExpanded && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 mt-4">
                            {/* Pol Anterior */}
                            <div
                              className={cn(
                                "p-3 rounded-xl border transition-all space-y-2 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3",
                                darkMode
                                  ? "bg-slate-800/40 border-slate-700"
                                  : "bg-slate-50 border-slate-200",
                              )}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <label
                                  className={cn(
                                    "block text-[10px] font-bold uppercase tracking-wider",
                                    darkMode
                                      ? "text-slate-100"
                                      : "text-slate-500",
                                  )}
                                >
                                  Pol Anterior
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={!!currentMedicalRecord.anteriorSegmentAo}
                                    onChange={(e) => {
                                      const isAo = e.target.checked;
                                      const currentOd = currentMedicalRecord.anteriorSegment?.od || "";
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        anteriorSegmentAo: isAo,
                                        anteriorSegment: {
                                          od: currentOd,
                                          os: isAo ? currentOd : (currentMedicalRecord.anteriorSegment?.os || ""),
                                        }
                                      });
                                    }}
                                    className="accent-amber-500 w-3.5 h-3.5 rounded"
                                  />
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider",
                                    darkMode ? "text-slate-300" : "text-slate-600"
                                  )}>
                                    AO (Ambi Ochi)
                                  </span>
                                </label>
                              </div>

                              {currentMedicalRecord.anteriorSegmentAo ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center ml-1">
                                    <span
                                      className={cn(
                                        "text-[8px] font-bold uppercase block",
                                        darkMode
                                          ? "text-slate-100"
                                          : "text-slate-400",
                                      )}
                                    >
                                      Ambi Ochi (AO)
                                    </span>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const selectedVal = e.target.value;
                                        if (!selectedVal) return;
                                        const currentVal = currentMedicalRecord.anteriorSegment?.od || "";
                                        const newVal = currentVal ? `${currentVal}, ${selectedVal}` : selectedVal;
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          anteriorSegment: {
                                            od: capitalizeFirstLetter(newVal),
                                            os: capitalizeFirstLetter(newVal),
                                          }
                                        });
                                      }}
                                      className={cn(
                                        "text-[10px] px-1 py-0.5 border rounded focus:ring-1 focus:ring-amber-500 outline-none max-w-xs font-semibold leading-none",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-slate-100"
                                          : "bg-white border-slate-200 text-slate-700"
                                      )}
                                    >
                                      <option value="">+ Valoare predefinită...</option>
                                      {anteriorSegmentOptionsState.map((opt) => (
                                        <option key={`ant-os-${opt}`} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <BufferedTextarea
                                    placeholder="Valoare AO..."
                                    value={
                                      currentMedicalRecord.anteriorSegment?.od || ""
                                    }
                                    onChange={(val) => {
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        anteriorSegment: {
                                          od: capitalizeFirstLetter(val),
                                          os: capitalizeFirstLetter(val),
                                        },
                                      });
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 min-h-[96px] resize-none overflow-hidden",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-slate-100"
                                        : "bg-white border-slate-200 text-slate-900",
                                    )}
                                  />
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center ml-1">
                                      <span
                                        className={cn(
                                          "text-[8px] font-bold uppercase",
                                          darkMode
                                            ? "text-slate-100"
                                            : "text-slate-400",
                                        )}
                                      >
                                        Ochi Drept
                                      </span>
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const selectedVal = e.target.value;
                                          if (!selectedVal) return;
                                          const currentVal = currentMedicalRecord.anteriorSegment?.od || "";
                                          const newVal = currentVal ? `${currentVal}, ${selectedVal}` : selectedVal;
                                          setCurrentMedicalRecord({
                                            ...currentMedicalRecord,
                                            anteriorSegment: {
                                              ...currentMedicalRecord.anteriorSegment,
                                              od: capitalizeFirstLetter(newVal),
                                            }
                                          });
                                        }}
                                        className={cn(
                                          "text-[10px] px-1 py-0.5 border rounded focus:ring-1 focus:ring-amber-500 outline-none max-w-xs font-semibold leading-none",
                                          darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-700"
                                        )}
                                      >
                                        <option value="">+ Valoare predefinită...</option>
                                        {anteriorSegmentOptionsState.map((opt) => (
                                          <option key={`post-ao-${opt}`} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <BufferedTextarea
                                      placeholder="Valoare OD..."
                                      value={
                                        currentMedicalRecord.anteriorSegment
                                          ?.od || ""
                                      }
                                      onChange={(val) => {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          anteriorSegment: {
                                            ...currentMedicalRecord.anteriorSegment,
                                            od: capitalizeFirstLetter(val),
                                          },
                                        });
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 min-h-[96px] resize-none overflow-hidden",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-slate-100"
                                          : "bg-white border-slate-200 text-slate-900",
                                      )}
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center ml-1">
                                      <span
                                        className={cn(
                                          "text-[8px] font-bold uppercase",
                                          darkMode
                                            ? "text-slate-100"
                                            : "text-slate-400",
                                        )}
                                      >
                                        Ochi Stâng
                                      </span>
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const selectedVal = e.target.value;
                                          if (!selectedVal) return;
                                          const currentVal = currentMedicalRecord.anteriorSegment?.os || "";
                                          const newVal = currentVal ? `${currentVal}, ${selectedVal}` : selectedVal;
                                          setCurrentMedicalRecord({
                                            ...currentMedicalRecord,
                                            anteriorSegment: {
                                              ...currentMedicalRecord.anteriorSegment,
                                              os: capitalizeFirstLetter(newVal),
                                            }
                                          });
                                        }}
                                        className={cn(
                                          "text-[10px] px-1 py-0.5 border rounded focus:ring-1 focus:ring-amber-500 outline-none max-w-xs font-semibold leading-none",
                                          darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-700"
                                        )}
                                      >
                                        <option value="">+ Valoare predefinită...</option>
                                        {anteriorSegmentOptionsState.map((opt) => (
                                          <option key={`post-od-${opt}`} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <BufferedTextarea
                                      placeholder="Valoare OS..."
                                      value={
                                        currentMedicalRecord.anteriorSegment
                                          ?.os || ""
                                      }
                                      onChange={(val) => {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          anteriorSegment: {
                                            ...currentMedicalRecord.anteriorSegment,
                                            os: capitalizeFirstLetter(val),
                                          },
                                        });
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 min-h-[96px] resize-none overflow-hidden",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-slate-100"
                                          : "bg-white border-slate-200 text-slate-900",
                                      )}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Pol Posterior */}
                            <div
                              className={cn(
                                "p-3 rounded-xl border transition-all space-y-2 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3",
                                darkMode
                                  ? "bg-slate-800/40 border-slate-700"
                                  : "bg-slate-50 border-slate-200",
                              )}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <label
                                  className={cn(
                                    "block text-[10px] font-bold uppercase tracking-wider",
                                    darkMode
                                      ? "text-slate-100"
                                      : "text-slate-500",
                                  )}
                                >
                                  Pol Posterior (Examen fund de ochi)
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={!!currentMedicalRecord.posteriorSegmentAo}
                                    onChange={(e) => {
                                      const isAo = e.target.checked;
                                      const currentOd = currentMedicalRecord.posteriorSegment?.od || "";
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        posteriorSegmentAo: isAo,
                                        posteriorSegment: {
                                          od: currentOd,
                                          os: isAo ? currentOd : (currentMedicalRecord.posteriorSegment?.os || ""),
                                        }
                                      });
                                    }}
                                    className="accent-amber-500 w-3.5 h-3.5 rounded"
                                  />
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider",
                                    darkMode ? "text-slate-300" : "text-slate-600"
                                  )}>
                                    AO (Ambi Ochi)
                                  </span>
                                </label>
                              </div>

                              {currentMedicalRecord.posteriorSegmentAo ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center ml-1">
                                    <span
                                      className={cn(
                                        "text-[8px] font-bold uppercase block",
                                        darkMode
                                          ? "text-slate-100"
                                          : "text-slate-400",
                                      )}
                                    >
                                      Ambi Ochi (AO)
                                    </span>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const selectedVal = e.target.value;
                                        if (!selectedVal) return;
                                        const currentVal = currentMedicalRecord.posteriorSegment?.od || "";
                                        const newVal = currentVal ? `${currentVal}, ${selectedVal}` : selectedVal;
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          posteriorSegment: {
                                            od: capitalizeFirstLetter(newVal),
                                            os: capitalizeFirstLetter(newVal),
                                          }
                                        });
                                      }}
                                      className={cn(
                                        "text-[10px] px-1 py-0.5 border rounded focus:ring-1 focus:ring-amber-500 outline-none max-w-xs font-semibold leading-none",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-slate-100"
                                          : "bg-white border-slate-200 text-slate-700"
                                      )}
                                    >
                                      <option value="">+ Valoare predefinită...</option>
                                      {posteriorSegmentOptionsState.map((opt) => (
                                        <option key={`post-os-${opt}`} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <BufferedTextarea
                                    placeholder="Valoare AO..."
                                    value={
                                      currentMedicalRecord.posteriorSegment?.od || ""
                                    }
                                    onChange={(val) => {
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        posteriorSegment: {
                                          od: capitalizeFirstLetter(val),
                                          os: capitalizeFirstLetter(val),
                                        },
                                      });
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 min-h-[96px] resize-none overflow-hidden",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-slate-100"
                                        : "bg-white border-slate-200 text-slate-900",
                                    )}
                                  />
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center ml-1">
                                      <span
                                        className={cn(
                                          "text-[8px] font-bold uppercase",
                                          darkMode
                                            ? "text-slate-100"
                                            : "text-slate-400",
                                        )}
                                      >
                                        Ochi Drept
                                      </span>
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const selectedVal = e.target.value;
                                          if (!selectedVal) return;
                                          const currentVal = currentMedicalRecord.posteriorSegment?.od || "";
                                          const newVal = currentVal ? `${currentVal}, ${selectedVal}` : selectedVal;
                                          setCurrentMedicalRecord({
                                            ...currentMedicalRecord,
                                            posteriorSegment: {
                                              ...currentMedicalRecord.posteriorSegment,
                                              od: capitalizeFirstLetter(newVal),
                                            }
                                          });
                                        }}
                                        className={cn(
                                          "text-[10px] px-1 py-0.5 border rounded focus:ring-1 focus:ring-amber-500 outline-none max-w-xs font-semibold leading-none",
                                          darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-700"
                                        )}
                                      >
                                        <option value="">+ Valoare predefinită...</option>
                                        {posteriorSegmentOptionsState.map((opt) => (
                                          <option key={`opt-6-${opt}`} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <BufferedTextarea
                                      placeholder="Valoare OD..."
                                      value={
                                        currentMedicalRecord.posteriorSegment
                                          ?.od || ""
                                      }
                                      onChange={(val) => {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          posteriorSegment: {
                                            ...currentMedicalRecord.posteriorSegment,
                                            od: capitalizeFirstLetter(val),
                                          },
                                        });
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 min-h-[96px] resize-none overflow-hidden",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-slate-100"
                                          : "bg-white border-slate-200 text-slate-900",
                                      )}
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center ml-1">
                                      <span
                                        className={cn(
                                          "text-[8px] font-bold uppercase",
                                          darkMode
                                            ? "text-slate-100"
                                            : "text-slate-400",
                                        )}
                                      >
                                        Ochi Stâng
                                      </span>
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const selectedVal = e.target.value;
                                          if (!selectedVal) return;
                                          const currentVal = currentMedicalRecord.posteriorSegment?.os || "";
                                          const newVal = currentVal ? `${currentVal}, ${selectedVal}` : selectedVal;
                                          setCurrentMedicalRecord({
                                            ...currentMedicalRecord,
                                            posteriorSegment: {
                                              ...currentMedicalRecord.posteriorSegment,
                                              os: capitalizeFirstLetter(newVal),
                                            }
                                          });
                                        }}
                                        className={cn(
                                          "text-[10px] px-1 py-0.5 border rounded focus:ring-1 focus:ring-amber-500 outline-none max-w-xs font-semibold leading-none",
                                          darkMode
                                            ? "bg-slate-950 border-slate-800 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-700"
                                        )}
                                      >
                                        <option value="">+ Valoare predefinită...</option>
                                        {posteriorSegmentOptionsState.map((opt) => (
                                          <option key={`opt-7-${opt}`} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <BufferedTextarea
                                      placeholder="Valoare OS..."
                                      value={
                                        currentMedicalRecord.posteriorSegment
                                          ?.os || ""
                                      }
                                      onChange={(val) => {
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          posteriorSegment: {
                                            ...currentMedicalRecord.posteriorSegment,
                                            os: capitalizeFirstLetter(val),
                                          },
                                        });
                                      }}
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 min-h-[96px] resize-none overflow-hidden",
                                        darkMode
                                          ? "bg-slate-900 border-slate-700 text-slate-100"
                                          : "bg-white border-slate-200 text-slate-900",
                                      )}
                                    />
                                  </div>
                                </div>
                              )}
                              </div>

                              {/* Keratometrie */}
                            <div
                              className={cn(
                                "p-3 rounded-xl border transition-all space-y-2 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3",
                                darkMode
                                  ? "bg-slate-800/10 border-slate-700 hover:border-emerald-500/50"
                                  : "bg-white border-slate-200 hover:border-emerald-200",
                              )}
                            >
                              <label
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  darkMode
                                    ? "text-slate-400"
                                    : "text-slate-500",
                                )}
                              >
                                Keratometrie
                              </label>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Ochi Drept Keratometrie */}
                                <div className="space-y-1">
                                  <span
                                    className={cn(
                                      "text-[8px] font-bold uppercase ml-1",
                                      darkMode
                                        ? "text-slate-100"
                                        : "text-slate-400",
                                    )}
                                  >
                                    Ochi Drept
                                  </span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      placeholder="K1 OD"
                                      type="text"
                                      value={
                                        currentMedicalRecord.keratometry
                                          ?.od_k1 || ""
                                      }
                                      onChange={(e) =>
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          keratometry: {
                                            ...(currentMedicalRecord.keratometry || {
                                              od: "",
                                              os: "",
                                            }),
                                            od_k1: e.target.value,
                                          },
                                        })
                                      }
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all",
                                        getKFieldStyle(currentMedicalRecord.keratometry?.od_k1 || ""),
                                        !getKFieldStyle(currentMedicalRecord.keratometry?.od_k1 || "") && (
                                          darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-900"
                                        )
                                      )}
                                    />
                                    <input
                                      placeholder="K2 OD"
                                      type="text"
                                      value={
                                        currentMedicalRecord.keratometry
                                          ?.od_k2 || ""
                                      }
                                      onChange={(e) =>
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          keratometry: {
                                            ...(currentMedicalRecord.keratometry || {
                                              od: "",
                                              os: "",
                                            }),
                                            od_k2: e.target.value,
                                          },
                                        })
                                      }
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all",
                                        getKFieldStyle(currentMedicalRecord.keratometry?.od_k2 || ""),
                                        !getKFieldStyle(currentMedicalRecord.keratometry?.od_k2 || "") && (
                                          darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-900"
                                        )
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Ochi Stâng Keratometrie */}
                                <div className="space-y-1">
                                  <span
                                    className={cn(
                                      "text-[8px] font-bold uppercase ml-1",
                                      darkMode
                                        ? "text-slate-100"
                                        : "text-slate-400",
                                    )}
                                  >
                                    Ochi Stâng
                                  </span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      placeholder="K1 OS"
                                      type="text"
                                      value={
                                        currentMedicalRecord.keratometry
                                          ?.os_k1 || ""
                                      }
                                      onChange={(e) =>
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          keratometry: {
                                            ...(currentMedicalRecord.keratometry || {
                                              od: "",
                                              os: "",
                                            }),
                                            os_k1: e.target.value,
                                          },
                                        })
                                      }
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all",
                                        getKFieldStyle(currentMedicalRecord.keratometry?.os_k1 || ""),
                                        !getKFieldStyle(currentMedicalRecord.keratometry?.os_k1 || "") && (
                                          darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-900"
                                        )
                                      )}
                                    />
                                    <input
                                      placeholder="K2 OS"
                                      type="text"
                                      value={
                                        currentMedicalRecord.keratometry
                                          ?.os_k2 || ""
                                      }
                                      onChange={(e) =>
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          keratometry: {
                                            ...(currentMedicalRecord.keratometry || {
                                              od: "",
                                              os: "",
                                            }),
                                            os_k2: e.target.value,
                                          },
                                        })
                                      }
                                      className={cn(
                                        "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all",
                                        getKFieldStyle(currentMedicalRecord.keratometry?.os_k2 || ""),
                                        !getKFieldStyle(currentMedicalRecord.keratometry?.os_k2 || "") && (
                                          darkMode
                                            ? "bg-slate-900 border-slate-700 text-slate-100"
                                            : "bg-white border-slate-200 text-slate-900"
                                        )
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Lungime Axială */}
                            <div
                              className={cn(
                                "p-3 rounded-xl border transition-all space-y-2 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3",
                                darkMode
                                  ? "bg-slate-800/40 border-slate-700"
                                  : "bg-slate-50 border-slate-200",
                              )}
                            >
                              <label
                                className={cn(
                                  "block text-[10px] font-bold uppercase tracking-wider",
                                  darkMode
                                    ? "text-slate-100"
                                    : "text-slate-500",
                                )}
                              >
                                Lungime Axială
                              </label>

                              <div className="flex gap-2">
                                <div className="flex-1 space-y-1">
                                  <span
                                    className={cn(
                                      "text-[8px] font-bold uppercase ml-1",
                                      darkMode
                                        ? "text-slate-100"
                                        : "text-slate-400",
                                    )}
                                  >
                                    Ochi Drept
                                  </span>
                                  <input
                                    placeholder="Valoare OD"
                                    type="text"
                                    value={
                                      currentMedicalRecord.axialLength?.od || ""
                                    }
                                    onChange={(e) => {
                                      const rawVal = e.target.value;
                                      const finalVal =
                                        sanitizeAxialLengthInput(rawVal);
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        axialLength: {
                                          ...currentMedicalRecord.axialLength,
                                          od: finalVal,
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      const validated =
                                        validateAxialLengthOnBlur(
                                          e.target.value,
                                        );
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        axialLength: {
                                          ...currentMedicalRecord.axialLength,
                                          od: validated,
                                        },
                                      });
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-slate-100"
                                        : "bg-white border-slate-200 text-slate-900",
                                    )}
                                  />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <span
                                    className={cn(
                                      "text-[8px] font-bold uppercase ml-1",
                                      darkMode
                                        ? "text-slate-100"
                                        : "text-slate-400",
                                    )}
                                  >
                                    Ochi Stâng
                                  </span>
                                  <input
                                    placeholder="Valoare OS"
                                    type="text"
                                    value={
                                      currentMedicalRecord.axialLength?.os || ""
                                    }
                                    onChange={(e) => {
                                      const rawVal = e.target.value;
                                      const finalVal =
                                        sanitizeAxialLengthInput(rawVal);
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        axialLength: {
                                          ...currentMedicalRecord.axialLength,
                                          os: finalVal,
                                        },
                                      });
                                    }}
                                    onBlur={(e) => {
                                      const validated =
                                        validateAxialLengthOnBlur(
                                          e.target.value,
                                        );
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        axialLength: {
                                          ...currentMedicalRecord.axialLength,
                                          os: validated,
                                        },
                                      });
                                    }}
                                    className={cn(
                                      "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500",
                                      darkMode
                                        ? "bg-slate-900 border-slate-700 text-slate-100"
                                        : "bg-white border-slate-200 text-slate-900",
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Diagnostic field */}
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <label className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Diagnostic
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1 max-w-2xl">
                            <select
                              value={currentMedicalRecord.lensType || ""}
                              onChange={(e) =>
                                updateLensRecommendation(
                                  "lensType",
                                  e.target.value,
                                )
                              }
                              className={cn(
                                "p-2 border rounded-xl font-bold outline-none text-[10px] uppercase tracking-tighter transition-all",
                                darkMode
                                  ? "bg-white border-slate-700 text-black focus:ring-blue-500"
                                  : "bg-slate-50 border-slate-200 focus:ring-blue-500",
                              )}
                            >
                              <option value="">Tip Lentilă</option>
                              <option value="Monofocal">Monofocal</option>
                              <option value="Progresiv">Progresiv</option>
                              <option value="Bifocal">Bifocal</option>
                              <option value="Degresiv">Degresiv</option>
                              <option value="Hoya Miyosmart">
                                Hoya Miyosmart
                              </option>
                              <option value="Hoya Miyosmart IQ">
                                Hoya Miyosmart IQ
                              </option>
                              <option value="Essilor Stellest">
                                Essilor Stellest
                              </option>
                              <option value="Zeiss MyoCare">
                                Zeiss MyoCare
                              </option>
                              <option value="Interoptik Optim Kids Myo">
                                Interoptik Optim Kids Myo
                              </option>
                              <option value="Tokay Miogen 1.7">
                                Tokay Miogen 1.7
                              </option>
                            </select>
                            <select
                              value={currentMedicalRecord.lensMaterial || ""}
                              onChange={(e) =>
                                updateLensRecommendation(
                                  "lensMaterial",
                                  e.target.value,
                                )
                              }
                              className={cn(
                                "p-2 border rounded-xl font-bold outline-none text-[10px] uppercase tracking-tighter transition-all",
                                darkMode
                                  ? "bg-white border-slate-700 text-black focus:ring-emerald-500"
                                  : "bg-slate-50 border-slate-200 focus:ring-emerald-500",
                              )}
                            >
                              <option value="">Indice/Material</option>
                              <option value="1.5">1.5</option>
                              <option value="1.59">1.59</option>
                              <option value="1.6">1.6</option>
                              <option value="1.67">1.67</option>
                              <option value="1.74">1.74</option>
                            </select>
                            <select
                              value={(currentMedicalRecord as any).lensHeliomat || ""}
                              onChange={(e) =>
                                updateLensRecommendation(
                                  "lensHeliomat",
                                  e.target.value,
                                )
                              }
                              className={cn(
                                "p-2 border rounded-xl font-bold outline-none text-[10px] uppercase tracking-tighter transition-all",
                                darkMode
                                  ? "bg-white border-slate-700 text-black focus:ring-violet-500"
                                  : "bg-slate-50 border-slate-200 focus:ring-violet-500",
                              )}
                            >
                              <option value="">Heliomat</option>
                              <option value="Heliomat gri">Heliomat gri</option>
                              <option value="Heliomat maro">Heliomat maro</option>
                              <option value="Transition">Transition</option>
                              <option value="Lentila complet transparenta">
                                Lentilă complet transparentă
                              </option>
                            </select>
                            <select
                              value={currentMedicalRecord.lensTreatment || ""}
                              onChange={(e) =>
                                updateLensRecommendation(
                                  "lensTreatment",
                                  e.target.value,
                                )
                              }
                              className={cn(
                                "p-2 border rounded-xl font-bold outline-none text-[10px] uppercase tracking-tighter transition-all",
                                darkMode
                                  ? "bg-white border-slate-700 text-black focus:ring-amber-500"
                                  : "bg-slate-50 border-slate-200 focus:ring-amber-500",
                              )}
                            >
                              <option value="">Tratament</option>
                              <option value="Transparent">Transparent</option>
                              <option value="Filtru protectie lumina albastra">
                                Filtru albastru
                              </option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-slate-400">Diag. Standard:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                const diag = e.target.value;
                                const original = currentMedicalRecord.diagnostic || "";
                                const updated = original.trim()
                                  ? original.trim() + "\n" + diag
                                  : diag;
                                setCurrentMedicalRecord({
                                  ...currentMedicalRecord,
                                  diagnostic: updated,
                                });
                                e.target.value = ""; // Reset select
                              }
                            }}
                            defaultValue=""
                            className={cn(
                              "text-[10px] font-bold border rounded-lg p-1 outline-none transition-all",
                              darkMode
                                ? "bg-slate-800 border-slate-700 text-purple-400"
                                : "bg-purple-50 border-purple-200 text-purple-750 font-black",
                            )}
                          >
                            <option value="">Alege diagnostic rapid...</option>
                            {diagnosticOptionsState.map((dName, dIdx) => (
                              <option key={`${dName}-${dIdx}`} value={dName}>
                                {dName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <BufferedTextarea
                          value={currentMedicalRecord.diagnostic || ""}
                          onChange={(val) =>
                            setCurrentMedicalRecord({
                              ...currentMedicalRecord,
                              diagnostic: val,
                            })
                          }
                          className={cn(
                            "w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none transition-all font-bold",
                            darkMode
                              ? "bg-white border-slate-700 text-black"
                              : "bg-white border-slate-200 text-slate-900",
                          )}
                          placeholder="Introduceți diagnosticul..."
                        />
                      </div>
                      {/* Recomandari Section */}
                      <div className="space-y-1 mt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-1 mb-1">
                          <label
                            className={cn(
                              "block text-[15px] font-black uppercase tracking-widest",
                              darkMode ? "text-slate-400" : "text-slate-500",
                            )}
                          >
                            Recomandări
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                            <span className="text-[13.5px] uppercase tracking-wider font-black text-slate-400 dark:text-slate-500 shrink-0">
                              Adaugă rapid:
                            </span>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const currentText = currentMedicalRecord.recomandari || "";
                                  const cleanItem = `Reevaluare la ${val}`;
                                  const original = currentText.trim();
                                  let newText = "";
                                  if (!original) {
                                    newText = "1. " + cleanItem;
                                  } else {
                                    const linesList = original.split("\n");
                                    let maxNum = 0;
                                    linesList.forEach(line => {
                                      const match = line.trim().match(/^(\d+)[\.\)]/);
                                      if (match) {
                                        const n = parseInt(match[1], 10);
                                        if (n > maxNum) maxNum = n;
                                      }
                                    });
                                    const nextIndex = maxNum > 0 ? maxNum + 1 : linesList.length + 1;
                                    newText = original + "\n" + `${nextIndex}. ` + cleanItem;
                                  }

                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    recomandari: newText,
                                  });
                                  e.target.value = "";
                                }
                              }}
                              className={cn(
                                "px-3 py-1 text-[16.5px] border rounded-lg font-black outline-none cursor-pointer max-w-[210px] truncate transition-colors",
                                darkMode
                                  ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 focus:border-blue-500"
                              )}
                              defaultValue=""
                            >
                              <option value="">Reevaluare la...</option>
                              <option value="7 zile">7 zile</option>
                              <option value="30 zile">30 zile</option>
                              <option value="3 luni">3 luni</option>
                              <option value="6 luni">6 luni</option>
                              <option value="1 an">1 an</option>
                              <option value="1-2 ani">1-2 ani</option>
                              <option value="2 ani">2 ani</option>
                            </select>
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const currentText = currentMedicalRecord.recomandari || "";
                                  const cleanItem = val.trim();
                                  const original = currentText.trim();
                                  let newText = "";
                                  if (!original) {
                                    newText = "1. " + cleanItem;
                                  } else {
                                    const linesList = original.split("\n");
                                    let maxNum = 0;
                                    linesList.forEach(line => {
                                      const match = line.trim().match(/^(\d+)[\.\)]/);
                                      if (match) {
                                        const n = parseInt(match[1], 10);
                                        if (n > maxNum) maxNum = n;
                                      }
                                    });
                                    const nextIndex = maxNum > 0 ? maxNum + 1 : linesList.length + 1;
                                    newText = original + "\n" + `${nextIndex}. ` + cleanItem;
                                  }

                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    recomandari: newText,
                                  });
                                  e.target.value = "";
                                }
                              }}
                              className={cn(
                                "px-3 py-1 text-[16.5px] border rounded-lg font-black outline-none cursor-pointer max-w-[270px] truncate transition-colors",
                                darkMode
                                  ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 focus:border-blue-500"
                              )}
                              defaultValue=""
                            >
                              <option value="">Alege recomandare standard...</option>
                              {recommendationOptionsState.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <BufferedTextarea
                          value={currentMedicalRecord.recomandari || ""}
                          onChange={(val) => {
                            const recLine = val
                              .split("\n")
                              .find((l) => l.trim().toLowerCase().startsWith("recomandare tip lentila:"));
                            let extraObj: any = {};
                            if (!recLine) {
                              extraObj = {
                                lensType: "",
                                lensMaterial: "",
                                lensTreatment: "",
                                lensHeliomat: "",
                              };
                            }
                            setCurrentMedicalRecord({
                              ...currentMedicalRecord,
                              ...extraObj,
                              recomandari: val,
                            });
                          }}
                          className={cn(
                            "w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-all font-black text-[16.5px]",
                            darkMode
                              ? "bg-white border-slate-700 text-black placeholder:text-slate-400"
                              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
                          )}
                          placeholder="Introduceți recomandări..."
                        />
                      </div>
                      {/* Examinations Section */}
                      <div
                        className={cn(
                          "p-3 rounded-2xl border transition-all",
                          darkMode
                            ? "bg-slate-800 border-slate-700 shadow-lg shadow-black/20"
                            : "bg-white border-slate-200 shadow-sm",
                        )}
                      >
                        <button
                          onClick={() =>
                            setIsExaminationsExpanded(!isExaminationsExpanded)
                          }
                          className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                        >
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform duration-300",
                              isExaminationsExpanded && "rotate-180",
                            )}
                          />
                          <Stethoscope className="w-3.5 h-3.5" />
                          Examinări
                        </button>

                        {isExaminationsExpanded && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                            {[
                              {
                                id: "control",
                                label: "Măsurători de lungime axială pentru Miopie",
                                type: "select",
                              },
                              {
                                id: "consultatieCompleta",
                                label: "Tensiune oculară",
                                type: "select",
                              },
                              {
                                id: "topografieOculara",
                                label: "Topografie oculară",
                                type: "select",
                              },
                              { id: "oct", label: "OCT", type: "select" },
                              {
                                id: "campVizual",
                                label: "Câmp vizual",
                                type: "select",
                              },
                              {
                                id: "ecografieOculara",
                                label: "Ecografie oculară",
                                type: "select",
                              },
                              {
                                id: "refractometriePediatrica",
                                label: "Refractometrie pediatrică",
                                type: "select",
                              },
                              {
                                id: "testSchirmer",
                                label: "Test Schirmer",
                                type: "checkbox",
                              },
                              {
                                id: "biometrie",
                                label: "Biometrie",
                                type: "select",
                              },
                              {
                                id: "gonioscopieAplanotonometrie",
                                label: "Gonioscopie",
                                type: "select",
                              },
                              {
                                id: "pahimetrie",
                                label: "Pahimetrie",
                                type: "select",
                              },
                              {
                                id: "sondajCaiLacrimale",
                                label: "Sondaj căi lacrimale",
                                type: "select",
                              },
                              {
                                id: "iridotomieLaser",
                                label: "Iridotomie Laser",
                                type: "select",
                              },
                              {
                                id: "capsulotomieLaser",
                                label: "Capsulotomie laser",
                                type: "select",
                              },
                              { id: "slt", label: "SLT", type: "select" },
                            ].map((exam) => (
                              <div
                                key={exam.id}
                                className={cn(
                                  "flex items-center justify-between gap-2 p-2 rounded-lg border transition-all",
                                  darkMode
                                    ? "bg-slate-900 border-slate-800"
                                    : "bg-slate-100 border-slate-200 shadow-sm",
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter leading-tight",
                                    darkMode ? "text-white" : "text-black",
                                  )}
                                >
                                  {exam.label}
                                </span>
                                {exam.type === "checkbox" ? (
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!(currentMedicalRecord.examinations ||
                                        DEFAULT_EXAMINATIONS)[
                                        exam.id as keyof Examinations
                                      ]
                                    }
                                    onChange={(e) => {
                                      const exams =
                                        currentMedicalRecord.examinations || {
                                          ...DEFAULT_EXAMINATIONS,
                                        };
                                      let newInterpretation =
                                        currentMedicalRecord.examinationInterpretation ||
                                        "";
                                      if (
                                        e.target.checked &&
                                        exam.id !== "control"
                                      ) {
                                        const text = `Interpretare ${exam.label}`;
                                        if (!newInterpretation.includes(text)) {
                                          newInterpretation = newInterpretation
                                            ? `${newInterpretation}\n${text}`
                                            : text;
                                        }
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        examinations: {
                                          ...exams,
                                          [exam.id]: e.target.checked,
                                        },
                                        examinationInterpretation:
                                          newInterpretation,
                                      });
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                ) : (
                                  <select
                                    value={
                                      (currentMedicalRecord.examinations ||
                                        DEFAULT_EXAMINATIONS)[
                                        exam.id as keyof Examinations
                                      ] as string
                                    }
                                    onChange={(e) => {
                                      const exams =
                                        currentMedicalRecord.examinations || {
                                          ...DEFAULT_EXAMINATIONS,
                                        };
                                      let newInterpretation =
                                        currentMedicalRecord.examinationInterpretation ||
                                        "";
                                      if (
                                        e.target.value &&
                                        exam.id !== "control"
                                      ) {
                                        const text = `Interpretare ${exam.label}`;
                                        if (!newInterpretation.includes(text)) {
                                          newInterpretation = newInterpretation
                                            ? `${newInterpretation}\n${text}`
                                            : text;
                                        }
                                      }
                                      setCurrentMedicalRecord({
                                        ...currentMedicalRecord,
                                        examinations: {
                                          ...exams,
                                          [exam.id]: e.target.value,
                                        },
                                        examinationInterpretation:
                                          newInterpretation,
                                      });
                                    }}
                                    className={cn(
                                      "p-1 text-[10px] font-black border rounded outline-none focus:ring-1 focus:ring-blue-500",
                                      darkMode
                                        ? "bg-slate-800 border-slate-700 text-white"
                                        : "bg-white border-slate-300 text-slate-900",
                                    )}
                                  >
                                    <option value="">-</option>
                                    <option value="1">1 ochi</option>
                                    <option value="2">2 ochi</option>
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {(() => {
                          const exams =
                            currentMedicalRecord.examinations ||
                            DEFAULT_EXAMINATIONS;
                          const hasExams = Object.entries(exams).some(
                            ([key, val]) => {
                              if (key === "control") return false;
                              return (
                                val === true ||
                                (typeof val === "string" && val !== "")
                              );
                            },
                          );

                          if (!hasExams) return null;

                          return (
                            <div className="mt-3 space-y-2 p-2">
                              <label
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                                  darkMode ? "text-blue-400" : "text-black",
                                )}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Interpretare Examinări
                              </label>
                              <BufferedTextarea
                                value={
                                  currentMedicalRecord.examinationInterpretation ||
                                  ""
                                }
                                onChange={(val) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    examinationInterpretation: val,
                                  })
                                }
                                placeholder="Introduceți interpretarea examinărilor..."
                                className={cn(
                                  "w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none transition-all font-bold",
                                  darkMode
                                    ? "bg-slate-900 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                          );
                        })()}
                      </div>
                      {/* Order Management Buttons - Moved after Examinations and filtered by role */}
                      {canManageOrders && (
                        <div
                          className={cn(
                            "p-3 rounded-2xl border transition-all shadow-sm",
                            darkMode
                              ? "bg-slate-800 border-slate-700"
                              : "bg-slate-50 border-slate-200",
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <button
                              onClick={() =>
                                setIsOrderHistoryExpanded(
                                  !isOrderHistoryExpanded,
                                )
                              }
                              className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                            >
                              <ChevronDown
                                className={cn(
                                  "w-3.5 h-3.5 transition-transform duration-300",
                                  isOrderHistoryExpanded && "rotate-180",
                                )}
                              />
                              <Download className="w-3.5 h-3.5" />
                              Istoric Comenzi
                            </button>
                            <button
                              onClick={handlePreOrderCheck}
                              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-900/20"
                            >
                              <Glasses className="w-3.5 h-3.5" />
                              Comandă Nouă
                            </button>
                          </div>

                          {isOrderHistoryExpanded && (
                            <div className="mt-4">
                              {(() => {
                                const activeOrders = (currentMedicalRecord.orderHistory || [])
                                  .map((order, idx) => ({ order, idx }))
                                  .filter(({ order }) => !order.isDeleted);
                                if (activeOrders.length === 0) {
                                  return (
                                    <button
                                      onClick={() => saveAndSwitchOrder(null)}
                                      className={cn(
                                        "w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3",
                                        darkMode
                                          ? "bg-slate-900/50 border-slate-700 text-slate-500 hover:border-blue-500/50 hover:text-blue-400"
                                          : "bg-white/50 border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500",
                                      )}
                                    >
                                      <Download className="w-8 h-8 opacity-20" />
                                      <span className="text-xs font-black uppercase tracking-widest">
                                        Nicio comandă înregistrată
                                      </span>
                                      <span className="text-[10px] opacity-60">
                                        Apasă pentru a crea prima comandă
                                      </span>
                                    </button>
                                  );
                                }
                                return (
                                  <div
                                    className={cn(
                                      "grid grid-flow-col grid-rows-2 gap-x-2 gap-y-1.5 p-2 rounded-xl border transition-all overflow-x-auto custom-scrollbar",
                                      darkMode
                                        ? "bg-slate-900/50 border-slate-700"
                                        : "bg-white border-slate-200 shadow-inner",
                                    )}
                                  >
                                    {[...activeOrders]
                                      .reverse()
                                      .map(({ order, idx }) => {
                                        return (
                                          <button
                                            key={`order-${idx}`}
                                            onClick={() =>
                                              saveAndSwitchOrder(idx)
                                            }
                                            className={cn(
                                              "p-2 rounded-xl border transition-all text-left flex flex-col gap-0.5 group min-w-[140px]",
                                              activeOrderIndex === idx
                                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30 scale-[1.02]"
                                                : order.isUrgent
                                                  ? darkMode
                                                    ? "bg-rose-900/20 border-rose-500/50 text-rose-200"
                                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                                  : darkMode
                                                    ? "bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200",
                                            )}
                                          >
                                            <div className="flex justify-between items-center w-full min-w-0">
                                              <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-[11px] font-black uppercase tracking-tighter truncate">
                                                  {format(
                                                    new Date(order.createdAt),
                                                    "dd.MM.yy",
                                                  )}
                                                </span>
                                                {order.isUrgent && (
                                                  <span
                                                    className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50 shrink-0"
                                                    title="Urgent"
                                                  />
                                                )}
                                              </div>
                                              <span className="text-[13px] font-black shrink-0">
                                                {(order.total || 0).toFixed(0)}{" "}
                                                <span className="text-[9px]">
                                                  RON
                                                </span>
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center w-full opacity-90">
                                              <span
                                                className={cn(
                                                  "text-[11px] font-black truncate",
                                                  activeOrderIndex === idx
                                                    ? "text-blue-100"
                                                    : darkMode
                                                      ? "text-slate-300"
                                                      : "text-slate-700",
                                                )}
                                              >
                                                {order.orderNumber.replace(
                                                  "CMD-",
                                                  "",
                                                )}
                                              </span>
                                              <span
                                                className={cn(
                                                  "text-[10px] font-bold",
                                                  activeOrderIndex === idx
                                                    ? "text-emerald-200"
                                                    : "text-emerald-600",
                                                )}
                                              >
                                                A: {order.advance.toFixed(0)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center w-full opacity-80">
                                              {order.balance > 0 ? (
                                                <span
                                                  className={cn(
                                                    "text-[10px] font-bold",
                                                    activeOrderIndex === idx
                                                      ? "text-rose-200"
                                                      : "text-rose-500",
                                                  )}
                                                >
                                                  R: {order.balance.toFixed(0)}
                                                </span>
                                              ) : (
                                                <span
                                                  className={cn(
                                                    "text-[9px] font-bold",
                                                    activeOrderIndex === idx
                                                      ? "text-emerald-200"
                                                      : "text-emerald-500",
                                                  )}
                                                >
                                                  ACHITAT
                                                </span>
                                              )}
                                              <span
                                                className={cn(
                                                  "text-[9px] font-bold",
                                                  activeOrderIndex === idx
                                                    ? "text-blue-200"
                                                    : "text-amber-600",
                                                )}
                                              >
                                                L:{" "}
                                                {order.deliveryDate
                                                  ? format(
                                                      new Date(
                                                        order.deliveryDate,
                                                      ),
                                                      "dd.MM",
                                                    )
                                                  : "-"}
                                              </span>
                                            </div>
                                          </button>
                                        );
                                      })}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}{" "}

                      {/* Dată Eliberare - Ultima rubrică în Fișa Pacient: după Istoric Comenzi (administrator și recepție) și după Examinări (medici) */}
                      {renderReleaseDateCard()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Tratament Complementar
                        <button
                          onClick={printTreatment}
                          className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] font-black bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-all uppercase tracking-widest shadow-sm"
                          title="Printează schema de tratament"
                        >
                          <Download className="w-3 h-3" />
                          Printează Tratament
                        </button>
                      </h3>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 p-3 rounded-xl border bg-slate-50/30 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800">
                        {/* Predefined Protocols */}
                        <div className="space-y-1 col-span-2 lg:col-span-1">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-tighter block truncate">
                            Protocoale Afecțiuni
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                const protocolName = e.target.value;
                                const protocolItems =
                                  treatmentProtocolsState[protocolName];
                                if (protocolItems) {
                                  let updatedTreatment =
                                    currentMedicalRecord.treatment || "";

                                  if (
                                    !updatedTreatment.includes(
                                      `Diagnostic: ${protocolName}`,
                                    )
                                  ) {
                                    updatedTreatment =
                                      `Diagnostic: ${protocolName}\n` +
                                      updatedTreatment;
                                  }

                                  const useNumbering =
                                    protocolName !== "Tratament post laser PCO";
                                  protocolItems.forEach((item) => {
                                    if (useNumbering) {
                                      updatedTreatment = appendTreatment(
                                        updatedTreatment,
                                        item,
                                      );
                                    } else {
                                      updatedTreatment =
                                        updatedTreatment.trim() +
                                        (updatedTreatment ? "\n" : "") +
                                        item;
                                    }
                                  });

                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    diagnostic: protocolName,
                                    treatment: updatedTreatment,
                                  });
                                }
                                e.target.value = ""; // Reset select
                              }
                            }}
                            defaultValue=""
                            className={cn(
                              "w-full p-1.5 text-[10px] font-bold border rounded-lg outline-none focus:ring-1 focus:ring-blue-500 transition-all",
                              darkMode
                                ? "bg-slate-800 border-slate-700 text-blue-400"
                                : "bg-blue-50 border-blue-200 text-blue-700 font-black",
                            )}
                          >
                            <option value="" disabled>
                              Alege Afecțiune...
                            </option>
                            {Object.keys(treatmentProtocolsState)
                              .sort()
                              .map((name, pIdx) => (
                                <option key={`${name}-${pIdx}`} value={name}>
                                  {name}
                                </option>
                              ))}
                          </select>
                        </div>

                        {(() => {
                          const orderedStateCategories = [
                            ...categoryOrderState.filter(
                              (k) => !!treatmentCategoriesState[k],
                            ),
                            ...Object.keys(treatmentCategoriesState).filter(
                              (k) => !categoryOrderState.includes(k),
                            ),
                          ];
                          return orderedStateCategories.map((catName) => {
                            const items =
                              treatmentCategoriesState[catName] || [];
                            const activeItems = items.filter(
                              (i) => i.active !== false,
                            );
                            if (activeItems.length === 0) return null;
                            return (
                              <div key={catName} className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter block truncate">
                                  {catName}
                                </label>
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const selectedOption = activeItems.find(
                                        (i) => i.full === e.target.value,
                                      );
                                      if (selectedOption) {
                                        let textToAdd = selectedOption.full;
                                        const nameLower = selectedOption.name.toLowerCase().trim();
                                        const fullLower = selectedOption.full.toLowerCase().trim();
                                        if (!fullLower.includes(nameLower)) {
                                          if (selectedOption.full.trim().startsWith("(")) {
                                            textToAdd = `${selectedOption.name} ${selectedOption.full}`;
                                          } else {
                                            textToAdd = `${selectedOption.name} (${selectedOption.full})`;
                                          }
                                        }
                                        setCurrentMedicalRecord({
                                          ...currentMedicalRecord,
                                          treatment: appendTreatment(
                                            currentMedicalRecord.treatment,
                                            textToAdd,
                                          ),
                                        });
                                      }
                                      e.target.value = ""; // Reset select
                                    }
                                  }}
                                  defaultValue=""
                                  className={cn(
                                    "w-full p-1.5 text-[10px] font-bold border rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 transition-all",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-slate-200"
                                      : "bg-white border-slate-300 text-slate-700",
                                  )}
                                >
                                  <option value="" disabled>
                                    Alege...
                                  </option>
                                  {activeItems.map((item, idx) => (
                                    <option
                                      key={`treat-${idx}`}
                                      value={item.full}
                                    >
                                      {item.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <BufferedTextarea
                        value={currentMedicalRecord.treatment}
                        onChange={(val) => {
                          setCurrentMedicalRecord({
                            ...currentMedicalRecord,
                            treatment: val,
                          });
                        }}
                        processValue={processTreatmentValue}
                        className={cn(
                          "w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none h-48 resize-none transition-all font-bold",
                          darkMode
                            ? "bg-white border-slate-700 text-black"
                            : "bg-white border-slate-200 text-slate-900",
                        )}
                        placeholder="Introduceți schema de tratament sau folosiți selectorii de mai sus..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4 col-span-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Date Identificare Pacient
                          </h3>
                          <button
                            type="button"
                            onClick={() => setIsGdprModalOpen(true)}
                            className={cn(
                              "flex items-center gap-1 px-3 py-1.5 text-[10px] font-black border rounded-lg transition-all uppercase tracking-widest shadow-sm",
                              currentMedicalRecord.gdprSigned
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                : (darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                            )}
                            title="Formular Consimțământ GDPR"
                          >
                            {currentMedicalRecord.gdprSigned ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            GDPR
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              CNP
                            </label>
                            <input
                              type="text"
                              maxLength={13}
                              value={currentMedicalRecord.patientCnp || ""}
                              onChange={(e) => {
                                const newCnp = e.target.value;
                                const detectedSex = getSexFromCNP(newCnp);
                                const updatedSex = detectedSex || currentMedicalRecord.patientSex;
                                setCurrentMedicalRecord({
                                  ...currentMedicalRecord,
                                  patientCnp: newCnp,
                                  patientSex: updatedSex,
                                });
                                if (newCnp.trim().length === 13) {
                                  syncPatientUniversal(
                                    {
                                      patientName: currentMedicalRecord.patientName,
                                      patientPhone: currentMedicalRecord.patientPhone,
                                      patientCnp: currentMedicalRecord.patientCnp,
                                      recordId: currentMedicalRecord.id,
                                    },
                                    {
                                      patientCnp: newCnp.trim(),
                                      patientSex: updatedSex,
                                    },
                                  );
                                }
                              }}
                              onBlur={(e) => {
                                const cnpVal = e.target.value.trim();
                                if (cnpVal) {
                                  syncPatientUniversal(
                                    {
                                      patientName: currentMedicalRecord.patientName,
                                      patientPhone: currentMedicalRecord.patientPhone,
                                      patientCnp: currentMedicalRecord.patientCnp,
                                      recordId: currentMedicalRecord.id,
                                    },
                                    {
                                      patientCnp: cnpVal,
                                      patientSex: currentMedicalRecord.patientSex,
                                    },
                                  );
                                }
                              }}
                              className={cn(
                                "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-slate-100"
                                  : "bg-white border-slate-200 text-slate-900",
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                BI/CI Serie
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.patientSeries || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    patientSeries: e.target.value,
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Număr
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.patientNumber || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    patientNumber: e.target.value,
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Județ
                            </label>
                            <input
                              type="text"
                              value={currentMedicalRecord.patientJudet || ""}
                              onChange={(e) =>
                                setCurrentMedicalRecord({
                                  ...currentMedicalRecord,
                                  patientJudet: e.target.value,
                                })
                              }
                              className={cn(
                                "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-slate-100"
                                  : "bg-white border-slate-200 text-slate-900",
                              )}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Localitate
                            </label>
                            <input
                              type="text"
                              value={
                                currentMedicalRecord.patientLocalitate || ""
                              }
                              onChange={(e) =>
                                setCurrentMedicalRecord({
                                  ...currentMedicalRecord,
                                  patientLocalitate: e.target.value,
                                })
                              }
                              className={cn(
                                "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-slate-100"
                                  : "bg-white border-slate-200 text-slate-900",
                              )}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Stradă / Sat
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={
                                    currentMedicalRecord.patientStrada || ""
                                  }
                                  onChange={(e) =>
                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      patientStrada: e.target.value,
                                    })
                                  }
                                  className={cn(
                                    "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-slate-100"
                                      : "bg-white border-slate-200 text-slate-900",
                                  )}
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Nr."
                                  value={
                                    currentMedicalRecord.patientStreetNumber ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setCurrentMedicalRecord({
                                      ...currentMedicalRecord,
                                      patientStreetNumber: e.target.value,
                                    })
                                  }
                                  className={cn(
                                    "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-slate-100"
                                      : "bg-white border-slate-200 text-slate-900",
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Bloc
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.patientBloc || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    patientBloc: e.target.value,
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Scară
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.patientScara || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    patientScara: e.target.value,
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Ap.
                              </label>
                              <input
                                type="text"
                                value={
                                  currentMedicalRecord.patientApartament || ""
                                }
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    patientApartament: e.target.value,
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 sm:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Ocupația
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.occupation || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    occupation: e.target.value,
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                            <div className="col-span-12 sm:col-span-8">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Unitatea învățământ / serviciu
                              </label>
                              <input
                                type="text"
                                value={currentMedicalRecord.institution || ""}
                                onChange={(e) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    institution: e.target.value,
                                  })
                                }
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                            </div>
                            <div className="col-span-12">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Scutire
                              </label>
                              <BufferedTextarea
                                value={currentMedicalRecord.scutire || ""}
                                onChange={(val) =>
                                  setCurrentMedicalRecord({
                                    ...currentMedicalRecord,
                                    scutire: val,
                                  })
                                }
                                placeholder="Detalii scutire medicală..."
                                className={cn(
                                  "w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-slate-100"
                                    : "bg-white border-slate-200 text-slate-900",
                                )}
                              />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Dată Eliberare - Ultima rubrică în Fișa Pacient */}
                    {renderReleaseDateCard()}
                  </div>
                )}
              </div>

              {bookingError && (
                <div className="mb-4 bg-red-900/20 border border-red-900/30 p-3 rounded-xl flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{bookingError}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {/* Save only button on the left (previously print) */}
                <button
                  type="button"
                  id="save-medical-record-btn"
                  onClick={async () => {
                    await saveMedicalRecord(true);
                  }}
                  disabled={loading}
                  className={cn(
                    "px-6 py-4 font-bold rounded-xl transition-all border flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-500/10 cursor-pointer active:scale-[0.99]",
                    darkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                      : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
                    loading && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Save className="w-5 h-5" />
                  {loading ? "Se salvează..." : "Salvează Fișa"}
                </button>

                <div className="flex-[2] flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <button
                      id="doc-dropdown-trigger"
                      onClick={() => setShowDocDropdown(!showDocDropdown)}
                      className={cn(
                        "w-full px-6 py-4 font-bold rounded-xl transition-all border flex items-center justify-center gap-2 text-center whitespace-nowrap",
                        darkMode
                          ? "bg-indigo-900/20 border-indigo-800 text-indigo-400 hover:bg-indigo-900/45"
                          : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100",
                      )}
                    >
                      <ChevronUp className={cn("w-5 h-5 shrink-0 transition-transform duration-200", showDocDropdown && "rotate-180")} />
                      Documente
                    </button>
                    {showDocDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowDocDropdown(false)}
                        />
                        <div
                          className={cn(
                            "absolute bottom-full left-0 right-0 mb-3 p-2 rounded-2xl shadow-2xl border flex flex-col gap-2 z-40 animate-in slide-in-from-bottom-2 duration-200 w-full sm:w-72",
                            darkMode
                              ? "bg-slate-900 border-slate-800"
                              : "bg-white border-slate-200",
                          )}
                        >
                          {/* 1. Raport Medical - Emerald */}
                          <button
                            onClick={() => {
                              openDocumentModal("raport");
                              setShowDocDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all",
                              darkMode
                                ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/60"
                                : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100",
                            )}
                          >
                            <FileText className="w-4 h-4 text-emerald-500" />
                            Raport Medical
                          </button>

                          {/* 2. Adeverință Medicală - Indigo */}
                          <button
                            onClick={() => {
                              openDocumentModal("adeverinta");
                              setShowDocDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all",
                              darkMode
                                ? "bg-indigo-950/40 border-indigo-900/50 text-indigo-400 hover:bg-indigo-950/60"
                                : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100",
                            )}
                          >
                            <FileText className="w-4 h-4 text-indigo-500" />
                            Adeverință Medicală
                          </button>

                          {/* 3. Referat Medical - Blue */}
                          <button
                            onClick={() => {
                              openDocumentModal("referat");
                              setShowDocDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all",
                              darkMode
                                ? "bg-blue-950/40 border-blue-900/50 text-blue-400 hover:bg-blue-950/60"
                                : "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100",
                            )}
                          >
                            <FileText className="w-4 h-4 text-blue-500" />
                            Referat Medical
                          </button>

                          {/* 4. Certificat medical A5 - Amber */}
                          <button
                            onClick={() => {
                              openDocumentModal("certificat");
                              setShowDocDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all",
                              darkMode
                                ? "bg-amber-950/40 border-amber-900/50 text-amber-400 hover:bg-amber-950/60"
                                : "bg-amber-50 border-amber-100 text-amber-750 hover:bg-amber-100",
                            )}
                          >
                            <FileText className="w-4 h-4 text-amber-500" />
                            Certificat medical A5
                          </button>

                          {/* 5. Examen Expertiză Medicală - Rose */}
                          <button
                            onClick={() => {
                              openDocumentModal("expertiza");
                              setShowDocDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all",
                              darkMode
                                ? "bg-rose-950/40 border-rose-900/50 text-rose-400 hover:bg-rose-950/60"
                                : "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100",
                            )}
                          >
                            <FileText className="w-4 h-4 text-rose-500" />
                            Examen Expertiză Medicală
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Save and print button on the right */}
                  <button
                    type="button"
                    id="save-and-print-medical-record-btn"
                    onClick={async () => {
                      const hasDp = !!(
                        currentMedicalRecord.dp ||
                        (currentMedicalRecord.dp_od && currentMedicalRecord.dp_os) ||
                        currentMedicalRecord.dp_aproape
                      );

                      if (!hasDp) {
                        setErrorMessage("Atenție: Distanța interpupilară (DP) nu a fost completată pe prescripție.");
                      }

                      const success = await saveMedicalRecord(false);
                      if (success) {
                        try {
                          printPrescription();
                          setSuccessMessage("Fișa a fost salvată și prescripția a fost trimisă la tipărire!");
                        } catch (pErr) {
                          console.error("Print prescription error:", pErr);
                          setErrorMessage("Eroare la generarea prescripției pentru tipărire!");
                        }
                      }
                    }}
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    {loading ? (
                      "Se salvează..."
                    ) : (
                      <>
                        <Printer className="w-5 h-5 shrink-0" />
                        <span className="whitespace-nowrap">
                          Salvează și Printează
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
  );
};
