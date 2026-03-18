import { Ambulance } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";

export function FloatingEmergencyButton() {
  return (
    <Link to="/emergency">
      <motion.div
        className="fixed bottom-6 left-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-[#C0392B] rounded-full animate-ping opacity-75"></div>
          <button className="relative w-16 h-16 bg-[#C0392B] text-white rounded-full shadow-2xl hover:bg-[#A33327] transition flex items-center justify-center">
            <Ambulance className="w-7 h-7" />
          </button>
        </div>
      </motion.div>
    </Link>
  );
}
