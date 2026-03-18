const API_BASE_URL =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL || "http://localhost:5000/api";

export interface ApiHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

type BloodDonorPayload = {
  name: string;
  bloodGroup: string;
  contact: string;
  city: string;
};

async function parseError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

function normalizeHospital(
  raw: Record<string, unknown>,
  idx: number,
): ApiHospital | null {
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const idValue =
    (typeof raw.id === "string" && raw.id) ||
    (typeof raw._id === "string" && raw._id) ||
    `HSP-${idx + 1}`;

  const nameValue =
    (typeof raw.name === "string" && raw.name) ||
    (typeof raw.hospitalName === "string" && raw.hospitalName) ||
    "Hospital";

  return {
    id: idValue,
    name: nameValue,
    lat,
    lng,
  };
}

async function getHospitals(): Promise<ApiHospital[]> {
  const response = await fetch(`${API_BASE_URL}/hospitals`, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "hey",
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load hospitals"));
  }

  const data = await response.json();
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.hospitals)
      ? data.hospitals
      : [];

  return list
    .map((hospital: Record<string, unknown>, idx: number) =>
      normalizeHospital(hospital, idx),
    )
    .filter((hospital: ApiHospital | null): hospital is ApiHospital =>
      Boolean(hospital),
    );
}

async function createBloodDonor(
  hospitalId: string,
  payload: BloodDonorPayload,
): Promise<unknown> {
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "hey",
  };

  const primaryResponse = await fetch(`${API_BASE_URL}/blood-donors`, {
    method: "POST",
    headers,
    body: JSON.stringify({ hospitalId, ...payload }),
  });

  if (primaryResponse.ok) {
    return primaryResponse.json();
  }

  const fallbackResponse = await fetch(
    `${API_BASE_URL}/hospitals/${hospitalId}/blood-donors`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );

  if (!fallbackResponse.ok) {
    throw new Error(
      await parseError(fallbackResponse, "Failed to register blood donor"),
    );
  }

  return fallbackResponse.json();
}

export const apiService = {
  getHospitals,
  createBloodDonor,
};
