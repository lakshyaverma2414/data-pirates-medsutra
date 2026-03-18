import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchDashboardData,
  updateResource,
  updateBloodStock,
  createPatient,
} from "./dashboard.api";
import { motion as Motion } from "framer-motion";
import { useApiPolling } from "../../../hooks/useApiPolling";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const BLOOD_GROUP_ENUM_MAP = {
  "A+": "A_PLUS",
  "A-": "A_MINUS",
  "B+": "B_PLUS",
  "B-": "B_MINUS",
  "AB+": "AB_PLUS",
  "AB-": "AB_MINUS",
  "O+": "O_PLUS",
  "O-": "O_MINUS",
};

const RESOURCE_ENUM_MAP = {
  "ICU Bed": "ICU_BED",
  Ventilator: "VENTILATOR",
  "General Bed": "GENERAL_BED",
  "Oxygen Cylinder": "OXYGEN_CYLINDER",
  Ambulance: "AMBULANCE",
};

const PHONE_REGEX = /^\d{10}$/;

const OperationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({
    resources: [],
    bloodStock: [],
    patients: [],
    profile: null,
  });
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingResource, setSavingResource] = useState(null);
  const [resourceError, setResourceError] = useState("");
  const [editingBlood, setEditingBlood] = useState(null);
  const [editBloodValue, setEditBloodValue] = useState("");
  const [savingBlood, setSavingBlood] = useState(null);
  const [bloodError, setBloodError] = useState("");
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientError, setPatientError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: "",
    age: "",
    bloodGroup: "O_PLUS",
    phone: "",
    condition: "",
  });

  const closePatientModal = () => {
    setShowPatientForm(false);
    setPatientError("");
  };

  const startEdit = (res) => {
    setEditingResource(res.name);
    setEditValue(String(res.units));
    setResourceError("");
  };

  const cancelEdit = () => {
    setEditingResource(null);
    setEditValue("");
    setResourceError("");
  };

  const startBloodEdit = (b) => {
    setEditingBlood(b.bloodGroup);
    setEditBloodValue(String(b.units));
    setBloodError("");
  };

  const cancelBloodEdit = () => {
    setEditingBlood(null);
    setEditBloodValue("");
    setBloodError("");
  };

  const saveBloodStock = async (bloodGroup) => {
    const units = parseInt(editBloodValue, 10);
    if (!Number.isFinite(units) || units < 0) {
      setBloodError("Enter a valid number");
      return;
    }
    setSavingBlood(bloodGroup);
    setBloodError("");
    const enumKey = BLOOD_GROUP_ENUM_MAP[bloodGroup] ?? bloodGroup;
    try {
      await updateBloodStock(enumKey, units);
      setData((prev) => ({
        ...prev,
        bloodStock: prev.bloodStock.map((b) =>
          b.bloodGroup === bloodGroup ? { ...b, units } : b,
        ),
      }));
      setEditingBlood(null);
      setEditBloodValue("");
    } catch (err) {
      setBloodError(err.message || "Failed to save");
    } finally {
      setSavingBlood(null);
    }
  };

  const saveResource = async (name) => {
    const units = parseInt(editValue, 10);
    if (!Number.isFinite(units) || units < 0) {
      setResourceError("Enter a valid number");
      return;
    }
    setSavingResource(name);
    setResourceError("");
    const enumKey = RESOURCE_ENUM_MAP[name] ?? name;
    try {
      await updateResource(enumKey, units);
      setData((prev) => ({
        ...prev,
        resources: prev.resources.map((r) =>
          r.name === name ? { ...r, units } : r,
        ),
      }));
      setEditingResource(null);
      setEditValue("");
    } catch (err) {
      setResourceError(err.message || "Failed to save");
    } finally {
      setSavingResource(null);
    }
  };

  const submitPatient = async (event) => {
    event.preventDefault();
    const age = Number(patientForm.age);
    const phone = patientForm.phone.trim();
    const payload = {
      name: patientForm.name.trim(),
      age,
      bloodGroup: patientForm.bloodGroup,
      phone,
      condition: patientForm.condition.trim(),
    };

    if (
      !payload.name ||
      !payload.phone ||
      !payload.condition ||
      !Number.isFinite(age) ||
      age <= 0
    ) {
      setPatientError("Enter valid patient details");
      return;
    }

    if (!PHONE_REGEX.test(phone)) {
      setPatientError("Phone number must be exactly 10 digits");
      return;
    }

    setSavingPatient(true);
    setPatientError("");

    try {
      const response = await createPatient(payload);
      const created = response?.patient;
      if (created) {
        setData((prev) => ({
          ...prev,
          patients: [
            created,
            ...(Array.isArray(prev.patients) ? prev.patients : []),
          ],
        }));
      }
      setPatientForm({
        name: "",
        age: "",
        bloodGroup: "O_PLUS",
        phone: "",
        condition: "",
      });
      setShowPatientForm(false);
    } catch (err) {
      setPatientError(err.message || "Failed to add patient");
    } finally {
      setSavingPatient(false);
    }
  };

  const loadDashboardData = useCallback(
    async ({ showLoading = false, silent = false } = {}) => {
      if (showLoading) {
        setLoading(true);
      }
      if (!showLoading && !silent) {
        setIsSyncing(true);
      }

      try {
        const res = await fetchDashboardData();
        setData(res);
        setLastSyncedAt(Date.now());
      } catch {
        // Keep the current data on silent polling failures for better UX.
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        if (!showLoading && !silent) {
          setIsSyncing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadDashboardData({ showLoading: true });
  }, [loadDashboardData]);

  useEffect(() => {
    if (searchParams.get("openAddPatient") !== "1") {
      return;
    }

    setShowPatientForm(true);
    setPatientError("");

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("openAddPatient");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useApiPolling(() => loadDashboardData({ silent: true }), {
    enabled: !loading,
    intervalMs: 500,
  });

  const { profile, resources, bloodStock, patients } = data || {};
  const lat = profile?.lat || 28.704059;
  const lng = profile?.lng ?? profile?.long ?? 77.10249;
  const mapBounds = {
    minLat: (lat - 0.03).toFixed(6),
    maxLat: (lat + 0.03).toFixed(6),
    minLng: (lng - 0.03).toFixed(6),
    maxLng: (lng + 0.03).toFixed(6),
  };
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapBounds.minLng}%2C${mapBounds.minLat}%2C${mapBounds.maxLng}%2C${mapBounds.maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;

  // Dummy values if API turns out empty
  const defaultResources = resources?.length
    ? resources
    : [
        { name: "ICU Beds", units: 10 },
        { name: "Oxygen Cylinders", units: 45 },
        { name: "Ventilators", units: 5 },
      ];

  const defaultBloodStock = bloodStock?.length
    ? bloodStock
    : [
        { bloodGroup: "A+", units: 15 },
        { bloodGroup: "O+", units: 20 },
        { bloodGroup: "B-", units: 2 },
      ];

  const defaultPatients = patients?.length
    ? patients
    : [
        {
          id: "-",
          name: "No patients yet",
          age: "-",
          bloodGroup: "-",
          phone: "-",
          condition: "Add first patient to begin transfer requests",
        },
      ];

  const totalResourceUnits = defaultResources.reduce(
    (acc, item) => acc + (Number(item.units) || 0),
    0,
  );
  const totalBloodUnits = defaultBloodStock.reduce(
    (acc, item) => acc + (Number(item.units) || 0),
    0,
  );
  const criticalBloodUnits = defaultBloodStock
    .filter((item) => item.bloodGroup === "O+" || item.bloodGroup === "O-")
    .reduce((acc, item) => acc + (Number(item.units) || 0), 0);
  const updatedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <div className="page-wrap">
      <Motion.div
        className="shell space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Motion.div
            variants={itemVariants}
            className="col-span-1 space-y-5 lg:col-span-2"
          >
            <div className="surface-card p-4 sm:p-5">
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#1F3A5F] sm:text-xl">
                    Resources Status
                  </h2>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {defaultResources.length} Types
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
                  {defaultResources.map((res) => {
                    const isEditing = editingResource === res.name;
                    const isSaving = savingResource === res.name;
                    return (
                      <div
                        key={res.name}
                        className="surface-soft relative p-2.5 sm:p-3"
                      >
                        {isEditing ? (
                          <div>
                            <p className="mb-2 text-[11px] leading-tight text-slate-500 sm:text-xs">
                              {res.name}
                            </p>
                            <div className="mb-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditValue((v) =>
                                    String(
                                      Math.max(0, (parseInt(v, 10) || 0) - 1),
                                    ),
                                  )
                                }
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="0"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveResource(res.name);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                disabled={isSaving}
                                className="h-7 w-full rounded-lg border border-blue-300 bg-white px-1 text-center text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditValue((v) =>
                                    String((parseInt(v, 10) || 0) + 1),
                                  )
                                }
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                            {resourceError && (
                              <p className="mb-1.5 text-[10px] text-rose-600">
                                {resourceError}
                              </p>
                            )}
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveResource(res.name)}
                                disabled={isSaving}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-600 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                              >
                                {isSaving ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  "Save"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="flex flex-1 items-center justify-center rounded-lg bg-slate-200 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] leading-tight text-slate-500 sm:text-xs">
                              {res.name}
                            </p>
                            <p className="mt-1 text-xl font-bold text-sky-700 sm:text-2xl">
                              {res.units}
                            </p>
                            <button
                              type="button"
                              onClick={() => startEdit(res)}
                              title="Edit"
                              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:bg-sky-100 hover:text-sky-600"
                            >
                              ✎
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#C0392B] sm:text-xl">
                    Blood Bank Stock
                  </h2>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    {defaultBloodStock.length} Groups
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
                  {defaultBloodStock.map((blood, i) => {
                    const isEditing = editingBlood === blood.bloodGroup;
                    const isSaving = savingBlood === blood.bloodGroup;
                    return (
                      <div
                        key={i}
                        className="surface-soft relative p-2.5 sm:p-3"
                      >
                        {isEditing ? (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-rose-700">
                              {blood.bloodGroup}
                            </p>
                            <div className="mb-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditBloodValue((v) =>
                                    String(
                                      Math.max(0, (parseInt(v, 10) || 0) - 1),
                                    ),
                                  )
                                }
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="0"
                                autoFocus
                                value={editBloodValue}
                                onChange={(e) =>
                                  setEditBloodValue(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    saveBloodStock(blood.bloodGroup);
                                  if (e.key === "Escape") cancelBloodEdit();
                                }}
                                disabled={isSaving}
                                className="h-7 w-full rounded-lg border border-rose-300 bg-white px-1 text-center text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-60"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditBloodValue((v) =>
                                    String((parseInt(v, 10) || 0) + 1),
                                  )
                                }
                                disabled={isSaving}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                            {bloodError && (
                              <p className="mb-1.5 text-[10px] text-rose-600">
                                {bloodError}
                              </p>
                            )}
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveBloodStock(blood.bloodGroup)}
                                disabled={isSaving}
                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-600 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                              >
                                {isSaving ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  "Save"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={cancelBloodEdit}
                                disabled={isSaving}
                                className="flex flex-1 items-center justify-center rounded-lg bg-slate-200 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-rose-700">
                              {blood.bloodGroup}
                            </p>
                            <p className="mt-1 text-xl font-bold sm:text-2xl">
                              {blood.units}
                            </p>
                            <button
                              type="button"
                              onClick={() => startBloodEdit(blood)}
                              title="Edit"
                              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                            >
                              ✎
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#1F3A5F] sm:text-xl">
                  Patients
                </h2>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {patients?.length || 0} Records
                  </span>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-sm"
                    onClick={() => {
                      setShowPatientForm(true);
                      setPatientError("");
                    }}
                  >
                    Add Patient
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {defaultPatients.map((patient, i) => (
                  <div key={patient.id || i} className="surface-soft p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {patient.name}
                      </p>
                      <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                        {patient.bloodGroup}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {patient.age} yrs · {patient.phone}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {patient.condition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Motion.div>

          <Motion.div
            variants={itemVariants}
            className="surface-card col-span-1 flex flex-col overflow-hidden"
          >
            <div className="flex-none space-y-2 px-6 pb-0 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Hospital details
              </p>
              <h2 className="text-xl font-bold text-[#1F3A5F]">
                Hospital Details
              </h2>
              {profile?.address ? (
                <p className="text-sm leading-relaxed text-slate-600">
                  {profile.address}
                </p>
              ) : null}
              <p className="text-sm text-slate-600">
                Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Open in Maps
              </a>
            </div>
            <div className="relative mt-4 min-h-80 w-full grow overflow-hidden rounded-b-[28px] border-t border-slate-200 bg-slate-100">
              <iframe
                title="Hospital Location Map"
                className="h-full w-full"
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  pointerEvents: "auto",
                  touchAction: "pan-x pan-y",
                }}
                loading="lazy"
                src={mapEmbedUrl}
              ></iframe>
            </div>
          </Motion.div>
        </div>
      </Motion.div>

      {showPatientForm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4"
          onClick={closePatientModal}
        >
          <div
            className="surface-card w-full max-w-2xl p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-indigo-700 sm:text-xl">
                Add Patient
              </h3>
              <button
                type="button"
                onClick={closePatientModal}
                className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form className="space-y-3" onSubmit={submitPatient}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className="input-ui"
                  placeholder="Patient Name"
                  value={patientForm.name}
                  onChange={(e) =>
                    setPatientForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
                <input
                  className="input-ui"
                  type="number"
                  min="1"
                  placeholder="Age"
                  value={patientForm.age}
                  onChange={(e) =>
                    setPatientForm((prev) => ({
                      ...prev,
                      age: e.target.value,
                    }))
                  }
                />
                <input
                  className="input-ui"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="Phone"
                  value={patientForm.phone}
                  onChange={(e) =>
                    setPatientForm((prev) => ({
                      ...prev,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                />
                <select
                  className="input-ui"
                  value={patientForm.bloodGroup}
                  onChange={(e) =>
                    setPatientForm((prev) => ({
                      ...prev,
                      bloodGroup: e.target.value,
                    }))
                  }
                >
                  <option value="A_PLUS">A+</option>
                  <option value="A_MINUS">A-</option>
                  <option value="B_PLUS">B+</option>
                  <option value="B_MINUS">B-</option>
                  <option value="AB_PLUS">AB+</option>
                  <option value="AB_MINUS">AB-</option>
                  <option value="O_PLUS">O+</option>
                  <option value="O_MINUS">O-</option>
                </select>
              </div>
              <textarea
                className="textarea-ui"
                rows={3}
                placeholder="Condition"
                value={patientForm.condition}
                onChange={(e) =>
                  setPatientForm((prev) => ({
                    ...prev,
                    condition: e.target.value,
                  }))
                }
              />
              {patientError ? (
                <p className="text-xs text-rose-600">{patientError}</p>
              ) : null}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={savingPatient}
              >
                {savingPatient ? "Saving..." : "Save Patient"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <HospitalLoadingModal isOpen={loading} message="Loading Operations" />
    </div>
  );
};

export default OperationsPage;
