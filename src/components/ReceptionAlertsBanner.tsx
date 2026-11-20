import React from "react";
import { AlertTriangle, FileText, Glasses, X } from "lucide-react";
import { cn, MedicalRecord } from "../appConstants";

interface ReceptionAlertsBannerProps {
  activeAlerts: any[];
  medicalRecords: MedicalRecord[];
  darkMode: boolean;
  isDoctor: boolean;
  onOpenRecordFromAlert: (alert: any) => void;
  onOpenNewOrderFromAlert: (alert: any) => void;
  onDismissAlert: (alertId: string) => void;
}

export const ReceptionAlertsBanner: React.FC<ReceptionAlertsBannerProps> = React.memo(({
  activeAlerts,
  medicalRecords,
  darkMode,
  isDoctor,
  onOpenRecordFromAlert,
  onOpenNewOrderFromAlert,
  onDismissAlert,
}) => {
  if (!activeAlerts || activeAlerts.length === 0) return null;

  return (
    <div className="mb-3 space-y-2.5">
      {activeAlerts.map((alert, alertIdx) => {
        const recDetails: string[] = [];
        const patientRecord = medicalRecords.find((r) => r.id === alert.patientId);
        const prescriptions = patientRecord?.prescriptionHistory || [];
        const latestPresc = prescriptions[0];
        const od = latestPresc?.od || patientRecord?.od;
        const os = latestPresc?.os || patientRecord?.os;
        const clOd = latestPresc?.cl_od || patientRecord?.cl_od;
        const clOs = latestPresc?.cl_os || patientRecord?.cl_os;

        if (alert.glasses) {
          const formatEye = (eye: any) => {
            if (!eye) return "";
            const parts: string[] = [];
            if (eye.sph) {
              const val = parseFloat(eye.sph);
              parts.push(`${!isNaN(val) && val > 0 && !String(eye.sph).startsWith("+") ? "+" : ""}${eye.sph} SF`);
            }
            if (eye.cyl) {
              const val = parseFloat(eye.cyl);
              parts.push(`${!isNaN(val) && val > 0 && !String(eye.cyl).startsWith("+") ? "+" : ""}${eye.cyl} CIL`);
            }
            if (eye.axis) parts.push(`${eye.axis}°`);
            if (eye.add) {
              const val = parseFloat(eye.add);
              parts.push(`Ad: ${!isNaN(val) && val > 0 && !String(eye.add).startsWith("+") ? "+" : ""}${eye.add}`);
            }
            if (eye.prism) parts.push(`Pr: ${eye.prism}${eye.base ? ` Bază ${eye.base}` : ""}`);
            return parts.length > 0 ? parts.join(" ") : "";
          };
          const odStr = formatEye(od);
          const osStr = formatEye(os);
          const recommendedLens = latestPresc?.lensType || patientRecord?.lensType || "";

          let glassesInfo = "Ochelari";
          if (odStr || osStr) {
            glassesInfo += ` (OD: ${odStr || "—"} / OS: ${osStr || "—"})`;
          }
          if (recommendedLens) {
            glassesInfo += ` [Lentile: ${recommendedLens}]`;
          }
          recDetails.push(glassesInfo);

          const hasInter = latestPresc?.intermediate_enabled ?? patientRecord?.intermediate_enabled;
          if (hasInter) {
            const interOd = latestPresc?.od || patientRecord?.od;
            const interOs = latestPresc?.os || patientRecord?.os;
            const formatInterEye = (sph?: string, cyl?: string, ax?: string) => {
              const parts: string[] = [];
              if (sph) {
                const val = parseFloat(sph);
                parts.push(`${!isNaN(val) && val > 0 && !String(sph).startsWith("+") ? "+" : ""}${sph} SF`);
              }
              if (cyl) {
                const val = parseFloat(cyl);
                parts.push(`${!isNaN(val) && val > 0 && !String(cyl).startsWith("+") ? "+" : ""}${cyl} CIL`);
              }
              if (ax) parts.push(`${ax}°`);
              return parts.join(" ");
            };
            const interOdStr = formatInterEye(interOd?.intermediate_sph, interOd?.intermediate_cyl, interOd?.intermediate_axis);
            const interOsStr = formatInterEye(interOs?.intermediate_sph, interOs?.intermediate_cyl, interOs?.intermediate_axis);
            const interDist = latestPresc?.intermediate_distance || patientRecord?.intermediate_distance || "";

            let interInfo = "👓 Semidistanță";
            if (interDist) interInfo += ` (${interDist})`;
            if (interOdStr || interOsStr) {
              interInfo += `: OD: ${interOdStr || "—"} / OS: ${interOsStr || "—"}`;
            }
            recDetails.push(interInfo);
          }
        }

        if (alert.contactLenses) {
          const formatEyeCL = (cl: any) => {
            if (!cl) return "";
            const parts: string[] = [];
            if (cl.sph) {
              const val = parseFloat(cl.sph);
              parts.push(`${!isNaN(val) && val > 0 && !String(cl.sph).startsWith("+") ? "+" : ""}${cl.sph} SF`);
            }
            if (cl.cyl) {
              const val = parseFloat(cl.cyl);
              parts.push(`${!isNaN(val) && val > 0 && !String(cl.cyl).startsWith("+") ? "+" : ""}${cl.cyl} CIL`);
            }
            if (cl.axis) parts.push(`${cl.axis}°`);
            if (cl.base) parts.push(`BC: ${cl.base}`);
            if (cl.radius) parts.push(`DIA: ${cl.radius}`);
            if (cl.brand) parts.push(cl.brand);
            if (cl.wearingType) parts.push(cl.wearingType);
            return parts.length > 0 ? parts.join(" ") : "";
          };
          const getCLType = (cl: any) => {
            if (!cl) return "";
            if (cl.cyl && parseFloat(cl.cyl) !== 0) return "Torică";
            return "Sferică";
          };
          const odStr = formatEyeCL(clOd);
          const osStr = formatEyeCL(clOs);
          const types = [clOd && getCLType(clOd), clOs && getCLType(clOs)].filter(Boolean);
          const uniqueTypes = Array.from(new Set(types));
          const typeLabel = uniqueTypes.length > 0 ? uniqueTypes.join("/") : "";

          let clInfo = "Lentile contact";
          if (odStr || osStr) {
            clInfo += ` (${typeLabel ? `Tip: ${typeLabel} | ` : ""}OD: ${odStr || "—"} / OS: ${osStr || "—"})`;
          }
          recDetails.push(clInfo);
        }

        if (alert.treatment) {
          const lines = String(alert.treatment).split("\n").map((l) => l.trim()).filter(Boolean);
          const meds: string[] = [];
          const delimiters = ["(", "[", " - ", " – ", " — ", ":", ","];
          const keywords = [
            "comprimatele",
            "capsulele",
            "picăturile",
            "picaturile",
            "se administrează",
            "se administreaza",
            "administrează",
            "administreaza",
            "se aplică",
            "se aplica",
            "nu necesită",
            "nu necesita",
            "mod de",
            "se dizolvă",
            "se dizolva",
            "pot fi",
            "mestecate",
            "dizolvate",
            "in gura",
            "în gură",
            "fara apa",
            "fără apă",
            "1 pic",
            "2 pic",
            "3 pic",
            "1 caps",
            "1 tb",
            "1 cp",
            "1 comp",
            "se pun",
          ];
          for (const line of lines) {
            if (
              line.toLowerCase().includes("medicamentele se administreaza") ||
              line.toLowerCase().includes("ordinea prescrisa")
            ) {
              continue;
            }
            let name = line.replace(/^[^a-zA-Z0-9ăâîșțĂÂÎȘȚ]+/g, "").trim();
            if (!name) continue;
            for (const delim of delimiters) {
              if (name.includes(delim)) {
                name = name.split(delim)[0].trim();
              }
            }
            for (const keyword of keywords) {
              const lowerName = name.toLowerCase();
              const idx = lowerName.indexOf(keyword);
              if (idx !== -1) {
                name = name.substring(0, idx).trim();
              }
            }
            name = name.replace(/[-:,;]+$/, "").trim();
            if (name) meds.push(name);
          }
          if (meds.length > 0) {
            recDetails.push(`Tratament: ${meds.join(", ")}`);
          } else {
            recDetails.push(`Tratament: ${alert.treatment}`);
          }
        }

        return (
          <div
            key={`reception-alert-${alert.id || "alert"}-${alertIdx}`}
            className={cn(
              "py-2.5 px-4 rounded-xl border border-l-4 border-l-rose-600 flex items-center gap-3 shadow-xs relative overflow-hidden",
              darkMode
                ? "bg-rose-950/25 border-rose-900/50 text-rose-100"
                : "bg-rose-50/60 border-rose-200 text-rose-950"
            )}
          >
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pr-8 flex items-center gap-x-3 gap-y-1.5 flex-wrap text-xs font-medium">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-extrabold text-xs uppercase tracking-wide">
                  {alert.patientName}
                </span>
                <button
                  onClick={() => onOpenRecordFromAlert(alert)}
                  className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center shadow-sm shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Deschide fișă pacient"
                >
                  <FileText className="w-3 h-3" />
                </button>
                {!isDoctor && (
                  <button
                    onClick={() => onOpenNewOrderFromAlert(alert)}
                    className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center shadow-sm shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
                    title="Deschide Comandă Nouă Ochelari"
                  >
                    <Glasses className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {alert.patientAge && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-200/60 dark:bg-red-900/60 text-[10px] font-bold text-red-800 dark:text-red-300 shrink-0">
                  {alert.patientAge} ani
                </span>
              )}

              <span className="text-red-300 dark:text-red-800 hidden md:inline">|</span>

              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-extrabold uppercase tracking-wider text-[9px] text-red-600 dark:text-red-400">
                  Recomandări prescrise:
                </span>
                <span className="font-semibold text-xs flex items-center gap-x-1.5 flex-wrap">
                  {recDetails.length === 0 ? (
                    "Fără recomandări specifice"
                  ) : (
                    recDetails.map((detail, idx) => {
                      const isOchelari = detail === "Ochelari";
                      return (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-red-300 dark:text-red-800 mx-1">/</span>}
                          <span>{detail}</span>
                          {isOchelari && !isDoctor && (
                            <button
                              onClick={() => onOpenNewOrderFromAlert(alert)}
                              className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center shadow-sm shrink-0 hover:scale-105 active:scale-95 cursor-pointer ml-1"
                              title="Deschide Comandă Nouă Ochelari"
                            >
                              <Glasses className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                      );
                    })
                  )}
                </span>
              </div>

              {alert.examinations && alert.examinations.length > 0 && (
                <>
                  <span className="text-red-300 dark:text-red-800 hidden md:inline">|</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-extrabold uppercase tracking-wider text-[9px] text-red-600 dark:text-red-400">
                      Examinări efectuate:
                    </span>
                    <span className="font-semibold text-xs" title={alert.examinations.join(", ")}>
                      {alert.examinations.join(", ")}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => onDismissAlert(alert.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
              title="Ascunde"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
});
