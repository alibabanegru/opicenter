import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, X } from "lucide-react";
import { cn } from "../appConstants";

export interface CNASCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

interface CNASCodeItem {
  code: string;
  label: string;
}

interface CNASCategory {
  title: string;
  items: CNASCodeItem[];
}

const CNAS_CATEGORIES: CNASCategory[] = [
  {
    title: "1. Pleoape, aparat lacrimal și orbită",
    items: [
      { code: "398", label: "Orgelet și chalazion" },
      { code: "399", label: "Alte afecțiuni ale pleoapei" },
      { code: "400", label: "Afecțiuni ale aparatului lacrimal" },
      { code: "401", label: "Afecțiuni ale orbitei" },
    ],
  },
  {
    title: "2. Conjunctivă, sclerotică și cornee",
    items: [
      { code: "402", label: "Conjunctivita" },
      { code: "403", label: "Alte afecțiuni ale conjunctivei" },
      { code: "404", label: "Afecțiuni ale scleroticei" },
      { code: "405", label: "Cheratita" },
      { code: "406", label: "Cicatrice, opacități și alte afecțiuni ale corneei" },
    ],
  },
  {
    title: "3. Iris, corp ciliar și cristalin",
    items: [
      { code: "407", label: "Iridociclita" },
      { code: "408", label: "Alte afecțiuni ale irisului și corpilor ciliari" },
      { code: "409", label: "Cataracta senilă" },
      { code: "410", label: "Alte cataracte" },
      { code: "411", label: "Alte afecțiuni ale cristalinului" },
    ],
  },
  {
    title: "4. Coroidă, retină și glaucom",
    items: [
      { code: "412", label: "Corioretinita și alte afecțiuni ale coroidei" },
      { code: "413", label: "Dezlipirea și ruptura retinei" },
      { code: "414", label: "Alte afecțiuni retiniene" },
      { code: "415", label: "Glaucomul" },
    ],
  },
  {
    title: "5. Corp vitros, glob ocular și nerv optic",
    items: [
      { code: "416", label: "Afecțiuni ale corpului vitros" },
      { code: "417", label: "Afecțiuni ale globului ocular" },
      { code: "418", label: "Nevrita optică" },
      { code: "419", label: "Alte afecțiuni ale nervului și căilor optice" },
    ],
  },
  {
    title: "6. Motilitate oculară, refracție și tulburări de vedere",
    items: [
      { code: "420", label: "Strabism paralitic" },
      { code: "421", label: "Alte anomalii de mișcare binoculară" },
      {
        code: "422",
        label:
          "Vicii de refracție și tulburări de acomodare (include miopia, hipermetropia, astigmatismul, prezbiopia)",
      },
      { code: "423", label: "Tulburări de vedere (ex. ambliopie, diplopie)" },
      { code: "424", label: "Cecitatea și scăderea văzului" },
      { code: "425", label: "Nistagmus și alte mișcări anormale" },
    ],
  },
  {
    title: "7. Alte afecțiuni oftalmologice",
    items: [
      { code: "426", label: "Alte afecțiuni ale ochiului și anexelor sale" },
      {
        code: "427",
        label:
          "Afecțiuni ale ochiului și anexelor sale în vederea diagnosticului și tratamentului, neclasate la alte locuri",
      },
      {
        code: "884",
        label:
          "Leziunea traumatică a ochiului și orbitei (corespondent CIM-10: S05): Include contuziile globului ocular și ale țesuturilor orbitare, plăgile penetrante (cu sau fără corp străin intraocular), rupturile oculare, abraziunile corneei și leziunile traumatice ale conjunctivei.",
      },
      {
        code: "947",
        label:
          "Corp străin în partea externă a ochiului (corespondent CIM-10: T15): Se utilizează pentru corpii străini localizați superficial (în cornee, sacul conjunctival sau alte părți externe ale ochiului). (Notă: Dacă un corp străin a pătruns în interiorul globului ocular, se codifică la 884).",
      },
      {
        code: "955",
        label:
          "Arsuri și coroziuni limitate la ochi și anexele sale (corespondent CIM-10: T26): Acoperă arsurile termice (flacără, lichide fierbinți, radiații/sudură) și arsurile chimice (acizi, baze/var) ale pleoapelor, regiunii perioculare, corneei, conjunctivei sau globului ocular.",
      },
      {
        code: "879",
        label:
          "Leziunea traumatică superficială a capului (ex. echimoză/vânătaie sau contuzie a pleoapei și regiunii perioculare — CIM-10: S00.1).",
      },
      {
        code: "880",
        label:
          "Plaga deschisă a capului (ex. plagă tăiată a pleoapei sau sprâncenei — CIM-10: S01.1).",
      },
      {
        code: "881",
        label:
          "Fractura craniului și a oaselor feței (ex. fractura planșeului orbitei — CIM-10: S02.3).",
      },
      {
        code: "883",
        label:
          "Leziunea traumatică a nervilor cranieni (ex. leziunea nervului optic și a căilor optice — CIM-10: S04.0).",
      },
    ],
  },
];

export const CNASCodesModal: React.FC<CNASCodesModalProps> = ({
  isOpen,
  onClose,
  darkMode,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cnas-codes-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[80]"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border overflow-hidden",
              darkMode
                ? "bg-slate-900 border-slate-800 text-slate-100"
                : "bg-white border-slate-200 text-slate-900",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0",
                darkMode
                  ? "bg-slate-950/60 border-slate-800"
                  : "bg-slate-50 border-slate-200",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "p-2 rounded-xl",
                    darkMode
                      ? "bg-blue-950/60 text-blue-400"
                      : "bg-blue-100 text-blue-700",
                  )}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Coduri CNAS — Oftalmologie
                  </h2>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Fereastră strict informativă de consultare rapidă
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    : "hover:bg-slate-200/70 text-slate-500 hover:text-slate-800",
                )}
                title="Închide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {CNAS_CATEGORIES.map((category) => (
                <div
                  key={category.title}
                  className={cn(
                    "rounded-xl border p-4",
                    darkMode
                      ? "bg-slate-950/40 border-slate-800"
                      : "bg-slate-50/70 border-slate-200",
                  )}
                >
                  <h3
                    className={cn(
                      "text-xs sm:text-sm font-black uppercase tracking-wide mb-2.5",
                      darkMode ? "text-blue-400" : "text-blue-700",
                    )}
                  >
                    {category.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {category.items.map((item) => (
                      <li
                        key={item.code}
                        className="flex items-baseline gap-2 text-xs sm:text-[13px] leading-relaxed"
                      >
                        <span
                          className={cn(
                            "font-mono font-black px-1.5 py-0.5 rounded shrink-0 text-[11px]",
                            darkMode
                              ? "bg-slate-800 text-blue-300 border border-slate-700"
                              : "bg-white text-blue-700 border border-blue-200",
                          )}
                        >
                          {item.code}
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            darkMode ? "text-slate-200" : "text-slate-700",
                          )}
                        >
                          — {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer with Bottom-Right Close Button */}
            <div
              className={cn(
                "px-5 py-3 border-t flex justify-end shrink-0",
                darkMode
                  ? "bg-slate-950/60 border-slate-800"
                  : "bg-slate-50 border-slate-200",
              )}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                Închide
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CNASCodesModal;
