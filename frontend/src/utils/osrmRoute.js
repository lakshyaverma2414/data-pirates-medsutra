import L from "leaflet";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const AMBULANCE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <filter id="drop-shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="8" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.4" />
    </filter>
    <filter id="red-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="blue-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EAEAEA" />
      <stop offset="20%" stop-color="#FFFFFF" />
      <stop offset="80%" stop-color="#FDFDFD" />
      <stop offset="100%" stop-color="#D6D6D6" />
    </linearGradient>
    <linearGradient id="window-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1A252C" />
      <stop offset="100%" stop-color="#0A1014" />
    </linearGradient>
    <linearGradient id="tire-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#111" />
      <stop offset="50%" stop-color="#333" />
      <stop offset="100%" stop-color="#050505" />
    </linearGradient>
  </defs>
  <g filter="url(#drop-shadow)">
    <g id="wheels">
      <rect x="164" y="140" width="24" height="50" rx="6" fill="url(#tire-grad)" />
      <rect x="324" y="140" width="24" height="50" rx="6" fill="url(#tire-grad)" />
      <rect x="164" y="330" width="24" height="50" rx="6" fill="url(#tire-grad)" />
      <rect x="324" y="330" width="24" height="50" rx="6" fill="url(#tire-grad)" />
    </g>
    <g id="van-body">
      <rect x="176" y="96" width="160" height="320" rx="35" fill="url(#body-grad)" />
      <path d="M 210 96 Q 256 88 302 96 L 310 108 L 202 108 Z" fill="#333333" />
      <rect x="196" y="410" width="120" height="10" rx="3" fill="#333333" />
      <path d="M 184 145 Q 256 120 328 145 L 320 170 Q 256 155 192 170 Z" fill="url(#window-grad)" />
      <path d="M 196 115 Q 256 108 316 115" fill="none" stroke="#CCCCCC" stroke-width="2" />
    </g>
    <rect x="182" y="190" width="6" height="200" fill="#E63946" opacity="0.85" />
    <rect x="324" y="190" width="6" height="200" fill="#E63946" opacity="0.85" />
    <g id="roof">
      <rect x="190" y="180" width="132" height="220" rx="15" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.7" />
      <g id="medical-cross">
        <rect x="236" y="230" width="40" height="120" rx="4" fill="#E63946" />
        <rect x="196" y="270" width="120" height="40" rx="4" fill="#E63946" />
      </g>
    </g>
    <g id="lights">
      <rect x="206" y="176" width="100" height="12" rx="4" fill="#999999" />
      <rect x="208" y="177" width="35" height="10" rx="3" fill="#EF4444" filter="url(#red-glow)" />
      <rect x="246" y="177" width="20" height="10" rx="2" fill="#FFFFFF" />
      <rect x="269" y="177" width="35" height="10" rx="3" fill="#3B82F6" filter="url(#blue-glow)" />
      <rect x="186" y="406" width="16" height="6" rx="2" fill="#EF4444" />
      <rect x="310" y="406" width="16" height="6" rx="2" fill="#EF4444" />
    </g>
    <rect x="184" y="180" width="4" height="210" rx="2" fill="#FFFFFF" opacity="0.9" />
    <rect x="324" y="180" width="4" height="210" rx="2" fill="#000000" opacity="0.1" />
  </g>
</svg>`;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const interpolateRoute = (origin, destination, steps = 90) =>
  Array.from({ length: steps + 1 }, (_, index) => ({
    lat: origin.lat + (destination.lat - origin.lat) * (index / steps),
    lng: origin.lng + (destination.lng - origin.lng) * (index / steps),
  }));

export const fetchOsrmRoute = async (origin, destination) => {
  try {
    const url = `${API_BASE_URL}/route-proxy?fromLat=${origin.lat}&fromLng=${origin.lng}&toLat=${destination.lat}&toLng=${destination.lng}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Route proxy request failed");
    }

    const payload = await response.json();
    const route = payload?.data?.routes?.[0];
    const coordinates = route?.geometry?.coordinates;

    if (!Array.isArray(coordinates) || !coordinates.length) {
      throw new Error("Route proxy returned no geometry");
    }

    return {
      points: coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: Number(route.distance || 0) / 1000,
      durationMinutes: Number(route.duration || 0) / 60,
      source: payload.source === "cache" ? "cache" : "osrm",
    };
  } catch {
    const fallback = interpolateRoute(origin, destination);

    return {
      points: fallback,
      distanceKm: 0,
      durationMinutes: 0,
      source: "fallback",
    };
  }
};

export const getPointAtProgress = (points, progress) => {
  if (!Array.isArray(points) || !points.length) {
    return null;
  }

  const index = Math.round((points.length - 1) * clamp(progress, 0, 1));
  return points[index] || points[points.length - 1] || null;
};

export const createAmbulanceDivIcon = ({ size = 46, className = "" } = {}) =>
  L.divIcon({
    html: `<div style="display:flex;height:${size}px;width:${size}px;align-items:center;justify-content:center;filter:drop-shadow(0 8px 16px rgba(15,23,42,0.24));transform:translateZ(0)">${AMBULANCE_SVG}</div>`,
    className,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
