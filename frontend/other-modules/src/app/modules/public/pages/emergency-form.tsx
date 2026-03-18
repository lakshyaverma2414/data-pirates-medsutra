import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Heart,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  User,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type LatLng = { lat: number; lng: number };

type SeedHospital = {
  id?: string | number;
  _id?: string | number;
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
};

type EmergencyResponse = {
  id: string | number;
  _id?: string | number;
  emergencyType?: string;
  description?: string;
  patientAge?: number;
  userLat?: number;
  userLng?: number;
  createdAt?: string;
  hospital?: SeedHospital;
};

type TrackingSeed = {
  emergencyType: string;
  description: string;
  patientAge: number;
  userLat: number;
  userLng: number;
  createdAt: string;
  hospital?: SeedHospital;
  createRequestPending?: boolean;
  submitPayload?: {
    emergencyType: string;
    description: string;
    patientAge: number;
    userLat: number;
    userLng: number;
  };
};

const TRACKING_SEED_STORAGE_PREFIX = "emergency-tracking-seed:";

const EMERGENCY_TYPES = [
  { id: "chest-pain", label: "Chest pain", icon: "💔" },
  { id: "bleeding", label: "Severe bleeding", icon: "🩸" },
  { id: "breathing", label: "Difficulty breathing", icon: "💨" },
  { id: "stroke", label: "Stroke symptoms", icon: "🧠" },
  { id: "accident", label: "Accident / trauma", icon: "🚗" },
  { id: "unconscious", label: "Unconsciousness", icon: "😵" },
  { id: "fever", label: "High fever", icon: "🌡️" },
  { id: "allergic", label: "Severe allergic reaction", icon: "⚠️" },
];

const TEST_FORM_PREFILL = {
  emergencyType: "chest-pain",
  description:
    "Patient has severe chest pain and shortness of breath for 10 minutes.",
  patientAge: "58",
  location: "22.7196, 75.8577",
};

function hasValidCoords(coords: LatLng | null | undefined) {
  return Boolean(
    coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng),
  );
}

function parseCoordsFromInput(raw: string) {
  const parts = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));

  if (parts.length !== 2) return null;
  return { lat: parts[0], lng: parts[1] };
}

export function EmergencyForm() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(
    TEST_FORM_PREFILL.emergencyType,
  );
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [formData, setFormData] = useState({
    description: TEST_FORM_PREFILL.description,
    patientAge: TEST_FORM_PREFILL.patientAge,
    location: TEST_FORM_PREFILL.location,
  });

  const captureCurrentLocation = useCallback((): Promise<LatLng> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        setLocationError("GPS not supported on this device.");
        setFormData((p) => ({ ...p, location: "" }));
        reject(new Error("GPS not supported"));
        return;
      }
      setLocationLoading(true);
      setLocationError("");
      setFormData((p) => ({ ...p, location: "Detecting GPS location..." }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setUserCoords({ lat, lng });
          setFormData((p) => ({ ...p, location: `${lat}, ${lng}` }));
          setLocationLoading(false);
          resolve({ lat, lng });
        },
        () => {
          setLocationError(
            "Location permission denied. Please enter your location manually.",
          );
          setFormData((p) => ({ ...p, location: "" }));
          setLocationLoading(false);
          reject(new Error("Location denied"));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  useEffect(() => {
    captureCurrentLocation().catch(() => undefined);
  }, [captureCurrentLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      setSubmitError("Please select an emergency type to continue.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    setLoadingMessage("Preparing emergency dispatch...");

    try {
      let coords = userCoords;
      if (!coords) {
        setLoadingMessage("Detecting your GPS location...");
        coords = await captureCurrentLocation().catch(() => null);
      }

      if (!coords) {
        coords = parseCoordsFromInput(formData.location || "");
      }

      if (!coords || !hasValidCoords(coords)) {
        throw new Error(
          "Unable to detect your coordinates. Please allow location access or enter valid latitude, longitude.",
        );
      }

      setUserCoords(coords);
      setLoadingMessage("Opening live map...");

      const id = `PENDING-${Date.now().toString(36).toUpperCase()}`;
      const submitPayload = {
        emergencyType: selectedType,
        description: formData.description,
        patientAge: Number(formData.patientAge),
        userLat: coords.lat,
        userLng: coords.lng,
      };

      const trackingSeed: TrackingSeed = {
        emergencyType: selectedType,
        description: formData.description,
        patientAge: Number(formData.patientAge),
        userLat: coords.lat,
        userLng: coords.lng,
        createdAt: new Date().toISOString(),
        createRequestPending: true,
        submitPayload,
      };

      try {
        window.sessionStorage.setItem(
          `${TRACKING_SEED_STORAGE_PREFIX}${id}`,
          JSON.stringify(trackingSeed),
        );
      } catch {
        // ignore storage failures
      }

      navigate(`/emergency/tracking/${id}`, {
        state: { trackingSeed },
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to reach emergency services. Please try again or call 112.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-border px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/emergency"
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Emergency Options
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#C0392B]" />
            <span
              className="text-xl"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              MedSutra
            </span>
          </div>
        </div>
      </header>

      <main className="py-10 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1
              className="text-2xl text-[#1F3A5F] mb-1"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
              }}
            >
              Emergency Details
            </h1>
            <p className="text-foreground/60 text-sm">
              Select the emergency type and describe the situation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <label
                className="block text-sm font-semibold text-foreground/80 mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Emergency Type <span className="text-[#C0392B]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EMERGENCY_TYPES.map((t) => (
                  <motion.button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col items-center gap-1 cursor-pointer ${
                      selectedType === t.id
                        ? "border-[#C0392B] bg-red-50 shadow-sm"
                        : "border-border hover:border-[#C0392B]/50 hover:bg-red-50/50"
                    }`}
                  >
                    <span className="text-2xl leading-none">{t.icon}</span>
                    <span
                      className={`text-xs text-center leading-tight mt-1 ${
                        selectedType === t.id
                          ? "text-[#C0392B] font-semibold"
                          : "text-foreground/70"
                      }`}
                    >
                      {t.label}
                    </span>
                    {selectedType === t.id ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 bg-[#C0392B] rounded-full flex items-center justify-center mt-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    ) : null}
                  </motion.button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {selectedType ? (
                <motion.div
                  key="fields"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-5"
                >
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-2">
                      <FileText className="w-4 h-4" />
                      Symptoms / Description{" "}
                      <span className="text-[#C0392B]">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder={
                        "Describe the symptoms clearly.\nExample: Patient has chest pain and difficulty breathing."
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/30 text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-2">
                      <User className="w-4 h-4" />
                      Patient Age <span className="text-[#C0392B]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.patientAge}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          patientAge: e.target.value,
                        }))
                      }
                      placeholder="Enter patient age"
                      min="0"
                      max="150"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Current location detected - edit if incorrect"
                        className="w-full px-4 py-3 pr-10 border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/30 text-sm"
                      />
                      {locationLoading ? (
                        <div className="absolute right-3 top-3.5">
                          <div className="animate-spin w-4 h-4 border-2 border-[#1F3A5F] border-t-transparent rounded-full" />
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          captureCurrentLocation().catch(() => undefined);
                        }}
                        className="text-xs text-[#1F3A5F] font-semibold hover:underline"
                        disabled={locationLoading}
                      >
                        {locationLoading
                          ? "Detecting..."
                          : "Use current GPS location"}
                      </button>
                    </div>
                    {locationError ? (
                      <p className="text-xs text-[#C0392B] mt-1">
                        {locationError}
                      </p>
                    ) : null}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting || locationLoading}
                    whileHover={!isSubmitting ? { scale: 1.01 } : undefined}
                    whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                    className="w-full py-4 bg-[#C0392B] text-white rounded-xl hover:bg-[#A93226] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        {loadingMessage || "Dispatching..."}
                      </span>
                    ) : (
                      "Request Emergency Ambulance"
                    )}
                  </motion.button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {submitError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-[#C0392B]">{submitError}</p>
              </div>
            ) : null}
          </form>
        </div>
      </main>
    </div>
  );
}
