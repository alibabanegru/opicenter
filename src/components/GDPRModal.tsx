import React, { useRef, useState, useEffect } from "react";
import SignaturePad from "signature_pad";
import { compressSignatureCanvas } from "../lib/signatureUtils";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { X, Download, Trash2, Shield, Monitor, Calendar, ShieldOff } from "lucide-react";

interface GDPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCnp: string;
  patientPhone?: string;
  patientBirthDate?: string;
  initialSignature?: string;
  onSave: (cnp: string, signature: string, phone?: string) => Promise<string | null> | string | null;
}

// Helper for PDF generation
const normalizeForPDF = (text: string | undefined): string => {
  if (!text) return "";
  return text
    .replace(/ă/g, "a")
    .replace(/Ă/g, "A")
    .replace(/â/g, "a")
    .replace(/Â/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/ș/g, "s")
    .replace(/Ș/g, "S")
    .replace(/ț/g, "t")
    .replace(/Ț/g, "T");
};

// Helper to extract birth date details from CNP or birth date string
const getBirthDateDetailsFromCNP = (cnpVal: string): { day: string; month: string; year: string; formatted: string } | null => {
  if (!cnpVal || cnpVal.length < 7) return null;
  const s = parseInt(cnpVal[0], 10);
  const yy = cnpVal.slice(1, 3);
  const mm = cnpVal.slice(3, 5);
  const dd = cnpVal.slice(5, 7);

  let century = 1900;
  if (s === 1 || s === 2) century = 1900;
  else if (s === 3 || s === 4) century = 1800;
  else if (s === 5 || s === 6) century = 2000;
  else return null;

  const monthNum = parseInt(mm, 10);
  const dayNum = parseInt(dd, 10);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;

  const fullYear = String(century + parseInt(yy, 10));
  return {
    day: dd,
    month: mm,
    year: fullYear,
    formatted: `${dd}.${mm}.${fullYear}`
  };
};

const parseBirthDateString = (dateStr?: string): { day: string; month: string; year: string; formatted: string } | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const str = dateStr.trim();
  let year = "";
  let month = "";
  let day = "";

  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else if (parts[2].length === 4) {
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }
    }
  } else if (str.includes(".")) {
    const parts = str.split(".");
    if (parts.length === 3) {
      day = parts[0];
      month = parts[1];
      year = parts[2];
    }
  }

  if (year && month && day) {
    const formattedMonth = month.padStart(2, "0");
    const formattedDay = day.padStart(2, "0");
    return {
      day: formattedDay,
      month: formattedMonth,
      year: year,
      formatted: `${formattedDay}.${formattedMonth}.${year}`
    };
  }
  return null;
};

export const GDPRModal = React.memo(function GDPRModal({ isOpen, onClose, patientName, patientCnp, patientPhone, patientBirthDate, initialSignature, onSave }: GDPRModalProps) {
  const [signatureDate, setSignatureDate] = useState(format(new Date(), "dd.MM.yyyy"));
  const [localCnp, setLocalCnp] = useState(patientCnp);
  const [localPhone, setLocalPhone] = useState(patientPhone || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const birthDateDetails = getBirthDateDetailsFromCNP(localCnp) || parseBirthDateString(patientBirthDate);

  // Sync with Wacom Tablet screen in real-time
  useEffect(() => {
    if (!isOpen) return;

    const channel = new BroadcastChannel("wacom_gdpr_sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === "ready") {
        channel.postMessage({
          type: "init",
          data: {
            patientName,
            patientCnp: localCnp,
            patientPhone: localPhone,
            patientBirthDate: birthDateDetails?.formatted || "",
          }
        });
      } else if (type === "signature_saved") {
        const signature = data?.signature;
        if (signature && signaturePadRef.current) {
          signaturePadRef.current.fromDataURL(signature);
        }
      } else if (type === "clear") {
        signaturePadRef.current?.clear();
      }
    };

    // Immediately push data in case the tablet window is already open
    channel.postMessage({
      type: "init",
      data: {
        patientName,
        patientCnp: localCnp,
        patientPhone: localPhone,
        patientBirthDate: birthDateDetails?.formatted || "",
      }
    });

    return () => {
      channel.postMessage({ type: "reset" });
      channel.close();
      channelRef.current = null;
    };
  }, [isOpen, patientName, localCnp, localPhone, birthDateDetails?.formatted]);

  const openWacomWindow = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popupUrl = `${window.location.origin}${window.location.pathname}?wacom=true`;
    
    window.open(
      popupUrl,
      "WacomSignatureTablet",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  useEffect(() => {
    setLocalCnp(patientCnp);
    setLocalPhone(patientPhone || "");
  }, [patientCnp, patientPhone]);

  useEffect(() => {
    setErrorMsg(null);
  }, [localCnp, localPhone, isOpen]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          canvas.getContext("2d")?.scale(ratio, ratio);
          
          signaturePadRef.current = new SignaturePad(canvas, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: 'black'
          });

          // Pre-load initial signature if exists
          if (initialSignature) {
            signaturePadRef.current.fromDataURL(initialSignature);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialSignature]);

  if (!isOpen) return null;

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const canvas = canvasRef.current;
    const isPadEmpty = signaturePadRef.current?.isEmpty();
    const signature = isPadEmpty ? "" : compressSignatureCanvas(canvas, isPadEmpty) || "";
    if (onSave) {
      const res = await onSave(localCnp, signature, localPhone);
      if (res) {
        setErrorMsg(res);
      } else {
        setErrorMsg(null);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleRevoke = async () => {
    const confirmRevoke = window.confirm(
      `Sunteți sigur că doriți să anulați (revocați) acordul GDPR semnat anterior de pacientul ${patientName}?\n\nConsimțământul GDPR va fi anulat și eliminat din baza de date.`
    );
    if (!confirmRevoke) return;

    setErrorMsg(null);
    try {
      const res = await onSave(localCnp, "", localPhone);
      if (res) {
        setErrorMsg(res);
      } else {
        clearSignature();
        onClose();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "A apărut o eroare la anularea acordului GDPR.");
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(normalizeForPDF("Consimțământ pentru prelucrarea datelor cu caracter personal (GDPR)"), 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const introText = `Subsemnatul(a) ${patientName || "_________________________"}, CNP ${localCnp || "_________________________"}, declar că am fost informat(ă) în mod clar, complet și inteligibil cu privire la prelucrarea datelor mele cu caracter personal de către cabinetul oftalmologic.`;
    const lines1 = doc.splitTextToSize(normalizeForPDF(introText), 170);
    doc.text(lines1, 20, 40);

    let currentY = 40 + lines1.length * 7;

    const bodyText1 = `Înțeleg că datele mele personale (inclusiv date de identificare, date de contact și date medicale) vor fi colectate și prelucrate în scopul furnizării serviciilor medicale, stabilirii diagnosticului, efectuării tratamentului și îndeplinirii obligațiilor legale ale cabinetului.`;
    const lines2 = doc.splitTextToSize(normalizeForPDF(bodyText1), 170);
    doc.text(lines2, 20, currentY);

    currentY += lines2.length * 7 + 10;

    doc.text(normalizeForPDF("Am fost informat(ă) că:"), 20, currentY);
    currentY += 10;

    const bullets = [
      "datele mele vor fi stocate în condiții de siguranță și confidențialitate;",
      "datele pot fi comunicate către instituții publice sau alte entități autorizate, doar în condițiile legii;",
      "am dreptul de acces, rectificare, ștergere, restricționare a prelucrării, opoziție și portabilitate a datelor;",
      "am dreptul de a-mi retrage consimțământul în orice moment, fără a afecta legalitatea prelucrării efectuate anterior;",
      "am dreptul de a depune o plângere la autoritatea competentă privind protecția datelor."
    ];

    bullets.forEach(bullet => {
      const bLines = doc.splitTextToSize(normalizeForPDF(`• ${bullet}`), 160);
      doc.text(bLines, 25, currentY);
      currentY += bLines.length * 7;
    });

    currentY += 10;
    const finalTxt = `Prin semnarea prezentului document, îmi exprim consimțământul liber, specific, informat și neechivoc pentru prelucrarea datelor mele cu caracter personal în scopurile menționate mai sus.`;
    const lines3 = doc.splitTextToSize(normalizeForPDF(finalTxt), 170);
    doc.text(lines3, 20, currentY);

    currentY += lines3.length * 7 + 20;

    doc.text(normalizeForPDF(`Data: ${signatureDate}`), 20, currentY);
    doc.text(normalizeForPDF(`Semnătura pacientului:`), 110, currentY);

    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const canvas = canvasRef.current;
      const signatureDataUrl = compressSignatureCanvas(canvas, false);
      if (signatureDataUrl) {
        doc.addImage(signatureDataUrl, "PNG", 110, currentY + 5, 60, 20);
      }
    }

    // Clean filename for download
    const cleanName = normalizeForPDF(patientName).replace(/\s+/g, "_") || "Pacient";
    doc.save(`GDPR_Consimtamant_${cleanName}_${signatureDate}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-2xl">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Formular GDPR</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nume Pacient</label>
              <input type="text" value={patientName} readOnly className="w-full p-2.5 border rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                CNP Pacient <span className="text-[10px] font-normal normal-case text-slate-400 dark:text-slate-500">(Opțional)</span>
              </label>
              <input 
                type="text" 
                value={localCnp} 
                onChange={(e) => setLocalCnp(e.target.value.replace(/\D/g, ''))} 
                maxLength={13} 
                className="w-full p-2.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none bg-slate-50 dark:bg-slate-800/80 border-blue-100 dark:border-blue-900/30 font-black text-slate-900 dark:text-slate-100 transition-all text-center tracking-[0.15em] text-base" 
                placeholder="Introduceți CNP (Opțional)" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Data Nașterii (Zi . Lună . An)
              </label>
              <div className="w-full p-2.5 border-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-center text-sm flex justify-center items-center gap-2 min-h-[44px]">
                {birthDateDetails ? (
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/10 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-lg font-black text-xs border border-blue-500/20">Zi: {birthDateDetails.day}</span>
                    <span className="bg-blue-500/10 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-lg font-black text-xs border border-blue-500/20">Lună: {birthDateDetails.month}</span>
                    <span className="bg-blue-500/10 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-lg font-black text-xs border border-blue-500/20">An: {birthDateDetails.year}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-medium text-xs italic">
                    Necompletată (dedusă din CNP sau programare)
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Număr Telefon Pacient <span className="text-[10px] font-normal normal-case text-slate-400 dark:text-slate-500">(Opțional)</span>
              </label>
              <input 
                type="text" 
                value={localPhone} 
                onChange={(e) => setLocalPhone(e.target.value)} 
                className="w-full p-2.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 outline-none bg-slate-50 dark:bg-slate-800/80 border-blue-100 dark:border-blue-900/30 font-bold text-slate-900 dark:text-slate-100 transition-all text-center text-base" 
                placeholder="07xxxxxxxx (Opțional)" 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Data Semnării GDPR</label>
              <input type="text" value={signatureDate} onChange={(e) => setSignatureDate(e.target.value)} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-center" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-300 space-y-4">
            <p>
              <strong>Subsemnatul(a)</strong> {patientName}, 
              {localCnp ? <> <strong>CNP</strong> {localCnp}, </> : <> <strong>CNP</strong> _____________, </>}
              {birthDateDetails ? <> <strong>Data Nașterii</strong> ({birthDateDetails.formatted}), </> : null}
              {localPhone ? <> <strong>Tel</strong> {localPhone}, </> : <> <strong>Tel</strong> _____________, </>}
              declar că am fost informat(ă) în mod clar, complet și inteligibil cu privire la prelucrarea datelor mele cu caracter personal de către cabinetul oftalmologic.
            </p>
            <p>Înțeleg că datele mele personale vor fi colectate și prelucrate în scopul furnizării serviciilor medicale, stabilirii diagnosticului, efectuării tratamentului și îndeplinirii obligațiilor legale ale cabinetului.</p>
            <p>Am fost informat(ă) că:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>datele mele vor fi stocate în condiții de siguranță și confidențialitate;</li>
              <li>datele pot fi comunicate către instituții publice sau alte entități autorizate, doar în condițiile legii;</li>
              <li>am dreptul de acces, rectificare, ștergere, restricționare a prelucrării, opoziție și portabilitate a datelor;</li>
              <li>am dreptul de a-mi retrage consimțământul în orice moment, fără a afecta legalitatea prelucrării efectuate anterior;</li>
              <li>am dreptul de a depune o plângere la autoritatea competentă privind protecția datelor.</li>
            </ul>
            <p>Prin semnarea prezentului document, îmi exprim consimțământul liber, specific, informat și neechivoc pentru prelucrarea datelor mele cu caracter personal în scopurile menționate mai sus.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Semnătura pacientului pe ecran</label>
              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={openWacomWindow}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 font-bold transition-all hover:scale-105 active:scale-95 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 shadow-sm"
                  title="Afișează textul GDPR și caseta de semnătură pe tableta Wacom conectată"
                >
                  <Monitor className="w-3.5 h-3.5" /> Aprinde Ecran Wacom Tablet
                </button>
                <button onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors">
                  <Trash2 className="w-3 h-3" /> Șterge semnătura
                </button>
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden h-40">
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
              />
            </div>
          </div>
          
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-900/40 rounded-xl text-sm font-bold leading-relaxed animate-fade-in text-center">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={generatePDF}
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              Descarcă PDF
            </button>

            {!!initialSignature && (
              <button
                type="button"
                onClick={handleRevoke}
                className="px-4 py-2.5 rounded-xl font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center gap-2 transition-all text-sm shadow-sm hover:scale-105 active:scale-95"
                title="Anulează / revocă acordul GDPR semnat în trecut de acest pacient"
              >
                <ShieldOff className="w-4 h-4 text-rose-500" />
                Anulează Acord GDPR (Revocare)
              </button>
            )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              Închide
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 text-sm active:scale-95"
            >
              Salvează
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
