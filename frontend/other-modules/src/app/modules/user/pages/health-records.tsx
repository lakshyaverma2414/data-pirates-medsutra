import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Heart,
  ArrowLeft,
  User,
  Edit2,
  Phone,
  Droplets,
  AlertCircle,
  Pill,
  Activity,
} from "lucide-react";
import { motion } from "motion/react";
import { MobileMenu } from "../../../shared/components/mobile-menu";

export function HealthRecords() {
  const [isEditing, setIsEditing] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: "Rajesh Kumar",
    age: 42,
    bloodGroup: "O+",
    avatar: "👤",
    emergencyContact: "+91 98765 43210",
    city: "New Delhi",
  });

  const [medicalInfo, setMedicalInfo] = useState({
    allergies: ["Penicillin", "Peanuts", "Shellfish"],
    chronicDiseases: ["Type 2 Diabetes", "Hypertension"],
    currentMedications: [
      "Metformin 500mg - 2x daily",
      "Lisinopril 10mg - 1x daily",
      "Aspirin 75mg - 1x daily",
    ],
  });

  // Load profile data from patient API response stored after login/signup.
  useEffect(() => {
    const storedData =
      localStorage.getItem("patientData") || localStorage.getItem("userData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setUserProfile({
        name: data.fullName || "Rajesh Kumar",
        age: Number(data.age) || 42,
        bloodGroup: data.bloodGroup || "O+",
        avatar: "👤",
        emergencyContact:
          data.emergencyContact || data.phoneNumber || "+91 98765 43210",
        city: data.city || "New Delhi",
      });

      // Parse medical information
      const allergiesList = data.allergies
        ? data.allergies
            .split(",")
            .map((a: string) => a.trim())
            .filter((a: string) => a)
        : [];
      const conditionsList = data.chronicConditions
        ? data.chronicConditions
            .split(",")
            .map((c: string) => c.trim())
            .filter((c: string) => c)
        : [];
      const medicationsList = data.medications
        ? data.medications
            .split(",")
            .map((m: string) => m.trim())
            .filter((m: string) => m)
        : [];

      if (
        allergiesList.length > 0 ||
        conditionsList.length > 0 ||
        medicationsList.length > 0
      ) {
        setMedicalInfo({
          allergies:
            allergiesList.length > 0 ? allergiesList : ["None recorded"],
          chronicDiseases:
            conditionsList.length > 0 ? conditionsList : ["None recorded"],
          currentMedications:
            medicationsList.length > 0 ? medicationsList : ["None recorded"],
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MobileMenu userType="user" />
            <Link to="/dashboard/user" className="md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#C0392B]" />
              <span
                className="text-lg"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Health Records
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-[#F5F7FA] rounded-lg transition flex items-center gap-2"
          >
            <Edit2 className="w-5 h-5 text-[#1F3A5F]" />
            <span className="hidden sm:inline text-sm">Edit</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Personal Health Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg overflow-hidden"
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4A6F] p-6 text-white">
              <h2
                className="text-xl mb-4"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Personal Health Profile
              </h2>

              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm text-4xl">
                  {userProfile.avatar}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h3
                    className="text-2xl mb-1"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {userProfile.name}
                  </h3>
                  <div className="flex items-center gap-4 text-white/90">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {userProfile.age} years
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-4 h-4" />
                      {userProfile.bloodGroup}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#C0392B]/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#C0392B]" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">
                    Emergency Contact
                  </p>
                  <p
                    className="text-lg"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {userProfile.emergencyContact}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Allergies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#C0392B]/10 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#C0392B]" />
              </div>
              <h3
                className="text-xl"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Allergies
              </h3>
            </div>

            <div className="space-y-2">
              {medicalInfo.allergies.map((allergy, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <div className="w-2 h-2 bg-[#C0392B] rounded-full"></div>
                  <span className="text-foreground/80">{allergy}</span>
                </div>
              ))}
            </div>

            {isEditing && (
              <button className="mt-4 w-full py-3 border-2 border-dashed border-border rounded-xl text-foreground/60 hover:border-[#C0392B] hover:text-[#C0392B] transition">
                + Add Allergy
              </button>
            )}
          </motion.div>

          {/* Chronic Diseases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#FF9800]/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#FF9800]" />
              </div>
              <h3
                className="text-xl"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Chronic Diseases
              </h3>
            </div>

            <div className="space-y-2">
              {medicalInfo.chronicDiseases.map((disease, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl"
                >
                  <div className="w-2 h-2 bg-[#FF9800] rounded-full"></div>
                  <span className="text-foreground/80">{disease}</span>
                </div>
              ))}
            </div>

            {isEditing && (
              <button className="mt-4 w-full py-3 border-2 border-dashed border-border rounded-xl text-foreground/60 hover:border-[#FF9800] hover:text-[#FF9800] transition">
                + Add Condition
              </button>
            )}
          </motion.div>

          {/* Current Medications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6 text-[#2A9D8F]" />
              </div>
              <h3
                className="text-xl"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Current Medications
              </h3>
            </div>

            <div className="space-y-2">
              {medicalInfo.currentMedications.map((medication, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl"
                >
                  <div className="w-2 h-2 bg-[#2A9D8F] rounded-full"></div>
                  <span className="text-foreground/80">{medication}</span>
                </div>
              ))}
            </div>

            {isEditing && (
              <button className="mt-4 w-full py-3 border-2 border-dashed border-border rounded-xl text-foreground/60 hover:border-[#2A9D8F] hover:text-[#2A9D8F] transition">
                + Add Medication
              </button>
            )}
          </motion.div>

          {/* Save Button (when editing) */}
          {isEditing && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setIsEditing(false);
                alert("Health profile updated successfully!");
              }}
              className="w-full py-4 bg-[#1F3A5F] text-white rounded-2xl hover:bg-[#2A4A6F] transition shadow-lg"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
            >
              Save Changes
            </motion.button>
          )}

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This information will be shared with
              emergency services and hospitals during emergencies to provide you
              with the best possible care.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
