import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cpu, BookOpen, TrendingUp, Users, BadgeDollarSign } from "lucide-react";

/**
 * FEAT-070: Product-Oriented Landing View (FR-002, AC-002)
 *
 * Replaces stale foundation-era marketing copy with an honest, product-oriented
 * overview of available platform features and explicitly marked in-development capabilities.
 * Guarantees zero claims of readiness for deferred or unavailable features.
 */
export const LandingPage: React.FC = () => {
  return (
    <main id="main-content">
      <section className="hero-banner">
        <span className="badge badge-info" style={{ marginBottom: "1rem" }}>
          Interactive Investment Platform
        </span>
        <h2 className="hero-title">AI-Assisted Financial Learning & Investment Simulation</h2>
        <p className="hero-subtitle">
          Master financial concepts through guided Academy lessons, test your strategies in a
          safe server-authoritative trading simulation, and collaborate with peer investors in the community.
        </p>

        <div className="hero-cta-group">
          <Link to="/academy" className="btn btn-primary btn-lg">
            <BookOpen size={18} aria-hidden="true" />
            <span>Explore Courses</span>
          </Link>
          <Link to="/simulation" className="btn btn-outline btn-lg">
            <TrendingUp size={18} aria-hidden="true" />
            <span>Open Simulation Desk</span>
          </Link>
        </div>
      </section>

      <div className="grid-cards">
        {/* Academy Domain */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon-wrap">
              <BookOpen size={22} aria-hidden="true" />
            </div>
            <h3 className="card-title">Academy</h3>
          </div>
          <p className="card-description">
            Interactive financial curriculum, progressive quizzes with server-side validation,
            flashcard decks, and idempotent XP reward tracking.
          </p>
          <div className="card-footer-action">
            <span className="badge badge-info">Planned (MVP)</span>
            <Link to="/academy" className="card-action-link">
              Preview Courses →
            </Link>
          </div>
        </div>

        {/* Simulation Domain */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon-wrap">
              <TrendingUp size={22} aria-hidden="true" />
            </div>
            <h3 className="card-title">Simulation Engine</h3>
          </div>
          <p className="card-description">
            Server-authoritative simulated market orders, isolated learner trading sessions,
            deterministic execution matching, and realistic portfolio valuation.
          </p>
          <div className="card-footer-action">
            <span className="badge badge-info">Planned (MVP)</span>
            <Link to="/simulation" className="card-action-link">
              Preview Trading Desk →
            </Link>
          </div>
        </div>

        {/* Community Domain */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon-wrap">
              <Users size={22} aria-hidden="true" />
            </div>
            <h3 className="card-title">Community</h3>
          </div>
          <p className="card-description">
            Relational post interactions, moderated financial discussions, and collaborative
            market insights protected by strict ownership and rate limiting.
          </p>
          <div className="card-footer-action">
            <span className="badge badge-info">Planned (MVP)</span>
            <Link to="/community" className="card-action-link">
              Preview Discussions →
            </Link>
          </div>
        </div>

        {/* Subscription Domain */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon-wrap">
              <BadgeDollarSign size={22} aria-hidden="true" />
            </div>
            <h3 className="card-title">Membership & Plans</h3>
          </div>
          <p className="card-description">
            Transparent membership tiers, fair API quotas, and simulated entitlement resolution
            with zero external payment dependencies.
          </p>
          <div className="card-footer-action">
            <span className="badge badge-info">Planned (MVP)</span>
            <Link to="/subscription" className="card-action-link">
              Preview Plans →
            </Link>
          </div>
        </div>

        {/* Identity & Security */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon-wrap">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <h3 className="card-title">Security & Protection</h3>
          </div>
          <p className="card-description">
            Strict Argon2id password hashing, revocable refresh token rotation, in-memory access tokens,
            and server-side role validation.
          </p>
          <div className="card-footer-action">
            <span className="badge badge-success">Active</span>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>Protected</span>
          </div>
        </div>

        {/* Aura Intelligence - Honestly Marked Deferred/In-Development */}
        <div className="card card-muted">
          <div className="card-header">
            <div className="card-icon-wrap">
              <Cpu size={22} aria-hidden="true" />
            </div>
            <h3 className="card-title">Aura Intelligence</h3>
          </div>
          <p className="card-description">
            Context-aware AI financial learning coach powered by isolated gateway adapters,
            strict retrieval grounding, and educational safety guardrails.
          </p>
          <div className="card-footer-action">
            <span className="badge badge-neutral">Phase 8 Intelligence — Coming Soon</span>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>Deferred for MVP</span>
          </div>
        </div>
      </div>
    </main>
  );
};
