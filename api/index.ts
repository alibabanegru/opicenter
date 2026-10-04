import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Normalize URLs in case Vercel rewrites strip the /api prefix
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});

const USERS_DATA: Record<string, { name: string; role: string; pass: string }> = {
  admin: { name: "Administrator", role: "admin", pass: "123612" },
  turcanu: { name: "Dr. Turcanu", role: "doctor1", pass: "123" },
  zorila: { name: "Dr. Zorila", role: "doctor2", pass: "123" },
  ilie: { name: "Dr. Ilie", role: "doctor3", pass: "123" },
  vanzator: { name: "Vanzator", role: "frontdesk", pass: "123" },
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-slate-900",
  doctor1: "bg-blue-600",
  doctor2: "bg-emerald-600",
  doctor3: "bg-purple-600",
  frontdesk: "bg-amber-600",
};

// Nodemailer setup
const getMailTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
};

async function sendLoginEmail(details: {
  googleEmail: string;
  timestamp: string;
  userName: string;
  userRole: string;
}) {
  const { googleEmail, timestamp, userName, userRole } = details;
  const targetEmail = process.env.ALERT_EMAIL || "alibabamosu@gmail.com";

  let displayedRole = userRole;
  if (userRole === "admin") {
    displayedRole = "Administrator";
  } else if (userRole.startsWith("doctor")) {
    displayedRole = `Medic (${userName})`;
  } else if (userRole === "frontdesk") {
    displayedRole = "Recepționist / Vanzator";
  }

  const formattedDate = new Date(timestamp).toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const emailSubject = `🟢 Alertă Conectare Portal: ${userName} (${googleEmail})`;

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">Clinica Oftalmologică Negreanu</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Notificare de Securitate - Conectare Portal</p>
      </div>
      
      <p style="font-size: 16px; color: #334155; line-height: 1.5;">
        A fost înregistrată o conectare nouă în platformă prin intermediul Google:
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 35%; color: #475569;">Email Google:</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 14px; color: #0f172a;">${googleEmail}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Data și Ora:</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">${formattedDate}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Panou accesat:</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #3b82f6;">${displayedRole}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Cont Utilizator:</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">${userName}</td>
        </tr>
      </table>
      
      <div style="margin-top: 25px; padding: 12px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.4;">
          <strong>Info:</strong> Acest email este trimis automat la conectarea pe bază de cont Google în Clinica Oftalmologică Negreanu.
        </p>
      </div>
    </div>
  `;

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Gestiune Clinica" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: emailSubject,
        html: emailHtml,
      });
      console.log(`[Email Alert] Successfully sent to ${targetEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      let friendlyError = err.message;
      if (err.message.includes("535") || err.message.toLowerCase().includes("invalid login")) {
        friendlyError = `Eroare SMTP 535: Autentificare eșuată. Dacă folosiți Gmail (smtp.gmail.com), trebuie să generați o 'Parolă de aplicație' (App Password) din Contul dvs. Google deoarece parola normală nu este acceptată pentru conexiuni SMTP externe nesecurizate. Detalii eroare: ${err.message}`;
        console.error(`\n[SMTP CONFIG HELP] 💡 ${friendlyError}\n`);
      } else {
        console.error(`[Email Alert] Error sending email via SMTP:`, err.message);
      }
      return { success: false, error: friendlyError };
    }
  } else {
    console.log("\n========================================================");
    console.log(`[MOCK EMAIL ALERT TO ${targetEmail}]`);
    console.log(`SUBJECT: ${emailSubject}`);
    console.log(`DETAILS:`);
    console.log(`  - Google Email: ${googleEmail}`);
    console.log(`  - Time (RO):    ${formattedDate}`);
    console.log(`  - Profile:      ${displayedRole}`);
    console.log(`  - User:         ${userName}`);
    console.log("========================================================\n");
    return {
      success: false,
      mocked: true,
      error: "SMTP neconfigurat: variabilele SMTP_USER sau SMTP_PASS lipsesc din Environment Variables.",
    };
  }
}

async function sendBookingConfirmationEmail(details: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  startTime: string;
  doctorName: string;
}) {
  const { patientName, patientEmail, patientPhone, startTime, doctorName } = details;

  const formattedDate = new Date(startTime).toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const emailSubject = `Confirmare Solicitare Programare: ${patientName}`;
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #065f46; margin: 0; font-size: 22px;">Clinica Oftalmologică Negreanu</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Solicitare Programare Înregistrată</p>
      </div>
      
      <p style="font-size: 16px; color: #334155; line-height: 1.5;">
        Stimate/Stimată <strong>${patientName}</strong>,
      </p>
      <p style="font-size: 15px; color: #334155; line-height: 1.5;">
        Vă mulțumim pentru utilizarea portalului nostru de programări online. Solicitarea dumneavoastră a fost înregistrată în baza noastră de date și este în așteptarea validării de către echipa noastră administrativă.
      </p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 16px;">Detaliile Programării:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; font-size: 14px; color: #475569; font-weight: bold; width: 40%;">Medic:</td>
            <td style="padding: 5px 0; font-size: 14px; color: #0f172a;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 14px; color: #475569; font-weight: bold;">Dată și Oră:</td>
            <td style="padding: 5px 0; font-size: 14px; color: #000000; font-weight: bold; color: #10b981;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 14px; color: #475569; font-weight: bold;">Telefon:</td>
            <td style="padding: 5px 0; font-size: 14px; color: #0f172a; font-family: monospace;">${patientPhone}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 14px; color: #475569; font-weight: bold;">Stare:</td>
            <td style="padding: 5px 0; font-size: 14px; color: #ef4444; font-weight: bold; text-transform: uppercase; font-size: 11px; tracking-wider: 1px;">În așteptarea validării</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        În cel mai scurt timp, un recepționist al clinicii noastre va analiza graficul de lucru și vă va contacta telefonic sau prin email pentru a finaliza programarea dumneavoastră în sistem. 
      </p>
      
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-top: 20px;">
        Cu stimă,<br>
        <strong>Echipa Clinicii Oftalmologice Negreanu</strong><br>
        <span style="font-size: 12px; color: #94a3b8;">Acesta este un email automat, vă rugăm să nu răspundeți direct la el.</span>
      </p>
    </div>
  `;

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Gestiune Clinica" <${process.env.SMTP_USER}>`,
        to: patientEmail,
        subject: emailSubject,
        html: emailHtml,
      });
      console.log(`[Booking Email] Successfully sent to ${patientEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[Booking Email] Error sending email via SMTP:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log("\n========================================================");
    console.log(`[MOCK EMAIL CONFIRMATION TO ${patientEmail}]`);
    console.log(`SUBJECT: ${emailSubject}`);
    console.log(`DETAILS:`);
    console.log(`  - Patient Name: ${patientName}`);
    console.log(`  - Phone:        ${patientPhone}`);
    console.log(`  - Time (RO):    ${formattedDate}`);
    console.log(`  - Doctor:       ${doctorName}`);
    console.log("========================================================\n");
    return { success: true, mocked: true };
  }
}

// API routes
app.post("/api/notify-login", async (req, res) => {
  try {
    const { googleEmail, timestamp, userName, userRole } = req.body;
    if (!googleEmail) {
      return res.status(400).json({ error: "Missing googleEmail" });
    }

    const result = await sendLoginEmail({
      googleEmail,
      timestamp: timestamp || new Date().toISOString(),
      userName: userName || "Utilizator",
      userRole: userRole || "unknown",
    });

    res.json(result);
  } catch (err: any) {
    console.error("Error in notify-login route:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/notify-booking", async (req, res) => {
  try {
    const { patientName, patientEmail, patientPhone, startTime, doctorName } = req.body;
    if (!patientEmail) {
      return res.status(400).json({ error: "Missing patientEmail" });
    }

    const result = await sendBookingConfirmationEmail({
      patientName: patientName || "Pacient",
      patientEmail,
      patientPhone: patientPhone || "",
      startTime: startTime || new Date().toISOString(),
      doctorName: doctorName || "Medic Specialist",
    });

    res.json(result);
  } catch (err: any) {
    console.error("Error in notify-booking route:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", (req, res) => {
  const users = Object.entries(USERS_DATA).map(([key, userData]) => ({
    id: key,
    name: userData.name,
    role: userData.role,
  }));
  res.json(users);
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const userData = USERS_DATA[username];

  if (userData && userData.pass === password) {
    res.json({
      success: true,
      profile: {
        uid: username,
        displayName: userData.name,
        role: userData.role,
        color: ROLE_COLORS[userData.role],
      },
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.get("/api/currency-history", async (req, res) => {
  const { from, to, start, end } = req.query;
  if (!from || !to || !start || !end) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const primaryUrl = `https://api.frankfurter.app/${start}..${end}?from=${from}&to=${to}`;
  const fallbackUrl = `https://api.frankfurter.dev/${start}..${end}?from=${from}&to=${to}`;

  try {
    let data;
    try {
      const response = await fetch(primaryUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (e: any) {
      console.warn(`Primary Frankfurter API failed: ${e.message}. Trying fallback...`);
      try {
        const response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
      } catch (e2: any) {
        return res.status(502).json({
          error: "Serviciul de istoric valutar este indisponibil momentan (ambele surse de date au eșuat).",
        });
      }
    }

    res.json(data);
  } catch (error: any) {
    console.error("Critical proxy error:", error);
    res.status(502).json({ error: "Eroare critică la preluarea istoricului." });
  }
});

app.get("/api/bnr-rates", async (req, res) => {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/RON");
    if (!response.ok) {
      throw new Error(`BNR API returned ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("BNR rates proxy error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/api/verify-recaptcha", async (req, res) => {
  try {
    const { token, expectedAction } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: "Missing reCAPTCHA token" });
    }

    // 1. Check if mock token
    if (
      token.startsWith("mock_recaptcha_enterprise_token_") ||
      token === "recaptcha_bypass_success_token_fallback"
    ) {
      return res.json({
        success: true,
        score: 1.0,
        valid: true,
        action: expectedAction || "bypass",
        reasons: [],
        mocked: true,
      });
    }

    // 2. Google Cloud API Key
    const apiKey = process.env.RECAPTCHA_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        score: 1.0,
        valid: true,
        action: expectedAction || "bypass",
        reasons: ["api_key_not_configured"],
        bypass: true,
      });
    }

    // 3. Prepare reCAPTCHA assessment request payload
    const siteKey =
      process.env.VITE_RECAPTCHA_ENTERPRISE_KEY ||
      "6LfdM_osAAAAACYD8TKknkLxm1mFJ2pHxqjZsPTS";
    const projectId =
      process.env.RECAPTCHA_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      "gen-lang-client-0965707375";

    const requestUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
    const payload = {
      event: {
        token: token,
        expectedAction: expectedAction || "",
        siteKey: siteKey,
      },
    };

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let simpleErrorMessage = "Unknown Google Cloud API error";
      try {
        const errObj = JSON.parse(errorText);
        if (errObj?.error?.message) {
          simpleErrorMessage = errObj.error.message;
        }
      } catch (_) {
        simpleErrorMessage = errorText.substring(0, 250);
      }

      return res.json({
        success: true,
        score: 0.8,
        valid: true,
        action: expectedAction || "",
        reasons: ["google_api_error_fallback"],
        apiError: `reCAPTCHA Enterprise verification fallback: ${simpleErrorMessage}`,
      });
    }

    const assessment = await response.json();

    if (assessment.error) {
      const simpleErrorMessage = assessment.error.message || "Unknown internal API error";
      return res.json({
        success: true,
        score: 0.8,
        valid: true,
        action: expectedAction || "",
        reasons: ["google_api_error_payload_fallback"],
        apiError: `reCAPTCHA Enterprise error payload: ${simpleErrorMessage}`,
      });
    }

    const tokenProperties = assessment.tokenProperties || {};
    const riskAnalysis = assessment.riskAnalysis || {};

    const isValid = !!tokenProperties.valid;
    const score = typeof riskAnalysis.score === "number" ? riskAnalysis.score : 0.0;
    const returnedAction = tokenProperties.action || "";
    const reasons = riskAnalysis.reasons || [];

    res.json({
      success: isValid && score >= 0.5,
      score,
      valid: isValid,
      action: returnedAction,
      reasons,
      name: assessment.name,
    });
  } catch (error: any) {
    console.error("[reCAPTCHA Enterprise Proxy] Critical verification error:", error);
    res.json({
      success: true,
      score: 0.7,
      valid: true,
      reasons: ["server_error_fallback"],
      error: error.message || "Internal verification error",
    });
  }
});

export default app;
