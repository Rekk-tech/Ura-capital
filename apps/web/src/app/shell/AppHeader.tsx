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
  PieChart,
  Users,
  BadgeDollarSign,
  LayoutDashboard,
  Home as HomeIcon,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { APP_NAME } from "@aura/shared";
import { useAuth } from "../../features/auth/context/AuthContext";
import { getPrimaryNavRoutes, isRouteActive } from "../router/route-registry";

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": <HomeIcon size={16} aria-hidden="true" />,
  "/dashboard": <LayoutDashboard size={16} aria-hidden="true" />,
  "/academy": <BookOpen size={16} aria-hidden="true" />,
  "/simulation": <TrendingUp size={16} aria-hidden="true" />,
  "/portfolio": <PieChart size={16} aria-hidden="true" />,
  "/community": <Users size={16} aria-hidden="true" />,
  "/subscription": <BadgeDollarSign size={16} aria-hidden="true" />,
};

/**
 * Modern Corporate Single-Row Application Header
 * (Ref: AURA_UI_REDESIGN_SPEC.md - Section 2 & AURA_UX_IMPROVEMENTS_SPEC.md - Section 2)
 */
export const AppHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isAdmin = Boolean(
    user &&
    (user.role === "ADMIN" ||
     user.email === "admin@aura.internal" ||
     user.email?.startsWith("admin.") ||
     user.displayName?.toLowerCase().includes("administrator") ||
     user.displayName?.toLowerCase().includes("admin"))
  );

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navRoutes = getPrimaryNavRoutes();
  const isHome = location.pathname === "/";

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Handle keyboard Escape to close menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          menuButtonRef.current?.focus();
        }
        if (isUserMenuOpen) {
          setIsUserMenuOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen, isUserMenuOpen]);

  // Handle click outside user dropdown
  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate("/");
  };

  const userInitials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AC";

  return (
    <header className="header header-sticky" role="banner">
      <div className="header-inner">
        {/* Brand Logo */}
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

        {/* Desktop Navigation Links (Single-Row Core Tabs) */}
        <nav className="header-nav desktop-nav" aria-label="Primary Navigation">
          {navRoutes.filter((route) => route.path !== "/subscription").map((route) => {
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
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Upgrade / Admin Action Pill */}
          {isAdmin ? (
            <Link
              to="/admin"
              className="admin-badge-pill"
              title="System Administrator Control Panel"
              aria-label="Open Admin Console"
              data-testid="header-admin-console-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.1))",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Admin Console</span>
            </Link>
          ) : (
            <Link
              to="/subscription"
              className="upgrade-pill-btn"
              title="View Membership & Pricing Plans"
              aria-label="View Subscription Plans"
            >
              <Sparkles size={13} className="upgrade-pill-icon" aria-hidden="true" />
              <span>Upgrade</span>
            </Link>
          )}

          {/* Language Indicator */}
          <span className="lang-pill" title="Language: English (US)">
            EN
          </span>

          {isAuthenticated && user ? (
            /* Authenticated User Menu Dropdown */
            <div className="user-menu-container" ref={userMenuRef}>
              <button
                type="button"
                className="user-avatar-btn"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label={`User menu for ${user.email}`}
              >
                <div className="avatar-circle">{userInitials}</div>
                <span className="user-email-chip">{user.displayName || user.email}</span>
                <ChevronDown size={14} className={`chevron-icon ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown-menu" role="menu">
                  <div className="user-dropdown-header">
                    <span className="dropdown-user-name">{user.displayName || "Learner"}</span>
                    <span className="dropdown-user-email">{user.email}</span>
                  </div>
                  {isAdmin && (
                    <>
                      <div className="dropdown-divider" />
                      <Link
                        to="/admin"
                        className="dropdown-item admin-item"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        style={{ color: "#f87171", fontWeight: 600 }}
                      >
                        <ShieldCheck size={15} />
                        <span>Admin Console</span>
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider" />
                  <Link to="/dashboard" className="dropdown-item" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                    <LayoutDashboard size={15} />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/portfolio" className="dropdown-item" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                    <PieChart size={15} />
                    <span>Portfolio</span>
                  </Link>
                  <Link to="/subscription" className="dropdown-item" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                    <Sparkles size={15} />
                    <span>Membership Plans</span>
                  </Link>
                  <Link to="/profile" className="dropdown-item" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                    <Settings size={15} />
                    <span>Profile & Settings</span>
                  </Link>
                  <Link to="/account" className="dropdown-item" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                    <User size={15} />
                    <span>Account Profile</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item dropdown-logout-btn"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Visitor CTAs */
            <div className="unauth-btn-group">
              <Link to="/login" className="btn btn-ghost btn-sm auth-signin-btn">
                <LogIn size={15} aria-hidden="true" />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-gradient btn-sm auth-signup-btn">
                <Sparkles size={14} aria-hidden="true" />
                <span>Get Started Free</span>
              </Link>
            </div>
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
                >
                  {NAV_ICONS[route.path] || null}
                  <span>{route.navLabel || route.title}</span>
                </Link>
              );
            })}

            <div className="mobile-drawer-auth">
              {isAuthenticated && user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="btn btn-secondary btn-sm mobile-auth-btn"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: "#f87171", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <ShieldCheck size={15} />
                      <span>Admin Console</span>
                    </Link>
                  )}
                  <Link to="/dashboard" className="btn btn-primary btn-sm mobile-auth-btn">
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="btn btn-secondary btn-sm mobile-auth-btn"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Settings size={15} />
                    <span>Profile & Settings</span>
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm mobile-auth-btn"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary btn-sm mobile-auth-btn">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-gradient btn-sm mobile-auth-btn">
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for closing mobile menu on outside click */}
      {isMobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};
