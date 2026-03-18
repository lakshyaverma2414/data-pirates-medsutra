import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useApiPolling } from "../../../hooks/useApiPolling";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";
import {
  acceptTransferRequest,
  createTransferRequest,
  fetchCurrentHospitalProfile,
  fetchPatients,
  fetchTransfers,
  transferPatientToMyHospital,
  updateTransferProgress,
} from "./patientTransfers.api";

const BLOOD_GROUPS = [
  { id: "A_PLUS", label: "A+" },
  { id: "A_MINUS", label: "A-" },
  { id: "B_PLUS", label: "B+" },
  { id: "B_MINUS", label: "B-" },
  { id: "AB_PLUS", label: "AB+" },
  { id: "AB_MINUS", label: "AB-" },
  { id: "O_PLUS", label: "O+" },
  { id: "O_MINUS", label: "O-" },
];

const TRANSFER_STEPS = [
  "REQUEST_SENT",
  "ACCEPTED_BY_HOSPITAL",
  "AMBULANCE_ASSIGNED",
  "PATIENT_IN_TRANSIT",
  "TRANSFER_COMPLETED",
];

const NEXT_PROGRESS = {
  ACCEPTED_BY_HOSPITAL: "AMBULANCE_ASSIGNED",
  AMBULANCE_ASSIGNED: "PATIENT_IN_TRANSIT",
  PATIENT_IN_TRANSIT: "TRANSFER_COMPLETED",
};

const PROGRESS_LABELS = {
  REQUEST_SENT: "Requested",
  ACCEPTED_BY_HOSPITAL: "Accepted",
  AMBULANCE_ASSIGNED: "Ambulance Assigned",
  PATIENT_IN_TRANSIT: "In Transit",
  TRANSFER_COMPLETED: "Completed",
};

const STATUS_CLASSES = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-sky-100 text-sky-800",
};

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const formatProgress = (progress) => PROGRESS_LABELS[progress] || progress;

const FlowTracker = ({ progress }) => {
  const activeIndex = TRANSFER_STEPS.findIndex((step) => step === progress);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-y-2">
      {TRANSFER_STEPS.map((step, index) => {
        const done = index <= activeIndex;
        const current = index === activeIndex;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`h-2.5 w-2.5 rounded-full border-2 ${
                  done
                    ? "border-sky-500 bg-sky-500"
                    : "border-slate-300 bg-white"
                } ${current ? "ring-2 ring-sky-200" : ""}`}
              />
              <span
                className={`mt-1 max-w-16 text-center text-[10px] font-medium leading-tight ${
                  done ? "text-sky-700" : "text-slate-400"
                }`}
              >
                {formatProgress(step)}
              </span>
            </div>
            {index < TRANSFER_STEPS.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-8 sm:w-10 ${
                  index < activeIndex ? "bg-sky-400" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const SectionShell = ({ title, tone, count, loading, emptyText, children }) => (
  <div className="surface-card surface-card-shimmer overflow-hidden">
    <div
      className={`flex items-center justify-between border-b px-5 py-3.5 ${tone}`}
    >
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold shadow-sm">
        {count}
      </span>
    </div>
    <div className="p-4">
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : count === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">{emptyText}</p>
      ) : (
        <Motion.div
          className="space-y-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {children}
        </Motion.div>
      )}
    </div>
  </div>
);

const TransferCard = ({
  transfer,
  mode,
  actionLoading,
  onAccept,
  onDispatch,
  onComplete,
}) => {
  const isLoading = Boolean(actionLoading[transfer.id]);
  const canDispatch =
    mode === "my-active" &&
    transfer.status === "ACCEPTED" &&
    transfer.progress === "ACCEPTED_BY_HOSPITAL";
  const canComplete =
    mode === "incoming" &&
    transfer.status === "ACCEPTED" &&
    transfer.progress === "PATIENT_IN_TRANSIT";

  return (
    <Motion.div
      variants={cardVariants}
      className="surface-soft border border-slate-200/70 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-slate-400">
              #{transfer.id}
            </span>
            <span
              className={`info-chip ${
                STATUS_CLASSES[transfer.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {transfer.status}
            </span>
            <span className="info-chip bg-indigo-50 text-indigo-700">
              {formatProgress(transfer.progress)}
            </span>
          </div>

          <p className="text-base font-bold text-slate-900">
            {transfer.patient?.name || "Unknown Patient"}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
            {transfer.patient?.id ? (
              <span className="rounded-full bg-slate-100 px-2 py-1">
                Patient ID #{transfer.patient.id}
              </span>
            ) : null}
            {transfer.patient?.bloodGroup ? (
              <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                {transfer.patient.bloodGroup}
              </span>
            ) : null}
          </div>
          {transfer.patient?.condition ? (
            <p className="mt-2 text-sm text-slate-600">
              {transfer.patient.condition}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-slate-400">
            From: {transfer.fromHospital?.name || "Unknown Hospital"}
            {transfer.toHospital?.name
              ? ` · To: ${transfer.toHospital.name}`
              : " · Awaiting accepting hospital"}
          </p>
        </div>

        <div className="shrink-0">
          {mode === "incoming" && transfer.status === "PENDING" ? (
            <button
              type="button"
              onClick={() => onAccept(transfer.id)}
              disabled={isLoading}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              Accept
            </button>
          ) : null}

          {canDispatch ? (
            <button
              type="button"
              onClick={() => onDispatch(transfer.id)}
              disabled={isLoading}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              Assign Ambulance
            </button>
          ) : null}

          {canComplete ? (
            <button
              type="button"
              onClick={() => onComplete(transfer)}
              disabled={isLoading}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              Mark Completed
            </button>
          ) : null}
        </div>
      </div>
      <FlowTracker progress={transfer.progress} />
    </Motion.div>
  );
};

const PatientTransfersPage = () => {
  const [patients, setPatients] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [currentHospital, setCurrentHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [creatingTransfer, setCreatingTransfer] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const myId = Number(currentHospital?.id) || null;

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => String(patient.id) === String(selectedPatientId),
      ) || null,
    [patients, selectedPatientId],
  );

  const incomingRequests = useMemo(
    () =>
      transfers.filter(
        (item) =>
          Number(item.fromHospital?.id) !== myId &&
          item.progress !== "TRANSFER_COMPLETED",
      ),
    [transfers, myId],
  );

  const myActiveRequests = useMemo(
    () =>
      transfers.filter(
        (item) =>
          Number(item.fromHospital?.id) === myId &&
          item.progress !== "TRANSFER_COMPLETED",
      ),
    [transfers, myId],
  );

  const completedTransfers = useMemo(
    () =>
      transfers.filter(
        (item) =>
          (Number(item.fromHospital?.id) === myId ||
            Number(item.toHospital?.id) === myId) &&
          item.progress === "TRANSFER_COMPLETED",
      ),
    [transfers, myId],
  );

  const loadData = useCallback(
    async ({
      showLoading = false,
      showRefreshing = false,
      showError = true,
    } = {}) => {
      if (showRefreshing) {
        setRefreshing(true);
      } else if (showLoading) {
        setLoading(true);
      }

      try {
        const [patientList, transferList, profile] = await Promise.all([
          fetchPatients(),
          fetchTransfers(),
          fetchCurrentHospitalProfile(),
        ]);

        const safePatients = Array.isArray(patientList) ? patientList : [];
        setPatients(safePatients);
        setTransfers(Array.isArray(transferList) ? transferList : []);
        setCurrentHospital(profile || null);
        setSelectedPatientId((prev) => {
          if (
            prev &&
            safePatients.some((patient) => String(patient.id) === String(prev))
          ) {
            return prev;
          }
          return safePatients[0]?.id ? String(safePatients[0].id) : "";
        });
        if (showError) {
          setError("");
        }
      } catch (err) {
        if (showError) {
          setError(err.message || "Failed to load patient transfers");
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        if (showRefreshing) {
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadData({ showLoading: true });
  }, [loadData]);

  useApiPolling(() => loadData({ showError: false }), {
    enabled: !loading,
    intervalMs: 500,
  });

  const setRowLoading = (id, value) => {
    setActionLoading((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateTransfer = async (event) => {
    event.preventDefault();
    if (!selectedPatientId) {
      setError("Select a patient first.");
      return;
    }

    setCreatingTransfer(true);
    setError("");
    setSuccess("");

    try {
      await createTransferRequest(Number(selectedPatientId));
      setSuccess("Transfer request sent to the hospital network.");
      await loadData({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to create transfer request");
    } finally {
      setCreatingTransfer(false);
    }
  };

  const handleAccept = async (id) => {
    if (!myId) {
      setError("Hospital profile is not loaded yet. Try refresh.");
      return;
    }

    setError("");
    setSuccess("");
    setRowLoading(id, true);

    try {
      await acceptTransferRequest(id, myId);
      setSuccess(
        "Transfer accepted. Origin hospital can continue the movement flow.",
      );
      await loadData({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to accept transfer request");
    } finally {
      setRowLoading(id, false);
    }
  };

  const handleDispatchToTransit = async (id) => {
    setError("");
    setSuccess("");
    setRowLoading(id, true);

    try {
      await updateTransferProgress(id, "AMBULANCE_ASSIGNED");
      await updateTransferProgress(id, "PATIENT_IN_TRANSIT");
      setSuccess("Ambulance assigned and patient moved to In Transit.");
      await loadData({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to dispatch patient transfer");
    } finally {
      setRowLoading(id, false);
    }
  };

  const handleComplete = async (transfer) => {
    const patientId = Number(transfer?.patient?.id);
    if (!patientId) {
      setError("Patient details are missing for this transfer.");
      return;
    }

    setError("");
    setSuccess("");
    setRowLoading(transfer.id, true);

    try {
      await transferPatientToMyHospital(patientId);
      await updateTransferProgress(transfer.id, "TRANSFER_COMPLETED");
      setSuccess("Patient transferred to your hospital and marked completed.");
      await loadData({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to complete patient transfer");
    } finally {
      setRowLoading(transfer.id, false);
    }
  };

  return (
    <div className="page-wrap">
      <Motion.div
        className="shell space-y-6"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">Patients</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {patients.length}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">Incoming</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {incomingRequests.length}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">My Active</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {myActiveRequests.length}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {completedTransfers.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="surface-card surface-card-shimmer p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    All Patients
                  </h2>
                </div>
                {patients.length === 0 ? (
                  <Link
                    to="/hospital/operations?openAddPatient=1"
                    className="btn-secondary px-3 py-2 text-sm"
                  >
                    Add Patient
                  </Link>
                ) : null}
              </div>

              <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-1">
                {patients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No patients yet. Use the dashboard to add patient cards,
                    then return to create transfer requests.
                  </div>
                ) : (
                  patients.map((patient) => {
                    const active =
                      String(patient.id) === String(selectedPatientId);
                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => setSelectedPatientId(String(patient.id))}
                        className={`w-full rounded-2xl border p-3 text-left transition-all ${
                          active
                            ? "border-sky-300 bg-sky-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {patient.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {patient.age} yrs · {patient.phone}
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                            {patient.bloodGroup}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {patient.condition}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="surface-card surface-card-shimmer p-5">
              <h2 className="text-lg font-bold tracking-tight">
                Create Transfer Request
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Raise a request for the selected patient.
              </p>
              <form className="mt-4 space-y-3" onSubmit={handleCreateTransfer}>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  {selectedPatient ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        Selected Patient
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedPatient.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {selectedPatient.condition}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {selectedPatient.age} yrs · {selectedPatient.bloodGroup}{" "}
                        · {selectedPatient.phone}
                      </p>
                    </>
                  ) : patients.length === 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">
                        No patient selected yet
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Add patients on the dashboard first, then come back to
                        create transfer requests.
                      </p>
                      <Link
                        to="/hospital/operations?openAddPatient=1"
                        className="mt-2 inline-flex btn-primary px-3 py-1.5 text-xs"
                      >
                        Add Patient On Operations
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Choose a patient from the roster.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={!selectedPatientId || creatingTransfer}
                >
                  {creatingTransfer
                    ? "Sending Request..."
                    : patients.length === 0
                      ? "Add Patient"
                      : "Send Transfer Request"}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-5">
            <SectionShell
              title="Incoming Requests"
              tone="border-amber-200 bg-amber-50 text-amber-900"
              count={incomingRequests.length}
              loading={loading}
              emptyText="No inbound patient transfers need action right now."
            >
              {incomingRequests.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  mode="incoming"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onDispatch={handleDispatchToTransit}
                  onComplete={handleComplete}
                />
              ))}
            </SectionShell>

            <SectionShell
              title="My Active Transfers"
              tone="border-indigo-200 bg-indigo-50 text-indigo-900"
              count={myActiveRequests.length}
              loading={loading}
              emptyText="Your hospital has no active patient transfers."
            >
              {myActiveRequests.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  mode="my-active"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onDispatch={handleDispatchToTransit}
                  onComplete={handleComplete}
                />
              ))}
            </SectionShell>

            <SectionShell
              title="Completed Transfers"
              tone="border-emerald-200 bg-emerald-50 text-emerald-900"
              count={completedTransfers.length}
              loading={loading}
              emptyText="No completed patient transfers yet."
            >
              {completedTransfers.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  mode="history"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onDispatch={handleDispatchToTransit}
                  onComplete={handleComplete}
                />
              ))}
            </SectionShell>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
      </Motion.div>

      <HospitalLoadingModal
        isOpen={loading}
        message="Loading Patient Transfers"
      />
    </div>
  );
};

export default PatientTransfersPage;
