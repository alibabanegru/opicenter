import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { normalizeForPDF, formatPhoneNumber, getImageFormatForPdf } from "../lib/stringUtils";
import { FRAME_SHAPES } from "../components/FrameConfigurator";
import { deformPath, getPointOnPathAtAngle } from "../appConstants";
import { QR_CODE_REVIEW_BASE64 } from "../assets/qrCodeReview";

export const drawGlassesCanvas = (order: any, isNear: boolean): string | null => {
  const shapeField = isNear ? "nearFrameShape" : "frameShape";
  const typeField = isNear ? "nearFrameType" : "frameType";
  const widthField = isNear ? "nearLensWidth" : "lensWidth";
  const heightField = isNear ? "nearLensHeight" : "lensHeight";
  const bridgeField = isNear ? "nearBridgeSize" : "bridgeSize";

  const dpOdField = isNear ? "nearDp_od" : "dp_od";
  const dpOsField = isNear ? "nearDp_os" : "dp_os";
  const fitOdField = isNear ? "nearFittingHeight_od" : "fittingHeight_od";
  const fitOsField = isNear ? "nearFittingHeight_os" : "fittingHeight_os";
  const diameterField = isNear ? "nearLensDiameter" : "lensDiameter";

  const selectedShape = (order[shapeField] as number) || 1;
  const selectedType = order[typeField] || "full";
  const A_val = parseFloat(order[widthField]) || 50;
  const B_val = parseFloat(order[heightField]) || 38;
  const DBL_val = parseFloat(order[bridgeField]) || 16;
  const lensDiameter_val = parseFloat(order[diameterField]) || 0;

  const DP_OD_val = parseFloat(order[dpOdField]) || 32;
  const DP_OS_val = parseFloat(order[dpOsField]) || 32;
  const H_OD_val = parseFloat(order[fitOdField]) || 20;
  const H_OS_val = parseFloat(order[fitOsField]) || 20;

  const shapeObj = FRAME_SHAPES.find((s) => s.id === selectedShape) || FRAME_SHAPES[0];
  const deformXField = isNear ? "nearFrameDeformX" : "frameDeformX";
  const deformYField = isNear ? "nearFrameDeformY" : "frameDeformY";
  const deformAngleField = isNear ? "nearFrameDeformAngle" : "frameDeformAngle";
  const deformsListField = isNear ? "nearFrameDeformsList" : "frameDeformsList";
  const rotationField = isNear ? "nearFrameRotation" : "frameRotation";
  const frameRotation = Number(order[rotationField]) || 0;

  const deformsListStr = (order[deformsListField] || "") as string;
  const shapePath = deformsListStr
    ? deformPath(shapeObj.path, deformsListStr, frameRotation)
    : deformPath(
        shapeObj.path,
        parseFloat(order[deformXField]) || 0,
        parseFloat(order[deformYField]) || 0,
        parseFloat(order[deformAngleField]) || 0,
        frameRotation
      );

  const paddingLeft = 16; // 16mm left padding for B dimension clearance
  const paddingRight = 12; // 12mm right padding
  const paddingY = 16; // 16mm top padding for pupil/fitting dimensions
  const X_OD_start = paddingLeft;
  const X_OD_end = X_OD_start + A_val;
  const X_bridge_start = X_OD_end;
  const X_bridge_end = X_bridge_start + DBL_val;
  const X_bridge_center = (X_bridge_start + X_bridge_end) / 2;
  const X_OS_start = X_bridge_end;
  const X_OS_end = X_OS_start + A_val;

  // Pupil centers: OD pupil is at (X_bridge_center - DP_OD), OS pupil is at (X_bridge_center + DP_OS)
  const X_pupil_OD = X_bridge_center - DP_OD_val;
  const X_pupil_OS = X_bridge_center + DP_OS_val;

  // In boxing system: Y starts at paddingY (boxing top) and goes to paddingY + B_val (boxing bottom)
  // Height H is measured vertically UPWARDS from the bottom boxing tangent
  const boxingBottom_Y = paddingY + B_val;
  const Y_pupil_OD = boxingBottom_Y - H_OD_val;
  const Y_pupil_OS = boxingBottom_Y - H_OS_val;

  // Scale: 1mm = 10px on the canvas (1:1 high resolution print at 254 DPI)
  const scale = 10;
  const drawingWidthMm = 2 * A_val + DBL_val + paddingLeft + paddingRight;
  const drawingHeightMm = B_val + paddingY * 2 + 10;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(drawingWidthMm * scale);
  canvas.height = Math.round(drawingHeightMm * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const strokeColor = "#1e293b";

  // Helper to draw halo around technical text for crystal clear contrast
  const drawTextWithHalo = (text: string, x: number, y: number, align: CanvasTextAlign = "left") => {
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.lineJoin = "round";
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  // 1. Draw OD Eye (Right Eye on the left of drawing)
  ctx.save();
  ctx.translate(X_OD_start * scale, paddingY * scale);
  ctx.scale((A_val / 50) * scale, (B_val / 50) * scale);
  const path2d = new Path2D(shapePath);

  ctx.fillStyle = "rgba(240, 240, 240, 0.15)";
  ctx.fill(path2d);

  if (selectedType === "groove") {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2 / scale;
    ctx.setLineDash([1.5 * scale, 1.5 * scale]);
    ctx.stroke(path2d);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.5 / scale;
    ctx.beginPath();
    ctx.rect(-10, -10, 100, 35); // Clip top half
    ctx.clip();
    ctx.stroke(path2d);
    ctx.restore();
  } else if (selectedType === "drill") {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8 / scale;
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.stroke(path2d);
    ctx.restore();

    const ptNasal = getPointOnPathAtAngle(shapePath, 0);
    const ptTemporal = getPointOnPathAtAngle(shapePath, Math.PI);

    const holes = [
      { x: ptNasal.x - 3, y: ptNasal.y },
      { x: ptTemporal.x + 3, y: ptTemporal.y },
    ];
    ctx.fillStyle = "#0f172a";
    holes.forEach((h) => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2 / scale;
    ctx.stroke(path2d);
  }
  ctx.restore();

  // 2. Draw OS Eye (Left Eye on the right of drawing) - Mirrored horizontally
  ctx.save();
  ctx.translate(X_OS_end * scale, paddingY * scale);
  ctx.scale(-(A_val / 50) * scale, (B_val / 50) * scale);
  ctx.fillStyle = "rgba(240, 240, 240, 0.15)";
  ctx.fill(path2d);

  if (selectedType === "groove") {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2 / scale;
    ctx.setLineDash([1.5 * scale, 1.5 * scale]);
    ctx.stroke(path2d);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.5 / scale;
    ctx.beginPath();
    ctx.rect(-10, -10, 100, 35); // Clip top half
    ctx.clip();
    ctx.stroke(path2d);
    ctx.restore();
  } else if (selectedType === "drill") {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8 / scale;
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.stroke(path2d);
    ctx.restore();

    const ptNasal = getPointOnPathAtAngle(shapePath, 0);
    const ptTemporal = getPointOnPathAtAngle(shapePath, Math.PI);

    const holes = [
      { x: ptNasal.x - 3, y: ptNasal.y },
      { x: ptTemporal.x + 3, y: ptTemporal.y },
    ];
    ctx.fillStyle = "#0f172a";
    holes.forEach((h) => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2 / scale;
    ctx.stroke(path2d);
  }
  ctx.restore();

  // 3. Draw Bridge connecting OD and OS
  ctx.save();
  const bridgeAngle = (12 * Math.PI) / 180;
  const bridgeNasalPt = getPointOnPathAtAngle(shapePath, bridgeAngle);
  const bridgeY = paddingY + (bridgeNasalPt.y / 50) * B_val;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = selectedType === "groove" ? 1.5 : 2.5;
  ctx.beginPath();
  ctx.moveTo(X_bridge_start * scale, bridgeY * scale);
  ctx.quadraticCurveTo(
    X_bridge_center * scale,
    (bridgeY - 3.5) * scale,
    X_bridge_end * scale,
    bridgeY * scale
  );
  ctx.stroke();
  ctx.restore();

  // 4. Optical Center / Pupil Crosshairs (OD and OS)
  ctx.strokeStyle = isNear ? "#10b981" : "#2563eb";
  ctx.fillStyle = isNear ? "#10b981" : "#2563eb";
  ctx.lineWidth = 1.2;

  // OD Pupil
  ctx.beginPath();
  ctx.arc(X_pupil_OD * scale, Y_pupil_OD * scale, 2.5 * scale, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(X_pupil_OD * scale, Y_pupil_OD * scale, 0.6 * scale, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo((X_pupil_OD - 5) * scale, Y_pupil_OD * scale);
  ctx.lineTo((X_pupil_OD + 5) * scale, Y_pupil_OD * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X_pupil_OD * scale, (Y_pupil_OD - 5) * scale);
  ctx.lineTo(X_pupil_OD * scale, (Y_pupil_OD + 5) * scale);
  ctx.stroke();

  // OS Pupil
  ctx.beginPath();
  ctx.arc(X_pupil_OS * scale, Y_pupil_OS * scale, 2.5 * scale, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(X_pupil_OS * scale, Y_pupil_OS * scale, 0.6 * scale, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo((X_pupil_OS - 5) * scale, Y_pupil_OS * scale);
  ctx.lineTo((X_pupil_OS + 5) * scale, Y_pupil_OS * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X_pupil_OS * scale, (Y_pupil_OS - 5) * scale);
  ctx.lineTo(X_pupil_OS * scale, (Y_pupil_OS + 5) * scale);
  ctx.stroke();

  // Draw lens design markings (Bifocal pastille or Progressive corridor)
  const lensStyleField = isNear ? "nearLensStyle" : "lensStyle";
  const selectedLensStyle = order[lensStyleField] || "";

  if (selectedLensStyle === "bifocal") {
    ctx.save();
    ctx.strokeStyle = isNear ? "rgba(16,185,129,0.75)" : "rgba(59,130,246,0.75)";
    ctx.fillStyle = isNear ? "rgba(16,185,129,0.06)" : "rgba(59,130,246,0.06)";
    ctx.lineWidth = 1.25;

    // OD Bifocal Segment
    const X_c_OD = X_pupil_OD + 1.5;
    const Y_top_OD = Y_pupil_OD + 2.5;
    ctx.beginPath();
    ctx.moveTo((X_c_OD + 11) * scale, Y_top_OD * scale);
    ctx.ellipse(X_c_OD * scale, Y_top_OD * scale, 11 * scale, 10 * scale, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // OS Bifocal Segment
    const X_c_OS = X_pupil_OS - 1.5;
    const Y_top_OS = Y_pupil_OS + 2.5;
    ctx.beginPath();
    ctx.moveTo((X_c_OS + 11) * scale, Y_top_OS * scale);
    ctx.ellipse(X_c_OS * scale, Y_top_OS * scale, 11 * scale, 10 * scale, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.restore();
  } else if (selectedLensStyle === "progressive") {
    ctx.save();
    ctx.lineWidth = 1.1;

    // Draw OD Progressive
    const nearX_OD = X_pupil_OD + 1.5;
    const nearY_OD = Y_pupil_OD + 11;

    // Corridor boundaries OD
    ctx.strokeStyle = isNear ? "rgba(16,185,129,0.5)" : "rgba(59,130,246,0.5)";
    ctx.setLineDash([1.5, 3]);
    ctx.beginPath();
    ctx.moveTo((X_pupil_OD - 3.5) * scale, Y_pupil_OD * scale);
    ctx.quadraticCurveTo(
      (X_pupil_OD - 2.5) * scale,
      (Y_pupil_OD + 5) * scale,
      (X_pupil_OD - 2) * scale,
      nearY_OD * scale
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((X_pupil_OD + 3.5) * scale, Y_pupil_OD * scale);
    ctx.quadraticCurveTo(
      (X_pupil_OD + 2.5) * scale,
      (Y_pupil_OD + 5) * scale,
      (X_pupil_OD + 0.5) * scale,
      nearY_OD * scale
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Micro-engravings OD
    ctx.strokeStyle = isNear ? "rgba(16,185,129,0.75)" : "rgba(59,130,246,0.75)";
    ctx.beginPath();
    ctx.arc((X_pupil_OD - 17) * scale, Y_pupil_OD * scale, 0.6 * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc((X_pupil_OD + 17) * scale, Y_pupil_OD * scale, 0.6 * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw OS Progressive
    const nearX_OS = X_pupil_OS - 1.5;
    const nearY_OS = Y_pupil_OS + 11;

    // Corridor boundaries OS
    ctx.strokeStyle = isNear ? "rgba(16,185,129,0.5)" : "rgba(59,130,246,0.5)";
    ctx.setLineDash([1.5, 3]);
    ctx.beginPath();
    ctx.moveTo((X_pupil_OS - 3.5) * scale, Y_pupil_OS * scale);
    ctx.quadraticCurveTo(
      (X_pupil_OS - 2.5) * scale,
      (Y_pupil_OS + 5) * scale,
      (X_pupil_OS - 0.5) * scale,
      nearY_OS * scale
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((X_pupil_OS + 3.5) * scale, Y_pupil_OS * scale);
    ctx.quadraticCurveTo(
      (X_pupil_OS + 2.5) * scale,
      (Y_pupil_OS + 5) * scale,
      (X_pupil_OS + 2) * scale,
      nearY_OS * scale
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Micro-engravings OS
    ctx.strokeStyle = isNear ? "rgba(16,185,129,0.75)" : "rgba(59,130,246,0.75)";
    ctx.beginPath();
    ctx.arc((X_pupil_OS - 17) * scale, Y_pupil_OS * scale, 0.6 * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc((X_pupil_OS + 17) * scale, Y_pupil_OS * scale, 0.6 * scale, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  // Dimension lines and technical text
  ctx.strokeStyle = "#64748b";
  ctx.fillStyle = "#475569";
  ctx.lineWidth = 0.8;
  ctx.font = `${Math.round(6.5 * scale)}px sans-serif`;

  // Arrow helper
  const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 1.8 * scale;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + size * Math.cos(angle + Math.PI / 6), y1 + size * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x1 + size * Math.cos(angle - Math.PI / 6), y1 + size * Math.sin(angle - Math.PI / 6));
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
    ctx.fill();
  };

  // Lens Diameter Circle visualization (if specified)
  if (lensDiameter_val > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
    ctx.fillStyle = "rgba(168, 85, 247, 0.04)";
    ctx.lineWidth = 0.8 * scale;
    ctx.setLineDash([2 * scale, 2 * scale]);

    const radiusPx = (lensDiameter_val / 2) * scale;
    // OD Diameter Circle
    ctx.beginPath();
    ctx.arc(X_pupil_OD * scale, Y_pupil_OD * scale, radiusPx, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // OS Diameter Circle
    ctx.beginPath();
    ctx.arc(X_pupil_OS * scale, Y_pupil_OS * scale, radiusPx, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Diameter text labels
    ctx.setLineDash([]);
    const diamFontSize = ((4.8 / 1.5) * scale).toFixed(1);
    ctx.font = `bold ${diamFontSize}px sans-serif`;

    const diamY_OD = Math.max(16 * scale, Y_pupil_OD * scale - radiusPx + 3.2 * scale);
    const diamY_OS = Math.max(16 * scale, Y_pupil_OS * scale - radiusPx + 3.2 * scale);

    drawTextWithHalo(`Ø ${lensDiameter_val} mm`, X_pupil_OD * scale, diamY_OD, "center");
    drawTextWithHalo(`Ø ${lensDiameter_val} mm`, X_pupil_OS * scale, diamY_OS, "center");

    ctx.restore();
  }

  // Individual DP and H dimension segments
  ctx.save();
  ctx.strokeStyle = isNear ? "#10b981" : "#3b82f6";
  ctx.fillStyle = isNear ? "#047857" : "#1d4ed8";
  ctx.lineWidth = 0.8 * scale;
  const dpFontSize = ((5.5 / 1.3) * scale).toFixed(1);
  ctx.font = `bold ${dpFontSize}px sans-serif`;

  // Horizontal Individual DP measurements at Y = 11.5mm
  const dpY = 11.5;
  ctx.setLineDash([1.5 * scale, 1.5 * scale]);
  ctx.beginPath();
  ctx.moveTo(X_pupil_OD * scale, Y_pupil_OD * scale);
  ctx.lineTo(X_pupil_OD * scale, dpY * scale);
  ctx.moveTo(X_pupil_OS * scale, Y_pupil_OS * scale);
  ctx.lineTo(X_pupil_OS * scale, dpY * scale);
  ctx.stroke();
  ctx.setLineDash([]);

  // OD DP arrow & text
  drawArrow(X_pupil_OD * scale, dpY * scale, X_bridge_center * scale, dpY * scale);
  drawTextWithHalo(
    `DP = ${DP_OD_val} mm`,
    ((X_pupil_OD + X_bridge_center) / 2) * scale,
    (dpY - 2.5) * scale,
    "center"
  );

  // OS DP arrow & text
  drawArrow(X_bridge_center * scale, dpY * scale, X_pupil_OS * scale, dpY * scale);
  drawTextWithHalo(
    `DP = ${DP_OS_val} mm`,
    ((X_bridge_center + X_pupil_OS) / 2) * scale,
    (dpY - 2.5) * scale,
    "center"
  );

  // Bridge center vertical line at bridge
  ctx.beginPath();
  ctx.moveTo(X_bridge_center * scale, (dpY - 3.5) * scale);
  ctx.lineTo(X_bridge_center * scale, (dpY + 3.5) * scale);
  ctx.stroke();

  // Vertical Fitting Heights H (Boxing standard)
  const physicalBottomY_OD = boxingBottom_Y;
  const physicalBottomY_OS = boxingBottom_Y;

  const hOD_X = X_pupil_OD - 8;
  const hOS_X = X_pupil_OS + 8;

  // OD H projection line
  ctx.setLineDash([1.5 * scale, 1.5 * scale]);
  ctx.beginPath();
  ctx.moveTo(X_pupil_OD * scale, Y_pupil_OD * scale);
  ctx.lineTo(hOD_X * scale, Y_pupil_OD * scale);
  ctx.moveTo(X_OD_start * scale, physicalBottomY_OD * scale);
  ctx.lineTo(hOD_X * scale, physicalBottomY_OD * scale);
  ctx.stroke();
  ctx.setLineDash([]);

  drawArrow(hOD_X * scale, physicalBottomY_OD * scale, hOD_X * scale, Y_pupil_OD * scale);
  drawTextWithHalo(
    `H = ${H_OD_val} mm`,
    (hOD_X - 1.5) * scale,
    ((Y_pupil_OD + physicalBottomY_OD) / 2) * scale + 1.5 * scale,
    "right"
  );

  // OS H projection line
  ctx.setLineDash([1.5 * scale, 1.5 * scale]);
  ctx.beginPath();
  ctx.moveTo(X_pupil_OS * scale, Y_pupil_OS * scale);
  ctx.lineTo(hOS_X * scale, Y_pupil_OS * scale);
  ctx.moveTo(X_OS_end * scale, physicalBottomY_OS * scale);
  ctx.lineTo(hOS_X * scale, physicalBottomY_OS * scale);
  ctx.stroke();
  ctx.setLineDash([]);

  drawArrow(hOS_X * scale, physicalBottomY_OS * scale, hOS_X * scale, Y_pupil_OS * scale);
  drawTextWithHalo(
    `H = ${H_OS_val} mm`,
    (hOS_X + 1.5) * scale,
    ((Y_pupil_OS + physicalBottomY_OS) / 2) * scale + 1.5 * scale,
    "left"
  );

  ctx.restore();

  // Reset styles for regular dimension lines
  ctx.strokeStyle = "#64748b";
  ctx.fillStyle = "#475569";
  ctx.lineWidth = 0.8;
  ctx.font = `${Math.round(6.5 * scale)}px sans-serif`;

  // Dimension projection lines (dashed)
  ctx.save();
  ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
  ctx.lineWidth = 0.5 * scale;
  ctx.setLineDash([1.5 * scale, 1.5 * scale]);
  ctx.beginPath();
  // OD projection lines
  ctx.moveTo(X_OD_start * scale, (paddingY + B_val + 1) * scale);
  ctx.lineTo(X_OD_start * scale, (paddingY + B_val + 7) * scale);
  ctx.moveTo(X_OD_end * scale, (paddingY + B_val + 1) * scale);
  ctx.lineTo(X_OD_end * scale, (paddingY + B_val + 7) * scale);
  // DBL projection lines from nasal points
  ctx.moveTo(X_bridge_start * scale, (paddingY + B_val + 1) * scale);
  ctx.lineTo(X_bridge_start * scale, (paddingY + B_val + 7) * scale);
  ctx.moveTo(X_bridge_end * scale, (paddingY + B_val + 1) * scale);
  ctx.lineTo(X_bridge_end * scale, (paddingY + B_val + 7) * scale);
  // B projection lines
  ctx.moveTo((X_OD_start - 1) * scale, paddingY * scale);
  ctx.lineTo((X_OD_start - 7) * scale, paddingY * scale);
  ctx.moveTo((X_OD_start - 1) * scale, (paddingY + B_val) * scale);
  ctx.lineTo((X_OD_start - 7) * scale, (paddingY + B_val) * scale);
  ctx.stroke();
  ctx.restore();

  // Horizontal dimension lines at bottom: A (Lens Width) and DBL (Bridge)
  const dimY = (paddingY + B_val + 5) * scale;
  drawArrow(X_OD_start * scale, dimY, X_OD_end * scale, dimY);
  drawTextWithHalo(`A = ${A_val} mm`, ((X_OD_start + X_OD_end) / 2) * scale, dimY - 1.8 * scale, "center");

  drawArrow(X_bridge_start * scale, dimY, X_bridge_end * scale, dimY);
  drawTextWithHalo(
    `DBL = ${DBL_val} mm`,
    ((X_bridge_start + X_bridge_end) / 2) * scale,
    dimY - 1.8 * scale,
    "center"
  );

  // Vertical dimension line on left: B (Lens Height)
  const dimX = (X_OD_start - 5) * scale;
  drawArrow(dimX, paddingY * scale, dimX, (paddingY + B_val) * scale);
  ctx.save();
  ctx.translate(dimX - 2.5 * scale, (paddingY + B_val / 2) * scale);
  ctx.rotate(-Math.PI / 2);
  drawTextWithHalo(`B = ${B_val} mm`, 0, 0, "center");
  ctx.restore();

  // Technical Scale Calibration Bar (10 mm) at bottom right
  ctx.save();
  const barLengthMm = 10;
  const barXEnd = (drawingWidthMm - 6) * scale;
  const barXStart = barXEnd - barLengthMm * scale;
  const barY = (drawingHeightMm - 7) * scale;

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 0.4 * scale;
  ctx.beginPath();
  ctx.moveTo(barXStart, barY);
  ctx.lineTo(barXEnd, barY);
  ctx.stroke();

  ctx.lineWidth = 0.35 * scale;
  ctx.beginPath();
  // Start tick
  ctx.moveTo(barXStart, barY - 0.7 * scale);
  ctx.lineTo(barXStart, barY + 0.7 * scale);
  // Mid tick
  ctx.moveTo(barXStart + (barLengthMm / 2) * scale, barY - 0.5 * scale);
  ctx.lineTo(barXStart + (barLengthMm / 2) * scale, barY + 0.5 * scale);
  // End tick
  ctx.moveTo(barXEnd, barY - 0.7 * scale);
  ctx.lineTo(barXEnd, barY + 0.7 * scale);
  ctx.stroke();

  ctx.font = `${Math.round(3.8 * scale)}px sans-serif`;
  drawTextWithHalo("Etalon 10 mm (Scară 1:1)", barXEnd, barY + 3.5 * scale, "right");
  ctx.restore();

  return canvas.toDataURL("image/png");
};

export interface GlassesOrderPdfOptions {
  record: any;
  order: any;
  clinicConfig?: any;
  triggerPdfPrint: (doc: jsPDF, filename?: string) => void;
}

export const generateGlassesOrderPdf = ({
  record,
  order,
  clinicConfig,
  triggerPdfPrint,
}: GlassesOrderPdfOptions): void => {
  if (!record || !order) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Logo principal stânga (garantat cu cache fallback)
  const effectiveLogoUrl =
    clinicConfig?.logoUrl ||
    (() => {
      try {
        const c =
          localStorage.getItem("clinic_config_cache") ||
          localStorage.getItem("opticenter_clinic_config");
        return c ? JSON.parse(c)?.logoUrl : "";
      } catch {
        return "";
      }
    })();

  const effectiveSecondaryLogoUrl =
    clinicConfig?.secondaryLogoUrl ||
    (() => {
      try {
        const c =
          localStorage.getItem("clinic_config_cache") ||
          localStorage.getItem("opticenter_clinic_config");
        return c ? JSON.parse(c)?.secondaryLogoUrl : "";
      } catch {
        return "";
      }
    })();

  if (effectiveLogoUrl) {
    try {
      const fmt = getImageFormatForPdf(effectiveLogoUrl);
      doc.addImage(effectiveLogoUrl, fmt, 12, 4, 28, 18);
    } catch (e) {
      console.error("Could not load logo in glasses order PDF", e);
    }
  }

  // QR Code Recenzii & Servicii
  try {
    doc.addImage(QR_CODE_REVIEW_BASE64, "JPEG", 44, 4, 18, 18);
  } catch (e) {
    console.error("Could not load QR image in order PDF", e);
  }

  // 2. Logo secundar dreapta
  if (effectiveSecondaryLogoUrl) {
    try {
      const fmt = getImageFormatForPdf(effectiveSecondaryLogoUrl);
      doc.addImage(effectiveSecondaryLogoUrl, fmt, pageWidth - 42, 4, 28, 18);
    } catch (e) {
      console.error("Could not load secondary logo in order PDF", e);
    }
  }

  const normalize = (text: string | undefined): string => {
    return normalizeForPDF(text).toUpperCase();
  };

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("CLINICA NEGREANU", 105, 10, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("CLINICA OFTALMOLOGICA SI OPTOMETRICA", 105, 15, {
    align: "center",
  });
  doc.text("PITESTI, STR. MIHAI EMINESCU, BL. 30, SC. A, AP. 2", 105, 19, {
    align: "center",
  });
  doc.text("TELEFON: 0248 223 162", 105, 23, { align: "center" });

  doc.setDrawColor(200);
  doc.line(20, 26, 190, 26);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`COMANDA OCHELARI NR. ${normalize(order.orderNumber)}`, 20, 32);

  if (order.isUrgent || order.nearIsUrgent) {
    doc.setFontSize(36);
    doc.setTextColor(220, 38, 38);
    doc.text("URGENT", 190, 32, { align: "right" });
    doc.setFontSize(8);
  }

  doc.setFontSize(8);
  doc.setTextColor(100);
  let orderPlacementDateStr = "";
  try {
    const rawDate = order.createdAt || (order as any).orderDate;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        orderPlacementDateStr = format(d, "dd.MM.yyyy");
        const hours = d.getHours();
        const mins = d.getMinutes();
        if (hours !== 0 || mins !== 0) {
          orderPlacementDateStr += ` ${format(d, "HH:mm")}`;
        }
      }
    }
  } catch {}
  if (!orderPlacementDateStr) {
    orderPlacementDateStr = format(new Date(), "dd.MM.yyyy");
  }
  doc.text(`DATA PLASARE: ${orderPlacementDateStr}`, 20, 37);
  doc.setTextColor(30, 41, 59);
  doc.setFont(undefined, "bold");
  if (
    order.orderType === "both" &&
    order.nearDeliveryDate &&
    order.nearDeliveryDate !== order.deliveryDate
  ) {
    doc.text(
      `RIDICARE DISTANTA: ${format(new Date(order.deliveryDate), "dd.MM.yyyy")}`,
      190,
      37,
      { align: "right" }
    );
    doc.setFontSize(7);
    doc.text(
      `RIDICARE APROAPE: ${format(new Date(order.nearDeliveryDate), "dd.MM.yyyy")}`,
      190,
      41,
      { align: "right" }
    );
    doc.setFontSize(8);
  } else {
    doc.text(
      `RIDICARE ESTIMATA: ${format(new Date(order.deliveryDate), "dd.MM.yyyy")}`,
      190,
      37,
      { align: "right" }
    );
  }
  doc.setFont(undefined, "normal");

  doc.setFillColor(248, 250, 252);
  doc.rect(20, 42, 170, 10, "F");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("PACIENT:", 25, 48);
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont(undefined, "bold");
  doc.text(normalize(record.patientName), 45, 48);
  doc.setFontSize(8);
  const hasPhoneNum = !!(record.patientPhone && record.patientPhone.trim());
  if (hasPhoneNum) {
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, "bold");
    doc.text(`TEL: ${formatPhoneNumber(record.patientPhone)}`, 185, 48, {
      align: "right",
    });
  } else {
    doc.setTextColor(220, 38, 38);
    doc.setFont(undefined, "bold");
    doc.text("NR DE TELEFON INDISPONIBIL", 185, 48, {
      align: "right",
    });
  }
  doc.setFont(undefined, "normal");

  doc.setFontSize(8);
  doc.setTextColor(100);

  if (order.orderType === "contact_lens") {
    doc.text("DETALII PRESCRIPTIE LENTILE CONTACT:", 20, 56);

    const clRows = [
      [
        "OD (Drept)",
        order.cl_od?.sph || "",
        order.cl_od?.cyl || "",
        order.cl_od?.axis || "",
        order.cl_od?.base || "",
        order.cl_od?.radius || "",
        normalize(order.lensRightName || ""),
      ],
      [
        "OS (Stâng)",
        order.cl_os?.sph || "",
        order.cl_os?.cyl || "",
        order.cl_os?.axis || "",
        order.cl_os?.base || "",
        order.cl_os?.radius || "",
        normalize(order.lensLeftName || ""),
      ],
    ];

    autoTable(doc, {
      startY: 58,
      head: [["Ochi", "Sfera", "Cilindru", "Ax", "Raza (BC)", "Diametru (DIA)", "Tip/Brand"]],
      body: clRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [6, 182, 212] },
    });
  } else {
    doc.text(
      order.orderType === "progressive_bifocal"
        ? "DETALII PRESCRIPTIE PROGRESIV / BIFOCAL:"
        : "DETALII PRESCRIPTIE DISTANTA:",
      20,
      56
    );

    const distRows = [];
    if (order.orderType !== "near") {
      distRows.push([
        "OD (Dist)",
        order.od?.sph || "",
        order.od?.cyl || "",
        order.od?.axis || "",
        order.od?.add || "",
        order.od?.prism ? `${order.od.prism} ${order.od.base}` : "",
        order.dp || "",
      ]);
      distRows.push([
        "OS (Dist)",
        order.os?.sph || "",
        order.os?.cyl || "",
        order.os?.axis || "",
        order.os?.add || "",
        order.os?.prism ? `${order.os.prism} ${order.os.base}` : "",
        "",
      ]);
    } else {
      distRows.push(["OD (Dist)", "", "", "", "", "", ""]);
      distRows.push(["OS (Dist)", "", "", "", "", "", ""]);
    }

    autoTable(doc, {
      startY: 58,
      head: [["Ochi", "Sfera", "Cilindru", "Ax", "Aditie", "Prisma", "DP"]],
      body: distRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [71, 85, 105] },
    });
  }

  let currentY = (doc as any).lastAutoTable.finalY + 4;

  if (order.orderType === "both" || order.orderType === "near") {
    doc.text("DETALII PRESCRIPTIE APROAPE:", 20, currentY);
    const nearRows = [];
    const nOd = (order.orderType === "near" ? order.od : order.nearOd) as any;
    const nOs = (order.orderType === "near" ? order.os : order.nearOs) as any;
    const nDp = order.orderType === "near" ? order.dp : order.nearDp;

    nearRows.push([
      "OD (Apr)",
      nOd?.sph || "",
      nOd?.cyl || "",
      nOd?.axis || "",
      "",
      "", // Prism not allowed for near vision section
      nDp || "",
    ]);
    nearRows.push([
      "OS (Apr)",
      nOs?.sph || "",
      nOs?.cyl || "",
      nOs?.axis || "",
      "",
      "", // Prism not allowed for near vision section
      "",
    ]);

    autoTable(doc, {
      startY: currentY + 1.5,
      head: [["Ochi", "Sfera", "Cilindru", "Ax", "Aditie", "Prisma", "DP"]],
      body: nearRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [71, 85, 105] },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  doc.setFontSize(9);
  doc.setTextColor(100);
  if (order.orderType === "contact_lens") {
    doc.text("DETALII PRODUSE LENTILE CONTACT:", 20, currentY);
  } else if (order.orderType === "progressive_bifocal") {
    doc.text("OCHELARI PROGRESIV / BIFOCAL:", 20, currentY);
  } else {
    doc.text("OCHELARI DISTANTA / PACHET 1:", 20, currentY);
  }

  const distanceItems = [];
  if (order.orderType === "contact_lens") {
    distanceItems.push([
      "Lentilă OD",
      normalize(order.lensRightName),
      `${(order.lensRightPrice || 0).toFixed(2)} RON`,
    ]);
    distanceItems.push([
      "Lentilă OS",
      normalize(order.lensLeftName),
      `${(order.lensLeftPrice || 0).toFixed(2)} RON`,
    ]);
    if (order.laborPrice) {
      distanceItems.push(["Manopera", "-", `${(order.laborPrice || 0).toFixed(2)} RON`]);
    }
  } else {
    distanceItems.push([
      "Rama Ochelari",
      normalize(order.frameCode),
      `${(order.framePrice || 0).toFixed(2)} RON`,
    ]);
    distanceItems.push([
      "Lentila OD",
      normalize(order.lensRightName),
      `${(order.lensRightPrice || 0).toFixed(2)} RON`,
    ]);
    distanceItems.push([
      "Lentila OS",
      normalize(order.lensLeftName),
      `${(order.lensLeftPrice || 0).toFixed(2)} RON`,
    ]);
    distanceItems.push(["Manopera", "-", `${(order.laborPrice || 0).toFixed(2)} RON`]);
  }

  if (order.diversePrice) {
    distanceItems.push([
      order.diverseName || "Diverse",
      "-",
      `${order.diversePrice.toFixed(2)} RON`,
    ]);
  }

  autoTable(doc, {
    startY: currentY + 1.5,
    head: [["Articol", "Specificatii", "Pret"]],
    body: distanceItems,
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 1.2 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  if (order.orderType === "both") {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("OCHELARI APROAPE / PACHET 2:", 20, (doc as any).lastAutoTable.finalY + 4);

    const nearItems = [
      [
        "Rama Ochelari (Aproape)",
        normalize(order.nearFrameCode),
        `${(order.nearFramePrice || 0).toFixed(2)} RON`,
      ],
      [
        "Lentila OD (Aproape)",
        normalize(order.nearLensRightName),
        `${(order.nearLensRightPrice || 0).toFixed(2)} RON`,
      ],
      [
        "Lentila OS (Aproape)",
        normalize(order.nearLensLeftName),
        `${(order.nearLensLeftPrice || 0).toFixed(2)} RON`,
      ],
      ["Manopera (Aproape)", "-", `${(order.nearLaborPrice || 0).toFixed(2)} RON`],
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5.5,
      head: [["Articol", "Specificatii", "Pret"]],
      body: nearItems,
      theme: "striped",
      styles: { fontSize: 7.5, cellPadding: 1 },
      headStyles: { fillColor: [22, 163, 74] },
    });
  }

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }

  doc.setDrawColor(200);
  doc.line(110, finalY - 4, 190, finalY - 4);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("TOTAL GENERAL:", 120, finalY);
  doc.setFont(undefined, "bold");
  doc.text(`${(order.total || 0).toFixed(2)} RON`, 190, finalY, {
    align: "right",
  });

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("AVANS PLATIT:", 120, finalY + 6);
  doc.setTextColor(22, 163, 74);
  doc.text(`${(order.advance || 0).toFixed(2)} RON`, 190, finalY + 6, {
    align: "right",
  });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text("REST DE PLATA:", 110, finalY + 12);
  doc.setTextColor(220, 38, 38);
  doc.setFont(undefined, "bold");
  doc.text(`${(order.balance || 0).toFixed(2)} RON`, 190, finalY + 12, {
    align: "right",
  });

  let notesY = finalY + 14;
  let splitNotes: string[] = [];
  if (order.note) {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont(undefined, "italic");
    doc.text("OBSERVATII:", 20, notesY);
    doc.setFont(undefined, "normal");
    splitNotes = doc.splitTextToSize(normalize(order.note), 170);
    doc.text(splitNotes, 20, notesY + 3.5);
  }

  let drawStartY = Math.max(
    finalY + 18,
    order.note ? notesY + 3.5 + splitNotes.length * 4 + 4 : finalY + 18
  );

  const hasFrameConfig = Boolean(
    order.frameShape ||
      (order.fittingHeight_od && order.fittingHeight_od.trim() !== "") ||
      (order.fittingHeight_os && order.fittingHeight_os.trim() !== "")
  );

  const hasNearFrameConfig = Boolean(
    order.nearFrameShape ||
      (order.nearFittingHeight_od && order.nearFittingHeight_od.trim() !== "") ||
      (order.nearFittingHeight_os && order.nearFittingHeight_os.trim() !== "")
  );

  if (hasFrameConfig || hasNearFrameConfig) {
    if (drawStartY > 210) {
      doc.addPage();
      drawStartY = 20;
    }
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, "bold");
    doc.text("PARAMETRI DETALIATI RAMA SI MONTAJ / SPECIFICATII:", 20, drawStartY);
    doc.setDrawColor(220);
    doc.line(20, drawStartY + 1.5, 190, drawStartY + 1.5);
    drawStartY += 6;

    doc.setFontSize(7.5);
    doc.setFont(undefined, "normal");
    doc.setTextColor(80);

    if (hasFrameConfig) {
      const lines: string[] = [];
      const frameTypeVal = order.frameType || "full";
      const typeMap = {
        full: "Anou Complet",
        groove: "Rama pe fir",
        drill: "Rama pe capse/surub",
      };

      const A_val = parseFloat(order.lensWidth) || 50;
      const B_val = parseFloat(order.lensHeight) || 38;
      const DBL_val = parseFloat(order.bridgeSize) || 16;
      const ED_val = Math.sqrt(A_val * A_val + B_val * B_val);

      let row1 = `DISTANTA: `;
      if (order.frameShape) row1 += `Forma #${order.frameShape}  |  `;
      row1 += `Tip Montură: ${typeMap[frameTypeVal as keyof typeof typeMap] || frameTypeVal}`;
      const distanceDesignMap = { bifocal: "BIFOCAL", progressive: "PROGRESIV", "": "MONOFOCAL" };
      const distanceDesignVal = order.lensStyle || "";
      row1 += `  |  Design Lentilă: ${distanceDesignMap[distanceDesignVal as keyof typeof distanceDesignMap] || distanceDesignVal.toUpperCase() || "MONOFOCAL"}`;
      lines.push(normalize(row1));

      let row2 = "";
      if (order.lensWidth || order.lensHeight || order.bridgeSize) {
        row2 += `Casetat: ${order.lensWidth || "?"}x${order.lensHeight || "?"} [] ${order.bridgeSize || "?"} mm`;
      }
      if (row2) row2 += `  |  `;
      row2 += `Diagonala Lentilă (ED): ${ED_val.toFixed(1)} mm`;

      if (order.lensDiameter) {
        row2 += `  |  Diametru: Ø${order.lensDiameter} mm`;
      }
      if (order.dp_od || order.fittingHeight_od || order.dp_os || order.fittingHeight_os) {
        if (row2) row2 += `  |  `;
        row2 += `Montaj: OD(DP:${order.dp_od || "?"}, H:${order.fittingHeight_od || "?"}) OS(DP:${order.dp_os || "?"}, H:${order.fittingHeight_os || "?"})`;
      }
      if (row2) {
        lines.push(normalize(row2));
      }

      const drawingHeightMm = B_val + 36;

      const totalDistanceHeight = lines.length * 4 + drawingHeightMm + 10;
      if (drawStartY + totalDistanceHeight > 275) {
        doc.addPage();
        drawStartY = 20;
      }

      doc.text(lines, 20, drawStartY);
      drawStartY += lines.length * 4 + 2;

      // Render 1:1 scale drawing for Distance Frame
      const imgData = drawGlassesCanvas(order, false);
      if (imgData) {
        const drawingWidthMm = 2 * A_val + DBL_val + 28;
        const drawStartX = (210 - drawingWidthMm) / 2;
        doc.addImage(imgData, "PNG", drawStartX, drawStartY, drawingWidthMm, drawingHeightMm);
        drawStartY += drawingHeightMm + 5;
      }
    }

    if (hasNearFrameConfig) {
      const lines: string[] = [];
      const nearFrameTypeVal = order.nearFrameType || "full";
      const typeMap = {
        full: "Anou Complet",
        groove: "Rama pe fir",
        drill: "Rama pe capse/surub",
      };

      const A_val = parseFloat(order.nearLensWidth) || 50;
      const B_val = parseFloat(order.nearLensHeight) || 38;
      const DBL_val = parseFloat(order.nearBridgeSize) || 16;
      const ED_val = Math.sqrt(A_val * A_val + B_val * B_val);

      let row1 = `APROAPE: `;
      if (order.nearFrameShape) row1 += `Forma #${order.nearFrameShape}  |  `;
      row1 += `Tip Montură: ${typeMap[nearFrameTypeVal as keyof typeof typeMap] || nearFrameTypeVal}`;
      const nearDesignMap = { bifocal: "BIFOCAL", progressive: "PROGRESIV", "": "MONOFOCAL" };
      const nearDesignVal = order.nearLensStyle || "";
      row1 += `  |  Design Lentilă: ${nearDesignMap[nearDesignVal as keyof typeof nearDesignMap] || nearDesignVal.toUpperCase() || "MONOFOCAL"}`;
      lines.push(normalize(row1));

      let row2 = "";
      if (order.nearLensWidth || order.nearLensHeight || order.nearBridgeSize) {
        row2 += `Casetat: ${order.nearLensWidth || "?"}x${order.nearLensHeight || "?"} [] ${order.nearBridgeSize || "?"} mm`;
      }
      if (row2) row2 += `  |  `;
      row2 += `Diagonala Lentilă (ED): ${ED_val.toFixed(1)} mm`;

      if (order.nearLensDiameter) {
        row2 += `  |  Diametru: Ø${order.nearLensDiameter} mm`;
      }
      if (
        order.nearDp_od ||
        order.nearFittingHeight_od ||
        order.nearDp_os ||
        order.nearFittingHeight_os
      ) {
        if (row2) row2 += `  |  `;
        row2 += `Montaj: OD(DP:${order.nearDp_od || "?"}, H:${order.nearFittingHeight_od || "?"}) OS(DP:${order.nearDp_os || "?"}, H:${order.nearFittingHeight_os || "?"})`;
      }
      if (row2) {
        lines.push(normalize(row2));
      }

      const drawingHeightMm = B_val + 36;

      const totalNearHeight = lines.length * 4 + drawingHeightMm + 10;
      if (drawStartY + totalNearHeight > 275) {
        doc.addPage();
        drawStartY = 20;
      }

      doc.text(lines, 20, drawStartY);
      drawStartY += lines.length * 4 + 2;

      // Render 1:1 scale drawing for Near Frame
      const imgData = drawGlassesCanvas(order, true);
      if (imgData) {
        const drawingWidthMm = 2 * A_val + DBL_val + 28;
        const drawStartX = (210 - drawingWidthMm) / 2;
        doc.addImage(imgData, "PNG", drawStartX, drawStartY, drawingWidthMm, drawingHeightMm);
        drawStartY += drawingHeightMm + 5;
      }
    }
  }

  doc.setFontSize(7.5);
  doc.setTextColor(100);
  doc.setFont(undefined, "italic");
  const footerNote =
    "Nota: Avansul achitat nu poate fi returnat dupa un interval mai mare de 24 de ore de la plasarea comenzii, deoarece lentilele intra in procesul de prelucrare/comanda.";
  doc.text(doc.splitTextToSize(footerNote, 170), 20, 272);

  doc.setFont(undefined, "bold");
  doc.text("SEMNATURA OPTICIAN", 40, 285);
  doc.text("SEMNATURA CLIENT", 150, 285);

  triggerPdfPrint(
    doc,
    `Comanda_${normalize(order.orderNumber)}_${normalize(record.patientName)}.pdf`
  );
};
