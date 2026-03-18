import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { fetchDashboardData } from "./dashboard.api";
import { useApiPolling } from "../../../hooks/useApiPolling";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const featureCards = [
  {
    title: "Patient Transfers",
    description:
      "Route patients between hospitals with full status tracking from request to completion.",
    href: "/hospital/patient-transfers",
    tone: "from-[#1F3A5F] to-[#2A4A6F]",
    chip: "Transfer Flow",
  },
  {
    title: "Blood Transfers",
    description:
      "See network blood availability and coordinate accept/reject/complete flow in realtime.",
    href: "/hospital/blood-transfers",
    tone: "from-[#C0392B] to-[#E09F3E]",
    chip: "Critical Stock",
  },
  {
    title: "User Emergencies",
    description:
      "Open emergency notifications to manage assigned user emergencies in one dedicated control view.",
    href: "/hospital/user-emergencies",
    tone: "from-[#2A9D8F] to-[#1F3A5F]",
    chip: "Notification Queue",
  },
  {
    title: "Operations",
    description:
      "Manage resources, blood stock, and patient records from one operational control page.",
    href: "/hospital/operations",
    tone: "from-[#2A9D8F] to-[#E09F3E]",
    chip: "Inventory Ops",
  },
];

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [data, setData] = useState({
    profile: null,
    resources: [],
    bloodStock: [],
    patients: [],
  });

  const loadData = useCallback(
    async ({ showLoading = false, silent = false } = {}) => {
      if (showLoading) setLoading(true);
      if (!showLoading && !silent) setSyncing(true);

      try {
        const res = await fetchDashboardData();
        setData({
          profile: res?.profile || null,
          resources: Array.isArray(res?.resources) ? res.resources : [],
          bloodStock: Array.isArray(res?.bloodStock) ? res.bloodStock : [],
          patients: Array.isArray(res?.patients) ? res.patients : [],
        });
        setLastSyncedAt(Date.now());
      } finally {
        if (showLoading) setLoading(false);
        if (!showLoading && !silent) setSyncing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData({ showLoading: true });
  }, [loadData]);

  useApiPolling(() => loadData({ silent: true }), {
    enabled: !loading,
    intervalMs: 3000,
  });

  const totalResources = useMemo(
    () =>
      data.resources.reduce((acc, item) => acc + (Number(item.units) || 0), 0),
    [data.resources],
  );

  const totalBlood = useMemo(
    () =>
      data.bloodStock.reduce((acc, item) => acc + (Number(item.units) || 0), 0),
    [data.bloodStock],
  );

  const totalPatients = data.patients.length;

  const resourceLeaders = useMemo(
    () =>
      [...data.resources]
        .sort((a, b) => (Number(b.units) || 0) - (Number(a.units) || 0))
        .slice(0, 4),
    [data.resources],
  );

  const bloodLeaders = useMemo(
    () =>
      [...data.bloodStock]
        .sort((a, b) => (Number(b.units) || 0) - (Number(a.units) || 0))
        .slice(0, 4),
    [data.bloodStock],
  );

  const recentPatients = useMemo(
    () => data.patients.slice(0, 4),
    [data.patients],
  );

  const profileBadges = [
    data.profile?.email,
    data.profile?.phone,
    data.profile?.address,
  ].filter(Boolean);

  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  if (loading) {
    return (
      <>
        <div className="page-wrap" />
        <HospitalLoadingModal isOpen={loading} message="Loading Dashboard" />
      </>
    );
  }

  return (
    <div className="page-wrap">
      <Motion.div
        className="shell space-y-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <Motion.article
              key={feature.title}
              variants={cardVariants}
              className="surface-card surface-card-shimmer relative overflow-hidden p-5 sm:p-6"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${feature.tone}`}
              />
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {feature.chip}
              </span>
              <h2 className="mt-3 text-2xl font-bold leading-tight">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
              <Link to={feature.href} className="btn-primary mt-5 w-full">
                Open {feature.title}
              </Link>
            </Motion.article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Motion.div
            variants={cardVariants}
            className="surface-card surface-card-shimmer p-5 sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Live inventory
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">
                  Top resource availability
                </h3>
              </div>
              <Link to="/hospital/operations" className="btn-secondary">
                Manage Inventory
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {resourceLeaders.length ? (
                resourceLeaders.map((item) => (
                  <div key={item.name} className="surface-soft p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.name}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#1F3A5F]">
                      {Number(item.units) || 0}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Current tracked units available in dashboard data.
                    </p>
                  </div>
                ))
              ) : (
                <div className="surface-soft p-4 text-sm text-slate-500 md:col-span-2">
                  No resource inventory available yet. Configure initial values
                  from onboarding or operations.
                </div>
              )}
            </div>
          </Motion.div>

          <Motion.div variants={cardVariants} className="grid gap-4">
            <div className="surface-card surface-card-shimmer p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Blood network snapshot
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-800">
                    Highest stock groups
                  </h3>
                </div>
                <Link
                  to="/hospital/blood-transfers"
                  className="text-sm font-semibold text-[#1F3A5F] hover:underline"
                >
                  Open blood page
                </Link>
              </div>

              <div className="space-y-3">
                {bloodLeaders.length ? (
                  bloodLeaders.map((item) => (
                    <div
                      key={item.bloodGroup}
                      className="flex items-center justify-between rounded-2xl bg-[#F7FAFC] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.bloodGroup}
                        </p>
                        <p className="text-xs text-slate-500">
                          Available units
                        </p>
                      </div>
                      <p className="text-xl font-bold text-[#C0392B]">
                        {Number(item.units) || 0}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#F7FAFC] px-4 py-3 text-sm text-slate-500">
                    No blood stock found yet.
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card surface-card-shimmer p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Recent patient records
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-800">
                    Transfer-ready patients
                  </h3>
                </div>
                <Link
                  to="/hospital/patient-transfers"
                  className="text-sm font-semibold text-[#1F3A5F] hover:underline"
                >
                  Open transfers
                </Link>
              </div>

              <div className="space-y-3">
                {recentPatients.length ? (
                  recentPatients.map((patient, index) => (
                    <div
                      key={patient.id || `${patient.name}-${index}`}
                      className="rounded-2xl bg-[#F7FAFC] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {patient.name || "Unnamed patient"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {patient.bloodGroup || "Blood group unavailable"}
                            {patient.age ? ` · Age ${patient.age}` : ""}
                          </p>
                        </div>
                        {patient.phone ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {patient.phone}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {patient.condition || "No condition summary available."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#F7FAFC] px-4 py-3 text-sm text-slate-500">
                    No patient records available yet.
                  </div>
                )}
              </div>
            </div>
          </Motion.div>
        </div>

        <Motion.div
          variants={cardVariants}
          className="surface-card surface-card-shimmer p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Hospital profile
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-800">
                {data.profile?.name || "Hospital"}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {profileBadges.length ? (
                  profileBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                    Profile details are being synced
                  </span>
                )}
              </div>
            </div>

            <div className="grid min-w-55 gap-3 sm:grid-cols-3 sm:gap-2">
              <div className="surface-soft p-3 text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Resources
                </p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {totalResources}
                </p>
              </div>
              <div className="surface-soft p-3 text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Blood units
                </p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {totalBlood}
                </p>
              </div>
              <div className="surface-soft p-3 text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Patients
                </p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {totalPatients}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7FAFC] px-4 py-3 text-xs sm:text-sm">
            <p className="font-medium text-slate-600">
              Last synced: {lastSyncLabel}
            </p>
            <p
              className={`font-semibold ${syncing ? "text-[#1F3A5F]" : "text-slate-400"}`}
            >
              {syncing ? "Syncing live data..." : "Live polling active"}
            </p>
          </div>
        </Motion.div>
      </Motion.div>
    </div>
  );
};

export default DashboardPage;
