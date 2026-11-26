import React, { useState, useEffect, useMemo } from "react";
import {
  Ban,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Phone,
  ShieldAlert,
  UserPlus,
  Check,
  Loader2,
} from "lucide-react";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import {
  cn,
  formatPhoneNumber,
  NonGrataPatient,
  normalizeNonGrataName,
  normalizeNonGrataPhone,
  findNonGrataMatch,
} from "../appConstants";

export interface ExistingPatientCandidate {
  patientName: string;
  patientPhone?: string;
  patientCnp?: string;
}

interface NonGrataModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  nonGrataPatients: NonGrataPatient[];
  existingPatients?: ExistingPatientCandidate[];
  initialTarget?: ExistingPatientCandidate | null;
  currentUserName: string;
  currentUserRole: string;
  onLogActivity?: (action: string, details: string) => Promise<void>;
  onSuccess?: (msg: string) => void;
}

export const NonGrataModal: React.FC<NonGrataModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  nonGrataPatients,
  existingPatients = [],
  initialTarget = null,
  currentUserName,
  currentUserRole,
  onLogActivity,
  onSuccess,
}) => {
  const [searchListQuery, setSearchListQuery] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCnp, setFormCnp] = useState("");
  const [formReason, setFormReason] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setConfirmDeleteId(null);
    setSearchListQuery("");

    if (initialTarget && initialTarget.patientName) {
      const existingMatch = findNonGrataMatch(nonGrataPatients, initialTarget);
      if (existingMatch) {
        setEditingEntryId(existingMatch.id);
        setFormName(existingMatch.patientName || "");
        setFormPhone(existingMatch.patientPhone || "");
        setFormCnp(existingMatch.patientCnp || "");
        setFormReason(existingMatch.reason || "");
      } else {
        setEditingEntryId(null);
        setFormName(initialTarget.patientName || "");
        setFormPhone(initialTarget.patientPhone || "");
        setFormCnp(initialTarget.patientCnp || "");
        setFormReason("");
      }
      setShowSuggestions(false);
    } else {
      setEditingEntryId(null);
      setFormName("");
      setFormPhone("");
      setFormCnp("");
      setFormReason("");
      setShowSuggestions(false);
    }
  }, [isOpen, initialTarget]);

  const patientSuggestions = useMemo(() => {
    if (editingEntryId || !showSuggestions) return [];
    const q = normalizeNonGrataName(formName);
    const qDigits = formPhone.replace(/\D/g, "");
    const activeQ = q.length >= 2 ? q : qDigits.length >= 3 ? qDigits : "";
    if (!activeQ) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    const seen = new Set<string>();
    const results: ExistingPatientCandidate[] = [];

    for (const p of existingPatients) {
      if (!p.patientName) continue;
      const pNorm = normalizeNonGrataName(p.patientName);
      const pDigits = normalizeNonGrataPhone(p.patientPhone);
      const matchName =
        tokens.length > 0 && tokens.every((t) => pNorm.includes(t));
      const matchPhone = qDigits.length >= 3 && pDigits.includes(qDigits);
      if (matchName || matchPhone) {
        const key = `${pNorm}_${pDigits}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(p);
          if (results.length >= 6) break;
        }
      }
    }
    return results;
  }, [editingEntryId, showSuggestions, formName, formPhone, existingPatients]);

  const filteredList = useMemo(() => {
    const q = normalizeNonGrataName(searchListQuery);
    const qDigits = searchListQuery.replace(/\D/g, "");
    const sorted = [...nonGrataPatients].sort((a, b) =>
      (b.updatedAt || b.createdAt || "").localeCompare(
        a.updatedAt || a.createdAt || "",
      ),
    );
    if (!q && !qDigits) return sorted;

    const tokens = q.split(/\s+/).filter(Boolean);
    return sorted.filter((entry) => {
      const eName = normalizeNonGrataName(entry.patientName);
      const eReason = normalizeNonGrataName(entry.reason);
      const ePhone = normalizeNonGrataPhone(entry.patientPhone);
      const eCnp = (entry.patientCnp || "").replace(/\D/g, "");
      const nameOrReasonMatch =
        tokens.length > 0 &&
        tokens.every((t) => eName.includes(t) || eReason.includes(t));
      const phoneOrCnpMatch =
        qDigits.length >= 2 &&
        (ePhone.includes(qDigits) || eCnp.includes(qDigits));
      return nameOrReasonMatch || phoneOrCnpMatch;
    });
  }, [nonGrataPatients, searchListQuery]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingEntryId(null);
    setFormName("");
    setFormPhone("");
    setFormCnp("");
    setFormReason("");
    setFormError(null);
    setShowSuggestions(false);
  };

  const handleEditEntry = (entry: NonGrataPatient) => {
    setEditingEntryId(entry.id);
    setFormName(entry.patientName || "");
    setFormPhone(entry.patientPhone || "");
    setFormCnp(entry.patientCnp || "");
    setFormReason(entry.reason || "");
    setFormError(null);
    setShowSuggestions(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formName.trim();
    const cleanPhone = formPhone.trim();
    const cleanCnp = formCnp.replace(/\D/g, "").slice(0, 13).trim();
    const cleanReason = formReason.trim();

    if (cleanName.length < 2) {
      setFormError("Introduceți numele complet al persoanei (minim 2 caractere).");
      return;
    }
    if (cleanReason.length < 3) {
      setFormError(
        "Specificați motivul / detaliul pentru care persoana este Non Grata.",
      );
      return;
    }

    const now = new Date().toISOString();
    const normName = normalizeNonGrataName(cleanName);
    const normPhone = normalizeNonGrataPhone(cleanPhone);

    // Check if an existing entry matches when creating a new one
    if (!editingEntryId) {
      const duplicate = findNonGrataMatch(nonGrataPatients, {
        patientName: cleanName,
        patientPhone: cleanPhone,
        patientCnp: cleanCnp,
      });
      if (duplicate) {
        setFormError(
          `Această persoană figurează deja în lista Non Grata („${duplicate.patientName}”). Apăsați pe Editează în listă dacă doriți să îi actualizați motivul.`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingEntryId) {
        await updateDoc(doc(db, "non_grata_patients", editingEntryId), {
          patientName: cleanName,
          normalizedName: normName,
          patientPhone: cleanPhone,
          normalizedPhone: normPhone,
          patientCnp: cleanCnp,
          reason: cleanReason,
          updatedAt: now,
        });
        if (onLogActivity) {
          await onLogActivity(
            "Actualizare Persoană Non Grata",
            `Actualizat ${cleanName}${cleanPhone ? ` (${cleanPhone})` : ""} — Motiv: ${cleanReason}`,
          );
        }
        onSuccess?.(`Datele Non Grata pentru ${cleanName} au fost actualizate.`);
      } else {
        await addDoc(collection(db, "non_grata_patients"), {
          patientName: cleanName,
          normalizedName: normName,
          patientPhone: cleanPhone,
          normalizedPhone: normPhone,
          patientCnp: cleanCnp,
          reason: cleanReason,
          addedBy: currentUserName || "Personal",
          addedByRole: currentUserRole || "",
          createdAt: now,
          updatedAt: now,
        });
        if (onLogActivity) {
          await onLogActivity(
            "Adăugare Persoană Non Grata",
            `Marcat ${cleanName}${cleanPhone ? ` (${cleanPhone})` : ""} — Motiv: ${cleanReason}`,
          );
        }
        onSuccess?.(`${cleanName} a fost adăugat(ă) în lista Persoană Non Grata.`);
      }
      resetForm();
    } catch (err) {
      console.error("Eroare salvare Persoană Non Grata:", err);
      setFormError(
        "A apărut o eroare la salvare. Verificați conexiunea și încercați din nou.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entry: NonGrataPatient) => {
    setDeletingId(entry.id);
    try {
      await deleteDoc(doc(db, "non_grata_patients", entry.id));
      if (editingEntryId === entry.id) {
        resetForm();
      }
      setConfirmDeleteId(null);
      if (onLogActivity) {
        await onLogActivity(
          "Eliminare Persoană Non Grata",
          `Eliminat ${entry.patientName} din lista Persoană Non Grata`,
        );
      }
      onSuccess?.(`${entry.patientName} a fost eliminat(ă) din lista Non Grata.`);
    } catch (err) {
      console.error("Eroare ștergere Persoană Non Grata:", err);
      setFormError("Nu s-a putut elimina înregistrarea. Reîncercați.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Persoane Non Grata"
    >
      <div
        className={cn(
          "w-full max-w-4xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden",
          darkMode
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0",
            darkMode
              ? "bg-rose-950/30 border-slate-800"
              : "bg-rose-50/80 border-rose-100",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-900/20 shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase">
                  Registru Persoane Non Grata
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                  {nonGrataPatients.length}
                </span>
              </div>
              <p
                className={cn(
                  "text-xs font-medium mt-0.5",
                  darkMode ? "text-slate-400" : "text-slate-600",
                )}
              >
                Vizibil pentru tot personalul clinicii. Nu blochează programările și nu apare pe ecranul TV sau în Portalul Pacienților.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors cursor-pointer shrink-0",
              darkMode
                ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                : "hover:bg-rose-100 text-slate-500 hover:text-slate-800",
            )}
            title="Închide fereastra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          {/* Form: Add / Edit */}
          <form
            onSubmit={handleSave}
            className={cn(
              "p-4 sm:p-5 rounded-2xl border space-y-4",
              darkMode
                ? "bg-slate-950/60 border-slate-800"
                : "bg-slate-50 border-slate-200",
            )}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <UserPlus className="w-4 h-4" />
                {editingEntryId
                  ? "Editează Persoană Non Grata"
                  : "Adaugă Pacient Existent sau Persoană Nouă"}
              </h3>
              {editingEntryId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer",
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-300 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  Anulează editarea
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nume Complet *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingEntryId) setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (!editingEntryId) setShowSuggestions(true);
                  }}
                  placeholder="Ex: Popescu Ion"
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500",
                    darkMode
                      ? "bg-slate-900 border-slate-700 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900",
                  )}
                />

                {patientSuggestions.length > 0 && (
                  <div
                    className={cn(
                      "absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl z-30 max-h-48 overflow-y-auto",
                      darkMode
                        ? "bg-slate-900 border-slate-700"
                        : "bg-white border-slate-200",
                    )}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      Pacienți existenți găsiți (click pentru preluare)
                    </div>
                    {patientSuggestions.map((cand, idx) => (
                      <button
                        key={`${cand.patientName}_${idx}`}
                        type="button"
                        onClick={() => {
                          setFormName(cand.patientName);
                          if (cand.patientPhone) setFormPhone(cand.patientPhone);
                          if (cand.patientCnp) setFormCnp(cand.patientCnp);
                          setShowSuggestions(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 cursor-pointer border-b last:border-0",
                          darkMode
                            ? "border-slate-800 hover:bg-slate-800 text-slate-200"
                            : "border-slate-100 hover:bg-rose-50 text-slate-800",
                        )}
                      >
                        <span className="font-bold truncate">{cand.patientName}</span>
                        <span className="text-[11px] opacity-70 shrink-0">
                          {cand.patientPhone ? formatPhoneNumber(cand.patientPhone) : "Fără tel."}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Telefon (opțional)
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="07xx xxx xxx"
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500",
                    darkMode
                      ? "bg-slate-900 border-slate-700 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900",
                  )}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  CNP (opțional)
                </label>
                <input
                  type="text"
                  maxLength={13}
                  value={formCnp}
                  onChange={(e) =>
                    setFormCnp(e.target.value.replace(/\D/g, "").slice(0, 13))
                  }
                  placeholder="13 cifre..."
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-semibold outline-none focus:ring-2 focus:ring-rose-500",
                    darkMode
                      ? "bg-slate-900 border-slate-700 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900",
                  )}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Detaliu / Motiv (de ce este Persoană Non Grata) *
              </label>
              <textarea
                rows={2}
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Ex: Comportament agresiv la recepție, refuz plată, limbaj neadecvat..."
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-rose-500",
                  darkMode
                    ? "bg-slate-900 border-slate-700 text-slate-100"
                    : "bg-white border-slate-200 text-slate-900",
                )}
              />
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-rose-900/20 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Se salvează...</span>
                  </>
                ) : editingEntryId ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvează Modificările</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Adaugă în Lista Non Grata</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Search & List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Persoane înregistrate ({filteredList.length})
              </h3>
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchListQuery}
                  onChange={(e) => setSearchListQuery(e.target.value)}
                  placeholder="Filtrează după nume, tel, motiv..."
                  className={cn(
                    "w-full pl-8.5 pr-8 py-2 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900",
                  )}
                />
                {searchListQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchListQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredList.length === 0 ? (
              <div
                className={cn(
                  "p-8 rounded-2xl border text-center",
                  darkMode
                    ? "bg-slate-950/40 border-slate-800 text-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-500",
                )}
              >
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">
                  {nonGrataPatients.length === 0
                    ? "Nu există nicio persoană înregistrată în lista Non Grata."
                    : "Niciun rezultat pentru filtrul introdus."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredList.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      editingEntryId === entry.id
                        ? darkMode
                          ? "bg-rose-950/35 border-rose-500/60"
                          : "bg-rose-50 border-rose-400"
                        : darkMode
                          ? "bg-slate-950/60 border-slate-800 hover:border-rose-800/60"
                          : "bg-white border-slate-200 hover:border-rose-300 shadow-xs",
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shrink-0">
                            <Ban className="w-3 h-3" />
                            Persoană Non Grata
                          </span>
                          <span className="text-sm font-black uppercase tracking-tight">
                            {entry.patientName}
                          </span>
                          {entry.patientPhone && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-semibold",
                                darkMode ? "text-slate-300" : "text-slate-600",
                              )}
                            >
                              <Phone className="w-3 h-3 opacity-60" />
                              {formatPhoneNumber(entry.patientPhone)}
                            </span>
                          )}
                          {entry.patientCnp && (
                            <span className="text-[11px] font-mono opacity-75">
                              CNP {entry.patientCnp}
                            </span>
                          )}
                        </div>

                        <div
                          className={cn(
                            "p-2.5 rounded-xl border text-xs font-semibold leading-relaxed",
                            darkMode
                              ? "bg-rose-950/30 border-rose-900/50 text-rose-200"
                              : "bg-rose-50/90 border-rose-200 text-rose-900",
                          )}
                        >
                          <span className="font-black uppercase text-[10px] tracking-wider text-rose-600 dark:text-rose-400 mr-1.5">
                            Detaliu / Motiv:
                          </span>
                          {entry.reason}
                        </div>

                        <div className="text-[11px] opacity-65 flex items-center gap-2 flex-wrap">
                          <span>Adăugat de: {entry.addedBy || "Personal"}</span>
                          {entry.createdAt && (
                            <span>
                              •{" "}
                              {new Date(entry.createdAt).toLocaleDateString(
                                "ro-RO",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => handleEditEntry(entry)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer",
                            darkMode
                              ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
                          )}
                          title="Editează detaliile"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editează</span>
                        </button>

                        {confirmDeleteId === entry.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={deletingId === entry.id}
                              onClick={() => handleDeleteEntry(entry)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                            >
                              {deletingId === entry.id ? "..." : "Confirmă"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className={cn(
                                "px-2 py-1.5 rounded-xl text-xs font-bold cursor-pointer",
                                darkMode
                                  ? "bg-slate-800 text-slate-300"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              Nu
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer",
                              darkMode
                                ? "bg-rose-950/30 border-rose-800/60 text-rose-400 hover:bg-rose-950/50"
                                : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
                            )}
                            title="Elimină din lista Non Grata"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Elimină</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "px-6 py-3.5 border-t flex justify-end shrink-0",
            darkMode
              ? "bg-slate-950/60 border-slate-800"
              : "bg-slate-50 border-slate-200",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer",
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100",
            )}
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};
