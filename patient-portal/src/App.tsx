import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, onSnapshot, doc, addDoc } from "firebase/firestore";
import { PatientPortal } from "./components/PatientPortal";
import { Mail, Shield, Sparkles, HeartHandshake } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserProfile {
  uid: string;
  displayName: string;
  role: "patient";
  color: string;
  email?: string;
}

export default function App() {
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientLoginEmail, setPatientLoginEmail] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("clinic_darkMode");
    return saved === "true";
  });

  // Database States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [clinicConfig, setClinicConfig] = useState<any>({
    name: "OptiCenter",
    phone: "0700 000 000",
    address: "București, România",
    email: "contact@opticenter.ro",
    logoUrl: "",
    allowPatientBooking: true,
  });

  // Default Symptom Options matching the main app
  const symptomOptionsState = [
    "Consult Optometric",
    "Consult Oftalmologic",
    "Control Periodic",
    "Urgență",
    "Altele"
  ];

  // Dark Mode Sync
  useEffect(() => {
    localStorage.setItem("clinic_darkMode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setGoogleUser(user);

        // Load saved profile or generate one
        const savedProfileStr = localStorage.getItem("patient_portal_user");
        let currentProfile: UserProfile | null = null;
        if (savedProfileStr) {
          try {
            currentProfile = JSON.parse(savedProfileStr);
          } catch {}
        }

        if (!currentProfile) {
          const email = user.email || "pacient@opticenter.ro";
          currentProfile = {
            uid: "patient_" + email,
            displayName: user.displayName || email,
            role: "patient",
            color: "bg-blue-600",
            email: email,
          };
          localStorage.setItem("patient_portal_user", JSON.stringify(currentProfile));
        }

        setProfile(currentProfile);

        // Log connection in firestore
        try {
          addDoc(collection(db, "connection_logs"), {
            userId: currentProfile.uid,
            userName: currentProfile.displayName,
            userRole: "patient",
            googleEmail: currentProfile.email,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.error("Error logging connection:", e);
        }
      } else {
        const savedProfileStr = localStorage.getItem("patient_portal_user");
        let isPatientProfile = false;
        if (savedProfileStr) {
          try {
            const savedProfile = JSON.parse(savedProfileStr);
            if (savedProfile?.role === "patient") {
              isPatientProfile = true;
              setProfile(savedProfile);
              // Mock googleUser to bypass login screen for persistent patient sessions
              setGoogleUser({
                uid: savedProfile.uid,
                email: savedProfile.email,
                displayName: savedProfile.displayName,
              });
            }
          } catch {}
        }

        if (!isPatientProfile) {
          setGoogleUser(null);
          setProfile(null);
          localStorage.removeItem("patient_portal_user");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Real-time Subscriptions (Active only when authenticated)
  useEffect(() => {
    if (!profile) return;

    // Available doctors / users
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const dbUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        dbUsers.sort((a, b) => {
          const orderA = a.order ?? 999;
          const orderB = b.order ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
        });
        setAvailableUsers(dbUsers);
      },
      (error) => console.error("Error listening users:", error)
    );

    // Appointments (to prevent double bookings and show patient lists)
    const unsubAppointments = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        setAppointments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error("Error listening appointments:", error)
    );

    // Doctor schedules / configs
    const unsubConfigs = onSnapshot(
      collection(db, "configs"),
      (snapshot) => {
        setConfigs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error("Error listening configs:", error)
    );

    // General Clinic configurations
    const unsubClinicConfig = onSnapshot(
      doc(db, "settings", "clinic"),
      (snapshot) => {
        if (snapshot.exists()) {
          setClinicConfig(snapshot.data());
        }
      },
      (error) => console.error("Error listening clinic settings:", error)
    );

    return () => {
      unsubUsers();
      unsubAppointments();
      unsubConfigs();
      unsubClinicConfig();
    };
  }, [profile]);

  const handlePatientEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = patientLoginEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      alert("Vă rugăm să introduceți o adresă de email validă!");
      return;
    }

    const newProfile: UserProfile = {
      uid: "patient_" + email,
      displayName: email,
      role: "patient",
      color: "bg-blue-600",
      email: email,
    };

    localStorage.setItem("patient_portal_user", JSON.stringify(newProfile));
    setProfile(newProfile);
    setGoogleUser({
      uid: "patient_" + email,
      email: email,
      displayName: email,
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Error signing in with Google:", err);
      alert("Autentificarea cu Google a eșuat!");
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setGoogleUser(null);
    setProfile(null);
    localStorage.removeItem("patient_portal_user");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!googleUser || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl text-center">
          <div className="flex flex-col items-center mb-6">
            {clinicConfig?.logoUrl ? (
              <img
                src={clinicConfig.logoUrl}
                alt="Logo"
                className="h-16 w-auto object-contain mb-3"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
                <HeartHandshake className="text-white w-8 h-8" />
              </div>
            )}
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
              {clinicConfig?.name || "OptiCenter"}
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-1">
              Portal Pacienți
            </p>
          </div>

          <form onSubmit={handlePatientEmailLogin} className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continuă cu Google</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                sau cu Email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Adresă de Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  placeholder="ex: prenume.nume@gmail.com"
                  value={patientLoginEmail}
                  onChange={(e) => setPatientLoginEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Autentificare Email</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Conexiune securizată SSL</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PatientPortal
      db={db}
      appointments={appointments}
      configs={configs}
      availableUsers={availableUsers}
      profile={profile}
      onSignOut={handleSignOut}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      clinicConfig={clinicConfig}
      symptomOptions={symptomOptionsState}
    />
  );
}
