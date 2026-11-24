import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Store, Search, Check, X } from "lucide-react";
import { cn, FrameStockItem } from "../appConstants";

interface FramePickerModalProps {
  framePickerTarget: "distance" | "near" | null;
  onClose: () => void;
  darkMode: boolean;
  framePickerSearch: string;
  setFramePickerSearch: (val: string) => void;
  framePickerCategory: string;
  setFramePickerCategory: (val: string) => void;
  filteredPickerStockFrames: FrameStockItem[];
  onSelectFrame: (item: FrameStockItem) => void;
}

export const FramePickerModal: React.FC<FramePickerModalProps> = React.memo(({
  framePickerTarget,
  onClose,
  darkMode,
  framePickerSearch,
  setFramePickerSearch,
  framePickerCategory,
  setFramePickerCategory,
  filteredPickerStockFrames,
  onSelectFrame,
}) => {
  return (
    <AnimatePresence>
      {framePickerTarget && (
        <motion.div
          key="frame-picker-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              "w-full max-w-3xl max-h-[85vh] rounded-3xl p-6 shadow-2xl border flex flex-col overflow-hidden",
              darkMode
                ? "bg-slate-900 border-slate-800 text-slate-100"
                : "bg-white border-slate-200 text-slate-900"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black tracking-tight">
                      Alege Ramă din Stoc
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {framePickerTarget === "distance"
                        ? "Ochelari Distanță"
                        : "Ochelari Aproape"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selectați o ramă din inventarul clinicii. Stocul se scade automat și o singură dată la salvarea comenzii.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-2 rounded-full transition-colors cursor-pointer",
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                    : "hover:bg-slate-100 text-slate-500 hover:text-black"
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Controls: Search + Category filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={framePickerSearch}
                  onChange={(e) => setFramePickerSearch(e.target.value)}
                  placeholder="Caută după Brand, Cod, Producător, Locație..."
                  className={cn(
                    "w-full pl-9 pr-8 py-2.5 border-2 rounded-xl outline-none text-xs sm:text-sm font-medium transition-all",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                  )}
                />
                {framePickerSearch && (
                  <button
                    type="button"
                    onClick={() => setFramePickerSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <div>
                <select
                  value={framePickerCategory}
                  onChange={(e) => setFramePickerCategory(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2.5 border-2 rounded-xl outline-none text-xs sm:text-sm font-bold transition-all cursor-pointer",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                  )}
                >
                  <option value="Toate">Toate Categoriile</option>
                  <option value="Bărbați">Bărbați</option>
                  <option value="Femei">Femei</option>
                  <option value="Copii">Copii</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
            </div>

            {/* List of frames */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 min-h-[250px]">
              {filteredPickerStockFrames.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6 space-y-2">
                  <Store className="w-10 h-10 text-slate-400 opacity-40" />
                  <p className="text-sm font-bold text-slate-500">
                    Nu s-a găsit nicio ramă în stoc conform filtrelor aplicate.
                  </p>
                </div>
              ) : (
                filteredPickerStockFrames.map((item) => {
                  const qty = Number(item.quantity) || 0;
                  const isOutOfStock = qty <= 0;
                  const fullName = item.brand ? `${item.brand} - ${item.code}` : item.code;

                  return (
                    <div
                      key={`picker-frame-${item.id}`}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs",
                        darkMode
                          ? "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                      )}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-base text-slate-900 dark:text-slate-100">
                            {fullName}
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {item.category}
                            </span>
                          )}
                          {item.location && (
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                              📍 Locație: {item.location}
                            </span>
                          )}
                        </div>
                        {item.manufacturer && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Producător: {item.manufacturer}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs italic text-slate-400">
                            Notă: {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                        <div className="text-right">
                          <div className="font-black text-base text-emerald-600 dark:text-emerald-400">
                            {item.price ? `${item.price} LEI` : "Preț neprecizat"}
                          </div>
                          <span
                            className={cn(
                              "inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-0.5 tracking-wider",
                              qty > 2
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : qty > 0
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            )}
                          >
                            {qty > 2
                              ? `Stoc: ${qty} buc.`
                              : qty > 0
                              ? `Stoc scăzut: ${qty} buc.`
                              : `Stoc 0 (Epuizat)`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectFrame(item)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md active:scale-95",
                            isOutOfStock
                              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                          )}
                        >
                          <Check className="w-4 h-4" />
                          <span>{isOutOfStock ? "Alege (Stoc 0)" : "Alege"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex justify-between items-center text-xs text-slate-500">
              <span className="font-bold">
                {filteredPickerStockFrames.length} rame în lista de stoc
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
              >
                Închide
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
