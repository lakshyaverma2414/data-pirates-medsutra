import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion as Motion } from "framer-motion";
import L from "leaflet";
import {
  Ambulance,
  Clock3,
  MapPinned,
  Navigation,
  UserRound,
} from "lucide-react";
import {
  EMERGENCY_STATUS_FLOW,
  fetchDashboardData,
  fetchHospitalEmergencies,
  updateEmergencyStatus,
} from "./dashboard.api";
import { useApiPolling } from "../../../hooks/useApiPolling";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";
import {
  createAmbulanceDivIcon,
  fetchOsrmRoute,
} from "../../../utils/osrmRoute";

const STATUS_LABELS = {
  hospital_notified: "Hospital Notified",
  ambulance_dispatched: "Ambulance Dispatched",
  ambulance_arriving: "Ambulance Arriving",
  patient_picked: "Patient Picked",
  completed: "Completed",
};

const STATUS_BADGES = {
  hospital_notified: "bg-amber-100 text-amber-800",
  ambulance_dispatched: "bg-sky-100 text-sky-800",
  ambulance_arriving: "bg-blue-100 text-blue-800",
  patient_picked: "bg-violet-100 text-violet-800",
  completed: "bg-emerald-200 text-emerald-900",
};

const parseDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCoordinate = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(5) : "Unknown";
};

const formatDistance = (value) =>
  Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} km` : "Estimating";

const getJourneyMeta = (status) => {
  switch (status) {
    case "ambulance_dispatched":
      return {
        progress: 0.18,
        originKey: "hospital",
        label: "Ambulance dispatched",
        direction: "Hospital to patient",
      };
    case "ambulance_arriving":
      return {
        progress: 0.66,
        originKey: "hospital",
        label: "Ambulance approaching patient",
        direction: "Hospital to patient",
      };
    case "patient_picked":
      return {
        progress: 0.28,
        originKey: "patient",
        label: "Patient onboard",
        direction: "Patient to hospital",
      };
    case "completed":
      return {
        progress: 1,
        originKey: "patient",
        label: "Reached hospital",
        direction: "Patient to hospital",
      };
    default:
      return {
        progress: 0.08,
        originKey: "hospital",
        label: "Dispatch preparing",
        direction: "Hospital to patient",
      };
  }
};

const areProfilesEqual = (prev, next) => {
  if (!prev && !next) return true;
  if (!prev || !next) return false;

  return (
    (prev.id || prev._id || null) === (next.id || next._id || null) &&
    prev.name === next.name &&
    Number(prev.lat) === Number(next.lat) &&
    Number(prev.lng) === Number(next.lng)
  );
};

const areEmergenciesEqual = (prev, next) => {
  if (!prev || !next) return false;

  return (
    prev.id === next.id &&
    prev.emergencyType === next.emergencyType &&
    prev.description === next.description &&
    prev.patientAge === next.patientAge &&
    prev.userLat === next.userLat &&
    prev.userLng === next.userLng &&
    prev.emergencyStatus === next.emergencyStatus &&
    prev.active === next.active &&
    prev.createdAt === next.createdAt &&
    (prev.hospital?.id || prev.hospital?._id || null) ===
      (next.hospital?.id || next.hospital?._id || null) &&
    prev.hospital?.name === next.hospital?.name &&
    Number(prev.hospital?.lat) === Number(next.hospital?.lat) &&
    Number(prev.hospital?.lng) === Number(next.hospital?.lng)
  );
};

const reconcileEmergencies = (previous, incoming) => {
  if (!Array.isArray(previous) || !previous.length) return incoming;
  if (!Array.isArray(incoming) || !incoming.length) return incoming;

  const prevById = new Map(previous.map((item) => [item.id, item]));
  let anyChanged = false;

  const nextList = incoming.map((item) => {
    const prevItem = prevById.get(item.id);
    if (prevItem && areEmergenciesEqual(prevItem, item)) {
      return prevItem;
    }
    anyChanged = true;
    return item;
  });

  if (
    !anyChanged &&
    previous.length === nextList.length &&
    previous.every((item, index) => item === nextList[index])
  ) {
    return previous;
  }

  return nextList;
};

// --- HELPER: SMOOTH INTERPOLATION & BEARING (same as user-side) ---
function getInterpolatedPointAndBearing(points, progress) {
  if (points.length < 2) return { point: points[0], bearing: 0 };
  if (progress <= 0) return { point: points[0], bearing: 0 };
  if (progress >= 1) return { point: points[points.length - 1], bearing: 0 };

  let totalDist = 0;
  const distances = [];

  for (let i = 0; i < points.length - 1; i++) {
    const d = L.latLng(points[i].lat, points[i].lng).distanceTo(
      L.latLng(points[i + 1].lat, points[i + 1].lng),
    );
    distances.push(d);
    totalDist += d;
  }

  const targetDist = totalDist * progress;
  let currentDist = 0;

  for (let i = 0; i < points.length - 1; i++) {
    if (currentDist + distances[i] >= targetDist) {
      const segProgress = (targetDist - currentDist) / distances[i];
      const p1 = points[i];
      const p2 = points[i + 1];

      const lat = p1.lat + (p2.lat - p1.lat) * segProgress;
      const lng = p1.lng + (p2.lng - p1.lng) * segProgress;

      const lat1 = (p1.lat * Math.PI) / 180;
      const lat2 = (p2.lat * Math.PI) / 180;
      const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
      const y = Math.sin(dLng) * Math.cos(lat2);
      const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      let bearing = (Math.atan2(y, x) * 180) / Math.PI;
      bearing = (bearing + 360) % 360;

      return { point: { lat, lng }, bearing };
    }
    currentDist += distances[i];
  }
  return { point: points[points.length - 1], bearing: 0 };
}

const DEMO_LEG_DURATION_MS = 10_000; // 30 seconds per leg — matches user side
const CAMERA_FOLLOW_MIN_ZOOM = 14;
const CAMERA_FOLLOW_THROTTLE_MS = 260;
const CAMERA_FOLLOW_TRIGGER_PX = 90;
const MARKER_SMOOTHING_ALPHA = 0.22;
const BEARING_SMOOTHING_ALPHA = 0.18;

const normalizeAngle = (angle) => {
  let next = angle % 360;
  if (next < 0) next += 360;
  return next;
};

const lerpAngle = (from, to, alpha) => {
  const fromNorm = normalizeAngle(from);
  const toNorm = normalizeAngle(to);
  let delta = toNorm - fromNorm;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return normalizeAngle(fromNorm + delta * alpha);
};

const getStatusRank = (status) => EMERGENCY_STATUS_FLOW.indexOf(status);

const EmergencyMap = memo(({ emergency }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const animationTimerRef = useRef(null);
  const osrmRouteRef = useRef(null);
  const lastCameraFollowAtRef = useRef(0);
  const smoothedPointRef = useRef(null);
  const smoothedBearingRef = useRef(null);
  const [routeSummary, setRouteSummary] = useState({
    distanceKm: 0,
    durationMinutes: 0,
    source: "osrm",
  });
  const [eta, setEta] = useState(null);

  const handleZoomBy = useCallback((delta) => {
    const map = mapRef.current;
    if (!map) return;

    const nextZoom = map.getZoom() + delta;
    const minZoom = map.getMinZoom();
    const maxZoom = map.getMaxZoom();
    map.setZoom(Math.max(minZoom, Math.min(maxZoom, nextZoom)), {
      animate: true,
    });
  }, []);

  const userLat = Number(emergency.userLat);
  const userLng = Number(emergency.userLng);
  const hospitalLat = Number(emergency.hospital?.lat);
  const hospitalLng = Number(emergency.hospital?.lng);

  const validCoords =
    Number.isFinite(userLat) &&
    Number.isFinite(userLng) &&
    Number.isFinite(hospitalLat) &&
    Number.isFinite(hospitalLng);

  useEffect(() => {
    if (!validCoords || !mapContainerRef.current) return undefined;

    let isActive = true;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const journeyMeta = getJourneyMeta(emergency.emergencyStatus);
    const patientPoint = { lat: userLat, lng: userLng };
    const hospitalPoint = { lat: hospitalLat, lng: hospitalLng };
    const origin =
      journeyMeta.originKey === "patient" ? patientPoint : hospitalPoint;
    const destination =
      journeyMeta.originKey === "patient" ? hospitalPoint : patientPoint;

    L.circleMarker([userLat, userLng], {
      radius: 7,
      color: "#C0392B",
      fillColor: "#C0392B",
      fillOpacity: 0.9,
      weight: 2,
    })
      .addTo(map)
      .bindPopup("Patient location");

    L.circleMarker([hospitalLat, hospitalLng], {
      radius: 7,
      color: "#1F3A5F",
      fillColor: "#1F3A5F",
      fillOpacity: 0.9,
      weight: 2,
    })
      .addTo(map)
      .bindPopup("Hospital location");

    const loadRoute = async () => {
      // Cache the base route (hospital→patient) so we only fetch once
      if (!osrmRouteRef.current) {
        osrmRouteRef.current = await fetchOsrmRoute(
          hospitalPoint,
          patientPoint,
        );
      }

      const baseRoute = osrmRouteRef.current;
      if (!isActive || !mapRef.current) return;

      // Reverse path for patient→hospital leg
      const route =
        journeyMeta.originKey === "patient"
          ? { ...baseRoute, points: [...baseRoute.points].reverse() }
          : baseRoute;

      const routePoints = route.points.map((point) => [point.lat, point.lng]);

      L.polyline(routePoints, {
        color: "#0F6CBD",
        weight: 5,
        opacity: 0.88,
        lineJoin: "round",
      }).addTo(mapRef.current);

      // Place ambulance marker at origin
      markerRef.current = L.marker([origin.lat, origin.lng], {
        icon: createAmbulanceDivIcon({ size: 54 }),
      })
        .addTo(mapRef.current)
        .bindPopup(journeyMeta.label);

      const bounds = L.latLngBounds(routePoints);
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
      setRouteSummary(route);

      // Cancel any previous animation
      if (animationTimerRef.current !== null)
        cancelAnimationFrame(animationTimerRef.current);

      // Only animate for dispatched/arriving/patient_picked statuses
      const status = emergency.emergencyStatus;
      if (status === "hospital_notified") {
        markerRef.current.setLatLng([origin.lat, origin.lng]);
        setEta(null);
        return;
      }

      if (status === "completed") {
        markerRef.current.setLatLng([destination.lat, destination.lng]);
        setEta(0);
        return;
      }

      // --- ANIMATION: 30s per leg, same as user side ---
      setEta(30);
      const totalDurationMs = DEMO_LEG_DURATION_MS;
      const startTime = Date.now();

      const animate = () => {
        if (!isActive || !markerRef.current) return;

        const elapsed = Date.now() - startTime;
        let progress = totalDurationMs > 0 ? elapsed / totalDurationMs : 1;
        if (progress >= 1) progress = 1;

        const { point, bearing } = getInterpolatedPointAndBearing(
          route.points,
          progress,
        );

        if (!smoothedPointRef.current) {
          smoothedPointRef.current = point;
        } else {
          smoothedPointRef.current = {
            lat:
              smoothedPointRef.current.lat +
              (point.lat - smoothedPointRef.current.lat) *
                MARKER_SMOOTHING_ALPHA,
            lng:
              smoothedPointRef.current.lng +
              (point.lng - smoothedPointRef.current.lng) *
                MARKER_SMOOTHING_ALPHA,
          };
        }

        if (smoothedBearingRef.current == null) {
          smoothedBearingRef.current = bearing;
        } else {
          smoothedBearingRef.current = lerpAngle(
            smoothedBearingRef.current,
            bearing,
            BEARING_SMOOTHING_ALPHA,
          );
        }

        const cameraPoint = smoothedPointRef.current;
        const cameraBearing = smoothedBearingRef.current;
        markerRef.current.setLatLng([cameraPoint.lat, cameraPoint.lng]);

        const mapInstance = mapRef.current;
        const now = Date.now();
        if (
          mapInstance &&
          mapInstance.getZoom() >= CAMERA_FOLLOW_MIN_ZOOM &&
          now - lastCameraFollowAtRef.current >= CAMERA_FOLLOW_THROTTLE_MS
        ) {
          const centerPx = mapInstance.latLngToContainerPoint(
            mapInstance.getCenter(),
          );
          const markerPx = mapInstance.latLngToContainerPoint([
            cameraPoint.lat,
            cameraPoint.lng,
          ]);
          if (centerPx.distanceTo(markerPx) >= CAMERA_FOLLOW_TRIGGER_PX) {
            mapInstance.panTo([cameraPoint.lat, cameraPoint.lng], {
              animate: true,
              duration: 0.35,
              easeLinearity: 0.2,
              noMoveStart: true,
            });
            lastCameraFollowAtRef.current = now;
          }
        }

        // Rotate INNER div (not Leaflet's root) for smooth rotation
        const iconEl = markerRef.current.getElement();
        if (iconEl) {
          const innerEl = iconEl.querySelector("div");
          if (innerEl) {
            if (!innerEl.dataset.rotateReady) {
              innerEl.style.transition = "transform 0.2s ease-out";
              innerEl.dataset.rotateReady = "1";
            }
            innerEl.style.transform = `rotateZ(${cameraBearing}deg)`;
          }
        }

        if (progress < 1) {
          const remainingSeconds = Math.ceil(
            (totalDurationMs - elapsed) / 1000,
          );
          setEta(remainingSeconds);
          animationTimerRef.current = requestAnimationFrame(animate);
        } else {
          setEta(0);
        }
      };

      animationTimerRef.current = requestAnimationFrame(animate);
    };

    loadRoute();

    return () => {
      isActive = false;
      smoothedPointRef.current = null;
      smoothedBearingRef.current = null;
      if (animationTimerRef.current !== null)
        cancelAnimationFrame(animationTimerRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    emergency.emergencyStatus,
    validCoords,
    userLat,
    userLng,
    hospitalLat,
    hospitalLng,
  ]);

  if (!validCoords) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
        Map unavailable for this emergency. Patient or hospital coordinates are
        missing.
      </div>
    );
  }

  const journeyMeta = getJourneyMeta(emergency.emergencyStatus);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_50px_-28px_rgba(15,23,42,0.35)]">
      <div className="absolute left-3 top-3 z-50 rounded-2xl bg-slate-950/80 px-3 py-2 text-[11px] text-white shadow-lg backdrop-blur">
        <p className="font-semibold tracking-[0.18em] text-white/70 uppercase">
          {journeyMeta.direction}
        </p>
        <div className="mt-1 flex items-center gap-3 text-white/90">
          <span>{formatDistance(routeSummary.distanceKm)}</span>
          <span>{eta != null ? `${eta}s remaining` : "ETA updating"}</span>
        </div>
      </div>
      <div className="absolute right-3 top-3 z-50 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => handleZoomBy(1)}
          className="h-8 w-8 text-base font-bold text-slate-700 transition hover:bg-slate-100"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="h-px w-full bg-slate-200" />
        <button
          type="button"
          onClick={() => handleZoomBy(-1)}
          className="h-8 w-8 text-base font-bold text-slate-700 transition hover:bg-slate-100"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
      <div ref={mapContainerRef} className="h-72 w-full rounded-[28px]" />
      <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C0392B]" />
            Patient
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1F3A5F]" />
            Hospital
          </span>
        </div>
      </div>
    </div>
  );
});

const EmergencyCard = memo(
  ({ emergency, currentHospitalId, updating, onAdvanceStatus }) => {
    const currentIndex = EMERGENCY_STATUS_FLOW.findIndex(
      (step) => step === emergency.emergencyStatus,
    );
    const nextStatus =
      currentIndex >= 0 && currentIndex < EMERGENCY_STATUS_FLOW.length - 1
        ? EMERGENCY_STATUS_FLOW[currentIndex + 1]
        : null;
    const isDispatchAction = nextStatus === "ambulance_dispatched";

    const badgeClass =
      STATUS_BADGES[emergency.emergencyStatus] || "bg-slate-100 text-slate-700";

    const infoChips = useMemo(
      () => [
        {
          label: "Patient",
          value:
            emergency.patientAge != null
              ? `${emergency.patientAge} yrs`
              : "Age not shared",
          icon: UserRound,
        },
        {
          label: "Location",
          value: `${formatCoordinate(emergency.userLat)}, ${formatCoordinate(emergency.userLng)}`,
          icon: MapPinned,
        },
        {
          label: "Route",
          value: getJourneyMeta(emergency.emergencyStatus).direction,
          icon: Navigation,
        },
        {
          label: "Updated",
          value: parseDate(emergency.createdAt),
          icon: Clock3,
        },
      ],
      [emergency],
    );

    return (
      <Motion.article
        className="surface-soft overflow-hidden border border-slate-200/70 p-0"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">
                    #{emergency.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}
                  >
                    {STATUS_LABELS[emergency.emergencyStatus] ||
                      emergency.emergencyStatus}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      emergency.active
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {emergency.active ? "Active" : "Closed"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Ambulance className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold tracking-tight text-slate-950">
                      {emergency.emergencyType}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {emergency.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-52 rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Assigned hospital
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {emergency.hospital?.name || "Assigned hospital"}
                </p>
                <p className="mt-1 text-slate-500">
                  Current journey:{" "}
                  {getJourneyMeta(emergency.emergencyStatus).label}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {infoChips.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                      {item.label}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {emergency.active &&
            nextStatus &&
            nextStatus !== "patient_picked" ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-950/5 px-4 py-3">
                <p className="text-xs text-slate-600">
                  Next step:{" "}
                  <span className="font-semibold text-slate-800">
                    {STATUS_LABELS[nextStatus]}
                  </span>
                </p>
                <button
                  type="button"
                  disabled={Boolean(updating)}
                  onClick={() =>
                    onAdvanceStatus({
                      emergencyId: emergency.id,
                      status: nextStatus,
                      actorId: currentHospitalId,
                    })
                  }
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  {updating ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  {isDispatchAction
                    ? "Dispatch Ambulance"
                    : `Mark ${STATUS_LABELS[nextStatus]}`}
                </button>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-slate-100/45 p-4 sm:p-5 xl:border-l xl:border-t-0">
            <EmergencyMap emergency={emergency} />
          </div>
        </div>
      </Motion.article>
    );
  },
);

const CompletedEmergencyTile = memo(({ emergency }) => {
  const badgeClass =
    STATUS_BADGES[emergency.emergencyStatus] || "bg-slate-100 text-slate-700";

  return (
    <article className="surface-soft flex min-h-56 flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] text-slate-400">
          #{emergency.id}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}
        >
          {STATUS_LABELS[emergency.emergencyStatus] ||
            emergency.emergencyStatus}
        </span>
      </div>

      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Ambulance className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {emergency.emergencyType}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
            {emergency.description}
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <MapPinned className="h-3.5 w-3.5 text-slate-500" />
          <span>
            {formatCoordinate(emergency.userLat)},{" "}
            {formatCoordinate(emergency.userLng)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 text-slate-500" />
          <span>{parseDate(emergency.createdAt)}</span>
        </div>
      </div>
    </article>
  );
});

const UserEmergenciesPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [completedEmergencies, setCompletedEmergencies] = useState([]);
  const [updateLoading, setUpdateLoading] = useState({});
  const optimisticStatusRef = useRef(new Map());
  const autoPickupTimersRef = useRef(new Map());
  const autoCompleteTimersRef = useRef(new Map());

  const loadData = useCallback(
    async ({ showLoading = false, silent = false } = {}) => {
      if (showLoading) setLoading(true);
      if (!showLoading && !silent) setRefreshing(true);

      try {
        const dashboard = await fetchDashboardData();
        setProfile((prev) => {
          const next = dashboard?.profile || null;
          return areProfilesEqual(prev, next) ? prev : next;
        });

        const [activeItems, completedItems] = await Promise.all([
          fetchHospitalEmergencies({ active: true }),
          fetchHospitalEmergencies({ active: false }),
        ]);

        const nextActive = Array.isArray(activeItems) ? activeItems : [];
        const nextCompleted = Array.isArray(completedItems)
          ? completedItems
          : [];

        const nextActiveWithOptimistic = nextActive.map((item) => {
          const optimisticStatus = optimisticStatusRef.current.get(
            String(item.id),
          );
          if (!optimisticStatus) return item;

          if (
            getStatusRank(item.emergencyStatus) >=
            getStatusRank(optimisticStatus)
          ) {
            optimisticStatusRef.current.delete(String(item.id));
            return item;
          }

          return {
            ...item,
            emergencyStatus: optimisticStatus,
            active: optimisticStatus !== "completed",
          };
        });

        setActiveEmergencies((prev) =>
          reconcileEmergencies(prev, nextActiveWithOptimistic),
        );
        setCompletedEmergencies((prev) =>
          reconcileEmergencies(prev, nextCompleted),
        );
        setError("");
      } catch (err) {
        setError(err?.message || "Unable to load emergencies");
      } finally {
        if (showLoading) setLoading(false);
        if (!showLoading && !silent) setRefreshing(false);
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

  const handleAdvanceStatus = useCallback(
    async ({ emergencyId, status, actorId }) => {
      setUpdateLoading((prev) => ({ ...prev, [emergencyId]: true }));
      try {
        await updateEmergencyStatus({
          emergencyId,
          status,
          actorType: "hospital",
          actorId,
        });

        if (status === "ambulance_dispatched") {
          await updateEmergencyStatus({
            emergencyId,
            status: "ambulance_arriving",
            actorType: "hospital",
            actorId,
          });
        }

        await loadData();
      } catch (err) {
        setError(err?.message || "Unable to update status");
      } finally {
        setUpdateLoading((prev) => ({ ...prev, [emergencyId]: false }));
      }
    },
    [loadData],
  );

  useEffect(() => {
    if (loading) return undefined;

    const actorId = profile?.id || profile?._id;
    const timerMap = autoPickupTimersRef.current;
    const shouldAutoPickupIds = new Set(
      activeEmergencies
        .filter(
          (emergency) =>
            emergency?.active &&
            emergency?.emergencyStatus === "ambulance_arriving",
        )
        .map((emergency) => String(emergency.id)),
    );

    activeEmergencies.forEach((emergency) => {
      const emergencyId = String(emergency.id);
      if (
        !shouldAutoPickupIds.has(emergencyId) ||
        timerMap.has(emergencyId) ||
        updateLoading[emergency.id]
      ) {
        return;
      }

      const timeoutId = window.setTimeout(async () => {
        optimisticStatusRef.current.set(emergencyId, "patient_picked");
        setActiveEmergencies((prev) =>
          prev.map((item) =>
            String(item.id) === emergencyId
              ? { ...item, emergencyStatus: "patient_picked", active: true }
              : item,
          ),
        );

        setUpdateLoading((prev) => ({ ...prev, [emergency.id]: true }));
        try {
          await updateEmergencyStatus({
            emergencyId: emergency.id,
            status: "patient_picked",
            actorType: "hospital",
            actorId,
          });
          await loadData({ silent: true });
        } catch (err) {
          optimisticStatusRef.current.delete(emergencyId);
          await loadData({ silent: true });
          setError(err?.message || "Unable to auto-mark patient picked");
        } finally {
          setUpdateLoading((prev) => ({ ...prev, [emergency.id]: false }));
          timerMap.delete(emergencyId);
        }
      }, DEMO_LEG_DURATION_MS);

      timerMap.set(emergencyId, timeoutId);
    });

    timerMap.forEach((timeoutId, emergencyId) => {
      if (!shouldAutoPickupIds.has(emergencyId)) {
        window.clearTimeout(timeoutId);
        timerMap.delete(emergencyId);
      }
    });

    return undefined;
  }, [
    activeEmergencies,
    loadData,
    loading,
    profile?.id,
    profile?._id,
    updateLoading,
  ]);

  useEffect(() => {
    if (loading) return undefined;

    const actorId = profile?.id || profile?._id;
    const timerMap = autoCompleteTimersRef.current;
    const shouldAutoCompleteIds = new Set(
      activeEmergencies
        .filter(
          (emergency) =>
            emergency?.active &&
            emergency?.emergencyStatus === "patient_picked",
        )
        .map((emergency) => String(emergency.id)),
    );

    activeEmergencies.forEach((emergency) => {
      const emergencyId = String(emergency.id);
      if (
        !shouldAutoCompleteIds.has(emergencyId) ||
        timerMap.has(emergencyId) ||
        updateLoading[emergency.id]
      ) {
        return;
      }

      const timeoutId = window.setTimeout(async () => {
        setUpdateLoading((prev) => ({ ...prev, [emergency.id]: true }));
        try {
          await updateEmergencyStatus({
            emergencyId: emergency.id,
            status: "completed",
            actorType: "hospital",
            actorId,
          });
          await loadData({ silent: true });
        } catch (err) {
          setError(err?.message || "Unable to auto-complete emergency");
        } finally {
          setUpdateLoading((prev) => ({ ...prev, [emergency.id]: false }));
          timerMap.delete(emergencyId);
        }
      }, DEMO_LEG_DURATION_MS);

      timerMap.set(emergencyId, timeoutId);
    });

    timerMap.forEach((timeoutId, emergencyId) => {
      if (!shouldAutoCompleteIds.has(emergencyId)) {
        window.clearTimeout(timeoutId);
        timerMap.delete(emergencyId);
      }
    });

    return undefined;
  }, [
    activeEmergencies,
    loadData,
    loading,
    profile?.id,
    profile?._id,
    updateLoading,
  ]);

  useEffect(() => {
    return () => {
      autoPickupTimersRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      autoPickupTimersRef.current.clear();

      autoCompleteTimersRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      autoCompleteTimersRef.current.clear();

      optimisticStatusRef.current.clear();
    };
  }, []);

  if (loading) {
    return (
      <>
        <div className="page-wrap" />
        <HospitalLoadingModal
          isOpen={loading}
          message="Loading Emergency Notifications"
        />
      </>
    );
  }

  return (
    <div className="page-wrap">
      <div className="shell space-y-6">
        <div className="surface-card surface-card-shimmer overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-linear-to-r from-[#1F3A5F] to-[#2A4A6F] px-5 py-4 text-white sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Emergency notifications
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Hospital Emergency Control Panel
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Assigned user emergencies for {profile?.name || "hospital"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="rounded-xl bg-white/15 px-3 py-2 text-center">
                <p className="text-white/70">Active</p>
                <p className="font-bold">{activeEmergencies.length}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-3 py-2 text-center">
                <p className="text-white/70">Completed</p>
                <p className="font-bold">{completedEmergencies.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {refreshing ? (
              <p className="text-xs text-slate-500">
                Refreshing emergency queue...
              </p>
            ) : null}

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-800">
                  Active Emergencies
                </h3>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  {activeEmergencies.length}
                </span>
              </div>
              {activeEmergencies.length ? (
                <div className="space-y-4">
                  {activeEmergencies.map((emergency) => (
                    <EmergencyCard
                      key={emergency.id}
                      emergency={emergency}
                      currentHospitalId={profile?.id || profile?._id}
                      updating={updateLoading[emergency.id]}
                      onAdvanceStatus={handleAdvanceStatus}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No active user emergencies assigned right now.
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-800">
                  Completed Emergencies
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {completedEmergencies.length}
                </span>
              </div>
              {completedEmergencies.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {completedEmergencies.map((emergency) => (
                    <CompletedEmergencyTile
                      key={emergency.id}
                      emergency={emergency}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Completed emergencies will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEmergenciesPage;
