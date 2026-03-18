import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useApiPolling } from "../../../hooks/useApiPolling";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";
import {
  createDoctor,
  fetchCurrentHospitalProfile,
  fetchDoctorById,
  fetchDoctors,
} from "./doctors.api";

const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Medicine",
  "Emergency Medicine",
  "Anesthesiology",
  "Dermatology",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Oncology",
  "Gastroenterology",
  "Endocrinology",
  "Nephrology",
  "Urology",
  "Pulmonology",
  "Ophthalmology",
  "Otolaryngology",
  "Gynecology",
  "Obstetrics",
  "Pathology",
  "Hematology",
  "Rheumatology",
  "Infectious Diseases",
  "Plastic Surgery",
  "Cardiothoracic Surgery",
  "Vascular Surgery",
  "Geriatrics",
  "Sports Medicine",
  "Nuclear Medicine",
  "Clinical Immunology",
  "Pain Management",
  "Rehabilitation Medicine",
];

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const normalizeSpecialization = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const DoctorsPage = () => {
  const [currentHospital, setCurrentHospital] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState("ALL");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    specialization: ["General Medicine"],
  });

  const hospitalId = Number(currentHospital?.id) || null;

  const loadDoctors = useCallback(
    async ({ showError = true, showRefreshing = false } = {}) => {
      if (showRefreshing) {
        setRefreshing(true);
      }

      try {
        const list = await fetchDoctors();
        setAllDoctors(Array.isArray(list) ? list : []);
        if (showError) {
          setError("");
        }
      } catch (err) {
        if (showError) {
          setError(err.message || "Failed to load doctors");
        }
      } finally {
        if (showRefreshing) {
          setRefreshing(false);
        }
      }
    },
    [hospitalId, selectedSpecialization],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await fetchCurrentHospitalProfile();
      setCurrentHospital(profile || null);
      const nextHospitalId = Number(profile?.id) || null;
      if (!nextHospitalId) {
        setAllDoctors([]);
        setError("Hospital profile missing. Please re-login.");
        return;
      }
      const list = await fetchDoctors();
      setAllDoctors(Array.isArray(list) ? list : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load doctor workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!hospitalId) return;
    loadDoctors();
  }, [hospitalId, loadDoctors]);

  useApiPolling(
    () => {
      if (!hospitalId) return;
      return loadDoctors({ showError: false });
    },
    {
      enabled: !loading,
      intervalMs: 700,
    },
  );

  const totalSpecializations = useMemo(() => {
    const bag = new Set();
    allDoctors.forEach((doctor) => {
      (doctor.specialization || []).forEach((spec) => bag.add(String(spec)));
    });
    return bag.size;
  }, [allDoctors]);

  const doctors = useMemo(() => {
    return allDoctors.filter((doctor) => {
      const inHospital = Number(doctor.hospital?.id) === hospitalId;
      if (!inHospital) {
        return false;
      }

      if (selectedSpecialization === "ALL") {
        return true;
      }

      return (doctor.specialization || []).some(
        (spec) =>
          normalizeSpecialization(spec) ===
          normalizeSpecialization(selectedSpecialization),
      );
    });
  }, [allDoctors, hospitalId, selectedSpecialization]);

  const toggleSpecialization = (spec) => {
    setForm((prev) => {
      const exists = prev.specialization.includes(spec);
      if (exists && prev.specialization.length === 1) {
        return prev;
      }
      return {
        ...prev,
        specialization: exists
          ? prev.specialization.filter((item) => item !== spec)
          : [...prev.specialization, spec],
      };
    });
  };

  const handleCreateDoctor = async (event) => {
    event.preventDefault();
    const name = form.name.trim();

    if (!name) {
      setError("Doctor name is required.");
      return;
    }
    if (!hospitalId) {
      setError("Hospital profile not loaded yet.");
      return;
    }
    if (!form.specialization.length) {
      setError("Select at least one specialization.");
      return;
    }

    setSavingDoctor(true);
    setError("");
    setSuccess("");

    try {
      await createDoctor({
        name,
        specialization: form.specialization,
        hospitalId,
      });
      setSuccess("Doctor created successfully.");
      setForm({ name: "", specialization: ["General Medicine"] });
      await loadDoctors({ showRefreshing: true });
    } catch (err) {
      setError(err.message || "Failed to create doctor");
    } finally {
      setSavingDoctor(false);
    }
  };

  const openDoctorDetails = async (id) => {
    setDetailsLoading(true);
    setError("");
    setDoctorModalOpen(true);
    try {
      const data = await fetchDoctorById(id);
      setSelectedDoctor(data || null);
    } catch (err) {
      setError(err.message || "Failed to load doctor details");
      setDoctorModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDoctorModal = () => {
    if (detailsLoading) {
      return;
    }
    setDoctorModalOpen(false);
    setSelectedDoctor(null);
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
            <p className="text-xs font-medium text-slate-500">Total Doctors</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {doctors.length}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">
              Specializations
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalSpecializations}
            </p>
          </div>
          <div className="hospital-metric-tile">
            <p className="text-xs font-medium text-slate-500">Filter</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {selectedSpecialization === "ALL"
                ? "All specializations"
                : selectedSpecialization}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="surface-card surface-card-shimmer p-5">
              <h2 className="text-lg font-bold tracking-tight">Add Doctor</h2>
              <p className="mt-1 text-sm text-slate-500">
                Uses POST /doctors with name, specialization array, and
                hospitalId.
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleCreateDoctor}>
                <div>
                  <label className="label-ui">Doctor Name</label>
                  <input
                    type="text"
                    className="input-ui"
                    placeholder="Dr. Meera Sharma"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="label-ui">Specialization</label>
                  <div className="max-h-60 space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    {SPECIALIZATIONS.map((spec) => {
                      const active = form.specialization.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialization(spec)}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                            active
                              ? "border-sky-300 bg-sky-50 text-sky-800"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={savingDoctor || !hospitalId}
                >
                  {savingDoctor ? "Creating Doctor..." : "Create Doctor"}
                </button>
              </form>
            </div>
          </div>

          <div className="surface-card surface-card-shimmer p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Hospital Doctors
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Click a doctor to load GET /doctors/:id details.
                </p>
              </div>
              {detailsLoading ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Loading details...
                </span>
              ) : null}
            </div>

            {doctors.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No doctors found for this hospital and filter.
              </div>
            ) : (
              <Motion.div
                className="mt-4 space-y-3"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {doctors.map((doctor) => (
                  <Motion.button
                    key={doctor.id}
                    type="button"
                    variants={cardVariants}
                    className={`surface-soft w-full border p-4 text-left transition ${
                      Number(selectedDoctor?.id) === Number(doctor.id)
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200/70 hover:border-slate-300"
                    }`}
                    onClick={() => openDoctorDetails(doctor.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-slate-900">
                          {doctor.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {doctor.hospital?.name || "Hospital"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        #{doctor.id}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(doctor.specialization || []).map((spec) => (
                        <span
                          key={`${doctor.id}-${spec}`}
                          className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                        >
                          {String(spec)}
                        </span>
                      ))}
                    </div>
                  </Motion.button>
                ))}
              </Motion.div>
            )}
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

        {doctorModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1422]/60 px-4 backdrop-blur-[2px]">
            <div className="surface-card surface-card-shimmer w-full max-w-2xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Doctor Details
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Uses GET /doctors/:id for consultant detail lookup.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={closeDoctorModal}
                  disabled={detailsLoading}
                >
                  Close
                </button>
              </div>

              {detailsLoading ? (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Loading doctor details...
                </div>
              ) : selectedDoctor ? (
                <>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div className="surface-soft border border-slate-200/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedDoctor.name}
                      </p>
                    </div>
                    <div className="surface-soft border border-slate-200/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Doctor Id
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        #{selectedDoctor.id}
                      </p>
                    </div>
                    <div className="surface-soft border border-slate-200/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Hospital
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedDoctor.hospital?.name || "Unknown Hospital"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(selectedDoctor.specialization || []).map((spec) => (
                      <span
                        key={`detail-${selectedDoctor.id}-${spec}`}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {String(spec)}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Doctor details are not available.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Motion.div>

      <HospitalLoadingModal isOpen={loading} message="Loading Doctors" />
    </div>
  );
};

export default DoctorsPage;
