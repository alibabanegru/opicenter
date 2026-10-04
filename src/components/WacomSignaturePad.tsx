import React, { useRef, useState, useEffect } from "react";
import SignaturePad from "signature_pad";
import { compressSignatureCanvas } from "../lib/signatureUtils";
import { Trash2, CheckCircle2, Shield, PenTool, Monitor } from "lucide-react";

export function WacomSignaturePad() {
  const [patientName, setPatientName] = useState<string>("");
  const [patientCnp, setPatientCnp] = useState<string>("");
  const [status, setStatus] = useState<"standby" | "signing" | "success">("standby");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel("wacom_gdpr_sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === "init") {
        setPatientName(data.patientName || "");
        setPatientCnp(data.patientCnp || "");
        setStatus("signing");
      } else if (type === "reset") {
        setStatus("standby");
        setPatientName("");
        setPatientCnp("");
      }
    };

    // Tell the main window that the tablet screen is open and ready
    channel.postMessage({ type: "ready" });

    return () => {
      channel.close();
    };
  }, []);

  // Initialize SignaturePad when status is "signing"
  useEffect(() => {
    if (status === "signing" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      // Give browser time to lay out the canvas
      const timer = setTimeout(() => {
        if (!canvasRef.current) return;
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(ratio, ratio);
        }

        signaturePadRef.current = new SignaturePad(canvas, {
          backgroundColor: "rgba(255, 255, 255, 0)",
          penColor: "#0f172a", // Slate 900
          minWidth: 1.5,
          maxWidth: 4.5,
        });
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    // Notify main window
    channelRef.current?.postMessage({ type: "clear" });
  };

  const handleSave = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert("Vă rugăm să semnați înainte de a salva!");
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = compressSignatureCanvas(canvas, signaturePadRef.current.isEmpty());
    
    // Notify main window with the signature
    channelRef.current?.postMessage({
      type: "signature_saved",
      data: {
        signature: signatureDataUrl,
      },
    });

    setStatus("success");

    // Auto return to standby after 5 seconds
    const timer = setTimeout(() => {
      setStatus("standby");
      setPatientName("");
      setPatientCnp("");
    }, 5000);

    return () => clearTimeout(timer);
  };

  if (status === "standby") {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-slate-100 p-8 select-none">
        <div className="max-w-md w-full text-center space-y-8 animate-pulse">
          <div className="mx-auto w-24 h-24 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <Monitor className="w-12 h-12 text-indigo-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">
              Ecrane Semnătură Wacom
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Dispozitivul de semnătură digitală este pregătit. Vă rugăm să deschideți formularul GDPR pe ecranul principal pentru a începe semnarea.
            </p>
          </div>
          <div className="text-[11px] font-mono tracking-widest text-indigo-400 bg-indigo-500/10 py-2 px-4 rounded-xl inline-block border border-indigo-500/20">
            AȘTEPTARE PACIENT...
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-14 h-14 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">
              Vă mulțumim!
            </h1>
            <p className="text-emerald-400 font-bold text-lg">
              Semnătura dumneavoastră a fost salvată.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed pt-2">
              Documentul GDPR a fost înregistrat cu succes în baza de date a cabinetului. Această fereastră va reveni la ecranul de standby în câteva secunde.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-900 flex flex-col text-slate-900 dark:text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Banner */}
      <header className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-lg font-black uppercase tracking-wider text-white">
              CONSIMȚĂMÂNT GDPR
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              Acord de Prelucrare Date cu Caracter Personal
            </p>
          </div>
        </div>
        {patientName && (
          <div className="flex items-center gap-6 text-sm bg-slate-800/80 px-5 py-2.5 rounded-xl border border-slate-700/50 shadow-inner">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pacient
              </span>
              <span className="font-extrabold text-white text-base">
                {patientName}
              </span>
            </div>
            {patientCnp && (
              <div className="border-l border-slate-700 pl-6">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  CNP
                </span>
                <span className="font-bold text-indigo-300 font-mono tracking-widest text-base">
                  {patientCnp}
                </span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Terms Text */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200 dark:border-slate-800 flex flex-col space-y-6">
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/30 p-6 rounded-2xl shadow-sm text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed overflow-y-auto max-h-[60vh] custom-scrollbar">
            <p className="font-medium text-base text-slate-900 dark:text-white">
              Subsemnatul(a) <strong className="text-indigo-600 dark:text-indigo-400">{patientName}</strong>, având CNP <strong className="font-mono tracking-widest text-indigo-600 dark:text-indigo-400">{patientCnp || "_________"}</strong>, declar că am fost informat(ă) în mod clar, complet și inteligibil cu privire la prelucrarea datelor mele cu caracter personal de către cabinetul oftalmologic.
            </p>
            <p>
              Înțeleg că datele mele personale (inclusiv date de identificare, date de contact și date medicale) vor fi colectate și prelucrate în scopul furnizării serviciilor medicale, stabilirii diagnosticului, efectuării tratamentului și îndeplinirii obligațiilor legale ale cabinetului.
            </p>
            <p className="font-bold text-slate-900 dark:text-white">
              Am fost informat(ă) că:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>datele mele vor fi stocate în condiții de siguranță și confidențialitate în baza de date securizată a cabinetului;</li>
              <li>datele pot fi comunicate către instituții publice sau alte entități autorizate, doar în limitele și condițiile legii;</li>
              <li>am dreptul de acces, rectificare, ștergere, restricționare a prelucrării, opoziție și portabilitate a datelor conform regulamentului european GDPR;</li>
              <li>am dreptul de a-mi retrage consimțământul în orice moment, fără a afecta legalitatea prelucrării efectuate anterior;</li>
              <li>am dreptul de a depune o plângere la autoritatea competentă (ANSPDCP) dacă consider că drepturile mele au fost încălcate.</li>
            </ul>
            <p className="border-t border-slate-200 dark:border-slate-700 pt-4 font-semibold text-slate-900 dark:text-white">
              Prin semnarea prezentului document digital, îmi exprim consimțământul liber, specific, informat și neechivoc pentru prelucrarea datelor mele cu caracter personal în scopurile medicale menționate mai sus.
            </p>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-300/30 dark:border-slate-800/30">
            <PenTool className="w-5 h-5 text-indigo-500 shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">
              Folosiți stiloul digital furnizat împreună cu tableta Wacom One pentru a semna pe suprafața din dreapta, apoi apăsați butonul verde de confirmare.
            </p>
          </div>
        </div>

        {/* Right Pane - Signature Pad */}
        <div className="w-1/2 p-8 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest block">
                Semnătura Pacientului pe Tabletă
              </span>
              <button
                onClick={handleClear}
                className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-bold transition-all px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30"
              >
                <Trash2 className="w-4 h-4" /> ȘTERGE DESENUL
              </button>
            </div>

            {/* Responsive large canvas */}
            <div className="flex-1 bg-white border-2 border-slate-300 dark:border-slate-800 rounded-3xl overflow-hidden relative shadow-md focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-slate-300 dark:text-slate-800">
                <span className="text-7xl font-black uppercase tracking-[0.15em] opacity-40">
                  SEMNĂTURĂ
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest opacity-60 mt-2 text-slate-400 dark:text-slate-600">
                  Atingeți cu creionul Wacom și desenați
                </span>
              </div>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none absolute inset-0 z-10"
              />
            </div>
          </div>

          <div className="mt-8 shrink-0 flex justify-end">
            <button
              onClick={handleSave}
              className="w-full md:w-auto px-12 py-5 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/20 uppercase tracking-wider cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-white" />
              CONFIRMĂ ȘI SALVEAZĂ SEMNĂTURA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
