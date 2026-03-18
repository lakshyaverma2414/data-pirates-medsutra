import { useState } from "react";
import { Link } from "react-router";
import {
  Bell,
  Heart,
  Search,
  MapPin,
  Phone,
  Clock,
  X,
  Star,
  Bed,
  Stethoscope,
  Wind,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  Brain,
  Bone,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MobileMenu } from "../../../shared/components/mobile-menu";
import { BackButton } from "../../../shared/components/back-button";

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "alert";
  title: string;
  message: string;
  time: string;
  link?: string;
  read?: boolean;
}

interface NotificationsPanelProps {
  userType: "user" | "hospital" | "control";
}

function NotificationsPanel({ userType }: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (userType === "hospital") {
      return [
        {
          id: "1",
          type: "warning",
          title: "New Resource Request",
          message: "Max Hospital requesting 2 ICU beds and 1 ventilator",
          time: "5 mins ago",
          link: "/dashboard/hospital",
          read: false,
        },
        {
          id: "2",
          type: "info",
          title: "Patient Transfer Update",
          message: "Ambulance DL-01-AB-1234 arrived at destination",
          time: "15 mins ago",
          link: "/dashboard/hospital",
          read: false,
        },
        {
          id: "3",
          type: "success",
          title: "Blood Request Accepted",
          message: "Fortis Hospital accepted your blood request",
          time: "1 hour ago",
          read: true,
        },
      ];
    }
    if (userType === "user") {
      return [
        {
          id: "1",
          type: "success",
          title: "SOS Confirmed",
          message: "Emergency ambulance dispatched. ETA: 8 minutes",
          time: "2 mins ago",
          link: "/dashboard/user",
          read: false,
        },
        {
          id: "2",
          type: "info",
          title: "Appointment Reminder",
          message: "Dr. Sharma consultation tomorrow at 10:00 AM",
          time: "3 hours ago",
          link: "/book-consultation",
          read: false,
        },
        {
          id: "3",
          type: "info",
          title: "Ambulance ETA Update",
          message: "Your ambulance will arrive in 5 minutes",
          time: "5 hours ago",
          read: true,
        },
      ];
    }
    return [
      {
        id: "1",
        type: "alert",
        title: "System Alert",
        message: "High emergency request volume in South Delhi",
        time: "10 mins ago",
        link: "/dashboard/control-room",
        read: false,
      },
      {
        id: "2",
        type: "warning",
        title: "Resource Shortage",
        message: "5 hospitals reporting ICU bed shortage",
        time: "30 mins ago",
        link: "/dashboard/control-room",
        read: false,
      },
      {
        id: "3",
        type: "info",
        title: "Daily Report",
        message: "System analytics report for March 14, 2026 ready",
        time: "2 hours ago",
        link: "/dashboard/control-room",
        read: true,
      },
    ];
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="w-5 h-5 text-[#C0392B]" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-[#FF9800]" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-[#2A9D8F]" />;
      default:
        return <Info className="w-5 h-5 text-[#1F3A5F]" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => ({ ...n, read: true })),
    );
  };

  const clearNotification = (id: string) => {
    setNotifications((prev: Notification[]) =>
      prev.filter((n: Notification) => n.id !== id),
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#F5F7FA] rounded-lg transition"
      >
        <Bell className="w-6 h-6 text-[#1F3A5F]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#C0392B] text-white text-xs rounded-full flex items-center justify-center"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3
                  className="text-xl"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[#F5F7FA] rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {unreadCount > 0 && (
                <div className="px-4 py-2 border-b border-border">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-[#1F3A5F] hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Bell className="w-16 h-16 text-foreground/20 mb-4" />
                    <p className="text-foreground/60">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification: Notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 hover:bg-[#F5F7FA] transition ${
                          !notification.read ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4
                                className="font-semibold text-sm"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                              >
                                {notification.title}
                              </h4>
                              <button
                                onClick={() =>
                                  clearNotification(notification.id)
                                }
                                className="p-1 hover:bg-white rounded transition flex-shrink-0"
                              >
                                <X className="w-4 h-4 text-foreground/40" />
                              </button>
                            </div>
                            <p className="text-sm text-foreground/70 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-foreground/50">
                                <Clock className="w-3 h-3" />
                                {notification.time}
                              </div>
                              {notification.link && (
                                <Link
                                  to={notification.link}
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    setIsOpen(false);
                                  }}
                                  className="flex items-center gap-1 text-xs text-[#1F3A5F] hover:underline"
                                >
                                  View
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function FindHospitals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  const quickActions = [
    {
      label: "Severe Chest Pain",
      icon: Heart,
      color: "red",
      specialty: "Cardiology",
    },
    {
      label: "Severe Bleeding",
      icon: AlertCircle,
      color: "red",
      specialty: "Trauma",
    },
    {
      label: "Breathing Difficulty",
      icon: Wind,
      color: "orange",
      specialty: "Pulmonology",
    },
    {
      label: "Unconsciousness",
      icon: Brain,
      color: "red",
      specialty: "Neurology",
    },
    {
      label: "Broken Limb",
      icon: Bone,
      color: "yellow",
      specialty: "Orthopedic",
    },
    {
      label: "Stroke Symptoms",
      icon: Activity,
      color: "red",
      specialty: "Neurology",
    },
  ];

  const hospitals = [
    {
      id: 1,
      name: "Apollo Hospital",
      specialty: ["Cardiology", "Multi-Specialty", "Trauma"],
      distance: "2.3 km",
      rating: 4.8,
      beds: 12,
      ventilators: 8,
      phone: "+91 11 2692 5858",
      address: "Sarita Vihar, New Delhi",
      availability: "Available",
      icuBeds: 5,
    },
    {
      id: 2,
      name: "Max Super Specialty Hospital",
      specialty: ["Cardiology", "Neurology", "Orthopedic"],
      distance: "3.5 km",
      rating: 4.7,
      beds: 8,
      ventilators: 5,
      phone: "+91 11 2651 5050",
      address: "Saket, New Delhi",
      availability: "Available",
      icuBeds: 3,
    },
    {
      id: 3,
      name: "AIIMS",
      specialty: ["Multi-Specialty", "Trauma", "Neurology", "Cardiology"],
      distance: "5.1 km",
      rating: 4.9,
      beds: 25,
      ventilators: 15,
      phone: "+91 11 2659 3333",
      address: "Ansari Nagar, New Delhi",
      availability: "Limited",
      icuBeds: 10,
    },
    {
      id: 4,
      name: "Fortis Hospital",
      specialty: ["Orthopedic", "Cardiology", "Trauma"],
      distance: "4.2 km",
      rating: 4.6,
      beds: 10,
      ventilators: 6,
      phone: "+91 11 4277 6222",
      address: "Vasant Kunj, New Delhi",
      availability: "Available",
      icuBeds: 4,
    },
    {
      id: 5,
      name: "Safdarjung Hospital",
      specialty: ["Multi-Specialty", "Pulmonology", "Trauma"],
      distance: "6.8 km",
      rating: 4.5,
      beds: 18,
      ventilators: 10,
      phone: "+91 11 2673 0000",
      address: "Safdarjung, New Delhi",
      availability: "Available",
      icuBeds: 8,
    },
  ];

  const getColorClass = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-100 text-red-700 border-red-200 hover:bg-red-200";
      case "orange":
        return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200";
      case "yellow":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
    }
  };

  const filteredHospitals = hospitals
    .filter((hospital) => {
      const matchesSearch =
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.specialty.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      if (selectedSymptom) {
        const symptom = quickActions.find((a) => a.label === selectedSymptom);
        if (symptom) {
          return (
            hospital.specialty.includes(symptom.specialty) && matchesSearch
          );
        }
      }

      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by availability first, then by distance
      if (a.availability === "Available" && b.availability !== "Available")
        return -1;
      if (a.availability !== "Available" && b.availability === "Available")
        return 1;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MobileMenu userType="user" />
            <BackButton />
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#C0392B]" />
              <span
                className="text-lg"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Find Hospitals
              </span>
            </div>
          </div>
          <NotificationsPanel userType="user" />
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Emergency Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#C0392B] to-[#A03025] rounded-2xl p-6 text-white"
          >
            <h2
              className="text-xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Quick Symptom Search
            </h2>
            <p className="text-white/90 mb-4 text-sm">
              Select your emergency symptoms to find the nearest specialized
              hospitals
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    setSelectedSymptom(
                      action.label === selectedSymptom ? null : action.label,
                    );
                    setSearchQuery(action.specialty);
                  }}
                  className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                    selectedSymptom === action.label
                      ? "bg-white text-[#C0392B] border-white"
                      : `${getColorClass(action.color)} border-transparent`
                  }`}
                >
                  <action.icon className="w-6 h-6" />
                  <span
                    className="text-xs text-center"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <label className="block mb-2 text-sm font-semibold">
              Search by hospital name or specialty
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Cardiology, Trauma, Hospital name..."
                className="w-full pl-12 pr-4 py-4 border-2 border-border rounded-xl focus:border-[#1F3A5F] focus:outline-none transition text-lg"
              />
            </div>
            {selectedSymptom && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-foreground/60">
                  Filtering by:
                </span>
                <span className="px-3 py-1 bg-[#C0392B]/10 text-[#C0392B] rounded-lg text-sm font-semibold">
                  {selectedSymptom}
                </span>
                <button
                  onClick={() => {
                    setSelectedSymptom(null);
                    setSearchQuery("");
                  }}
                  className="text-sm text-[#C0392B] hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </motion.div>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h3
              className="text-lg"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              {filteredHospitals.length} Hospitals Found
            </h3>
            <span className="text-sm text-foreground/60">
              Sorted by availability & distance
            </span>
          </div>

          {/* Hospital Cards */}
          <div className="grid gap-4">
            {filteredHospitals.map((hospital, index) => (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3
                        className="text-xl mb-2"
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        {hospital.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {hospital.specialty.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl ${
                        hospital.availability === "Available"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <span className="text-sm font-semibold">
                        {hospital.availability}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Distance</p>
                        <p className="font-semibold">{hospital.distance}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Bed className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">ICU Beds</p>
                        <p className="font-semibold">
                          {hospital.icuBeds} available
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Wind className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">
                          Ventilators
                        </p>
                        <p className="font-semibold">
                          {hospital.ventilators} units
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Rating</p>
                        <p className="font-semibold">{hospital.rating} ★</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <MapPin className="w-4 h-4 text-foreground/40" />
                    <span className="text-sm text-foreground/70">
                      {hospital.address}
                    </span>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <a
                      href={`tel:${hospital.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-[#1F3A5F] text-[#1F3A5F] rounded-xl hover:bg-[#1F3A5F] hover:text-white transition"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                    <Link
                      to="/book-consultation"
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#1F3A5F] to-[#2A4A6F] text-white rounded-xl hover:shadow-lg transition"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      <Stethoscope className="w-4 h-4" />
                      Book Appointment
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredHospitals.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-foreground/20" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                No hospitals found
              </h3>
              <p className="text-foreground/60">
                Try adjusting your search or select a different symptom
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
