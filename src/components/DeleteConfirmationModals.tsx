import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, X } from "lucide-react";
import { cn } from "../appConstants";

export interface DeleteConfirmationModalsProps {
  darkMode: boolean;
  // 1. Appointment cancel
  isDeleteConfirmModalOpen: boolean;
  setIsDeleteConfirmModalOpen: (open: boolean) => void;
  appointmentToCancel: any;
  setAppointmentToCancel: (app: any) => void;
  confirmDeleteAppointment: () => Promise<void> | void;

  // 2. Prescription delete
  isDeletePrescriptionConfirmModalOpen: boolean;
  setIsDeletePrescriptionConfirmModalOpen: (open: boolean) => void;
  prescriptionToDeleteIndex: number | null;
  setPrescriptionToDeleteIndex: (index: number | null) => void;
  currentMedicalRecord: any;
  setCurrentMedicalRecord: (rec: any) => void;
  handleConfirmDeletePrescription?: (index: number) => Promise<void> | void;

  // 3. Glasses order delete
  orderToDelete: {
    patientId: string;
    orderNumber: string;
    patientName: string;
  } | null;
  setOrderToDelete: (order: { patientId: string; orderNumber: string; patientName: string; } | null) => void;
  isPermanentDelete: boolean;
  setIsPermanentDelete: (val: boolean) => void;
  handlePermanentDeleteOrder: () => Promise<void> | void;
  handleDeleteSingleOrder: () => Promise<void> | void;

  // 4. Bulk delete orders
  bulkDeleteMode: "selected" | "all" | null;
  setBulkDeleteMode: (mode: "selected" | "all" | null) => void;
  selectedDeletedOrders: string[];
  filteredOrders: any[];
  handlePermanentDeleteMultipleOrders: (targets: Array<{ patientId: string; orderNumber: string }>) => Promise<void> | void;

  // 5. Bulk soft delete
  bulkSoftDeleteMode: "selected" | "all" | null;
  setBulkSoftDeleteMode: (mode: "selected" | "all" | null) => void;
  selectedCompletedOrders: string[];
  handleSoftDeleteMultipleOrders: (targets: Array<{ patientId: string; orderNumber: string }>) => Promise<void> | void;

  // 6. Definitive patient delete
  isDeletePatientDefinitivelyModalOpen: boolean;
  setIsDeletePatientDefinitivelyModalOpen: (open: boolean) => void;
  patientToDeleteDefinitively: any;
  setPatientToDeleteDefinitively: (patient: any) => void;
  handleDeletePatientDefinitively: (patient: any) => Promise<void> | void;
}

export const DeleteConfirmationModals: React.FC<DeleteConfirmationModalsProps> = ({
  darkMode,
  isDeleteConfirmModalOpen,
  setIsDeleteConfirmModalOpen,
  appointmentToCancel,
  setAppointmentToCancel,
  confirmDeleteAppointment,

  isDeletePrescriptionConfirmModalOpen,
  setIsDeletePrescriptionConfirmModalOpen,
  prescriptionToDeleteIndex,
  setPrescriptionToDeleteIndex,
  currentMedicalRecord,
  setCurrentMedicalRecord,
  handleConfirmDeletePrescription,

  orderToDelete,
  setOrderToDelete,
  isPermanentDelete,
  setIsPermanentDelete,
  handlePermanentDeleteOrder,
  handleDeleteSingleOrder,

  bulkDeleteMode,
  setBulkDeleteMode,
  selectedDeletedOrders,
  filteredOrders,
  handlePermanentDeleteMultipleOrders,

  bulkSoftDeleteMode,
  setBulkSoftDeleteMode,
  selectedCompletedOrders,
  handleSoftDeleteMultipleOrders,

  isDeletePatientDefinitivelyModalOpen,
  setIsDeletePatientDefinitivelyModalOpen,
  patientToDeleteDefinitively,
  setPatientToDeleteDefinitively,
  handleDeletePatientDefinitively,
}) => {
  return (
    <>
      {/* 1. Delete Confirmation Modal (Appointment) */}
      <AnimatePresence>
        {isDeleteConfirmModalOpen && appointmentToCancel && (
          <motion.div
            key="delete-confirm-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "rounded-3xl p-8 w-full max-w-md shadow-2xl border transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Anulare Consultație</span>
                </h2>
                <button
                  onClick={() => {
                    setIsDeleteConfirmModalOpen(false);
                    setAppointmentToCancel(null);
                  }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500",
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <p className="text-sm font-semibold">
                  Sunteți sigur că doriți să anulați consultația pentru:
                </p>
                <div
                  className={cn(
                    "p-4 rounded-xl border font-bold text-center",
                    darkMode
                      ? "bg-slate-950 border-slate-800"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-lg text-red-500">
                    {appointmentToCancel.patientName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {appointmentToCancel.patientAge} ani •{" "}
                    {appointmentToCancel.patientPhone || "Fără telefon"}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed font-semibold",
                    darkMode ? "text-slate-400" : "text-slate-600",
                  )}
                >
                  Consultația va fi eliminată din calendarul activ.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteConfirmModalOpen(false);
                    setAppointmentToCancel(null);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all border text-xs sm:text-sm",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  Nu, păstrează
                </button>
                <button
                  onClick={confirmDeleteAppointment}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg shadow-red-900/25 uppercase text-xs sm:text-sm border border-red-600"
                >
                  Da, Anulează
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Delete Prescription Confirmation Modal */}
      <AnimatePresence>
        {isDeletePrescriptionConfirmModalOpen && prescriptionToDeleteIndex !== null && (
          <motion.div
            key="delete-prescription-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "rounded-3xl p-8 w-full max-w-md shadow-2xl border transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Ștergere Prescripție</span>
                </h2>
                <button
                  onClick={() => {
                    setIsDeletePrescriptionConfirmModalOpen(false);
                    setPrescriptionToDeleteIndex(null);
                  }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500",
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <p className="text-sm font-semibold">
                  Sunteți sigur că doriți să ștergeți această prescripție salvată?
                </p>
                <p
                  className={cn(
                    "text-xs leading-relaxed font-semibold",
                    darkMode ? "text-slate-400" : "text-slate-600",
                  )}
                >
                  Prescripția va fi eliminată din istoricul fișei pacientului.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeletePrescriptionConfirmModalOpen(false);
                    setPrescriptionToDeleteIndex(null);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all border text-xs sm:text-sm",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  Anulează
                </button>
                <button
                  onClick={async () => {
                    if (prescriptionToDeleteIndex !== null) {
                      if (handleConfirmDeletePrescription) {
                        await handleConfirmDeletePrescription(prescriptionToDeleteIndex);
                      } else if (currentMedicalRecord) {
                        const history = [...(currentMedicalRecord.prescriptionHistory || currentMedicalRecord.prescriptions || [])];
                        history.splice(prescriptionToDeleteIndex, 1);
                        setCurrentMedicalRecord({
                          ...currentMedicalRecord,
                          prescriptionHistory: history,
                        });
                      }
                    }
                    setIsDeletePrescriptionConfirmModalOpen(false);
                    setPrescriptionToDeleteIndex(null);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg shadow-red-900/25 uppercase text-xs sm:text-sm border border-red-600 cursor-pointer"
                >
                  Da, Șterge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Glasses Order Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <motion.div
            key="delete-order-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "rounded-3xl p-8 w-full max-w-md shadow-2xl border transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>
                    {isPermanentDelete ? "Ștergere Definitivă Comandă" : "Mutare în Coș de Gunoi"}
                  </span>
                </h2>
                <button
                  onClick={() => {
                    setOrderToDelete(null);
                    setIsPermanentDelete(false);
                  }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500",
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <p className="text-sm font-semibold">
                  {isPermanentDelete
                    ? "Sunteți pe cale să ștergeți definitiv comanda:"
                    : "Sunteți sigur că doriți să mutați comanda în coșul de gunoi?"}
                </p>
                <div
                  className={cn(
                    "p-4 rounded-xl border font-bold text-center",
                    darkMode
                      ? "bg-slate-950 border-slate-800"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-lg text-red-500">
                    Comanda #{orderToDelete.orderNumber}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pacient: {orderToDelete.patientName}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed font-semibold",
                    darkMode ? "text-slate-400" : "text-slate-600",
                  )}
                >
                  {isPermanentDelete
                    ? "Atenție: Această acțiune este complet ireversibilă! Comanda va fi eliminată permanent."
                    : "Comanda va fi mutată în secțiunea 'Șterse' și va putea fi restaurată ulterior."}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOrderToDelete(null);
                    setIsPermanentDelete(false);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all border text-xs sm:text-sm",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  Anulează
                </button>
                <button
                  onClick={() => {
                    if (isPermanentDelete) {
                      handlePermanentDeleteOrder();
                    } else {
                      handleDeleteSingleOrder();
                    }
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg shadow-red-900/25 uppercase text-xs sm:text-sm border border-red-600"
                >
                  {isPermanentDelete ? "Da, Șterge Definitiv" : "Mută în Coș"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Bulk Delete Orders Confirmation Modal */}
      <AnimatePresence>
        {bulkDeleteMode && (
          <motion.div
            key="bulk-delete-orders-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "rounded-3xl p-8 w-full max-w-md shadow-2xl border transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <Trash2 className="w-6 h-6 text-red-500 shrink-0" />
                  <span>Ștergere Definitivă Comenzi</span>
                </h2>
                <button
                  onClick={() => {
                    setBulkDeleteMode(null);
                    setIsPermanentDelete(false);
                  }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500",
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <p className="text-xs sm:text-sm font-semibold">
                  Sunteți pe cale să ștergeți definitiv:
                </p>
                <div
                  className={cn(
                    "p-4 rounded-xl border font-bold text-center",
                    darkMode
                      ? "bg-slate-950 border-slate-800"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-2xl text-red-500 font-extrabold">
                    {bulkDeleteMode === "selected"
                      ? `${selectedDeletedOrders.length} comenzi selectate`
                      : `${filteredOrders.length} comenzi din coș`}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed font-semibold",
                    darkMode ? "text-slate-400" : "text-slate-600",
                  )}
                >
                  Atenție: Această acțiune este complet ireversibilă! Comenzile vor fi eliminate permanent din baza de date.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBulkDeleteMode(null);
                    setIsPermanentDelete(false);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all border text-xs sm:text-sm",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  Anulează
                </button>
                <button
                  onClick={() => {
                    const targets =
                      bulkDeleteMode === "selected"
                        ? selectedDeletedOrders.map((key) => {
                            const [patientId, orderNumber] = key.split("___");
                            return { patientId, orderNumber };
                          })
                        : filteredOrders.map((o) => ({
                            patientId: o.patientId,
                            orderNumber: o.orderNumber,
                          }));
                    handlePermanentDeleteMultipleOrders(targets);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg shadow-red-900/25 uppercase text-xs sm:text-sm border border-red-600"
                >
                  Da, Șterge Definitiv
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Bulk Soft Delete Confirmation Modal */}
      <AnimatePresence>
        {bulkSoftDeleteMode && (
          <motion.div
            key="bulk-soft-delete-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "rounded-3xl p-8 w-full max-w-md shadow-2xl border transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                  <Trash2 className="w-6 h-6 text-amber-500 shrink-0" />
                  <span>Mutare în Șterse (Coș de Gunoi)</span>
                </h2>
                <button
                  onClick={() => setBulkSoftDeleteMode(null)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500",
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <p className="text-xs sm:text-sm font-semibold">
                  Sunteți pe cale să mutați în coșul de gunoi:
                </p>
                <div
                  className={cn(
                    "p-4 rounded-xl border font-bold text-center",
                    darkMode
                      ? "bg-slate-950 border-slate-800"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {bulkSoftDeleteMode === "selected"
                      ? "Comenzi Finalizate Selectate"
                      : "Toate Comenzile Finalizate Afișate"}
                  </p>
                  <p className="text-2xl text-amber-500 font-extrabold mt-1">
                    {bulkSoftDeleteMode === "selected"
                      ? `${selectedCompletedOrders.length} comenzi`
                      : `${filteredOrders.length} comenzi`}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed font-semibold",
                    darkMode ? "text-slate-400" : "text-slate-600",
                  )}
                >
                  Comenzile vor fi mutate în fila "Șterse" (Coș de gunoi) și vor putea fi restaurate oricând ulterior.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setBulkSoftDeleteMode(null)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all border text-xs sm:text-sm",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  Anulează
                </button>
                <button
                  onClick={() => {
                    const targets =
                      bulkSoftDeleteMode === "selected"
                        ? selectedCompletedOrders.map((key) => {
                            const [patientId, orderNumber] = key.split("___");
                            return { patientId, orderNumber };
                          })
                        : filteredOrders.map((o) => ({
                            patientId: o.patientId,
                            orderNumber: o.orderNumber,
                          }));
                    setBulkSoftDeleteMode(null);
                    handleSoftDeleteMultipleOrders(targets);
                  }}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-lg shadow-amber-900/25 uppercase text-xs sm:text-sm border border-amber-600"
                >
                  Mută în Coș
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Definitive Patient Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeletePatientDefinitivelyModalOpen && patientToDeleteDefinitively && (
          <motion.div
            key="delete-patient-definitively-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "rounded-3xl p-8 w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl border transition-all",
                darkMode
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <Trash2 className="w-6 h-6 text-red-500 shrink-0" />
                  <span>Ștergere Definitivă</span>
                </h2>
                <button
                  onClick={() => {
                    setIsDeletePatientDefinitivelyModalOpen(false);
                    setPatientToDeleteDefinitively(null);
                  }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500",
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <p className="text-xs sm:text-sm font-semibold">
                  Sunteți pe cale să ștergeți pacientul:
                </p>
                <div
                  className={cn(
                    "p-4 rounded-xl border font-bold text-center",
                    darkMode
                      ? "bg-slate-950 border-slate-800"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <p className="text-lg text-red-500">
                    {patientToDeleteDefinitively.patientName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {patientToDeleteDefinitively.patientPhone || "Fără telefon"}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed",
                    darkMode ? "text-slate-400" : "text-slate-600",
                  )}
                >
                  Această acțiune va șterge{" "}
                  <span className="font-extrabold text-red-500 uppercase">
                    PERMANENT și DEFINITIV
                  </span>
                  :
                </p>
                <ul
                  className={cn(
                    "list-disc pl-5 text-xs space-y-1 font-semibold",
                    darkMode ? "text-slate-400" : "text-slate-600",
                  )}
                >
                  <li>Fișa medicală a pacientului</li>
                  <li>Tot istoricul de consultații și prescripții</li>
                  <li>Informațiile despre rețete și ochelari</li>
                  <li>Toate programările aferente</li>
                  <li>Documentele eliberate (adeverințe, referate etc.)</li>
                  <li>Alertele active din recepție</li>
                </ul>
                <p className="text-xs font-black text-red-500 uppercase">
                  Atenție: Această acțiune este complet ireversibilă! Datele nu vor mai putea fi recuperate sub nicio formă!
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeletePatientDefinitivelyModalOpen(false);
                    setPatientToDeleteDefinitively(null);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all border text-xs sm:text-sm",
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  Anulează
                </button>
                <button
                  onClick={() =>
                    handleDeletePatientDefinitively(patientToDeleteDefinitively)
                  }
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg shadow-red-900/25 uppercase text-xs sm:text-sm border border-red-600"
                >
                  Da, Șterge Definitiv
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
