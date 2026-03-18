import { useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  Bell,
  Shield,
  User,
  Moon,
  Globe,
  HelpCircle,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { MobileMenu } from "../../../shared/components/mobile-menu";
import { BackButton } from "../../../shared/components/back-button";

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1
              className="text-3xl mb-2"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Settings
            </h1>
            <p className="text-foreground/70">
              Manage your preferences and account settings
            </p>
          </div>

          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <h2
              className="text-xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Account
            </h2>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F5F7FA] rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-[#1F3A5F]" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Profile Information</div>
                    <div className="text-sm text-foreground/60">
                      Update your personal details
                    </div>
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F5F7FA] rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C0392B]/10 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#C0392B]" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-foreground/60">
                      Update your security credentials
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <h2
              className="text-xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Privacy & Security
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2A9D8F]/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <div>
                    <div className="font-medium">Location Sharing</div>
                    <div className="text-sm text-foreground/60">
                      Allow emergency location access
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationSharing}
                    onChange={(e) => setLocationSharing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A9D8F]"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <h2
              className="text-xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF9800]/10 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#FF9800]" />
                  </div>
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-foreground/60">
                      Emergency alerts and updates
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A9D8F]"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <h2
              className="text-xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-lg flex items-center justify-center">
                    <Moon className="w-5 h-5 text-[#1F3A5F]" />
                  </div>
                  <div>
                    <div className="font-medium">Dark Mode</div>
                    <div className="text-sm text-foreground/60">
                      Switch to dark theme
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A9D8F]"></div>
                </label>
              </div>

              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F5F7FA] rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2A9D8F]/10 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Language</div>
                    <div className="text-sm text-foreground/60">
                      English (US)
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2
              className="text-xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Support
            </h2>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F5F7FA] rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF9800]/10 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-[#FF9800]" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Help & Support</div>
                    <div className="text-sm text-foreground/60">
                      Get assistance and FAQs
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
