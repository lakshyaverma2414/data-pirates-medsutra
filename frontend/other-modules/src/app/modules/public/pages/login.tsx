import { Link, useNavigate } from "react-router";
import { Heart, ArrowLeft, Building2, Shield } from "lucide-react";
import { motion } from "motion/react";

export function Login() {
  const navigate = useNavigate();

  const handleUserTypeSelection = (type: "hospital" | "control") => {
    if (type === "hospital") {
      navigate("/login/hospital");
    } else {
      navigate("/login/control");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F3A5F] via-[#2A4A6F] to-[#1F3A5F]">
      {/* Main Content */}
      <main className="py-12 px-6 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Heart className="w-12 h-12 text-[#C0392B]" fill="#C0392B" />
              <span
                className="text-4xl text-white"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                MedSutra
              </span>
            </Link>
            <h1
              className="text-3xl text-white mb-3"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Welcome Back
            </h1>
            <p className="text-white/80 text-lg">
              Select your login type to continue
            </p>
          </div>

          {/* Login Type Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hospital Login */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-2xl shadow-2xl p-8 cursor-pointer hover:shadow-3xl transition"
              onClick={() => handleUserTypeSelection("hospital")}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1F3A5F] to-[#2A4A6F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h2
                  className="text-2xl mb-3"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  Hospital Login
                </h2>
                <p className="text-foreground/70 mb-6">
                  Login with email and password
                </p>
                <div className="space-y-2 text-sm text-foreground/60 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#1F3A5F] rounded-full"></div>
                    <span>Hospital Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#1F3A5F] rounded-full"></div>
                    <span>Password</span>
                  </div>
                </div>
                <button
                  className="w-full mt-6 py-3 bg-gradient-to-r from-[#1F3A5F] to-[#2A4A6F] text-white rounded-xl hover:shadow-lg transition"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  Login as Hospital
                </button>
              </div>
            </motion.div>

            {/* Control Room Login */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-2xl shadow-2xl p-8 cursor-pointer hover:shadow-3xl transition"
              onClick={() => handleUserTypeSelection("control")}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#C0392B] to-[#A03025] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h2
                  className="text-2xl mb-3"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  Control Dashboard
                </h2>
                <p className="text-foreground/70 mb-6">
                  Admin access for control room operators
                </p>
                <div className="space-y-2 text-sm text-foreground/60 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#C0392B] rounded-full"></div>
                    <span>Admin Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#C0392B] rounded-full"></div>
                    <span>Secure Password</span>
                  </div>
                </div>
                <button
                  className="w-full mt-6 py-3 bg-gradient-to-r from-[#C0392B] to-[#A03025] text-white rounded-xl hover:shadow-lg transition"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  Login to Control
                </button>
              </div>
            </motion.div>
          </div>

          {/* Don't Have Account */}
          <div className="text-center mt-8">
            <p className="text-white/80">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#2A9D8F] hover:underline font-semibold"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
