import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Heart,
  ArrowLeft,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Ambulance,
  AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Assuming these exist in your utils folder based on your original code
import {
  createAmbulanceDivIcon,
  fetchOsrmRoute,
} from "../../../../../../src/utils/osrmRoute";

// --- TYPES & CONSTANTS ---
type AmbulanceStatus =
  | "hospital_notified"
  | "ambulance_dispatched"
  | "ambulance_arriving"
  | "patient_picked"
  | "completed";

type LatLng = { lat: number; lng: number };

type Hospital = {
  id?: string;
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
};

type Emergency = {
  id: string;
  emergencyType: string;
  description: string;
  patientAge: number | null;
  userLat: number;
  userLng: number;
  emergencyStatus: AmbulanceStatus;
  active: boolean;
  hospital?: Hospital;
};

type RouteSummary = {
  distanceKm: number;
  durationMinutes: number;
  source: string;
};

type OsrmRoute = Awaited<ReturnType<typeof fetchOsrmRoute>>;

const CAMERA_FOLLOW_MIN_ZOOM = 14;
const CAMERA_FOLLOW_THROTTLE_MS = 260;
const CAMERA_FOLLOW_TRIGGER_PX = 90;
const MARKER_SMOOTHING_ALPHA = 0.22;
const BEARING_SMOOTHING_ALPHA = 0.18;

const TRACKING_SEED_STORAGE_PREFIX = "emergency-tracking-seed:";
const API_BASE_URL =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? "";

const PROGRESS_STEPS: { key: AmbulanceStatus; label: string }[] = [
  { key: "hospital_notified", label: "Hospital notified" },
  { key: "ambulance_dispatched", label: "Ambulance dispatched" },
  { key: "ambulance_arriving", label: "Ambulance arriving" },
  { key: "patient_picked", label: "Patient picked up" },
  { key: "completed", label: "Reached hospital" },
];

const STATUS_ORDER = PROGRESS_STEPS.map((item) => item.key);

const STATUS_INFO: Record<
  AmbulanceStatus,
  {
    title: string;
    description: string;
    color: string;
    accent: string;
    icon: any;
  }
> = {
  hospital_notified: {
    title: "Hospital notified",
    description:
      "The response center has accepted your emergency and is dispatching support.",
    color: "#0F6CBD",
    accent: "bg-sky-50 text-sky-700 border-sky-100",
    icon: CheckCircle2,
  },
  ambulance_dispatched: {
    title: "Ambulance dispatched",
    description:
      "The vehicle is leaving the hospital and road routing is now active.",
    color: "#2563EB",
    accent: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Ambulance,
  },
  ambulance_arriving: {
    title: "Ambulance arriving",
    description:
      "The crew is following the live OSRM route to your pickup point.",
    color: "#EA580C",
    accent: "bg-orange-50 text-orange-700 border-orange-100",
    icon: Navigation,
  },
  patient_picked: {
    title: "Patient onboard",
    description:
      "The ambulance is heading from pickup to the assigned hospital.",
    color: "#7C3AED",
    accent: "bg-violet-50 text-violet-700 border-violet-100",
    icon: Ambulance,
  },
  completed: {
    title: "Reached hospital",
    description: "The emergency transfer has been completed successfully.",
    color: "#15803D",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2,
  },
};

const getJourneyMeta = (status: AmbulanceStatus) => {
  switch (status) {
    case "ambulance_dispatched":
    case "ambulance_arriving":
      return {
        originKey: "hospital",
        heading: "Hospital to pickup",
        markerLabel: "Approaching patient",
      };
    case "patient_picked":
      return {
        originKey: "patient",
        heading: "Pickup to hospital",
        markerLabel: "Patient onboard",
      };
    case "completed":
      return {
        originKey: "patient",
        heading: "Pickup to hospital",
        markerLabel: "Reached hospital",
      };
    default:
      return {
        originKey: "hospital",
        heading: "Hospital to pickup",
        markerLabel: "Dispatch queued",
      };
  }
};

const formatDistance = (value: number) =>
  Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} km` : "Estimating";

const toFiniteNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toEmergencyIdNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeAngle = (angle: number) => {
  let next = angle % 360;
  if (next < 0) next += 360;
  return next;
};

const lerpAngle = (from: number, to: number, alpha: number) => {
  const fromNorm = normalizeAngle(from);
  const toNorm = normalizeAngle(to);
  let delta = toNorm - fromNorm;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return normalizeAngle(fromNorm + delta * alpha);
};

// --- HELPER: SMOOTH INTERPOLATION & BEARING CALCULATION ---
function getInterpolatedPointAndBearing(
  points: { lat: number; lng: number }[],
  progress: number,
) {
  if (points.length < 2) return { point: points[0], bearing: 0 };
  if (progress <= 0) return { point: points[0], bearing: 0 };
  if (progress >= 1) return { point: points[points.length - 1], bearing: 0 };

  let totalDist = 0;
  const distances: number[] = [];

  // Calculate segments
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

      // Interpolate Lat/Lng
      const lat = p1.lat + (p2.lat - p1.lat) * segProgress;
      const lng = p1.lng + (p2.lng - p1.lng) * segProgress;

      // Calculate Bearing (Angle for the marker)
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

const normalizeEmergencyPayload = (
  incoming: unknown,
  previous: Emergency | null,
  fallbackId: string,
): Emergency | null => {
  if (!incoming || typeof incoming !== "object") return previous;

  const source = incoming as Record<string, unknown>;
  const previousLat = previous?.userLat ?? NaN;
  const previousLng = previous?.userLng ?? NaN;

  const userLat = toFiniteNumber(source.userLat, previousLat);
  const userLng = toFiniteNumber(source.userLng, previousLng);
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return previous;

  const statusCandidate = String(
    source.emergencyStatus ?? previous?.emergencyStatus ?? "hospital_notified",
  ) as AmbulanceStatus;
  const emergencyStatus: AmbulanceStatus = STATUS_ORDER.includes(
    statusCandidate,
  )
    ? statusCandidate
    : previous?.emergencyStatus || "hospital_notified";

  const incomingHospital =
    source.hospital && typeof source.hospital === "object"
      ? (source.hospital as Record<string, unknown>)
      : null;

  const hospital = incomingHospital
    ? {
        id:
          (incomingHospital.id as string | undefined) ||
          (previous?.hospital?.id as string | undefined),
        name: String(
          incomingHospital.name ??
            previous?.hospital?.name ??
            "Assigned hospital",
        ),
        phone: String(
          incomingHospital.phone ?? previous?.hospital?.phone ?? "",
        ),
        address: String(
          incomingHospital.address ?? previous?.hospital?.address ?? "",
        ),
        lat: toFiniteNumber(
          incomingHospital.lat,
          previous?.hospital?.lat ?? NaN,
        ),
        lng: toFiniteNumber(
          incomingHospital.lng,
          previous?.hospital?.lng ?? NaN,
        ),
      }
    : previous?.hospital;

  return {
    id: String(source.id ?? previous?.id ?? fallbackId),
    emergencyType: String(
      source.emergencyType ?? previous?.emergencyType ?? "Emergency",
    ),
    description: String(source.description ?? previous?.description ?? ""),
    patientAge:
      source.patientAge == null
        ? (previous?.patientAge ?? null)
        : Number(source.patientAge),
    userLat,
    userLng,
    emergencyStatus,
    active:
      typeof source.active === "boolean"
        ? source.active
        : emergencyStatus !== "completed",
    hospital,
  };
};

export function AmbulanceTracking() {
  const { requestId } = useParams();
  const trackingId = requestId || "TRACKING";

  // --- STATE ---
  const [appState, setAppState] = useState<
    "loading" | "searching" | "found" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [emergency, setEmergency] = useState<Emergency | null>(null);

  const [eta, setEta] = useState<number | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary>({
    distanceKm: 0,
    durationMinutes: 0,
    source: "osrm",
  });

  // --- REFS ---
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const pollingTimeoutRef = useRef<number | null>(null);
  const osrmRouteRef = useRef<OsrmRoute | null>(null);
  const lastCameraFollowAtRef = useRef(0);
  const smoothedPointRef = useRef<{ lat: number; lng: number } | null>(null);
  const smoothedBearingRef = useRef<number | null>(null);

  const handleZoomBy = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;

    const nextZoom = map.getZoom() + delta;
    const minZoom = map.getMinZoom();
    const maxZoom = map.getMaxZoom();
    map.setZoom(Math.max(minZoom, Math.min(maxZoom, nextZoom)), {
      animate: true,
    });
  }, []);

  // 1. Initial Load & POST Request (Finding Hospital)
  useEffect(() => {
    const rawData = window.sessionStorage.getItem(
      `${TRACKING_SEED_STORAGE_PREFIX}${trackingId}`,
    );
    if (!rawData) {
      setAppState("error");
      setErrorMessage("No tracking data found.");
      return;
    }

    try {
      const parsedData = JSON.parse(rawData);
      const seedLat = Number(parsedData.userLat);
      const seedLng = Number(parsedData.userLng);
      if (!Number.isFinite(seedLat) || !Number.isFinite(seedLng)) {
        setAppState("error");
        setErrorMessage("Invalid tracking coordinates.");
        return;
      }

      setAppState("searching");

      setEmergency({
        id: trackingId,
        emergencyType: parsedData.emergencyType || "Emergency",
        description: parsedData.description || "",
        patientAge: parsedData.patientAge || null,
        userLat: seedLat,
        userLng: seedLng,
        emergencyStatus: "hospital_notified",
        active: true,
      });

      const payload = parsedData.submitPayload || {
        emergencyType: parsedData.emergencyType,
        description: parsedData.description,
        patientAge: parsedData.patientAge,
        userLat: parsedData.userLat,
        userLng: parsedData.userLng,
      };

      fetch(`${API_BASE_URL}/user/emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to assign hospital.");
          return res.json();
        })
        .then((data) => {
          if (data?.emergency) {
            setEmergency((prev) =>
              normalizeEmergencyPayload(data.emergency, prev, trackingId),
            );
            setAppState("found");
          }
        })
        .catch((err) => {
          setAppState("error");
          setErrorMessage(err.message || "Failed to contact services.");
        });
    } catch (e) {
      setAppState("error");
      setErrorMessage("Corrupted tracking data.");
    }
  }, [trackingId]);

  // 2. Sequential Polling Logic
  useEffect(() => {
    let isCancelled = false;

    const pollStatus = async () => {
      if (isCancelled || appState !== "found" || !emergency?.id) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/user/emergency/${emergency.id}/status`,
        );
        if (response.ok) {
          const payload = await response.json();
          if (payload?.emergency) {
            setEmergency((prev) =>
              normalizeEmergencyPayload(payload.emergency, prev, trackingId),
            );
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      } finally {
        if (!isCancelled) {
          pollingTimeoutRef.current = window.setTimeout(pollStatus, 500);
        }
      }
    };

    if (appState === "found") pollStatus();

    return () => {
      isCancelled = true;
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [appState, emergency?.id]);

  // 3. Map Initialization, Movement Animation & Routing
  useEffect(() => {
    if (!emergency || !mapContainerRef.current) return;

    const userLat = Number(emergency.userLat);
    const userLng = Number(emergency.userLng);
    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([userLat, userLng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);
      layerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const layerGroup = layerGroupRef.current!;
    layerGroup.clearLayers();

    const userPoint = { lat: userLat, lng: userLng };
    let userIcon =
      appState === "searching"
        ? L.divIcon({
            className: "bg-transparent",
            html: `<div class="relative flex h-12 w-12 items-center justify-center"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-[#C0392B] border-2 border-white shadow-lg"></span></div>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          })
        : L.divIcon({
            className: "bg-transparent",
            html: `<div class="h-3 w-3 rounded-full bg-[#C0392B] border-2 border-white shadow-lg"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });

    L.marker([userPoint.lat, userPoint.lng], { icon: userIcon })
      .addTo(layerGroup)
      .bindTooltip("You", {
        permanent: true,
        direction: "top",
        offset: [0, -8],
      });

    if (!emergency.hospital || appState === "searching") return;

    const hospitalLat = Number(emergency.hospital.lat);
    const hospitalLng = Number(emergency.hospital.lng);
    if (!Number.isFinite(hospitalLat) || !Number.isFinite(hospitalLng)) return;

    const hospitalPoint = { lat: hospitalLat, lng: hospitalLng };
    L.circleMarker([hospitalPoint.lat, hospitalPoint.lng], {
      radius: 9,
      color: "#1F3A5F",
      fillColor: "#1F3A5F",
      fillOpacity: 0.95,
      weight: 2,
    })
      .addTo(layerGroup)
      .bindPopup(emergency.hospital.name);

    let isMounted = true;
    const renderRoute = async () => {
      const journeyMeta = getJourneyMeta(emergency.emergencyStatus);

      if (!osrmRouteRef.current) {
        osrmRouteRef.current = await fetchOsrmRoute(hospitalPoint, userPoint);
      }

      const baseRoute = osrmRouteRef.current;

      // If returning to hospital, reverse the path
      const route: OsrmRoute =
        journeyMeta.originKey === "patient"
          ? { ...baseRoute, points: [...baseRoute.points].reverse() }
          : baseRoute;

      const origin =
        journeyMeta.originKey === "patient" ? userPoint : hospitalPoint;
      const destination =
        journeyMeta.originKey === "patient" ? hospitalPoint : userPoint;

      if (!isMounted || !mapRef.current) return;

      const routePoints = route.points.map(
        (p) => [p.lat, p.lng] as [number, number],
      );
      const routePolyline = L.polyline(routePoints, {
        color: "#0F6CBD",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      markerRef.current = L.marker([origin.lat, origin.lng], {
        icon: createAmbulanceDivIcon({ size: 60 }),
      })
        .addTo(layerGroup)
        .bindPopup(journeyMeta.markerLabel);

      mapRef.current.fitBounds(routePolyline.getBounds(), {
        padding: [40, 40],
      });

      // === FIXED 30-SECOND DEMO TIMING PER LEG ===
      const DEMO_LEG_DURATION_MS = 10_000; // 30 seconds per leg
      const totalDurationMs = DEMO_LEG_DURATION_MS;
      const initialEtaSeconds = 10;

      setRouteSummary(route);
      setEta(initialEtaSeconds);

      if (animationTimerRef.current !== null)
        cancelAnimationFrame(animationTimerRef.current);

      // Don't animate until ambulance is actually dispatched
      if (emergency.emergencyStatus === "hospital_notified") {
        markerRef.current.setLatLng([origin.lat, origin.lng]);
        setEta(null);
        return;
      }

      if (emergency.emergencyStatus === "completed") {
        markerRef.current.setLatLng([destination.lat, destination.lng]);
        setEta(0);
        return;
      }

      let startTime = Date.now();
      let hasTriggeredArrival = false;

      // === SMOOTH ANIMATION LOOP (30s per leg) ===
      const animate = () => {
        if (!isMounted || !markerRef.current) return;

        const elapsed = Date.now() - startTime;
        let progress = totalDurationMs > 0 ? elapsed / totalDurationMs : 1;

        if (progress >= 1) {
          progress = 1;

          // Auto-trigger POST when reaching the user
          if (
            !hasTriggeredArrival &&
            (emergency.emergencyStatus === "ambulance_dispatched" ||
              emergency.emergencyStatus === "ambulance_arriving")
          ) {
            hasTriggeredArrival = true;
            const emergencyId = toEmergencyIdNumber(emergency.id);

            if (emergencyId !== null) {
              fetch(`${API_BASE_URL}/user/emergency/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  emergencyId,
                  status: "patient_picked",
                  actorType: "user",
                  actorId: "user_101",
                }),
              }).catch(console.error);
            }

            // Optimistic update to immediately start returning
            setEmergency((prev) =>
              prev ? { ...prev, emergencyStatus: "patient_picked" } : prev,
            );
          }
        }

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

        // Rotate the INNER div (not Leaflet's root element) to avoid
        // interfering with Leaflet's translate3d positioning
        const iconEl = markerRef.current.getElement();
        if (iconEl) {
          const innerEl = iconEl.querySelector("div") as HTMLElement;
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

    renderRoute();

    return () => {
      isMounted = false;
      smoothedPointRef.current = null;
      smoothedBearingRef.current = null;
      if (animationTimerRef.current !== null)
        cancelAnimationFrame(animationTimerRef.current);
    };
  }, [
    appState,
    emergency?.id,
    emergency?.emergencyStatus, // Triggers reverse route automatically when changed to "patient_picked"
    emergency?.userLat,
    emergency?.userLng,
    emergency?.hospital?.lat,
    emergency?.hospital?.lng,
    emergency?.hospital?.name,
  ]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // --- UI DERIVED VARIABLES ---
  const currentStatus =
    emergency && appState === "found"
      ? STATUS_INFO[emergency.emergencyStatus]
      : STATUS_INFO.hospital_notified;
  const StatusIcon = currentStatus.icon;
  const currentStepIndex = emergency
    ? STATUS_ORDER.indexOf(emergency.emergencyStatus)
    : 0;
  const journeyMeta = getJourneyMeta(
    emergency?.emergencyStatus || "hospital_notified",
  );

  return (
    <div className="h-screen overflow-hidden bg-[#F7FAFC]">
      <header className="bg-white border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#E53935]" />
            <span
              className="text-xl"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              MedSutra
            </span>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-73px)] overflow-hidden px-4 py-3">
        <div className="max-w-6xl mx-auto flex h-full min-h-0 flex-col gap-3">
          <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[1.15fr_0.95fr]">
            {/* LEFT: MAP */}
            <div>
              <div className="h-full overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_34px_90px_-44px_rgba(15,23,42,0.5)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {appState === "searching"
                      ? "Locating Support"
                      : journeyMeta.heading}
                  </div>
                </div>

                <div className="relative h-[calc(100%-70px)] bg-[#EAF3FF]">
                  <div ref={mapContainerRef} className="h-full w-full" />

                  <div className="absolute right-4 top-4 z-[450] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
                    <button
                      type="button"
                      onClick={() => handleZoomBy(1)}
                      className="h-9 w-9 text-lg font-bold text-slate-700 transition hover:bg-slate-100"
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <div className="h-px w-full bg-slate-200" />
                    <button
                      type="button"
                      onClick={() => handleZoomBy(-1)}
                      className="h-9 w-9 text-lg font-bold text-slate-700 transition hover:bg-slate-100"
                      aria-label="Zoom out"
                    >
                      -
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4 z-[400] rounded-2xl bg-white/90 px-4 py-3 text-xs text-slate-600 shadow-lg backdrop-blur">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#C0392B]" />{" "}
                        You
                      </span>
                      {appState === "found" && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#1F3A5F]" />{" "}
                            Hospital
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {appState === "searching" && (
                    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                      <div className="text-center rounded-2xl bg-white/90 px-6 py-4 shadow-xl">
                        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#EA580C] border-t-transparent" />
                        <p
                          className="text-sm font-semibold text-slate-800"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          Finding nearest hospital...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: STATUS & STEPPER */}
            <div className="min-h-0 flex flex-col gap-2 overflow-hidden">
              <motion.div
                key={emergency?.emergencyStatus || "loading"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border bg-white p-3 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)]"
                style={{
                  borderColor: `${appState === "searching" ? "#EA580C" : currentStatus.color}33`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${appState === "searching" ? "#EA580C" : currentStatus.color}1A`,
                      }}
                    >
                      {appState === "searching" ? (
                        <MapPin className="h-5 w-5 text-[#EA580C]" />
                      ) : (
                        <StatusIcon
                          className="h-5 w-5"
                          style={{ color: currentStatus.color }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {appState === "searching"
                          ? "Action Required"
                          : "Live status"}
                      </p>
                      <h3
                        className="mt-0.5 text-lg text-slate-950"
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        {appState === "searching"
                          ? "Locating Support"
                          : currentStatus.title}
                      </h3>
                      {emergency?.hospital?.name && appState === "found" && (
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          Destination: {emergency.hospital.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${appState === "searching" ? "bg-orange-50 text-orange-700 border-orange-100" : currentStatus.accent}`}
                  >
                    {appState === "searching"
                      ? "Searching"
                      : emergency?.active === false
                        ? "Completed"
                        : "Active"}
                  </div>
                </div>

                {appState === "found" && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        ETA
                      </p>
                      <p
                        className="mt-1 text-xl text-slate-950"
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        {eta != null ? `${eta}s` : "Live"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Road distance
                      </p>
                      <p
                        className="mt-1 text-xl text-slate-950"
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        {formatDistance(routeSummary.distanceKm)}
                      </p>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                )}
              </motion.div>

              {/* Progress Stepper */}
              <div className="min-h-0 flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)]">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-[#1F3A5F]" />
                  <span
                    className="text-sm text-[#1F3A5F]"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Dispatch progress
                  </span>
                </div>

                <div className="space-y-0 h-[calc(100%-28px)] overflow-auto pr-1">
                  {appState === "searching" ? (
                    <div className="text-center text-sm text-slate-400 mt-10">
                      Waiting for assignment...
                    </div>
                  ) : (
                    PROGRESS_STEPS.map((step, index) => {
                      const isDone =
                        index < currentStepIndex ||
                        (emergency?.emergencyStatus === "completed" &&
                          index === currentStepIndex);
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`z-10 flex h-7 w-7 items-center justify-center rounded-full ${isDone ? "bg-emerald-600 text-white" : isCurrent ? "bg-[#0F6CBD] text-white" : "bg-slate-200 text-slate-400"}`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-xs">{index + 1}</span>
                              )}
                            </div>
                            {index < PROGRESS_STEPS.length - 1 && (
                              <div
                                className={`min-h-8 w-0.5 ${isDone ? "bg-emerald-500" : "bg-slate-200"}`}
                              />
                            )}
                          </div>
                          <div className="pb-4 pt-1">
                            <p
                              className={`text-sm ${isCurrent ? "font-semibold text-slate-900" : isDone ? "font-medium text-emerald-700" : "text-slate-400"}`}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="mt-0.5 text-xs text-[#0F6CBD]">
                                Tracking live
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
