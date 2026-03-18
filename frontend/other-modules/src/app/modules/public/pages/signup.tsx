import { Link, useNavigate } from "react-router";
import { Heart, ArrowLeft, Building2 } from "lucide-react";
import { motion } from "motion/react";

export function SignUp() {
  const navigate = useNavigate();

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
              Create Your Account
            </h1>
            <p className="text-white/80 text-lg">
              Choose your account type to get started
            </p>
          </div>

          {/* Account Type Selection Cards */}
          <div className="grid md:grid-cols-1 gap-6 max-w-2xl mx-auto">
            {/* Hospital Sign Up */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="bg-white rounded-2xl shadow-2xl p-8 cursor-pointer hover:shadow-3xl transition"
              onClick={() => navigate("/signup/hospital")}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1F3A5F] to-[#2A4A6F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h2
                  className="text-2xl mb-3"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  Hospital Sign Up
                </h2>
                <p className="text-foreground/70 mb-6">
                  Register your hospital to join the healthcare coordination
                  network
                </p>
                <div className="space-y-2 text-sm text-foreground/60 text-left bg-[#F5F7FA] rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#1F3A5F] rounded-full"></div>
                    <span>Resource Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#1F3A5F] rounded-full"></div>
                    <span>Emergency Request Handling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#1F3A5F] rounded-full"></div>
                    <span>Ambulance Coordination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#1F3A5F] rounded-full"></div>
                    <span>Blood Inventory Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#1F3A5F] rounded-full"></div>
                    <span>Patient Transfer System</span>
                  </div>
                </div>
                <button
                  className="w-full mt-6 py-3 bg-gradient-to-r from-[#1F3A5F] to-[#2A4A6F] text-white rounded-xl hover:shadow-lg transition"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  Register Hospital
                </button>
              </div>
            </motion.div>
          </div>

          {/* Already Have Account */}
          <div className="text-center mt-8">
            <p className="text-white/80">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#2A9D8F] hover:underline font-semibold"
              >
                Login here
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
