import { useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  ArrowLeft,
  Droplets,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../../../shared/components/figma/ImageWithFallback";

export function BloodDonation() {
  const [activeTab, setActiveTab] = useState<"register" | "camps" | "banks">(
    "register",
  );
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    bloodGroup: "",
    location: "",
    lastDonation: "",
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowSuccessPopup(false);

    await new Promise((resolve) => setTimeout(resolve, 900));

    setLoading(false);
    setShowSuccessPopup(true);
    setFormData({
      name: "",
      phone: "",
      email: "",
      bloodGroup: "",
      location: "",
      lastDonation: "",
    });
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const upcomingCamps = [
    {
      id: 1,
      name: "Red Cross Blood Drive",
      location: "Connaught Place, New Delhi",
      date: "March 15, 2026",
      time: "9:00 AM - 5:00 PM",
    },
    {
      id: 2,
      name: "Apollo Hospital Camp",
      location: "Sarita Vihar, New Delhi",
      date: "March 18, 2026",
      time: "10:00 AM - 4:00 PM",
    },
    {
      id: 3,
      name: "Community Blood Donation",
      location: "Sector 18, Noida",
      date: "March 22, 2026",
      time: "8:00 AM - 2:00 PM",
    },
    {
      id: 4,
      name: "Rotary Club Blood Camp",
      location: "Karol Bagh, New Delhi",
      date: "March 25, 2026",
      time: "9:30 AM - 3:30 PM",
    },
    {
      id: 5,
      name: "AIIMS Blood Donation Camp",
      location: "Ansari Nagar, New Delhi",
      date: "March 28, 2026",
      time: "9:00 AM - 4:00 PM",
    },
    {
      id: 6,
      name: "Lions Club Blood Drive",
      location: "Lajpat Nagar, New Delhi",
      date: "April 2, 2026",
      time: "10:00 AM - 5:00 PM",
    },
    {
      id: 7,
      name: "City Hospital Blood Camp",
      location: "Dwarka Sector 12, New Delhi",
      date: "April 6, 2026",
      time: "8:30 AM - 3:00 PM",
    },
    {
      id: 8,
      name: "Youth Blood Donation Camp",
      location: "Rohini Sector 15, New Delhi",
      date: "April 10, 2026",
      time: "9:00 AM - 2:00 PM",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#2E7D32]/20 border-t-[#2E7D32] rounded-full animate-spin" />
            <h2
              className="text-xl mb-2"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Registering Donor
            </h2>
            <p className="text-foreground/70">Please wait...</p>
          </motion.div>
        </motion.div>
      )}

      {showSuccessPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2
              className="text-2xl mb-2"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Registration Successful!
            </h2>
            <p className="text-foreground/70 mb-6">
              You are now registered as a blood donor.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="px-6 py-3 bg-[#2E7D32] text-white rounded-lg hover:bg-[#27632A] transition"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#E53935]" />
            <span
              className="text-xl"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              MedSutra
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#C0392B] to-[#A33327] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Donate Blood, Save Lives
            </h1>
            <p className="text-xl text-white/90 mb-4">
              Join our blood donor network and help save lives in your
              community.
            </p>
            <p className="text-lg text-white/80 mb-6 italic">
              "Your One Donation Can Save Three Lives"
              <br />
              "Be Someone's Lifeline Today"
            </p>
            <div className="flex gap-4 text-lg">
              <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
                <div
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  12,453
                </div>
                <div className="text-sm text-white/80">Registered Donors</div>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
                <div
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  8,764
                </div>
                <div className="text-sm text-white/80">Lives Saved</div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1615461066159-fea0960485d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9vZCUyMGRvbmF0aW9uJTIwbWVkaWNhbCUyMGdpdmluZ3xlbnwxfHx8fDE3NzMzNDk1OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Blood donation"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-white p-2 rounded-lg shadow-sm border border-border w-fit">
            <button
              onClick={() => setActiveTab("register")}
              className={`px-6 py-3 rounded-lg transition ${
                activeTab === "register"
                  ? "bg-[#2E7D32] text-white"
                  : "text-foreground/70 hover:bg-[#F7FAFC]"
              }`}
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Register as Donor
            </button>
            <button
              onClick={() => setActiveTab("camps")}
              className={`px-6 py-3 rounded-lg transition ${
                activeTab === "camps"
                  ? "bg-[#2E7D32] text-white"
                  : "text-foreground/70 hover:bg-[#F7FAFC]"
              }`}
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Donation Camps
            </button>
          </div>

          {/* Register Tab */}
          {activeTab === "register" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* Form */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2
                  className="text-2xl mb-6"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  Become a Blood Donor
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">
                      <Droplets className="w-4 h-4 inline mr-2" />
                      Blood Group *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {bloodGroups.map((group) => (
                        <button
                          key={group}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, bloodGroup: group })
                          }
                          className={`py-3 rounded-lg border-2 transition ${
                            formData.bloodGroup === group
                              ? "border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32]"
                              : "border-border hover:border-[#2E7D32]/50"
                          }`}
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          {group}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="City or area"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Last Donation Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.lastDonation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lastDonation: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#2E7D32] text-white rounded-lg hover:bg-[#27632A] transition shadow-lg"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {loading ? "Registering..." : "Register as Donor"}
                  </button>
                </form>
              </div>

              {/* Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3
                    className="text-xl mb-4"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Why Donate Blood?
                  </h3>
                  <ul className="space-y-3 text-foreground/80">
                    <li className="flex gap-3">
                      <Droplets className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                      <span>One donation can save up to 3 lives</span>
                    </li>
                    <li className="flex gap-3">
                      <Droplets className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                      <span>Every 2 seconds someone needs blood</span>
                    </li>
                    <li className="flex gap-3">
                      <Droplets className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                      <span>Less than 10% of eligible people donate</span>
                    </li>
                    <li className="flex gap-3">
                      <Droplets className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                      <span>Blood cannot be manufactured artificially</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3
                    className="text-xl mb-4"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Eligibility Criteria
                  </h3>
                  <ul className="space-y-2 text-foreground/80">
                    <li>• Age between 18-65 years</li>
                    <li>• Weight at least 50 kg</li>
                    <li>• Hemoglobin level above 12.5 g/dL</li>
                    <li>• No fever, cold, or infection</li>
                    <li>• At least 3 months since last donation</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#2E7D32]/10 to-[#1B5E20]/10 border-2 border-[#2E7D32]/20 rounded-2xl p-6">
                  <h3
                    className="text-xl mb-2"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    Get Urgent Alerts
                  </h3>
                  <p className="text-foreground/80">
                    Receive SMS and WhatsApp notifications when someone nearby
                    urgently needs your blood type.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Camps Tab */}
          {activeTab === "camps" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2
                className="text-2xl mb-6"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Upcoming Blood Donation Camps
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingCamps.map((camp) => (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
                  >
                    <div className="w-12 h-12 bg-[#E53935]/10 rounded-lg flex items-center justify-center mb-4">
                      <Droplets className="w-6 h-6 text-[#E53935]" />
                    </div>
                    <h3
                      className="text-xl mb-3"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {camp.name}
                    </h3>
                    <div className="space-y-2 text-foreground/70 mb-4">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-1" />
                        <span>{camp.location}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{camp.date}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{camp.time}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
