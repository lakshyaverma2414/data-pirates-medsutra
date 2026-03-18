import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";
import { updateResource, updateBloodStock } from "./onboarding.api";

const RESOURCES_LIST = [
  { id: "ICU_BED", label: "ICU Bed" },
  { id: "VENTILATOR", label: "Ventilator" },
  { id: "GENERAL_BED", label: "General Bed" },
  { id: "OXYGEN_CYLINDER", label: "Oxygen Cylinder" },
  { id: "AMBULANCE", label: "Ambulance" },
];

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

const ONBOARDING_STATS = [
  { value: "Step 1", label: "Configure resources" },
  { value: "Step 2", label: "Initialize blood stock" },
  { value: "Live", label: "Ready for routing after setup" },
  { value: "Realtime", label: "Dashboard sync stays unchanged" },
];

const resourceHighlights = [
  "ICU readiness",
  "Ventilator capacity",
  "Bed availability",
  "Ambulance coverage",
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States for each step
  const [resources, setResources] = useState({});
  const [hasBloodStock, setHasBloodStock] = useState(null);
  const [bloodStock, setBloodStock] = useState({});

  const handleResourceChange = (id, value) => {
    setResources({ ...resources, [id]: parseInt(value) || 0 });
  };

  const handleBloodStockChange = (id, value) => {
    setBloodStock({ ...bloodStock, [id]: parseInt(value) || 0 });
  };

  const submitResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = Object.entries(resources).map(([name, units]) => {
        if (units > 0) return updateResource(name, units);
        return Promise.resolve();
      });
      await Promise.all(promises);
      setStep(2);
    } catch (err) {
      setError(err.message || "Error saving resources");
    } finally {
      setLoading(false);
    }
  };

  const submitBloodStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = BLOOD_GROUPS.map((bg) => {
        const units = bloodStock[bg.id] || 0;
        return updateBloodStock(bg.id, units);
      });
      await Promise.all(promises);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Error saving blood stock");
    } finally {
      setLoading(false);
    }
  };

  const handleNoBloodStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = BLOOD_GROUPS.map((bg) => updateBloodStock(bg.id, 0));
      await Promise.all(promises);
      setHasBloodStock(false);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Error saving blood stock");
    } finally {
      setLoading(false);
    }
  };

  const progressPct = (step / 2) * 100;

  return (
    <div className="auth-screen">
      <HospitalLoadingModal isOpen={loading} message="Processing details..." />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center">
        <div className="mb-8 text-center text-white">
          <div className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(192,57,43,0.16)] text-2xl font-bold text-[#F8D0CB]">
              +
            </span>
            <span className="text-3xl font-bold">MedSutra</span>
          </div>

          <div className="mt-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
          </div>

          <h1 className="mt-5 text-3xl font-bold">Hospital Setup</h1>
          <p className="mt-2 max-w-2xl text-white/80">
            Configure your hospital resources and blood availability before
            entering the dashboard.
          </p>
        </div>

        <div className="auth-card w-full overflow-hidden">
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {ONBOARDING_STATS.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl p-4 text-center ${
                  (step === 1 && item.value === "Step 1") ||
                  (step === 2 && item.value === "Step 2")
                    ? "bg-[#1F3A5F] text-white"
                    : "bg-[#F7FAFC]"
                }`}
              >
                <strong
                  className={`block text-lg font-bold ${
                    (step === 1 && item.value === "Step 1") ||
                    (step === 2 && item.value === "Step 2")
                      ? "text-white"
                      : "text-[#1F3A5F]"
                  }`}
                >
                  {item.value}
                </strong>
                <span
                  className={`mt-1 block text-xs ${
                    (step === 1 && item.value === "Step 1") ||
                    (step === 2 && item.value === "Step 2")
                      ? "text-white/70"
                      : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="progress-track">
            <Motion.div
              className="progress-bar"
              initial={{ width: "33.33%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="pt-6">
            <p className="auth-card__eyebrow">Setup Progress</p>
            <h2 className="auth-card__title">Setup Your Hospital</h2>
            {error ? (
              <div className="status-banner status-banner--error mt-6">
                {error}
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <Motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="mt-6"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">
                        Set Initial Resources
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Enter current counts for the hospital resources you want
                        reflected on the live network.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resourceHighlights.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-[rgba(42,157,143,0.12)] px-3 py-1 text-xs font-semibold text-[#2A9D8F]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {RESOURCES_LIST.map((resource) => (
                      <div
                        key={resource.id}
                        className="rounded-3xl bg-[#F7FAFC] p-4"
                      >
                        <label className="label-ui">{resource.label}</label>
                        <input
                          type="number"
                          min="0"
                          className="input-ui"
                          placeholder="0 units"
                          value={resources[resource.id] || ""}
                          onChange={(e) =>
                            handleResourceChange(resource.id, e.target.value)
                          }
                        />
                        <p className="mt-2 text-xs text-slate-400">
                          Visible on your command dashboard after setup.
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      className="btn-primary px-6"
                      onClick={submitResources}
                    >
                      Save & Continue
                    </button>
                  </div>
                </Motion.div>
              ) : (
                <Motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="mt-6"
                >
                  <div className="mb-5">
                    <h3 className="text-xl font-semibold">
                      Initialize Blood Stock
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose whether your facility manages blood stock and then
                      set opening quantities by group.
                    </p>
                  </div>

                  {hasBloodStock === null ? (
                    <div className="rounded-3xl bg-[#F7FAFC] py-10 text-center">
                      <p className="mb-6 text-lg text-slate-700">
                        Do you process or manage blood stock at your facility?
                      </p>
                      <div className="segmented-choice">
                        <button
                          className="btn-primary"
                          onClick={() => setHasBloodStock(true)}
                          disabled={loading}
                        >
                          Yes
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={handleNoBloodStock}
                          disabled={loading}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {BLOOD_GROUPS.map((bg) => (
                          <div
                            key={bg.id}
                            className="rounded-3xl bg-[#F7FAFC] p-4"
                          >
                            <label className="label-ui text-[#C0392B]">
                              {bg.label} Blood
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="input-ui"
                              placeholder="0 units"
                              value={bloodStock[bg.id] || ""}
                              onChange={(e) =>
                                handleBloodStockChange(bg.id, e.target.value)
                              }
                            />
                            <p className="mt-2 text-xs text-slate-400">
                              Starting stock units for {bg.label}.
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 flex justify-between">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setStep(1);
                            setHasBloodStock(null);
                          }}
                          disabled={loading}
                        >
                          Back
                        </button>
                        <button
                          className="btn-primary"
                          onClick={submitBloodStock}
                        >
                          Save & Finish
                        </button>
                      </div>
                    </>
                  )}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
