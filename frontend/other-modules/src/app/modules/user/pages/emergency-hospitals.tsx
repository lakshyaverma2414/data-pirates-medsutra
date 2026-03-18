import { Link } from "react-router";
import { Heart, MapPin, Phone, Bed, Ambulance, Clock } from "lucide-react";
import { motion } from "motion/react";
import { MobileMenu } from "../../../shared/components/mobile-menu";
import { BackButton } from "../../../shared/components/back-button";

export function EmergencyHospitals() {
  const emergencyHospitals = [
    {
      id: 1,
      name: "Apollo Hospital",
      distance: "2.3 km",
      eta: "8 mins",
      phone: "+91 11 2692 5858",
      address: "Sarita Vihar, New Delhi",
      icuBeds: 12,
      ventilators: 5,
      ambulances: 8,
      status: "Available",
    },
    {
      id: 2,
      name: "Max Super Specialty Hospital",
      distance: "3.5 km",
      eta: "12 mins",
      phone: "+91 11 2651 5050",
      address: "Saket, New Delhi",
      icuBeds: 8,
      ventilators: 3,
      ambulances: 5,
      status: "Available",
    },
    {
      id: 3,
      name: "AIIMS",
      distance: "5.1 km",
      eta: "15 mins",
      phone: "+91 11 2659 3333",
      address: "Ansari Nagar, New Delhi",
      icuBeds: 3,
      ventilators: 1,
      ambulances: 12,
      status: "Limited",
    },
    {
      id: 4,
      name: "Fortis Hospital",
      distance: "4.2 km",
      eta: "14 mins",
      phone: "+91 11 4277 6222",
      address: "Vasant Kunj, New Delhi",
      icuBeds: 15,
      ventilators: 7,
      ambulances: 6,
      status: "Available",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <MobileMenu userType="user" />
          <BackButton />
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#C0392B]" />
            <span
              className="text-lg"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              MedSutra
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1
              className="text-3xl mb-2"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Emergency Hospitals
            </h1>
            <p className="text-foreground/70">
              Nearest hospitals with emergency facilities
            </p>
          </div>

          {/* Alert Banner */}
          <div className="bg-gradient-to-r from-[#C0392B] to-[#A33327] text-white rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Ambulance className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2
                  className="text-xl mb-1"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  In an Emergency?
                </h2>
                <p className="text-white/90 text-sm">
                  Call 102 or use Emergency SOS for immediate help
                </p>
              </div>
              <button
                className="px-6 py-3 bg-white text-[#C0392B] rounded-xl hover:bg-white/90 transition"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Emergency SOS
              </button>
            </div>
          </div>

          {/* Hospitals List */}
          <div className="space-y-4">
            {emergencyHospitals.map((hospital, index) => (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3
                      className="text-xl mb-1"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {hospital.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-foreground/70">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {hospital.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        ETA: {hospital.eta}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      hospital.status === "Available"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {hospital.status}
                  </span>
                </div>

                <p className="text-sm text-foreground/70 mb-4">
                  {hospital.address}
                </p>

                {/* Resources */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-[#F5F7FA] rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Bed className="w-4 h-4 text-[#1F3A5F]" />
                    </div>
                    <div
                      className="text-lg"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {hospital.icuBeds}
                    </div>
                    <div className="text-xs text-foreground/60">ICU Beds</div>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Heart className="w-4 h-4 text-[#C0392B]" />
                    </div>
                    <div
                      className="text-lg"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {hospital.ventilators}
                    </div>
                    <div className="text-xs text-foreground/60">
                      Ventilators
                    </div>
                  </div>
                  <div className="p-3 bg-[#F5F7FA] rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Ambulance className="w-4 h-4 text-[#2A9D8F]" />
                    </div>
                    <div
                      className="text-lg"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {hospital.ambulances}
                    </div>
                    <div className="text-xs text-foreground/60">Ambulances</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <a
                    href={`tel:${hospital.phone}`}
                    className="flex-1 py-3 bg-[#C0392B] text-white rounded-xl hover:bg-[#A33327] transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                  <button className="flex-1 py-3 border-2 border-[#1F3A5F] text-[#1F3A5F] rounded-xl hover:bg-[#1F3A5F]/10 transition">
                    Get Directions
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
