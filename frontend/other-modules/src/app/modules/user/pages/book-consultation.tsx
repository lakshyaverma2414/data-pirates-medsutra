import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  Calendar,
  Clock,
  Stethoscope,
  Search,
  User,
  CheckCircle2,
  MapPin,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";
import { MobileMenu } from "../../../shared/components/mobile-menu";
import { BackButton } from "../../../shared/components/back-button";
import { getDoctors, type UserDoctor } from "../services/api";

type DoctorWithHospitalMeta = UserDoctor & {
  hospitalName?: string;
  hospitalAddress?: string;
  address?: string;
};

export function BookConsultation() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [doctors, setDoctors] = useState<UserDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<UserDoctor | null>(null);
  const [showBookedModal, setShowBookedModal] = useState(false);
  const [userDetails, setUserDetails] = useState({
    fullName: "Patient",
    phoneNumber: "Not available",
    age: "Not available",
    bloodGroup: "Not available",
    city: "Not available",
    emergencyContact: "Not available",
  });

  useEffect(() => {
    let isMounted = true;

    getDoctors()
      .then((data) => {
        if (!isMounted) return;
        setDoctors(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load doctors. Please try again.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const stored =
      localStorage.getItem("patientData") || localStorage.getItem("userData");
    if (!stored) return;

    try {
      const data = JSON.parse(stored) as {
        fullName?: string;
        phoneNumber?: string;
        mobileNumber?: string;
        age?: string | number;
        bloodGroup?: string;
        city?: string;
        emergencyContact?: string;
      };

      setUserDetails({
        fullName: data.fullName || "Patient",
        phoneNumber: data.phoneNumber || data.mobileNumber || "Not available",
        age: data.age ? String(data.age) : "Not available",
        bloodGroup: data.bloodGroup || "Not available",
        city: data.city || "Not available",
        emergencyContact: data.emergencyContact || "Not available",
      });
    } catch {
      // Keep fallback values if stored user data is malformed.
    }
  }, []);

  const specialties = useMemo(
    () => [...new Set(doctors.map((doctor: UserDoctor) => doctor.specialty))],
    [doctors],
  );

  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialty) return doctors;
    return doctors.filter(
      (doctor: UserDoctor) => doctor.specialty === selectedSpecialty,
    );
  }, [doctors, selectedSpecialty]);

  const getHospitalName = (doctor: UserDoctor) => {
    const typedDoctor = doctor as DoctorWithHospitalMeta;
    return typedDoctor.hospitalName || doctor.hospital;
  };

  const getHospitalAddress = (doctor: UserDoctor) => {
    const typedDoctor = doctor as DoctorWithHospitalMeta;
    return (
      typedDoctor.hospitalAddress ||
      typedDoctor.address ||
      "Address not available"
    );
  };

  const handleBookAppointment = (doctor: UserDoctor) => {
    setSelectedDoctor(doctor);
    setShowBookedModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {showBookedModal && selectedDoctor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2
                className="text-2xl mb-1"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Appointment Booked
              </h2>
              <p className="text-foreground/70">
                Your consultation has been successfully scheduled.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-[#F5F7FA]">
                <p className="text-xs text-foreground/60 mb-1">Doctor</p>
                <p className="font-semibold">{selectedDoctor.name}</p>
                <p className="text-sm text-foreground/70">
                  {selectedDoctor.specialty}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F7FA]">
                <p className="text-xs text-foreground/60 mb-1">
                  Consultation Time
                </p>
                <p className="font-semibold">{selectedDoctor.nextAvailable}</p>
                <p className="text-sm text-foreground/70">
                  Fee: {selectedDoctor.fee}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border mb-4">
              <h3
                className="text-lg mb-3"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Hospital Details
              </h3>
              <p className="mb-2">
                <span className="text-foreground/60">Name: </span>
                <span className="font-medium">
                  {getHospitalName(selectedDoctor)}
                </span>
              </p>
              <p className="flex items-start gap-2 text-sm text-foreground/80">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{getHospitalAddress(selectedDoctor)}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border mb-6">
              <h3
                className="text-lg mb-3"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                Patient Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <p>
                  <span className="text-foreground/60">Full Name: </span>
                  <span className="font-medium">{userDetails.fullName}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-foreground/60" />
                  <span>{userDetails.phoneNumber}</span>
                </p>
                <p>
                  <span className="text-foreground/60">Age: </span>
                  <span>{userDetails.age}</span>
                </p>
                <p>
                  <span className="text-foreground/60">Blood Group: </span>
                  <span>{userDetails.bloodGroup}</span>
                </p>
                <p>
                  <span className="text-foreground/60">City: </span>
                  <span>{userDetails.city}</span>
                </p>
                <p>
                  <span className="text-foreground/60">
                    Emergency Contact:{" "}
                  </span>
                  <span>{userDetails.emergencyContact}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBookedModal(false)}
                className="px-5 py-2.5 border border-border rounded-lg hover:bg-[#F5F7FA] transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowBookedModal(false)}
                className="px-5 py-2.5 bg-[#2A9D8F] text-white rounded-lg hover:bg-[#248277] transition"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
              Book Consultation
            </h1>
            <p className="text-foreground/70">
              Schedule appointments with top doctors
            </p>
          </div>
          {/* Doctors List */}
          <div className="space-y-4">
            {loading && (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-foreground/70">
                Loading doctors...
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
                {error}
              </div>
            )}

            {!loading && !error && filteredDoctors.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-foreground/70">
                No doctors found for the selected specialty.
              </div>
            )}

            {!loading &&
              !error &&
              filteredDoctors.map((doctor: UserDoctor, index: number) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#1F3A5F] to-[#2A4A6F] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <User className="w-12 h-12 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3
                            className="text-xl mb-1"
                            style={{
                              fontFamily: "Poppins, sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {doctor.name}
                          </h3>
                          <p className="text-foreground/60 text-sm">
                            {doctor.specialty}
                          </p>
                        </div>
                        <span
                          className="text-2xl"
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontWeight: 700,
                            color: "#1F3A5F",
                          }}
                        >
                          {doctor.fee}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <Stethoscope className="w-4 h-4" />
                          {doctor.hospital}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <Clock className="w-4 h-4" />
                          {doctor.experience} experience
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-yellow-500">★</span>
                          {doctor.rating} rating
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
                          Next Available: {doctor.nextAvailable}
                        </div>
                        <button
                          onClick={() => handleBookAppointment(doctor)}
                          className="px-6 py-2 bg-[#2A9D8F] text-white rounded-lg hover:bg-[#248277] transition"
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
