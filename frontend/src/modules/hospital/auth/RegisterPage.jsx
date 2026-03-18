import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { registerHospital, loginHospital } from "./auth.api";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";

const PHONE_REGEX = /^\d{10}$/;
const REGISTER_STATS = [
  { value: "5 min", label: "Average onboarding time" },
  { value: "Live GPS", label: "Geo-tagged routing" },
  { value: "Blood + Beds", label: "Resource network visibility" },
  { value: "Realtime", label: "Transfer coordination" },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const hasToken = Boolean(localStorage.getItem("token"));
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    lat: "",
    lng: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("fetching...");

  const fetchGPS = () => {
    if ("geolocation" in navigator) {
      setGpsStatus("Locating...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          setGpsStatus("GPS Acquired");
        },
        () => {
          setGpsStatus("Permission Denied");
          alert(
            "GPS Location is required to connect to the hospital network. Please enable location permissions to ensure emergencies and transfers are routed properly.",
          );
        },
        { enableHighAccuracy: true },
      );
    } else {
      setGpsStatus("Not Supported");
    }
  };

  useEffect(() => {
    fetchGPS();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, phone: onlyDigits });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const phone = formData.phone.trim();
    if (!PHONE_REGEX.test(phone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    setLoading(true);

    try {
      // Convert lat/lng to numbers before submitting
      const payload = {
        ...formData,
        phone,
        lat: parseFloat(formData.lat) || 0,
        lng: parseFloat(formData.lng) || 0,
      };
      await registerHospital(payload);

      // On success, automatically login to fetch the token
      const loginData = await loginHospital({
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem("token", loginData.token); // Save token for authenticated requests

      // Redirect to onboarding instead of login
      navigate("/onboarding");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center">
        <div className="mb-8 text-center text-white">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(192,57,43,0.16)] text-2xl font-bold text-[#F8D0CB]">
              +
            </span>
            <span className="text-3xl font-bold">MedSutra</span>
          </Link>


          <h1 className="mt-5 text-3xl font-bold">Hospital Registration</h1>
          <p className="mt-2 max-w-2xl text-white/80">
            Complete your facility profile and continue into onboarding with the
            same current registration flow.
          </p>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-card w-full"
        >
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {REGISTER_STATS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-[#F7FAFC] p-4 text-center"
              >
                <strong className="block text-lg font-bold text-[#1F3A5F]">
                  {item.value}
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {hasToken ? (
              <div className="status-banner status-banner--info">
                You are already signed in. Open your dashboard instead of
                creating another session.
              </div>
            ) : null}

            {error ? (
              <div className="status-banner status-banner--error">{error}</div>
            ) : null}
          </div>

          {hasToken ? (
            <div className="mt-6 space-y-4">
              <Link to="/dashboard" className="btn-primary w-full py-3">
                Go to Dashboard
              </Link>
              <p className="text-center text-sm text-slate-500">
                Need a different account? Log out from the dashboard first.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <section>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="auth-card__eyebrow">Basic Information</p>
                      <h2 className="mt-1 text-xl font-bold text-[#1D2D41]">
                        Facility details
                      </h2>
                    </div>
                    <span className="rounded-full bg-[rgba(42,157,143,0.12)] px-3 py-1 text-xs font-semibold text-[#2A9D8F]">
                      GPS: {gpsStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label-ui">Hospital Name</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="City Hospital"
                        className="input-ui"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-ui">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="hospital@email.com"
                        className="input-ui"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-ui">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="9999999999"
                        className="input-ui"
                        value={formData.phone}
                        onChange={handleChange}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        title="Phone number must be exactly 10 digits"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-ui">Password</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••"
                        className="input-ui"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-ui">Full Address</label>
                      <textarea
                        name="address"
                        placeholder="Hospital Address..."
                        className="textarea-ui"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl bg-[#F7FAFC] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="auth-card__eyebrow">Location Coordinates</p>
                      <h2 className="mt-1 text-xl font-bold text-[#1D2D41]">
                        Geo-tag your facility
                      </h2>
                    </div>
                    {gpsStatus === "Permission Denied" ? (
                      <button
                        type="button"
                        className="btn-danger whitespace-nowrap"
                        onClick={fetchGPS}
                      >
                        Retry GPS
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label-ui">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        name="lat"
                        placeholder="19.076"
                        className="input-ui"
                        value={formData.lat}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="label-ui">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        name="lng"
                        placeholder="72.877"
                        className="input-ui"
                        value={formData.lng}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </section>

                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Register Hospital"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#1F3A5F] hover:underline"
                >
                  Login here
                </Link>
              </p>
            </>
          )}
        </Motion.div>

        <div className="mt-6 text-center text-sm text-white/75">
          <Link to="/" className="transition hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>

      <HospitalLoadingModal
        isOpen={loading}
        message="Registering your facility..."
      />
    </div>
  );
};

export default RegisterPage;
