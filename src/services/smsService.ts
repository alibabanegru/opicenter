// Serviciu de trimitere SMS prin SMS Gateway for Android (sms-gate.app)

export interface SmsGateDevice {
  id: string;
  name: string;
  lastSeen?: string;
  simCards?: Array<{
    slotIndex: number;
    simNumber: number;
    phoneNumber?: string;
    carrierName?: string;
  }>;
}

export interface SmsGateStatusResponse {
  success: boolean;
  connected: boolean;
  device?: SmsGateDevice | null;
  allDevices?: SmsGateDevice[];
  error?: string;
}

export interface SendSmsParams {
  phone: string;
  message: string;
  deviceId?: string;
  simNumber?: number;
}

export interface SendSmsResponse {
  success: boolean;
  recipient?: string;
  result?: any;
  error?: string;
}

export const removeRomanianDiacritics = (str: string): string => {
  return str
    .replace(/[ăâ]/g, "a")
    .replace(/[ĂÂ]/g, "A")
    .replace(/[șş]/g, "s")
    .replace(/[ȘŞ]/g, "S")
    .replace(/[țţ]/g, "t")
    .replace(/[ȚŢ]/g, "T")
    .replace(/î/g, "i")
    .replace(/Î/g, "I");
};

export const DEFAULT_RAW_TEMPLATES: Record<string, string> = {
  ready_pickup: "Stimate/ă {NUME}, comanda dvs. de ochelari #{COMANDA} este gata pentru ridicare la OptiCenter! Vă așteptăm cu drag.{REST_PLATA} Nu răspundeți la acest SMS.",
  order_registered: "Stimate/ă {NUME}, comanda dvs. de ochelari #{COMANDA} a fost înregistrată cu succes la OptiCenter și a intrat în execuție.{DATA_LIVRARE} Vă mulțumim!",
  pickup_reminder: "Stimate/ă {NUME}, vă reamintim că ochelarii dvs. sunt gata pentru ridicare la OptiCenter.{REST_PLATA} Vă așteptăm!",
};

export function getSavedRawTemplates(): Record<string, string> {
  try {
    const saved = localStorage.getItem("opticenter_custom_sms_templates");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_RAW_TEMPLATES, ...parsed };
    }
  } catch (e) {
    console.warn("Could not read custom SMS templates from localStorage:", e);
  }
  return { ...DEFAULT_RAW_TEMPLATES };
}

export function saveCustomRawTemplates(templates: Record<string, string>): void {
  try {
    localStorage.setItem("opticenter_custom_sms_templates", JSON.stringify(templates));
  } catch (e) {
    console.warn("Could not save SMS templates to localStorage:", e);
  }
}

export function resetCustomRawTemplates(): Record<string, string> {
  try {
    localStorage.removeItem("opticenter_custom_sms_templates");
  } catch {}
  return { ...DEFAULT_RAW_TEMPLATES };
}

export function renderSmsTemplate(
  templateStr: string,
  params: {
    patientName?: string;
    orderNumber?: string;
    balance?: number;
    deliveryDate?: string;
  }
): string {
  const namePart = (params.patientName && params.patientName.trim()) || "Pacient";
  const orderPart = params.orderNumber || "—";
  const balancePart = params.balance && params.balance > 0 ? ` Rest de plată: ${params.balance} lei.` : "";
  const datePart = params.deliveryDate ? ` Data estimată: ${params.deliveryDate}.` : "";

  let result = templateStr
    .replace(/\{NUME\}/g, namePart)
    .replace(/\{PATIENT_NAME\}/g, namePart)
    .replace(/\{COMANDA\}/g, orderPart)
    .replace(/\{ORDER_NUM\}/g, orderPart)
    .replace(/\{REST_PLATA\}/g, balancePart)
    .replace(/\{BALANCE\}/g, balancePart)
    .replace(/\{DATA_LIVRARE\}/g, datePart)
    .replace(/\{DELIVERY_DATE\}/g, datePart);

  return result.replace(/\s+/g, " ").trim();
}

export const SMS_PRESET_TEMPLATES = [
  {
    id: "ready_pickup",
    title: "👓 Gata de ridicare",
    description: "Notificare că ochelarii sunt gata pentru ridicare din clinică",
    template: (p: { patientName?: string; orderNumber?: string; balance?: number; clinicPhone?: string; deliveryDate?: string }) => {
      const currentTemplates = getSavedRawTemplates();
      const raw = currentTemplates.ready_pickup || DEFAULT_RAW_TEMPLATES.ready_pickup;
      return renderSmsTemplate(raw, p);
    },
  },
  {
    id: "order_registered",
    title: "📋 Înregistrare comandă",
    description: "Confirmare că ochelarii au intrat în lucru la atelier",
    template: (p: { patientName?: string; orderNumber?: string; balance?: number; clinicPhone?: string; deliveryDate?: string }) => {
      const currentTemplates = getSavedRawTemplates();
      const raw = currentTemplates.order_registered || DEFAULT_RAW_TEMPLATES.order_registered;
      return renderSmsTemplate(raw, p);
    },
  },
  {
    id: "pickup_reminder",
    title: "🔔 Reamintire ridicare",
    description: "Reamintire pentru ochelari gata neridicați",
    template: (p: { patientName?: string; orderNumber?: string; balance?: number; clinicPhone?: string; deliveryDate?: string }) => {
      const currentTemplates = getSavedRawTemplates();
      const raw = currentTemplates.pickup_reminder || DEFAULT_RAW_TEMPLATES.pickup_reminder;
      return renderSmsTemplate(raw, p);
    },
  },
];

/**
 * Verifică starea telefonului/gateway-ului conectat
 */
export async function checkSmsGateStatus(): Promise<SmsGateStatusResponse> {
  try {
    const res = await fetch("/api/sms-status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      connected: false,
      error: err.message || "Eroare rețea la verificarea stării gateway-ului.",
    };
  }
}

/**
 * Trimite un SMS prin cloud server sms-gate.app către telefonul Android conectat
 */
export async function sendSmsViaGateway(params: SendSmsParams): Promise<SendSmsResponse> {
  try {
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Eroare server (status ${res.status})`,
        result: data,
      };
    }

    return {
      success: true,
      recipient: data.recipient,
      result: data.result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Eroare conexiune la trimiterea SMS-ului.",
    };
  }
}
