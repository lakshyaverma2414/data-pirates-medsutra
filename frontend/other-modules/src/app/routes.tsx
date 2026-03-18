import { createBrowserRouter } from "react-router";
import { controlRoutes } from "./modules/control/routes";
import { hospitalRoutes } from "./modules/hospital/routes";
import { publicRoutes } from "./modules/public/routes";
import { userRoutes } from "./modules/user/routes";
import { ScrollToTopLayout } from "./shared/scroll-to-top-layout";

export const router = createBrowserRouter([
  {
    Component: ScrollToTopLayout,
    children: [
      ...publicRoutes,
      ...userRoutes,
      ...hospitalRoutes,
      ...controlRoutes,
    ],
  },
]);
