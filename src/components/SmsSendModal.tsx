import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";
import {
  checkSmsGateStatus,
  sendSmsViaGateway,
  removeRomanianDiacritics,
  SMS_PRESET_TEMPLATES,
  type SmsGateDevice,
} from "../services/smsService";

export interface SmsSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderNumber?: string;
    patientName?: string;
    patientPhone?: string;
    balance?: number;
    deliveryDate?: string;
    patientId?: string;
    smsNotifiedAt?: string;
    [key: string]: any;
  } | null;
  onSmsSent?: (info: {
    orderNumber: string;
    phone: string;
    message: string;
    timestamp: string;
  }) => void;
  darkMode?: boolean;
}

export const SmsSendModal: React.FC<SmsSendModalProps> = ({
  isOpen,
  onClose,
  order,
  onSmsSent,
  darkMode = false,
}) => {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("ready_pickup");
  const [stripDiacritics, setStripDiacritics] = useState(true);
  const [autoMarkReady, setAutoMarkReady] = useState(true);

  const [deviceStatus, setDeviceStatus] = useState<SmsGateDevice | null>(null);
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Initialize phone & default message when modal opens or order changes
  useEffect(() => {
    if (!isOpen || !order) return;

    setSendSuccess(null);
    setSendError(null);

    const initialPhone = (order.patientPhone || "").trim();
    setPhone(initialPhone);

    const defaultTpl = SMS_PRESET_TEMPLATES.find((t) => t.id === "ready_pickup") || SMS_PRESET_TEMPLATES[0];
    setSelectedTemplateId(defaultTpl.id);

    const rawMsg = defaultTpl.template({
      patientName: order.patientName,
      orderNumber: order.orderNumber,
      balance: order.balance,
      deliveryDate: order.deliveryDate,
    });

    setMessage(stripDiacritics ? removeRomanianDiacritics(rawMsg) : rawMsg);

    // Check device connection
    checkGateway();
  }, [isOpen, order]);

  // Handle template change
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!order) return;

    const tpl = SMS_PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      const generated = tpl.template({
        patientName: order.patientName,
        orderNumber: order.orderNumber,
        balance: order.balance,
        deliveryDate: order.deliveryDate,
      });
      setMessage(stripDiacritics ? removeRomanianDiacritics(generated) : generated);
    }
  };

  // Toggle diacritics
  const handleToggleDiacritics = (checked: boolean) => {
    setStripDiacritics(checked);
    if (checked) {
      setMessage((prev) => removeRomanianDiacritics(prev));
    }
  };

  const checkGateway = async () => {
    setIsCheckingDevice(true);
    setDeviceError(null);
    try {
      const status = await checkSmsGateStatus();
      if (status.success && status.device) {
        setDeviceStatus(status.device);
      } else {
        setDeviceStatus(null);
        setDeviceError(status.error || "Dispozitivul Android nu răspunde. Asigurați-vă că aplicația sms-gate.app rulează pe telefon.");
      }
    } catch (err: any) {
      setDeviceStatus(null);
      setDeviceError("Eroare verificare telefon.");
    } finally {
      setIsCheckingDevice(false);
    }
  };

  const handleSend = async () => {
    if (!phone.trim()) {
      setSendError("Introduceți un număr de telefon valid.");
      return;
    }
    if (!message.trim()) {
      setSendError("Mesajul SMS nu poate fi gol.");
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const finalMessage = stripDiacritics ? removeRomanianDiacritics(message) : message;
      const res = await sendSmsViaGateway({
        phone: phone.trim(),
        message: finalMessage,
      });

      if (res.success) {
        const nowIso = new Date().toISOString();
        setSendSuccess(`SMS expediat cu succes către ${res.recipient || phone}! Telefonul trimite mesajul.`);
        if (onSmsSent && order?.orderNumber) {
          onSmsSent({
            orderNumber: order.orderNumber,
            phone: phone.trim(),
            message: finalMessage,
            timestamp: nowIso,
          });
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setSendError(res.error || "Eroare la trimiterea SMS-ului.");
      }
    } catch (err: any) {
      setSendError(err.message || "A apărut o eroare neașteptată.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !order) return null;

  // Character calculation
  const charLength = message.length;
  const isUnicode = /[^\u0000-\u007F]/.test(message);
  const smsLimit = isUnicode ? 70 : 160;
  const numSms = Math.ceil(charLength / smsLimit) || 1;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-300 ${
          darkMode
            ? "bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/50"
            : "bg-white border-slate-200 text-slate-800 shadow-xl"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Notificare SMS Client</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  sms-gate.app
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comanda <span className="font-bold text-blue-600 dark:text-blue-400">#{order.orderNumber || "—"}</span> • {order.patientName || "Pacient"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gateway connection status badge */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isCheckingDevice ? (
              <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            ) : deviceStatus ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            )}
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {deviceStatus ? (
                <>
                  Telefon conectat: <strong className="text-slate-800 dark:text-slate-100">{deviceStatus.name}</strong>
                  {deviceStatus.simCards?.[0]?.carrierName && (
                    <span className="ml-1 text-[11px] text-slate-500">({deviceStatus.simCards[0].carrierName})</span>
                  )}
                </>
              ) : isCheckingDevice ? (
                "Se verifică telefonul conectat..."
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Conexiune activă Cloud Gateway</span>
              )}
            </span>
          </div>
          <button
            onClick={checkGateway}
            disabled={isCheckingDevice}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingDevice ? "animate-spin" : ""}`} />
            Reverifică
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Patient Phone Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Număr de telefon destinatar
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 0744123456 sau +40744123456"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                România (+40)
              </span>
            </div>
            {!phone && (
              <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Introduceți numărul de telefon al pacientului.
              </p>
            )}
          </div>

          {/* Preset templates selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Șabloane prestabilite de mesaje
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SMS_PRESET_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {tpl.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {tpl.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Conținut SMS
              </label>
              <span className={`text-[11px] font-bold ${
                numSms > 1 ? "text-amber-500" : "text-slate-400"
              }`}>
                {charLength} caractere • {numSms} SMS {isUnicode ? "(Unicode)" : "(GSM-7)"}
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSelectedTemplateId("custom");
              }}
              placeholder="Introduceți mesajul SMS..."
              className={`w-full p-3.5 rounded-2xl border text-sm leading-relaxed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Options: Diacritics & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stripDiacritics}
                onChange={(e) => handleToggleDiacritics(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Fără diacritice (recomandat: 1 SMS = 160 caractere)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoMarkReady}
                onChange={(e) => setAutoMarkReady(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Bifează automat "Gata de ridicare"
              </span>
            </label>
          </div>

          {/* Feedback banners */}
          {sendError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{sendError}</span>
            </div>
          )}

          {sendSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{sendSuccess}</span>
            </div>
          )}

          {order.smsNotifiedAt && !sendSuccess && (
            <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                Comanda are deja notificare SMS trimisă la {new Date(order.smsNotifiedAt).toLocaleString("ro-RO")}. Puteți retrimite dacă este necesar.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Închide
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !phone.trim() || !message.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Se transmite la telefon...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Trimite SMS ({phone ? phone.slice(-4) : "—"})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsSendModal;
