import jsPDF from "jspdf";
import { format } from "date-fns";
import {
  calculateAge,
  calculateDetailedAge,
  MYOPIA_BOYS_DATA,
  MYOPIA_GIRLS_DATA,
  BOYS_RISK,
  GIRLS_RISK,
} from "../appConstants";

export interface MyopiaChartPdfOptions {
  currentMedicalRecord: any;
  myopiaChartEye: string;
  getActiveDate?: (rec?: any) => Date;
}

export interface BothMyopiaChartsA4Options {
  record: any;
  isMyopiaCombinedView: boolean;
  medicalRecords?: any[];
  medicalDocuments?: any[];
  getActiveDate?: (rec?: any) => Date;
}

export const cleanStrForMyopia = (str: string) => {
    if (!str) return "";
    return str
      .replace(/ă/g, "a")
      .replace(/Ă/g, "A")
      .replace(/â/g, "a")
      .replace(/Â/g, "A")
      .replace(/î/g, "i")
      .replace(/Î/g, "I")
      .replace(/ș/g, "s")
      .replace(/Ș/g, "S")
      .replace(/ț/g, "t")
      .replace(/Ț/g, "T")
      .replace(/♂/g, "(M)")
      .replace(/♀/g, "(F)");
  };

export const drawMyopiaGraph = (
    doc: jsPDF,
    startX: number,
    startY: number,
    width: number,
    height: number,
    sex: "M" | "F",
    patientData: { age: number; axialLength: number }[],
    patientDataOs?: { age: number; axialLength: number }[],
    isCombinedMode?: boolean,
  ) => {
    const data = sex === "M" ? MYOPIA_BOYS_DATA : MYOPIA_GIRLS_DATA;
    const padding = 15;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const minAge = 5;
    const maxAge = 22;
    const minAL = 20;
    const maxAL = 28;

    const getX = (age: number) =>
      startX + padding + ((age - minAge) / (maxAge - minAge)) * graphWidth;
    const getY = (al: number) =>
      startY +
      padding +
      graphHeight -
      ((al - minAL) / (maxAL - minAL)) * graphHeight;

    const cx = startX + width / 2;
    const cy = startY + height / 2;
    const gs = new (doc as any).GState({ opacity: 0.2 });
    doc.setGState(gs);

    const symbolSize = 30;
    const symbolColor: [number, number, number] =
      sex === "M" ? [50, 100, 255] : [255, 50, 100];
    doc.setDrawColor(symbolColor[0], symbolColor[1], symbolColor[2]);
    doc.setLineWidth(0.5);
    const radius = symbolSize / 2;
    doc.circle(cx, cy, radius, "S");

    if (sex === "M") {
      const angle = -Math.PI / 4;
      const x1 = cx + radius * Math.cos(angle);
      const y1 = cy + radius * Math.sin(angle);
      const x2 = cx + radius * 1.8 * Math.cos(angle);
      const y2 = cy + radius * 1.8 * Math.sin(angle);
      doc.line(x1, y1, x2, y2);
      const headLen = radius * 0.6;
      doc.line(
        x2,
        y2,
        x2 - headLen * Math.cos(angle - Math.PI / 6),
        y2 - headLen * Math.sin(angle - Math.PI / 6),
      );
      doc.line(
        x2,
        y2,
        x2 - headLen * Math.cos(angle + Math.PI / 6),
        y2 - headLen * Math.sin(angle + Math.PI / 6),
      );
    } else {
      const x1 = cx;
      const y1 = cy + radius;
      const y2 = cy + radius * 2.2;
      doc.line(x1, y1, x1, y2);
      const crossW = radius * 1.2;
      const crossY = cy + radius * 1.6;
      doc.line(x1 - crossW / 2, crossY, x1 + crossW / 2, crossY);
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);

    doc.setDrawColor(220);
    for (let age = minAge; age <= maxAge; age += 1) {
      const x = getX(age);
      doc.setLineWidth(age % 5 === 0 ? 0.2 : 0.05);
      doc.line(x, startY + padding, x, startY + padding + graphHeight);
      if (age % 5 === 0) {
        doc.setFontSize(8);
        doc.text(age.toString(), x, startY + padding + graphHeight + 5, {
          align: "center",
        });
      }
    }
    for (let al = minAL; al <= maxAL; al += 0.5) {
      const y = getY(al);
      doc.setLineWidth(al % 1 === 0 ? 0.2 : 0.05);
      doc.line(startX + padding, y, startX + padding + graphWidth, y);
      if (al % 1 === 0) {
        doc.setFontSize(8);
        doc.text(al.toString(), startX + padding - 5, y + 2, {
          align: "right",
        });
      }
    }

    const percentiles = [2, 5, 10, 25, 50, 75, 90, 95, 98];
    const colors: Record<number, [number, number, number]> = {
      2: [21, 128, 61],
      5: [22, 163, 74],
      10: [34, 197, 94],
      25: [132, 204, 22],
      50: [234, 179, 8],
      75: [249, 115, 22],
      90: [234, 88, 12],
      95: [220, 38, 38],
      98: [153, 27, 27],
    };

    percentiles.forEach((p) => {
      doc.setDrawColor(colors[p][0], colors[p][1], colors[p][2]);
      doc.setLineWidth(p === 50 ? 0.6 : 0.2);
      for (let i = 0; i < data.length - 1; i++) {
        const p1 = (data[i] as any)[`p${p}`];
        const p2 = (data[i + 1] as any)[`p${p}`];
        doc.line(
          getX(data[i].age),
          getY(p1),
          getX(data[i + 1].age),
          getY(p2),
        );
      }
      const lastData = data[data.length - 1];
      doc.setFontSize(6);
      doc.text(
        p.toString(),
        getX(lastData.age) + 2,
        getY((lastData as any)[`p${p}`]) + 1,
      );
    });

    // Linia OD (Ochi Drept) - În modul combinat: linie mai groasă (1.4) și puncte mai mari (2.4mm) pentru recunoaștere sigură alb-negru
    if (patientData && patientData.length > 0) {
      const sorted = [...patientData].sort((a, b) => a.age - b.age);
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(isCombinedMode ? 1.4 : 1);
      for (let i = 0; i < sorted.length - 1; i++) {
        doc.line(
          getX(sorted[i].age),
          getY(sorted[i].axialLength),
          getX(sorted[i + 1].age),
          getY(sorted[i + 1].axialLength),
        );
      }
      sorted.forEach((p) => {
        doc.setFillColor(37, 99, 235);
        // Punct mai gros pentru OD (2.4mm în modul combinat)
        doc.circle(getX(p.age), getY(p.axialLength), isCombinedMode ? 2.4 : 1.5, "F");
      });
    }

    // Linia OS (Ochi Stâng) dacă modul combinat este activat - linie mai subțire (0.6) și punct mai mic (1.2mm)
    if (isCombinedMode && patientDataOs && patientDataOs.length > 0) {
      const sortedOs = [...patientDataOs].sort((a, b) => a.age - b.age);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.6);
      for (let i = 0; i < sortedOs.length - 1; i++) {
        doc.line(
          getX(sortedOs[i].age),
          getY(sortedOs[i].axialLength),
          getX(sortedOs[i + 1].age),
          getY(sortedOs[i + 1].axialLength),
        );
      }
      sortedOs.forEach((p) => {
        doc.setFillColor(16, 185, 129);
        // Punct mai mic pentru OS (1.2mm)
        doc.circle(getX(p.age), getY(p.axialLength), 1.2, "F");
      });

      // Legendă pe grafic pentru identificare la print alb-negru
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("--- OD (Punct & Linie Groasa)", startX + padding + 4, startY + padding + 6);
      doc.setTextColor(16, 185, 129);
      doc.text("- - OS (Punct & Linie Subtire)", startX + padding + 4, startY + padding + 10);
      doc.setTextColor(0);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      cleanStrForMyopia(
        "Analiză risc miopie. Grafice de creștere a lungimii axiale (Tideman et al.)",
      ),
      startX + width / 2,
      startY + height - 5,
      { align: "center" },
    );
  };

export const generateMyopiaChartPdf = ({
  currentMedicalRecord,
  myopiaChartEye,
  getActiveDate = (d?: any) => new Date(),
}: MyopiaChartPdfOptions) => {
    if (!currentMedicalRecord) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a5",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      cleanStrForMyopia(`Management Miopie - ${currentMedicalRecord.patientName}`),
      pageWidth / 2,
      15,
      { align: "center" },
    );
    doc.setFontSize(10);
    const displayAge = currentMedicalRecord.patientBirthDate
      ? calculateDetailedAge(currentMedicalRecord.patientBirthDate)
      : `${currentMedicalRecord.patientAge} ani`;
    doc.text(
      cleanStrForMyopia(
        `Sex: ${currentMedicalRecord.patientSex === "M" ? "Masculin" : "Feminin"} | Vârstă: ${displayAge}`,
      ),
      pageWidth / 2,
      22,
      { align: "center" },
    );
    doc.text(
      cleanStrForMyopia(
        `Ochi: ${myopiaChartEye} | Data: ${format(getActiveDate(), "dd.MM.yyyy")}`,
      ),
      pageWidth / 2,
      27,
      { align: "center" },
    );

    const eye = myopiaChartEye;
    const history = currentMedicalRecord.prescriptionHistory || [];
    const patientData = history
      .filter((item) => item.axialLength?.[eye.toLowerCase() as "od" | "os"])
      .map((item) => ({
        age: currentMedicalRecord.patientBirthDate
          ? calculateAge(
              currentMedicalRecord.patientBirthDate,
              new Date(item.date),
            )
          : currentMedicalRecord.patientAge,
        axialLength: parseFloat(
          item.axialLength?.[eye.toLowerCase() as "od" | "os"] || "0",
        ),
      }))
      .filter((item) => item.axialLength > 0);

    const currentAL =
      currentMedicalRecord.axialLength?.[eye.toLowerCase() as "od" | "os"];
    if (currentAL) {
      const currentAge = currentMedicalRecord.patientBirthDate
        ? calculateAge(currentMedicalRecord.patientBirthDate)
        : currentMedicalRecord.patientAge;
      const currentVal = parseFloat(currentAL);
      if (currentVal > 0 && !patientData.some((d) => d.age === currentAge)) {
        patientData.push({ age: currentAge || 0, axialLength: currentVal });
      }
    }

    drawMyopiaGraph(
      doc,
      10,
      35,
      pageWidth - 20,
      pageHeight - 50,
      currentMedicalRecord.patientSex || "F",
      patientData,
    );

    const riskLabels =
      currentMedicalRecord.patientSex === "M" ? BOYS_RISK : GIRLS_RISK;
    const chartD =
      currentMedicalRecord.patientSex === "M"
        ? MYOPIA_BOYS_DATA
        : MYOPIA_GIRLS_DATA;
    const sortedData = [...patientData].sort((a, b) => a.age - b.age);
    if (sortedData.length > 0) {
      const lastM = sortedData[sortedData.length - 1];
      const agePoint = chartD.reduce((prev, curr) =>
        Math.abs(curr.age - lastM.age) < Math.abs(prev.age - lastM.age)
          ? curr
          : prev,
      );
      const percentiles = [98, 95, 90, 75, 50, 25, 10, 5, 2];
      let closestP = 2;
      for (const p of percentiles) {
        if (lastM.axialLength >= (agePoint as any)[`p${p}`]) {
          closestP = p;
          break;
        }
      }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        cleanStrForMyopia(`Analiză Risc (Percentila ${closestP})`),
        15,
        pageHeight - 12,
      );
      doc.setFont("helvetica", "normal");
      doc.text(cleanStrForMyopia(riskLabels[`p${closestP}`]), 15, pageHeight - 7);
    }

    doc.save(
      `Miopie_${currentMedicalRecord.patientName.replace(/\s+/g, "_")}_${myopiaChartEye}.pdf`,
    );
  };

export const getComprehensivePatientAxialData = (
    eye: "OD" | "OS",
    recordToUse?: any | null,
    medicalRecords?: any[],
    medicalDocuments?: any[]
  ) => {
    const record = recordToUse;
    if (!record) return [];

    const eyeLower = eye.toLowerCase() as "od" | "os";
    const eyeUpper = eye.toUpperCase();
    const patientClean = (record.patientName || "").toLowerCase().trim();
    const birthDateStr = record.patientBirthDate;
    const fallbackAge = typeof record.patientAge === "number" ? record.patientAge : parseFloat(record.patientAge || "0");

    const parseVal = (v: any): number => {
      if (typeof v === "number") return isNaN(v) ? 0 : v;
      if (!v || typeof v !== "string") return 0;
      const cleaned = v.replace(/,/g, ".").replace(/[^0-9.]/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseDateSafe = (dStr: any): Date | null => {
      if (!dStr) return null;
      if (dStr instanceof Date) return isNaN(dStr.getTime()) ? null : dStr;
      if (typeof dStr === "string") {
        let d = new Date(dStr);
        if (!isNaN(d.getTime())) return d;
        const parts = dStr.trim().split(/[./-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            if (!isNaN(d.getTime())) return d;
          } else {
            d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            if (!isNaN(d.getTime())) return d;
          }
        }
      }
      return null;
    };

    const getDecimalAge = (measDate: Date | null): number => {
      if (birthDateStr && measDate) {
        const bDate = parseDateSafe(birthDateStr);
        if (bDate && !isNaN(bDate.getTime()) && !isNaN(measDate.getTime())) {
          const diffMs = measDate.getTime() - bDate.getTime();
          const yrs = diffMs / (365.2425 * 24 * 3600 * 1000);
          if (yrs >= 0 && yrs <= 120) return Math.round(yrs * 100) / 100;
        }
      }
      return fallbackAge || 0;
    };

    const results: {
      date: string;
      age: number;
      axialLength: number;
      isFromHistory: boolean;
      isFromAxialHistory?: boolean;
      historyItem: any;
      historyIndex?: number;
      eye: "OD" | "OS";
      sourceRecordId?: string;
    }[] = [];

    // 1. Current record dedicated axialLengthHistory
    (record.axialLengthHistory || []).forEach((item, idx) => {
      const val = parseVal(item[eyeLower]);
      if (val > 0) {
        const dObj = parseDateSafe(item.date) || new Date();
        results.push({
          date: item.date || dObj.toISOString(),
          age: getDecimalAge(dObj),
          axialLength: val,
          isFromHistory: true,
          isFromAxialHistory: true,
          historyItem: item,
          historyIndex: idx,
          eye,
          sourceRecordId: record.id,
        });
      }
    });

    // 2. Current record prescriptionHistory (legacy consults)
    (record.prescriptionHistory || []).forEach((item, idx) => {
      const val = parseVal(
        item.axialLength?.[eyeLower] ??
        item.axialLength?.[eyeUpper as any] ??
        (item as any)[`axialLength${eyeUpper}`] ??
        (item as any)[`axial_length_${eyeLower}`] ??
        (item as any)[eyeLower]?.axialLength
      );
      if (val > 0) {
        const dObj = parseDateSafe(item.date) || new Date();
        results.push({
          date: item.date || dObj.toISOString(),
          age: getDecimalAge(dObj),
          axialLength: val,
          isFromHistory: true,
          isFromAxialHistory: false,
          historyItem: item,
          historyIndex: idx,
          eye,
          sourceRecordId: record.id,
        });
      }
    });

    // 3. Active record current axial length
    const activeVal = parseVal(
      record.axialLength?.[eyeLower] ??
      record.axialLength?.[eyeUpper as any] ??
      (record as any)[`axialLength${eyeUpper}`]
    );
    if (activeVal > 0) {
      const activeDateObj = parseDateSafe(record.updatedAt) || new Date();
      results.push({
        date: record.updatedAt || activeDateObj.toISOString(),
        age: getDecimalAge(activeDateObj),
        axialLength: activeVal,
        isFromHistory: false,
        isFromAxialHistory: false,
        historyItem: null,
        eye,
        sourceRecordId: record.id,
      });
    }

    // 4. Other medical records for the same patient
    if (medicalRecords && patientClean) {
      medicalRecords.forEach((otherRec) => {
        if (otherRec.id !== record.id && (otherRec.patientName || "").toLowerCase().trim() === patientClean) {
          (otherRec.axialLengthHistory || []).forEach((item, idx) => {
            const val = parseVal(item[eyeLower]);
            if (val > 0) {
              const dObj = parseDateSafe(item.date) || new Date();
              results.push({
                date: item.date || dObj.toISOString(),
                age: getDecimalAge(dObj),
                axialLength: val,
                isFromHistory: true,
                isFromAxialHistory: true,
                historyItem: item,
                historyIndex: idx,
                eye,
                sourceRecordId: otherRec.id,
              });
            }
          });
          (otherRec.prescriptionHistory || []).forEach((item, idx) => {
            const val = parseVal(
              item.axialLength?.[eyeLower] ??
              item.axialLength?.[eyeUpper as any] ??
              (item as any)[`axialLength${eyeUpper}`]
            );
            if (val > 0) {
              const dObj = parseDateSafe(item.date) || new Date();
              results.push({
                date: item.date || dObj.toISOString(),
                age: getDecimalAge(dObj),
                axialLength: val,
                isFromHistory: true,
                isFromAxialHistory: false,
                historyItem: item,
                historyIndex: idx,
                eye,
                sourceRecordId: otherRec.id,
              });
            }
          });
          const otherActive = parseVal(otherRec.axialLength?.[eyeLower]);
          if (otherActive > 0) {
            const dObj = parseDateSafe(otherRec.updatedAt) || new Date();
            results.push({
              date: otherRec.updatedAt || dObj.toISOString(),
              age: getDecimalAge(dObj),
              axialLength: otherActive,
              isFromHistory: true,
              isFromAxialHistory: false,
              historyItem: null,
              eye,
              sourceRecordId: otherRec.id,
            });
          }
        }
      });
    }

    // 4. Check medical documents if any
    if (medicalDocuments && patientClean) {
      medicalDocuments.forEach((doc: any) => {
        const docPatient = (doc.patientName || "").toLowerCase().trim();
        if (docPatient === patientClean) {
          const val = parseVal(
            doc.formValues?.[`axialLength${eyeUpper}`] ??
            doc.formValues?.axialLength?.[eyeLower] ??
            doc.axialLength?.[eyeLower] ??
            doc[`axialLength${eyeUpper}`]
          );
          if (val > 0) {
            const dObj = parseDateSafe(doc.date || doc.createdAt) || new Date();
            results.push({
              date: doc.date || doc.createdAt || dObj.toISOString(),
              age: getDecimalAge(dObj),
              axialLength: val,
              isFromHistory: true,
              historyItem: doc,
              eye,
            });
          }
        }
      });
    }

    // Deduplicate by (eye, day_date, axialLength)
    const uniqueList: typeof results = [];
    results.forEach((item) => {
      const itemDate = parseDateSafe(item.date);
      const itemDayStr = itemDate ? `${itemDate.getFullYear()}-${itemDate.getMonth() + 1}-${itemDate.getDate()}` : item.date;
      const isDup = uniqueList.some((existing) => {
        const exDate = parseDateSafe(existing.date);
        const exDayStr = exDate ? `${exDate.getFullYear()}-${exDate.getMonth() + 1}-${exDate.getDate()}` : existing.date;
        return exDayStr === itemDayStr && Math.abs(existing.axialLength - item.axialLength) < 0.05;
      });
      if (!isDup) {
        uniqueList.push(item);
      }
    });

    return uniqueList.sort((a, b) => {
      const timeA = parseDateSafe(a.date)?.getTime() || 0;
      const timeB = parseDateSafe(b.date)?.getTime() || 0;
      return timeA - timeB;
    });
  };

export const generateBothMyopiaChartsA4Pdf = ({
  record,
  isMyopiaCombinedView,
  medicalRecords,
  medicalDocuments,
  getActiveDate = (d?: any) => new Date(),
}: BothMyopiaChartsA4Options) => {
    if (!record) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      cleanStrForMyopia(`Management Miopie (Ambii Ochi) - ${record.patientName}`),
      pageWidth / 2,
      15,
      { align: "center" },
    );
    doc.setFontSize(10);
    const displayAge = record.patientBirthDate
      ? calculateDetailedAge(record.patientBirthDate)
      : `${record.patientAge} ani`;
    doc.text(
      cleanStrForMyopia(
        `Sex: ${record.patientSex === "M" ? "Masculin" : "Feminin"} | Vârstă: ${displayAge} | Data: ${format(getActiveDate(record), "dd.MM.yyyy")}`,
      ),
      pageWidth / 2,
      22,
      { align: "center" },
    );

    const odData = getComprehensivePatientAxialData("OD", record, medicalRecords, medicalDocuments);
    const osData = getComprehensivePatientAxialData("OS", record, medicalRecords, medicalDocuments);

    if (isMyopiaCombinedView) {
      // Mod Grafic Combinat A4 (un singur grafic mare cu OD și OS suprapuse)
      const singleChartWidth = pageWidth - 20;
      const singleChartHeight = pageHeight - 65;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(cleanStrForMyopia("Grafic Comparativ Suprapus (OD & OS)"), pageWidth / 2, 31, { align: "center" });

      drawMyopiaGraph(
        doc,
        10,
        34,
        singleChartWidth,
        singleChartHeight,
        record.patientSex || "F",
        odData,
        osData,
        true,
      );
    } else {
      // Mod Două Grafice Separate A4
      const chartWidth = (pageWidth - 30) / 2; // ~133.5 mm wide for each eye's chart
      const chartHeight = pageHeight - 65; // ~145 mm tall

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(cleanStrForMyopia("Ochi Drept (OD)"), 15 + chartWidth / 2, 31, { align: "center" });

      drawMyopiaGraph(
        doc,
        10,
        34,
        chartWidth,
        chartHeight,
        record.patientSex || "F",
        odData,
      );

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(cleanStrForMyopia("Ochi Stang (OS)"), 20 + chartWidth + chartWidth / 2, 31, { align: "center" });

      drawMyopiaGraph(
        doc,
        20 + chartWidth,
        34,
        chartWidth,
        chartHeight,
        record.patientSex || "F",
        osData,
      );
    }

    const riskLabels = record.patientSex === "M" ? BOYS_RISK : GIRLS_RISK;
    const chartD = record.patientSex === "M" ? MYOPIA_BOYS_DATA : MYOPIA_GIRLS_DATA;

    let odPercentileStr = "";
    const sortedOd = [...odData].sort((a, b) => a.age - b.age);
    if (sortedOd.length > 0) {
      const lastVal = sortedOd[sortedOd.length - 1];
      const agePoint = chartD.reduce((prev, curr) =>
        Math.abs(curr.age - lastVal.age) < Math.abs(prev.age - lastVal.age) ? curr : prev,
      );
      const percentilesList = [98, 95, 90, 75, 50, 25, 10, 5, 2];
      let closestP = 2;
      for (const p of percentilesList) {
        if (lastVal.axialLength >= (agePoint as any)[`p${p}`]) {
          closestP = p;
          break;
        }
      }
      odPercentileStr = `OD: Percentila ${closestP} (${riskLabels[`p${closestP}`]})`;
    }

    let osPercentileStr = "";
    const sortedOs = [...osData].sort((a, b) => a.age - b.age);
    if (sortedOs.length > 0) {
      const lastVal = sortedOs[sortedOs.length - 1];
      const agePoint = chartD.reduce((prev, curr) =>
        Math.abs(curr.age - lastVal.age) < Math.abs(prev.age - lastVal.age) ? curr : prev,
      );
      const percentilesList = [98, 95, 90, 75, 50, 25, 10, 5, 2];
      let closestP = 2;
      for (const p of percentilesList) {
        if (lastVal.axialLength >= (agePoint as any)[`p${p}`]) {
          closestP = p;
          break;
        }
      }
      osPercentileStr = `OS: Percentila ${closestP} (${riskLabels[`p${closestP}`]})`;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(cleanStrForMyopia("Analiză Risc de Progresie:"), 15, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    if (odPercentileStr) {
      doc.text(cleanStrForMyopia(odPercentileStr), 15, pageHeight - 7);
    } else {
      doc.text(cleanStrForMyopia("OD: Nicio informatie disponibila."), 15, pageHeight - 7);
    }

    const secondColumnX = isMyopiaCombinedView ? pageWidth / 2 + 5 : 20 + ((pageWidth - 30) / 2);
    if (osPercentileStr) {
      doc.text(cleanStrForMyopia(osPercentileStr), secondColumnX, pageHeight - 7);
    } else {
      doc.text(cleanStrForMyopia("OS: Nicio informatie disponibila."), secondColumnX, pageHeight - 7);
    }

    doc.save(
      `Miopie_${record.patientName.replace(/\s+/g, "_")}_Amandoi_Ochii.pdf`,
    );
  };

