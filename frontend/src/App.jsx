import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import HospitalLandingPage from "./modules/hospital/landing/LandingPage";
import LoginPage from "./modules/hospital/auth/LoginPage";
import RegisterPage from "./modules/hospital/auth/RegisterPage";
import OnboardingPage from "./modules/hospital/onboarding/OnboardingPage";
import DashboardPage from "./modules/hospital/dashboard/DashboardPage";
import UserEmergenciesPage from "./modules/hospital/dashboard/UserEmergenciesPage";
import OperationsPage from "./modules/hospital/dashboard/OperationsPage";
import BloodTransfersPage from "./modules/hospital/blood-transfers/BloodTransfersPage";
import ControlLoginPage from "./modules/control/auth/ControlLoginPage";
import ControlDashboardPage from "./modules/control/dashboard/ControlDashboardPage";
import ControlDashboardApiPage from "./modules/control/dashboard/ControlDashboardApiPage";
import EmergenciesPage from "./modules/hospital/emergencies/EmergenciesPage";
import PatientTransfersPage from "./modules/hospital/patient-transfers/PatientTransfersPage";
import DoctorsPage from "./modules/hospital/doctors/DoctorsPage";
import HospitalShell from "./components/HospitalShell";
import { LandingPage as PublicLandingPage } from "../other-modules/src/app/modules/public/pages/landing-page";
import { EmergencyForm } from "../other-modules/src/app/modules/public/pages/emergency-form";
import { EmergencyHome } from "../other-modules/src/app/modules/public/pages/emergency-home";
import { AmbulanceTracking } from "../other-modules/src/app/modules/public/pages/ambulance-tracking";
import { BloodDonation } from "../other-modules/src/app/modules/public/pages/blood-donation";
import { Login as PublicLogin } from "../other-modules/src/app/modules/public/pages/login";
import { SignUp as PublicSignUp } from "../other-modules/src/app/modules/public/pages/signup";
import { EmergencyHospitals } from "../other-modules/src/app/modules/user/pages/emergency-hospitals";
import { MedicalChat } from "../other-modules/src/app/modules/user/pages/medical-chat";
import { DonateBlood } from "../other-modules/src/app/modules/user/pages/donate-blood";
import { AmbulanceServices } from "../other-modules/src/app/modules/user/pages/ambulance-services";

const ProtectedRoute = ({ children, redirectTo = "/hospital/login" }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

const App = () => {
  const withHospitalShell = (element) => (
    <ProtectedRoute>
      <HospitalShell>{element}</HospitalShell>
    </ProtectedRoute>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLandingPage />} />
        <Route path="/emergency" element={<EmergencyHome />} />
        <Route path="/emergency/form" element={<EmergencyForm />} />
        <Route
          path="/emergency/tracking/:requestId"
          element={<AmbulanceTracking />}
        />
        <Route path="/blood-donation" element={<BloodDonation />} />
        <Route path="/login" element={<PublicLogin />} />
        <Route path="/signup" element={<PublicSignUp />} />

        <Route path="/user/medical-chat" element={<MedicalChat />} />
        <Route path="/user/donate-blood" element={<DonateBlood />} />
        <Route
          path="/user/emergency-hospitals"
          element={<EmergencyHospitals />}
        />
        <Route
          path="/user/ambulance-services"
          element={<AmbulanceServices />}
        />

        <Route path="/hospital" element={<HospitalLandingPage />} />
        <Route path="/hospital/login" element={<LoginPage />} />
        <Route path="/hospital/register" element={<RegisterPage />} />
        <Route
          path="/hospital/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/dashboard"
          element={withHospitalShell(<DashboardPage />)}
        />
        <Route
          path="/hospital/user-emergencies"
          element={withHospitalShell(<UserEmergenciesPage />)}
        />
        <Route
          path="/hospital/operations"
          element={withHospitalShell(<OperationsPage />)}
        />
        <Route
          path="/hospital/doctors"
          element={withHospitalShell(<DoctorsPage />)}
        />
        <Route
          path="/hospital/blood-transfers"
          element={withHospitalShell(<BloodTransfersPage />)}
        />
        <Route
          path="/hospital/patient-transfers"
          element={withHospitalShell(<PatientTransfersPage />)}
        />
        <Route
          path="/hospital/emergencies"
          element={withHospitalShell(<EmergenciesPage />)}
        />

        <Route path="/dashboard/user" element={<Navigate to="/" replace />} />
        <Route
          path="/emergency-hospitals"
          element={<Navigate to="/user/emergency-hospitals" replace />}
        />
        <Route
          path="/medical-chat"
          element={<Navigate to="/user/medical-chat" replace />}
        />
        <Route
          path="/donate-blood"
          element={<Navigate to="/user/donate-blood" replace />}
        />
        <Route
          path="/ambulance-services"
          element={<Navigate to="/user/ambulance-services" replace />}
        />

        <Route
          path="/login/hospital"
          element={<Navigate to="/hospital/login" replace />}
        />
        <Route
          path="/signup/hospital"
          element={<Navigate to="/hospital/register" replace />}
        />
        <Route
          path="/register"
          element={<Navigate to="/hospital/register" replace />}
        />
        <Route
          path="/onboarding"
          element={<Navigate to="/hospital/onboarding" replace />}
        />
        <Route
          path="/dashboard"
          element={<Navigate to="/hospital/dashboard" replace />}
        />
        <Route
          path="/dashboard/hospital"
          element={<Navigate to="/hospital/dashboard" replace />}
        />
        <Route
          path="/operations"
          element={<Navigate to="/hospital/operations" replace />}
        />
        <Route
          path="/doctors"
          element={<Navigate to="/hospital/doctors" replace />}
        />
        <Route
          path="/blood-transfers"
          element={<Navigate to="/hospital/blood-transfers" replace />}
        />
        <Route
          path="/patient-transfers"
          element={<Navigate to="/hospital/patient-transfers" replace />}
        />
        <Route
          path="/emergencies"
          element={<Navigate to="/hospital/emergencies" replace />}
        />

        <Route path="/login/control" element={<ControlLoginPage />} />
        <Route
          path="/dashboard/control-room"
          element={
            <ProtectedRoute redirectTo="/login/control">
              <ControlDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/control-room-api"
          element={
            <ProtectedRoute redirectTo="/login/control">
              <ControlDashboardApiPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
