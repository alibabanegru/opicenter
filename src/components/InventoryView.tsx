import React from "react";
import {
  Package,
  Glasses,
  AlertTriangle,
  EyeOff,
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, FrameStockItem } from "../appConstants";

export interface InventoryViewProps {
  darkMode: boolean;
  frameStockList: FrameStockItem[];
  filteredFrameStock: FrameStockItem[];
  frameSearchQuery: string;
  setFrameSearchQuery: (val: string) => void;
  frameFilterCategory: string;
  setFrameFilterCategory: (val: string) => void;
  frameFilterStatus: "all" | "in_stock" | "low_stock" | "out_of_stock";
  setFrameFilterStatus: (val: "all" | "in_stock" | "low_stock" | "out_of_stock") => void;
  handleOpenFrameModal: (frame?: FrameStockItem) => void;
  handleQuickStockChange: (frameId: string, currentQty: number, delta: number) => Promise<void> | void;
  handleDeleteFrame: (frameId: string, frameCode: string) => Promise<void> | void;
  onClose?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  darkMode,
  frameStockList,
  filteredFrameStock,
  frameSearchQuery,
  setFrameSearchQuery,
  frameFilterCategory,
  setFrameFilterCategory,
  frameFilterStatus,
  setFrameFilterStatus,
  handleOpenFrameModal,
  handleQuickStockChange,
  handleDeleteFrame,
  onClose,
}) => {
  return (
    <div className="space-y-6">
      {/* Frame Stock Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className={cn(
            "p-4 rounded-2xl border transition-all flex flex-col justify-between",
            darkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
          )}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Bucăți în Stoc</span>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
              {frameStockList.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)}
            </span>
            <span className="text-xs text-slate-500 font-medium">bucăți</span>
          </div>
        </div>

        <div
          className={cn(
            "p-4 rounded-2xl border transition-all flex flex-col justify-between",
            darkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
          )}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Modele / Coduri</span>
            <Glasses className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
              {frameStockList.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">modele</span>
          </div>
        </div>

        <div
          className={cn(
            "p-4 rounded-2xl border transition-all flex flex-col justify-between",
            darkMode ? "bg-amber-950/30 border-amber-800/50" : "bg-amber-50/80 border-amber-200"
          )}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Stoc Redus (1-2)</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">
              {frameStockList.filter((i) => (Number(i.quantity) || 0) > 0 && (Number(i.quantity) || 0) <= 2).length}
            </span>
            <span className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">modele</span>
          </div>
        </div>

        <div
          className={cn(
            "p-4 rounded-2xl border transition-all flex flex-col justify-between",
            darkMode ? "bg-red-950/30 border-red-800/50" : "bg-red-50/80 border-red-200"
          )}
        >
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Stoc Epuizat (0)</span>
            <EyeOff className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-red-600 dark:text-red-400">
              {frameStockList.filter((i) => (Number(i.quantity) || 0) === 0).length}
            </span>
            <span className="text-xs text-red-600/70 dark:text-amber-400/70 font-medium">modele</span>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="flex flex-1 flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={frameSearchQuery}
              onChange={(e) => setFrameSearchQuery(e.target.value)}
              placeholder="Caută după cod ramă, brand, locație..."
              className={cn(
                "w-full pl-10 pr-8 py-2.5 rounded-xl border text-xs md:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              )}
            />
            {frameSearchQuery && (
              <button
                onClick={() => setFrameSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={frameFilterCategory}
            onChange={(e) => setFrameFilterCategory(e.target.value)}
            className={cn(
              "px-3 py-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-all",
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-white border-slate-200 text-slate-800"
            )}
          >
            <option value="all">Toate Categoriile</option>
            <option value="Unisex">Unisex</option>
            <option value="Bărbați">Bărbați</option>
            <option value="Femei">Femei</option>
            <option value="Copii">Copii</option>
          </select>

          <select
            value={frameFilterStatus}
            onChange={(e) => setFrameFilterStatus(e.target.value as any)}
            className={cn(
              "px-3 py-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-all",
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-white border-slate-200 text-slate-800"
            )}
          >
            <option value="all">Toate Stocurile</option>
            <option value="in_stock">În Stoc (&gt;2 buc)</option>
            <option value="low_stock">Stoc Redus (1-2 buc)</option>
            <option value="out_of_stock">Stoc Epuizat (0 buc)</option>
          </select>
        </div>

        <button
          onClick={() => handleOpenFrameModal()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Adaugă Ramă Nouă
        </button>
      </div>

      {/* Table of Frames */}
      {filteredFrameStock.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Glasses className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {frameStockList.length === 0
              ? "Nu există niciun cod de ramă în stoc."
              : "Nicio ramă nu corespunde filtrelor selectate."}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {frameStockList.length === 0
              ? 'Apăsați pe "+ Adaugă Ramă Nouă" pentru a adăuga primele modele în inventar.'
              : "Încercați să modificați termenii de căutare sau filtrele."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={cn(
                  "border-b text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400",
                  darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-100 border-slate-200"
                )}
              >
                <th className="p-3">Cod Ramă</th>
                <th className="p-3">Brand / Producător</th>
                <th className="p-3">Categorie</th>
                <th className="p-3 text-right">Preț (RON)</th>
                <th className="p-3">Locație Depozit</th>
                <th className="p-3 text-center">Cantitate Disponibilă</th>
                <th className="p-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-semibold">
              {filteredFrameStock.map((item) => {
                const qty = Number(item.quantity) || 0;
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                      qty === 0 && (darkMode ? "bg-red-950/10" : "bg-red-50/30")
                    )}
                  >
                    <td className="p-3">
                      <span className="font-mono font-black text-sm px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg inline-block">
                        {item.code}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      <div>{item.brand}</div>
                      {item.manufacturer && (
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          Producător: {item.manufacturer}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500 line-clamp-1">
                          {item.notes}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {item.category || "Unisex"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {item.price ? `${item.price.toFixed(2)} RON` : "—"}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-medium">
                      {item.location || "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleQuickStockChange(item.id, qty, -1)}
                          disabled={qty <= 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all font-bold cursor-pointer"
                          title="Scade stoc"
                        >
                          −
                        </button>

                        <div className="flex flex-col items-center min-w-[80px]">
                          <span
                            className={cn(
                              "text-xs font-black px-2 py-0.5 rounded-md",
                              qty > 2
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                : qty > 0
                                ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                : "text-red-600 dark:text-red-400 bg-red-500/10"
                            )}
                          >
                            {qty} buc
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {qty > 2 ? "În Stoc" : qty > 0 ? "Stoc Redus" : "Epuizat"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleQuickStockChange(item.id, qty, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold cursor-pointer"
                          title="Adaugă stoc"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenFrameModal(item)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Editează detaliile ramei"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFrame(item.id, item.code)}
                          className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Șterge rama din stoc"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-4 bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 font-bold py-4 rounded-xl transition-all shadow-md cursor-pointer"
        >
          Închide
        </button>
      )}
    </div>
  );
};
