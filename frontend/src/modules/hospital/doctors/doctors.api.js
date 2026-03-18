const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const readErrorMessage = async (response, fallbackMessage) => {
  const errorData = await response.json().catch(() => ({}));
  return errorData?.message || fallbackMessage;
};

export const fetchCurrentHospitalProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/hospitals/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to load hospital profile"),
    );
  }

  return response.json();
};

export const createDoctor = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/doctors`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to create doctor"),
    );
  }

  const data = await response.json();
  return data?.doctor || null;
};

export const fetchDoctors = async () => {
  const response = await fetch(`${API_BASE_URL}/doctors`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to load doctors"));
  }

  const data = await response.json();
  return Array.isArray(data?.doctors) ? data.doctors : [];
};

export const fetchDoctorById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to load doctor"));
  }

  const data = await response.json();
  return data?.doctor || null;
};
