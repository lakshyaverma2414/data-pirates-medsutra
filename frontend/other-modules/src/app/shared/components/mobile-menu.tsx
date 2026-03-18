import { useState } from "react";
import { X, Menu, LayoutDashboard, Stethoscope, Calendar, Droplets, Hospital, Ambulance, Heart, MessageCircle, FileText, LogOut, Settings, Phone, Bed, Wind, Activity, Users, Package, ArrowLeftRight, TrendingUp, AlertCircle } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";

interface MobileMenuProps {
  userType?: "user" | "hospital" | "control-room";
}

export function MobileMenu({ userType = "user" }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // User Dashboard Menu Items
  const userMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/user" },
    { icon: Stethoscope, label: "Find Hospital", path: "/find-hospitals" },
    { icon: Calendar, label: "Book Consultation", path: "/book-consultation" },
    { icon: Ambulance, label: "Ambulance Services", path: "/emergency" },
    { icon: Heart, label: "Donate Blood", path: "/donate-blood" },
    { icon: MessageCircle, label: "Medical Help Chat", path: "/medical-chat" },
    { icon: FileText, label: "Health Records", path: "/health-records" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Hospital Dashboard Menu Items
  const hospitalMenuItems = [
    { icon: LayoutDashboard, label: "Hospital Overview", path: "/dashboard/hospital" },
    { icon: Bed, label: "Resource Availability", path: "/hospital/resources" },
    { icon: Package, label: "Request Resources", path: "/hospital/request-resources" },
    { icon: TrendingUp, label: "Provide Resources", path: "/hospital/provide-resources" },
    { icon: ArrowLeftRight, label: "Patient Transfer Coordination", path: "/hospital/transfers" },
    { icon: Ambulance, label: "Ambulance Coordination", path: "/hospital/ambulances" },
    { icon: Droplets, label: "Blood Bank Inventory", path: "/hospital/blood-bank" },
    { icon: AlertCircle, label: "Emergency Requests", path: "/hospital/emergency-requests" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Control Room Dashboard Menu Items
  const controlMenuItems = [
    { icon: LayoutDashboard, label: "Control Dashboard", path: "/dashboard/control-room" },
    { icon: Activity, label: "Live Emergencies", path: "/control/live-emergencies" },
    { icon: Ambulance, label: "Ambulance Fleet", path: "/control/ambulances" },
    { icon: Hospital, label: "Hospital Network", path: "/control/hospitals" },
    { icon: Users, label: "Active Users", path: "/control/users" },
    { icon: Droplets, label: "Blood Bank Network", path: "/control/blood-network" },
    { icon: TrendingUp, label: "Analytics & Reports", path: "/control/analytics" },
    { icon: AlertCircle, label: "Emergency Alerts", path: "/control/alerts" },
    { icon: Settings, label: "System Settings", path: "/settings" },
  ];

  // Select menu items based on user type
  const menuItems = 
    userType === "hospital" ? hospitalMenuItems :
    userType === "control-room" ? controlMenuItems :
    userMenuItems;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-[#F5F7FA] rounded-lg transition"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />
        )}
      </AnimatePresence>

      {/* Sliding Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#1F3A5F] to-[#2A4A6F] text-white">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-[#C0392B]" fill="#C0392B" />
                <div>
                  <h2 className="text-xl" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
                    MedSutra
                  </h2>
                  <p className="text-xs text-white/80">Healthcare Coordination</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 hover:bg-white/20 rounded-full flex items-center justify-center transition"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 transition-all ${
                      isActive
                        ? "bg-[#1F3A5F]/10 text-[#1F3A5F] border-l-4 border-[#1F3A5F]"
                        : "text-foreground/70 hover:bg-[#F5F7FA] hover:text-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? "bg-[#1F3A5F]/20" : "bg-[#F5F7FA]"
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: isActive ? 600 : 400 }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Sign Out Button */}
            <div className="p-4">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 px-6 py-4 bg-[#C0392B]/10 text-[#C0392B] rounded-xl hover:bg-[#C0392B]/20 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C0392B]/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                  Sign Out
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}