import React from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@aura/shared";
import { ShieldCheck, BookOpen, TrendingUp, Users, HelpCircle, Lock } from "lucide-react";

/**
 * Modern Corporate Navy Application Footer
 * (Ref: AURA_UI_REDESIGN_SPEC.md - Section 2 & AURA_UX_IMPROVEMENTS_SPEC.md - Section 7)
 */
export const AppFooter: React.FC = () => {
  return (
    <footer className="footer footer-navy" role="contentinfo">
      <div className="footer-content">
        {/* Column 1: Brand & Regulatory Disclaimers */}
        <div className="footer-brand-section">
          <div className="footer-brand-header">
            <div className="brand-icon" aria-hidden="true">A</div>
            <span className="footer-brand text-gradient-navy">{APP_NAME}</span>
          </div>
          <p className="footer-disclaimer">
            Aura Capital is an educational investment simulation platform.
            All market activities, asset positions, and trading outcomes are simulated
            and do not constitute actual financial advice or live brokerage execution.
            Educational & simulation purposes only. No real capital is at risk.
          </p>
          <div className="footer-security-pill">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Server-Authoritative Sandbox · 100% Virtual Capital</span>
          </div>
        </div>

        {/* Column 2: Platform Links */}
        <nav className="footer-nav" aria-label="Footer Navigation">
          <div className="footer-nav-col">
            <span className="footer-nav-title">Platform</span>
            <Link to="/academy" className="footer-link">
              <BookOpen size={14} aria-hidden="true" />
              <span>Academy Courses</span>
            </Link>
            <Link to="/simulation" className="footer-link">
              <TrendingUp size={14} aria-hidden="true" />
              <span>Trading Simulation</span>
            </Link>
            <Link to="/community" className="footer-link">
              <Users size={14} aria-hidden="true" />
              <span>Community Discussions</span>
            </Link>
            <Link to="/portfolio" className="footer-link">
              <span>Portfolio Analytics</span>
            </Link>
          </div>

          {/* Column 3: Account & Membership */}
          <div className="footer-nav-col">
            <span className="footer-nav-title">Account</span>
            <Link to="/subscription" className="footer-link">Subscription Plans</Link>
            <Link to="/login" className="footer-link">Sign In</Link>
            <Link to="/register" className="footer-link">Create Account</Link>
            <Link to="/dashboard" className="footer-link">Learner Dashboard</Link>
          </div>

          {/* Column 4: Support & Legal */}
          <div className="footer-nav-col">
            <span className="footer-nav-title">Legal & Support</span>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/disclaimer" className="footer-link">Risk Disclaimer</Link>
            <Link to="/faq" className="footer-link">
              <HelpCircle size={14} aria-hidden="true" />
              <span>FAQ</span>
            </Link>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>© 2026 {APP_NAME}. Production MVP — All rights reserved.</p>
        <div className="footer-bottom-badges">
          <span className="badge badge-subtle">Build v0.9.0-mvp</span>
          <span className="badge badge-success-subtle">
            <Lock size={12} aria-hidden="true" />
            <span>Argon2id Protected</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
