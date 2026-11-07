import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Copy, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "../appConstants";
import {
  cleanWhatsAppPhone,
  stripDiacritics,
  normalizeRomanianDiacritics,
  buildWhatsAppUrl,
  openWhatsAppUrl,
} from "../utils/whatsappUtils";

export interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  recipient: { name: string; phone: string; [key: string]: any } | null;
  templateType: "next_appointment" | "simple_reminder" | "custom";
  setTemplateType: (t: "next_appointment" | "simple_reminder" | "custom") => void;
  messageText: string;
  setMessageText: (text: string) => void;
  applyTemplate: (
    type: "next_appointment" | "simple_reminder" | "custom",
    name: string
  ) => void;
  formatPhoneNumber: (phone: string) => string;
  logActivity: (action: string, details: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  recipient,
  templateType,
  setTemplateType: _setTemplateType,
  messageText,
  setMessageText,
  applyTemplate,
  formatPhoneNumber,
  logActivity,
}) => {
  if (!recipient) return null;

  const [copiedText, setCopiedText] = useState(false);
  const [stripDiacriticsOption, setStripDiacriticsOption] = useState<boolean>(() => {
    try {
      return localStorage.getItem("clinic_setting_whatsapp_strip_diacritics") === "true";
    } catch {
      return false;
    }
  });

  const phoneValidation = cleanWhatsAppPhone(recipient.phone);

  const handleToggleDiacritics = (checked: boolean) => {
    setStripDiacriticsOption(checked);
    try {
      localStorage.setItem("clinic_setting_whatsapp_strip_diacritics", String(checked));
    } catch {}
    if (checked) {
      setMessageText(stripDiacritics(messageText));
    }
  };

  const handleCopyText = async () => {
    const textToCopy = stripDiacriticsOption
      ? stripDiacritics(messageText)
      : normalizeRomanianDiacritics(messageText);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (e) {
      console.warn("Could not copy message text to clipboard:", e);
    }
  };

  const handleSend = () => {
    const { url, cleanPhone, sanitizedMessage } = buildWhatsAppUrl(
      recipient.phone,
      messageText,
      { removeDiacritics: stripDiacriticsOption }
    );

    const opened = openWhatsAppUrl(url);
    if (!opened) {
      // Popup blocked fallback: copy message automatically to clipboard
      navigator.clipboard?.writeText(sanitizedMessage);
      alert(
        "Fereastra pop-up WhatsApp a fost blocată de browser. Mesajul a fost copiat în clipboard! Puteți deschide manual WhatsApp și lipi mesajul (Ctrl+V)."
      );
    }

    onClose();
    logActivity(
      "Trimitere Notificare WhatsApp",
      `Mesaj trimis către ${recipient.name} (${cleanPhone || recipient.phone})`
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="whatsapp-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[85]"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className={cn(
              "rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border transition-all",
              darkMode
                ? "bg-slate-900 border-slate-800 text-slate-100"
                : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-[#25D366]">
                  <MessageSquare className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    Trimite Notificare WhatsApp
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Către: <strong>{recipient.name}</strong> ({formatPhoneNumber(recipient.phone)})
                    </p>
                    {phoneValidation.isValid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3" />
                        +{phoneValidation.cleanPhone}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-3 h-3" />
                        {phoneValidation.error || "Număr neverificat"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Șablon Mesaj
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate("next_appointment", recipient.name)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    templateType === "next_appointment"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  Programare Următoare
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("simple_reminder", recipient.name)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    templateType === "simple_reminder"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  Notificare Simplă
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("custom", recipient.name)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    templateType === "custom"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  Personalizat
                </button>
              </div>
            </div>

            {/* Message Textarea */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Conținut Mesaj (Editabil)
                </label>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Copiază conținutul mesajului în clipboard"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copiat!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiază Text</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className={cn(
                  "w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-medium outline-none transition-all resize-none custom-scrollbar",
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                )}
                placeholder="Scrieți mesajul pentru WhatsApp..."
              />
            </div>

            {/* Diacritics compatibility toggle */}
            <div className="mb-5 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stripDiacriticsOption}
                  onChange={(e) => handleToggleDiacritics(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fără diacritice (compatibilitate 100% WhatsApp Desktop & SMS)
                </span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Previne caracterele corupte
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!messageText.trim()}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95",
                  !messageText.trim()
                    ? "bg-slate-500 opacity-50 cursor-not-allowed"
                    : "bg-[#25D366] hover:bg-[#20ba5a] shadow-emerald-500/25"
                )}
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Deschide WhatsApp</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppModal;
