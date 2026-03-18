import React from "react";
import { motion as Motion } from "framer-motion";

const HospitalLoadingModal = ({ isOpen, message = "Processing..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#081223]/55 backdrop-blur-md">
      <Motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="surface-card mx-4 flex w-full max-w-sm flex-col items-center rounded-4xl p-8"
      >
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <Motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#1F3A5F] text-4xl font-bold text-white shadow-lg"
          >
            +
          </Motion.div>
          <Motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-b-[#2A9D8F]/25 border-l-transparent border-r-transparent border-t-[#1F3A5F]"
          />
          <Motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-2 rounded-full border-4 border-b-transparent border-l-[#C0392B]/25 border-r-[#C0392B] border-t-transparent"
          />
        </div>
        <h3 className="mb-2 text-xl font-bold">{message}</h3>
        <p className="text-center text-sm text-slate-500">
          Securely connecting to MedSutra network...
        </p>
      </Motion.div>
    </div>
  );
};

export default HospitalLoadingModal;
