import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import {
  cleanStr,
  cleanStrExceptTAndS,
  normalizeForPDF,
  drawPdfTextWithDiacritics,
} from "../lib/stringUtils";
import {
  MYOPIA_BOYS_DATA,
  MYOPIA_GIRLS_DATA,
  BOYS_RISK,
  GIRLS_RISK,
  getSexFromCNP,
  calculateDetailedAge,
  type MedicalRecord,
} from "../appConstants";
import { cleanStrForMyopia, drawMyopiaGraph } from "./myopiaPdfService";

export interface MedicalDocPrintOptions {
  triggerPdfPrint: (doc: jsPDF, filename?: string) => void;
  getComprehensivePatientAxialData?: (eye: "OD" | "OS", rec: any) => any[];
  isMyopiaCombinedView?: boolean;
}

export const generateAdeverintaMedicalaPdf = (
  documentForm: any,
  currentMedicalRecord: any = {},
  options?: MedicalDocPrintOptions
) => {
  const triggerPdfPrint = options?.triggerPdfPrint || ((doc: any, name?: string) => doc.save(name));
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a5",
      });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.setFontSize(7);
    doc.text(
      `S.C. Optinoe Oftalmo Negreanu S.R.L. Cui 39902033 J3/1880/2018`,
      10,
      6,
    );
    doc.text(`Judetul unitatii: Arges`, 10, 10);
    doc.text(
      `Localitate unitate: Pitesti, Str. Calea Bucuresti, bl.30, sc. A, ap.2`,
      10,
      14,
    );

    doc.setFontSize(8);
    doc.text(`Nr. fisa / registru de consultatii`, pageWidth - 70, 7);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${cleanStr(documentForm.documentNumber || "")}`,
      pageWidth - 70,
      11,
    );
    doc.setFont("helvetica", "normal");
    doc.text(
      `................................................................`,
      pageWidth - 70,
      13,
    );

    doc.setFontSize(9);
    doc.text(`CNP`, pageWidth - 100, 18);
    const cnpStr = documentForm.patientCnp || "";
    const boxSize = 5;
    const startX = pageWidth - 90;
    const startY = 13.5;
    for (let i = 0; i < 13; i++) {
      doc.rect(startX + i * boxSize, startY, boxSize, boxSize);
      if (cnpStr[i]) {
        doc.setFont("helvetica", "bold");
        doc.text(cnpStr[i], startX + i * boxSize + 1.5, startY + 4);
        doc.setFont("helvetica", "normal");
      }
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "ADEVERINȚĂ MEDICALĂ", pageWidth / 2, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let y = 42;
    const lineSpacing = 8;

    drawPdfTextWithDiacritics(doc, "Se adeverește că:", 10, y);
    doc.line(40, y + 1.5, 150, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientName || "", 42, y, { maxWidth: 106 });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, `Sexul: ${documentForm.patientSex || "M / F"}`, pageWidth - 40, y);
    doc.setFontSize(7);
    drawPdfTextWithDiacritics(doc, "numele și prenumele", 65, y + 4);
    doc.setFontSize(10);

    y += lineSpacing + 4;
    drawPdfTextWithDiacritics(doc, "cu domiciliul în: județul", 10, y);
    doc.line(46, y + 1.5, 78, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientJudet || "", 48, y, { maxWidth: 29 });
    doc.setFont("helvetica", "normal");

    drawPdfTextWithDiacritics(doc, "localitatea", 80, y);
    doc.line(100, y + 1.5, 140, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientLocalitate || "", 100, y, { maxWidth: 39 });
    doc.setFont("helvetica", "normal");

    drawPdfTextWithDiacritics(doc, "str.", 142, y);
    doc.line(148, y + 1.5, pageWidth - 10, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientStrada || "", 148, y, { maxWidth: pageWidth - 10 - 150 });
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "nr.", 10, y);
    doc.line(16, y + 1.5, 30, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientStreetNumber || "", 17, y, { maxWidth: 13 });
    doc.setFont("helvetica", "normal");

    drawPdfTextWithDiacritics(doc, "bl.", 32, y);
    doc.line(37, y + 1.5, 50, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientBloc || "", 38, y, { maxWidth: 12 });
    doc.setFont("helvetica", "normal");

    drawPdfTextWithDiacritics(doc, "ap.", 52, y);
    doc.line(57, y + 1.5, 70, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientApartament || "", 58, y, { maxWidth: 12 });
    doc.setFont("helvetica", "normal");

    drawPdfTextWithDiacritics(doc, "sect. ....; având ocupația de:", 72, y);
    doc.line(125, y + 1.5, pageWidth - 10, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.occupation || "", 125, y, { maxWidth: pageWidth - 10 - 126 });
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "la", 10, y);
    doc.line(14, y + 1.5, pageWidth - 10, y + 1.5);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.institution || "", 15, y, { maxWidth: pageWidth - 10 - 16 });
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Este suferind de:", 10, y);
    doc.line(38, y + 1.5, pageWidth - 10, y + 1.5);
    const diagnostic = documentForm.diagnostic || "";
    const splitDiag = doc.splitTextToSize(cleanStrExceptTAndS(diagnostic), pageWidth - 60).slice(0, 2);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, splitDiag[0] || "", 40, y, { maxWidth: pageWidth - 10 - 41 });
    doc.setFont("helvetica", "normal");

    for (let i = 1; i < splitDiag.length; i++) {
      y += lineSpacing;
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(doc, splitDiag[i], 10, y, { maxWidth: pageWidth - 20 });
      doc.setFont("helvetica", "normal");
      doc.line(10, y + 1.5, pageWidth - 10, y + 1.5);
    }

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Se recomandă:", 10, y);
    const treatmentRecs = (documentForm.treatment || "")
      .split("\n")
      .filter(
        (l: string) => l.trim() && !l.includes("Medicamentele se utilizeaza"),
      )
      .join(", ");
    const scutire = documentForm.scutire || "";
    const recomandari = scutire
      ? treatmentRecs
        ? `${scutire}, ${treatmentRecs}`
        : scutire
      : treatmentRecs;

    const splitRec = doc.splitTextToSize(cleanStrExceptTAndS(recomandari), pageWidth - 45).slice(0, 2);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, splitRec[0] || "", 40, y, { maxWidth: pageWidth - 10 - 41 });
    doc.setFont("helvetica", "normal");
    doc.line(38, y + 1.5, pageWidth - 10, y + 1.5);

    if (splitRec.length > 1) {
      y += lineSpacing;
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(doc, splitRec[1], 10, y, { maxWidth: pageWidth - 20 });
      doc.setFont("helvetica", "normal");
      doc.line(10, y + 1.5, pageWidth - 10, y + 1.5);
    }

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "S-a eliberat prezenta spre a-i servi la:", 10, y);
    y += lineSpacing;
    const servila = documentForm.servesTo;
    if (servila) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(doc, servila, 10, y, { maxWidth: pageWidth - 20 });
      doc.setFont("helvetica", "normal");
    }
    doc.line(10, y + 1.5, pageWidth - 10, y + 1.5);

    y += lineSpacing * 2 - 10;
    drawPdfTextWithDiacritics(doc, "Data eliberării:", 10, y);
    drawPdfTextWithDiacritics(
      doc,
      `anul ${documentForm.eliberatAn || new Date().getFullYear()} luna ${documentForm.eliberatLuna || "Ianuarie"} ziua ${documentForm.eliberatZi || new Date().getDate()}`,
      10,
      y + 6,
    );

    doc.text(`L. S.`, pageWidth / 2 - 10, y + 6);

    drawPdfTextWithDiacritics(doc, "Semnătura și parafa medicului,", pageWidth - 70, y);
    const doctorName = documentForm.doctorName || "";
    if (doctorName) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(doc, doctorName, pageWidth - 70, y + 6, { maxWidth: 60 });
      doc.setFont("helvetica", "normal");
    } else {
      doc.text(
        `.......................................................`,
        pageWidth - 70,
        y + 6,
      );
    }

    triggerPdfPrint(
      doc,
      `Adeverinta_${cleanStr(documentForm.patientName).replace(/\s+/g, "_")}.pdf`,
    );
};

export const generateReferatPdf = (
  documentForm: any,
  currentMedicalRecord: any = {},
  options?: MedicalDocPrintOptions
) => {
  const triggerPdfPrint = options?.triggerPdfPrint || ((doc: any, name?: string) => doc.save(name));
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `S.C. Optinoe Oftalmo Negreanu S.R.L. Cui 39902033 J3/1880/2018`,
      14,
      15,
    );
    doc.text(`Judetul unitatii: Arges`, 14, 20);
    doc.text(
      `Localitate unitate: Pitesti, Str. Calea Bucuresti, bl.30, sc. A, ap.2`,
      14,
      25,
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `NR. ${documentForm.documentNumber || "..................................../......................"}`,
      pageWidth - 80,
      15,
    );
    doc.setFont("helvetica", "normal");
    doc.text(
      `................................................................................................................................................................`,
      14,
      32,
    );
    doc.text(
      `................................................................................................................................................................`,
      14,
      49,
    );

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "REFERAT MEDICAL", pageWidth / 2, 55, {
      align: "center",
    });
    doc.line(pageWidth / 2 - 35, 57, pageWidth / 2 + 35, 57);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    let y = 85;
    const lineSpacing = 8;

    const drawDottedLine = (startX: number, endX: number, yPos: number) => {
      const dots = ".".repeat(Math.floor((endX - startX) / 1.5));
      doc.text(dots, startX, yPos);
    };

    const checkY = (increment: number) => {
      if (y + increment > pageHeight - 45) {
        doc.addPage();
        y = 25;
      }
    };

    drawPdfTextWithDiacritics(doc, "Privind situația pacientului", 14, y);
    drawDottedLine(60, pageWidth - 30, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      documentForm.patientName || "",
      (60 + pageWidth - 30) / 2,
      y - 1,
      { align: "center", maxWidth: pageWidth - 30 - 64 },
    );
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "posesor al", pageWidth - 28, y);

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "B.I./C.I.:", 14, y);
    drawDottedLine(32, 60, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientSeries || "", 46, y - 1, {
      align: "center",
      maxWidth: 26,
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "/", 62, y);
    drawDottedLine(65, 100, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientNumber || "", 82.5, y - 1, {
      align: "center",
      maxWidth: 33,
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "CNP", 102, y);
    drawDottedLine(112, pageWidth - 45, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientCnp || "", (112 + pageWidth - 45) / 2, y - 1, {
      align: "center",
      maxWidth: pageWidth - 45 - 114,
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, ", cu domiciliul în", pageWidth - 43, y);

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "localitatea", 14, y);
    drawDottedLine(35, 100, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientLocalitate || "", 67.5, y - 1, {
      align: "center",
      maxWidth: 63,
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "județul", 102, y);
    drawDottedLine(118, pageWidth - 14, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      documentForm.patientJudet || "",
      (118 + pageWidth - 14) / 2,
      y - 1,
      { align: "center", maxWidth: pageWidth - 14 - 120 },
    );

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "str./sat", 14, y);
    drawDottedLine(30, 90, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientStrada || "", 60, y - 1, {
      align: "center",
      maxWidth: 58,
    });
    doc.setFont("helvetica", "normal");
    doc.text(`bl`, 92, y);
    drawDottedLine(97, 115, y);
    doc.setFont("helvetica", "bold");
    doc.text(documentForm.patientBloc || "", 106, y - 1, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.text(`sc`, 117, y);
    drawDottedLine(122, 140, y);
    doc.setFont("helvetica", "bold");
    doc.text(documentForm.patientScara || "", 131, y - 1, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.text(`ap`, 142, y);
    drawDottedLine(147, 165, y);
    doc.setFont("helvetica", "bold");
    doc.text(documentForm.patientApartament || "", 156, y - 1, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, ".......Fișa de dispensarizare", 14, y);
    drawDottedLine(65, 110, y);
    drawPdfTextWithDiacritics(doc, "data întocmirii", 112, y);
    drawDottedLine(140, pageWidth - 14, y);
    doc.setFont("helvetica", "bold");
    const dAn = documentForm.eliberatAn || new Date().getFullYear().toString();
    const dLunaNumeric =
      (
        [
          "Ianuarie",
          "Februarie",
          "Martie",
          "Aprilie",
          "Mai",
          "Iunie",
          "Iulie",
          "August",
          "Septembrie",
          "Octombrie",
          "Noiembrie",
          "Decembrie",
        ].indexOf(documentForm.eliberatLuna) + 1
      )
        .toString()
        .padStart(2, "0") || "01";
    const dZi = String(
      documentForm.eliberatZi || new Date().getDate(),
    ).padStart(2, "0");
    doc.text(
      `${dZi}.${dLunaNumeric}.${dAn}`,
      (140 + pageWidth - 14) / 2,
      y - 1,
      { align: "center" },
    );
    doc.setFont("helvetica", "normal");

    y += 12;
    checkY(20);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Antecedente privind afecțiunea", 14, y);
    doc.line(14, y + 1, 70, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const history = cleanStr(documentForm.history) || "";
    const splitHistory = doc.splitTextToSize(history, pageWidth - 28);
    checkY(splitHistory.length * 5);
    doc.text(splitHistory, 14, y);
    y += Math.max(splitHistory.length * 5, 8);

    checkY(20);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Debutul și evoluția bolii", 14, y);
    doc.line(14, y + 1, 58, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const onsetVal = cleanStr(documentForm.onsetAndEvolution || "");
    if (onsetVal) {
      const splitOnset = doc.splitTextToSize(onsetVal, pageWidth - 28);
      checkY(splitOnset.length * 5);
      doc.text(splitOnset, 14, y);
      y += Math.max(splitOnset.length * 5, 8);
    } else {
      checkY(lineSpacing * 5);
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
    }

    checkY(20);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Ultimele internări în spital", 14, y);
    doc.line(14, y + 1, 62, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const hospVal = cleanStr(documentForm.recentHospitalizations || "");
    if (hospVal) {
      const splitHosp = doc.splitTextToSize(hospVal, pageWidth - 28);
      checkY(splitHosp.length * 5);
      doc.text(splitHosp, 14, y);
      y += Math.max(splitHosp.length * 5, 8);
    } else {
      checkY(lineSpacing * 3);
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
    }

    checkY(20);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Diagnostic clinic", 14, y);
    doc.line(14, y + 1, 45, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const diagText = cleanStr(documentForm.diagnostic) || "";
    const splitDiag = doc.splitTextToSize(diagText, pageWidth - 28);
    checkY(splitDiag.length * 5);
    doc.text(splitDiag, 14, y);
    y += Math.max(splitDiag.length * 5, 10);

    checkY(25);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Diagnostic vizual", 14, y);
    doc.line(14, y + 1, 44, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");

    const od_desc = `OD: SPH [ ${currentMedicalRecord.od.sph || "---"} ] CYL [ ${currentMedicalRecord.od.cyl || "---"} ] AXIS [ ${currentMedicalRecord.od.axis || "---"} ] ADD [ ${currentMedicalRecord.od.add || "---"} ] | AV f.c. [ ${currentMedicalRecord.od.va_without || "---"} ] AV c.c. [ ${documentForm.vaWithOd || "---"} ]`;
    const os_desc = `OS: SPH [ ${currentMedicalRecord.os.sph || "---"} ] CYL [ ${currentMedicalRecord.os.cyl || "---"} ] AXIS [ ${currentMedicalRecord.os.axis || "---"} ] ADD [ ${currentMedicalRecord.os.add || "---"} ] | AV f.c. [ ${currentMedicalRecord.os.va_without || "---"} ] AV c.c. [ ${documentForm.vaWithOs || "---"} ]`;

    const od_lines = doc.splitTextToSize(cleanStr(od_desc), pageWidth - 28);
    const os_lines = doc.splitTextToSize(cleanStr(os_desc), pageWidth - 28);

    checkY((od_lines.length + os_lines.length) * 5 + 5);
    doc.text(od_lines, 14, y);
    y += od_lines.length * 5;
    doc.text(os_lines, 14, y);
    y += os_lines.length * 5 + 4;

    checkY(20);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Tratament clinic (simptomatic, curativ)", 14, y);
    doc.line(14, y + 1, 85, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const treatment = cleanStr(documentForm.clinicalTreatment) || "";
    if (treatment) {
      const splitTreatment = doc.splitTextToSize(treatment, pageWidth - 28);
      checkY(splitTreatment.length * 5);
      doc.text(splitTreatment, 14, y);
      y += Math.max(splitTreatment.length * 5, 10);
    } else {
      checkY(lineSpacing * 2);
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
    }

    checkY(20);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Dependent sau parțial dependent de altă persoană", 14, y);
    doc.line(14, y + 1, 105, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const depVal = cleanStr(documentForm.dependencyStatus || "");
    if (depVal) {
      const splitDep = doc.splitTextToSize(depVal, pageWidth - 28);
      checkY(splitDep.length * 5);
      doc.text(splitDep, 14, y);
      y += Math.max(splitDep.length * 5, 10);
    } else {
      checkY(lineSpacing * 2);
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
    }

    checkY(25);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      "Deplasabilă (singur, cu ajutor uni/bilateral. Fotoliu rulant, baston, cadru etc.) sau nedeplasabilă",
      14,
      y,
    );
    doc.line(14, y + 1, 185, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const mobVal = cleanStr(documentForm.mobilityStatus || "");
    if (mobVal) {
      const splitMob = doc.splitTextToSize(mobVal, pageWidth - 28);
      checkY(splitMob.length * 5);
      doc.text(splitMob, 14, y);
      y += Math.max(splitMob.length * 5, 10);
    } else {
      checkY(lineSpacing * 2);
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
    }

    checkY(20);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Plan de recuperare", 14, y);
    doc.line(14, y + 1, 48, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const recVal = cleanStr(documentForm.recoveryPlan || "");
    if (recVal) {
      const splitRec = doc.splitTextToSize(recVal, pageWidth - 28);
      checkY(splitRec.length * 5);
      doc.text(splitRec, 14, y);
      y += Math.max(splitRec.length * 5, 10);
    } else {
      checkY(lineSpacing * 2);
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
    }

    checkY(20);
    y += 10;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "Prognostic recuperator", 14, y);
    doc.line(14, y + 1, 55, y + 1);
    y += lineSpacing;
    doc.setFont("helvetica", "normal");
    const progVal = cleanStr(documentForm.recoveryPrognosis || "");
    if (progVal) {
      const splitProg = doc.splitTextToSize(progVal, pageWidth - 28);
      checkY(splitProg.length * 5);
      doc.text(splitProg, 14, y);
      y += Math.max(splitProg.length * 5, 10);
    } else {
      checkY(lineSpacing * 2);
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
      doc.text(
        "................................................................................................................................................................",
        14,
        y,
      );
      y += lineSpacing;
    }

    checkY(35);
    y += 10;
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "S-a eliberat spre a-i servi la", 14, y);
    y += lineSpacing;
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      cleanStr(
        documentForm.servesTo ||
          "Serviciul de Evaluare Complexa a Persoanelor Adulte cu Handicap - D.G.A.S.P.C.-Arges",
      ),
      14,
      y,
      { maxWidth: pageWidth - 28 },
    );

    y += 15;
    drawPdfTextWithDiacritics(doc, "Semnătura și parafa medicului specialist", 14, y);
    y += lineSpacing;
    doc.text(
      "........................................................................",
      14,
      y,
    );
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, cleanStr(documentForm.doctorName || ""), 49, y - 1, {
      align: "center",
      maxWidth: 60,
    });
    doc.setFont("helvetica", "normal");

    doc.setFontSize(8);
    doc.text("pag 2/2", pageWidth / 2, pageHeight - 10, { align: "center" });

    triggerPdfPrint(
      doc,
      `Referat_Medical_${cleanStr(documentForm.patientName).replace(/\s+/g, "_")}.pdf`,
    );
};

export const generateRaportMedicalPdf = (
  documentForm: any,
  currentMedicalRecord: any = {},
  options?: MedicalDocPrintOptions
) => {
  const triggerPdfPrint = options?.triggerPdfPrint || ((doc: any, name?: string) => doc.save(name));
  const getComprehensivePatientAxialData = options?.getComprehensivePatientAxialData || (() => []);
  const isMyopiaCombinedView = options?.isMyopiaCombinedView ?? false;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

    const drawDottedLine = (startX: number, endX: number, yPos: number) => {
      const dots = ".".repeat(Math.floor((endX - startX) / 1.5));
      doc.text(dots, startX, yPos);
    };

    const truncateToWidth = (text: string, maxWidth: number): string => {
      if (!text) return "";
      const lines = doc.splitTextToSize(text, maxWidth);
      if (lines.length > 1) {
        let candidate = lines[0];
        while (
          candidate.length > 0 &&
          doc.getTextWidth(candidate + "...") > maxWidth
        ) {
          candidate = candidate.slice(0, -1);
        }
        return candidate.trim() + "...";
      }
      return lines[0];
    };

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      `S.C. Optinoe Oftalmo Negreanu S.R.L. Cui 39902033 J3/1880/2018`,
      14,
      11,
    );
    doc.text(`Judetul unitatii: Arges`, 14, 15);
    doc.text(
      `Localitate unitate: Pitesti, Str. Calea Bucuresti, bl.30, sc. A, ap.2`,
      14,
      19,
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Nr. fisa / registru: ${documentForm.documentNumber || ""}`,
      pageWidth - 14,
      11,
      { align: "right" },
    );

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "RAPORT MEDICAL", pageWidth / 2, 32, { align: "center" });

    const activeTypesForRaport: string[] = [];
    if (documentForm.isConsultComplet) activeTypesForRaport.push("Consult Complet");
    if (documentForm.isControl) activeTypesForRaport.push("Revenire / Control");
    if (documentForm.isGratis) activeTypesForRaport.push("Gratis");

    if (activeTypesForRaport.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      let consultColor: [number, number, number] = [37, 99, 235]; // Blue 600
      if (documentForm.isConsultComplet && !documentForm.isControl && !documentForm.isGratis) {
        consultColor = [37, 99, 235];
      } else if (documentForm.isControl && !documentForm.isConsultComplet && !documentForm.isGratis) {
        consultColor = [217, 119, 6]; // Amber 600
      } else if (documentForm.isGratis && !documentForm.isConsultComplet && !documentForm.isControl) {
        consultColor = [22, 163, 74]; // Green 600
      }
      doc.setTextColor(consultColor[0], consultColor[1], consultColor[2]);
      const activeTypesText = activeTypesForRaport.join(" | ");
      doc.text(cleanStr(activeTypesText.toUpperCase()), pageWidth - 14, 32, { align: "right" });
      doc.setTextColor(0);
    }

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");

    let y = 44;
    const lineSpacing = 6.5;

    // Rând 1: Nume, Prenume, Vârstă, CNP
    drawPdfTextWithDiacritics(doc, "Nume:", 14, y);
    if (documentForm.lastName) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(doc, documentForm.lastName, 28, y, { maxWidth: 40 });
      doc.setFont("helvetica", "normal");
    }

    drawPdfTextWithDiacritics(doc, "Prenume:", 70, y);
    if (documentForm.firstName) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(doc, documentForm.firstName, 87, y, { maxWidth: 40 });
      doc.setFont("helvetica", "normal");
    }

    drawPdfTextWithDiacritics(doc, "Vârstă:", 130, y);
    if (documentForm.ageSimple) {
      doc.setFont("helvetica", "bold");
      doc.text(String(documentForm.ageSimple), 143, y);
      doc.setFont("helvetica", "normal");
    }

    doc.text(`CNP:`, 159, y);
    if (documentForm.patientCnp) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(cleanStr(documentForm.patientCnp), 169, y);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
    }

    // Rând 2: Simptome
    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Simptome:", 14, y);
    if (documentForm.symptoms && documentForm.symptoms.trim()) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(
        doc,
        documentForm.symptoms.trim(),
        35,
        y,
        { maxWidth: pageWidth - 14 - 36 }
      );
      doc.setFont("helvetica", "normal");
    }

    // Rând 3: Alte boli oculare
    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Alte boli oculare:", 14, y);
    if (documentForm.otherEyeDiseases && documentForm.otherEyeDiseases.trim()) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(
        doc,
        documentForm.otherEyeDiseases.trim(),
        45,
        y,
        { maxWidth: pageWidth - 14 - 46 }
      );
      doc.setFont("helvetica", "normal");
    }

    // Rând 4: Antecedente personale
    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Antecedente personale:", 14, y);
    if (documentForm.history && documentForm.history.trim()) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(
        doc,
        documentForm.history.trim(),
        58,
        y,
        { maxWidth: pageWidth - 14 - 59 }
      );
      doc.setFont("helvetica", "normal");
    }

    // Rând 5: Medicamente folosite
    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Medicamente folosite:", 14, y);
    if (documentForm.medications && documentForm.medications.trim()) {
      doc.setFont("helvetica", "bold");
      drawPdfTextWithDiacritics(
        doc,
        documentForm.medications.trim(),
        55,
        y,
        { maxWidth: pageWidth - 14 - 56 }
      );
      doc.setFont("helvetica", "normal");
    }

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    drawPdfTextWithDiacritics(doc, "EXAMEN OBIECTIV", pageWidth / 2, y, { align: "center" });

    const cl_od_desc =
      documentForm.clOdSph || documentForm.clOdCyl
        ? `SF: ${documentForm.clOdSph || "0"} / CYL: ${documentForm.clOdCyl || "0"} / AX: ${documentForm.clOdAxis || "0"} / BC: ${documentForm.clOdBase || "-"} / DIA: ${documentForm.clOdRadius || "-"} / ${documentForm.clOdBrand || ""}`
        : "-";
    const cl_os_desc =
      documentForm.clOsSph || documentForm.clOsCyl
        ? `SF: ${documentForm.clOsSph || "0"} / CYL: ${documentForm.clOsCyl || "0"} / AX: ${documentForm.clOsAxis || "0"} / BC: ${documentForm.clOsBase || "-"} / DIA: ${documentForm.clOsRadius || "-"} / ${documentForm.clOsBrand || ""}`
        : "-";

    const tableData = [
      {
        include: true,
        data: ["", "OD", "OS"]
      },
      {
        include: !!(documentForm.avFaraCorectieOd || documentForm.avFaraCorectieOs),
        data: [
          normalizeForPDF("AV FĂRĂ CORECȚIE"),
          documentForm.avFaraCorectieOd || "",
          documentForm.avFaraCorectieOs || "",
        ]
      },
      {
        include: !!(documentForm.vaWithOd || documentForm.vaWithOs),
        data: [
          normalizeForPDF("AV CU CORECȚIE"),
          documentForm.vaWithOd || "",
          documentForm.vaWithOs || "",
        ]
      },
      {
        include: !!(documentForm.iopOd || documentForm.iopOs),
        data: [
          "TENSIUNE OCULARA",
          documentForm.iopOd ? `${documentForm.iopOd} mmHg` : "",
          documentForm.iopOs ? `${documentForm.iopOs} mmHg` : "",
        ]
      },
      {
        include: !!(documentForm.pachymetryOd || documentForm.pachymetryOs),
        data: [
          "PAHIMETRIE",
          documentForm.pachymetryOd ? `${documentForm.pachymetryOd} µm` : "",
          documentForm.pachymetryOs ? `${documentForm.pachymetryOs} µm` : "",
        ]
      },
      {
        include: !!(documentForm.correctedIopOd || documentForm.correctedIopOs),
        data: [
          normalizeForPDF("TENSIUNE CORECTATĂ"),
          documentForm.correctedIopOd
            ? `${documentForm.correctedIopOd} mmHg`
            : "",
          documentForm.correctedIopOs
            ? `${documentForm.correctedIopOs} mmHg`
            : "",
        ]
      },
      {
        include: !!(documentForm.keratometryOd || documentForm.keratometryOs),
        data: [
          "KERATOMETRIE",
          documentForm.keratometryOd || "",
          documentForm.keratometryOs || "",
        ]
      },
      {
        include: !!(documentForm.axialLengthOd || documentForm.axialLengthOs),
        data: [
          "LUNGIME AXIALA",
          documentForm.axialLengthOd || "",
          documentForm.axialLengthOs || "",
        ]
      },
      {
        include: !!(documentForm.refractieOd || documentForm.refractieOs),
        data: [
          normalizeForPDF("REFRACȚIE OCHELARI"),
          documentForm.refractieOd || "-",
          documentForm.refractieOs || "-",
        ]
      },
      {
        include: !!(documentForm.refractieCicloOd || documentForm.refractieCicloOs),
        data: [
          {
            content: normalizeForPDF("REFRACȚIE OBIECTIVĂ (CICLOPLEGIE)"),
            styles: { fontSize: 7, fontStyle: "bold" as const, lineHeightFactor: 0.9, cellPadding: 1 } as any,
          },
          {
            content: normalizeForPDF(documentForm.refractieCicloOd || "-"),
            styles: { fontSize: 6.5, lineHeightFactor: 0.85, cellPadding: 1 } as any,
          },
          {
            content: normalizeForPDF(documentForm.refractieCicloOs || "-"),
            styles: { fontSize: 6.5, lineHeightFactor: 0.85, cellPadding: 1 } as any,
          },
        ]
      },
      {
        include: !!(documentForm.anteriorSegmentOd || documentForm.anteriorSegmentOs),
        data: documentForm.anteriorSegmentAo ? [
          { content: "POL ANTERIOR", styles: { fontSize: 10, fontStyle: "bold" as const, lineHeightFactor: 0.2 } as any },
          { content: documentForm.anteriorSegmentOd || "", colSpan: 2, styles: { fontSize: 10, lineHeightFactor: 0.2 } as any }
        ] : [
          { content: "POL ANTERIOR", styles: { fontSize: 10, fontStyle: "bold" as const, lineHeightFactor: 0.2 } as any },
          { content: documentForm.anteriorSegmentOd || "", styles: { fontSize: 10, lineHeightFactor: 0.2 } as any },
          { content: documentForm.anteriorSegmentOs || "", styles: { fontSize: 10, lineHeightFactor: 0.2 } as any },
        ]
      },
      {
        include: !!(documentForm.posteriorSegmentOd || documentForm.posteriorSegmentOs),
        data: documentForm.posteriorSegmentAo ? [
          { content: "POL POSTERIOR (EXAMEN FUND DE OCHI)", styles: { fontSize: 10, fontStyle: "bold" as const, lineHeightFactor: 0.85 } as any },
          { content: documentForm.posteriorSegmentOd || "", colSpan: 2, styles: { fontSize: 10, lineHeightFactor: 0.85 } as any }
        ] : [
          { content: "POL POSTERIOR (EXAMEN FUND DE OCHI)", styles: { fontSize: 10, fontStyle: "bold" as const, lineHeightFactor: 0.85 } as any },
          { content: documentForm.posteriorSegmentOd || "", styles: { fontSize: 10, lineHeightFactor: 0.85 } as any },
          { content: documentForm.posteriorSegmentOs || "", styles: { fontSize: 10, lineHeightFactor: 0.85 } as any },
        ]
      },
      {
        include: !!(documentForm.diagnostic),
        data: [
          { content: "DIAGNOSTIC", styles: { fontStyle: "bold" as const, fontSize: 12.3 } },
          {
            content: cleanStr(documentForm.diagnostic) || "",
            colSpan: 2,
          },
        ]
      },
      {
        include: !!(documentForm.contrastSensitivity || currentMedicalRecord?.contrastSensitivity),
        data: [
          { content: "SENSIBILITATE CONTRAST", styles: { fontStyle: "bold" as const, fontSize: 11 } },
          {
            content: cleanStr(documentForm.contrastSensitivity || currentMedicalRecord?.contrastSensitivity || ""),
            colSpan: 2,
          },
        ]
      },
      {
        include: !!(documentForm.colorVision || currentMedicalRecord?.colorVision),
        data: [
          { content: "SIMT CROMATIC", styles: { fontStyle: "bold" as const, fontSize: 11 } },
          {
            content: cleanStr(documentForm.colorVision || currentMedicalRecord?.colorVision || ""),
            colSpan: 2,
          },
        ]
      },
      {
        include: !!(documentForm.binocularVision || currentMedicalRecord?.binocularVision),
        data: [
          { content: "VEDERE BINOCULARA", styles: { fontStyle: "bold" as const, fontSize: 11 } },
          {
            content: cleanStr(documentForm.binocularVision || currentMedicalRecord?.binocularVision || ""),
            colSpan: 2,
          },
        ]
      },
      {
        include: !!(documentForm.treatment),
        data: [
          { content: "TRATAMENT", styles: { fontStyle: "bold" as const, fontSize: 12.3 } },
          { content: cleanStr(documentForm.treatment) || "", colSpan: 2 },
        ]
      },
      {
        include: !!(documentForm.examinationInterpretation),
        data: [
          {
            content: "INTERPRETARE EXAM.",
            styles: { fontStyle: "bold" as const, fontSize: 12.3 },
          },
          {
            content: cleanStr(documentForm.examinationInterpretation) || "",
            colSpan: 2,
          },
        ]
      },
      {
        include: !!(documentForm.recoveryPlan),
        data: [
          {
            content: "PLAN DE RECUPERARE",
            styles: { fontStyle: "bold" as const, fontSize: 12.3 },
          },
          {
            content: cleanStr(documentForm.recoveryPlan) || "",
            colSpan: 2,
          },
        ]
      }
    ].filter(row => row.include).map(row => row.data);

    autoTable(doc, {
      startY: y + 3,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 12.3, cellPadding: 2.2, overflow: "linebreak" },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 126 / 2 },
      },
      margin: { left: 14, right: 14 },
    });

    let sigY = (doc as any).lastAutoTable?.finalY || 205;
    if (sigY > 255) {
      doc.addPage();
      sigY = 20;
    }

    doc.setFont("helvetica", "normal");

    let consultType = "";
    let consultColor: [number, number, number] = [0, 0, 0];
    if (documentForm.isConsultComplet) {
      consultType = "CONSULT COMPLET";
      consultColor = [37, 99, 235]; // Blue 600
    } else if (documentForm.isControl) {
      consultType = "REVENIRE";
      consultColor = [217, 119, 6]; // Amber 600/Orange
    } else if (documentForm.isGratis) {
      consultType = "GRATIS";
      consultColor = [22, 163, 74]; // Green 600
    }

    if (consultType) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(consultColor[0], consultColor[1], consultColor[2]);
      doc.text(consultType, 14, sigY + 6);
      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
    }

    doc.setFontSize(9);
    doc.text(`Data:`, 14, sigY + 12);

    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(24, sigY + 20.5, 64, sigY + 20.5);
    doc.line(pageWidth - 74, sigY + 20.5, pageWidth - 14, sigY + 20.5);
    doc.setLineWidth(1.0);
    doc.setDrawColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    const dAn = documentForm.eliberatAn || new Date().getFullYear().toString();
    const dLunaNumeric =
      (
        [
          "Ianuarie",
          "Februarie",
          "Martie",
          "Aprilie",
          "Mai",
          "Iunie",
          "Iulie",
          "August",
          "Septembrie",
          "Octombrie",
          "Noiembrie",
          "Decembrie",
        ].indexOf(documentForm.eliberatLuna) + 1
      )
        .toString()
        .padStart(2, "0") || "01";
    const dZi = String(
      documentForm.eliberatZi || new Date().getDate(),
    ).padStart(2, "0");
    doc.text(`${dZi}.${dLunaNumeric}.${dAn}`, 44, sigY + 19.5, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "MEDIC CONSULTANT", pageWidth - 44, sigY + 12, {
      align: "center",
    });
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      documentForm.doctorName || "",
      pageWidth - 44,
      sigY + 19.5,
      {
        align: "center",
        maxWidth: 58,
      },
    );
    doc.setFont("helvetica", "normal");

    // Check if axial length values were entered in the form or exist in the patient's record / history
    const parseAxialNum = (v: any): number => {
      if (typeof v === "number") return isNaN(v) ? 0 : v;
      if (!v || typeof v !== "string") return 0;
      const parsed = parseFloat(v.replace(/,/g, ".").replace(/[^0-9.]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const formAxialOd = (documentForm.axialLengthOd || "").trim();
    const formAxialOs = (documentForm.axialLengthOs || "").trim();
    const parsedFormAxialOd = parseAxialNum(formAxialOd);
    const parsedFormAxialOs = parseAxialNum(formAxialOs);

    const recordAxialOd = currentMedicalRecord?.axialLength?.od || "";
    const recordAxialOs = currentMedicalRecord?.axialLength?.os || "";
    const parsedRecordAxialOd = parseAxialNum(recordAxialOd);
    const parsedRecordAxialOs = parseAxialNum(recordAxialOs);

    const hasAnyAxialData =
      parsedFormAxialOd > 0 ||
      parsedFormAxialOs > 0 ||
      parsedRecordAxialOd > 0 ||
      parsedRecordAxialOs > 0 ||
      (currentMedicalRecord?.axialLengthHistory && currentMedicalRecord.axialLengthHistory.length > 0) ||
      (currentMedicalRecord?.prescriptionHistory &&
        currentMedicalRecord.prescriptionHistory.some((h: any) =>
          parseAxialNum(h.axialLength?.od) > 0 || parseAxialNum(h.axialLength?.os) > 0
        ));

    if (hasAnyAxialData) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("pag 1/2", pageWidth / 2, pageHeight - 8, { align: "center" });

      doc.addPage("a4", "portrait");

      // Effective record for Myopia charts calculation
      const effectiveRec: MedicalRecord = {
        ...(currentMedicalRecord || {}),
        id: currentMedicalRecord?.id || "temp_rec",
        patientName:
          currentMedicalRecord?.patientName ||
          cleanStr(`${documentForm.lastName || ""} ${documentForm.firstName || ""}`.trim()) ||
          "Pacient",
        patientBirthDate: currentMedicalRecord?.patientBirthDate || "",
        patientAge:
          currentMedicalRecord?.patientAge ||
          documentForm.ageSimple ||
          (documentForm.ageDetailed ? parseInt(documentForm.ageDetailed, 10) : 0),
        patientSex:
          currentMedicalRecord?.patientSex ||
          (documentForm.patientCnp ? getSexFromCNP(documentForm.patientCnp) : null) ||
          "F",
        axialLength: {
          od: formAxialOd || recordAxialOd || "",
          os: formAxialOs || recordAxialOs || "",
        },
      };

      const sex: "M" | "F" = effectiveRec.patientSex === "M" ? "M" : "F";
      const riskLabels = sex === "M" ? BOYS_RISK : GIRLS_RISK;
      const chartD = sex === "M" ? MYOPIA_BOYS_DATA : MYOPIA_GIRLS_DATA;

      const odData = getComprehensivePatientAxialData("OD", effectiveRec);
      const osData = getComprehensivePatientAxialData("OS", effectiveRec);

      const parseDateSafeLocal = (dStr: any): Date | null => {
        if (!dStr) return null;
        if (dStr instanceof Date) return isNaN(dStr.getTime()) ? null : dStr;
        if (typeof dStr === "string") {
          let d = new Date(dStr);
          if (!isNaN(d.getTime())) return d;
        }
        return null;
      };

      const docDate = new Date();
      const bDate = parseDateSafeLocal(effectiveRec.patientBirthDate);
      let calculatedAge =
        typeof effectiveRec.patientAge === "number"
          ? effectiveRec.patientAge
          : parseFloat(effectiveRec.patientAge || "0");
      if (bDate) {
        const diffY = (docDate.getTime() - bDate.getTime()) / (365.2425 * 86400000);
        if (diffY >= 0 && diffY <= 120) calculatedAge = Math.round(diffY * 100) / 100;
      }

      if (parsedFormAxialOd > 0 && !odData.some((d) => Math.abs(d.axialLength - parsedFormAxialOd) < 0.01)) {
        odData.push({
          date: docDate.toISOString(),
          age: calculatedAge,
          axialLength: parsedFormAxialOd,
          isFromHistory: false,
          historyItem: null,
          eye: "OD",
        });
      }

      if (parsedFormAxialOs > 0 && !osData.some((d) => Math.abs(d.axialLength - parsedFormAxialOs) < 0.01)) {
        osData.push({
          date: docDate.toISOString(),
          age: calculatedAge,
          axialLength: parsedFormAxialOs,
          isFromHistory: false,
          historyItem: null,
          eye: "OS",
        });
      }

      const sortedOd = [...odData].sort((a, b) => a.age - b.age);
      const sortedOs = [...osData].sort((a, b) => a.age - b.age);

      let odPercentileStr = "";
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
        odPercentileStr = `Percentila ${closestP} (${riskLabels[`p${closestP}`]})`;
      }

      let osPercentileStr = "";
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
        osPercentileStr = `Percentila ${closestP} (${riskLabels[`p${closestP}`]})`;
      }

      // Top Clinic Header on Page 2
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("S.C. Optinoe Oftalmo Negreanu S.R.L. Cui 39902033 J3/1880/2018", 14, 11);
      doc.text("Judetul: Arges, Pitesti, Str. Calea Bucuresti, bl.30, sc. A, ap.2", 14, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Nr. fisa / registru: ${documentForm.documentNumber || ""}`,
        pageWidth - 14,
        11,
        { align: "right" },
      );

      // Page 2 Title
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Management Miopie - Grafic Lungime Axială", pageWidth / 2, 23, { align: "center" });

      // Patient Info Subtitle
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const sexDisplay = sex === "M" ? "Masculin (Băiat)" : "Feminin (Fată)";
      const displayAge = effectiveRec.patientBirthDate
        ? calculateDetailedAge(effectiveRec.patientBirthDate)
        : (documentForm.ageDetailed || documentForm.ageSimple || `${effectiveRec.patientAge || ""} ani`);
      const dateFormatted = `${dZi}.${dLunaNumeric}.${dAn}`;
      doc.text(
        cleanStrForMyopia(
          `Pacient: ${cleanStr(effectiveRec.patientName)} | Sex: ${sexDisplay} | Vârstă: ${displayAge} | Data: ${dateFormatted}`,
        ),
        pageWidth / 2,
        28.5,
        { align: "center" },
      );

      // Graph Dimensions
      const chartWidth = 182;
      const chartHeight = 92;
      const chartStartX = 14;

      if (isMyopiaCombinedView) {
        // Mod Combinat: un singur grafic mare cu OD și OS suprapuse pe Pagina 2
        const combinedChartHeight = 180;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(cleanStrForMyopia("Grafic Comparativ Suprapus (OD & OS)"), 14, 35);

        const latestOd = sortedOd.length > 0 ? sortedOd[sortedOd.length - 1] : null;
        const latestOs = sortedOs.length > 0 ? sortedOs[sortedOs.length - 1] : null;
        let summaryText = "";
        if (latestOd) summaryText += `OD: ${latestOd.axialLength.toFixed(2)} mm   `;
        if (latestOs) summaryText += `OS: ${latestOs.axialLength.toFixed(2)} mm`;
        if (summaryText) {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(37, 99, 235);
          doc.text(summaryText, pageWidth - 14, 35, { align: "right" });
          doc.setTextColor(0);
        }

        drawMyopiaGraph(doc, chartStartX, 38, chartWidth, combinedChartHeight, sex, sortedOd, sortedOs, true);

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text(
          cleanStrForMyopia(`Analiză Risc OD: ${odPercentileStr || "Nicio valoare înregistrată."}`),
          14,
          225,
        );
        doc.setTextColor(16, 185, 129);
        doc.text(
          cleanStrForMyopia(`Analiză Risc OS: ${osPercentileStr || "Nicio valoare înregistrată."}`),
          14,
          232,
        );
        doc.setTextColor(0);
      } else {
        // OD Section
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text(cleanStrForMyopia("Ochi Drept (OD)"), 14, 35);
        doc.setTextColor(0);

        const latestOd = sortedOd.length > 0 ? sortedOd[sortedOd.length - 1] : null;
        if (latestOd) {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(37, 99, 235);
          doc.text(
            `Valoare măsurată: ${latestOd.axialLength.toFixed(2)} mm (vârstă: ${latestOd.age.toFixed(1)} ani)`,
            pageWidth - 14,
            35,
            { align: "right" },
          );
          doc.setTextColor(0);
        }

        drawMyopiaGraph(doc, chartStartX, 37, chartWidth, chartHeight, sex, sortedOd);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(
          cleanStrForMyopia(`Analiză Risc OD: ${odPercentileStr || "Nicio valoare înregistrată."}`),
          14,
          133.5,
        );

        // OS Section
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(16, 185, 129);
        doc.text(cleanStrForMyopia("Ochi Stâng (OS)"), 14, 142);
        doc.setTextColor(0);

        const latestOs = sortedOs.length > 0 ? sortedOs[sortedOs.length - 1] : null;
        if (latestOs) {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(16, 185, 129);
          doc.text(
            `Valoare măsurată: ${latestOs.axialLength.toFixed(2)} mm (vârstă: ${latestOs.age.toFixed(1)} ani)`,
            pageWidth - 14,
            142,
            { align: "right" },
          );
          doc.setTextColor(0);
        }

        drawMyopiaGraph(doc, chartStartX, 144, chartWidth, chartHeight, sex, sortedOs);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(
          cleanStrForMyopia(`Analiză Risc OS: ${osPercentileStr || "Nicio valoare înregistrată."}`),
          14,
          240.5,
        );
      }

      // Bottom Section on Page 2
      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 246, pageWidth - 14, 246);
      doc.setDrawColor(0, 0, 0);

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(
        cleanStrForMyopia(
          "Protocol clinic de urmărire a alungirii axiale conform curbelor de percentilă (Tideman et al., Erasmus University).",
        ),
        pageWidth / 2,
        251,
        { align: "center" },
      );

      // Date & Medic
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("Data:", 14, 261);
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.line(24, 269.5, 64, 269.5);
      doc.line(pageWidth - 74, 269.5, pageWidth - 14, 269.5);
      doc.setLineWidth(1.0);
      doc.setDrawColor(0, 0, 0);

      doc.setFont("helvetica", "bold");
      doc.text(`${dZi}.${dLunaNumeric}.${dAn}`, 44, 268.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.text("MEDIC CONSULTANT", pageWidth - 44, 261, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(cleanStr(documentForm.doctorName || ""), pageWidth - 44, 268.5, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("pag 2/2", pageWidth / 2, pageHeight - 8, { align: "center" });
    } else {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("pag 1/1", pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    const pdfName =
      `Raport_Medical_${cleanStr(documentForm.lastName || "")}_${cleanStr(documentForm.firstName || "")}`
        .replace(/_+/g, "_")
        .replace(/_$/, "");
    triggerPdfPrint(doc, `${pdfName || "Raport_Medical"}.pdf`);
};

export const generateCertificatPdf = (
  documentForm: any,
  currentMedicalRecord: any = {},
  options?: MedicalDocPrintOptions
) => {
  const triggerPdfPrint = options?.triggerPdfPrint || ((doc: any, name?: string) => doc.save(name));
      const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });
    try {
      doc.viewerPreferences({
        PickTrayByPDFSize: true,
        PrintScaling: "None"
      });
    } catch (e) {
      console.warn("Could not set viewer preferences:", e);
    }
    const pageWidth = 148;
    const pageHeight = 210;

    const drawDottedLine = (startX: number, endX: number, yPos: number) => {
      const dots = ".".repeat(Math.floor((endX - startX) / 1.2));
      doc.text(dots, startX, yPos);
    };

    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      `S.C. Optinoe Oftalmo Negreanu S.R.L. Cui 39902033 J3/1880/2018`,
      10,
      14,
    );
    doc.text(`Judetul unitatii: Arges`, 10, 18);
    doc.text(
      `Localitate unitate: Pitesti, Str. Calea Bucuresti, bl.30, sc. A, ap.2`,
      10,
      22,
    );
    doc.setFontSize(8);

    doc.rect(pageWidth - 45, 10, 35, 35);
    doc.text("timbru fiscal", pageWidth - 42, 18);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "CERTIFICAT MEDICAL Nr. ", 10, 45);
    const certTitleWidth = doc.getTextWidth("CERTIFICAT MEDICAL Nr. ");
    doc.setFontSize(10);
    doc.text(documentForm.documentNumber || "...........", 10 + certTitleWidth, 45);
    doc.setFontSize(10);
    const dAn = documentForm.eliberatAn || new Date().getFullYear().toString();
    const dLunaNumeric =
      (
        [
          "Ianuarie",
          "Februarie",
          "Martie",
          "Aprilie",
          "Mai",
          "Iunie",
          "Iulie",
          "August",
          "Septembrie",
          "Octombrie",
          "Noiembrie",
          "Decembrie",
        ].indexOf(documentForm.eliberatLuna) + 1
      )
        .toString()
        .padStart(2, "0") || "01";
    const dZi = String(
      documentForm.eliberatZi || new Date().getDate(),
    ).padStart(2, "0");
    drawPdfTextWithDiacritics(doc, `anul ${dAn} luna ${dLunaNumeric} ziua ${dZi}`, 10, 52);

    doc.setFont("helvetica", "normal");
    let y = 65;
    const lineSpacing = 8;

    drawPdfTextWithDiacritics(doc, "În baza referatului Dr.", 10, y);
    drawDottedLine(45, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      documentForm.doctorName || "",
      (45 + pageWidth - 10) / 2,
      y - 2,
      {
        align: "center",
        maxWidth: pageWidth - 10 - 48,
      },
    );
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "În calitate de", 10, y);
    drawDottedLine(30, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      "medic specialist oftalmologie",
      (30 + pageWidth - 10) / 2,
      y - 2,
      { align: "center" },
    );
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Se certifică de noi că:", 10, y);
    drawDottedLine(45, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      documentForm.patientName || "",
      (45 + pageWidth - 10) / 2,
      y - 2,
      { align: "center", maxWidth: pageWidth - 10 - 48 },
    );
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Codul numeric personal", 10, y);
    const cnp = documentForm.patientCnp || "";
    const boxWidth = 5;
    const boxHeight = 7;
    const boxSpacing = 5.5;
    const startX = 55;
    for (let i = 0; i < 13; i++) {
      doc.rect(startX + i * boxSpacing, y - 5, boxWidth, boxHeight);
      if (cnp[i]) {
        doc.setFontSize(11);
        doc.text(cnp[i], startX + i * boxSpacing + boxWidth / 2, y, {
          align: "center",
        });
        doc.setFontSize(10);
      }
    }

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "în vârstă de", 10, y);
    drawDottedLine(30, 45, y);
    doc.setFont("helvetica", "bold");
    doc.text(documentForm.ageSimple || "", (30 + 45) / 2, y - 2, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "sexul", 60, y);
    drawDottedLine(72, 85, y);
    if (documentForm.patientSex) {
      doc.setFont("helvetica", "bold");
      doc.text(documentForm.patientSex, 78.5, y - 2, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
    }

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Domiciliat în: jud. /sect.", 10, y);
    drawDottedLine(48, 80, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientJudet || "", 64, y - 2, {
      align: "center",
      maxWidth: 30,
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "loc.", 82, y);
    drawDottedLine(90, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      documentForm.patientLocalitate || "",
      (90 + pageWidth - 10) / 2,
      y - 2,
      { align: "center", maxWidth: pageWidth - 10 - 92 },
    );
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "str.", 10, y);
    drawDottedLine(18, 55, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientStrada || "", 36.5, y - 2, {
      align: "center",
      maxWidth: 35,
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "nr.", 57, y);
    drawDottedLine(63, 80, y);
    drawPdfTextWithDiacritics(doc, "bl.", 82, y);
    drawDottedLine(87, 105, y);
    doc.setFont("helvetica", "bold");
    doc.text(documentForm.patientBloc || "", 96, y - 2, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "sc.", 107, y);
    drawDottedLine(113, 125, y);
    doc.setFont("helvetica", "bold");
    doc.text(documentForm.patientScara || "", 119, y - 2, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "ap.", 127, y);
    drawDottedLine(133, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    doc.text(
      documentForm.patientApartament || "",
      (133 + pageWidth - 10) / 2,
      y - 2,
      { align: "center" },
    );
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "B.I./C.I. seria", 10, y);
    drawDottedLine(32, 50, y);
    doc.text(documentForm.patientSeries || "", 34, y - 2);
    drawPdfTextWithDiacritics(doc, "nr.", 52, y);
    drawDottedLine(57, 77, y);
    doc.text(documentForm.patientNumber || "", 59, y - 2);
    drawPdfTextWithDiacritics(doc, "având ocupația de:", 79, y);
    drawDottedLine(108, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    drawPdfTextWithDiacritics(
      doc,
      documentForm.ocupatie || "",
      (108 + pageWidth - 10) / 2,
      y - 2,
      { align: "center", maxWidth: pageWidth - 10 - 110 },
    );
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "la", 10, y);
    drawDottedLine(15, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.lucru || "", (15 + pageWidth - 10) / 2, y - 2, {
      align: "center",
      maxWidth: pageWidth - 10 - 18,
    });
    doc.setFont("helvetica", "normal");

    y += lineSpacing;
    drawPdfTextWithDiacritics(doc, "Este suferind de:", 10, y);
    drawDottedLine(38, pageWidth - 10, y);
    const diagText = cleanStr(documentForm.diagnostic) || "";
    const diagLines = doc.splitTextToSize(diagText, pageWidth - 50);
    doc.setFont("helvetica", "bold");
    doc.text(diagLines, 40, y - 2);
    doc.setFont("helvetica", "normal");

    if (diagLines.length > 1) {
      y += (diagLines.length - 1) * 5;
    }

    y += 15;
    drawPdfTextWithDiacritics(doc, "S-a eliberat prezentul spre a-i servi la:", 10, y);
    drawDottedLine(75, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(
      doc,
      documentForm.servesTo || "",
      (75 + pageWidth - 10) / 2,
      y - 2,
      { align: "center", maxWidth: pageWidth - 10 - 78 },
    );
    doc.setFont("helvetica", "normal");

    y += 25;
    drawPdfTextWithDiacritics(doc, "Medic director,", pageWidth - 60, y);
    y += 10;
    drawDottedLine(pageWidth - 65, pageWidth - 10, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.doctorName || "", pageWidth - 37.5, y - 2, {
      align: "center",
      maxWidth: 50,
    });
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text("L.S.", pageWidth - 40, y);

    triggerPdfPrint(
      doc,
      `Certificat_Medical_${cleanStr(documentForm.patientName).replace(/\s+/g, "_")}.pdf`,
    );
};

export const generateExpertizaPdf = (
  documentForm: any,
  currentMedicalRecord: any = {},
  options?: MedicalDocPrintOptions
) => {
  const triggerPdfPrint = options?.triggerPdfPrint || ((doc: any, name?: string) => doc.save(name));
      const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const drawDottedLine = (startX: number, endX: number, yPos: number) => {
      const dots = ".".repeat(Math.floor((endX - startX) / 1.15));
      doc.text(dots, startX, yPos);
    };

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Anexa nr. 17", pageWidth - 15, 12, { align: "right" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "EXAMEN OFTALMOLOGIC", pageWidth / 2, 22, { align: "center" });
    doc.setFontSize(11);
    drawPdfTextWithDiacritics(
      doc,
      "PENTRU EXPERTIZA MEDICALĂ A CAPACITĂȚII DE MUNCĂ",
      pageWidth / 2,
      28,
      { align: "center" },
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    let y = 40;

    drawPdfTextWithDiacritics(doc, "Nume", 15, y);
    drawDottedLine(27, 100, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.lastName || "", 63.5, y - 0.5, {
      align: "center",
      maxWidth: 70,
    });

    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "Prenume", 105, y);
    drawDottedLine(121, 195, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.firstName || "", 158, y - 0.5, {
      align: "center",
      maxWidth: 70,
    });

    y += 7;
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "CNP", 15, y);
    drawDottedLine(26, 80, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.patientCnp || "", 53, y - 0.5, {
      align: "center",
      maxWidth: 52,
    });

    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "Domiciliu", 85, y);
    drawDottedLine(103, 195, y);
    doc.setFont("helvetica", "bold");
    const fullAddr = [documentForm.patientJudet, documentForm.patientLocalitate]
      .filter(Boolean)
      .join(", ");
    drawPdfTextWithDiacritics(doc, fullAddr || "", 149, y - 0.5, { align: "center", maxWidth: 88 });

    y += 7;
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, "Nr. fișă/Reg. cons.", 15, y);
    drawDottedLine(47, 100, y);
    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, documentForm.documentNumber || "", 73.5, y - 0.5, {
      align: "center",
      maxWidth: 50,
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    drawPdfTextWithDiacritics(doc, "1 DIAGNOSTIC CLINIC:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitDiag = doc.splitTextToSize(
      cleanStr(documentForm.diagnostic || ""),
      180,
    );
    doc.text(splitDiag, 15, y);
    y += Math.max(1, splitDiag.length) * 5;

    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    drawPdfTextWithDiacritics(doc, "2 DIAGNOSTIC FUNCȚIONAL/DEFICIENȚĂ VIZUALĂ:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitFuncDiag = doc.splitTextToSize(
      cleanStr(documentForm.diagnosticFunctional || ""),
      180,
    );
    doc.text(splitFuncDiag, 15, y);
    y += Math.max(1, splitFuncDiag.length) * 5;

    y += 4;
    const colWidths = [70, 55, 55];
    const colStarts = [15, 15 + colWidths[0], 15 + colWidths[0] + colWidths[1]];

    doc.setLineWidth(0.2);
    doc.rect(colStarts[0], y, colWidths[0], 8);
    doc.rect(colStarts[1], y, colWidths[1], 8);
    doc.rect(colStarts[2], y, colWidths[2], 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OD", colStarts[1] + colWidths[1] / 2, y + 5.5, {
      align: "center",
    });
    doc.text("OS", colStarts[2] + colWidths[2] / 2, y + 5.5, {
      align: "center",
    });

    let currentY = y + 8;
    const tableRows = [
      {
        label: "3  AV FĂRĂ CORECȚIE",
        odKey: "avFaraCorectieOd",
        osKey: "avFaraCorectieOs",
      },
      {
        label: "4  AV CU CORECȚIE",
        odKey: "avCuCorectieOd",
        osKey: "avCuCorectieOs",
      },
      { label: "5  REFRACȚIE", odKey: "refractieOd", osKey: "refractieOs" },
      { label: "5b REFRACȚIE OBIECTIVĂ (CICLOPLEGIE)", odKey: "refractieCicloOd", osKey: "refractieCicloOs" },
      { label: "6  CV MANUAL *", odKey: "cvManualOd", osKey: "cvManualOs" },
      {
        label: "7  CV COMPUTER *",
        odKey: "cvComputerOd",
        osKey: "cvComputerOs",
      },
      { label: "8  TIO", odKey: "tioOd", osKey: "tioOs" },
      { label: "9  FO", odKey: "foOd", osKey: "foOs" },
      {
        label: "10 RAPORT CUPĂ/DISC",
        odKey: "raportCupaDiscOd",
        osKey: "raportCupaDiscOs",
      },
      {
        label: "11 TRATAMENT EFECTUAT",
        odKey: "tratamentEfectuatOd",
        osKey: "tratamentEfectuatOs",
      },
      {
        label: "12 RECOMANDĂRI: OPTICE, MEDICALE, CHIRURGICALE",
        odKey: "recomandariOd",
        osKey: "recomandariOs",
      },
    ];

    tableRows.forEach((row) => {
      const odText = String(documentForm[row.odKey] || "");
      const osText = String(documentForm[row.osKey] || "");

      const wrappedOd = doc.splitTextToSize(cleanStr(odText), colWidths[1] - 4);
      const wrappedOs = doc.splitTextToSize(cleanStr(osText), colWidths[2] - 4);

      const linesCount = Math.max(1, wrappedOd.length, wrappedOs.length);
      const rowHeight = Math.max(10, linesCount * 4.5 + 2);

      doc.rect(colStarts[0], currentY, colWidths[0], rowHeight);
      doc.rect(colStarts[1], currentY, colWidths[1], rowHeight);
      doc.rect(colStarts[2], currentY, colWidths[2], rowHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const labelLines = doc.splitTextToSize(
        cleanStr(row.label),
        colWidths[0] - 4,
      );
      doc.text(
        labelLines,
        colStarts[0] + 2,
        currentY + rowHeight / 2 - (labelLines.length - 1) * 2,
        { baseline: "middle" },
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        wrappedOd,
        colStarts[1] + 2,
        currentY + rowHeight / 2 - (wrappedOd.length - 1) * 2,
        { baseline: "middle" },
      );
      doc.text(
        wrappedOs,
        colStarts[2] + 2,
        currentY + rowHeight / 2 - (wrappedOs.length - 1) * 2,
        { baseline: "middle" },
      );

      currentY += rowHeight;
    });

    y = currentY + 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    drawPdfTextWithDiacritics(doc, "DATA", 15, y);
    const dAn = documentForm.eliberatAn || new Date().getFullYear().toString();
    const dLuna = documentForm.eliberatLuna || "01";
    const dZi = String(
      documentForm.eliberatZi || new Date().getDate(),
    ).padStart(2, "0");
    const dateFormatted = `${dZi} ${dLuna} ${dAn}`;
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, dateFormatted, 30, y);
    doc.line(28, y + 1, 90, y + 1);

    doc.setFont("helvetica", "bold");
    drawPdfTextWithDiacritics(doc, "MEDIC OFTALMOLOG,", 110, y);
    doc.setFont("helvetica", "normal");
    drawPdfTextWithDiacritics(doc, documentForm.doctorName || "", 110, y + 8, { maxWidth: 80 });
    doc.line(110, y + 10, 195, y + 10);

    y += 18;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    drawPdfTextWithDiacritics(doc, "TOATE RUBRICILE TREBUIE COMPLETATE", 15, y);
    y += 4;
    drawPdfTextWithDiacritics(
      doc,
      "* OBLIGATORIU PUNCTUL 4 ȘI 5 CU GRAFIC ANEXAT ȘI INTERPRETARE",
      15,
      y,
    );

    triggerPdfPrint(
      doc,
      `Expertiza_Medicala_${cleanStr(documentForm.patientName).replace(/\s+/g, "_")}.pdf`,
    );
};
