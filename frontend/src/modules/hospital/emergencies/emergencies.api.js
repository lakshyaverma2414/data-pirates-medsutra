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
    throw new Error(await readErrorMessage(response, "Failed to load profile"));
  }
  return response.json();
};

export const createEmergency = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/emergencies`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to create emergency"),
    );
  }

  return response.json();
};

export const fetchActiveEmergencies = async () => {
  const response = await fetch(`${API_BASE_URL}/emergencies`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to load emergencies"),
    );
  }

  return response.json();
};

export const acceptEmergency = async (id) => {
  const response = await fetch(`${API_BASE_URL}/emergencies/${id}/accept`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to accept emergency"),
    );
  }

  return response.json();
};

export const resolveEmergency = async (id) => {
  const response = await fetch(`${API_BASE_URL}/emergencies/${id}/resolve`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to resolve emergency"),
    );
  }

  return response.json();
};
