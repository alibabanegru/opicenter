import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  format, 
  parseISO, 
  startOfDay, 
  addDays, 
  getDay, 
  isAfter, 
  setHours, 
  setMinutes, 
  addMinutes, 
  isSameDay, 
  startOfWeek, 
  eachDayOfInterval,
  isBefore,
  differenceInYears
} from "date-fns";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Check, 
  Lock, 
  Shield, 
  LogOut, 
  Moon, 
  Sun, 
  Stethoscope, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Sparkles,
  Mail,
  HeartHandshake
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import SignaturePad from "signature_pad";

interface PatientPortalProps {
  db: any;
  appointments: any[];
  configs: any[];
  availableUsers: any[];
  profile: { uid: string; displayName: string; role: string; email?: string } | null;
  onSignOut: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  clinicConfig: any;
  symptomOptions?: string[];
}

const isValidPhone = (phone: string) => {
  if (!phone) return false;
  let digits = phone.replace(/\D/g, "");
  
  if (digits.startsWith("40") && digits.length > 10) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0040") && digits.length > 10) {
    digits = digits.slice(4);
  }

  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("2") || digits.startsWith("3"))) {
    digits = "0" + digits;
  }

  if (digits.length === 10) {
    return true;
  }
  return digits.length >= 10 && digits.length <= 15;
};

const formatPhoneNumber = (value: string) => {
  if (!value) return "";
  let s = value.replace(/\D/g, "");
  
  if (s.startsWith("40") && s.length > 10) {
    s = "0" + s.slice(2);
  } else if (s.startsWith("0040") && s.length > 10) {
    s = "0" + s.slice(4);
  }

  const isSpecial = s.startsWith("07") || s.startsWith("02") || s.startsWith("03");
  const maxLength = isSpecial ? 10 : 15;
  const digits = s.slice(0, maxLength);
  
  const groups = [];
  if (digits.length > 0) groups.push(digits.slice(0, 4));
  if (digits.length > 4) groups.push(digits.slice(4, 7));
  if (digits.length > 7) groups.push(digits.slice(7, 10));
  if (digits.length > 10) groups.push(digits.slice(10, 13));
  if (digits.length > 13) groups.push(digits.slice(13, 16));
  
  return groups.join(" ");
};

export function PatientPortal({
  db,
  appointments,
  configs,
  availableUsers,
  profile,
  onSignOut,
  darkMode,
  setDarkMode,
  clinicConfig,
  symptomOptions,
}: PatientPortalProps) {
  const patientEmail = profile?.email || (profile?.displayName?.includes("@") ? profile.displayName : "");

  // Target doctor selector
  const doctors = useMemo(() => {
    return availableUsers.filter((u) => u.role.startsWith("doctor") || u.role === "doctor1" || u.role === "doctor2" || u.role === "doctor3");
  }, [availableUsers]);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => {
    return doctors[0]?.role || "doctor1";
  });

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].role);
    }
  }, [doctors]);

  // Selected date for calendar view
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));

  // Active dates for the slider (Next 14 days)
  const carouselDays = useMemo(() => {
    const days = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 14; i++) {
      const day = addDays(today, i);
      if (getDay(day) !== 0) { // Exclude Sundays
        days.push(day);
      }
    }
    return days;
  }, []);

  // Set booking modal states
  const [selectedSlotTime, setSelectedSlotTime] = useState<Date | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientConfirmEmail, setPatientConfirmEmail] = useState("");
  const [patientBirthDate, setPatientBirthDate] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [patientSymptomSelect, setPatientSymptomSelect] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [patientCnp, setPatientCnp] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (selectedSlotTime && canvasRef.current) {
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
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [selectedSlotTime]);

  useEffect(() => {
    if (patientEmail) {
      setPatientConfirmEmail(patientEmail);
    }
  }, [patientEmail]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean | null>(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Get configuration of selected doctor
  const getDoctorConfig = (doctorId: string) => {
    const config = configs.find((c) => c.doctorId === doctorId);
    if (config) return config;

    // Use a clean fallback schedule matching standard behavior
    const fallbackDayConfigs = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isAvailable: i >= 1 && i <= 5, // Mon-Fri
      startHour: 9,
      endHour: 15,
      intervalMinutes: 30,
    }));

    return {
      doctorId,
      dayConfigs: fallbackDayConfigs,
      blockedDates: [],
    };
  };

  // Generate slots for selected date & doctor
  const slots = useMemo(() => {
    const config = getDoctorConfig(selectedDoctorId);
    const dayOfWeek = getDay(selectedDate);

    // Saturday special logic
    if (dayOfWeek === 6 && selectedDoctorId !== "admin") {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      if (!config.activeSaturdays?.includes(dateStr)) {
        return [];
      }
    }

    const dayConfig = config.dayConfigs[dayOfWeek];
    if (!dayConfig || !dayConfig.isAvailable || dayConfig.intervalMinutes <= 0) {
      return [];
    }

    const tempSlots = [];
    let current = setMinutes(
      setHours(startOfDay(selectedDate), dayConfig.startHour || 9),
      0
    );
    const end = setMinutes(
      setHours(startOfDay(selectedDate), dayConfig.endHour || 15),
      0
    );

    let iterations = 0;
    while (!isAfter(current, end) && iterations < 100) {
      tempSlots.push(new Date(current));
      current = addMinutes(current, dayConfig.intervalMinutes);
      iterations++;
    }

    return tempSlots.filter(s => isAfter(s, new Date())); // Filter out past slots today
  }, [selectedDoctorId, selectedDate, configs]);

  // Check if a slot is booked
  const isSlotBooked = (time: Date) => {
    return appointments.some(
      (app) =>
        app.doctorId === selectedDoctorId &&
        isSameDay(parseISO(app.startTime), time) &&
        format(parseISO(app.startTime), "HH:mm") === format(time, "HH:mm") &&
        (app.status === "scheduled" || app.status === "pending_validation")
    );
  };

  const getDoctorName = (doctorId: string) => {
    const docObj = doctors.find((u) => u.role === doctorId);
    return docObj ? docObj.name : "Medic Specialist";
  };

  const calculateAge = (bday: string) => {
    if (!bday) return "";
    try {
      const birth = new Date(bday);
      if (isNaN(birth.getTime())) return "";
      return differenceInYears(new Date(), birth).toString();
    } catch {
      return "";
    }
  };

  // Book execution
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedSlotTime) return;
    if (!patientName.trim()) {
      setFormError("Vă rugăm să introduceți numele dumneavoastră complet!");
      return;
    }
    if (!patientPhone.trim()) {
      setFormError("Vă rugăm să introduceți numărul dumneavoastră de telefon!");
      return;
    }

    if (!isValidPhone(patientPhone)) {
      setFormError("Numărul de telefon introdus este invalid! Vă rugăm să introduceți un număr de contact valid format din 10 cifre.");
      return;
    }

    const finalEmail = patientConfirmEmail.toLowerCase().trim();
    if (!finalEmail || !finalEmail.includes("@")) {
      setFormError("Vă rugăm să introduceți o adresă de email validă pe care să vă putem contacta.");
      return;
    }

    // GDPR validations
    if (!patientCnp.trim()) {
      setFormError("CNP-ul este obligatoriu pentru completarea formularului GDPR!");
      return;
    }
    if (patientCnp.trim().length !== 13) {
      setFormError("CNP-ul trebuie să aibă exact 13 cifre!");
      return;
    }

    const signature = signaturePadRef.current?.isEmpty() ? "" : signaturePadRef.current?.toDataURL() || "";
    if (!signature) {
      setFormError("Semnătura pe ecran este obligatorie pentru confirmarea acordului GDPR!");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Silent Check for the 1-hour cooldown condition
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const hasRecentBooking = appointments.some(app => {
        if (!app.createdAt) return false;
        const appEmail = (app.patientEmail || "").toLowerCase().trim();
        const isEmailMatch = appEmail === finalEmail;
        const createdDate = new Date(app.createdAt);
        return isEmailMatch && createdDate > oneHourAgo;
      });

      if (hasRecentBooking) {
        // Enforce the rule SILENTLY - do NOT output "Error: One booking per hour limit!"
        // Provide normal successful registration screen with "În așteptarea validării" message:
        setBookingSuccess(true);
        setBookingMessage("Solicitarea dumneavoastră de programare a fost salvată în sistem ca fiind în curs de procesare și validare de către clinica noastră. Un operator de la recepție vă va contacta în scurt timp telefonic pentru confirmare!");
        setIsSubmitting(false);
        return;
      }

      // 2. Normal Booking logic
      const calculatedAge = calculateAge(patientBirthDate);
      const appDuration = 30; // standard duration in minutes
      const endTime = addMinutes(selectedSlotTime, appDuration);

      // Save/Merge GDPR data to medicalRecords
      const recordId = `${patientName.trim()}_${patientPhone.trim()}`.replace(/\s+/g, "_").toLowerCase();
      const medRecordData = {
        id: recordId,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientCnp: patientCnp.trim(),
        patientBirthDate: patientBirthDate || "",
        patientSex: patientSex || "",
        gdprSigned: true,
        gdprSignature: signature,
        gdprSignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "medicalRecords", recordId), medRecordData, { merge: true });

      const appData = {
        patientName: patientName.trim(),
        patientAge: calculatedAge,
        patientBirthDate,
        patientPhone: patientPhone.trim(),
        patientSex,
        patientNotes: `[Programare Portal Pacient] ${patientNotes.trim()}`,
        patientSymptomSelect: patientSymptomSelect || "",
        patientSymptomText: "",
        patientEmail: finalEmail,
        doctorId: selectedDoctorId,
        startTime: selectedSlotTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "pending_validation",
        isOnline: true,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "appointments"), appData);

      // Trimite email de notificare catre pacient
      try {
        fetch("/api/notify-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientName: appData.patientName,
            patientEmail: appData.patientEmail,
            patientPhone: appData.patientPhone,
            startTime: appData.startTime,
            doctorName: getDoctorName(appData.doctorId),
          }),
        }).catch((e) => {
          console.error("Fetch email booking error:", e);
        });
      } catch (e) {
        console.error("Send email error:", e);
      }

      setBookingSuccess(true);
      setBookingMessage("Solicitarea dumneavoastră de programare online a fost înregistrată cu succes! Aceasta este în curs de validare de către un administrator al clinicii pentru a fi adăugată în calendar. Veți primi confirmarea în cel mai scurt timp.");
    } catch (err) {
      console.error("Booking portal error:", err);
      // Fallback
      setBookingSuccess(false);
      setBookingMessage("A apărut o problemă la înregistrarea programării. Vă rugăm să încercați din nou sau să telefonați clinicii!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBookingModal = () => {
    setSelectedSlotTime(null);
    setBookingSuccess(null);
    setBookingMessage("");
    setPatientName("");
    setPatientPhone("");
    setPatientBirthDate("");
    setPatientSex("");
    setPatientSymptomSelect("");
    setPatientNotes("");
    setPatientCnp("");
    setFormError(null);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Portal Header */}
      <header className={`border-b ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} sticky top-0 z-40 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {clinicConfig.logoUrl ? (
              <img
                src={clinicConfig.logoUrl}
                alt="Logo"
                className="h-9 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 bg-blue-600/10 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-500" />
              </div>
            )}
            <div>
              <h1 className={`text-base font-extrabold tracking-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                Opticenter Style
              </h1>
              <span className={`text-[9px] font-black uppercase tracking-widest block -mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Portal Pacienți
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark mode switcher toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl transition-all border ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400" : "bg-slate-50 border-slate-200 hover:bg-slate-130 text-slate-500"}`}
              title={darkMode ? "Activare Lumină" : "Activare Întuneric"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className={`hidden md:flex flex-col items-end text-right`}>
              <span className={`text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Conectat ca:</span>
              <span className="text-xs font-black text-blue-500 max-w-[150px] truncate">{patientEmail}</span>
            </div>

            <button
              onClick={onSignOut}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl outline-none transition-all ${darkMode ? "bg-rose-950/30 border border-rose-900/30 text-rose-400 hover:bg-rose-950/60" : "bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100"}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ieșire</span>
            </button>
          </div>
        </div>
      </header>

      {/* Portal Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Instructions and Selection Column */}
          <section className="lg:col-span-4 space-y-6">
            <div className={`p-6 rounded-3xl border transition-all ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className={`text-lg font-bold mb-2 ${darkMode ? "text-slate-100" : "text-slate-950"}`}>
                Bine ați venit în Portal!
              </h2>
              <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                Planificați-vă rapid o consultație oftalmologică sau o programare pentru reţete ochelari. Selectați medicul preferat, data dorită și alegeți un interval orar liber.
              </p>

              <div className="mt-5 pt-5 border-t border-slate-200/10 grid grid-cols-1 gap-3.5 text-left">
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className={`text-[11px] font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Vizualizați exclusiv orele disponibile, restul fiind protejate.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span className={`text-[11px] font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Toate informațiile personale transmise sunt securizate.
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor Select Card */}
            <div className={`p-6 rounded-3xl border transition-all ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
              <label className={`text-[10px] font-black uppercase tracking-wider block mb-3.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Selectați Medicul Specializat:
              </label>
              
              <div className="space-y-3">
                {doctors.map((docObj) => (
                  <button
                    key={docObj.role}
                    onClick={() => setSelectedDoctorId(docObj.role)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all outline-none ${selectedDoctorId === docObj.role ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10" : darkMode ? "bg-slate-850/50 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedDoctorId === docObj.role ? "bg-white/20" : "bg-slate-500/10 text-slate-400"}`}>
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black block">{docObj.name}</span>
                        <span className={`text-[9px] block ${selectedDoctorId === docObj.role ? "text-blue-100" : "text-slate-400"}`}>
                          Medic Specialist
                        </span>
                      </div>
                    </div>
                    {selectedDoctorId === docObj.role && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Calendar Slots and Scheduler Column */}
          <section className="lg:col-span-8 space-y-6">
            {/* Quick date selector */}
            <div className={`p-6 rounded-3xl border transition-all ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Alegeți Data Consultației:
                </h3>
                <span className={`text-[11px] font-bold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {format(selectedDate, "eeee, d  MMMM  yyyy")}
                </span>
              </div>

              {/* Slider Carousel for next 14 clinical booking days */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                {carouselDays.map((day) => {
                  const isCurSelected = isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`min-w-[70px] py-3.5 px-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all scroll-mx-4 snap-start cursor-pointer outline-none ${isCurSelected ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10" : darkMode ? "bg-slate-850/60 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-205 text-slate-600 hover:bg-slate-100"}`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-wider ${isCurSelected ? "text-white/80" : "text-slate-400"}`}>
                        {format(day, "eee")}
                      </span>
                      <span className="text-base font-black">
                        {format(day, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of slots with status mask (Busy vs Available, absolutely no customer details) */}
            <div className={`p-6 rounded-3xl border transition-all ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-blue-500" />
                <h3 className={`text-sm font-black uppercase tracking-wider ${darkMode ? "text-slate-200" : "text-slate-850"}`}>
                  Intervalul Orar Disponibil la {getDoctorName(selectedDoctorId)}
                </h3>
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className={`text-xs font-bold leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Nu sunt intervale disponibile sau medicul nu are program stabilit în această zi. <br />
                    Vă rugăm să alegeți o altă dată!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const booked = isSlotBooked(slot);
                    return (
                      <button
                        key={slot.toISOString()}
                        disabled={booked}
                        onClick={() => setSelectedSlotTime(slot)}
                        className={`p-4 rounded-2xl border text-center transition-all outline-none flex flex-col items-center justify-center gap-1 relative overflow-hidden ${booked ? "bg-slate-100/40 border-slate-200 dark:bg-slate-950/20 dark:border-slate-850 text-slate-400 dark:text-slate-500" : "cursor-pointer hover:scale-[1.02] border-emerald-500/50 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"}`}
                      >
                        <span className="text-xs font-black block tracking-tight">
                          {format(slot, "HH:mm")}
                        </span>
                        
                        <div className="flex items-center gap-1 mt-0.5 justify-center">
                          {booked ? (
                            <>
                              <Lock className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Ocupat</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Disponibil</span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Booking Form Overlay Drawer/Modal */}
      <AnimatePresence>
        {selectedSlotTime && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-xl w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} max-h-[90vh] flex flex-col`}
            >
              {bookingSuccess === null ? (
                <>
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md block w-max mb-1">Pasul Final</span>
                      <h3 className="text-base font-black leading-none">Confirmare Programare</h3>
                    </div>
                    <button
                      onClick={handleCloseBookingModal}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleConfirmBooking} className="flex-1 flex flex-col min-h-0 space-y-4">
                    <div className="overflow-y-auto flex-1 pr-1.5 space-y-4 scrollbar-thin">
                      <div className={`p-4 rounded-2xl space-y-2 border ${darkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50 border-slate-150"} shrink-0`}>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={darkMode ? "text-slate-400" : "text-slate-500"}>Medic Specialist:</span>
                          <span className="font-extrabold">{getDoctorName(selectedDoctorId)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={darkMode ? "text-slate-400" : "text-slate-500"}>Data Programării:</span>
                          <span className="font-extrabold">{format(selectedSlotTime, "d  MMMM  yyyy")}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={darkMode ? "text-slate-400" : "text-slate-500"}>Ora Consultației:</span>
                          <span className="font-extrabold text-blue-500">{format(selectedSlotTime, "HH:mm")}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Nume complet pacient *</label>
                        <input
                          required
                          type="text"
                          placeholder="Numele dumneavoastră"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200"}`}
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Număr telefon de contact *</label>
                        <input
                          required
                          type="tel"
                          placeholder="Ex: 0722 123 456"
                          value={formatPhoneNumber(patientPhone)}
                          onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, ""))}
                          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200"}`}
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Adresă de Email de contact *</label>
                        <input
                          required
                          type="email"
                          placeholder="nume@exemplu.com"
                          value={patientConfirmEmail}
                          onChange={(e) => setPatientConfirmEmail(e.target.value)}
                          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200"}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Data Nașterii</label>
                          <input
                            type="date"
                            value={patientBirthDate}
                            onChange={(e) => setPatientBirthDate(e.target.value)}
                            className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${darkMode ? "bg-slate-950 border-slate-850 text-slate-300" : "bg-white border-slate-200"}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sex (Opțional)</label>
                          <select
                            value={patientSex}
                            onChange={(e) => setPatientSex(e.target.value)}
                            className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${darkMode ? "bg-slate-950 border-slate-850 text-slate-300" : "bg-white border-slate-200"}`}
                          >
                            <option value="">Alegeți...</option>
                            <option value="Masculin">Masculin</option>
                            <option value="Feminin">Feminin</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Simptome / Motiv vizită (Opțional)</label>
                        <select
                          value={patientSymptomSelect}
                          onChange={(e) => setPatientSymptomSelect(e.target.value)}
                          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${darkMode ? "bg-slate-950 border-slate-850 text-slate-300" : "bg-white border-slate-200"}`}
                        >
                          <option value="">Alegeți un motiv din listă...</option>
                          {(symptomOptions || [
                            "Schimbarea de ochelari",
                            "Prescriptie Lentile de contact",
                            "Vedere incetosata",
                            "Scaderea acuitatii vizuale la aproape",
                            "Scaderea acuitatii vizuale la distanta",
                            "Durere de cap (cefalee)",
                            "Durere oculara",
                            "Senzatie de corp strain in ochi",
                            "Ochi rosii",
                            "Lacrimare excesiva",
                            "Mancarime oculara",
                            "Secretii oculare",
                            "Uscaciune oculara",
                            "Umflarea ploapei/lor",
                            "Cadetea ploapei (ptoza)",
                            "Aparitia unor pete negre plutitoare (musculite zburătoare)",
                            "Fulgeratii luminoase (fotopsii)",
                            "Dificultati de focalizare",
                            "Oboseala oculara(astenopie)",
                            "Halouri in jurul luminilor",
                            "Dificultati la diferentierea culorilor",
                            "Traumatisme oculare sau suspiciune de corp strain cornean",
                            "Necesitatea apropierii excesive de obiecte (carti, ecrane)",
                            "Clipit excesiv (blefarospasm)",
                          ]).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Alte Observații sau detalii (Opțional)</label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Consult periodic ochelari sau trimitere medicală"
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all resize-none ${darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200"}`}
                        />
                      </div>

                      {/* GDPR Module */}
                      <div className={`p-4 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/40">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-xs font-extrabold uppercase tracking-wide">Acord de Confidențialitate (GDPR) *</h4>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CNP Pacient *</label>
                          <input
                            required
                            type="text"
                            placeholder="Introduceți CNP de 13 cifre"
                            value={patientCnp}
                            onChange={(e) => setPatientCnp(e.target.value.replace(/\D/g, ''))}
                            maxLength={13}
                            className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-250"}`}
                          />
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl text-[10px] text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto space-y-2 border border-slate-200/60 dark:border-slate-800 leading-normal">
                          <p><strong>Subsemnatul(a)</strong> {patientName || "_________________________"}, <strong>CNP</strong> {patientCnp || "_________________________"}, declar că am fost informat(ă) în mod clar, complet și inteligibil cu privire la prelucrarea datelor mele cu caracter personal de către cabinetul oftalmologic.</p>
                          <p>Înțeleg că datele mele personale (inclusiv date de identificare, date de contact și date medicale) vor fi colectate și prelucrate în scopul furnizării serviciilor medicale, stabilirii diagnosticului, efectuării tratamentului și îndeplinirii obligațiilor legale ale cabinetului.</p>
                          <p>Am fost informat(ă) că:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>datele mele vor fi stocate în condiții de siguranță și confidențialitate;</li>
                            <li>datele pot fi comunicate către instituții publice sau alte entități autorizate, doar în condițiile legii;</li>
                            <li>am dreptul de acces, rectificare, ștergere, restricționare a prelucrării, opoziție și portabilitate a datelor;</li>
                            <li>am dreptul de a-mi retrage consimțământul în orice moment, fără a afecta legalitatea prelucrării efectuate anterior;</li>
                            <li>am dreptul de a depune o plângere la autoritatea competentă privind protecția datelor.</li>
                          </ul>
                          <p>Prin semnarea prezentului document, îmi exprim consimțământul liber, specific, informat și neechivoc pentru prelucrarea datelor mele cu caracter personal în scopurile menționate mai sus.</p>
                        </div>

                        <div className="space-y-2 text-left">
                          <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Semnătura dumneavoastră pe ecran *</label>
                            <button
                              type="button"
                              onClick={() => signaturePadRef.current?.clear()}
                              className="text-[10px] text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              Șterge semnătura
                            </button>
                          </div>
                          <div className="border-2 border-dashed border-slate-355 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden h-28 relative">
                            <canvas
                              ref={canvasRef}
                              className="w-full h-full cursor-crosshair touch-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-left">
                          <input
                            id="gdprAgreeCheckbox"
                            required
                            type="checkbox"
                            className="mt-0.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                          />
                          <label htmlFor="gdprAgreeCheckbox" className={`text-[10px] font-black leading-normal cursor-pointer select-none ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            Sunt de acord cu prelucrarea datelor cu caracter personal conform GDPR și declar că datele introduse sunt corecte și complete. *
                          </label>
                        </div>
                      </div>

                    </div>

                    {formError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-bold rounded-xl text-left leading-relaxed flex items-start gap-2 shrink-0">
                        <span className="shrink-0 mt-0.5">⚠️</span>
                        <span>{formError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-b-white animate-spin"></span>
                      ) : (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Confirmați Rezervarea</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 space-y-4 shrink-0">
                  <div className="w-16 h-16 bg-emerald-555 rounded-full flex items-center justify-center mx-auto bg-emerald-500">
                    <Check className="w-10 h-10 text-white stroke-[3px]" />
                  </div>
                  
                  <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    Rezervare Înregistrată!
                  </h3>

                  <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-650"}`}>
                    {bookingMessage}
                  </p>

                  <button
                    onClick={handleCloseBookingModal}
                    className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all outline-none"
                  >
                    Închide Fereastra
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Corporate footer */}
      <footer className={`border-t py-6 text-center text-[10px] font-bold ${darkMode ? "bg-slate-950 border-slate-900 text-slate-600" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Copyright © 2026 Opticenter Style . Toate drepturile rezervate.</p>
          <div className="flex items-center gap-1.5 justify-center">
            <Shield className="w-3.5 h-3.5 text-blue-500/80 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-wider">Conexiune criptată și securizată SSL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
