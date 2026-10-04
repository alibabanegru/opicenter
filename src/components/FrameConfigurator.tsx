import React from "react";
import { Glasses, Check, Settings2, Info } from "lucide-react";
import { cn, GlassesOrder, deformPath, deformPoint, getPointOnPathAtAngle, normalizePath, getBottomYAtX, samplePathPoints } from "../appConstants";

const BASE_FRAME_SHAPES = [
  {
    id: 1,
    name: "Forma 1 (Pătrat Rotunjit)",
    path: "M 20,10 C 38,7 54,8 68,14 C 76,20 76,32 68,41 C 56,46 30,46 16,40 C 6,32 6,18 20,10 Z"
  },
  {
    id: 2,
    name: "Forma 2 (Rotund / Oval)",
    path: "M 40,5 C 62,5 74,12 74,23 C 74,35 58,45 40,45 C 22,45 6,35 6,23 C 6,12 18,5 40,5 Z"
  },
  {
    id: 3,
    name: "Forma 3 (Aviator / Teardrop)",
    path: "M 15,7 C 45,5 60,5 72,12 C 78,16 78,24 74,32 C 68,42 45,45 35,45 C 18,45 8,36 8,24 C 8,15 10,8 15,7 Z"
  },
  {
    id: 4,
    name: "Forma 4 (Dreptunghiular Rotunjit)",
    path: "M 10,8 L 70,8 C 76,8 76,14 76,20 L 74,34 C 72,42 60,44 40,44 C 20,44 8,42 6,34 L 4,20 C 4,14 4,8 10,8 Z"
  },
  {
    id: 5,
    name: "Forma 5 (Cat Eye)",
    path: "M 8,8 C 24,4 52,8 72,20 C 76,28 68,40 54,45 C 36,48 18,46 10,36 C 4,26 2,14 8,8 Z"
  },
  {
    id: 6,
    name: "Forma 6 (Pătrat Rotunjit Îngustat)",
    path: "M 14,8 C 34,6 54,6 72,10 C 78,14 76,28 70,37 C 58,45 28,45 14,39 C 6,30 6,15 14,8 Z"
  },
  {
    id: 7,
    name: "Forma 7 (Aviator)",
    path: "M 14,8 C 38,4 58,4 72,10 C 76,12 78,18 76,24 C 72,36 54,46 40,46 C 24,46 10,40 6,28 C 4,18 6,10 14,8 Z"
  }
];

export const FRAME_SHAPES = BASE_FRAME_SHAPES.map(shape => ({
  ...shape,
  path: normalizePath(shape.path)
}));


export const SHAPE_BOUNDS: Record<number, { minX: number; maxX: number }> = {
  1: { minX: 5, maxX: 75 },
  2: { minX: 6, maxX: 74 },
  3: { minX: 8, maxX: 76 },
  4: { minX: 4, maxX: 76 },
  5: { minX: 4, maxX: 76 },
  6: { minX: 4, maxX: 74 },
  7: { minX: 4, maxX: 76 }
};

interface FrameConfiguratorProps {
  isOpen: boolean;
  darkMode: boolean;
  prefix: "" | "near";
  order: GlassesOrder;
  onUpdate: (fieldOrUpdates: string | Record<string, any>, value?: any) => void;
}

export const FrameConfigurator: React.FC<FrameConfiguratorProps> = React.memo(({
  isOpen,
  darkMode,
  prefix,
  order,
  onUpdate
}) => {
  const [render1to1, setRender1to1] = React.useState(false);
  const [scale, setScale] = React.useState(2.5); // pixels per mm
  const [activeDrag, setActiveDrag] = React.useState<{
    type: "elastic" | "width" | "height" | "bridge" | "bridgePosition";
    startX: number;
    startY: number;
    startValueA: number;
    startValueB: number;
    startValueBridge: number;
    startDeformX: number;
    startDeformY: number;
    angle: number;
    activeLens?: "OD" | "OS";
    activeDefIndex?: number;
    initialDeformsList?: { x: number; y: number; angle: number }[];
    startBridgeAngle?: number;
  } | null>(null);

  const [hoverState, setHoverState] = React.useState<{
    mouseX: number;
    mouseY: number;
    activeLens: "OD" | "OS";
    angle: number;
  } | null>(null);

  // Resolve properties dynamically based on distance or near prefix
  const shapeField = prefix === "near" ? "nearFrameShape" : "frameShape";
  const typeField = prefix === "near" ? "nearFrameType" : "frameType";
  const widthField = prefix === "near" ? "nearLensWidth" : "lensWidth";
  const heightField = prefix === "near" ? "nearLensHeight" : "lensHeight";
  const bridgeField = prefix === "near" ? "nearBridgeSize" : "bridgeSize";
  const diameterField = prefix === "near" ? "nearLensDiameter" : "lensDiameter";

  const deformXField = prefix === "near" ? "nearFrameDeformX" : "frameDeformX";
  const deformYField = prefix === "near" ? "nearFrameDeformY" : "frameDeformY";
  const deformAngleField = prefix === "near" ? "nearFrameDeformAngle" : "frameDeformAngle";
  const deformsListField = prefix === "near" ? "nearFrameDeformsList" : "frameDeformsList";

  const dpOdField = prefix === "near" ? "nearDp_od" : "dp_od";
  const dpOsField = prefix === "near" ? "nearDp_os" : "dp_os";
  const fitOdField = prefix === "near" ? "nearFittingHeight_od" : "fittingHeight_od";
  const fitOsField = prefix === "near" ? "nearFittingHeight_os" : "fittingHeight_os";
  const lensStyleField = prefix === "near" ? "nearLensStyle" : "lensStyle";

  const selectedShape = order[shapeField] as number | undefined;
  const selectedType = (order[typeField] || "") as "full" | "groove" | "drill" | "";
  const lensWidth = (order[widthField] || "") as string;
  const lensHeight = (order[heightField] || "") as string;
  const bridgeSize = (order[bridgeField] || "") as string;
  const lensDiameter = (order[diameterField] || "") as string;
  const selectedLensStyle = (order[lensStyleField] || "") as "progressive" | "bifocal" | "";

  const dpOd = (order[dpOdField] || "") as string;
  const dpOs = (order[dpOsField] || "") as string;
  const fittingHeightOd = (order[fitOdField] || "") as string;
  const fittingHeightOs = (order[fitOsField] || "") as string;

  const frameDeformX = Number(order[deformXField]) || 0;
  const frameDeformY = Number(order[deformYField]) || 0;
  const frameDeformAngle = Number(order[deformAngleField]) || 0;
  const rotationField = prefix === "near" ? "nearFrameRotation" : "frameRotation";
  const frameRotation = Number(order[rotationField]) || 0;

  const A_val = parseFloat(lensWidth) || 50;
  const B_val = parseFloat(lensHeight) || 38;
  const DBL_val = parseFloat(bridgeSize) || 16;
  const bridgeAngleField = prefix === "near" ? "nearBridgeAngle" : "bridgeAngle";
  const bridgeAngle = Number(order[bridgeAngleField]) || 0;

  const selectedShapeObj = FRAME_SHAPES.find((s) => s.id === selectedShape) || FRAME_SHAPES[0];
  const rawPath = selectedShapeObj?.path;
  const deformsListStr = (order[deformsListField] || "") as string;
  let deformsList: { x: number; y: number; angle: number }[] = [];
  if (deformsListStr) {
    try {
      deformsList = JSON.parse(deformsListStr);
    } catch {
      deformsList = [];
    }
  }
  const shapePath = deformsList.length > 0
    ? deformPath(rawPath, deformsListStr, frameRotation)
    : deformPath(rawPath, frameDeformX, frameDeformY, frameDeformAngle, frameRotation);

  // Compute the exact Effective Diameter (ED) based on the actual shape contour.
  // By definition, ED is 2 * the maximum distance from the shape's center to its edge.
  const pathPoints = React.useMemo(() => {
    try {
      return samplePathPoints(shapePath);
    } catch {
      return [];
    }
  }, [shapePath]);

  const ED_val = React.useMemo(() => {
    if (!pathPoints || pathPoints.length === 0) {
      return Math.sqrt(A_val * A_val + B_val * B_val);
    }
    let max_dist = 0;
    const center_x = A_val / 2;
    const center_y = B_val / 2;
    for (const pt of pathPoints) {
      const pt_x_mm = (pt.x / 80) * A_val;
      const pt_y_mm = (pt.y / 50) * B_val;
      const dist = Math.sqrt(
        Math.pow(pt_x_mm - center_x, 2) + 
        Math.pow(pt_y_mm - center_y, 2)
      );
      if (dist > max_dist) {
        max_dist = dist;
      }
    }
    return max_dist * 2;
  }, [pathPoints, A_val, B_val]);

  React.useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - activeDrag.startX;
      const deltaY = e.clientY - activeDrag.startY;

      if (activeDrag.type === "elastic") {
        const deltaXmm = deltaX / scale;
        const deltaYmm = deltaY / scale;

        const lensSignX = activeDrag.activeLens === "OS" ? -1 : 1;
        const deltaXviewBox = deltaXmm * (80 / activeDrag.startValueA) * lensSignX;
        const deltaYviewBox = deltaYmm * (50 / activeDrag.startValueB);

        const newDeformX = activeDrag.startDeformX + deltaXviewBox;
        const newDeformY = activeDrag.startDeformY + deltaYviewBox;

        let finalDeformX = newDeformX;
        // Protection for nasal bridge (DBL): if active handle is on nasal side (cos(angle) > 0),
        // prevent expanding outwards into the bridge area (finalDeformX > 0)
        if (Math.cos(activeDrag.angle) > 0 && finalDeformX > 0) {
          finalDeformX = 0;
        }

        const initialList = activeDrag.initialDeformsList || [];
        const activeIdx = activeDrag.activeDefIndex ?? 0;

        const updatedList = initialList.map((def, idx) => {
          if (idx === activeIdx) {
            return {
              ...def,
              x: Math.round(finalDeformX * 100) / 100,
              y: Math.round(newDeformY * 100) / 100
            };
          }
          return def;
        });

        onUpdate({
          [deformsListField]: JSON.stringify(updatedList),
          [deformXField]: Math.round(finalDeformX * 100) / 100,
          [deformYField]: Math.round(newDeformY * 100) / 100,
          [deformAngleField]: Math.round(activeDrag.angle * 1000) / 1000
        });
      } else if (activeDrag.type === "width") {
        const deltaMm = (deltaX / scale) / 2;
        const newVal = Math.max(30, Math.min(85, activeDrag.startValueA + deltaMm));
        onUpdate(widthField, Math.round(newVal).toString());
      } else if (activeDrag.type === "height") {
        const deltaMm = deltaY / scale;
        const newVal = Math.max(20, Math.min(70, activeDrag.startValueB + deltaMm));
        onUpdate(heightField, Math.round(newVal).toString());
      } else if (activeDrag.type === "bridge") {
        const deltaMm = deltaX / scale;
        const newVal = Math.max(10, Math.min(35, activeDrag.startValueBridge + deltaMm));
        onUpdate(bridgeField, Math.round(newVal).toString());
      } else if (activeDrag.type === "bridgePosition") {
        const deltaYmm = deltaY / scale;
        const currentPt = getPointOnPathAtAngle(shapePath, activeDrag.startBridgeAngle || 0);
        const currentYOnLens = (currentPt.y / 50) * B_val;
        const targetYOnLens = currentYOnLens + deltaYmm;
        const targetViewBoxY = (targetYOnLens / B_val) * 50;

        const points = samplePathPoints(shapePath);
        const nasalPoints = points.filter(p => p.x >= 40);
        if (nasalPoints.length > 0) {
          let closestPt = nasalPoints[0];
          let minDiffY = Infinity;
          for (const pt of nasalPoints) {
            const diffY = Math.abs(pt.y - targetViewBoxY);
            if (diffY < minDiffY) {
              minDiffY = diffY;
              closestPt = pt;
            }
          }
          const newBridgeAngle = Math.atan2(closestPt.y - 25, closestPt.x - 40);
          onUpdate(bridgeAngleField, newBridgeAngle);
        }
      }
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeDrag, scale, widthField, heightField, bridgeField, deformXField, deformYField, deformAngleField, deformsListField, onUpdate, shapePath, B_val, bridgeAngleField]);

  const accentColorClass = prefix === "near"
    ? "text-emerald-500 focus:ring-emerald-500 border-emerald-500/20"
    : "text-blue-500 focus:ring-blue-500 border-blue-500/20";

  const accentBgClass = prefix === "near"
    ? "bg-emerald-500"
    : "bg-blue-500";

  const accentBorderClass = prefix === "near"
    ? "border-emerald-500"
    : "border-blue-500";

  const activeBadgeClass = prefix === "near"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800"
    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800";

  const handleShapeSelect = (id: number) => {
    onUpdate({
      [shapeField]: selectedShape === id ? null : id,
      [deformXField]: 0,
      [deformYField]: 0,
      [deformAngleField]: 0,
      [deformsListField]: "[]"
    });
  };

  const handleResetShape = () => {
    onUpdate({
      [deformXField]: 0,
      [deformYField]: 0,
      [deformAngleField]: 0,
      [deformsListField]: "[]"
    });
  };

  const handleTypeSelect = (type: "full" | "groove" | "drill") => {
    onUpdate(typeField, selectedType === type ? "" : type);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border-2 space-y-5 transition-all animate-in fade-in-50 slide-in-from-top-3 duration-200",
        darkMode
          ? "bg-slate-900/80 border-slate-700/60 shadow-inner"
          : "bg-white border-slate-200 shadow-md"
      )}
    >
      <div className="flex items-center gap-2 border-b pb-2 border-slate-150 dark:border-slate-800">
        <Settings2 className={cn("w-4 h-4", prefix === "near" ? "text-emerald-500" : "text-blue-500")} />
        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Configurator Formă & Parametri Montaj {prefix === "near" ? "(Pachet 2 - Aproape)" : "(Pachet 1 - Distanță)"}
        </h5>
      </div>

      {/* Grid containing the 7 standard shapes */}
      <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
          Alege Forma Standard Ramei (Forme 1 - 7 din Jpg)
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {FRAME_SHAPES.map((shape) => {
            const isActive = selectedShape === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => handleShapeSelect(shape.id)}
                className={cn(
                  "p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all group relative",
                  isActive
                    ? cn("bg-white dark:bg-slate-800 shadow-md scale-105", accentBorderClass)
                    : darkMode
                      ? "bg-slate-950 border-slate-800 hover:border-slate-700"
                      : "bg-slate-50 border-slate-100 hover:border-slate-200"
                )}
                title={shape.name}
              >
                <div className="absolute top-1 left-1.5 text-[9px] font-black opacity-80 text-slate-500 dark:text-slate-400 group-hover:opacity-100">
                  #{shape.id}
                </div>
                {isActive && (
                  <div className={cn("absolute top-1 right-1 p-0.5 rounded-full text-white", accentBgClass)}>
                    <Check className="w-2.5 h-2.5 stroke-[4px]" />
                  </div>
                )}
                <div className="w-full h-12 flex items-center justify-center pt-2">
                  <svg viewBox="0 0 80 50" className="w-12 h-10 select-none">
                    <path
                      d={shape.path}
                      fill={isActive ? (darkMode ? "#1e293b" : "#f1f5f9") : "none"}
                      className={cn(
                        "transition-all duration-300",
                        isActive
                          ? (prefix === "near" ? "stroke-emerald-500" : "stroke-blue-500")
                          : "stroke-slate-400 dark:stroke-slate-600 group-hover:stroke-slate-500"
                      )}
                      strokeWidth="3.5"
                    />
                    <path
                      d={shape.path}
                      fill={darkMode ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.08)"}
                      stroke="none"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Tipul Ramei & Design Lentilă */}
        <div className="space-y-4">
          {/* Tipul Ramei Selection */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
              Tipul Ramei (Formă de fixare)
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
              {(["full", "groove", "drill"] as const).map((type) => {
                const isActive = selectedType === type;
                const label = type === "full" ? "Anou Complet" : type === "groove" ? "Rama pe fir" : "Capse / Șurub";
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeSelect(type)}
                    className={cn(
                      "py-2 px-1 text-[9px] font-black uppercase rounded-lg transition-all text-center leading-tight border",
                      isActive
                        ? prefix === "near"
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                          : "bg-blue-500 text-white border-blue-600 shadow-sm"
                        : "bg-transparent text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bifocal / Progresiv Selection */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">
              Design Lentilă Desen (Bifocal / Progresiv)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "", label: "Monofocal" },
                { id: "bifocal", label: "Bifocal" },
                { id: "progressive", label: "Progresiv" }
              ].map((styleOpt) => {
                const isActive = selectedLensStyle === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => onUpdate(lensStyleField, styleOpt.id)}
                    className={cn(
                      "py-2 px-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center min-h-[36px]",
                      isActive
                        ? prefix === "near"
                          ? "bg-white dark:bg-slate-800 shadow-sm border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : "bg-white dark:bg-slate-800 shadow-sm border-blue-500 text-blue-600 dark:text-blue-400"
                        : darkMode
                          ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-200"
                    )}
                  >
                    {styleOpt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dimensiuni Cadru & Diametru Lentilă */}
        <div className="space-y-4">
          {/* Dimensiuni Ramei */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
              Dimensiuni Cadru (Casetat mm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 block uppercase text-center">
                  Lungime Anou (A)
                </span>
                <input
                  type="text"
                  placeholder="Ex: 54"
                  value={lensWidth}
                  onChange={(e) => onUpdate(widthField, e.target.value)}
                  className={cn(
                    "w-full p-2 border-2 rounded-xl text-sm font-black text-center outline-none focus:ring-2 shadow-sm transition-all",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white focus:border-slate-700"
                      : "bg-white border-slate-100 focus:border-slate-300",
                    accentColorClass
                  )}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 block uppercase text-center">
                  Lățime Anou (B)
                </span>
                <input
                  type="text"
                  placeholder="Ex: 40"
                  value={lensHeight}
                  onChange={(e) => onUpdate(heightField, e.target.value)}
                  className={cn(
                    "w-full p-2 border-2 rounded-xl text-sm font-black text-center outline-none focus:ring-2 shadow-sm transition-all",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white focus:border-slate-700"
                      : "bg-white border-slate-100 focus:border-slate-300",
                    accentColorClass
                  )}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 block uppercase text-center">
                  Mărime Nazal (DBL)
                </span>
                <input
                  type="text"
                  placeholder="Ex: 18"
                  value={bridgeSize}
                  onChange={(e) => onUpdate(bridgeField, e.target.value)}
                  className={cn(
                    "w-full p-2 border-2 rounded-xl text-sm font-black text-center outline-none focus:ring-2 shadow-sm transition-all",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white focus:border-slate-700"
                      : "bg-white border-slate-100 focus:border-slate-300",
                    accentColorClass
                  )}
                />
              </div>
            </div>
          </div>

          {/* Diametru Lentilă de Montaj */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
              Diametru Lentilă de Montaj (Ø)
            </label>
            <div className="flex items-end gap-2">
              <input
                type="text"
                placeholder="Ex: 70"
                value={lensDiameter}
                onChange={(e) => onUpdate(diameterField, e.target.value)}
                className={cn(
                  "w-12 p-2 border-2 rounded-xl text-sm font-black text-center outline-none focus:ring-2 shadow-sm transition-all",
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-white focus:border-slate-700"
                    : "bg-white border-slate-100 focus:border-slate-300",
                  accentColorClass
                )}
              />
              <select
                value={lensDiameter}
                onChange={(e) => onUpdate(diameterField, e.target.value)}
                className={cn(
                  "w-24 p-2 border-2 rounded-xl text-xs font-black outline-none focus:ring-2 shadow-sm transition-all cursor-pointer",
                  darkMode
                    ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-slate-700"
                    : "bg-white border-slate-100 focus:border-slate-300",
                  accentColorClass
                )}
              >
                <option value="" className="text-slate-400">Alege...</option>
                {["50", "55", "60", "65", "70", "75", "80"].map((dia) => (
                  <option key={dia} value={dia} className="text-slate-900">
                    Ø {dia}
                  </option>
                ))}
              </select>

              {/* Calculated MBS Section (Exact Minimum Blank Size based on actual shape edge distance from pupil) */}
              {(() => {
                const A_val = parseFloat(lensWidth) || 50;
                const B_val = parseFloat(lensHeight) || 38;
                const DBL_val = parseFloat(bridgeSize) || 16;

                // Validate if monocular pupil distance (DP) is entered
                const hasDpOd = dpOd && !isNaN(parseFloat(dpOd)) && parseFloat(dpOd) > 0;
                const hasDpOs = dpOs && !isNaN(parseFloat(dpOs)) && parseFloat(dpOs) > 0;

                if (!hasDpOd || !hasDpOs) {
                  return (
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider block text-center whitespace-nowrap">
                          Minim (MBS)
                        </span>
                        <div className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center justify-center shadow-sm h-[38px] min-w-0">
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-none whitespace-nowrap">
                            Intro DP
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-wider block text-center whitespace-nowrap">
                          Diagonala (ED)
                        </span>
                        <div className="px-3 py-2.5 bg-blue-50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-center shadow-sm h-[38px] min-w-0">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 leading-none whitespace-nowrap">
                            {ED_val.toFixed(1)} mm
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                const DP_OD_val = parseFloat(dpOd);
                const DP_OS_val = parseFloat(dpOs);
                const H_OD_val = parseFloat(fittingHeightOd) || (B_val / 2);
                const H_OS_val = parseFloat(fittingHeightOs) || (B_val / 2);

                // Exact MBS calculation using path points relative to the pupil center
                let max_dist_od = 0;
                let max_dist_os = 0;

                const pupil_x_mm_od = A_val + DBL_val / 2 - DP_OD_val;
                const pupil_y_mm_od = B_val - H_OD_val;

                const pupil_x_mm_os = DP_OS_val - DBL_val / 2;
                const pupil_y_mm_os = B_val - H_OS_val;

                if (pathPoints && pathPoints.length > 0) {
                  for (const pt of pathPoints) {
                    // OD Right Eye
                    const pt_x_mm_od = (pt.x / 80) * A_val;
                    const pt_y_mm_od = (pt.y / 50) * B_val;
                    const dist_od = Math.sqrt(
                      Math.pow(pt_x_mm_od - pupil_x_mm_od, 2) + 
                      Math.pow(pt_y_mm_od - pupil_y_mm_od, 2)
                    );
                    if (dist_od > max_dist_od) {
                      max_dist_od = dist_od;
                    }

                    // OS Left Eye (flipped horizontally in raw coordinates)
                    const pt_x_mm_os = ((80 - pt.x) / 80) * A_val;
                    const pt_y_mm_os = (pt.y / 50) * B_val;
                    const dist_os = Math.sqrt(
                      Math.pow(pt_x_mm_os - pupil_x_mm_os, 2) + 
                      Math.pow(pt_y_mm_os - pupil_y_mm_os, 2)
                    );
                    if (dist_os > max_dist_os) {
                      max_dist_os = dist_os;
                    }
                  }
                }

                const exact_mbs_od = max_dist_od * 2;
                const exact_mbs_os = max_dist_os * 2;
                const max_exact_mbs = Math.max(exact_mbs_od, exact_mbs_os);

                // Fallback traditional formula if pathPoints are somehow unavailable
                const fallback_od = ED_val + 2 * Math.sqrt(
                  Math.pow((A_val + DBL_val) / 2 - DP_OD_val, 2) + 
                  Math.pow((B_val / 2) - H_OD_val, 2)
                );
                const fallback_os = ED_val + 2 * Math.sqrt(
                  Math.pow((A_val + DBL_val) / 2 - DP_OS_val, 2) + 
                  Math.pow((B_val / 2) - H_OS_val, 2)
                );
                const max_fallback = Math.max(fallback_od, fallback_os);

                const final_mbs = max_exact_mbs > 0 ? max_exact_mbs : max_fallback;
                // Add 1.0 mm for safety/finishing margin and round up to get standard lens blank sizes
                const recommended = Math.ceil(final_mbs + 1.0);

                return (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider block text-center whitespace-nowrap">
                        Minim (MBS)
                      </span>
                      <div className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex items-center justify-center shadow-sm h-[38px] min-w-0">
                        <span className="text-[13.5px] font-black text-rose-600 dark:text-rose-400 leading-none whitespace-nowrap">
                          Ø {recommended} mm
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-wider block text-center whitespace-nowrap">
                        Diagonala (ED)
                      </span>
                      <div className="px-3 py-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-center shadow-sm h-[38px] min-w-0">
                        <span className="text-[13.5px] font-black text-blue-600 dark:text-blue-400 leading-none whitespace-nowrap">
                          {ED_val.toFixed(1)} mm
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Assembly parameters: DP & Mounting height on each eye */}
      <div className="space-y-2 border-t pt-3 border-slate-100 dark:border-slate-800">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
          Parametri Centraj & Montaj individual
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* OD (Right Eye) */}
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block border-b pb-1">
              Ochi Drept (OD)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[7px] font-black text-slate-400 uppercase">
                  Distanță Pupilară (DP)
                </span>
                <input
                  type="text"
                  placeholder="mm"
                  value={dpOd}
                  onChange={(e) => onUpdate(dpOdField, e.target.value)}
                  className={cn(
                    "w-full p-1.5 border-2 rounded-lg text-xs font-black text-center outline-none focus:ring-2 transition-all",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white"
                      : "bg-white border-slate-100",
                    accentColorClass
                  )}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[7px] font-black text-slate-400 uppercase">
                  Înălțime Montaj (H)
                </span>
                <input
                  type="text"
                  placeholder="mm"
                  value={fittingHeightOd}
                  onChange={(e) => onUpdate(fitOdField, e.target.value)}
                  className={cn(
                    "w-full p-1.5 border-2 rounded-lg text-xs font-black text-center outline-none focus:ring-2 transition-all",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white"
                      : "bg-white border-slate-100",
                    accentColorClass
                  )}
                />
              </div>
            </div>
          </div>

          {/* OS (Left Eye) */}
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block border-b pb-1">
              Ochi Stâng (OS)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[7px] font-black text-slate-400 uppercase">
                  Distanță Pupilară (DP)
                </span>
                <input
                  type="text"
                  placeholder="mm"
                  value={dpOs}
                  onChange={(e) => onUpdate(dpOsField, e.target.value)}
                  className={cn(
                    "w-full p-1.5 border-2 rounded-lg text-xs font-black text-center outline-none focus:ring-2 transition-all",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white"
                      : "bg-white border-slate-100",
                    accentColorClass
                  )}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[7px] font-black text-slate-400 uppercase">
                  Înălțime Montaj (H)
                </span>
                <input
                  type="text"
                  placeholder="mm"
                  value={fittingHeightOs}
                  onChange={(e) => onUpdate(fitOsField, e.target.value)}
                  className={cn(
                    "w-full p-1.5 border-2 rounded-lg text-xs font-black text-center outline-none focus:ring-2 transition-all",
                    darkMode
                      ? "bg-slate-950 border-slate-800 text-white"
                      : "bg-white border-slate-100",
                    accentColorClass
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rotație Formă Lentilă */}
      <div className="space-y-2 border-t pt-3 border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
            Rotație Formă Lentilă (Unghi)
          </label>
          {frameRotation !== 0 && (
            <button
              type="button"
              onClick={() => onUpdate(rotationField, 0)}
              className="text-[9px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Resetare (0°)
            </button>
          )}
        </div>
        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={frameRotation}
              onChange={(e) => onUpdate(rotationField, parseInt(e.target.value) || 0)}
              className={cn(
                "w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500",
                prefix === "near" ? "accent-emerald-500" : "accent-blue-500"
              )}
            />
            <span className="text-xs font-black min-w-[50px] text-right tabular-nums">
              {frameRotation > 0 ? `+${frameRotation}` : frameRotation}°
            </span>
          </div>
          <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
            <span>-180°</span>
            <span>0°</span>
            <span>+180°</span>
          </div>
        </div>
      </div>

      {/* Summary Highlight */}
      {(selectedShape || selectedType || lensWidth || bridgeSize || lensDiameter) && (
        <div className={cn("p-2 rounded-xl text-[9px] font-semibold flex items-start gap-1.5 border", activeBadgeClass)}>
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Salvat:</span>{" "}
            {selectedShape ? `Forma Standard #${selectedShape}` : "Nicio formă standard selectată"}{" "}
            {selectedType ? `• ${selectedType === "full" ? "Anou complet" : selectedType === "groove" ? "Rama pe fir" : "Rama pe capse/șurub"}` : ""}
            {(lensWidth || lensHeight || bridgeSize) ? ` • Casetat: ${lensWidth || "?"}口${bridgeSize || "?"} / H:${lensHeight || "?"}` : ""}
            {lensDiameter ? ` • Diametru lentilă: Ø${lensDiameter} mm` : ""}
            {(dpOd || dpOs || fittingHeightOd || fittingHeightOs) ? ` • Montaj: OD ${dpOd || "?"} H ${fittingHeightOd || "?"} / OS ${dpOs || "?"} H ${fittingHeightOs || "?"}` : ""}
          </div>
        </div>
      )}

      {/* Dynamic 1:1 scale visualization generator */}
      {(() => {
        const A_val = parseFloat(lensWidth) || 50;
        const B_val = parseFloat(lensHeight) || 38;
        const DBL_val = parseFloat(bridgeSize) || 16;
        const DP_OD_val = parseFloat(dpOd) || 32;
        const DP_OS_val = parseFloat(dpOs) || 32;
        const H_OD_val = parseFloat(fittingHeightOd) || 20;
        const H_OS_val = parseFloat(fittingHeightOs) || 20;

        const hasAllDimensions = !!(lensWidth && lensHeight && bridgeSize);
        const selectedShapeObj = FRAME_SHAPES.find((s) => s.id === selectedShape);
        const rawPath = selectedShapeObj?.path || FRAME_SHAPES[0].path;

        // Load multi-point deformations list
        const deformsListStr = (order[deformsListField] || "") as string;
        let deformsList: { x: number; y: number; angle: number }[] = [];
        if (deformsListStr) {
          try {
            deformsList = JSON.parse(deformsListStr);
          } catch {
            deformsList = [];
          }
        }
        if (deformsList.length === 0) {
          if (frameDeformX !== 0 || frameDeformY !== 0) {
            deformsList = [{ x: frameDeformX, y: frameDeformY, angle: frameDeformAngle }];
          }
        }

        const shapePath = deformsList.length > 0
          ? deformPath(rawPath, deformsList, frameRotation)
          : deformPath(rawPath, frameDeformX, frameDeformY, frameDeformAngle, frameRotation);

        // Visual layout geometry
        const paddingX = 12; // mm (optimized to save space and fit perfectly)
        const paddingY = 16; // mm (optimized to prevent vertical overflow)
        const X_OD_start = paddingX;
        const X_OD_end = paddingX + A_val;

        const X_OS_start = paddingX + A_val + DBL_val;
        const X_OS_end = X_OS_start + A_val;

        const ptNasal = getPointOnPathAtAngle(shapePath, bridgeAngle);

        const X_OD_nasal = X_OD_start + (ptNasal.x / 80) * A_val;
        const X_OS_nasal = X_OS_start + ((80 - ptNasal.x) / 80) * A_val;
        const X_bridge_start = X_OD_nasal;
        const X_bridge_end = X_OS_nasal;
        const actualDBL = Math.max(0.1, Math.round((X_bridge_end - X_bridge_start) * 10) / 10);

        const CX_OD = paddingX + A_val / 2;
        const CX_OS = X_OS_start + A_val / 2;
        const CY = paddingY + B_val / 2;

        const X_bridge_center = paddingX + A_val + DBL_val / 2;

        const X_pupil_OD = X_bridge_center - DP_OD_val;
        const X_pupil_OS = X_bridge_center + DP_OS_val;

        // Calculate horizontal offset of pupil relative to lens centers in viewBox (0 to 80)
        const dx_OD = X_pupil_OD - CX_OD;
        const viewBoxX_OD = 40 + (dx_OD / A_val) * 80;

        const dx_OS = X_pupil_OS - CX_OS;
        const viewBoxX_OS = 40 + (dx_OS / A_val) * 80;
        const viewBoxX_OS_mirrored = 80 - viewBoxX_OS;

        // Find the bottom viewBox Y coordinate of the deformed shape at the pupil's horizontal position
        const viewBoxBottomY_OD = getBottomYAtX(shapePath, viewBoxX_OD);
        const viewBoxBottomY_OS = getBottomYAtX(shapePath, viewBoxX_OS_mirrored);

        // Convert the viewBox Y coordinates to physical layout coordinates
        const physicalBottomY_OD = paddingY + (viewBoxBottomY_OD / 50) * B_val;
        const physicalBottomY_OS = paddingY + (viewBoxBottomY_OS / 50) * B_val;

        // Determine the vertical position of the pupils (optical centers)
        const Y_pupil_OD = physicalBottomY_OD - H_OD_val;
        const Y_pupil_OS = physicalBottomY_OS - H_OS_val;


        const canvasWidth = (2 * A_val + DBL_val + 24) * scale;
        const canvasHeight = (B_val + 32) * scale;

        return (
          <div className="border-t pt-4 border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h6 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Desen Tehnic la Scară Reală (1:1)
                </h6>
                <p className="text-[8px] text-slate-400">
                  Afișează rama și parametrii de montaj 1:1 conform cotelor introduse.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetShape}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shadow-xs flex items-center gap-1.5",
                    darkMode
                      ? "bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border-rose-900/50"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                  )}
                >
                  Resetează
                </button>
                <button
                  type="button"
                  onClick={() => setRender1to1(!render1to1)}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shadow-xs flex items-center gap-1.5",
                    render1to1
                      ? prefix === "near"
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-blue-600 border-blue-500 text-white"
                      : darkMode
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Glasses className="w-3.5 h-3.5" />
                  {render1to1 ? "Ascunde Desen" : "Generează Formă (1:1)"}
                </button>
              </div>
            </div>

            {render1to1 && (
              <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-[9px] font-medium border border-slate-150 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Info className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>
                      {!hasAllDimensions
                        ? "⚠️ Completați lungimea anou, lățimea anou și mărimea nazală (DBL) pentru un desen exact."
                        : "Toate cotele sunt aplicate! Desenul este generat la scara selectată."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase">Zoom / Scară:</span>
                    <div className="flex items-center gap-1">
                      {[1.5, 2.5, 3.78].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScale(s)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold border transition-all",
                            scale === s
                              ? prefix === "near"
                                ? "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800"
                          )}
                        >
                          {s === 1.5 ? "Compact" : s === 2.5 ? "Mediu" : "1:1 Real (96dpi)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-x-auto p-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/40 flex justify-start md:justify-center custom-scrollbar">
                  <div className="relative group">
                    <svg
                      width={canvasWidth}
                      height={canvasHeight}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 select-none shadow-sm shadow-indigo-500/5 transition-all"
                      style={{
                        backgroundColor: darkMode ? "#020617" : "#f8fafc"
                      }}
                      onMouseDown={(e) => {
                        if (!hoverState) return;
                        
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mmX = (e.clientX - rect.left) / scale;
                        const mmY = (e.clientY - rect.top) / scale;
                        const distOD = Math.hypot(mmX - CX_OD, mmY - CY);
                        const distOS = Math.hypot(mmX - CX_OS, mmY - CY);
                        const closestLens = distOD < distOS ? "OD" : "OS";
                        const minDist = Math.min(distOD, distOS);
                        
                        if (minDist < A_val * 1.5) {
                          e.preventDefault();
                          const activeCenter = closestLens === "OD" ? CX_OD : CX_OS;
                          const clickAngle = Math.atan2(mmY - CY, mmX - activeCenter);
                          const localAngle = closestLens === "OS" ? Math.PI - clickAngle : clickAngle;
                          
                          const getAngularDistance = (a1: number, a2: number) => {
                            const diff = Math.abs(a1 - a2) % (2 * Math.PI);
                            return Math.min(diff, 2 * Math.PI - diff);
                          };

                          let existingIdx = deformsList.findIndex(
                            (def) => getAngularDistance(def.angle, localAngle) < Math.PI / 4
                          );

                          let activeDefIdx = existingIdx;
                          let updatedDeformsList = [...deformsList];

                          if (activeDefIdx === -1) {
                            const newDef = { x: 0, y: 0, angle: localAngle };
                            updatedDeformsList.push(newDef);
                            activeDefIdx = updatedDeformsList.length - 1;
                          }

                          const activeDef = updatedDeformsList[activeDefIdx];

                          setActiveDrag({
                            type: "elastic",
                            startX: e.clientX,
                            startY: e.clientY,
                            startValueA: A_val,
                            startValueB: B_val,
                            startValueBridge: DBL_val,
                            startDeformX: activeDef.x,
                            startDeformY: activeDef.y,
                            angle: activeDef.angle,
                            activeLens: closestLens,
                            activeDefIndex: activeDefIdx,
                            initialDeformsList: updatedDeformsList
                          });
                        }
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left;
                        const mouseY = e.clientY - rect.top;
                        const mmX = mouseX / scale;
                        const mmY = mouseY / scale;

                        // Find closer lens center
                        const distOD = Math.hypot(mmX - CX_OD, mmY - CY);
                        const distOS = Math.hypot(mmX - CX_OS, mmY - CY);
                        const activeLens = distOD < distOS ? "OD" : "OS";
                        const activeCenter = activeLens === "OD" ? CX_OD : CX_OS;

                        const angle = Math.atan2(mmY - CY, mmX - activeCenter);

                        setHoverState({
                          mouseX: mmX,
                          mouseY: mmY,
                          activeLens,
                          angle
                        });
                      }}
                      onMouseLeave={() => {
                        if (!activeDrag) {
                          setHoverState(null);
                        }
                      }}
                    >
                      <defs>
                        <pattern id={`grid-1mm-${prefix}`} width={scale} height={scale} patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2={scale} y2="0" stroke={darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} strokeWidth="0.5" />
                          <line x1="0" y1="0" x2="0" y2={scale} stroke={darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} strokeWidth="0.5" />
                        </pattern>
                        <pattern id={`grid-5mm-${prefix}`} width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
                          <rect width={scale * 5} height={scale * 5} fill={`url(#grid-1mm-${prefix})`} />
                          <line x1="0" y1="0" x2={scale * 5} y2="0" stroke={darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeWidth="0.75" />
                          <line x1="0" y1="0" x2="0" y2={scale * 5} stroke={darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeWidth="0.75" />
                        </pattern>
                        <marker id={`arrow-${prefix}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={darkMode ? "#64748b" : "#475569"} />
                        </marker>
                      </defs>

                      {/* Milimetric Grid Paper */}
                      <rect width="100%" height="100%" fill={`url(#grid-5mm-${prefix})`} className="pointer-events-none" />

                      {/* Bridge nasal axis */}
                      <g className="pointer-events-none">
                        <line
                          x1={X_bridge_center * scale}
                          y1={6 * scale}
                          x2={X_bridge_center * scale}
                          y2={canvasHeight - 4 * scale}
                          stroke={darkMode ? "rgba(148,163,184,0.2)" : "rgba(100,116,139,0.2)"}
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={X_bridge_center * scale}
                          y={4 * scale}
                          textAnchor="middle"
                          stroke={darkMode ? "#020617" : "#f8fafc"}
                          strokeWidth="1.5px"
                          paintOrder="stroke fill"
                          className="text-[7px] font-bold fill-slate-400 uppercase tracking-widest"
                        >
                          Centru Nazal (DBL/2)
                        </text>
                      </g>

                      {/* OD - Right Lens Outer Box */}
                      <rect
                        x={X_OD_start * scale}
                        y={paddingY * scale}
                        width={A_val * scale}
                        height={B_val * scale}
                        fill="none"
                        stroke={darkMode ? "rgba(148,163,184,0.15)" : "rgba(100,116,139,0.15)"}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        className="pointer-events-none"
                      />

                      {/* OS - Left Lens Outer Box */}
                      <rect
                        x={X_OS_start * scale}
                        y={paddingY * scale}
                        width={A_val * scale}
                        height={B_val * scale}
                        fill="none"
                        stroke={darkMode ? "rgba(148,163,184,0.15)" : "rgba(100,116,139,0.15)"}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        className="pointer-events-none"
                      />

                      {/* Nested SVGs for perfectly shaped lenses fitted to A x B cotes */}
                      {/* OD Lens Shape */}
                      <svg
                        x={X_OD_start * scale}
                        y={paddingY * scale}
                        width={A_val * scale}
                        height={B_val * scale}
                        viewBox="0 0 80 50"
                        preserveAspectRatio="none"
                        className="overflow-visible pointer-events-none"
                      >
                        <defs>
                          <clipPath id={`clip-top-od-${prefix}`}>
                            <rect x="-10" y="-10" width="100" height="35" />
                          </clipPath>
                        </defs>
                        <path
                          d={shapePath}
                          fill={darkMode ? "rgba(30,41,59,0.15)" : "rgba(241,245,249,0.25)"}
                        />
                        {selectedType === "groove" ? (
                          <>
                            {/* Groove nylon line */}
                            <path
                              d={shapePath}
                              fill="none"
                              stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                              strokeWidth="1.2"
                              strokeDasharray="1.5 1.5"
                            />
                            {/* Groove top frame */}
                            <path
                              d={shapePath}
                              fill="none"
                              stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                              strokeWidth="3.5"
                              clipPath={`url(#clip-top-od-${prefix})`}
                            />
                          </>
                        ) : selectedType === "drill" ? (
                          <>
                            {/* Drill thin rimless lens edge (fine dashed line) */}
                            <path
                              d={shapePath}
                              fill="none"
                              stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                              strokeWidth="0.8"
                              strokeDasharray="2 2"
                            />
                            {/* Drill holes (horizontal) */}
                            {(() => {
                              const ptNasal = getPointOnPathAtAngle(shapePath, bridgeAngle);
                              const ptTemporal = getPointOnPathAtAngle(shapePath, Math.PI);
                              return [
                                { cx: ptNasal.x - 4.5, cy: ptNasal.y },
                                { cx: ptNasal.x - 8.5, cy: ptNasal.y },
                                { cx: ptTemporal.x + 4.5, cy: ptTemporal.y },
                                { cx: ptTemporal.x + 8.5, cy: ptTemporal.y }
                              ].map((hole, hidx) => (
                                <g key={hidx}>
                                  <circle cx={hole.cx} cy={hole.cy} r="1.0" fill="#475569" />
                                  <circle cx={hole.cx} cy={hole.cy} r="2.0" fill="none" stroke="rgba(148, 163, 184, 0.8)" strokeWidth="0.5" />
                                </g>
                              ));
                            })()}
                          </>
                        ) : (
                          /* Full frame */
                          <path
                            d={shapePath}
                            fill="none"
                            stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                            strokeWidth="3.5"
                          />
                        )}
                      </svg>

                      {/* OS Lens Shape (Horizontally Mirrored for anatomical symmetry) */}
                      <svg
                        x={X_OS_start * scale}
                        y={paddingY * scale}
                        width={A_val * scale}
                        height={B_val * scale}
                        viewBox="0 0 80 50"
                        preserveAspectRatio="none"
                        className="overflow-visible pointer-events-none"
                      >
                        <defs>
                          <clipPath id={`clip-top-os-${prefix}`}>
                            <rect x="-10" y="-10" width="100" height="35" />
                          </clipPath>
                        </defs>
                        <g transform="translate(80, 0) scale(-1, 1)">
                          <path
                            d={shapePath}
                            fill={darkMode ? "rgba(30,41,59,0.15)" : "rgba(241,245,249,0.25)"}
                          />
                          {selectedType === "groove" ? (
                            <>
                              {/* Groove nylon line */}
                              <path
                                d={shapePath}
                                fill="none"
                                stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                                strokeWidth="1.2"
                                strokeDasharray="1.5 1.5"
                              />
                              {/* Groove top frame */}
                              <path
                                d={shapePath}
                                fill="none"
                                stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                                strokeWidth="3.5"
                                clipPath={`url(#clip-top-os-${prefix})`}
                              />
                            </>
                          ) : selectedType === "drill" ? (
                            <>
                              {/* Drill thin rimless lens edge (fine dashed line) */}
                              <path
                                d={shapePath}
                                fill="none"
                                stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                                strokeWidth="0.8"
                                strokeDasharray="2 2"
                              />
                              {/* Drill holes (horizontal) */}
                              {(() => {
                                const ptNasal = getPointOnPathAtAngle(shapePath, bridgeAngle);
                                const ptTemporal = getPointOnPathAtAngle(shapePath, Math.PI);
                                return [
                                  { cx: ptNasal.x - 4.5, cy: ptNasal.y },
                                  { cx: ptNasal.x - 8.5, cy: ptNasal.y },
                                  { cx: ptTemporal.x + 4.5, cy: ptTemporal.y },
                                  { cx: ptTemporal.x + 8.5, cy: ptTemporal.y }
                                ].map((hole, hidx) => (
                                  <g key={hidx}>
                                    <circle cx={hole.cx} cy={hole.cy} r="1.0" fill="#475569" />
                                    <circle cx={hole.cx} cy={hole.cy} r="2.0" fill="none" stroke="rgba(148, 163, 184, 0.8)" strokeWidth="0.5" />
                                  </g>
                                ));
                              })()}
                            </>
                          ) : (
                            /* Full frame */
                            <path
                              d={shapePath}
                              fill="none"
                              stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                              strokeWidth="3.5"
                            />
                          )}
                        </g>
                      </svg>

                      {/* Bridge Arc perfectly connecting the lenses (with overlap) */}
                      {(() => {
                        const ptNasal = getPointOnPathAtAngle(shapePath, bridgeAngle);
                        const X_bridge_start = X_OD_start + (ptNasal.x / 80) * A_val;
                        const X_bridge_end = X_OS_start + ((80 - ptNasal.x) / 80) * A_val;
                        const Y_bridge_start = paddingY + (ptNasal.y / 50) * B_val;
                        const Y_bridge_end = paddingY + (ptNasal.y / 50) * B_val;
                        const Y_bridge_mid = ((Y_bridge_start + Y_bridge_end) / 2) - 3;
                        return (
                          <path
                            d={`M ${(X_bridge_start - 1.5) * scale} ${Y_bridge_start * scale} Q ${X_bridge_center * scale} ${Y_bridge_mid * scale} ${(X_bridge_end + 1.5) * scale} ${Y_bridge_end * scale}`}
                            fill="none"
                            stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                            strokeWidth="3"
                            className="pointer-events-none"
                          />
                        );
                      })()}

                      {/* Small Nose Pad Details positioned exactly where bridge starts */}
                      {(() => {
                        const ptNasal = getPointOnPathAtAngle(shapePath, bridgeAngle);
                        const X_bridge_start = X_OD_start + (ptNasal.x / 80) * A_val;
                        const X_bridge_end = X_OS_start + ((80 - ptNasal.x) / 80) * A_val;
                        const Y_bridge_start = paddingY + (ptNasal.y / 50) * B_val;
                        const Y_bridge_end = paddingY + (ptNasal.y / 50) * B_val;
                        return (
                          <g className="pointer-events-none">
                            <ellipse cx={(X_bridge_start - 0.5) * scale} cy={(Y_bridge_start + 3) * scale} rx={1.5 * scale} ry={3 * scale} fill="none" stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth="1" />
                            <ellipse cx={(X_bridge_end + 0.5) * scale} cy={(Y_bridge_end + 3) * scale} rx={1.5 * scale} ry={3 * scale} fill="none" stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth="1" />
                          </g>
                        );
                      })()}

                      {/* INTERACTIVE DRAG HANDLES FOR ELASTIC DEFORMATION */}
                      {(() => {
                        const displayLens = activeDrag ? activeDrag.activeLens : hoverState?.activeLens;
                        const displayAngle = activeDrag
                          ? (activeDrag.activeLens === "OS" ? Math.PI - activeDrag.angle : activeDrag.angle)
                          : hoverState?.angle;

                        if (!displayLens || displayAngle === undefined) return null;

                        const activeCenter = displayLens === "OD" ? CX_OD : CX_OS;
                        const localAngle = displayLens === "OS" ? Math.PI - displayAngle : displayAngle;
                        const deformedShapePath = deformsList.length > 0
                          ? deformPath(rawPath, deformsList, frameRotation)
                          : deformPath(rawPath, frameDeformX, frameDeformY, frameDeformAngle, frameRotation);

                        const ptOnPath = getPointOnPathAtAngle(deformedShapePath, localAngle);

                        let glideX = 0;
                        let glideY = paddingY + (ptOnPath.y / 50) * B_val;

                        if (displayLens === "OD") {
                          glideX = X_OD_start + (ptOnPath.x / 80) * A_val;
                        } else {
                          glideX = X_OS_start + ((80 - ptOnPath.x) / 80) * A_val;
                        }

                        return (
                          <g
                            className="cursor-pointer group/elastic-handle"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const localAngle = displayLens === "OS" ? Math.PI - displayAngle : displayAngle;

                              const getAngularDistance = (a1: number, a2: number) => {
                                const diff = Math.abs(a1 - a2) % (2 * Math.PI);
                                return Math.min(diff, 2 * Math.PI - diff);
                              };

                              let existingIdx = deformsList.findIndex(
                                (def) => getAngularDistance(def.angle, localAngle) < Math.PI / 4
                              );

                              let activeDefIdx = existingIdx;
                              let updatedDeformsList = [...deformsList];

                              if (activeDefIdx === -1) {
                                const newDef = { x: 0, y: 0, angle: localAngle };
                                updatedDeformsList.push(newDef);
                                activeDefIdx = updatedDeformsList.length - 1;
                              }

                              const activeDef = updatedDeformsList[activeDefIdx];

                              setActiveDrag({
                                type: "elastic",
                                startX: e.clientX,
                                startY: e.clientY,
                                startValueA: A_val,
                                startValueB: B_val,
                                startValueBridge: DBL_val,
                                startDeformX: activeDef.x,
                                startDeformY: activeDef.y,
                                angle: activeDef.angle,
                                activeLens: displayLens,
                                activeDefIndex: activeDefIdx,
                                initialDeformsList: updatedDeformsList
                              });
                            }}
                          >
                            {/* Pulsing outer circle to show touch/hover area */}
                            <circle
                              cx={glideX * scale}
                              cy={glideY * scale}
                              r={9 * scale}
                              fill={prefix === "near" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)"}
                              className="animate-pulse"
                            />
                            {/* Main stroke line connecting center to handle for extra visual feedback of elasticity */}
                            <line
                              x1={activeCenter * scale}
                              y1={CY * scale}
                              x2={glideX * scale}
                              y2={glideY * scale}
                              stroke={prefix === "near" ? "rgba(16,185,129,0.4)" : "rgba(59,130,246,0.4)"}
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                            />
                            {/* Main drag handle circle */}
                            <circle
                              cx={glideX * scale}
                              cy={glideY * scale}
                              r={5 * scale}
                              fill={prefix === "near" ? "rgba(16,185,129,0.35)" : "rgba(59,130,246,0.35)"}
                              stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                              strokeWidth="2"
                              className="transition-transform group-hover/elastic-handle:scale-125"
                            />
                            <circle
                              cx={glideX * scale}
                              cy={glideY * scale}
                              r={1.8 * scale}
                              fill={prefix === "near" ? "#10b981" : "#3b82f6"}
                            />
                            {/* Dynamic tooltip showing current lens size values */}
                            <g className="opacity-0 group-hover/elastic-handle:opacity-100 transition-opacity duration-150 pointer-events-none">
                              <rect
                                x={(glideX - 32) * scale}
                                y={(glideY - 18) * scale}
                                width={64 * scale}
                                height={11 * scale}
                                rx={1.5 * scale}
                                fill="rgba(15,23,42,0.9)"
                                stroke={prefix === "near" ? "#10b981" : "#3b82f6"}
                                strokeWidth="0.5"
                              />
                              <text
                                x={glideX * scale}
                                y={(glideY - 14) * scale}
                                textAnchor="middle"
                                fill="#ffffff"
                                className="text-[4.5px] font-extrabold tracking-wider uppercase"
                              >
                                Elastic: {A_val}口{DBL_val} / {B_val}
                              </text>
                              <text
                                x={glideX * scale}
                                y={(glideY - 9) * scale}
                                textAnchor="middle"
                                fill={prefix === "near" ? "#a7f3d0" : "#bfdbfe"}
                                className="text-[3.5px] font-black tracking-widest uppercase animate-pulse"
                              >
                                Trage in orice directie
                              </text>
                            </g>
                          </g>
                        );
                      })()}

                      {/* INTERACTIVE DRAG HANDLE FOR BRIDGE POSITION (VERTICAL DRAG) */}
                      {(() => {
                        const ptNasal = getPointOnPathAtAngle(shapePath, bridgeAngle);
                        const Y_bridge_start = paddingY + (ptNasal.y / 50) * B_val;
                        const Y_bridge_mid = Y_bridge_start - 3;
                        const hY = Y_bridge_mid * scale;
                        const hX = X_bridge_center * scale;

                        return (
                          <g
                            className="cursor-ns-resize group/bridge-pos-handle"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveDrag({
                                type: "bridgePosition",
                                startX: e.clientX,
                                startY: e.clientY,
                                startValueA: A_val,
                                startValueB: B_val,
                                startValueBridge: DBL_val,
                                startDeformX: 0,
                                startDeformY: 0,
                                angle: 0,
                                startBridgeAngle: bridgeAngle,
                              });
                            }}
                          >
                            {/* Outer pulsing circle */}
                            <circle
                              cx={hX}
                              cy={hY}
                              r={10 * scale}
                              fill="rgba(168,85,247,0.15)"
                              className="animate-pulse"
                            />
                            {/* Vertical helper line to indicate drag direction */}
                            <line
                              x1={hX}
                              y1={hY - 12 * scale}
                              x2={hX}
                              y2={hY + 12 * scale}
                              stroke="rgba(168,85,247,0.5)"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                            />
                            {/* Up & Down arrow indicators */}
                            <path
                              d={`M ${hX} ${hY - 8 * scale} L ${hX - 3 * scale} ${hY - 5 * scale} M ${hX} ${hY - 8 * scale} L ${hX + 3 * scale} ${hY - 5 * scale}`}
                              stroke="rgba(168,85,247,0.8)"
                              strokeWidth="1.5"
                            />
                            <path
                              d={`M ${hX} ${hY + 8 * scale} L ${hX - 3 * scale} ${hY + 5 * scale} M ${hX} ${hY + 8 * scale} L ${hX + 3 * scale} ${hY + 5 * scale}`}
                              stroke="rgba(168,85,247,0.8)"
                              strokeWidth="1.5"
                            />
                            {/* Inner circle handle */}
                            <circle
                              cx={hX}
                              cy={hY}
                              r={5 * scale}
                              fill="rgba(168,85,247,0.35)"
                              stroke="#a855f7"
                              strokeWidth="2.2"
                              className="transition-transform group-hover/bridge-pos-handle:scale-125"
                            />
                            <circle
                              cx={hX}
                              cy={hY}
                              r={1.8 * scale}
                              fill="#a855f7"
                            />
                            {/* Dynamic tooltip showing current bridge position status */}
                            <g className="opacity-0 group-hover/bridge-pos-handle:opacity-100 transition-opacity duration-150 pointer-events-none">
                              <rect
                                x={(X_bridge_center - 32) * scale}
                                y={(Y_bridge_mid - 20) * scale}
                                width={64 * scale}
                                height={13 * scale}
                                rx={1.5 * scale}
                                fill="rgba(15,23,42,0.9)"
                                stroke="#a855f7"
                                strokeWidth="0.5"
                              />
                              <text
                                x={hX}
                                y={(Y_bridge_mid - 15) * scale}
                                textAnchor="middle"
                                fill="#ffffff"
                                className="text-[4.5px] font-extrabold tracking-wider uppercase"
                              >
                                Înălțime Nazal
                              </text>
                              <text
                                x={hX}
                                y={(Y_bridge_mid - 10) * scale}
                                textAnchor="middle"
                                fill="#e9d5ff"
                                className="text-[3.5px] font-black tracking-widest uppercase animate-pulse"
                              >
                                Trage sus / jos
                              </text>
                            </g>
                          </g>
                        );
                      })()}

                      {/* Centration Crosshair - Right Eye (OD) */}
                      {(() => {
                        const parsedDiameter = parseFloat(lensDiameter) || 0;
                        if (parsedDiameter <= 0) return null;
                        return (
                          <g stroke="#f59e0b" strokeWidth={1.25} strokeDasharray="3 2" fill="rgba(245, 158, 11, 0.03)" className="opacity-90 pointer-events-none">
                            {/* Right Eye (OD) Lens Blank */}
                            <g>
                              <circle
                                cx={X_pupil_OD * scale}
                                cy={Y_pupil_OD * scale}
                                r={(parsedDiameter / 2) * scale}
                              />
                              <text
                                x={X_pupil_OD * scale}
                                y={Math.max(16 * scale, (Y_pupil_OD - (parsedDiameter / 2) + 3.2) * scale)}
                                textAnchor="middle"
                                fill="#d97706"
                                stroke={darkMode ? "#020617" : "#f8fafc"}
                                strokeWidth="1.5px"
                                paintOrder="stroke fill"
                                className="text-[4px] font-black"
                              >
                                Ø {parsedDiameter} mm
                              </text>
                            </g>

                            {/* Left Eye (OS) Lens Blank */}
                            <g>
                              <circle
                                cx={X_pupil_OS * scale}
                                cy={Y_pupil_OS * scale}
                                r={(parsedDiameter / 2) * scale}
                              />
                              <text
                                x={X_pupil_OS * scale}
                                y={Math.max(16 * scale, (Y_pupil_OS - (parsedDiameter / 2) + 3.2) * scale)}
                                textAnchor="middle"
                                fill="#d97706"
                                stroke={darkMode ? "#020617" : "#f8fafc"}
                                strokeWidth="1.5px"
                                paintOrder="stroke fill"
                                className="text-[4px] font-black"
                              >
                                Ø {parsedDiameter} mm
                              </text>
                            </g>
                          </g>
                        );
                      })()}

                      {/* Centration Crosshair - Right Eye (OD) */}
                      <g className={cn(prefix === "near" ? "text-emerald-500" : "text-blue-500", "pointer-events-none")}>
                        <circle cx={X_pupil_OD * scale} cy={Y_pupil_OD * scale} r={2.5 * scale} fill="none" stroke="currentColor" strokeWidth="1.25" />
                        <circle cx={X_pupil_OD * scale} cy={Y_pupil_OD * scale} r={0.6 * scale} fill="currentColor" />
                        <line x1={(X_pupil_OD - 5) * scale} y1={Y_pupil_OD * scale} x2={(X_pupil_OD + 5) * scale} y2={Y_pupil_OD * scale} stroke="currentColor" strokeWidth="1" />
                        <line x1={X_pupil_OD * scale} y1={(Y_pupil_OD - 5) * scale} x2={X_pupil_OD * scale} y2={(Y_pupil_OD + 5) * scale} stroke="currentColor" strokeWidth="1" />
                        <text x={(X_pupil_OD - 6) * scale} y={(Y_pupil_OD - 3) * scale} textAnchor="end" className="text-[8px] font-black fill-current">OD</text>
                      </g>

                      {/* Centration Crosshair - Left Eye (OS) */}
                      <g className={cn(prefix === "near" ? "text-emerald-500" : "text-blue-500", "pointer-events-none")}>
                        <circle cx={X_pupil_OS * scale} cy={Y_pupil_OS * scale} r={2.5 * scale} fill="none" stroke="currentColor" strokeWidth="1.25" />
                        <circle cx={X_pupil_OS * scale} cy={Y_pupil_OS * scale} r={0.6 * scale} fill="currentColor" />
                        <line x1={(X_pupil_OS - 5) * scale} y1={Y_pupil_OS * scale} x2={(X_pupil_OS + 5) * scale} y2={Y_pupil_OS * scale} stroke="currentColor" strokeWidth="1" />
                        <line x1={X_pupil_OS * scale} y1={(Y_pupil_OS - 5) * scale} x2={X_pupil_OS * scale} y2={(Y_pupil_OS + 5) * scale} stroke="currentColor" strokeWidth="1" />
                        <text x={(X_pupil_OS + 6) * scale} y={(Y_pupil_OS - 3) * scale} textAnchor="start" className="text-[8px] font-black fill-current">OS</text>
                      </g>

                      {/* Bifocal Segments (Pastilă de bifocal) */}
                      {selectedLensStyle === "bifocal" && (
                        <g stroke={prefix === "near" ? "rgba(16,185,129,0.75)" : "rgba(59,130,246,0.75)"} fill={prefix === "near" ? "rgba(16,185,129,0.06)" : "rgba(59,130,246,0.06)"} strokeWidth="1.25" className="pointer-events-none">
                          {/* OD Segment */}
                          {(() => {
                            const X_c = X_pupil_OD + 1.5;
                            const Y_top = Y_pupil_OD + 2.5;
                            return (
                              <path
                                d={`M ${(X_c - 11) * scale} ${Y_top * scale} L ${(X_c + 11) * scale} ${Y_top * scale} A ${11 * scale} ${10 * scale} 0 0 1 ${(X_c - 11) * scale} ${Y_top * scale}`}
                              />
                            );
                          })()}
                          {/* OS Segment */}
                          {(() => {
                            const X_c = X_pupil_OS - 1.5;
                            const Y_top = Y_pupil_OS + 2.5;
                            return (
                              <path
                                d={`M ${(X_c - 11) * scale} ${Y_top * scale} L ${(X_c + 11) * scale} ${Y_top * scale} A ${11 * scale} ${10 * scale} 0 0 1 ${(X_c - 11) * scale} ${Y_top * scale}`}
                              />
                            );
                          })()}
                        </g>
                      )}

                      {/* Progressive Laser Markings & Zones */}
                      {selectedLensStyle === "progressive" && (
                        <g stroke={prefix === "near" ? "rgba(16,185,129,0.75)" : "rgba(59,130,246,0.75)"} strokeWidth="0.75" fill="none" className="pointer-events-none">
                          {/* OD Progressive markings */}
                          {(() => {
                            const farY = Y_pupil_OD - 4;
                            const nearX = X_pupil_OD + 1.5;
                            const nearY = Y_pupil_OD + 11;
                            return (
                              <g>
                                {/* Distance Zone Circle */}
                                <circle cx={X_pupil_OD * scale} cy={farY * scale} r={4.5 * scale} strokeDasharray="1.5 1.5" />
                                <text x={X_pupil_OD * scale} y={(farY + 1.2) * scale} textAnchor="middle" stroke="none" fill={prefix === "near" ? "#10b981" : "#3b82f6"} className="text-[5px] font-black">D</text>

                                {/* Near Zone Circle */}
                                <circle cx={nearX * scale} cy={nearY * scale} r={4 * scale} strokeDasharray="1.5 1.5" />
                                <text x={nearX * scale} y={(nearY + 1.2) * scale} textAnchor="middle" stroke="none" fill={prefix === "near" ? "#10b981" : "#3b82f6"} className="text-[5px] font-black">A</text>

                                {/* Corridor Boundaries */}
                                <path d={`M ${(X_pupil_OD - 3.5) * scale} ${Y_pupil_OD * scale} Q ${(X_pupil_OD - 2.5) * scale} ${(Y_pupil_OD + 5) * scale} ${(X_pupil_OD - 2) * scale} ${nearY * scale}`} strokeDasharray="1 2" />
                                <path d={`M ${(X_pupil_OD + 3.5) * scale} ${Y_pupil_OD * scale} Q ${(X_pupil_OD + 2.5) * scale} ${(Y_pupil_OD + 5) * scale} ${(X_pupil_OD + 0.5) * scale} ${nearY * scale}`} strokeDasharray="1 2" />

                                {/* Micro-engravings */}
                                <circle cx={(X_pupil_OD - 17) * scale} cy={Y_pupil_OD * scale} r={0.6 * scale} />
                                <circle cx={(X_pupil_OD + 17) * scale} cy={Y_pupil_OD * scale} r={0.6 * scale} />
                              </g>
                            );
                          })()}

                          {/* OS Progressive markings */}
                          {(() => {
                            const farY = Y_pupil_OS - 4;
                            const nearX = X_pupil_OS - 1.5;
                            const nearY = Y_pupil_OS + 11;
                            return (
                              <g>
                                {/* Distance Zone Circle */}
                                <circle cx={X_pupil_OS * scale} cy={farY * scale} r={4.5 * scale} strokeDasharray="1.5 1.5" />
                                <text x={X_pupil_OS * scale} y={(farY + 1.2) * scale} textAnchor="middle" stroke="none" fill={prefix === "near" ? "#10b981" : "#3b82f6"} className="text-[5px] font-black">D</text>

                                {/* Near Zone Circle */}
                                <circle cx={nearX * scale} cy={nearY * scale} r={4 * scale} strokeDasharray="1.5 1.5" />
                                <text x={nearX * scale} y={(nearY + 1.2) * scale} textAnchor="middle" stroke="none" fill={prefix === "near" ? "#10b981" : "#3b82f6"} className="text-[5px] font-black">A</text>

                                {/* Corridor Boundaries */}
                                <path d={`M ${(X_pupil_OS - 3.5) * scale} ${Y_pupil_OS * scale} Q ${(X_pupil_OS - 2.5) * scale} ${(Y_pupil_OS + 5) * scale} ${(X_pupil_OS - 0.5) * scale} ${nearY * scale}`} strokeDasharray="1 2" />
                                <path d={`M ${(X_pupil_OS + 3.5) * scale} ${Y_pupil_OS * scale} Q ${(X_pupil_OS + 2.5) * scale} ${(Y_pupil_OS + 5) * scale} ${(X_pupil_OS + 2) * scale} ${nearY * scale}`} strokeDasharray="1 2" />

                                {/* Micro-engravings */}
                                <circle cx={(X_pupil_OS - 17) * scale} cy={Y_pupil_OS * scale} r={0.6 * scale} />
                                <circle cx={(X_pupil_OS + 17) * scale} cy={Y_pupil_OS * scale} r={0.6 * scale} />
                              </g>
                            );
                          })()}
                        </g>
                      )}

                      {/* Dimension A - Lens Width Line */}
                      <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                        <line
                          x1={X_OD_start * scale}
                          y1={(paddingY + B_val + 6) * scale}
                          x2={X_OD_end * scale}
                          y2={(paddingY + B_val + 6) * scale}
                          stroke="currentColor"
                          strokeWidth="1"
                          markerStart={`url(#arrow-${prefix})`}
                          markerEnd={`url(#arrow-${prefix})`}
                        />
                        <text
                          x={((X_OD_start + X_OD_end) / 2) * scale}
                          y={(paddingY + B_val + 11) * scale}
                          textAnchor="middle"
                          stroke={darkMode ? "#020617" : "#f8fafc"}
                          strokeWidth="1.5px"
                          paintOrder="stroke fill"
                          className="text-[8px] font-black fill-slate-500 dark:fill-slate-400"
                        >
                          A = {A_val} mm
                        </text>
                        <line x1={X_OD_start * scale} y1={(paddingY + B_val + 1) * scale} x2={X_OD_start * scale} y2={(paddingY + B_val + 8) * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                        <line x1={X_OD_end * scale} y1={(paddingY + B_val + 1) * scale} x2={X_OD_end * scale} y2={(paddingY + B_val + 8) * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                      </g>

                      {/* Dimension ED - Lens Diagonal */}
                      {(() => {
                        const ED_val = Math.sqrt(A_val * A_val + B_val * B_val);
                        return (
                          <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                            {/* Diagonal line across the OS lens */}
                            <line
                              x1={X_OS_start * scale}
                              y1={(paddingY + B_val) * scale}
                              x2={X_OS_end * scale}
                              y2={paddingY * scale}
                              stroke="currentColor"
                              strokeWidth="0.75"
                              strokeDasharray="2 2"
                              opacity="0.6"
                            />
                            {/* Text label below the OS lens */}
                            <text
                              x={((X_OS_start + X_OS_end) / 2) * scale}
                              y={(paddingY + B_val + 11) * scale}
                              textAnchor="middle"
                              stroke={darkMode ? "#020617" : "#f8fafc"}
                              strokeWidth="1.5px"
                              paintOrder="stroke fill"
                              className="text-[8px] font-black fill-slate-500 dark:fill-slate-400"
                            >
                              ED (Diag) = {ED_val.toFixed(1)} mm
                            </text>
                          </g>
                        );
                      })()}

                      {/* Dimension B - Lens Height Line */}
                      <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                        <line
                          x1={(X_OD_start - 6) * scale}
                          y1={paddingY * scale}
                          x2={(X_OD_start - 6) * scale}
                          y2={(paddingY + B_val) * scale}
                          stroke="currentColor"
                          strokeWidth="1"
                          markerStart={`url(#arrow-${prefix})`}
                          markerEnd={`url(#arrow-${prefix})`}
                        />
                        <text
                          x={(X_OD_start - 10) * scale}
                          y={((paddingY + paddingY + B_val) / 2) * scale + 2}
                          textAnchor="end"
                          stroke={darkMode ? "#020617" : "#f8fafc"}
                          strokeWidth="1.5px"
                          paintOrder="stroke fill"
                          className="text-[8px] font-black fill-slate-500 dark:fill-slate-400"
                        >
                          B = {B_val} mm
                        </text>
                        <line x1={(X_OD_start - 1) * scale} y1={paddingY * scale} x2={(X_OD_start - 8) * scale} y2={paddingY * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                        <line x1={(X_OD_start - 1) * scale} y1={(paddingY + B_val) * scale} x2={(X_OD_start - 8) * scale} y2={(paddingY + B_val) * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                      </g>

                      {/* Dimension DBL - Bridge Line (Aligned at bottom from OD nasal to OS nasal) */}
                      {(() => {
                        const ptNasal = getPointOnPathAtAngle(shapePath, bridgeAngle);
                        const X_bridge_start = X_OD_start + (ptNasal.x / 80) * A_val;
                        const X_bridge_end = X_OS_start + ((80 - ptNasal.x) / 80) * A_val;
                        return (
                          <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                            <line
                              x1={X_bridge_start * scale}
                              y1={(paddingY + B_val + 6) * scale}
                              x2={X_bridge_end * scale}
                              y2={(paddingY + B_val + 6) * scale}
                              stroke="currentColor"
                              strokeWidth="1"
                              markerStart={`url(#arrow-${prefix})`}
                              markerEnd={`url(#arrow-${prefix})`}
                            />
                            <text
                              x={X_bridge_center * scale}
                              y={(paddingY + B_val + 11) * scale}
                              textAnchor="middle"
                              stroke={darkMode ? "#020617" : "#f8fafc"}
                              strokeWidth="1.5px"
                              paintOrder="stroke fill"
                              className="text-[7.5px] font-black fill-slate-500 dark:fill-slate-400"
                            >
                              DBL = {actualDBL} mm
                            </text>
                            <line x1={X_bridge_start * scale} y1={(paddingY + B_val + 1) * scale} x2={X_bridge_start * scale} y2={(paddingY + B_val + 8) * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                            <line x1={X_bridge_end * scale} y1={(paddingY + B_val + 1) * scale} x2={X_bridge_end * scale} y2={(paddingY + B_val + 8) * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                          </g>
                        );
                      })()}

                      {/* Dimension DP OD - Pupil Distance OD */}
                      <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                        <line
                          x1={X_bridge_center * scale}
                          y1={(paddingY - 5) * scale}
                          x2={X_pupil_OD * scale}
                          y2={(paddingY - 5) * scale}
                          stroke="currentColor"
                          strokeWidth="0.75"
                          markerStart={`url(#arrow-${prefix})`}
                          markerEnd={`url(#arrow-${prefix})`}
                        />
                        <text
                          x={((X_bridge_center + X_pupil_OD) / 2) * scale}
                          y={(paddingY - 8) * scale}
                          textAnchor="middle"
                          stroke={darkMode ? "#020617" : "#f8fafc"}
                          strokeWidth="1.5px"
                          paintOrder="stroke fill"
                          className="text-[7px] font-black fill-slate-500 dark:fill-slate-400"
                        >
                          DP OD = {DP_OD_val} mm
                        </text>
                        <line x1={X_pupil_OD * scale} y1={Y_pupil_OD * scale} x2={X_pupil_OD * scale} y2={(paddingY - 10) * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                      </g>

                      {/* Dimension DP OS - Pupil Distance OS */}
                      <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                        <line
                          x1={X_bridge_center * scale}
                          y1={(paddingY - 5) * scale}
                          x2={X_pupil_OS * scale}
                          y2={(paddingY - 5) * scale}
                          stroke="currentColor"
                          strokeWidth="0.75"
                          markerStart={`url(#arrow-${prefix})`}
                          markerEnd={`url(#arrow-${prefix})`}
                        />
                        <text
                          x={((X_bridge_center + X_pupil_OS) / 2) * scale}
                          y={(paddingY - 8) * scale}
                          textAnchor="middle"
                          stroke={darkMode ? "#020617" : "#f8fafc"}
                          strokeWidth="1.5px"
                          paintOrder="stroke fill"
                          className="text-[7px] font-black fill-slate-500 dark:fill-slate-400"
                        >
                          DP OS = {DP_OS_val} mm
                        </text>
                        <line x1={X_pupil_OS * scale} y1={Y_pupil_OS * scale} x2={X_pupil_OS * scale} y2={(paddingY - 10) * scale} stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                      </g>

                      {/* Dimension H OD - Fitting Height OD */}
                      <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                        <line
                          x1={X_pupil_OD * scale}
                          y1={Y_pupil_OD * scale}
                          x2={X_pupil_OD * scale}
                          y2={physicalBottomY_OD * scale}
                          stroke="currentColor"
                          strokeWidth="0.75"
                          markerStart={`url(#arrow-${prefix})`}
                          markerEnd={`url(#arrow-${prefix})`}
                        />
                        <text
                          x={(X_pupil_OD - 3) * scale}
                          y={((Y_pupil_OD + physicalBottomY_OD) / 2) * scale + 2}
                          textAnchor="end"
                          stroke={darkMode ? "#020617" : "#f8fafc"}
                          strokeWidth="1.5px"
                          paintOrder="stroke fill"
                          className="text-[7px] font-black fill-slate-500 dark:fill-slate-400"
                        >
                          H = {H_OD_val} mm
                        </text>
                      </g>

                      {/* Dimension H OS - Fitting Height OS */}
                      <g className="text-slate-400 dark:text-slate-500 pointer-events-none">
                        <line
                          x1={X_pupil_OS * scale}
                          y1={Y_pupil_OS * scale}
                          x2={X_pupil_OS * scale}
                          y2={physicalBottomY_OS * scale}
                          stroke="currentColor"
                          strokeWidth="0.75"
                          markerStart={`url(#arrow-${prefix})`}
                          markerEnd={`url(#arrow-${prefix})`}
                        />
                        <text
                          x={(X_pupil_OS + 3) * scale}
                          y={((Y_pupil_OS + physicalBottomY_OS) / 2) * scale + 2}
                          textAnchor="start"
                          stroke={darkMode ? "#020617" : "#f8fafc"}
                          strokeWidth="1.5px"
                          paintOrder="stroke fill"
                          className="text-[7px] font-black fill-slate-500 dark:fill-slate-400"
                        >
                          H = {H_OS_val} mm
                        </text>
                      </g>
                    </svg>
                    {/* Interactive Drag Hint removed */}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
});
