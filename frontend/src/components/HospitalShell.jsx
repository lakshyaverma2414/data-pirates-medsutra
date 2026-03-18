import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, BellRing, Clock3, MapPin } from "lucide-react";
import { fetchHospitalEmergencies } from "../modules/hospital/dashboard/dashboard.api";
import { useApiPolling } from "../hooks/useApiPolling";

const NAV_ITEMS = [
  { href: "/hospital/dashboard", label: "Dashboard" },
  { href: "/hospital/operations", label: "Operations" },
  { href: "/hospital/doctors", label: "Doctors" },
  { href: "/hospital/blood-transfers", label: "Blood Network" },
  { href: "/hospital/patient-transfers", label: "Transfers" },
  { href: "/hospital/emergencies", label: "Emergencies" },
];

const HospitalShell = ({ children }) => {
  const location = useLocation();
  const notificationsActive =
    location.pathname === "/hospital/user-emergencies";
  const [alertEmergency, setAlertEmergency] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const acknowledgedIdsRef = useRef(new Set());
  const hospitalNotifiedIdsRef = useRef(new Set());

  const formatTime = useCallback((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";
    return date.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const scanHospitalNotifiedEmergencies = useCallback(async () => {
    const activeEmergencies = await fetchHospitalEmergencies({ active: true });
    const queue = (Array.isArray(activeEmergencies) ? activeEmergencies : [])
      .filter((item) => item?.emergencyStatus === "hospital_notified")
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

    hospitalNotifiedIdsRef.current = new Set(
      queue.map((item) => String(item.id)),
    );

    const nextEmergency = queue.find(
      (item) => !acknowledgedIdsRef.current.has(String(item.id)),
    );

    if (!nextEmergency) return;

    if (
      isAlertOpen &&
      String(alertEmergency?.id) === String(nextEmergency.id)
    ) {
      return;
    }

    if (!isAlertOpen) {
      setAlertEmergency(nextEmergency);
      setIsAlertOpen(true);
    }
  }, [alertEmergency?.id, isAlertOpen]);

  useEffect(() => {
    scanHospitalNotifiedEmergencies();
  }, [scanHospitalNotifiedEmergencies]);

  useApiPolling(scanHospitalNotifiedEmergencies, {
    enabled: true,
    intervalMs: 3000,
  });

  const acknowledgeCurrentAlert = useCallback(() => {
    hospitalNotifiedIdsRef.current.forEach((emergencyId) => {
      acknowledgedIdsRef.current.add(emergencyId);
    });
    setIsAlertOpen(false);
  }, []);

  const emergencyLocation = useMemo(() => {
    if (!alertEmergency) return "Unknown";
    const lat = Number(alertEmergency.userLat);
    const lng = Number(alertEmergency.userLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Unknown";
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }, [alertEmergency]);

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__inner">
          <Link to="/hospital/dashboard" className="app-shell__brand">
            <span className="app-shell__brand-mark">+</span>
            <div className="app-shell__brand-copy">
              <h1>MedSutra</h1>
              <p>Hospital Command Center</p>
            </div>
          </Link>

          <nav className="app-shell__nav" aria-label="Hospital navigation">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`app-shell__nav-link ${active ? "app-shell__nav-link--active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="app-shell__actions">
            <Link
              to="/hospital/user-emergencies"
              className={`app-shell__alert-cta ${notificationsActive ? "app-shell__alert-cta--active" : ""}`}
            >
              <span className="app-shell__alert-icon-wrap">
                <BellRing className="h-4 w-4" />
              </span>
              {/* <span className="app-shell__alert-ping" aria-hidden="true" /> */}
            </Link>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/hospital/login";
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell__main">
        <div className="app-shell__frame">{children}</div>
      </main>

      {isAlertOpen && alertEmergency ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white shadow-[0_38px_90px_-30px_rgba(15,23,42,0.62)]">
            <div className="flex items-center justify-between rounded-t-3xl border-b border-rose-100 bg-linear-to-r from-rose-600 to-orange-500 px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-white/15 p-2">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                    Critical incoming emergency
                  </p>
                  <h3 className="text-base font-bold">Hospital Notified</h3>
                </div>
              </div>
              <span className="rounded-full bg-white/18 px-2.5 py-1 text-xs font-semibold">
                Active
              </span>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {alertEmergency.emergencyType || "Emergency"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {alertEmergency.description || "No description provided"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Reported
                  </p>
                  <div className="flex items-center gap-2 font-medium">
                    <Clock3 className="h-4 w-4 text-slate-500" />
                    {formatTime(alertEmergency.createdAt)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Patient location
                  </p>
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    {emergencyLocation}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={acknowledgeCurrentAlert}
                  className="btn-secondary"
                >
                  Dismiss
                </button>
                <Link
                  to="/hospital/user-emergencies"
                  onClick={acknowledgeCurrentAlert}
                  className="btn-primary"
                >
                  Open Emergency Queue
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HospitalShell;
