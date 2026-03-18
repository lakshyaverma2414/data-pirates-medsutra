import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Shield } from "lucide-react";

const ControlLoginPage = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");

  useEffect(() => {
    if (localStorage.getItem("token") === "control-admin-session") {
      navigate("/dashboard/control-room", { replace: true });
    }
  }, []);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (adminId === "admin@medsutra.com" && password === "admin123") {
      localStorage.setItem("token", "control-admin-session");
      setError("");
      navigate("/dashboard/control-room-api");
      return;
    }

    setError("Invalid credentials.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F3A5F] via-[#2A4A6F] to-[#1F3A5F] px-6 py-12">
      <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <Heart className="h-8 w-8 text-[#C0392B]" fill="#C0392B" />
              <span
                className="text-2xl text-slate-900"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                MedSutra
              </span>
            </Link>
            <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#A03025]">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1
              className="mt-4 text-2xl text-slate-900"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Control Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Admin access for control room operators
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Admin Email
              </label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter admin id"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#C0392B]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Secure Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#C0392B]"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#C0392B] to-[#A03025] py-3 text-white transition hover:shadow-lg"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Login to Control
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login options
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ControlLoginPage;
