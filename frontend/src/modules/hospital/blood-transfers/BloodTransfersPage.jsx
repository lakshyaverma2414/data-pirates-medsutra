import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useApiPolling } from "../../../hooks/useApiPolling";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";
import {
  acceptBloodTransferRequest,
  completeBloodTransferRequest,
  createBloodTransferRequest,
  fetchBloodNetworkStock,
  fetchBloodStock,
  fetchBloodTransferRequests,
  fetchCurrentHospitalProfile,
  rejectBloodTransferRequest,
  updateBloodStock,
} from "./bloodTransfers.api";

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

const progressToneMap = {
  REQUEST_SENT: "bg-slate-100 text-slate-700",
  ACCEPTED_BY_HOSPITAL: "bg-sky-100 text-sky-800",
  REQUEST_REJECTED: "bg-rose-100 text-rose-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

const statusToneMap = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const bloodGroupToEnum = {
  "A+": "A_PLUS",
  "A-": "A_MINUS",
  "B+": "B_PLUS",
  "B-": "B_MINUS",
  "AB+": "AB_PLUS",
  "AB-": "AB_MINUS",
  "O+": "O_PLUS",
  "O-": "O_MINUS",
};

const emptyRequestModal = {
  open: false,
  bloodGroupLabel: "",
  bloodGroupEnum: "",
  hospitals: [],
  selectedHospitalId: "",
  units: "",
};

const formatProgress = (progress) =>
  progress
    ?.toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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
              className="h-24 animate-pulse rounded-2xl bg-slate-100"
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

const RequestCard = ({
  request,
  mode,
  actionLoading,
  onAccept,
  onReject,
  onComplete,
}) => {
  const isLoading = Boolean(actionLoading[request.id]);
  const statusTone =
    statusToneMap[request.status] || "bg-slate-100 text-slate-700";
  const progressTone =
    progressToneMap[request.progress] || "bg-slate-100 text-slate-700";

  const canAccept = mode === "incoming" && request.status === "PENDING";
  const canReject = mode === "incoming" && request.status === "PENDING";
  const canComplete =
    mode === "outgoing" &&
    request.status === "ACCEPTED" &&
    request.progress !== "COMPLETED";

  return (
    <Motion.div
      variants={cardVariants}
      className="surface-soft border border-slate-200/70 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-slate-400">
              #{request.id}
            </span>
            <span className={`info-chip ${statusTone}`}>{request.status}</span>
            <span className={`info-chip ${progressTone}`}>
              {formatProgress(request.progress)}
            </span>
          </div>

          <p className="text-base font-bold text-slate-900">
            {request.bloodGroup} · {request.units} units
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "incoming" ? "From" : "To"}:{" "}
            {request.fromHospital?.name ||
              request.toHospital?.name ||
              "Unknown Hospital"}
          </p>
          {request.fromHospital?.phone || request.toHospital?.phone ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Contact:{" "}
              {request.fromHospital?.phone || request.toHospital?.phone}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canAccept ? (
            <button
              type="button"
              className="btn-primary px-3 py-2 text-sm"
              disabled={isLoading}
              onClick={() => onAccept(request.id)}
            >
              {isLoading ? "Updating..." : "Accept"}
            </button>
          ) : null}

          {canReject ? (
            <button
              type="button"
              className="btn-danger px-3 py-2 text-sm"
              disabled={isLoading}
              onClick={() => onReject(request.id)}
            >
              {isLoading ? "Updating..." : "Reject"}
            </button>
          ) : null}

          {canComplete ? (
            <button
              type="button"
              className="btn-secondary px-3 py-2 text-sm"
              disabled={isLoading}
              onClick={() => onComplete(request.id)}
            >
              {isLoading ? "Updating..." : "Mark Completed"}
            </button>
          ) : null}
        </div>
      </div>
    </Motion.div>
  );
};

const BloodTransfersPage = () => {
  const [currentHospital, setCurrentHospital] = useState(null);
  const [myBloodStock, setMyBloodStock] = useState([]);
  const [networkStock, setNetworkStock] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingStock, setEditingStock] = useState(null);
  const [stockValue, setStockValue] = useState("");
  const [savingStock, setSavingStock] = useState(null);

  const [actionLoading, setActionLoading] = useState({});
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [requestModal, setRequestModal] = useState(emptyRequestModal);
  const [requestModalError, setRequestModalError] = useState("");

  const currentHospitalId = Number(currentHospital?.id) || null;

  const incomingActiveRequests = useMemo(
    () =>
      incomingRequests.filter(
        (item) =>
          item.progress !== "COMPLETED" &&
          item.status !== "REJECTED" &&
          item.progress !== "REQUEST_REJECTED",
      ),
    [incomingRequests],
  );

  const outgoingActiveRequests = useMemo(
    () =>
      outgoingRequests.filter(
        (item) =>
          item.progress !== "COMPLETED" &&
          item.status !== "REJECTED" &&
          item.progress !== "REQUEST_REJECTED",
      ),
    [outgoingRequests],
  );

  const rejectedIncomingRequests = useMemo(
    () =>
      incomingRequests.filter(
        (item) =>
          item.status === "REJECTED" || item.progress === "REQUEST_REJECTED",
      ),
    [incomingRequests],
  );

  const pendingIncoming = useMemo(
    () =>
      incomingActiveRequests.filter((item) => item.status === "PENDING").length,
    [incomingActiveRequests],
  );

  const activeOutgoing = useMemo(
    () => outgoingActiveRequests.length,
    [outgoingActiveRequests],
  );

  const totalCompleted = useMemo(() => {
    const combined = [...incomingRequests, ...outgoingRequests];
    return combined.filter((item) => item.progress === "COMPLETED").length;
  }, [incomingRequests, outgoingRequests]);

  const completedRequests = useMemo(() => {
    const map = new Map();
    [...incomingRequests, ...outgoingRequests]
      .filter((item) => item.progress === "COMPLETED")
      .forEach((item) => {
        map.set(item.id, item);
      });
    return Array.from(map.values());
  }, [incomingRequests, outgoingRequests]);

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
        const [profileRes, myStockRes, networkRes, incomingRes, outgoingRes] =
          await Promise.all([
            fetchCurrentHospitalProfile(),
            fetchBloodStock(),
            fetchBloodNetworkStock(),
            fetchBloodTransferRequests("incoming"),
            fetchBloodTransferRequests("outgoing"),
          ]);

        setCurrentHospital(profileRes || null);
        setMyBloodStock(Array.isArray(myStockRes) ? myStockRes : []);
        setNetworkStock(Array.isArray(networkRes) ? networkRes : []);
        setIncomingRequests(Array.isArray(incomingRes) ? incomingRes : []);
        setOutgoingRequests(Array.isArray(outgoingRes) ? outgoingRes : []);
        if (showError) {
          setError("");
        }
      } catch (err) {
        if (showError) {
          setError(err.message || "Failed to load blood transfer data");
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

  const startStockEdit = (item) => {
    setEditingStock(item.bloodGroup);
    setStockValue(String(item.units));
  };

  const cancelStockEdit = () => {
    setEditingStock(null);
    setStockValue("");
  };

  const saveStock = async (bloodGroupLabel) => {
    const units = Number(stockValue);
    if (!Number.isFinite(units) || units < 0) {
      setError("Please enter a valid stock value.");
      return;
    }

    const bloodGroup = bloodGroupToEnum[bloodGroupLabel] || bloodGroupLabel;
    setSavingStock(bloodGroupLabel);
    setError("");
    setSuccess("");

    try {
      await updateBloodStock(bloodGroup, units);
      setSuccess("Blood stock updated successfully.");
      setMyBloodStock((prev) =>
        prev.map((item) =>
          item.bloodGroup === bloodGroupLabel ? { ...item, units } : item,
        ),
      );
      cancelStockEdit();
    } catch (err) {
      setError(err.message || "Failed to update blood stock");
    } finally {
      setSavingStock(null);
    }
  };

  const openRequestModal = (row) => {
    const options = (Array.isArray(row?.fromHospital) ? row.fromHospital : [])
      .filter((hospital) => Number(hospital.id) !== currentHospitalId)
      .filter((hospital) => Number(hospital.units) > 0)
      .sort((a, b) => Number(b.units) - Number(a.units));

    if (!options.length) {
      setError(
        "No hospitals currently have units available for this blood group.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setRequestModalError("");
    setRequestModal({
      open: true,
      bloodGroupLabel: row.bloodGroup,
      bloodGroupEnum: bloodGroupToEnum[row.bloodGroup] || row.bloodGroup,
      hospitals: options,
      selectedHospitalId: String(options[0].id),
      units: "",
    });
  };

  const closeRequestModal = () => {
    if (creatingRequest) return;
    setRequestModalError("");
    setRequestModal(emptyRequestModal);
  };

  const handleCreateRequest = async (event) => {
    event.preventDefault();
    const units = Number(requestModal.units);
    setRequestModalError("");

    if (!Number.isFinite(units) || units <= 0) {
      setRequestModalError("Units must be greater than 0.");
      return;
    }

    if (!requestModal.selectedHospitalId) {
      setRequestModalError("Select a hospital from the network first.");
      return;
    }

    const selectedHospital = requestModal.hospitals.find(
      (hospital) => String(hospital.id) === requestModal.selectedHospitalId,
    );

    if (!selectedHospital) {
      setRequestModalError(
        "Selected hospital is not available for this blood group.",
      );
      return;
    }

    if (units > Number(selectedHospital.units)) {
      setRequestModalError(
        `Requested units exceed available stock (${selectedHospital.units}).`,
      );
      return;
    }

    setCreatingRequest(true);
    setSuccess("");
    setRequestModalError("");

    try {
      await createBloodTransferRequest({
        bloodGroup: requestModal.bloodGroupEnum,
        units,
        requestedFrom: Number(requestModal.selectedHospitalId),
      });
      setSuccess("Blood request created and sent to selected hospital.");
      closeRequestModal();
      await loadData({ showRefreshing: true });
    } catch (err) {
      setRequestModalError(err.message || "Failed to create blood request");
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleAccept = async (id) => {
    setError("");
    setSuccess("");
    setRowLoading(id, true);
    try {
      await acceptBloodTransferRequest(id);
      setSuccess("Blood request accepted.");
      await loadData({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to accept request");
    } finally {
      setRowLoading(id, false);
    }
  };

  const handleReject = async (id) => {
    setError("");
    setSuccess("");
    setRowLoading(id, true);
    try {
      await rejectBloodTransferRequest(id);
      setSuccess("Blood request rejected.");
      await loadData({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to reject request");
    } finally {
      setRowLoading(id, false);
    }
  };

  const handleComplete = async (id) => {
    setError("");
    setSuccess("");
    setRowLoading(id, true);
    try {
      await completeBloodTransferRequest(id);
      setSuccess("Blood transfer marked completed.");
      await loadData({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to complete transfer");
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">
              Incoming Pending
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {pendingIncoming}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">
              Outgoing Active
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {activeOutgoing}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalCompleted}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">Network Groups</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {networkStock.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="surface-card surface-card-shimmer p-5">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Network Blood Availability
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick a blood group and send a request directly to a hospital
                with available units.
              </p>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">
                        Blood Group
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold">
                        Total Units
                      </th>
                      <th className="px-4 py-2.5 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkStock.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-slate-400"
                        >
                          No network blood stock data available.
                        </td>
                      </tr>
                    ) : (
                      networkStock.map((row) => {
                        const availableHospitals = (
                          Array.isArray(row?.fromHospital)
                            ? row.fromHospital
                            : []
                        )
                          .filter(
                            (hospital) =>
                              Number(hospital.id) !== currentHospitalId,
                          )
                          .filter((hospital) => Number(hospital.units) > 0);

                        return (
                          <tr
                            key={row.bloodGroup}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {row.bloodGroup}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {row.units}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                className="btn-primary px-3 py-1.5 text-xs"
                                disabled={!availableHospitals.length}
                                onClick={() => openRequestModal(row)}
                              >
                                Request
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="surface-card surface-card-shimmer p-5">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                My Blood Stock
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep your blood inventory synchronized for faster transfer
                fulfillment.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {(myBloodStock.length
                  ? myBloodStock
                  : BLOOD_GROUPS.map((g) => ({ bloodGroup: g.label, units: 0 }))
                ).map((item) => {
                  const isEditing = editingStock === item.bloodGroup;
                  const isSaving = savingStock === item.bloodGroup;
                  return (
                    <div
                      key={item.bloodGroup}
                      className="surface-soft relative border border-slate-200/70 p-2.5"
                    >
                      {isEditing ? (
                        <div>
                          <p className="text-xs font-semibold text-rose-700">
                            {item.bloodGroup}
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              className="h-8 w-full rounded-lg border border-rose-200 px-2 text-sm"
                              value={stockValue}
                              onChange={(e) => setStockValue(e.target.value)}
                              disabled={isSaving}
                            />
                          </div>
                          <div className="mt-2 flex gap-1.5">
                            <button
                              type="button"
                              className="btn-danger h-8 flex-1 rounded-lg py-1 text-xs"
                              onClick={() => saveStock(item.bloodGroup)}
                              disabled={isSaving}
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="h-8 flex-1 rounded-lg border border-slate-300 bg-white py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              onClick={cancelStockEdit}
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-rose-700">
                            {item.bloodGroup}
                          </p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">
                            {item.units}
                          </p>
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-xs text-slate-500 transition hover:bg-rose-100"
                            onClick={() => startStockEdit(item)}
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <SectionShell
              title="Incoming Requests"
              tone="border-amber-200 bg-amber-50 text-amber-900"
              count={incomingActiveRequests.length}
              loading={loading}
              emptyText="No incoming blood requests right now."
            >
              {incomingActiveRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  mode="incoming"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onComplete={handleComplete}
                />
              ))}
            </SectionShell>

            <SectionShell
              title="Outgoing Requests"
              tone="border-sky-200 bg-sky-50 text-sky-900"
              count={outgoingActiveRequests.length}
              loading={loading}
              emptyText="No outgoing blood requests in progress."
            >
              {outgoingActiveRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  mode="outgoing"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onComplete={handleComplete}
                />
              ))}
            </SectionShell>

            <SectionShell
              title="Rejected Requests"
              tone="border-rose-200 bg-rose-50 text-rose-900"
              count={rejectedIncomingRequests.length}
              loading={loading}
              emptyText="No rejected incoming requests."
            >
              {rejectedIncomingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  mode="rejected"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onComplete={handleComplete}
                />
              ))}
            </SectionShell>

            <SectionShell
              title="Completed Transfers"
              tone="border-emerald-200 bg-emerald-50 text-emerald-900"
              count={completedRequests.length}
              loading={loading}
              emptyText="No completed blood transfers yet."
            >
              {completedRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  mode="history"
                  actionLoading={actionLoading}
                  onAccept={handleAccept}
                  onReject={handleReject}
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

        {requestModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1422]/60 px-4 backdrop-blur-[2px]">
            <div className="surface-card surface-card-shimmer w-full max-w-lg p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Request Blood Units
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Blood Group:{" "}
                    <span className="font-semibold">
                      {requestModal.bloodGroupLabel}
                    </span>
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Transfer Desk
                </span>
              </div>

              <form className="mt-4 space-y-4" onSubmit={handleCreateRequest}>
                {requestModalError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {requestModalError}
                  </div>
                ) : null}

                <div>
                  <label className="label-ui">Choose Hospital</label>
                  <div className="max-h-56 space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    {requestModal.hospitals.map((hospital) => {
                      const isSelected =
                        requestModal.selectedHospitalId === String(hospital.id);
                      return (
                        <button
                          key={hospital.id}
                          type="button"
                          onClick={() =>
                            setRequestModal((prev) => {
                              setRequestModalError("");
                              return {
                                ...prev,
                                selectedHospitalId: String(hospital.id),
                              };
                            })
                          }
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? "border-sky-300 bg-sky-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {hospital.name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {hospital.address || "Address unavailable"}
                              </p>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              {hospital.units} units
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            {hospital.phone ? (
                              <span className="rounded-full bg-slate-100 px-2 py-1">
                                {hospital.phone}
                              </span>
                            ) : null}
                            {hospital.email ? (
                              <span className="rounded-full bg-slate-100 px-2 py-1">
                                {hospital.email}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label-ui">Units</label>
                  <input
                    type="number"
                    min="1"
                    className="input-ui"
                    placeholder="Enter units"
                    value={requestModal.units}
                    onChange={(e) =>
                      setRequestModal((prev) => {
                        setRequestModalError("");
                        return {
                          ...prev,
                          units: e.target.value,
                        };
                      })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeRequestModal}
                    disabled={creatingRequest}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creatingRequest}
                  >
                    {creatingRequest ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </Motion.div>

      <HospitalLoadingModal
        isOpen={loading}
        message="Loading Blood Transfers"
      />
    </div>
  );
};

export default BloodTransfersPage;
