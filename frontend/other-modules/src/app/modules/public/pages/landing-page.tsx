import { Link } from "react-router";
import {
  Ambulance,
  Droplets,
  Heart,
  Hospital,
  MapPin,
  Phone,
  Activity,
  Menu,
} from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../../../shared/components/figma/ImageWithFallback";
import { Chatbot } from "../../../shared/components/chatbot";
import { FloatingEmergencyButton } from "../../../shared/components/floating-emergency-button";
import { FloatingSOSButton } from "../../../shared/components/floating-sos-button";
import { MobileMenu } from "../../../shared/components/mobile-menu";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <MobileMenu userType="user" />
            </div>
            <Link to="/" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-[#C0392B]" />
              <span
                className="text-2xl"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                MedSutra
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-foreground/80 hover:text-foreground transition"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-foreground/80 hover:text-foreground transition"
            >
              How It Works
            </a>
            <Link
              to="/login"
              className="px-4 py-2 text-[#1F3A5F] hover:text-[#2A4A6F] transition font-medium"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-[#1F3A5F] text-white rounded-lg hover:bg-[#2A4A6F] transition"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - WHO Style with Ambulance Background */}
      <section className="relative bg-gradient-to-br from-[#1F3A5F] to-[#2A4A6F] py-24 px-6 overflow-hidden">
        {/* Ambulance Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1765752926933-d6a68a4f29e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWJ1bGFuY2UlMjBlbWVyZ2VuY3klMjBtZWRpY2FsJTIwdmVoaWNsZXxlbnwxfHx8fDE3NzMyOTg4MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')",
          }}
        ></div>

        {/* Blue overlay for visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F3A5F]/90 to-[#2A4A6F]/90"></div>

        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center z-10">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-white"
          >
            <motion.h1
              className="text-5xl md:text-6xl mb-6"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                lineHeight: 1.1,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              MedSutra
            </motion.h1>
            <motion.p
              className="text-2xl mb-4 text-[#2A9D8F]"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              The Thread That Connects Healthcare
            </motion.p>
            <motion.p
              className="text-lg text-white/90 mb-8 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              A real-time healthcare coordination platform connecting hospitals,
              ambulances, and blood donors to ensure patients reach the right
              care faster.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                to="/emergency"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C0392B] text-white rounded-lg hover:bg-[#A33327] transition shadow-xl transform hover:scale-105"
              >
                <Ambulance className="w-5 h-5" />
                🚑 Request Emergency Help
              </Link>
              <Link
                to="/blood-donation"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2A9D8F] text-white rounded-lg hover:bg-[#248277] transition shadow-xl transform hover:scale-105"
              >
                <Droplets className="w-5 h-5" />
                🩸 Donate Blood
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Animation/Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative z-10"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1597188558265-f0fb7428a243?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwYW1idWxhbmNlJTIwZW1lcmdlbmN5JTIwdmVoaWNsZXxlbnwxfHx8fDE3NzMzNDk1OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Emergency healthcare"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </motion.div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#2A9D8F] rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#C0392B] rounded-full opacity-20 blur-2xl"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Core Features
            </h2>
            <p className="text-xl text-foreground/70">
              Comprehensive emergency healthcare coordination at your fingertips
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              className="bg-white border border-border rounded-2xl p-6 hover:shadow-xl transition cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#C0392B]/20 to-[#C0392B]/5 rounded-2xl flex items-center justify-center mb-4">
                <Hospital className="w-8 h-8 text-[#C0392B]" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Hospital Availability Network
              </h3>
              <p className="text-foreground/70">
                Real-time hospital availability with ICU beds, ventilators, and
                specialist care information
              </p>
              <div className="mt-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1769147555720-71fc71bfc216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGJ1aWxkaW5nJTIwbW9kZXJuJTIwaGVhbHRoY2FyZSUyMGZhY2lsaXR5fGVufDF8fHx8MTc3MzM0OTU5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Hospital network"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              className="bg-white border border-border rounded-2xl p-6 hover:shadow-xl transition cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#1F3A5F]/20 to-[#1F3A5F]/5 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-[#1F3A5F]" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Ambulance Tracking
              </h3>
              <p className="text-foreground/70">
                Track ambulance location in real-time with estimated arrival
                times and route optimization
              </p>
              <div className="mt-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1597188558265-f0fb7428a243?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwYW1idWxhbmNlJTIwZW1lcmdlbmN5JTIwdmVoaWNsZXxlbnwxfHx8fDE3NzMzNDk1OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Ambulance tracking"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              className="bg-white border border-border rounded-2xl p-6 hover:shadow-xl transition cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#2A9D8F]/20 to-[#2A9D8F]/5 rounded-2xl flex items-center justify-center mb-4">
                <Droplets className="w-8 h-8 text-[#2A9D8F]" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Blood Donor Network
              </h3>
              <p className="text-foreground/70">
                Connect with blood donors instantly during emergencies and
                organize donation camps
              </p>
              <div className="mt-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1615461066159-fea0960485d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9vZCUyMGRvbmF0aW9uJTIwbWVkaWNhbCUyMGdpdmluZ3xlbnwxfHx8fDE3NzMzNDk1OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Blood donation"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              className="bg-white border border-border rounded-2xl p-6 hover:shadow-xl transition cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#C0392B]/20 to-[#C0392B]/5 rounded-2xl flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-[#C0392B]" />
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Smart Hospital Recommendation
              </h3>
              <p className="text-foreground/70">
                AI-powered hospital recommendations based on emergency type,
                distance, and availability
              </p>
              <div className="mt-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwcHJvZmVzc2lvbmFsJTIwZG9jdG9yJTIwbWVkaWNhbHxlbnwxfHx8fDE3NzMzNDk1OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Smart recommendation"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-[#F7FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              How It Works
            </h2>
            <p className="text-xl text-foreground/70">
              Simple, fast, and effective emergency response
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Request Emergency Help",
                description:
                  "Press the emergency button and provide basic information about the situation",
                icon: Phone,
              },
              {
                step: 2,
                title: "Ambulance Assignment",
                description:
                  "Nearest available ambulance is assigned and hospital is confirmed automatically",
                icon: Ambulance,
              },
              {
                step: 3,
                title: "Live Tracking & Care",
                description:
                  "Track ambulance in real-time while hospital prepares for patient arrival",
                icon: MapPin,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-md relative"
              >
                <div
                  className="absolute -top-4 -left-4 w-12 h-12 bg-[#E53935] text-white rounded-full flex items-center justify-center text-xl"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  {item.step}
                </div>
                <div className="w-16 h-16 bg-[#1E88E5]/10 rounded-lg flex items-center justify-center mb-4 mt-4">
                  <item.icon className="w-8 h-8 text-[#1E88E5]" />
                </div>
                <h3
                  className="text-xl mb-2"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  {item.title}
                </h3>
                <p className="text-foreground/70">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#E53935] to-[#C62828]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2
            className="text-4xl mb-6"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            Ready to Save Lives?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join MedSutra today and be part of the healthcare coordination
            network
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/emergency"
              className="px-8 py-4 bg-white text-[#E53935] rounded-lg hover:bg-gray-100 transition shadow-lg inline-flex items-center justify-center gap-2"
            >
              <Ambulance className="w-5 h-5" />
              Request Emergency Help
            </Link>
            <Link
              to="/blood-donation"
              className="px-8 py-4 bg-[#2E7D32] text-white rounded-lg hover:bg-[#27632A] transition shadow-lg inline-flex items-center justify-center gap-2"
            >
              <Droplets className="w-5 h-5" />
              Register as Donor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-[#E53935]" />
              <span
                className="text-xl"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                MedSutra
              </span>
            </div>
            <p className="text-white/70">The Thread That Connects Healthcare</p>
          </div>
          <div>
            <h4
              className="mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2 text-white/70">
              <li>
                <a href="#features" className="hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition">
                  How It Works
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Dashboards
            </h4>
            <ul className="space-y-2 text-white/70">
              <li>
                <Link
                  to="/dashboard/hospital"
                  className="hover:text-white transition"
                >
                  Hospital Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/control-room"
                  className="hover:text-white transition"
                >
                  Control Room
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Contact
            </h4>
            <p className="text-white/70">
              Emergency Hotline:
              <br />
              <span className="text-white text-xl">1800-MEDSUTRA</span>
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-white/70">
          <p>&copy; 2026 MedSutra. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Components */}
      <Chatbot />

      {/* Floating Emergency Button (OLD - may not need) */}
      <FloatingEmergencyButton />

      {/* Floating SOS Button (Above Chatbot) */}
      <FloatingSOSButton />
    </div>
  );
}
