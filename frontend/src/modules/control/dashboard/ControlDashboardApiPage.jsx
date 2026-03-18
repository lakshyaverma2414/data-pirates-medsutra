import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LogOut, RotateCcw, Siren } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createAmbulanceDivIcon } from "../../../utils/osrmRoute";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "", iconRetinaUrl: "" });

// const CENTER = [22.75104, 75.8955];
const CENTER = [22.69891, 75.87772];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const HOSPITALS_API = `${API_BASE_URL}/auth/hospitals`;
const ROUTE_API = `${API_BASE_URL}/route-proxy`;
const FIXED_TRIP_DURATION_MS = 15_000;

const MARKER_SMOOTHING_ALPHA = 0.22;
const BEARING_SMOOTHING_ALPHA = 0.18;

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function hospitalIcon() {
  return L.divIcon({
    html: `<div style="width:24px;height:24px;background:#1d4ed8;border:2px solid #fff;border-radius:6px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:12px;font-weight:900;color:#fff">H</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function incidentIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:40px;height:40px;background:rgba(239,68,68,0.35);border-radius:50%;animation:ripple 1.4s ease-out infinite"></div><div style="width:13px;height:13px;background:#ef4444;border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px #ef4444bb;position:relative;z-index:1"></div></div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function normalizeAngle(angle) {
  let next = angle % 360;
  if (next < 0) next += 360;
  return next;
}

function shortestAngleDelta(from, to) {
  const fromNorm = normalizeAngle(from);
  const toNorm = normalizeAngle(to);
  let delta = toNorm - fromNorm;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function lerpAngleUnwrapped(from, to, alpha) {
  return from + shortestAngleDelta(from, to) * alpha;
}

function getInterpolatedPointAndBearing(points, progress) {
  if (!points.length) return { point: null, bearing: 0 };
  if (points.length === 1) return { point: points[0], bearing: 0 };

  const firstBearing = normalizeAngle(
    (Math.atan2(points[1].lng - points[0].lng, points[1].lat - points[0].lat) *
      180) /
      Math.PI,
  );
  const lastIdx = points.length - 1;
  const lastBearing = normalizeAngle(
    (Math.atan2(
      points[lastIdx].lng - points[lastIdx - 1].lng,
      points[lastIdx].lat - points[lastIdx - 1].lat,
    ) *
      180) /
      Math.PI,
  );

  if (progress <= 0) return { point: points[0], bearing: firstBearing };
  if (progress >= 1) return { point: points[lastIdx], bearing: lastBearing };

  const clamped = Math.min(Math.max(progress, 0), 1);

  let totalDist = 0;
  const distances = [];
  for (let i = 0; i < points.length - 1; i++) {
    const d = L.latLng(points[i].lat, points[i].lng).distanceTo(
      L.latLng(points[i + 1].lat, points[i + 1].lng),
    );
    distances.push(d);
    totalDist += d;
  }

  const targetDist = totalDist * clamped;
  let currentDist = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const segDist = distances[i];
    if (currentDist + segDist >= targetDist) {
      const segProgress =
        segDist > 0 ? (targetDist - currentDist) / segDist : 0;
      const p1 = points[i];
      const p2 = points[i + 1];
      const lat = p1.lat + (p2.lat - p1.lat) * segProgress;
      const lng = p1.lng + (p2.lng - p1.lng) * segProgress;
      const dx = p2.lng - p1.lng;
      const dy = p2.lat - p1.lat;
      const bearing = normalizeAngle((Math.atan2(dx, dy) * 180) / Math.PI);
      return { point: { lat, lng }, bearing };
    }
    currentDist += segDist;
  }

  return { point: points[lastIdx], bearing: lastBearing };
}

function pathDistanceMeters(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += L.latLng(points[i - 1].lat, points[i - 1].lng).distanceTo(
      L.latLng(points[i].lat, points[i].lng),
    );
  }
  return total;
}

async function fetchRoutePoints(to) {
  const url = `${ROUTE_API}?fromLat=${CENTER[0]}&fromLng=${CENTER[1]}&toLat=${to.lat}&toLng=${to.lng}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Route API failed: ${res.status}`);
  const payload = await res.json();
  const route = payload?.data?.routes?.[0] || payload?.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("Route API returned empty geometry");
  }
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export default function ControlDashboardApiPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const incidentMarkerRef = useRef(null);

  const hospitalLayersRef = useRef([]);
  const routeLayersRef = useRef([]);
  const ambulanceLayersRef = useRef([]);
  const animationRafIdsRef = useRef([]);
  const dispatchTimeoutIdsRef = useRef([]);

  const [hospitals, setHospitals] = useState([]);
  const [routesByHospital, setRoutesByHospital] = useState({});
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [arrived, setArrived] = useState(0);
  const [totalAmbulances, setTotalAmbulances] = useState(0);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [patientStats, setPatientStats] = useState(null);

  const hospitalsCount = hospitals.length;
  const loadingSubSteps = [
    "Initializing incident parameters...",
    "Pinging available hospital network...",
    "Generating optimal route matrix...",
  ];

  const dispatchPlan = useMemo(() => {
    if (!hospitalsCount) return [];
    const minAssigned = hospitals.map((h) => ({ hospitalId: h.id, count: 1 }));
    const targetTotal = Math.ceil(hospitalsCount * 1.5);
    let remaining = Math.max(targetTotal - hospitalsCount, 0);
    while (remaining > 0) {
      const idx = rnd(0, minAssigned.length - 1);
      minAssigned[idx].count += 1;
      remaining -= 1;
    }
    return minAssigned;
  }, [hospitals, hospitalsCount, status]);

  useEffect(() => {
    if (status !== "loading-routes") {
      setLoadingStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % loadingSubSteps.length);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const map = L.map(mapRef.current, {
      center: CENTER,
      zoom: 10,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    incidentMarkerRef.current = L.marker(CENTER, {
      icon: incidentIcon(),
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadHospitals = async () => {
      try {
        setError("");
        const res = await fetch(HOSPITALS_API);
        if (!res.ok) throw new Error(`Hospital API failed: ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        const normalized = Array.isArray(data)
          ? data
              .filter(
                (h) =>
                  Number.isFinite(Number(h?.lat)) &&
                  Number.isFinite(Number(h?.lng)),
              )
              .map((h) => ({
                ...h,
                id: Number(h.id),
                lat: Number(h.lat),
                lng: Number(h.lng),
              }))
          : [];
        setHospitals(normalized);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.message || "Failed to load hospitals");
      }
    };
    loadHospitals();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    hospitalLayersRef.current.forEach((layer) => map.removeLayer(layer));
    hospitalLayersRef.current = [];

    hospitals.forEach((h) => {
      const marker = L.marker([h.lat, h.lng], { icon: hospitalIcon() })
        .addTo(map)
        .bindTooltip(
          `<span style="font-size:10px;opacity:.7">ID: ${h.id}</span><br/><b>${h.name}</b>`,
          {
            direction: "top",
            offset: [0, -8],
          },
        );
      hospitalLayersRef.current.push(marker);
    });

    if (hospitals.length) {
      const bounds = L.latLngBounds([[CENTER[0], CENTER[1]]]);
      hospitals.forEach((h) => bounds.extend([h.lat, h.lng]));
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 13,
      });
    }
  }, [hospitals]);

  const clearSimulation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    dispatchTimeoutIdsRef.current.forEach((id) => clearTimeout(id));
    dispatchTimeoutIdsRef.current = [];

    animationRafIdsRef.current.forEach((id) => cancelAnimationFrame(id));
    animationRafIdsRef.current = [];

    routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
    routeLayersRef.current = [];

    ambulanceLayersRef.current.forEach((layer) => map.removeLayer(layer));
    ambulanceLayersRef.current = [];

    setArrived(0);
    setTotalAmbulances(0);
  };

  const handlePlay = async () => {
    if (!hospitals.length || status === "loading-routes") return;
    clearSimulation();
    setStatus("loading-routes");
    setError("");

    try {
      const routeEntries = await Promise.all(
        hospitals.map(async (h) => {
          const points = await fetchRoutePoints({ lat: h.lat, lng: h.lng });
          return [h.id, points];
        }),
      );

      const postApiDelayMs = rnd(2, 5) * 1000;
      await new Promise((resolve) => setTimeout(resolve, postApiDelayMs));

      const routeMap = Object.fromEntries(routeEntries);
      setRoutesByHospital(routeMap);

      const map = mapInstanceRef.current;
      Object.entries(routeMap).forEach(([hospitalId, points]) => {
        const polyline = L.polyline(
          points.map((p) => [p.lat, p.lng]),
          {
            color: "#0F6CBD",
            weight: 4,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          },
        ).addTo(map);
        polyline.bindTooltip(`Route -> Hospital ${hospitalId}`);
        routeLayersRef.current.push(polyline);
      });

      setStatus("dispatching");

      const total = dispatchPlan.reduce((sum, item) => sum + item.count, 0);
      setTotalAmbulances(total);

      const critical = rnd(Math.floor(total * 0.1), Math.floor(total * 0.22));
      const serious = rnd(Math.floor(total * 0.2), Math.floor(total * 0.35));
      const moderate = total - critical - serious;
      setPatientStats({ total, critical, serious, moderate });

      let arrivedCount = 0;
      let ambulanceSeq = 0;

      dispatchPlan.forEach((item) => {
        const points = routeMap[item.hospitalId];
        if (!Array.isArray(points) || points.length < 2) return;

        let routeDelayMs = 0;
        for (let i = 0; i < item.count; i++) {
          if (i > 0) routeDelayMs += rnd(1, 2) * 1000;

          const timeoutId = setTimeout(() => {
            ambulanceSeq += 1;
            const ambulanceId = ambulanceSeq;
            const marker = L.marker(CENTER, {
              icon: createAmbulanceDivIcon({ size: 56 }),
            }).addTo(map);
            ambulanceLayersRef.current.push(marker);

            const totalDistance = pathDistanceMeters(points);
            const distanceKm = totalDistance / 1000;
            const speedKmh = distanceKm / (FIXED_TRIP_DURATION_MS / 3_600_000);
            const totalDurationMs = FIXED_TRIP_DURATION_MS;
            console.log(
              `[Ambulance ${ambulanceId}] hospital=${item.hospitalId} distanceKm=${distanceKm.toFixed(2)} speedKmh=${speedKmh.toFixed(2)} durationSec=30`,
            );
            const startTime = performance.now();

            let smoothedPoint = null;
            let smoothedBearing = null;

            const animate = () => {
              const elapsed = performance.now() - startTime;
              const progress =
                totalDurationMs > 0
                  ? Math.min(elapsed / totalDurationMs, 1)
                  : 1;
              const { point, bearing } = getInterpolatedPointAndBearing(
                points,
                progress,
              );
              if (!point) return;

              if (!smoothedPoint) {
                smoothedPoint = point;
              } else {
                smoothedPoint = {
                  lat:
                    smoothedPoint.lat +
                    (point.lat - smoothedPoint.lat) * MARKER_SMOOTHING_ALPHA,
                  lng:
                    smoothedPoint.lng +
                    (point.lng - smoothedPoint.lng) * MARKER_SMOOTHING_ALPHA,
                };
              }

              if (smoothedBearing == null) {
                smoothedBearing = bearing;
              } else {
                smoothedBearing = lerpAngleUnwrapped(
                  smoothedBearing,
                  bearing,
                  BEARING_SMOOTHING_ALPHA,
                );
              }

              marker.setLatLng([smoothedPoint.lat, smoothedPoint.lng]);

              const iconEl = marker.getElement();
              if (iconEl) {
                const inner = iconEl.querySelector("div");
                if (inner) {
                  if (!inner.dataset.rotateReady) {
                    inner.style.transition = "none";
                    inner.dataset.rotateReady = "1";
                  }
                  inner.style.transform = `rotateZ(${smoothedBearing}deg)`;
                }
              }

              if (progress < 1) {
                const rafId = requestAnimationFrame(animate);
                animationRafIdsRef.current.push(rafId);
              } else {
                arrivedCount += 1;
                setArrived(arrivedCount);
                if (arrivedCount >= total) {
                  setStatus("done");
                }
              }
            };

            const rafId = requestAnimationFrame(animate);
            animationRafIdsRef.current.push(rafId);
          }, routeDelayMs);

          dispatchTimeoutIdsRef.current.push(timeoutId);
        }
      });
    } catch (e) {
      setStatus("idle");
      setError(e?.message || "Failed to fetch routes");
    }
  };

  const handleReset = () => {
    clearSimulation();
    setRoutesByHospital({});
    setStatus("idle");
    setError("");
    setPatientStats(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login/control");
  };

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <style>{`
        @keyframes ripple { 0% { transform:scale(0.8); opacity:0.9; } 100% { transform:scale(2.4); opacity:0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes aiRadarPulse { 0% { transform: scale(0.65); opacity: 0.85; } 100% { transform: scale(1.45); opacity: 0; } }
        @keyframes aiSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes aiFlow { 0% { transform: translateX(-100%); } 100% { transform: translateX(220%); } }
      `}</style>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 1600,
          width: 280,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(8,13,25,0.94)",
          color: "#fff",
          padding: "12px 14px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            Control Dashboard API
          </div>
          <button
            onClick={handleLogout}
            style={{
              border: "none",
              background: "rgba(255,255,255,.08)",
              color: "#fff",
              borderRadius: 7,
              width: 26,
              height: 26,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <LogOut size={13} />
          </button>
        </div>

        {patientStats && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Patients &mdash; Total: {patientStats.total}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 6,
              }}
            >
              {[
                {
                  label: "Critical",
                  value: patientStats.critical,
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.13)",
                  border: "rgba(239,68,68,0.35)",
                },
                {
                  label: "Serious",
                  value: patientStats.serious,
                  color: "#f97316",
                  bg: "rgba(249,115,22,0.13)",
                  border: "rgba(249,115,22,0.35)",
                },
                {
                  label: "Moderate",
                  value: patientStats.moderate,
                  color: "#facc15",
                  bg: "rgba(250,204,21,0.10)",
                  border: "rgba(250,204,21,0.30)",
                },
              ].map(({ label, value, color, bg, border }) => (
                <div
                  key={label}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: "7px 6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.55)",
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              fontSize: 11,
              color: "#fca5a5",
              background: "rgba(239,68,68,.15)",
              border: "1px solid rgba(239,68,68,.35)",
              borderRadius: 8,
              padding: "6px 8px",
              marginBottom: 9,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 7 }}>
          <button
            onClick={handlePlay}
            disabled={status === "loading-routes"}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              color: "#fff",
              background:
                status === "loading-routes"
                  ? "rgba(255,255,255,.1)"
                  : "linear-gradient(135deg,#C0392B,#e74c3c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Siren size={13} /> Simulate Emergency
          </button>
          <button
            onClick={handleReset}
            disabled={status === "loading-routes"}
            style={{
              border: "1px solid rgba(255,255,255,.16)",
              background: "rgba(255,255,255,.08)",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: status === "loading-routes" ? "not-allowed" : "pointer",
              opacity: status === "loading-routes" ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {status === "loading-routes" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(5,10,20,0.56)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "min(92vw, 520px)",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.16)",
              background:
                "linear-gradient(165deg, rgba(12,20,38,0.97), rgba(8,14,28,0.97))",
              padding: "24px 22px 20px",
              boxShadow: "0 18px 60px rgba(3,8,19,0.65)",
              color: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  border: "1px solid rgba(96,165,250,0.35)",
                  background:
                    "radial-gradient(circle, rgba(30,58,138,0.32), rgba(30,58,138,0.08))",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(96,165,250,0.65)",
                    animation: "aiRadarPulse 1.6s ease-out infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(96,165,250,0.45)",
                    animation: "aiRadarPulse 1.6s ease-out infinite",
                    animationDelay: "0.55s",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "44%",
                    height: 2,
                    transformOrigin: "left center",
                    background:
                      "linear-gradient(90deg, rgba(147,197,253,0.2), rgba(96,165,250,0.95))",
                    animation: "aiSweep 2.8s linear infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "#93c5fd",
                    boxShadow: "0 0 16px #60a5fa",
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: 12 }} className="">
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>
                Analyzing casualty distribution and calculating optimal AI
                dispatch routes...
              </div>
              <div style={{ fontSize: 13, color: "#93c5fd", minHeight: 20 }}>
                {loadingSubSteps[loadingStepIndex]}
              </div>
            </div>

            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "rgba(148,163,184,0.18)",
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,0.2)",
              }}
            >
              <div
                style={{
                  width: "48%",
                  height: "100%",
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, rgba(37,99,235,0), rgba(59,130,246,0.95), rgba(14,165,233,0))",
                  filter: "drop-shadow(0 0 10px rgba(59,130,246,0.85))",
                  animation: "aiFlow 1.35s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
