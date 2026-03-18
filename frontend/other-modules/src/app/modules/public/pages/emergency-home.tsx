import { useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  Phone,
  ArrowLeft,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function EmergencyHome() {
  const [operatorModal, setOperatorModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-border px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
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
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="w-16 h-16 bg-[#C0392B]/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <AlertCircle className="w-8 h-8 text-[#C0392B]" />
              </motion.div>
              <h1
                className="text-3xl text-[#1F3A5F] mb-2"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                }}
              >
                Emergency Request
              </h1>
              <p className="text-foreground/60">
                Choose how you would like to request emergency assistance
              </p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setOperatorModal(true)}
                className="w-full p-6 bg-white border-2 border-[#C0392B]/30 rounded-2xl hover:border-[#C0392B] hover:bg-[#C0392B]/5 transition-all shadow-sm text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#C0392B] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-lg text-[#1F3A5F] mb-1"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Call Emergency Operator
                    </h3>
                    <p className="text-foreground/60 text-sm">
                      Speak directly with trained emergency operators who will
                      coordinate your rescue
                    </p>
                    <span className="mt-2 inline-block text-sm text-[#C0392B] font-semibold">
                      Recommended for critical situations
                    </span>
                  </div>
                </div>
              </motion.button>

              <Link to="/emergency/form" className="block">
                <motion.div
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full p-6 bg-white border-2 border-[#1F3A5F]/20 rounded-2xl hover:border-[#1F3A5F] hover:bg-[#1F3A5F]/5 transition-all shadow-sm text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#1F3A5F] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3
                        className="text-lg text-[#1F3A5F] mb-1"
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        Quick Emergency Form
                      </h3>
                      <p className="text-foreground/60 text-sm">
                        Fill a quick form and route your request into live
                        ambulance tracking
                      </p>
                      <span className="mt-2 inline-block text-sm text-[#1F3A5F] font-semibold">
                        Fast for non-critical emergencies
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-900">
                <strong>Always call 112</strong> for life-threatening
                emergencies.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {operatorModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOperatorModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setOperatorModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:bg-gray-100 hover:text-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.05, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-[#C0392B]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Phone className="w-7 h-7 text-[#C0392B]" />
                </motion.div>
                <h2
                  className="text-xl text-[#1F3A5F] mb-2"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  Emergency Operator
                </h2>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  You are about to contact an emergency operator.
                  <br />
                  Please stay calm and confirm the call.
                </p>
              </div>

              <div className="bg-[#F5F7FA] rounded-xl p-4 mb-6 text-center">
                <p className="text-xs text-foreground/50 mb-1">
                  Emergency Helpline
                </p>
                <p
                  className="text-2xl text-[#1F3A5F] tracking-wider"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  1800-MED-SUTRA
                </p>
                <p className="text-xs text-foreground/40 mt-1">
                  Available 24 x 7
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setOperatorModal(false)}
                  className="flex-1 py-3 border-2 border-border rounded-xl text-foreground/70 hover:bg-gray-50 transition font-semibold text-sm"
                >
                  Cancel
                </button>
                <motion.a
                  href="tel:18006337872"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 bg-[#C0392B] text-white rounded-xl hover:bg-[#A93226] transition shadow-md font-semibold text-sm text-center"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Call Operator
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
