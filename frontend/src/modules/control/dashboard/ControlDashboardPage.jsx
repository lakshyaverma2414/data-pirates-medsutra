import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Shield, Siren, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import hospitalsData from "../../data/hospitals_with_routes.json";
import { createAmbulanceDivIcon } from "../../../utils/osrmRoute";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "", iconRetinaUrl: "" });

const CENTER = [22.75104, 75.8955];
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/ai/control-dashboard`;
const AMBULANCE_SPEED_MPS = 400 * (1000 / 3600);

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distributePatients(total) {
  const critical = rnd(4, Math.floor(total * 0.35));
  const serious = rnd(4, Math.floor((total - critical) * 0.6));
  const moderate = total - critical - serious;
  return {
    CRITICAL: critical,
    SERIOUS: serious,
    MODERATE: Math.max(moderate, 1),
  };
}

function ambIcon() {
  return createAmbulanceDivIcon({ size: 46 });
}

function hospitalIcon() {
  return L.divIcon({
    html: `<div style="width:26px;height:26px;background:#1d4ed8;border:2.5px solid #fff;border-radius:7px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.45);font-size:14px;font-weight:900;color:#fff;line-height:1">H</div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function incidentIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:24px;height:24px;background:rgba(239,68,68,0.35);border-radius:50%;animation:ripple 1.4s ease-out infinite"></div><div style="width:14px;height:14px;background:#ef4444;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 10px #ef4444bb;position:relative;z-index:1"></div></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function getBearing(from, to) {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  return Math.atan2(dLng, dLat) * (180 / Math.PI);
}

function shortestAngleDelta(fromDeg, toDeg) {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

function buildCumulativeDistances(coords) {
  const cumulative = [0];
  for (let i = 1; i < coords.length; i++) {
    const prev = L.latLng(coords[i - 1][0], coords[i - 1][1]);
    const next = L.latLng(coords[i][0], coords[i][1]);
    cumulative.push(cumulative[i - 1] + prev.distanceTo(next));
  }
  return cumulative;
}

function animateMarker(marker, coords, speedMps, onDone) {
  if (!Array.isArray(coords) || coords.length < 2 || speedMps <= 0) {
    if (onDone) onDone();
    return;
  }

  const cumulative = buildCumulativeDistances(coords);
  const totalDistance = cumulative[cumulative.length - 1];
  if (!Number.isFinite(totalDistance) || totalDistance <= 0) {
    marker.setLatLng(coords[coords.length - 1]);
    if (onDone) onDone();
    return;
  }

  let start = null;
  let lastTs = null;
  let segIndex = 0;
  let headingDeg = getBearing(coords[0], coords[1]);
  const maxTurnRateDegPerSec = 120;

  // Enable sub-pixel smooth positioning on Leaflet's container element
  requestAnimationFrame(() => {
    const el = marker.getElement();
    if (el) el.style.willChange = "transform";
  });

  function step(ts) {
    if (!start) {
      start = ts;
      lastTs = ts;
    }

    const elapsedSec = (ts - start) / 1000;
    const dtSec = Math.max((ts - lastTs) / 1000, 0.001);
    lastTs = ts;
    const traveled = Math.min(elapsedSec * speedMps, totalDistance);

    while (
      segIndex < cumulative.length - 2 &&
      cumulative[segIndex + 1] < traveled
    ) {
      segIndex++;
    }

    const segmentStart = cumulative[segIndex];
    const segmentEnd = cumulative[segIndex + 1];
    const segmentLength = Math.max(segmentEnd - segmentStart, 0.000001);
    const t = (traveled - segmentStart) / segmentLength;

    const from = coords[segIndex];
    const to = coords[segIndex + 1];
    const lat = from[0] + (to[0] - from[0]) * t;
    const lng = from[1] + (to[1] - from[1]) * t;
    marker.setLatLng([lat, lng]);

    const targetDeg = getBearing(from, to);
    const delta = shortestAngleDelta(headingDeg, targetDeg);
    const maxStep = maxTurnRateDegPerSec * dtSec;
    headingDeg += Math.max(-maxStep, Math.min(maxStep, delta));
    const inner = marker.getElement()?.firstChild;
    if (inner) inner.style.transform = `rotate(${headingDeg}deg)`;

    if (traveled >= totalDistance) {
      marker.setLatLng(coords[coords.length - 1]);
      if (onDone) onDone();
      return;
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const ControlDashboardPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const ambMarkersRef = useRef([]);
  const routeLinesRef = useRef([]);

  const [status, setStatus] = useState("idle");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [arrived, setArrived] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: CENTER,
      zoom: 10,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    // L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    //   attribution: '© OpenStreetMap contributors © CARTO',
    //   maxZoom: 19,
    //   subdomains: 'abcd'
    // }).addTo(map);
    // Using CartoDB Positron (clean, no heavy POI markers)
    // L.tileLayer(
    //   "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    //   {
    //     attribution: "© OpenStreetMap contributors © CARTO",
    //     maxZoom: 19,
    //     subdomains: "abcd",
    //   },
    // ).addTo(map);
    hospitalsData.forEach((h) => {
      L.marker([h.to.lat, h.to.lng], { icon: hospitalIcon() })
        .addTo(map)
        .bindTooltip(
          `<span style="font-size:10px;opacity:0.6">ID: ${h.id}</span><br/><b>${h.name}</b>`,
          { direction: "top", offset: [0, -8] },
        );
    });
    L.marker(CENTER, { icon: incidentIcon() })
      .addTo(map)
      .bindTooltip("<b>Emergency Incident</b>", {
        permanent: true,
        direction: "top",
        offset: [0, -8],
      });
    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  function clearAmbs() {
    ambMarkersRef.current.forEach((m) =>
      mapInstanceRef.current?.removeLayer(m),
    );
    ambMarkersRef.current = [];
    routeLinesRef.current.forEach((l) =>
      mapInstanceRef.current?.removeLayer(l),
    );
    routeLinesRef.current = [];
  }

  async function handleSimulate(forceRestart = false) {
    if (!forceRestart && status !== "idle" && status !== "done") return;
    setError(null);
    clearAmbs();
    setArrived(0);
    setTotal(0);

    const patientCount = rnd(8, 14);
    const patientConditionCount = distributePatients(patientCount);
    setStats({ patientCount, ...patientConditionCount });
    setStatus("loading");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCount, patientConditionCount }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const assignments = await res.json();

      setTotal(assignments.length);
      setStatus("dispatching");

      let arrivedCount = 0;
      const perRouteDelayMs = {};
      assignments.forEach((a) => {
        const hospital = hospitalsData.find((h) => h.id === a.hospitalId);
        if (!hospital?.routes?.[0]?.geometry?.coordinates) return;
        const routeKey = String(a.hospitalId);
        if (perRouteDelayMs[routeKey] == null) {
          perRouteDelayMs[routeKey] = 0;
        } else {
          perRouteDelayMs[routeKey] += rnd(1, 3) * 1000;
        }
        const dispatchDelayMs = perRouteDelayMs[routeKey];
        const coords = hospital.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng],
        );
        const polyline = L.polyline(coords, {
          color: "#470dfa",
          weight: 4,
          opacity: 0.82,
          smoothFactor: 1,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(mapInstanceRef.current);
        routeLinesRef.current.push(polyline);
        const marker = L.marker(CENTER, { icon: ambIcon() }).addTo(
          mapInstanceRef.current,
        );
        ambMarkersRef.current.push(marker);
        // Set initial bearing and enable smooth rotation transition before animating
        requestAnimationFrame(() => {
          const inner = marker.getElement()?.firstChild;
          if (inner && coords.length >= 2) {
            inner.style.transformOrigin = "center center";
            inner.style.transition = "none";
            inner.style.transform = `rotate(${getBearing(coords[0], coords[1])}deg)`;
          }
        });
        setTimeout(() => {
          animateMarker(marker, coords, AMBULANCE_SPEED_MPS, () => {
            arrivedCount++;
            setArrived(arrivedCount);
            if (arrivedCount === assignments.length) setStatus("done");
          });
        }, dispatchDelayMs);
      });
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  function handleReset() {
    clearAmbs();
    setStats(null);
    setArrived(0);
    setTotal(0);
    setError(null);
    setStatus("idle");
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== "Space" || event.repeat) return;

      const tag = event.target?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        event.target?.isContentEditable;

      if (isEditable) return;

      event.preventDefault();
      handleSimulate(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login/control");
  }

  const progressPct = total > 0 ? Math.round((arrived / total) * 100) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <style>{`
        @keyframes ripple { 0% { transform:scale(0.8); opacity:0.9; } 100% { transform:scale(2.4); opacity:0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { font-family: system-ui, sans-serif; }
        .leaflet-tooltip { font-size: 12px; padding: 4px 9px; border-radius: 7px; }
      `}</style>

      {/* Map fills the full viewport */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* ── CONTROL PANEL (top-left) ── */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 1500,
          background: "rgba(10,15,28,0.93)",
          backdropFilter: "blur(14px)",
          borderRadius: 14,
          padding: "12px 14px",
          width: 240,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 6px 28px rgba(0,0,0,0.55)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                background: "linear-gradient(135deg,#C0392B,#e74c3c)",
                borderRadius: 7,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield size={13} color="#fff" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>
              AI Dispatch Map
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "none",
              borderRadius: 6,
              width: 24,
              height: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogOut size={12} color="rgba(255,255,255,0.55)" />
          </button>
        </div>

        {/* Stat row */}
        {stats ? (
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "5px 7px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Total
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
                {stats.patientCount}
              </div>
            </div>
            {[
              { key: "CRITICAL", label: "Crit", fg: "#ef4444" },
              { key: "SERIOUS", label: "Ser", fg: "#f97316" },
              { key: "MODERATE", label: "Mod", fg: "#eab308" },
            ].map(({ key, label, fg }) => (
              <div
                key={key}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "5px 7px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: fg,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.85,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: fg,
                    lineHeight: 1.2,
                  }}
                >
                  {stats[key]}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "8px 0 9px",
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
            }}
          >
            Press the button to simulate
          </div>
        )}

        {/* Progress bar */}
        {(status === "dispatching" || status === "done") && total > 0 && (
          <div style={{ marginBottom: 9 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
              }}
            >
              <span>Arrived</span>
              <span
                style={{
                  fontWeight: 700,
                  color: status === "done" ? "#34d399" : "#fff",
                }}
              >
                {arrived} / {total}
              </span>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 999,
                height: 5,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background:
                    status === "done"
                      ? "#10b981"
                      : "linear-gradient(90deg,#3b82f6,#6366f1)",
                  width: `${progressPct}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* AI loading */}
        {status === "loading" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "#93c5fd",
              marginBottom: 9,
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                border: "2px solid #3b82f6",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
            Contacting AI…
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.14)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 8,
              padding: "6px 9px",
              fontSize: 11,
              color: "#fca5a5",
              marginBottom: 9,
              lineHeight: 1.4,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleSimulate}
            disabled={status === "loading" || status === "dispatching"}
            style={{
              flex: 1,
              padding: "8px 0",
              background:
                status === "loading" || status === "dispatching"
                  ? "rgba(255,255,255,0.09)"
                  : "linear-gradient(135deg,#C0392B,#e74c3c)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor:
                status === "loading" || status === "dispatching"
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              opacity: status === "loading" ? 0.6 : 1,
            }}
          >
            {status === "loading" && "Awaiting AI…"}
            {status === "dispatching" && "Dispatching…"}
            {(status === "idle" || status === "done") && (
              <>
                <Siren size={13} />
                Simulate
              </>
            )}
          </button>
          {(status === "dispatching" || status === "done") && (
            <button
              onClick={handleReset}
              style={{
                padding: "8px 10px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.13)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.65)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── LEGEND (bottom-right) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 16,
          zIndex: 1500,
          background: "rgba(10,15,28,0.88)",
          backdropFilter: "blur(12px)",
          borderRadius: 14,
          padding: "13px 16px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Legend
        </div>
        {[
          { color: "#ef4444", shape: "circle", label: "Critical Ambulance" },
          { color: "#f97316", shape: "circle", label: "Serious Ambulance" },
          { color: "#eab308", shape: "circle", label: "Moderate Ambulance" },
          { color: "#1d4ed8", shape: "rounded", label: "Hospital" },
          { color: "#ef4444", shape: "pulse", label: "Incident Point" },
        ].map(({ color, shape, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 7,
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: shape === "rounded" ? 14 : 10,
                height: shape === "rounded" ? 14 : 10,
                background: color,
                borderRadius:
                  shape === "circle" || shape === "pulse" ? "50%" : 3,
                border: "1.5px solid rgba(255,255,255,0.4)",
                flexShrink: 0,
                boxShadow: shape === "pulse" ? `0 0 6px ${color}` : "none",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.78)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlDashboardPage;
