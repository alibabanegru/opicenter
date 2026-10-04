import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CircleDot,
  X,
  Check,
  Trash2,
  Calculator,
  ArrowRightLeft,
  Info,
  RotateCcw,
} from "lucide-react";
import {
  cn,
  vertexCompensation,
  ContactLensPrescription,
} from "../appConstants";

export interface ContactLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  clEye: "OD" | "OS";
  setClEye: (eye: "OD" | "OS") => void;
  tempClData: ContactLensPrescription;
  setTempClData: React.Dispatch<React.SetStateAction<ContactLensPrescription>>;
  clModalError: string | null;
  setClModalError: (err: string | null) => void;
  clEqSfericActive: boolean;
  setClEqSfericActive: (val: boolean) => void;
  clOriginalData: { sph: string; cyl: string; axis: string } | null;
  setClOriginalData: (
    val: { sph: string; cyl: string; axis: string } | null,
  ) => void;
  currentMedicalRecord: any;
  setCurrentMedicalRecord: (rec: any) => void;
}

const COMMON_BC = ["8.3", "8.4", "8.5", "8.6", "8.7", "8.8"];
const COMMON_DIA = ["14.0", "14.2", "14.4", "14.5"];
const POPULAR_BRANDS = [
  "Acuvue Oasys",
  "Biofinity",
  "Air Optix HydraGlyde",
  "Dailies Total 1",
  "Ultra (Bausch+Lomb)",
  "Clariti 1 Day",
  "PureVision 2",
  "Biotrue ONEday",
];
const WEARING_TYPES = ["Zilnică", "Bilunară", "Lunară", "Port Extins"];

export const ContactLensModal: React.FC<ContactLensModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  clEye,
  setClEye,
  setTempClData,
  clModalError,
  setClModalError,
  clEqSfericActive,
  setClEqSfericActive,
  clOriginalData,
  setClOriginalData,
  currentMedicalRecord,
  setCurrentMedicalRecord,
}) => {
  // Local state maintaining both OD and OS prescriptions simultaneously
  const [localCl, setLocalCl] = React.useState<{
    od: ContactLensPrescription;
    os: ContactLensPrescription;
  }>(() => ({
    od: currentMedicalRecord?.cl_od
      ? { ...currentMedicalRecord.cl_od }
      : {
          sph: currentMedicalRecord?.od?.sph
            ? vertexCompensation(currentMedicalRecord.od.sph)
            : "",
          cyl: currentMedicalRecord?.od?.cyl || "",
          axis: currentMedicalRecord?.od?.axis || "",
          base: "8.6",
          radius: "14.2",
          brand: "",
          wearingType: "Lunară",
        },
    os: currentMedicalRecord?.cl_os
      ? { ...currentMedicalRecord.cl_os }
      : {
          sph: currentMedicalRecord?.os?.sph
            ? vertexCompensation(currentMedicalRecord.os.sph)
            : "",
          cyl: currentMedicalRecord?.os?.cyl || "",
          axis: currentMedicalRecord?.os?.axis || "",
          base: "8.6",
          radius: "14.2",
          brand: "",
          wearingType: "Lunară",
        },
  }));

  // Re-synchronize when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalCl({
        od: currentMedicalRecord?.cl_od
          ? { ...currentMedicalRecord.cl_od }
          : {
              sph: currentMedicalRecord?.od?.sph
                ? vertexCompensation(currentMedicalRecord.od.sph)
                : "",
              cyl: currentMedicalRecord?.od?.cyl || "",
              axis: currentMedicalRecord?.od?.axis || "",
              base: "8.6",
              radius: "14.2",
              brand: "",
              wearingType: "Lunară",
            },
        os: currentMedicalRecord?.cl_os
          ? { ...currentMedicalRecord.cl_os }
          : {
              sph: currentMedicalRecord?.os?.sph
                ? vertexCompensation(currentMedicalRecord.os.sph)
                : "",
              cyl: currentMedicalRecord?.os?.cyl || "",
              axis: currentMedicalRecord?.os?.axis || "",
              base: "8.6",
              radius: "14.2",
              brand: "",
              wearingType: "Lunară",
            },
      });
      setClModalError(null);
      setClEqSfericActive(false);
      setClOriginalData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEyeKey = clEye.toLowerCase() as "od" | "os";
  const activeCl = localCl[currentEyeKey];
  const spectacleEye = currentMedicalRecord?.[currentEyeKey];
  const existingClForEye =
    clEye === "OD"
      ? currentMedicalRecord?.cl_od
      : currentMedicalRecord?.cl_os;

  const updateActiveCl = (
    patch:
      | Partial<ContactLensPrescription>
      | ((prev: ContactLensPrescription) => ContactLensPrescription),
  ) => {
    setLocalCl((prev) => {
      const cur = prev[currentEyeKey];
      const updated =
        typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
      return {
        ...prev,
        [currentEyeKey]: updated,
      };
    });
  };

  const handleSwitchEye = (newEye: "OD" | "OS") => {
    setClEye(newEye);
    setClModalError(null);
    setClEqSfericActive(false);
    setClOriginalData(null);
  };

  // Helper to adjust diopters in 0.25 steps
  const stepValue = (field: "sph" | "cyl", delta: number) => {
    const raw = (activeCl[field] || "").replace(",", ".");
    let val = parseFloat(raw);
    if (isNaN(val)) val = 0;
    val = Math.round((val + delta) * 4) / 4;
    const sign = val > 0 ? "+" : val === 0 ? "" : "";
    const formatted = val === 0 ? "0.00" : `${sign}${val.toFixed(2)}`;
    updateActiveCl({ [field]: formatted.trim() });
  };

  // Calculate Spherical Equivalent
  const calculateSphericalEquivalent = () => {
    const sphNum = parseFloat((activeCl.sph || "0").replace(",", ".")) || 0;
    const cylNum = parseFloat((activeCl.cyl || "0").replace(",", ".")) || 0;
    const eq = sphNum + cylNum / 2;
    const rounded = Math.round(eq * 4) / 4;
    const sign = rounded > 0 ? "+" : rounded === 0 ? "" : "";
    return rounded === 0 ? "0.00" : `${sign}${rounded.toFixed(2)}`;
  };

  const handleToggleSphericalEquivalent = () => {
    if (clEqSfericActive) {
      if (clOriginalData) {
        updateActiveCl({
          sph: clOriginalData.sph,
          cyl: clOriginalData.cyl,
          axis: clOriginalData.axis,
        });
      }
      setClEqSfericActive(false);
    } else {
      setClOriginalData({
        sph: activeCl.sph || "",
        cyl: activeCl.cyl || "",
        axis: activeCl.axis || "",
      });
      const eq = calculateSphericalEquivalent();
      updateActiveCl({
        sph: eq,
        cyl: "",
        axis: "",
      });
      setClEqSfericActive(true);
    }
  };

  // Recalculate vertex compensation from spectacle
  const handleRecalculateVertex = () => {
    if (spectacleEye?.sph) {
      const compensated = vertexCompensation(spectacleEye.sph);
      updateActiveCl({ sph: compensated });
    }
  };

  // Copy prescription to the other eye
  const handleCopyToOtherEye = () => {
    const targetKey = clEye === "OD" ? "os" : "od";
    setLocalCl((prev) => ({
      ...prev,
      [targetKey]: { ...prev[currentEyeKey] },
    }));
  };

  // Delete contact lens for current eye
  const handleDeleteCurrentEye = () => {
    updateActiveCl({
      sph: "",
      cyl: "",
      axis: "",
      base: "",
      radius: "",
      brand: "",
      wearingType: "",
    });
  };

  const hasEyeData = (lens: ContactLensPrescription | undefined | null) => {
    if (!lens) return false;
    return (
      Boolean(lens.sph?.trim()) ||
      Boolean(lens.cyl?.trim()) ||
      Boolean(lens.brand?.trim()) ||
      Boolean(lens.base?.trim() && lens.base !== "8.6")
    );
  };

  // Save ALL contact lens data (OD and OS) to currentMedicalRecord
  const handleSave = () => {
    if (!currentMedicalRecord) return;

    const cleanLens = (
      lens: ContactLensPrescription,
    ): ContactLensPrescription => ({
      sph: (lens.sph || "").trim(),
      cyl: (lens.cyl || "").trim(),
      axis: (lens.axis || "").trim(),
      base: (lens.base || "8.6").trim(),
      radius: (lens.radius || "14.2").trim(),
      brand: (lens.brand || "").trim(),
      wearingType: (lens.wearingType || "Lunară").trim(),
    });

    const updated = { ...currentMedicalRecord };

    // Process OD
    if (hasEyeData(localCl.od)) {
      updated.cl_od = cleanLens(localCl.od);
    } else {
      delete updated.cl_od;
    }

    // Process OS
    if (hasEyeData(localCl.os)) {
      updated.cl_os = cleanLens(localCl.os);
    } else {
      delete updated.cl_os;
    }

    setCurrentMedicalRecord(updated);

    // Sync active eye with tempClData for any parent components
    const currentActiveSaved =
      clEye === "OD" ? updated.cl_od : updated.cl_os;
    if (currentActiveSaved) {
      setTempClData({ ...currentActiveSaved });
    }

    onClose();
  };

  const hasCylinder =
    Boolean(activeCl.cyl) && parseFloat(activeCl.cyl.replace(",", ".")) !== 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[110] overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className={cn(
            "rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-2xl border transition-all my-auto",
            darkMode
              ? "bg-slate-900 border-slate-800 text-slate-100"
              : "bg-white border-slate-200 text-slate-900",
          )}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-2xl shadow-inner border flex items-center justify-center",
                  clEye === "OD"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
                )}
              >
                <CircleDot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                  Prescripție Lentile de Contact
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Configurare parametrii optici și fizici pentru adaptare lentile
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-full transition-colors cursor-pointer",
                darkMode
                  ? "hover:bg-slate-800 text-slate-400"
                  : "hover:bg-slate-100 text-slate-500",
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Eye Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-5 shadow-inner">
            <button
              type="button"
              onClick={() => handleSwitchEye("OD")}
              className={cn(
                "flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer",
                clEye === "OD"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
              OD (Ochiul Drept)
              {(hasEyeData(localCl.od) || currentMedicalRecord?.cl_od) && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                  Configurat
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchEye("OS")}
              className={cn(
                "flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer",
                clEye === "OS"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              OS (Ochiul Stâng)
              {(hasEyeData(localCl.os) || currentMedicalRecord?.cl_os) && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                  Configurat
                </span>
              )}
            </button>
          </div>

          {/* Spectacle Refraction Reference & Vertex Note */}
          {spectacleEye && (
            <div
              className={cn(
                "p-3 rounded-2xl mb-4 border flex flex-wrap items-center justify-between gap-2 text-xs",
                darkMode
                  ? "bg-slate-800/60 border-slate-700/80"
                  : "bg-slate-50 border-slate-200",
              )}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">
                  Dioptrii Ochelari {clEye}:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  Sph: {spectacleEye.sph || "0.00"} | Cyl:{" "}
                  {spectacleEye.cyl || "0.00"} | Ax:{" "}
                  {spectacleEye.axis ? `${spectacleEye.axis}°` : "-"}
                </span>
              </div>

              {spectacleEye.sph && (
                <button
                  type="button"
                  onClick={handleRecalculateVertex}
                  title="Recalculează compensarea distanței vertex (12mm)"
                  className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Vertex (12mm)
                </button>
              )}
            </div>
          )}

          {clModalError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-bold">
              {clModalError}
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-5">
            {/* Optical Parameters: Sph, Cyl, Axis */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Parametri Optici (Dioptrii)
                </label>

                {/* Spherical Equivalent Button */}
                {(hasCylinder || clEqSfericActive) && (
                  <button
                    type="button"
                    onClick={handleToggleSphericalEquivalent}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border",
                      clEqSfericActive
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    {clEqSfericActive ? (
                      <span>Echiv. Sferic Activ (Revino)</span>
                    ) : (
                      <span>
                        Echiv. Sferic ({calculateSphericalEquivalent()})
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* SPH */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                      Sferă (SPH)
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => stepValue("sph", -0.25)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => stepValue("sph", 0.25)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={activeCl.sph || ""}
                    onChange={(e) =>
                      updateActiveCl({
                        sph: e.target.value,
                      })
                    }
                    placeholder="ex: -2.50"
                    className={cn(
                      "w-full p-2.5 border-2 rounded-xl text-center font-mono text-base font-black outline-none transition-all",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500",
                    )}
                  />
                </div>

                {/* CYL */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                      Cilindru (CYL)
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={clEqSfericActive}
                        onClick={() => stepValue("cyl", -0.25)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-40"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        disabled={clEqSfericActive}
                        onClick={() => stepValue("cyl", 0.25)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    disabled={clEqSfericActive}
                    value={clEqSfericActive ? "" : activeCl.cyl || ""}
                    onChange={(e) =>
                      updateActiveCl({
                        cyl: e.target.value,
                      })
                    }
                    placeholder={clEqSfericActive ? "N/A" : "ex: -0.75"}
                    className={cn(
                      "w-full p-2.5 border-2 rounded-xl text-center font-mono text-base font-black outline-none transition-all disabled:opacity-50",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500",
                    )}
                  />
                </div>

                {/* AXIS */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 block">
                    Ax (AXIS)
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={clEqSfericActive}
                      value={clEqSfericActive ? "" : activeCl.axis || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        updateActiveCl({
                          axis: val,
                        });
                      }}
                      onBlur={(e) => {
                        const num = parseInt(e.target.value);
                        if (!isNaN(num)) {
                          const clamped = Math.max(0, Math.min(180, num));
                          updateActiveCl({
                            axis: clamped.toString(),
                          });
                        }
                      }}
                      placeholder={clEqSfericActive ? "N/A" : "0 - 180"}
                      className={cn(
                        "w-full p-2.5 border-2 rounded-xl text-center font-mono text-base font-black outline-none transition-all disabled:opacity-50",
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500",
                      )}
                    />
                    {!clEqSfericActive && activeCl.axis && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                        °
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Geometry: Base Curve (BC) & Diameter (DIA) */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Geometrie Lentilă (Curbură & Diametru)
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* BC */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Rază Curbură (BC)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      standard: 8.6
                    </span>
                  </div>
                  <input
                    type="text"
                    value={activeCl.base || ""}
                    onChange={(e) =>
                      updateActiveCl({
                        base: e.target.value,
                      })
                    }
                    placeholder="ex: 8.6"
                    className={cn(
                      "w-full p-2.5 border-2 rounded-xl text-center font-mono text-sm font-black outline-none transition-all",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500",
                    )}
                  />
                  <div className="flex flex-wrap gap-1">
                    {COMMON_BC.map((bc) => (
                      <button
                        key={bc}
                        type="button"
                        onClick={() => updateActiveCl({ base: bc })}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer border",
                          activeCl.base === bc
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent",
                        )}
                      >
                        {bc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DIA */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Diametru (DIA)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      standard: 14.2
                    </span>
                  </div>
                  <input
                    type="text"
                    value={activeCl.radius || ""}
                    onChange={(e) =>
                      updateActiveCl({
                        radius: e.target.value,
                      })
                    }
                    placeholder="ex: 14.2"
                    className={cn(
                      "w-full p-2.5 border-2 rounded-xl text-center font-mono text-sm font-black outline-none transition-all",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500",
                    )}
                  />
                  <div className="flex flex-wrap gap-1">
                    {COMMON_DIA.map((dia) => (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => updateActiveCl({ radius: dia })}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer border",
                          activeCl.radius === dia
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent",
                        )}
                      >
                        {dia}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand & Wearing Schedule */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Producător & Tip Port
              </label>

              {/* Wearing Types */}
              <div className="grid grid-cols-4 gap-2">
                {WEARING_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateActiveCl({ wearingType: type })}
                    className={cn(
                      "py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                      activeCl.wearingType === type
                        ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Brand Input & Popular Chips */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={activeCl.brand || ""}
                  onChange={(e) =>
                    updateActiveCl({
                      brand: e.target.value,
                    })
                  }
                  placeholder="Brand / Model lentilă (ex: Acuvue Oasys, Biofinity)"
                  className={cn(
                    "w-full p-2.5 border-2 rounded-xl text-sm font-medium outline-none transition-all",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500",
                  )}
                />
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => updateActiveCl({ brand: b })}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border",
                        activeCl.brand === b
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-transparent",
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              {/* Copy to other eye */}
              <button
                type="button"
                onClick={handleCopyToOtherEye}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200",
                )}
                title={`Copiază parametrii la ${clEye === "OD" ? "OS" : "OD"}`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Copiază la {clEye === "OD" ? "OS" : "OD"}
              </button>

              {/* Delete button if exists */}
              {(hasEyeData(activeCl) || existingClForEye) && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentEye}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Șterge Lentilă {clEye}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex-1 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all border cursor-pointer",
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                    : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
                )}
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  "flex-1 py-3 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 shadow-blue-900/25 active:scale-[0.98]",
                )}
              >
                <Check className="w-4 h-4" />
                Salvează
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
