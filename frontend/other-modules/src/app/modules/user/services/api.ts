const API_BASE_URL =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL || "http://localhost:8081";

export interface Patient {
  id: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  bloodGroup: string;
  city: string;
  emergencyContact: string;
  allergies: string;
  chronicConditions: string;
  medications: string;
  phoneVerified: boolean;
  status: string;
  timestamp: string;
}

export interface UserDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  hospitalId: string;
  experience: string;
  nextAvailable: string;
  fee: string;
  rating: number;
  status: string;
  timestamp: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "hey",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export function createPatient(data: {
  fullName: string;
  phoneNumber: string;
  age: number;
  bloodGroup: string;
  city: string;
  emergencyContact: string;
  allergies?: string;
  chronicConditions?: string;
  medications?: string;
}): Promise<Patient> {
  return request<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePatient(
  id: string,
  data: Partial<
    Omit<
      Patient,
      "id" | "phoneNumber" | "phoneVerified" | "status" | "timestamp"
    >
  >,
): Promise<Patient> {
  return request<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getPatientByPhone(phoneNumber: string): Promise<Patient> {
  return request<Patient>(`/patients/phone/${phoneNumber}`);
}

export function getDoctors(): Promise<UserDoctor[]> {
  return request<UserDoctor[]>("/doctors");
}
