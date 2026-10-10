import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  Calendar,
  Cake,
  ChevronUp,
  ChevronDown,
  FileText,
  Pencil,
  MessageSquare,
  Trash2,
} from "lucide-react";
import {
  format,
  parseISO,
  isSameDay,
  isAfter,
  isBefore,
  addHours,
  startOfDay,
  differenceInYears,
} from "date-fns";
import { ro } from "date-fns/locale";
import {
  cn,
  matchPatientName,
  ROLE_PULSE_CLASSES,
  Role,
  UserProfile,
} from "../appConstants";

export interface AppointmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  appointments: any[];
  medicalRecords: any[];
  medicalDocuments: any[];
  profile: UserProfile | null;
  isDoctor: boolean;
  openMedicalRecord: (app: any) => void;
  openBookingModal: (slot: any, app: any) => void;
  handleOpenWhatsAppModal: (name: string, phone: string, app: any) => void;
  confirmDeleteDirectly: (id: string) => void;
  canDeleteOrReschedule: boolean;
  activeDoctorRoles: Role[];
  getShortDoctorName: (role: Role | string) => string;
  getRoleLabel: (role: Role | string) => string;
  getGdprStatus: (
    name: string,
    phone: string
  ) => { signed: boolean; [key: string]: any };
}

export const AppointmentHistoryModal: React.FC<
  AppointmentHistoryModalProps
> = ({
  isOpen,
  onClose,
  darkMode,
  appointments,
  medicalRecords,
  medicalDocuments,
  profile,
  isDoctor,
  openMedicalRecord,
  openBookingModal,
  handleOpenWhatsAppModal,
  confirmDeleteDirectly,
  canDeleteOrReschedule,
  activeDoctorRoles,
  getShortDoctorName,
  getRoleLabel,
  getGdprStatus,
}) => {
  const [appointmentHistorySortConfig, setAppointmentHistorySortConfig] =
    useState<{
      key: "startTime" | "patientName" | "doctorId" | "status" | "createdAt";
      direction: "asc" | "desc";
    }>({ key: "startTime", direction: "desc" });

  const [
    appointmentHistoryCelebratingFilter,
    setAppointmentHistoryCelebratingFilter,
  ] = useState(false);
  const [appointmentHistorySearchQuery, setAppointmentHistorySearchQuery] =
    useState("");
  const [appointmentHistoryDoctorFilter, setAppointmentHistoryDoctorFilter] =
    useState("all");
  const [appointmentHistoryDateFilter, setAppointmentHistoryDateFilter] =
    useState("");

  const handleAppointmentHistorySort = (
    key: "startTime" | "patientName" | "doctorId" | "status" | "createdAt"
  ) => {
    setAppointmentHistorySortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const filteredAppointmentHistory = useMemo(() => {
    let result = appointments.filter((app) => {
      const cleanDigits = appointmentHistorySearchQuery.replace(/\D/g, "");
      const queryMatch =
        matchPatientName(app.patientName, appointmentHistorySearchQuery) ||
        (app.patientPhone || "").includes(appointmentHistorySearchQuery) ||
        (cleanDigits.length >= 3 &&
          (app.patientPhone || "").replace(/\D/g, "").includes(cleanDigits)) ||
        (app.patientCnp &&
          app.patientCnp.includes(appointmentHistorySearchQuery.trim()));
      const doctorMatch =
        appointmentHistoryDoctorFilter === "all" ||
        app.doctorId === appointmentHistoryDoctorFilter;
      const dateMatch =
        !appointmentHistoryDateFilter ||
        (app.startTime && app.startTime.startsWith(appointmentHistoryDateFilter));

      let birthdayMatch = true;
      if (appointmentHistoryCelebratingFilter) {
        if (!app.patientBirthDate) {
          birthdayMatch = false;
        } else {
          const bDate = parseISO(app.patientBirthDate);
          const today = startOfDay(new Date());
          const bThisYear = new Date(
            today.getFullYear(),
            bDate.getMonth(),
            bDate.getDate()
          );
          birthdayMatch = isSameDay(bThisYear, today);
        }
      }

      return queryMatch && doctorMatch && dateMatch && birthdayMatch;
    });

    if (appointmentHistoryCelebratingFilter) {
      const uniquePatients = new Map<string, any>();
      result.forEach((app) => {
        const key = `${(app.patientName || "").toLowerCase().trim()}_${(app.patientPhone || "").trim()}`;
        if (!uniquePatients.has(key)) {
          const medicalRecord = medicalRecords.find(
            (r) =>
              (r.patientName || "").toLowerCase().trim() ===
                (app.patientName || "").toLowerCase().trim() &&
              (r.patientPhone || "").trim() === (app.patientPhone || "").trim()
          );

          uniquePatients.set(key, {
            ...app,
            allMentions: [
              ...(app.patientNotes ? [app.patientNotes] : []),
              ...(medicalRecord?.specialMentions
                ? [medicalRecord.specialMentions]
                : []),
              ...(medicalRecord?.diagnostic ? [medicalRecord.diagnostic] : []),
              ...(medicalRecord?.treatment ? [medicalRecord.treatment] : []),
            ].filter(Boolean),
            age: app.patientBirthDate
              ? differenceInYears(new Date(), parseISO(app.patientBirthDate))
              : null,
          });
        } else {
          const existing = uniquePatients.get(key);
          if (
            app.patientNotes &&
            !existing.allMentions.includes(app.patientNotes)
          ) {
            existing.allMentions.push(app.patientNotes);
          }
        }
      });
      result = Array.from(uniquePatients.values());
    }

    result.sort((a, b) => {
      const { key, direction } = appointmentHistorySortConfig;
      let valA: any = a[key as keyof typeof a];
      let valB: any = b[key as keyof typeof b];

      if (key === "startTime" || key === "createdAt") {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (key === "doctorId") {
        valA = getRoleLabel(a.doctorId).toLowerCase();
        valB = getRoleLabel(b.doctorId).toLowerCase();
      } else if (key === "patientName" || key === "status") {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    appointments,
    medicalRecords,
    appointmentHistorySearchQuery,
    appointmentHistoryDoctorFilter,
    appointmentHistoryDateFilter,
    appointmentHistoryCelebratingFilter,
    appointmentHistorySortConfig,
    getRoleLabel,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="appointment-history-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "rounded-3xl p-6 sm:p-8 w-full max-w-[95vw] xl:max-w-6xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] transition-all",
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2
                  className={cn(
                    "text-2xl font-bold",
                    darkMode ? "text-slate-100" : "text-slate-900"
                  )}
                >
                  Istoric Toate Programările
                </h2>
                <p
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  Vizualizați și filtrați toate programările din sistem
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <button
                onClick={() =>
                  setAppointmentHistoryCelebratingFilter(
                    !appointmentHistoryCelebratingFilter
                  )
                }
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all border-2 flex items-center justify-center gap-2 uppercase tracking-widest min-w-[140px]",
                  appointmentHistoryCelebratingFilter
                    ? "bg-pink-600 border-pink-600 text-white shadow-lg scale-105"
                    : darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                )}
              >
                <Cake className="w-4 h-4" />
                Sărbătoriți
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={appointmentHistorySearchQuery}
                    onChange={(e) =>
                      setAppointmentHistorySearchQuery(e.target.value)
                    }
                    placeholder="Cauta nume sau telefon..."
                    className={cn(
                      "w-full pl-10 pr-4 py-2 border-2 rounded-xl outline-none transition-all text-sm",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                    )}
                  />
                </div>
                {profile?.role === "admin" ||
                profile?.role === "frontdesk" ? (
                  <select
                    value={appointmentHistoryDoctorFilter}
                    onChange={(e) =>
                      setAppointmentHistoryDoctorFilter(e.target.value)
                    }
                    className={cn(
                      "w-full px-4 py-2 border-2 rounded-xl outline-none transition-all text-sm",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                    )}
                  >
                    <option value="all">Toți Medicii</option>
                    {activeDoctorRoles.map((role) => (
                      <option key={role} value={role}>
                        {getShortDoctorName(role)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    className={cn(
                      "w-full px-4 py-2 border-2 rounded-xl text-sm flex items-center bg-opacity-50",
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-400"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                  >
                    {getShortDoctorName(profile?.role as Role)}
                  </div>
                )}
                <input
                  type="date"
                  value={appointmentHistoryDateFilter}
                  onChange={(e) =>
                    setAppointmentHistoryDateFilter(e.target.value)
                  }
                  className={cn(
                    "w-full px-4 py-2 border-2 rounded-xl outline-none transition-all text-sm",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                  )}
                />
              </div>
            </div>

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredAppointmentHistory.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar
                    className={cn(
                      "w-16 h-16 mx-auto mb-4 opacity-20",
                      darkMode ? "text-slate-400" : "text-slate-600"
                    )}
                  />
                  <p
                    className={cn(
                      "text-lg font-medium",
                      darkMode ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    Nu am găsit nicio programare conform filtrelor.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={cn(
                          "border-b text-xs uppercase tracking-wider font-black",
                          darkMode
                            ? "border-slate-800 text-slate-500"
                            : "border-slate-100 text-slate-400"
                        )}
                      >
                        <th
                          className="py-4 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                          onClick={() =>
                            handleAppointmentHistorySort("createdAt")
                          }
                        >
                          <div className="flex items-center gap-1">
                            Înregistrat
                            {appointmentHistorySortConfig.key ===
                              "createdAt" &&
                              (appointmentHistorySortConfig.direction ===
                              "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="py-4 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                          onClick={() =>
                            handleAppointmentHistorySort("startTime")
                          }
                        >
                          <div className="flex items-center gap-1">
                            {appointmentHistoryCelebratingFilter
                              ? "Ultima Programare"
                              : "Data & Ora"}
                            {appointmentHistorySortConfig.key ===
                              "startTime" &&
                              (appointmentHistorySortConfig.direction ===
                              "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="py-4 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                          onClick={() =>
                            handleAppointmentHistorySort("patientName")
                          }
                        >
                          <div className="flex items-center gap-1">
                            Pacient
                            {appointmentHistorySortConfig.key ===
                              "patientName" &&
                              (appointmentHistorySortConfig.direction ===
                              "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="py-4 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                          onClick={() =>
                            handleAppointmentHistorySort("doctorId")
                          }
                        >
                          <div className="flex items-center gap-1">
                            Medic
                            {appointmentHistorySortConfig.key ===
                              "doctorId" &&
                              (appointmentHistorySortConfig.direction ===
                              "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="py-4 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                          onClick={() =>
                            handleAppointmentHistorySort("status")
                          }
                        >
                          <div className="flex items-center gap-1">
                            {appointmentHistoryCelebratingFilter
                              ? "Mențiuni"
                              : "Status"}
                            {appointmentHistorySortConfig.key === "status" &&
                              (appointmentHistorySortConfig.direction ===
                              "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th className="py-4 px-4 text-right">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointmentHistory.map((app) => {
                        const patientRecordForToday = medicalRecords.find(
                          (r) =>
                            r.patientName === app.patientName &&
                            r.patientPhone === app.patientPhone &&
                            isSameDay(
                              parseISO(r.updatedAt),
                              parseISO(app.startTime)
                            )
                        );

                        const hasMedicalReportToday = app
                          ? medicalDocuments.some((d) => {
                              if (d.isDeleted || !d.date) return false;
                              const docPhone = (
                                d.patientPhone || ""
                              ).replace(/\D/g, "");
                              const appPhone = (
                                app.patientPhone || ""
                              ).replace(/\D/g, "");

                              const matchesPhone =
                                appPhone !== "" &&
                                docPhone !== "" &&
                                docPhone === appPhone;

                              const cleanString = (s: string) =>
                                s
                                  .normalize("NFD")
                                  .replace(/[\u0300-\u036f]/g, "")
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]/g, "")
                                  .trim();

                              const docName = cleanString(
                                d.patientName || ""
                              );
                              const appName = cleanString(
                                app.patientName || ""
                              );
                              const matchesName =
                                appName !== "" &&
                                docName !== "" &&
                                docName === appName;

                              if (!matchesName) return false;
                              if (
                                appPhone !== "" &&
                                docPhone !== "" &&
                                docPhone !== appPhone
                              )
                                return false;
                              return isSameDay(
                                parseISO(d.date),
                                parseISO(app.startTime)
                              );
                            })
                          : false;

                        const isControlToday =
                          patientRecordForToday?.isControl;
                        const isGratisToday =
                          patientRecordForToday?.isGratis;
                        const isConsultedToday =
                          ((!!patientRecordForToday || hasMedicalReportToday) ||
                            app?.forceSeen) &&
                          !app?.ignoreSeen;

                        const isNoShow =
                          !isConsultedToday &&
                          isAfter(
                            new Date(),
                            addHours(parseISO(app.startTime), 1)
                          );

                        return (
                          <tr
                            key={app.id}
                            className={cn(
                              "border-b transition-colors group",
                              darkMode
                                ? "border-slate-800/50 hover:bg-slate-800/30"
                                : "border-slate-50 hover:bg-slate-50"
                            )}
                          >
                            <td className="py-4 px-4">
                              {app.createdAt ? (
                                <div className="flex flex-col">
                                  <span
                                    className={cn(
                                      "font-bold text-sm",
                                      darkMode
                                        ? "text-slate-200"
                                        : "text-slate-800"
                                    )}
                                  >
                                    {format(
                                      parseISO(app.createdAt),
                                      "dd  MMMM  yyyy",
                                      { locale: ro }
                                    )}
                                  </span>
                                  <span className="text-[10px] opacity-50 font-mono">
                                    {format(parseISO(app.createdAt), "HH:mm")}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs opacity-30 italic">
                                  fără dată
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span
                                  className={cn(
                                    "font-bold text-sm",
                                    darkMode
                                      ? "text-slate-200"
                                      : "text-slate-800"
                                  )}
                                >
                                  {format(
                                    parseISO(app.startTime),
                                    "dd  MMMM  yyyy",
                                    { locale: ro }
                                  )}
                                </span>
                                <span className="text-xs text-blue-500 font-mono flex items-center gap-1">
                                  {format(parseISO(app.startTime), "HH:mm")}
                                  {getGdprStatus(
                                    app.patientName,
                                    app.patientPhone
                                  ).signed && (
                                    <span
                                      className="text-[10px] font-black text-emerald-500"
                                      title="GDPR Semnat"
                                    >
                                      G
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span
                                  className={cn(
                                    "font-bold text-sm flex items-center gap-1",
                                    darkMode
                                      ? "text-slate-200"
                                      : "text-slate-800"
                                  )}
                                >
                                  {app.isControl && (
                                    <span className="text-orange-500 animate-blink-orange font-black mr-1">
                                      R
                                    </span>
                                  )}
                                  {app.patientName}
                                  {appointmentHistoryCelebratingFilter &&
                                    app.age !== null && (
                                      <span className="text-pink-500">
                                        ({app.age} ani)
                                      </span>
                                    )}
                                  {app.patientBirthDate &&
                                    isSameDay(
                                      new Date(
                                        new Date().getFullYear(),
                                        parseISO(
                                          app.patientBirthDate
                                        ).getMonth(),
                                        parseISO(
                                          app.patientBirthDate
                                        ).getDate()
                                      ),
                                      startOfDay(new Date())
                                    ) && (
                                      <Cake className="w-3 h-3 text-pink-500 animate-pulse" />
                                    )}
                                </span>
                                {!isDoctor && (
                                  <span className="text-xs text-slate-500">
                                    {app.patientPhone}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={cn(
                                  "text-xs font-bold px-2 py-1 rounded-md border",
                                  ROLE_PULSE_CLASSES[app.doctorId as Role]
                                    ? cn(
                                        ROLE_PULSE_CLASSES[
                                          app.doctorId as Role
                                        ].bg,
                                        ROLE_PULSE_CLASSES[
                                          app.doctorId as Role
                                        ].text,
                                        darkMode
                                          ? "border-slate-700/50"
                                          : "border-slate-200"
                                      )
                                    : darkMode
                                      ? "bg-slate-800 text-slate-200 border-slate-700"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                )}
                              >
                                {getShortDoctorName(app.doctorId)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {appointmentHistoryCelebratingFilter ? (
                                <div className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-slate-500 italic">
                                  {app.allMentions &&
                                  app.allMentions.length > 0 ? (
                                    <div className="flex flex-col gap-0.5">
                                      {app.allMentions.map(
                                        (m: string, idx: number) => (
                                          <div
                                            key={`ment-${idx}`}
                                            className="truncate"
                                            title={m}
                                          >
                                            • {m}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    "-"
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                    app.status === "cancelled"
                                      ? "bg-slate-900/50 border-slate-700 text-slate-500"
                                      : isBefore(
                                            parseISO(app.startTime),
                                            new Date()
                                          )
                                        ? "bg-amber-900/20 border-amber-900/30 text-amber-500"
                                        : "bg-emerald-900/20 border-emerald-900/30 text-emerald-500"
                                  )}
                                >
                                  {app.status === "cancelled"
                                    ? "Anulată"
                                    : isBefore(
                                          parseISO(app.startTime),
                                          new Date()
                                        )
                                      ? "Finalizată"
                                      : "Programată"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    onClose();
                                    openMedicalRecord(app);
                                  }}
                                  className={cn(
                                    "p-2 rounded-xl transition-all cursor-pointer",
                                    darkMode
                                      ? "bg-slate-800 text-blue-400 hover:bg-slate-700"
                                      : "bg-white border text-blue-600 hover:bg-slate-50 shadow-sm"
                                  )}
                                  title="Vezi Fișa Medicală"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    openBookingModal(
                                      {
                                        doctorId: app.doctorId,
                                        time: parseISO(app.startTime),
                                      },
                                      app
                                    );
                                    onClose();
                                  }}
                                  className={cn(
                                    "p-2 rounded-xl transition-all cursor-pointer",
                                    darkMode
                                      ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
                                      : "bg-white border text-amber-600 hover:bg-slate-50 shadow-sm"
                                  )}
                                  title="Editează"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {!isDoctor && app.patientPhone && (
                                  <button
                                    onClick={() => {
                                      onClose();
                                      handleOpenWhatsAppModal(
                                        app.patientName,
                                        app.patientPhone,
                                        app
                                      );
                                    }}
                                    className={cn(
                                      "p-2 rounded-xl transition-all cursor-pointer",
                                      darkMode
                                        ? "bg-slate-800 text-emerald-400 hover:bg-slate-700"
                                        : "bg-white border text-emerald-600 hover:bg-slate-50 shadow-sm"
                                    )}
                                    title="Trimite Notificare pe WhatsApp"
                                  >
                                    <MessageSquare className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                                  </button>
                                )}
                                {canDeleteOrReschedule && (
                                  <button
                                    onClick={() =>
                                      confirmDeleteDirectly(app.id)
                                    }
                                    className={cn(
                                      "p-2 rounded-xl transition-all cursor-pointer",
                                      darkMode
                                        ? "bg-slate-800 text-red-400 hover:bg-slate-700"
                                        : "bg-white border text-red-600 hover:bg-slate-50 shadow-sm"
                                    )}
                                    title="Șterge"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500 font-medium">
                Total: {filteredAppointmentHistory.length} programări găsite
              </p>
              <button
                onClick={onClose}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                  darkMode
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                )}
              >
                Închide
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentHistoryModal;
