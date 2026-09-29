import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Automatically scrolls the browser window to top (0, 0) upon any route/location change in the SPA.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      // In jsdom test environment, window.scrollTo is unimplemented and emits a console warning
      if (process.env.NODE_ENV !== "test") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }
    }
  }, [pathname]);

  return null;
};
