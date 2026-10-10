import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Glasses, X, AlertTriangle, Save } from "lucide-react";
import { cn } from "../appConstants";

export interface FrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  editingFrameId: string | null;
  existingBrands: string[];
  existingManufacturers: string[];
  frameFormBrand: string;
  setFrameFormBrand: (val: string) => void;
  frameFormManufacturer: string;
  setFrameFormManufacturer: (val: string) => void;
  frameFormCategory: string;
  setFrameFormCategory: (val: string) => void;
  frameFormCode: string;
  setFrameFormCode: (val: string) => void;
  frameFormQuantity: number;
  setFrameFormQuantity: (val: number) => void;
  frameFormPrice: string;
  setFrameFormPrice: (val: string) => void;
  frameFormLocation: string;
  setFrameFormLocation: (val: string) => void;
  frameFormNotes: string;
  setFrameFormNotes: (val: string) => void;
  frameFormError: string;
  handleBrandChange: (val: string) => void;
  handleSaveFrame: () => Promise<void> | void;
}

export const FrameModal: React.FC<FrameModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  editingFrameId,
  existingBrands,
  existingManufacturers,
  frameFormBrand,
  frameFormManufacturer,
  setFrameFormManufacturer,
  frameFormCategory,
  setFrameFormCategory,
  frameFormCode,
  setFrameFormCode,
  frameFormQuantity,
  setFrameFormQuantity,
  frameFormPrice,
  setFrameFormPrice,
  frameFormLocation,
  setFrameFormLocation,
  frameFormNotes,
  setFrameFormNotes,
  frameFormError,
  handleBrandChange,
  handleSaveFrame,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="frame-stock-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              "rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border transition-all relative overflow-hidden",
              darkMode
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex justify-between items-center border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Glasses className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black">
                    {editingFrameId ? "Editează Rama din Stoc" : "Adaugă Ramă Nouă în Stoc"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Introduceți detaliile ramei pentru monitorizarea stocului și sugestii rapide
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {frameFormError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{frameFormError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveFrame();
              }}
              className="space-y-4"
            >
              <datalist id="frame-brands-list">
                {existingBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <datalist id="frame-manufacturers-list">
                {existingManufacturers.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>

              {/* Rubrica 1: Brand & Producător */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="frame-brands-list"
                    value={frameFormBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    placeholder="Ex: Ray-Ban, Vogue, Gucci"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Producător
                  </label>
                  <input
                    type="text"
                    list="frame-manufacturers-list"
                    value={frameFormManufacturer}
                    onChange={(e) => setFrameFormManufacturer(e.target.value)}
                    placeholder="Ex: Luxottica, Kering, Safilo"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    )}
                  />
                </div>
              </div>

              {/* Rubrica 2: Categorie & Cod Ramă */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Categorie
                  </label>
                  <select
                    value={frameFormCategory}
                    onChange={(e) => setFrameFormCategory(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Bărbați">Bărbați</option>
                    <option value="Femei">Femei</option>
                    <option value="Copii">Copii</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Cod Ramă <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={frameFormCode}
                    onChange={(e) => setFrameFormCode(e.target.value.toUpperCase())}
                    placeholder="Ex: RB5154, TF5523, GG0061O"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Cantitate Disponibilă <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={frameFormQuantity}
                    onChange={(e) => setFrameFormQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Preț Vânzare (RON)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={frameFormPrice}
                    onChange={(e) => setFrameFormPrice(e.target.value)}
                    placeholder="Ex: 450.00"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Locație / Sertar Depozit
                </label>
                <input
                  type="text"
                  value={frameFormLocation}
                  onChange={(e) => setFrameFormLocation(e.target.value)}
                  placeholder="Ex: Vitrina A / Raft 2 / Sertar B"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Note / Observații
                </label>
                <textarea
                  rows={2}
                  value={frameFormNotes}
                  onChange={(e) => setFrameFormNotes(e.target.value)}
                  placeholder="Formă, culoare, detalii suplimentare..."
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editingFrameId ? "Salvează Modificările" : "Adaugă în Stoc"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
