import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { loginHospital } from "./auth.api";
import HospitalLoadingModal from "../../../components/HospitalLoadingModal";

const LOGIN_STATS = [
  { value: "240+", label: "Connected hospitals" },
  { value: "12K+", label: "Emergencies coordinated" },
  { value: "99.9%", label: "Network uptime" },
  { value: "< 4 min", label: "Average response time" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const hasToken = Boolean(localStorage.getItem("token"));
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginHospital(formData);
      localStorage.setItem("token", data.token); // simple auth storage
      navigate("/dashboard"); // placeholder for next target
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center">
        <div className="mb-8 text-center text-white">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(192,57,43,0.16)] text-2xl font-bold text-[#F8D0CB]">
              +
            </span>
            <span className="text-3xl font-bold">MedSutra</span>
          </Link>

          <div className="mt-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
          </div>

          <h1 className="mt-5 text-3xl font-bold">Hospital Login</h1>
          <p className="mt-2 text-white/80">
            Sign in to access your hospital dashboard
          </p>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-card w-full"
        >
          <div className="space-y-4">
            {hasToken ? (
              <div className="status-banner status-banner--info">
                You are already signed in. Open your dashboard directly.
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
                Need another account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#1F3A5F] hover:underline"
                >
                  Register Hospital
                </Link>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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

                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                Secure Access
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#1F3A5F] hover:underline"
                >
                  Register Hospital
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
        message="Authenticating Hospital"
      />
    </div>
  );
};

export default LoginPage;
