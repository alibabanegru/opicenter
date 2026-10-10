import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, X, Search, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { cn } from "../appConstants";

export interface MedicalRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  filteredRegistryDocs: any[];
  registrySearchQuery: string;
  setRegistrySearchQuery: (val: string) => void;
  openDoctorDocumentEdit: (docRec: any) => void;
  setSuccessMessage: (msg: string) => void;
}

export const MedicalRegistryModal: React.FC<MedicalRegistryModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  filteredRegistryDocs,
  registrySearchQuery,
  setRegistrySearchQuery,
  openDoctorDocumentEdit,
  setSuccessMessage,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="registry-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "rounded-3xl p-6 md:p-8 w-[95vw] max-w-6xl h-[90vh] shadow-2xl border transition-all flex flex-col gap-6 overflow-hidden",
              darkMode
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <ClipboardList className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-sans tracking-tight">
                    Registru Evidență Documente Medicale
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Evidența oficială a documentelor adeverință, referat, raport și certificat medical eliberate pacienților de clinică.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search input bar */}
            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Caută în registru după nume pacient, nr. registru, tip document sau medic..."
                value={registrySearchQuery}
                onChange={(e) => setRegistrySearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none w-full font-bold"
              />
            </div>

            {/* Table rendering */}
            <div className="overflow-x-auto overflow-y-auto flex-1 rounded-2xl border border-slate-150 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={cn(
                      "sticky top-0 z-10 uppercase font-black text-[9px] tracking-widest border-b",
                      darkMode
                        ? "bg-slate-800 text-slate-400 border-slate-700"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    )}
                  >
                    <th className="p-4">Tip Document</th>
                    <th className="p-4">Nr. Registru</th>
                    <th className="p-4">Data Generării</th>
                    <th className="p-4">Nume Pacient</th>
                    <th className="p-4">Medic</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {(() => {
                    const filteredDocs = filteredRegistryDocs;

                    if (filteredDocs.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-8 text-center text-slate-400 italic font-medium"
                          >
                            Nu s-au găsit înregistrări în registru medical.
                          </td>
                        </tr>
                      );
                    }

                    return filteredDocs.map((docRec) => {
                      const docLabels: Record<string, string> = {
                        adeverinta: "Adeverință Medicală",
                        referat: "Referat Medical",
                        raport: "Raport Medical",
                        certificat: "Certificat medical A5",
                        expertiza: "Examen Expertiză Medicală",
                      };
                      const docBadgeColors: Record<string, string> = {
                        adeverinta:
                          "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15",
                        referat:
                          "bg-purple-500/10 text-purple-500 border border-purple-500/15",
                        raport:
                          "bg-amber-500/10 text-amber-500 border border-amber-500/15",
                        certificat:
                          "bg-blue-500/10 text-blue-500 border border-blue-500/15",
                        expertiza:
                          "bg-rose-500/10 text-rose-500 border border-rose-500/15",
                      };

                      return (
                        <tr
                          key={docRec.id}
                          className={cn(
                            "transition-all hover:bg-slate-500/5",
                            darkMode ? "text-slate-200" : "text-slate-800"
                          )}
                        >
                          <td className="p-4 font-extrabold whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2.5 py-1 text-[10px] rounded-full uppercase tracking-wider font-black",
                                docBadgeColors[docRec.type] ||
                                  "bg-slate-100 text-slate-800"
                              )}
                            >
                              {docLabels[docRec.type] || docRec.type}
                            </span>
                          </td>
                          <td className="p-4 font-bold font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {docRec.documentNumber}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {format(
                              new Date(docRec.date),
                              "dd.MM.yyyy HH:mm",
                              { locale: ro }
                            )}
                          </td>
                          <td className="p-4 font-black whitespace-nowrap">
                            {docRec.patientName}
                          </td>
                          <td className="p-4 font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {docRec.formValues?.doctorName || "-"}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Valid
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  openDoctorDocumentEdit(docRec);
                                  onClose();
                                }}
                                className="p-1 px-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-500 flex items-center gap-1 font-bold tracking-wider uppercase text-[10px]"
                                title="Editează document"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Editează
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    confirm(
                                      "Sunteți sigur că doriți să ștergeți DEFINITIV acest document din registru? Această acțiune este irevocabilă și definitivă."
                                    )
                                  ) {
                                    await deleteDoc(
                                      doc(
                                        db,
                                        "medicalDocuments",
                                        docRec.id
                                      )
                                    );
                                    setSuccessMessage(
                                      "Documentul a fost șters definitiv!"
                                    );
                                  }
                                }}
                                className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-500 flex items-center gap-1 font-bold tracking-wider uppercase text-[10px]"
                                title="Șterge document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Șterge
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Back controls inside modal */}
            <div className="flex justify-end gap-3 border-t pt-4 border-slate-200 dark:border-slate-800">
              <button
                onClick={onClose}
                className={cn(
                  "px-6 py-2.5 font-bold text-xs rounded-xl border transition-all",
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                Închide Registru
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
