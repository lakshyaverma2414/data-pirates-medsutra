import { useState } from "react";
import {
  AlertTriangle,
  X,
  MapPin,
  Phone,
  Ambulance,
  Hospital,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

export function FloatingSOSButton() {
  const [showModal, setShowModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const navigate = useNavigate();

  const handleActivateSOS = () => {
    setIsActivating(true);

    setTimeout(() => {
      setIsActivating(false);
      setShowModal(false);

      navigate("/emergency");

      alert(
        "Emergency SOS Activated!\n\n✓ Location shared\n✓ Emergency contacts notified\n✓ Ambulance dispatched\n✓ Nearest hospital alerted",
      );
    }, 2000);
  };

  return (
    <>
      {/* Floating SOS Button */}
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-6 z-40 w-16 h-16 bg-[#C0392B] text-white rounded-full shadow-2xl flex items-center justify-center"
        style={{
          boxShadow: "0 0 0 0 rgba(195, 57, 43, 0.7)",
          animation: "pulse 2s infinite",
        }}
      >
        <AlertTriangle className="w-8 h-8" />
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isActivating && setShowModal(false)}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#C0392B] to-[#A33327] text-white p-6 relative">
                  <button
                    onClick={() => !isActivating && setShowModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition"
                    disabled={isActivating}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h2
                      className="text-2xl"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      Activate Emergency SOS?
                    </h2>
                  </div>
                  <p className="text-white/90 text-sm">
                    This will share your location and request an ambulance
                  </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-foreground/80 mb-4">
                    The following will happen automatically:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                      <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#1F3A5F]" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Share GPS Location</h4>
                        <p className="text-sm text-foreground/70">
                          Your real-time location shared with emergency services
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                      <div className="w-10 h-10 bg-[#C0392B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-[#C0392B]" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">
                          Alert Emergency Contacts
                        </h4>
                        <p className="text-sm text-foreground/70">
                          Saved contacts will be notified immediately
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                      <div className="w-10 h-10 bg-[#2A9D8F]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Hospital className="w-5 h-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">
                          Suggest Nearest Hospital
                        </h4>
                        <p className="text-sm text-foreground/70">
                          Closest hospital with availability identified
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                      <div className="w-10 h-10 bg-[#FF9800]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Ambulance className="w-5 h-5 text-[#FF9800]" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Request Ambulance</h4>
                        <p className="text-sm text-foreground/70">
                          Nearest ambulance dispatched to your location
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleActivateSOS}
                    disabled={isActivating}
                    className="w-full mt-6 py-4 bg-[#C0392B] text-white rounded-xl hover:bg-[#A33327] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {isActivating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        Confirm
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isActivating}
                    className="w-full py-3 text-foreground/70 hover:text-foreground transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(195, 57, 43, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(195, 57, 43, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(195, 57, 43, 0);
          }
        }
      `}</style>
    </>
  );
}
