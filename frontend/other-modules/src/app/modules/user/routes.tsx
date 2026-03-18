import type { RouteObject } from "react-router";
import { AmbulanceServices } from "./pages/ambulance-services";
import { EmergencyHospitals } from "./pages/emergency-hospitals";

export const userRoutes: RouteObject[] = [
  {
    path: "/emergency-hospitals",
    Component: EmergencyHospitals,
  },
  {
    path: "/ambulance-services",
    Component: AmbulanceServices,
  },
];
