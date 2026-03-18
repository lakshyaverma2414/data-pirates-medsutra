export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const fetchDashboardData = async () => {
  try {
    // Fetch core dashboard data in parallel.
    const [resourcesRes, bloodStockRes, profileRes, patientsRes] =
      await Promise.all([
        fetch(`${API_BASE_URL}/resources`, { headers: getHeaders() }).catch(
          () => null,
        ),
        fetch(`${API_BASE_URL}/blood-stock`, { headers: getHeaders() }).catch(
          () => null,
        ),
        fetch(`${API_BASE_URL}/hospitals/me`, { headers: getHeaders() }).catch(
          () => null,
        ),
        fetch(`${API_BASE_URL}/patients`, { headers: getHeaders() }).catch(
          () => null,
        ),
      ]);

    const resources = resourcesRes?.ok ? await resourcesRes.json() : [];
    const bloodStock = bloodStockRes?.ok ? await bloodStockRes.json() : [];
    const patients = patientsRes?.ok ? await patientsRes.json() : [];
    const profile = profileRes?.ok
      ? await profileRes.json()
      : {
          name: "MedSutra General Hospital",
          lat: 28.704059, // default to Delhi for demo
          lng: 77.10249,
        };

    return { resources, bloodStock, profile, patients };
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    throw err;
  }
};

const STATUS_FLOW = [
  "hospital_notified",
  "ambulance_dispatched",
  "ambulance_arriving",
  "patient_picked",
  "completed",
];

const LEGACY_STATUS_MAP = {
  ambulance_assigning: "ambulance_dispatched",
  reached_hospital: "completed",
};

const normalizeStatus = (value) => {
  const mapped = LEGACY_STATUS_MAP[value] || value;
  if (STATUS_FLOW.includes(mapped)) {
    return mapped;
  }
  return "hospital_notified";
};

const parseErrorMessage = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  return data?.message || fallbackMessage;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
};

const normalizeEmergency = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const id =
    raw.id ||
    raw._id ||
    raw.emergencyId ||
    `${raw.createdAt || "em"}-${raw.userLat || 0}-${raw.userLng || 0}`;

  const status =
    raw.emergencyStatus ||
    raw.ambulanceStatus ||
    raw.status ||
    "hospital_notified";

  const createdAt =
    raw.createdAt || raw.timestamp || raw.updatedAt || new Date().toISOString();

  const hospital =
    raw.hospital && typeof raw.hospital === "object" ? raw.hospital : null;

  return {
    id,
    emergencyType: raw.emergencyType || raw.type || "Unknown",
    description: raw.description || raw.additionalInfo || "No details provided",
    patientAge: raw.patientAge ?? raw.age ?? null,
    userLat: Number(raw.userLat),
    userLng: Number(raw.userLng),
    emergencyStatus: normalizeStatus(status),
    active: raw.active !== false && normalizeStatus(status) !== "completed",
    createdAt,
    hospital,
  };
};

const extractEmergencyList = async (response) => {
  const payload = await response.json().catch(() => null);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (
    payload.emergency &&
    typeof payload.emergency === "object" &&
    (payload.emergency.id || payload.emergency._id)
  ) {
    return [payload.emergency];
  }

  if (payload.id || payload._id) {
    return [payload];
  }

  return [
    ...toArray(payload.emergencies),
    ...toArray(payload.emergency),
    ...toArray(payload.data),
    ...toArray(payload.items),
    ...toArray(payload.results),
  ];
};

export const fetchHospitalEmergencies = async ({ active, status } = {}) => {
  const params = new URLSearchParams();
  if (typeof active === "boolean") {
    params.set("active", String(active));
  }
  if (status) {
    params.set("status", status);
  }

  const query = params.toString();
  const url = `${API_BASE_URL}/hospitals/user-emergencies${query ? `?${query}` : ""}`;

  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to load hospital emergencies"),
    );
  }

  const list = await extractEmergencyList(response);
  return list.map(normalizeEmergency).filter(Boolean);
};

export const fetchHospitalEmergencyById = async (id) => {
  if (!id) {
    throw new Error("Valid emergency id is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/hospitals/user-emergencies/${id}`,
    {
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to load hospital emergency"),
    );
  }

  const payload = await response.json();
  return normalizeEmergency(payload);
};

export const updateEmergencyStatus = async ({
  emergencyId,
  status,
  actorType = "hospital",
  actorId,
}) => {
  if (!emergencyId) {
    throw new Error("Valid emergencyId is required");
  }

  if (!STATUS_FLOW.includes(status)) {
    throw new Error("Invalid emergency status selected");
  }

  if (!actorType || !["hospital", "user"].includes(actorType)) {
    throw new Error("actorType must be user or hospital");
  }

  const response = await fetch(`${API_BASE_URL}/user/emergency/status`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ emergencyId, status, actorType, actorId }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to update emergency status"),
    );
  }

  return response.json();
};

export const EMERGENCY_STATUS_FLOW = STATUS_FLOW;

export const createPatient = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create patient");
  }
  return response.json();
};

export const updateBloodStock = async (bloodGroup, units) => {
  const response = await fetch(`${API_BASE_URL}/blood-stock`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ bloodGroup, units }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update blood stock");
  }
  return response.json();
};

export const updateResource = async (name, units) => {
  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ name, units }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update resource");
  }
  return response.json();
};
