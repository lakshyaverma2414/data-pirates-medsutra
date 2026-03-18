import type { RouteObject } from "react-router";
import { AmbulanceTracking } from "./pages/ambulance-tracking";
import { BloodDonation } from "./pages/blood-donation";
import { EmergencyHome } from "./pages/emergency-home";
import { EmergencyForm } from "./pages/emergency-form";
import { LandingPage } from "./pages/landing-page";
import { Login } from "./pages/login";
import { DonateBlood } from "../user/pages/donate-blood";
import { MedicalChat } from "../user/pages/medical-chat";
import { SignUp } from "./pages/signup";

export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/emergency",
    children: [
      {
        index: true,
        Component: EmergencyHome,
      },
      {
        path: "form",
        Component: EmergencyForm,
      },
      {
        path: "tracking/:requestId",
        Component: AmbulanceTracking,
      },
    ],
  },
  {
    path: "/blood-donation",
    Component: BloodDonation,
  },
  {
    path: "/user/medical-chat",
    Component: MedicalChat,
  },
  {
    path: "/user/donate-blood",
    Component: DonateBlood,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: SignUp,
  },
];
