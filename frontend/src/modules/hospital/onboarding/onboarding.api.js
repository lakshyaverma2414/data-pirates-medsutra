const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const updateResource = async (name, units) => {
  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, units }),
  });
  if (!response.ok) throw new Error("Failed to update resource");
  return response.json();
};

export const updateBloodStock = async (bloodGroup, units) => {
  const response = await fetch(`${API_BASE_URL}/blood-stock`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ bloodGroup, units }),
  });
  if (!response.ok) throw new Error("Failed to update blood stock");
  return response.json();
};

export const createPatient = async (patientData) => {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(patientData),
  });
  if (!response.ok) throw new Error("Failed to create patient");
  return response.json();
};
