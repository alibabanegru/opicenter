import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Printer, X } from "lucide-react";
import { cn, getSexFromCNP } from "../appConstants";

interface DocumentConfiguratorModalProps {
  activeDocumentModal: string | null;
  setActiveDocumentModal: (val: any) => void;
  documentForm: any;
  setDocumentForm: (val: any) => void;
  darkMode: boolean;
  handleSaveAndPrintDocument: () => Promise<void>;
}

const BASE_DOCTOR_OPTIONS = [
  "Dr. Turcanu Irina",
  "Dr. Zorila Cristina",
  "Dr. Ilie Larisa",
];

const DocumentConfiguratorModal = React.memo(function DocumentConfiguratorModal({
  activeDocumentModal,
  setActiveDocumentModal,
  documentForm,
  setDocumentForm,
  darkMode,
  handleSaveAndPrintDocument,
}: DocumentConfiguratorModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const currentDoc = (documentForm?.doctorName || "").trim();
  const sortedDoctorOptions = React.useMemo(() => {
    const defaultList = [...BASE_DOCTOR_OPTIONS];
    if (!currentDoc) return defaultList;
    const matchingDoc = defaultList.find(
      (d) =>
        d.toLowerCase().includes(currentDoc.toLowerCase()) ||
        currentDoc.toLowerCase().includes(d.toLowerCase()),
    );
    if (matchingDoc) {
      return [matchingDoc, ...defaultList.filter((d) => d !== matchingDoc)];
    }
    return [currentDoc, ...defaultList];
  }, [currentDoc]);
  return (
          <AnimatePresence>
            {activeDocumentModal && (
              <motion.div
                key="document-form-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[75]"
              >
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  className={cn(
                    "transition-all flex flex-col w-full h-[94vh] max-h-[94vh] max-w-[96vw] xl:max-w-[98vw] 2xl:max-w-[1560px] rounded-3xl shadow-2xl border overflow-hidden document-modal-fullscreen",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white"
                      : "bg-white border-slate-200 text-slate-900",
                  )}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl",
                          darkMode
                            ? "bg-blue-950/45 text-blue-400"
                            : "bg-blue-50 text-blue-600",
                        )}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2
                          className={cn(
                            "text-lg font-black uppercase tracking-tight",
                            darkMode ? "text-white" : "text-slate-900",
                          )}
                        >
                          Date Document:{" "}
                          {activeDocumentModal === "adeverinta"
                            ? "Adeverință Medicală"
                            : activeDocumentModal === "referat"
                              ? "Referat Medical"
                              : activeDocumentModal === "raport"
                                ? "Raport Medical"
                                : activeDocumentModal === "expertiza"
                                  ? "Examen Expertiză Medicală (Capacitate Muncă)"
                                  : "Certificat medical A5"}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Introduceți detaliile necesare pentru generare și printare
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDocumentModal(null)}
                      className={cn(
                        "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                        darkMode ? "text-slate-400" : "text-slate-500",
                      )}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
    
                  {/* Scrollable Form Content */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {/* 1. ADEVERINTA */}
                    {activeDocumentModal === "adeverinta" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Județ Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientJudet || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientJudet: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Localitate Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientLocalitate || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientLocalitate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            1. Date Identificare Pacient
                          </p>
    
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Nume și Prenume
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientName || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientName: e.target.value,
                                })
                              }
                            />
                          </div>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Sex
                              </label>
                              <select
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientSex || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientSex: e.target.value,
                                  })
                                }
                              >
                                <option value="">-</option>
                                <option value="M">M (Masculin)</option>
                                <option value="F">F (Feminin)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                CNP
                              </label>
                              <input
                                type="text"
                                maxLength={13}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientCnp || ""}
                                onChange={(e) => {
                                  const newCnp = e.target.value;
                                  const detectedSex = getSexFromCNP(newCnp);
                                  setDocumentForm({
                                    ...documentForm,
                                    patientCnp: newCnp,
                                    patientSex: detectedSex || documentForm.patientSex,
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            2. Domiciliu Pacient
                          </p>
    
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Stradă
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientStrada || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientStrada: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Număr
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientStreetNumber || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientStreetNumber: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Bloc
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientBloc || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientBloc: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Apartament
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientApartament || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientApartament: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            3. Ocupație & Loc Muncă
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Ocupație / Calitate
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.occupation || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    occupation: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                La Unitatea / Instituția
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.institution || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    institution: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            4. Aspecte Medicale și Recomandări
                          </p>
    
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Este suferind de (Diagnostic)
                            </label>
                            <textarea
                              rows={2}
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.diagnostic || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  diagnostic: e.target.value,
                                })
                              }
                            />
                          </div>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Se recomandă scutire (Scutit de:)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Scutire efort fizic 30 zile"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.scutire || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    scutire: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Alte recomandări / Tratament
                              </label>
                              <input
                                type="text"
                                placeholder="Tratamente, lentile, etc."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.treatment || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    treatment: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              S-a eliberat prezenta pentru a-i servi la
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: locul de munca, comisie, scoala..."
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.servesTo || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  servesTo: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            5. Semnătură & Dată Medicală
                          </p>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Nume Medic Consultant
                              </label>
                              <select
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.doctorName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    doctorName: e.target.value,
                                  })
                                }
                              >
                                {sortedDoctorOptions.map((doc) => (
                                  <option key={doc} value={doc}>
                                    {doc}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Zi
                                </label>
                                <input
                                  type="text"
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xs font-semibold text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-900",
                                  )}
                                  value={documentForm.eliberatZi || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatZi: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Lună
                                </label>
                                <select
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-900",
                                  )}
                                  value={documentForm.eliberatLuna || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatLuna: e.target.value,
                                    })
                                  }
                                >
                                  {[
                                    "Ianuarie",
                                    "Februarie",
                                    "Martie",
                                    "Aprilie",
                                    "Mai",
                                    "Iunie",
                                    "Iulie",
                                    "August",
                                    "Septembrie",
                                    "Octombrie",
                                    "Noiembrie",
                                    "Decembrie",
                                  ].map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  An
                                </label>
                                <input
                                  type="text"
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xs font-semibold text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-900",
                                  )}
                                  value={documentForm.eliberatAn || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatAn: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
    
                    {/* 2. REFERAT */}
                    {activeDocumentModal === "referat" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Număr Document (Nr. Referat)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 48 / 26.05.2026"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.documentNumber || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  documentNumber: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Județ Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientJudet || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientJudet: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Localitate Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientLocalitate || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientLocalitate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            1. Date Pacient & Act Identitate
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Nume Pacient
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientName: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                CNP
                              </label>
                              <input
                                type="text"
                                maxLength={13}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientCnp || ""}
                                onChange={(e) => {
                                  const newCnp = e.target.value;
                                  const detectedSex = getSexFromCNP(newCnp);
                                  setDocumentForm({
                                    ...documentForm,
                                    patientCnp: newCnp,
                                    patientSex: detectedSex || documentForm.patientSex,
                                  });
                                }}
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                BI / CI Seria
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: AS"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientSeries || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientSeries: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                BI / CI Număr
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 123456"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientNumber || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientNumber: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            2. Adresă Completă Domiciliu
                          </p>
    
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Județ Domiciliu
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientJudet || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientJudet: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Localitate Domiciliu
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientLocalitate || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientLocalitate: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Stradă / Sat / Comună
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientStrada || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientStrada: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Bloc
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientBloc || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientBloc: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Scară
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientScara || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientScara: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Apartament
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientApartament || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientApartament: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            3. Anamneză & Istoric Medical (Textarea)
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Antecedente Personale Patologice (APP)
                              </label>
                              <textarea
                                rows={2}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.history || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    history: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Istoricul bolii, debut, evoluție
                              </label>
                              <textarea
                                rows={2}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.onsetAndEvolution || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    onsetAndEvolution: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Spitalizări Recente
                              </label>
                              <textarea
                                rows={2}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.recentHospitalizations || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    recentHospitalizations: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Diagnostic actual definitv / cod diagnostic
                              </label>
                              <textarea
                                rows={2}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.diagnostic || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    diagnostic: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            4. Aspecte Oftalmologice & Tratament
                          </p>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                AV f.c. OD (Fără Corecție OD)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 1.0 sau 0.5"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.avFaraCorectieOd || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    avFaraCorectieOd: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                AV f.c. OS (Fără Corecție OS)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 1.0 sau 0.5"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.avFaraCorectieOs || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    avFaraCorectieOs: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                AV c.c. OD (Cu Corecție OD)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 1.0 sau 0.5"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.vaWithOd || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDocumentForm({
                                    ...documentForm,
                                    vaWithOd: val,
                                    avCuCorectieOd: val,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                AV c.c. OS (Cu Corecție OS)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 1.0 sau 0.5"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.vaWithOs || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDocumentForm({
                                    ...documentForm,
                                    vaWithOs: val,
                                    avCuCorectieOs: val,
                                  });
                                }}
                              />
                            </div>
                          </div>
    
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Tratament clinic recomandat / în curs
                            </label>
                            <textarea
                              rows={2}
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.clinicalTreatment || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  clinicalTreatment: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            5. Stare Socială & Evaluare Handicap (DGASPC)
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Starea de dependență (ajutor altă persoană)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ex: Necesită sprijin, nu se poate autoservi etc."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.dependencyStatus || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    dependencyStatus: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Starea de mobilitate (deplasare, auto-conducere)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ex: Deplasare dificilă, nu poate conduce..."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.mobilityStatus || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    mobilityStatus: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Planul de recuperare (recomandare pe termen lung)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ex: Control periodic, dispensarizare, ochelari..."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.recoveryPlan || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    recoveryPlan: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Prognosticul de recuperare / evoluție clinică
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ex: Favorabil cu tratament, staționar, rezervat..."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.recoveryPrognosis || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    recoveryPrognosis: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Destinație / Înaintat la (Serviciu DGASPC / Unitate)
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.servesTo || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  servesTo: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            6. Medic și Dată Emitere
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Medic Examinator, Clinica Negreanu
                              </label>
                              <select
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.doctorName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    doctorName: e.target.value,
                                  })
                                }
                              >
                                {sortedDoctorOptions.map((doc) => (
                                  <option key={doc} value={doc}>
                                    {doc}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Zi
                                </label>
                                <input
                                  type="text"
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xs font-semibold text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-900",
                                  )}
                                  value={documentForm.eliberatZi || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatZi: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Lună
                                </label>
                                <select
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-900",
                                  )}
                                  value={documentForm.eliberatLuna || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatLuna: e.target.value,
                                    })
                                  }
                                >
                                  {[
                                    "Ianuarie",
                                    "Februarie",
                                    "Martie",
                                    "Aprilie",
                                    "Mai",
                                    "Iunie",
                                    "Iulie",
                                    "August",
                                    "Septembrie",
                                    "Octombrie",
                                    "Noiembrie",
                                    "Decembrie",
                                  ].map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  An
                                </label>
                                <input
                                  type="text"
                                  className={cn(
                                    "w-full p-2.5 border rounded-xl text-xs font-semibold text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-900",
                                  )}
                                  value={documentForm.eliberatAn || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatAn: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
    
                    {/* 3. RAPORT */}
                    {activeDocumentModal === "raport" && (
                      <div className="space-y-4">
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            1. Date Identificare Pacient & Medic
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Nume Familie Pacient
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Negreanu"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.lastName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    lastName: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Prenume Pacient
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Ioan"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.firstName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    firstName: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Vârstă (Simplă)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 50"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.ageSimple || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    ageSimple: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Medic Consultant
                              </label>
                              <select
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.doctorName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    doctorName: e.target.value,
                                  })
                                }
                              >
                                {sortedDoctorOptions.map((doc) => (
                                  <option key={doc} value={doc}>
                                    {doc}
                                  </option>
                                ))}
                              </select>
                            </div>
    
                            <div className="flex items-center gap-6 pt-5">
                              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-black dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={!!documentForm.isConsultComplet}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      isConsultComplet: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                Consult Complet
                              </label>
    
                              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-black dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={!!documentForm.isControl}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      isControl: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                                />
                                Revenire / Control
                              </label>
    
                              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-black dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={!!documentForm.isGratis}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      isGratis: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                                />
                                Gratis
                              </label>
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            2. Simptome, Antecedente & Anamneză (Textareas)
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Motivele prezentării (Simptome)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Lacrimare, scăderea vederii progresiv..."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.symptoms || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    symptoms: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Alte boli oculare cunoscute
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Miopie forte, Glaucom etc."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.otherEyeDiseases || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    otherEyeDiseases: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Antecedente Personale Patologice (APP)
                              </label>
                              <textarea
                                rows={2}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.history || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    history: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Tratament efectuat anterior / Medicamente in uz
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Picături, analgezice, etc."
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.medications || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    medications: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3 overflow-hidden">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            3. Parametri Măsurători Clinice (OD / OS)
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* OCHIUL DREPT */}
                            <div className="space-y-3 bg-blue-500/5 dark:bg-blue-500/10 p-3.5 rounded-2xl border border-blue-500/10">
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-center border-b border-blue-500/10 pb-1">
                                Ochiul Drept (OD)
                              </p>
    
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    AV f.c. OD
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    placeholder="Fără corecție"
                                    value={documentForm.avFaraCorectieOd || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        avFaraCorectieOd: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    AV c.c. OD
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.vaWithOd || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDocumentForm({
                                        ...documentForm,
                                        vaWithOd: val,
                                        avCuCorectieOd: val,
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    IOP OD (mmHg)
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.iopOd || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        iopOd: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    Pahimetrie OD (µm)
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.pachymetryOd || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        pachymetryOd: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    IOP Corectată OD
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.correctedIopOd || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        correctedIopOd: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    Keratometrie OD
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.keratometryOd || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        keratometryOd: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    Lungime Axială OD
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.axialLengthOd || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        axialLengthOd: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
    
                               <div className="space-y-1 bg-white/70 dark:bg-slate-900/40 p-2 rounded-xl border">
                                <p className="text-[8px] font-bold text-black dark:text-slate-300 uppercase">
                                  Refracție / Prescripție Ochelari OD
                                </p>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                  placeholder="Refracție / Prescripție Ochelari OD"
                                  value={documentForm.refractieOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      refractieOd: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              <div>
                                <div className="flex justify-between items-center mb-0.5">
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase">
                                    {documentForm.anteriorSegmentAo ? "Pol Anterior AO" : "Pol Anterior OD"}
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={!!documentForm.anteriorSegmentAo}
                                      onChange={(e) => {
                                        const isAo = e.target.checked;
                                        const currentOd = documentForm.anteriorSegmentOd || "";
                                        setDocumentForm({
                                          ...documentForm,
                                          anteriorSegmentAo: isAo,
                                          anteriorSegmentOd: currentOd,
                                          anteriorSegmentOs: isAo ? currentOd : (documentForm.anteriorSegmentOs || ""),
                                        });
                                      }}
                                      className="w-3 h-3 accent-amber-500 rounded"
                                    />
                                    <span className="text-[7.5px] font-black text-amber-500 select-none">AO</span>
                                  </label>
                                </div>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-lg font-bold"
                                  value={documentForm.anteriorSegmentOd || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDocumentForm({
                                      ...documentForm,
                                      anteriorSegmentOd: val,
                                      anteriorSegmentOs: documentForm.anteriorSegmentAo ? val : documentForm.anteriorSegmentOs,
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-0.5">
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase">
                                    {documentForm.posteriorSegmentAo ? "Pol Posterior AO" : "Pol Posterior OD"}
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={!!documentForm.posteriorSegmentAo}
                                      onChange={(e) => {
                                        const isAo = e.target.checked;
                                        const currentOd = documentForm.posteriorSegmentOd || "";
                                        setDocumentForm({
                                          ...documentForm,
                                          posteriorSegmentAo: isAo,
                                          posteriorSegmentOd: currentOd,
                                          posteriorSegmentOs: isAo ? currentOd : (documentForm.posteriorSegmentOs || ""),
                                        });
                                      }}
                                      className="w-3 h-3 accent-amber-500 rounded"
                                    />
                                    <span className="text-[7.5px] font-black text-amber-500 select-none">AO</span>
                                  </label>
                                </div>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-lg font-bold"
                                  value={documentForm.posteriorSegmentOd || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDocumentForm({
                                      ...documentForm,
                                      posteriorSegmentOd: val,
                                      posteriorSegmentOs: documentForm.posteriorSegmentAo ? val : documentForm.posteriorSegmentOs,
                                    });
                                  }}
                                />
                              </div>
                            </div>
    
                            {/* OCHIUL STANG */}
                            <div className="space-y-3 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/10">
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center border-b border-emerald-500/10 pb-1">
                                Ochiul Stâng (OS)
                              </p>
    
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    AV f.c. OS
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    placeholder="Fără corecție"
                                    value={documentForm.avFaraCorectieOs || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        avFaraCorectieOs: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    AV c.c. OS
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.vaWithOs || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDocumentForm({
                                        ...documentForm,
                                        vaWithOs: val,
                                        avCuCorectieOs: val,
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    IOP OS (mmHg)
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.iopOs || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        iopOs: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    Pahimetrie OS (µm)
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.pachymetryOs || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        pachymetryOs: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    IOP Corectată OS
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.correctedIopOs || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        correctedIopOs: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    Keratometrie OS
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.keratometryOs || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        keratometryOs: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                    Lungime Axială OS
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                    value={documentForm.axialLengthOs || ""}
                                    onChange={(e) =>
                                      setDocumentForm({
                                        ...documentForm,
                                        axialLengthOs: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
    
                               <div className="space-y-1 bg-white/70 dark:bg-slate-900/40 p-2 rounded-xl border">
                                <p className="text-[8px] font-bold text-black dark:text-slate-300 uppercase">
                                  Refracție / Prescripție Ochelari OS
                                </p>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-lg font-bold outline-none"
                                  placeholder="Refracție / Prescripție Ochelari OS"
                                  value={documentForm.refractieOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      refractieOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              <div>
                                {documentForm.anteriorSegmentAo ? (
                                  <div className="opacity-60">
                                    <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                      Pol Anterior OS (Sincronizat AO)
                                    </label>
                                    <input
                                      type="text"
                                      disabled
                                      className="w-full p-2 text-xs border rounded-lg font-bold bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400"
                                      value={documentForm.anteriorSegmentOd || ""}
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                      Pol Anterior OS
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full p-2 text-xs border rounded-lg font-bold"
                                      value={documentForm.anteriorSegmentOs || ""}
                                      onChange={(e) =>
                                        setDocumentForm({
                                          ...documentForm,
                                          anteriorSegmentOs: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                              <div>
                                {documentForm.posteriorSegmentAo ? (
                                  <div className="opacity-60">
                                    <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                      Pol Posterior OS (Sincronizat AO)
                                    </label>
                                    <input
                                      type="text"
                                      disabled
                                      className="w-full p-2 text-xs border rounded-lg font-bold bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400"
                                      value={documentForm.posteriorSegmentOd || ""}
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-0.5">
                                      Pol Posterior OS
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full p-2 text-xs border rounded-lg font-bold"
                                      value={documentForm.posteriorSegmentOs || ""}
                                      onChange={(e) =>
                                        setDocumentForm({
                                          ...documentForm,
                                          posteriorSegmentOs: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            4. Diagnostic, Plan & Recuperare
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Diagnostic principal / definitv
                              </label>
                              <textarea
                                rows={2}
                                className="w-full p-2.5 border rounded-xl text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.diagnostic || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    diagnostic: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Tratament prescris
                              </label>
                              <textarea
                                rows={2}
                                className="w-full p-2.5 border rounded-xl text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.treatment || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    treatment: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Interpretare alte examinări oculare
                              </label>
                              <textarea
                                rows={2}
                                className="w-full p-2.5 border rounded-xl text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.examinationInterpretation || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    examinationInterpretation: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Plan de recuperare recomandat
                              </label>
                              <textarea
                                rows={2}
                                className="w-full p-2.5 border rounded-xl text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.recoveryPlan || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    recoveryPlan: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            5. Dată Eliberare
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="grid grid-cols-3 gap-1 md:col-span-2">
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Zi
                                </label>
                                <input
                                  type="text"
                                  className="w-full p-2 text-center text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  value={documentForm.eliberatZi || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatZi: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Lună
                                </label>
                                <select
                                  className="w-full p-2 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  value={documentForm.eliberatLuna || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatLuna: e.target.value,
                                    })
                                  }
                                >
                                  {[
                                    "Ianuarie",
                                    "Februarie",
                                    "Martie",
                                    "Aprilie",
                                    "Mai",
                                    "Iunie",
                                    "Iulie",
                                    "August",
                                    "Septembrie",
                                    "Octombrie",
                                    "Noiembrie",
                                    "Decembrie",
                                  ].map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  An
                                </label>
                                <input
                                  type="text"
                                  className="w-full p-2 text-center text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  value={documentForm.eliberatAn || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatAn: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
    
                    {/* 4. CERTIFICAT */}
                    {activeDocumentModal === "certificat" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Certificat medical A5 Nr.
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 852"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.documentNumber || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  documentNumber: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Județ Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientJudet || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientJudet: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Localitate Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientLocalitate || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientLocalitate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            1. Date Personale Pacient
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Nume Pacient
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientName: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                CNP
                              </label>
                              <input
                                type="text"
                                maxLength={13}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientCnp || ""}
                                onChange={(e) => {
                                  const newCnp = e.target.value;
                                  const detectedSex = getSexFromCNP(newCnp);
                                  setDocumentForm({
                                    ...documentForm,
                                    patientCnp: newCnp,
                                    patientSex: detectedSex || documentForm.patientSex,
                                  });
                                }}
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Sex
                              </label>
                              <select
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientSex || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientSex: e.target.value,
                                  })
                                }
                              >
                                <option value="">-</option>
                                <option value="M">M (Masculin)</option>
                                <option value="F">F (Feminin)</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Vârstă (Detaliat)
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: 45 de ani, 6 luni și 12 zile"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.ageSimple || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    ageSimple: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            2. Domiciliu & BI / CI
                          </p>
    
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Județ Domiciliu
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientJudet || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientJudet: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Localitate Domiciliu
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientLocalitate || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientLocalitate: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Stradă / Alee
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientStrada || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientStrada: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Bloc
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientBloc || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientBloc: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Scară
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientScara || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientScara: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Apartament
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientApartament || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientApartament: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                BI / CI Seria
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientSeries || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientSeries: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                BI / CI Număr
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.patientNumber || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientNumber: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            3. Ocupație & Mediu Angajator
                          </p>
    
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Ocupația de:
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.ocupatie || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    ocupatie: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                La Unitatea / Unitatea în care lucrează:
                              </label>
                              <input
                                type="text"
                                className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={documentForm.lucru || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    lucru: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            4. Diagnostic & Destinație
                          </p>
    
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Este suferind de (Diagnostic)
                            </label>
                            <textarea
                              rows={2}
                              className="w-full p-2.5 border rounded-xl text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                              value={documentForm.diagnostic || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  diagnostic: e.target.value,
                                })
                              }
                            />
                          </div>
    
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              S-a eliberat prezentul spre a-i servi la:
                            </label>
                            <input
                              type="text"
                              className="w-full p-2.5 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                              value={documentForm.servesTo || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  servesTo: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            5. Doctor Semnatar & Dată medicală
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Medic Semnatar / Medic Director
                              </label>
                              <select
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.doctorName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    doctorName: e.target.value,
                                  })
                                }
                              >
                                {sortedDoctorOptions.map((doc) => (
                                  <option key={doc} value={doc}>
                                    {doc}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Zi
                                </label>
                                <input
                                  type="text"
                                  className="w-full p-2 text-center text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  value={documentForm.eliberatZi || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatZi: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  Lună
                                </label>
                                <select
                                  className="w-full p-2 text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  value={documentForm.eliberatLuna || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatLuna: e.target.value,
                                    })
                                  }
                                >
                                  {[
                                    "Ianuarie",
                                    "Februarie",
                                    "Martie",
                                    "Aprilie",
                                    "Mai",
                                    "Iunie",
                                    "Iulie",
                                    "August",
                                    "Septembrie",
                                    "Octombrie",
                                    "Noiembrie",
                                    "Decembrie",
                                  ].map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                  An
                                </label>
                                <input
                                  type="text"
                                  className="w-full p-2 text-center text-xs font-semibold border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  value={documentForm.eliberatAn || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      eliberatAn: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
    
                    {/* 5. EXPERTIZA MEDICALA */}
                    {activeDocumentModal === "expertiza" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Nr. Fișă / Reg. cons.
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.documentNumber || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  documentNumber: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Județ Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientJudet || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientJudet: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                              Localitate Unitate
                            </label>
                            <input
                              type="text"
                              className={cn(
                                "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                darkMode
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-900",
                              )}
                              value={documentForm.patientLocalitate || ""}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  patientLocalitate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            1. Date Personale Pacient
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Nume Complet
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientName || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientName: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                CNP
                              </label>
                              <input
                                type="text"
                                maxLength={13}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientCnp || ""}
                                onChange={(e) => {
                                  const newCnp = e.target.value;
                                  const detectedSex = getSexFromCNP(newCnp);
                                  setDocumentForm({
                                    ...documentForm,
                                    patientCnp: newCnp,
                                    patientSex: detectedSex || documentForm.patientSex,
                                  });
                                }}
                              />
                            </div>
                          </div>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Județ Domiciliu
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientJudet || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientJudet: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                Localitate Domiciliu (Adresă/Domiciliu)
                              </label>
                              <input
                                type="text"
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.patientLocalitate || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    patientLocalitate: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            2. Diagnostice Generale
                          </p>
    
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                1. Diagnostic Clinic
                              </label>
                              <textarea
                                rows={3}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.diagnostic || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    diagnostic: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-black dark:text-slate-200 uppercase mb-1">
                                2. Diagnostic Funcțional / Deficiență Vizuală
                              </label>
                              <textarea
                                rows={3}
                                className={cn(
                                  "w-full p-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-900",
                                )}
                                value={documentForm.diagnosticFunctional || ""}
                                onChange={(e) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    diagnosticFunctional: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            3. Diagnostic Funcțional Integrat
                          </p>
    
                          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden text-xs shadow-sm">
                            <div className="grid grid-cols-3 bg-slate-150 dark:bg-slate-800/80 p-3 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700 items-center">
                              <div className="text-slate-500 dark:text-slate-400 pl-1">Examinare / Rubrică</div>
                              <div className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-cyan-100/65 dark:bg-cyan-950/45 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-900/40 font-black">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                OD (Ochiul Drept)
                              </div>
                              <div className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-indigo-100/65 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 font-black">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                OS (Ochiul Stâng)
                              </div>
                            </div>
    
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                              {/* Row 3 */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  AV fără corecție
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.avFaraCorectieOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      avFaraCorectieOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.avFaraCorectieOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      avFaraCorectieOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 4: AV cu corecție */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  AV cu corecție
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.avCuCorectieOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      avCuCorectieOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.avCuCorectieOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      avCuCorectieOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 5: Refracție */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  Refracție
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.refractieOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      refractieOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.refractieOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      refractieOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 6: CV Manual */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  CV Manual
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.cvManualOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      cvManualOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.cvManualOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      cvManualOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 7: CV Computer */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  CV Computer
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.cvComputerOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      cvComputerOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.cvComputerOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      cvComputerOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 8: TIO */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  TIO
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.tioOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      tioOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.tioOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      tioOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 9: FO */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  FO
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.foOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      foOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.foOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      foOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 10: Raport cupă/disc */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  Raport cupă/disc
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.raportCupaDiscOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      raportCupaDiscOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.raportCupaDiscOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      raportCupaDiscOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 11: Tratament efectuat */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  Tratament efectuat
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.tratamentEfectuatOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      tratamentEfectuatOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.tratamentEfectuatOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      tratamentEfectuatOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
    
                              {/* Row 12: Recomandări */}
                              <div className="grid grid-cols-3 p-2.5 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                                  Recomandări
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-cyan-500/5 dark:bg-cyan-500/2 border-cyan-200 dark:border-cyan-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none text-cyan-900 dark:text-cyan-100"
                                  value={documentForm.recomandariOd || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      recomandariOd: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="text"
                                  className="w-full p-2 text-xs border rounded-xl bg-indigo-500/5 dark:bg-indigo-500/2 border-indigo-200 dark:border-indigo-900/35 font-bold text-center transition-all focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-indigo-900 dark:text-indigo-100"
                                  value={documentForm.recomandariOs || ""}
                                  onChange={(e) =>
                                    setDocumentForm({
                                      ...documentForm,
                                      recomandariOs: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
    
                  {/* Footer with save/print action */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => setActiveDocumentModal(null)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      Anulează
                    </button>
                    <button
                      type="button"
                      id="save-and-print-doc-modal-btn"
                      disabled={isSubmitting}
                      onClick={async () => {
                        try {
                          setIsSubmitting(true);
                          await handleSaveAndPrintDocument();
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-500/10"
                    >
                      <Printer className="w-4 h-4" />
                      {isSubmitting ? "Se salvează & generează PDF..." : "Salvare în Registru & Tipărire PDF"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
  );
});

export default DocumentConfiguratorModal;
