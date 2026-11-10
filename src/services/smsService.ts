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

export const SMS_PRESET_TEMPLATES = [
  {
    id: "ready_pickup",
    title: "👓 Gata de ridicare",
    description: "Notificare că ochelarii sunt gata pentru ridicare din clinică",
    template: (p: { patientName?: string; orderNumber?: string; balance?: number; clinicPhone?: string }) => {
      const namePart = p.patientName ? `Stimate/ă ${p.patientName.trim()}, ` : "Bună ziua, ";
      const orderPart = p.orderNumber ? `comanda dvs. de ochelari #${p.orderNumber}` : "comanda dvs. de ochelari";
      const balancePart = p.balance && p.balance > 0 ? ` Rest de plată: ${p.balance} lei.` : "";
      return `${namePart}${orderPart} este gata pentru ridicare la OptiCenter! Vă așteptăm cu drag.${balancePart} Nu răspundeți la acest SMS.`;
    },
  },
  {
    id: "order_registered",
    title: "📋 Înregistrare comandă",
    description: "Confirmare că ochelarii au intrat în lucru la atelier",
    template: (p: { patientName?: string; orderNumber?: string; deliveryDate?: string }) => {
      const namePart = p.patientName ? `Stimate/ă ${p.patientName.trim()}, ` : "Bună ziua, ";
      const orderPart = p.orderNumber ? `comanda dvs. de ochelari #${p.orderNumber}` : "comanda dvs. de ochelari";
      const datePart = p.deliveryDate ? ` Data estimată de finalizare: ${p.deliveryDate}.` : "";
      return `${namePart}${orderPart} a fost înregistrată cu succes la OptiCenter și a intrat în execuție.${datePart} Vă mulțumim!`;
    },
  },
  {
    id: "pickup_reminder",
    title: "🔔 Reamintire ridicare",
    description: "Reamintire pentru ochelari gata neridicați",
    template: (p: { patientName?: string; orderNumber?: string; balance?: number }) => {
      const namePart = p.patientName ? `Stimate/ă ${p.patientName.trim()}, ` : "Bună ziua, ";
      const balancePart = p.balance && p.balance > 0 ? ` Sold rămas: ${p.balance} lei.` : "";
      return `${namePart}vă reamintim că ochelarii dvs. sunt gata pentru ridicare la OptiCenter.${balancePart} Vă așteptăm!`;
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
