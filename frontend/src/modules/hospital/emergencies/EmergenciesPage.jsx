import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useApiPolling } from "../../../hooks/useApiPolling";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";
import {
  createEmergency,
  fetchActiveEmergencies,
  fetchCurrentHospitalProfile,
  acceptEmergency,
  resolveEmergency,
} from "./emergencies.api";

const EMERGENCY_TYPES = [
  { id: "ICU_BED", label: "ICU Bed" },
  { id: "VENTILATOR", label: "Ventilator" },
  { id: "GENERAL_BED", label: "General Bed" },
  { id: "OXYGEN_CYLINDER", label: "Oxygen Cylinder" },
  { id: "AMBULANCE", label: "Ambulance" },
];

const PRIORITIES = ["CRITICAL", "HIGH", "NORMAL"];

const FLOW_STEPS = [
  { key: "PENDING", label: "Requested" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "RESOLVED", label: "Resolved" },
];

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

const priorityClasses = {
  CRITICAL: "bg-rose-100 text-rose-800",
  HIGH: "bg-orange-100 text-orange-800",
  NORMAL: "bg-slate-100 text-slate-700",
};

const statusClasses = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
};

const FlowTracker = ({ status }) => {
  const activeIdx = FLOW_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="mt-3 flex items-center">
      {FLOW_STEPS.map((step, idx) => {
        const done = idx <= activeIdx;
        const isCurrent = idx === activeIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`h-2.5 w-2.5 rounded-full border-2 transition-all ${
                  done
                    ? "border-sky-500 bg-sky-500"
                    : "border-slate-300 bg-white"
                } ${isCurrent ? "ring-2 ring-sky-200" : ""}`}
              />
              <span
                className={`mt-0.5 text-[10px] font-medium ${
                  done ? "text-sky-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < FLOW_STEPS.length - 1 && (
              <div
                className={`mb-3.5 h-0.5 w-10 transition-all ${
                  idx < activeIdx ? "bg-sky-400" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const EmergencyCard = ({
  emergency,
  mode,
  actionLoading,
  onAccept,
  onResolve,
}) => {
  const isLoading = Boolean(actionLoading[emergency.id]);

  const subText = () => {
    if (mode === "incoming")
      return `From: ${emergency.createdBy?.name || "Unknown"} · ${emergency.createdBy?.address || ""}`;
    if (emergency.status === "ACCEPTED" && emergency.acceptedBy)
      return `Accepted by: ${emergency.acceptedBy.name}`;
    if (emergency.status === "RESOLVED") return "Fulfilled & resolved";
    return "Awaiting response from network…";
  };

  return (
    <Motion.div
      variants={cardVariants}
      className="surface-soft border border-slate-200/70 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-slate-400">
              #{emergency.id}
            </span>
            <span
              className={`info-chip ${
                priorityClasses[emergency.priority] ||
                "bg-slate-100 text-slate-700"
              }`}
            >
              {emergency.priority}
            </span>
            <span
              className={`info-chip ${
                statusClasses[emergency.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {emergency.status}
            </span>
          </div>
          <p className="text-base font-bold text-slate-900">{emergency.type}</p>
          {emergency.additionalInfo ? (
            <p className="mt-0.5 text-sm text-slate-500">
              {emergency.additionalInfo}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-400">{subText()}</p>
        </div>

        <div className="shrink-0">
          {mode === "incoming" && emergency.status === "PENDING" && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onAccept(emergency.id)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              {isLoading && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Accept
            </button>
          )}
          {mode === "my-active" && emergency.status === "ACCEPTED" && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onResolve(emergency.id)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              {isLoading && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Mark Resolved
            </button>
          )}
        </div>
      </div>
      <FlowTracker status={emergency.status} />
    </Motion.div>
  );
};

const SectionShell = ({
  title,
  headerClass,
  count,
  loading,
  emptyText,
  children,
}) => (
  <div className="surface-card surface-card-shimmer overflow-hidden">
    <div
      className={`flex items-center justify-between border-b px-5 py-3.5 ${headerClass}`}
    >
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold shadow-sm">
        {count}
      </span>
    </div>
    <div className="p-4">
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-slate-100"
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

const EmergenciesPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [currentHospital, setCurrentHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [creating, setCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    type: "VENTILATOR",
    priority: "CRITICAL",
    additionalInfo: "",
  });

  const myId = Number(currentHospital?.id) || null;

  const incomingRequests = useMemo(
    () =>
      emergencies.filter(
        (e) => Number(e.createdBy?.id) !== myId && e.status === "PENDING",
      ),
    [emergencies, myId],
  );

  const myActiveRequests = useMemo(
    () =>
      emergencies.filter(
        (e) => Number(e.createdBy?.id) === myId && e.status !== "RESOLVED",
      ),
    [emergencies, myId],
  );

  const myResolvedRequests = useMemo(
    () =>
      emergencies.filter(
        (e) => Number(e.createdBy?.id) === myId && e.status === "RESOLVED",
      ),
    [emergencies, myId],
  );

  const load = useCallback(
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
        const [eList, profile] = await Promise.all([
          fetchActiveEmergencies(),
          fetchCurrentHospitalProfile(),
        ]);
        setEmergencies(Array.isArray(eList) ? eList : []);
        setCurrentHospital(profile || null);
        if (showError) {
          setError("");
        }
      } catch (err) {
        if (showError) {
          setError(err.message || "Failed to load emergencies");
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
    load({ showLoading: true });
  }, [load]);

  useApiPolling(() => load({ showError: false }), {
    enabled: !loading,
    intervalMs: 500,
  });

  const setRowLoading = (id, val) =>
    setActionLoading((prev) => ({ ...prev, [id]: val }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const additionalInfo = createForm.additionalInfo.trim();
    if (!additionalInfo) {
      setError("Please describe the emergency before raising it.");
      return;
    }
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      await createEmergency({
        type: createForm.type,
        priority: createForm.priority,
        additionalInfo,
      });
      setSuccess("Emergency raised — network has been alerted.");
      setCreateForm((prev) => ({ ...prev, additionalInfo: "" }));
      await load({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to raise emergency");
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = async (id) => {
    setError("");
    setSuccess("");
    setRowLoading(id, true);
    try {
      await acceptEmergency(id);
      setSuccess(
        "Emergency accepted. The requesting hospital has been notified.",
      );
      await load({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to accept emergency");
    } finally {
      setRowLoading(id, false);
    }
  };

  const handleResolve = async (id) => {
    setError("");
    setSuccess("");
    setRowLoading(id, true);
    try {
      await resolveEmergency(id);
      setSuccess("Emergency marked as resolved.");
      await load({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to resolve emergency");
    } finally {
      setRowLoading(id, false);
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <p className="text-xs font-medium text-slate-500">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {myResolvedRequests.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="surface-card surface-card-shimmer p-6">
            <h2 className="text-lg font-bold tracking-tight">
              Raise Emergency
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Alert the hospital network for urgent resource needs.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="label-ui">Resource Type</label>
                <select
                  className="input-ui"
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  {EMERGENCY_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-ui">Priority</label>
                <div className="mt-1 flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setCreateForm((prev) => ({ ...prev, priority: p }))
                      }
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                        createForm.priority === p
                          ? p === "CRITICAL"
                            ? "border-rose-600 bg-rose-600 text-white"
                            : p === "HIGH"
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-slate-700 bg-slate-700 text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-ui">Details</label>
                <textarea
                  className="textarea-ui"
                  rows={3}
                  placeholder="Describe urgency, patient count, etc."
                  value={createForm.additionalInfo}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      additionalInfo: e.target.value,
                    }))
                  }
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={creating}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Raising…
                  </span>
                ) : (
                  "Raise Emergency"
                )}
              </button>
            </form>
          </div>

          <div className="space-y-5 lg:col-span-2">
            <SectionShell
              title="Incoming Requests"
              headerClass="border-amber-200 bg-amber-50 text-amber-900"
              count={incomingRequests.length}
              loading={loading}
              emptyText="No incoming emergency requests right now."
            >
              {incomingRequests.map((e) => (
                <EmergencyCard
                  key={e.id}
                  emergency={e}
                  mode="incoming"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onResolve={handleResolve}
                />
              ))}
            </SectionShell>

            <SectionShell
              title="My Active Requests"
              headerClass="border-sky-200 bg-sky-50 text-sky-900"
              count={myActiveRequests.length}
              loading={loading}
              emptyText="You have no active emergency requests."
            >
              {myActiveRequests.map((e) => (
                <EmergencyCard
                  key={e.id}
                  emergency={e}
                  mode="my-active"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onResolve={handleResolve}
                />
              ))}
            </SectionShell>

            <SectionShell
              title="Resolved"
              headerClass="border-emerald-200 bg-emerald-50 text-emerald-900"
              count={myResolvedRequests.length}
              loading={loading}
              emptyText="No resolved emergencies yet."
            >
              {myResolvedRequests.map((e) => (
                <EmergencyCard
                  key={e.id}
                  emergency={e}
                  mode="resolved"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onResolve={handleResolve}
                />
              ))}
            </SectionShell>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
      </Motion.div>

      <HospitalLoadingModal isOpen={loading} message="Loading Emergencies" />
    </div>
  );
};

export default EmergenciesPage;
