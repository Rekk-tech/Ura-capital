import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  LogIn,
  BookOpen,
  TrendingUp,
  Users,
  BadgeDollarSign,
  LayoutDashboard,
  Home as HomeIcon,
} from "lucide-react";
import { APP_NAME } from "@aura/shared";
import { useAuth } from "../../features/auth/context/AuthContext";
import { getPrimaryNavRoutes, isRouteActive } from "../router/route-registry";

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": <HomeIcon size={16} aria-hidden="true" />,
  "/dashboard": <LayoutDashboard size={16} aria-hidden="true" />,
  "/academy": <BookOpen size={16} aria-hidden="true" />,
  "/simulation": <TrendingUp size={16} aria-hidden="true" />,
  "/community": <Users size={16} aria-hidden="true" />,
  "/subscription": <BadgeDollarSign size={16} aria-hidden="true" />,
};

/**
 * FEAT-070: Responsive, Accessible Navigation Header (FR-003, AC-003)
 *
 * Implements:
 * - Desktop and mobile responsive navigation
 * - aria-current="page" on active route
 * - Keyboard navigation and Escape-to-close behavior
 * - Focus-safe drawer toggle
 * - Integration with AuthProvider for session state
 */
export const AppHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const navRoutes = getPrimaryNavRoutes();
  const isHome = location.pathname === "/";

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle keyboard Escape to close mobile menu and restore focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="header" role="banner">
      <div className="brand">
        <Link to="/" className="brand-link" aria-label={`${APP_NAME} Home`}>
          <div className="brand-icon" aria-hidden="true">A</div>
          <div>
            {isHome ? (
              <h1 className="brand-title">{APP_NAME}</h1>
            ) : (
              <span className="brand-title">{APP_NAME}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="header-nav desktop-nav" aria-label="Primary Navigation">
        {navRoutes.map((route) => {
          const active = isRouteActive(location.pathname, route.path);
          return (
            <Link
              key={route.path}
              to={route.path}
              className={`nav-link ${active ? "nav-link-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {NAV_ICONS[route.path] || null}
              <span>{route.navLabel || route.title}</span>
              {route.status === "PLANNED" && (
                <span className="badge badge-subtle" aria-label="Planned feature">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Auth & Session Controls */}
      <div className="header-actions">
        {isAuthenticated && user ? (
          <div className="user-profile-badge">
            <Link to="/account" className="user-info-link" aria-label="Account profile">
              <User size={16} aria-hidden="true" />
              <span className="user-email">{user.email}</span>
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              aria-label="Sign out of account"
              title="Sign Out"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="sr-only">Sign Out</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-outline btn-sm auth-signin-btn">
            <LogIn size={15} aria-hidden="true" />
            <span>Sign In</span>
          </Link>
        )}

        {/* Mobile Menu Toggle Button */}
        <button
          ref={menuButtonRef}
          type="button"
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isMobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav"
          ref={mobileNavRef}
          className="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div className="mobile-nav-links">
            {navRoutes.map((route) => {
              const active = isRouteActive(location.pathname, route.path);
              return (
                <Link
                  key={route.path}
                  to={route.path}
                  className={`mobile-nav-link ${active ? "mobile-nav-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {NAV_ICONS[route.path] || null}
                  <span>{route.navLabel || route.title}</span>
                  {route.status === "PLANNED" && (
                    <span className="badge badge-subtle">Coming Soon</span>
                  )}
                </Link>
              );
            })}

            <div className="mobile-nav-divider" />

            {isAuthenticated && user ? (
              <div className="mobile-auth-controls">
                <Link
                  to="/account"
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User size={16} aria-hidden="true" />
                  <span>Profile ({user.email})</span>
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    void handleLogout();
                  }}
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="mobile-auth-controls">
                <Link
                  to="/login"
                  className="btn btn-primary btn-block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn size={16} aria-hidden="true" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
