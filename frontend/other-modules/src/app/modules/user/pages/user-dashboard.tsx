import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  LogOut,
  User,
  Droplets,
  Activity,
  Calendar,
  Phone,
  MapPin,
  Ambulance,
  Bell,
} from "lucide-react";
import { motion } from "motion/react";
import { MobileMenu } from "../../../shared/components/mobile-menu";
import { EmergencySOS } from "../../../shared/components/emergency-sos";

export function UserDashboard() {
  const [userProfile, setUserProfile] = useState({
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    bloodGroup: "O+",
    location: "New Delhi",
    lastDonation: "December 15, 2025",
  });

  useEffect(() => {
    const storedPatientData = localStorage.getItem("patientData");
    const storedUserData = localStorage.getItem("userData");
    const parsedData = storedPatientData || storedUserData;

    if (!parsedData) return;

    try {
      const data = JSON.parse(parsedData);
      setUserProfile((prev) => ({
        ...prev,
        name: data.fullName || prev.name,
        phone: data.phoneNumber || data.mobileNumber || prev.phone,
        bloodGroup: data.bloodGroup || prev.bloodGroup,
        location: data.city || prev.location,
      }));
    } catch {
      // Keep default UI values if localStorage data is invalid.
    }
  }, []);

  const emergencyHistory = [
    {
      id: "EMR123ABC",
      date: "March 10, 2026",
      type: "Heart Attack",
      status: "Completed",
      hospital: "Apollo Hospital",
    },
    {
      id: "EMR456DEF",
      date: "January 22, 2026",
      type: "Road Accident",
      status: "Completed",
      hospital: "Max Hospital",
    },
  ];

  const donationHistory = [
    {
      date: "December 15, 2025",
      location: "Red Cross Blood Bank",
      status: "Completed",
    },
    {
      date: "September 08, 2025",
      location: "Apollo Hospital Camp",
      status: "Completed",
    },
    {
      date: "June 03, 2025",
      location: "Community Health Center",
      status: "Completed",
    },
  ];

  const upcomingAlerts = [
    {
      type: "Blood Request",
      message: "Urgent O+ needed at AIIMS Hospital",
      time: "2 hours ago",
    },
    {
      type: "Donation Camp",
      message: "Blood donation camp at Connaught Place on March 15",
      time: "1 day ago",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MobileMenu userType="user" />
            <Link to="/" className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#C0392B]" />
              <span
                className="text-xl"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                MedSutra
              </span>
            </Link>
            <span className="hidden md:inline text-foreground/50">|</span>
            <span className="hidden md:inline text-foreground/70">
              User Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-[#F5F7FA] rounded-lg transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#C0392B] rounded-full animate-pulse"></span>
            </button>
            <Link
              to="/"
              className="hidden md:flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-foreground transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1
              className="text-3xl mb-2"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Welcome back, {userProfile.name}!
            </h1>
            <p className="text-foreground/70">
              Manage your emergency requests and blood donation activities
            </p>
          </div>

          {/* Emergency SOS Button */}
          <div className="mb-8">
            <EmergencySOS />
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link
              to="/emergency"
              className="bg-gradient-to-br from-[#C0392B] to-[#A33327] text-white rounded-2xl p-6 hover:shadow-xl transition group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Ambulance className="w-6 h-6" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Request Emergency
              </h3>
              <p className="text-white/80 text-sm">
                Get immediate ambulance assistance
              </p>
            </Link>

            <Link
              to="/blood-donation"
              className="bg-gradient-to-br from-[#2A9D8F] to-[#248277] text-white rounded-2xl p-6 hover:shadow-xl transition group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Droplets className="w-6 h-6" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Donate Blood
              </h3>
              <p className="text-white/80 text-sm">
                Save lives through blood donation
              </p>
            </Link>

            <Link
              to="/health-records"
              className="bg-gradient-to-br from-[#1F3A5F] to-[#2A4A6F] text-white rounded-2xl p-6 hover:shadow-xl transition group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Activity className="w-6 h-6" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Health Records
              </h3>
              <p className="text-white/80 text-sm">View your medical history</p>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Alerts */}
              {upcomingAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h2
                    className="text-xl mb-4"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Recent Alerts
                  </h2>
                  <div className="space-y-3">
                    {upcomingAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className="p-4 bg-[#FFF3E0] border-l-4 border-[#FF9800] rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p
                              className="text-sm text-[#E65100]"
                              style={{
                                fontFamily: "Poppins, sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              {alert.type}
                            </p>
                            <p className="text-foreground/80">
                              {alert.message}
                            </p>
                          </div>
                          <span className="text-xs text-foreground/60 whitespace-nowrap ml-4">
                            {alert.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Emergency History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2
                  className="text-xl mb-4"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  Emergency Request History
                </h2>
                {emergencyHistory.length > 0 ? (
                  <div className="space-y-4">
                    {emergencyHistory.map((emergency) => (
                      <div
                        key={emergency.id}
                        className="p-4 border border-border rounded-lg hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-foreground/60 text-sm">
                              Request ID: {emergency.id}
                            </p>
                            <h3
                              className="text-lg"
                              style={{
                                fontFamily: "Poppins, sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              {emergency.type}
                            </h3>
                          </div>
                          <span className="px-3 py-1 bg-[#2E7D32]/10 text-[#2E7D32] text-sm rounded-full">
                            {emergency.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-foreground/70">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {emergency.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {emergency.hospital}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-center py-8">
                    No emergency requests yet
                  </p>
                )}
              </motion.div>

              {/* Donation History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2
                  className="text-xl mb-4"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  Blood Donation History
                </h2>
                {donationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {donationHistory.map((donation, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border rounded-lg flex items-center justify-between hover:bg-[#F7FAFC] transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#2E7D32]/10 rounded-lg flex items-center justify-center">
                            <Droplets className="w-5 h-5 text-[#2E7D32]" />
                          </div>
                          <div>
                            <p className="text-sm text-foreground/60">
                              {donation.date}
                            </p>
                            <p className="text-foreground/80">
                              {donation.location}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-[#2E7D32] text-sm"
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          {donation.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-center py-8">
                    No donation history yet
                  </p>
                )}
              </motion.div>
            </div>

            {/* Right Column - Profile */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#E53935] to-[#C62828] rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h3
                    className="text-xl mb-1"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {userProfile.name}
                  </h3>
                  <p className="text-foreground/60">User Profile</p>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <p className="text-sm text-foreground/60 mb-1">
                      Phone Number
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#1E88E5]" />
                      {userProfile.phone}
                    </p>
                  </div>

                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <p className="text-sm text-foreground/60 mb-1">
                      Blood Group
                    </p>
                    <p className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-[#E53935]" />
                      <span
                        className="text-2xl"
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        {userProfile.bloodGroup}
                      </span>
                    </p>
                  </div>

                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <p className="text-sm text-foreground/60 mb-1">Location</p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#2E7D32]" />
                      {userProfile.location}
                    </p>
                  </div>

                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <p className="text-sm text-foreground/60 mb-1">
                      Last Donation
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#1E88E5]" />
                      {userProfile.lastDonation}
                    </p>
                  </div>

                  <button className="w-full py-3 border-2 border-[#1E88E5] text-[#1E88E5] rounded-lg hover:bg-[#1E88E5]/5 transition">
                    Edit Profile
                  </button>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3
                  className="text-lg mb-4"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  Your Impact
                </h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-[#E53935]/5 rounded-lg">
                    <div
                      className="text-3xl mb-1"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                        color: "#E53935",
                      }}
                    >
                      {donationHistory.length}
                    </div>
                    <p className="text-sm text-foreground/70">Times Donated</p>
                  </div>
                  <div className="text-center p-4 bg-[#2E7D32]/5 rounded-lg">
                    <div
                      className="text-3xl mb-1"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                        color: "#2E7D32",
                      }}
                    >
                      ~{donationHistory.length * 3}
                    </div>
                    <p className="text-sm text-foreground/70">Lives Saved</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
