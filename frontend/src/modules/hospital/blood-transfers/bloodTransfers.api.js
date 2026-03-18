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

export const fetchBloodStock = async () => {
  const response = await fetch(`${API_BASE_URL}/blood-stock`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to load blood stock"),
    );
  }

  return response.json();
};

export const fetchBloodNetworkStock = async () => {
  const response = await fetch(`${API_BASE_URL}/blood-stock/network`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to load blood network stock"),
    );
  }

  return response.json();
};

export const updateBloodStock = async (bloodGroup, units) => {
  const response = await fetch(`${API_BASE_URL}/blood-stock`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bloodGroup, units }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to update blood stock"),
    );
  }

  return response.json();
};

export const createBloodTransferRequest = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/blood-transfers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to create blood request"),
    );
  }

  return response.json();
};

export const fetchBloodTransferRequests = async (type) => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);

  const response = await fetch(
    `${API_BASE_URL}/blood-transfers${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to load blood requests"),
    );
  }

  return response.json();
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

export const acceptBloodTransferRequest = async (id) => {
  const response = await fetch(`${API_BASE_URL}/blood-transfers/${id}/accept`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to accept blood request"),
    );
  }

  return response.json();
};

export const rejectBloodTransferRequest = async (id) => {
  const response = await fetch(`${API_BASE_URL}/blood-transfers/${id}/reject`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to reject blood request"),
    );
  }

  return response.json();
};

export const completeBloodTransferRequest = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/blood-transfers/${id}/complete`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Failed to complete blood transfer"),
    );
  }

  return response.json();
};
