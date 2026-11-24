import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { Activity, X } from "lucide-react";
import { cn, MedicalRecord } from "../appConstants";

const cleanNameStr = (s: string) =>
  s
    ? s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim()
    : "";

interface IopChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentMedicalRecord: MedicalRecord;
  medicalRecords: MedicalRecord[];
}

interface IopTimelinePoint {
  key: string;
  timestamp: number;
  dateLabel: string;
  iopOd: number | null;
  iopOs: number | null;
  corrOd: number | null;
  corrOs: number | null;
  cctOd: number | null;
  cctOs: number | null;
  source: string;
}

const parseNumericVal = (raw: unknown): number | null => {
  if (raw === undefined || raw === null) return null;
  const cleaned = String(raw).trim().replace(",", ".");
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) || !isFinite(num) || num <= 0 ? null : num;
};

const formatDateShort = (dateStr?: string): { label: string; ts: number } => {
  if (!dateStr) {
    const now = Date.now();
    return { label: "Curentă", ts: now };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { label: dateStr, ts: Date.now() };
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return { label: `${dd}.${mm}.${yyyy}`, ts: d.getTime() };
};

export const IopChartModal: React.FC<IopChartModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  currentMedicalRecord,
  medicalRecords,
}) => {
  const [showCorrected, setShowCorrected] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, onClose]);

  const timeline = useMemo<IopTimelinePoint[]>(() => {
    if (!isOpen || !currentMedicalRecord) return [];

    const targetCnp = (currentMedicalRecord.patientCnp || "").trim();
    const targetPhone = (currentMedicalRecord.patientPhone || "").replace(/\D/g, "");
    const targetName = cleanNameStr(currentMedicalRecord.patientName || "");

    const matchingRecords = (medicalRecords || []).filter((r) => {
      if (!r) return false;
      if (r.id && currentMedicalRecord.id && r.id === currentMedicalRecord.id) return false;
      const rCnp = (r.patientCnp || "").trim();
      if (targetCnp && rCnp && targetCnp === rCnp) return true;
      const rPhone = (r.patientPhone || "").replace(/\D/g, "");
      if (targetPhone.length >= 6 && rPhone && targetPhone === rPhone) return true;
      const rName = cleanNameStr(r.patientName || "");
      return Boolean(targetName && rName && targetName === rName);
    });

    const combined = [...matchingRecords, currentMedicalRecord];
    const byDayKey = new Map<string, IopTimelinePoint>();

    combined.forEach((rec) => {
      const isCurrent = rec.id === currentMedicalRecord.id;
      const rawCurrentDate = isCurrent
        ? rec.updatedAt || rec.createdAt || new Date().toISOString()
        : rec.updatedAt || rec.createdAt;

      const pushPoint = (
        pointKey: string,
        rawDateStr: string | undefined,
        iopObj: { od?: string; os?: string } | undefined,
        corrObj: { od?: string; os?: string } | undefined,
        cctObj: { od?: string; os?: string } | undefined,
        isActivePoint: boolean,
        sourceLabel: string,
      ) => {
        const iopOd = parseNumericVal(iopObj?.od);
        const iopOs = parseNumericVal(iopObj?.os);
        const corrOd = parseNumericVal(corrObj?.od);
        const corrOs = parseNumericVal(corrObj?.os);
        const cctOd = parseNumericVal(cctObj?.od);
        const cctOs = parseNumericVal(cctObj?.os);

        if (
          iopOd === null &&
          iopOs === null &&
          corrOd === null &&
          corrOs === null &&
          cctOd === null &&
          cctOs === null
        ) {
          return null;
        }

        const { label, ts } = formatDateShort(rawDateStr);
        const point: IopTimelinePoint = {
          key: pointKey,
          timestamp: ts,
          dateLabel: isActivePoint ? `${label} (Activ)` : label,
          iopOd,
          iopOs,
          corrOd,
          corrOs,
          cctOd,
          cctOs,
          source: sourceLabel,
        };
        byDayKey.set(pointKey, point);
        return point;
      };

      const activePoint = pushPoint(
        `rec_${rec.id || "curr"}`,
        rawCurrentDate,
        rec.iop,
        rec.correctedIop,
        rec.pachymetry,
        isCurrent,
        isCurrent ? "Consultație curentă" : "Istoric",
      );

      if (Array.isArray(rec.prescriptionHistory)) {
        rec.prescriptionHistory.forEach((hist: any, idx: number) => {
          if (!hist) return;
          const { label: hLabel } = formatDateShort(hist.date);
          const iopOd = parseNumericVal(hist.iop?.od);
          const iopOs = parseNumericVal(hist.iop?.os);
          const corrOd = parseNumericVal(hist.correctedIop?.od);
          const corrOs = parseNumericVal(hist.correctedIop?.os);
          const cctOd = parseNumericVal(hist.pachymetry?.od);
          const cctOs = parseNumericVal(hist.pachymetry?.os);

          const sameAsActive =
            activePoint &&
            activePoint.dateLabel.startsWith(hLabel) &&
            activePoint.iopOd === iopOd &&
            activePoint.iopOs === iopOs &&
            activePoint.corrOd === corrOd &&
            activePoint.corrOs === corrOs &&
            activePoint.cctOd === cctOd &&
            activePoint.cctOs === cctOs;

          if (sameAsActive) return;

          pushPoint(
            `hist_${rec.id || "curr"}_${idx}_${hLabel}`,
            hist.date,
            hist.iop,
            hist.correctedIop,
            hist.pachymetry,
            false,
            "Consultație anterioară",
          );
        });
      }
    });

    return Array.from(byDayKey.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [isOpen, currentMedicalRecord, medicalRecords]);

  if (!isOpen) return null;

  const latest = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const previous = timeline.length > 1 ? timeline[timeline.length - 2] : null;

  const formatDelta = (curr: number | null, prev: number | null) => {
    if (curr === null || prev === null) return null;
    const diff = curr - prev;
    if (Math.abs(diff) < 0.05) return "0.0";
    return `${diff > 0 ? "+" : ""}${diff.toFixed(1)}`;
  };

  const textColor = darkMode ? "#cbd5e1" : "#475569";
  const gridColor = darkMode ? "#334155" : "#e2e8f0";

  return (
    <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div
        className={cn(
          "w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border shadow-2xl space-y-5",
          darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Evoluție Tensiune Oculară (PIO) &amp; Pachimetrie
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pacient: <span className="font-bold text-slate-700 dark:text-slate-200">{currentMedicalRecord.patientName}</span> • Date calculate local din fișele încărcate
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-full transition-colors cursor-pointer",
              darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            )}
            title="Închide (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary KPI Cards */}
        {latest && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={cn("p-3.5 rounded-2xl border", darkMode ? "bg-slate-800/50 border-slate-800" : "bg-blue-50/60 border-blue-100")}>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Ultimul PIO OD
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black">
                  {latest.iopOd !== null ? `${latest.iopOd.toFixed(1)} mmHg` : "—"}
                </span>
                {formatDelta(latest.iopOd, previous?.iopOd ?? null) && (
                  <span className="text-[11px] font-bold text-slate-500">
                    ({formatDelta(latest.iopOd, previous?.iopOd ?? null)})
                  </span>
                )}
              </div>
              {latest.corrOd !== null && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Corectat: <strong>{latest.corrOd.toFixed(1)} mmHg</strong>
                </p>
              )}
            </div>

            <div className={cn("p-3.5 rounded-2xl border", darkMode ? "bg-slate-800/50 border-slate-800" : "bg-emerald-50/60 border-emerald-100")}>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Ultimul PIO OS
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black">
                  {latest.iopOs !== null ? `${latest.iopOs.toFixed(1)} mmHg` : "—"}
                </span>
                {formatDelta(latest.iopOs, previous?.iopOs ?? null) && (
                  <span className="text-[11px] font-bold text-slate-500">
                    ({formatDelta(latest.iopOs, previous?.iopOs ?? null)})
                  </span>
                )}
              </div>
              {latest.corrOs !== null && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Corectat: <strong>{latest.corrOs.toFixed(1)} mmHg</strong>
                </p>
              )}
            </div>

            <div className={cn("p-3.5 rounded-2xl border", darkMode ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-200")}>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pachimetrie OD
              </span>
              <div className="text-xl font-black mt-1">
                {latest.cctOd !== null ? `${Math.round(latest.cctOd)} µm` : "—"}
              </div>
            </div>

            <div className={cn("p-3.5 rounded-2xl border", darkMode ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-200")}>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pachimetrie OS
              </span>
              <div className="text-xl font-black mt-1">
                {latest.cctOs !== null ? `${Math.round(latest.cctOs)} µm` : "—"}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCorrected}
              onChange={(e) => setShowCorrected(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Afișează și curbele de PIO Corectat (linie punctată)</span>
          </label>
          <span className="text-[11px] font-semibold text-rose-500">
            Linie roșie prag superior normal: 21 mmHg
          </span>
        </div>

        {/* Chart */}
        {timeline.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-50" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Nu există încă valori de tensiune oculară sau pachimetrie înregistrate pentru acest pacient.
            </p>
          </div>
        ) : (
          <div className="w-full h-[320px] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-950/30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 15, right: 24, left: 4, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="dateLabel" stroke={textColor} tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[8, "auto"]}
                  stroke={textColor}
                  tick={{ fontSize: 11 }}
                  unit=" mmHg"
                  width={65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                    borderColor: darkMode ? "#334155" : "#cbd5e1",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 700 }} />
                <ReferenceLine
                  y={21}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: "21 mmHg",
                    position: "insideTopRight",
                    fill: "#ef4444",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="iopOd"
                  name="PIO OD"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#2563eb" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="iopOs"
                  name="PIO OS"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#10b981" }}
                  connectNulls
                />
                {showCorrected && (
                  <Line
                    type="monotone"
                    dataKey="corrOd"
                    name="PIO Corectat OD"
                    stroke="#60a5fa"
                    strokeWidth={1.8}
                    strokeDasharray="5 4"
                    dot={{ r: 3.5, fill: "#60a5fa" }}
                    connectNulls
                  />
                )}
                {showCorrected && (
                  <Line
                    type="monotone"
                    dataKey="corrOs"
                    name="PIO Corectat OS"
                    stroke="#34d399"
                    strokeWidth={1.8}
                    strokeDasharray="5 4"
                    dot={{ r: 3.5, fill: "#34d399" }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History table */}
        {timeline.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={cn("border-b text-[10px] font-black uppercase tracking-wider", darkMode ? "bg-slate-800/60 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600")}>
                  <th className="p-2.5">Dată</th>
                  <th className="p-2.5 text-center">PIO OD</th>
                  <th className="p-2.5 text-center">Corectat OD</th>
                  <th className="p-2.5 text-center">CCT OD</th>
                  <th className="p-2.5 text-center">PIO OS</th>
                  <th className="p-2.5 text-center">Corectat OS</th>
                  <th className="p-2.5 text-center">CCT OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {[...timeline].reverse().map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">{row.dateLabel}</td>
                    <td className={cn("p-2.5 text-center font-black", row.iopOd && row.iopOd > 21 ? "text-rose-500" : "text-blue-600 dark:text-blue-400")}>
                      {row.iopOd !== null ? `${row.iopOd.toFixed(1)}` : "—"}
                    </td>
                    <td className="p-2.5 text-center">{row.corrOd !== null ? `${row.corrOd.toFixed(1)}` : "—"}</td>
                    <td className="p-2.5 text-center text-slate-500">{row.cctOd !== null ? `${Math.round(row.cctOd)} µm` : "—"}</td>
                    <td className={cn("p-2.5 text-center font-black", row.iopOs && row.iopOs > 21 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400")}>
                      {row.iopOs !== null ? `${row.iopOs.toFixed(1)}` : "—"}
                    </td>
                    <td className="p-2.5 text-center">{row.corrOs !== null ? `${row.corrOs.toFixed(1)}` : "—"}</td>
                    <td className="p-2.5 text-center text-slate-500">{row.cctOs !== null ? `${Math.round(row.cctOs)} µm` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(IopChartModal);
