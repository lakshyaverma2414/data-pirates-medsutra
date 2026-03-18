import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router";

export function ScrollToTopLayout() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return <Outlet />;
}
