import React from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@aura/shared";

/**
 * FEAT-070: Standard Application Footer (FR-005, AC-005)
 *
 * Implements:
 * - Clear disclosure of educational/simulation purpose (no real money)
 * - Navigation links to major sections
 * - Product copyright and versioning
 */
export const AppFooter: React.FC = () => {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-brand-section">
          <span className="footer-brand">{APP_NAME}</span>
          <p className="footer-disclaimer">
            Aura Capital is an educational investment simulation platform.
            All market activities, asset positions, and trading outcomes are simulated
            and do not constitute actual financial advice or live brokerage execution.
            Educational & simulation purposes only. No real capital is at risk.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer Navigation">
          <div className="footer-nav-col">
            <span className="footer-nav-title">Platform</span>
            <Link to="/academy" className="footer-link">Academy Courses</Link>
            <Link to="/simulation" className="footer-link">Trading Simulation</Link>
            <Link to="/community" className="footer-link">Community Discussions</Link>
          </div>

          <div className="footer-nav-col">
            <span className="footer-nav-title">Account</span>
            <Link to="/subscription" className="footer-link">Subscription Plans</Link>
            <Link to="/login" className="footer-link">Sign In</Link>
            <Link to="/register" className="footer-link">Create Account</Link>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>© 2026 {APP_NAME}. Production MVP — All rights reserved.</p>
        <span className="badge badge-subtle">Build v0.9.0-mvp</span>
      </div>
    </footer>
  );
};
