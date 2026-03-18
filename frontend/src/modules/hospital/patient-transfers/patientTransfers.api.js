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

export const fetchPatients = async () => {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to load patients"),
    );
  }

  return response.json();
};

export const createPatient = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to create patient"),
    );
  }

  return response.json();
};

export const fetchTransfers = async () => {
  const response = await fetch(`${API_BASE_URL}/transfers`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to load transfers"),
    );
  }

  return response.json();
};

export const createTransferRequest = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/transfers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ patientId }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to create transfer request"),
    );
  }

  return response.json();
};

export const acceptTransferRequest = async (id, toHospitalId) => {
  const response = await fetch(`${API_BASE_URL}/transfers/${id}/accept`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ toHospitalId }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to accept transfer request"),
    );
  }

  return response.json();
};

export const updateTransferProgress = async (id, progress) => {
  const response = await fetch(`${API_BASE_URL}/transfers/${id}/progress`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ progress }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to update transfer progress"),
    );
  }

  return response.json();
};

export const transferPatientToMyHospital = async (patientId) => {
  const response = await fetch(
    `${API_BASE_URL}/patients/${patientId}/transfer`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Failed to transfer patient to hospital",
      ),
    );
  }

  return response.json();
};
