import { ShieldCheck, Cpu, BookOpen, TrendingUp, Users, Activity } from "lucide-react";
import { APP_NAME } from "@aura/shared";

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">A</div>
          <div>
            <h1 className="brand-title">{APP_NAME}</h1>
          </div>
        </div>
        <div className="status-pill">
          <span className="status-dot"></span>
          <span>Foundation: Healthy (v0.1.0)</span>
        </div>
      </header>

      <main>
        <section className="hero-banner">
          <span className="badge badge-info" style={{ marginBottom: "1rem" }}>
            Phase 1: Engineering Foundation
          </span>
          <h2 className="hero-title">AI-Assisted Financial Learning & Investment Simulation</h2>
          <p className="hero-subtitle">
            A production-oriented greenfield rebuild featuring a modular monolith architecture,
            strict type safety, server-authoritative simulation, and structured AI intelligence.
          </p>
        </section>

        <div className="grid-cards">
          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <ShieldCheck size={22} />
              </div>
              <h3 className="card-title">Identity & Security</h3>
            </div>
            <p className="card-description">
              Server-enforced authentication, strict role-based access control, revocable sessions,
              and environment-only secrets.
            </p>
            <span className="badge badge-success">Ready for Phase 2</span>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <BookOpen size={22} />
              </div>
              <h3 className="card-title">Academy</h3>
            </div>
            <p className="card-description">
              Interactive financial curriculum, progressive quizzes with server-side validation,
              flashcards, and idempotent XP rewards.
            </p>
            <span className="badge badge-success">Ready for Phase 4</span>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <TrendingUp size={22} />
              </div>
              <h3 className="card-title">Simulation Engine</h3>
            </div>
            <p className="card-description">
              Server-authoritative simulated markets, isolated user sessions, deterministic order
              matching, and risk reflection.
            </p>
            <span className="badge badge-success">Ready for Phase 5</span>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <Users size={22} />
              </div>
              <h3 className="card-title">Community</h3>
            </div>
            <p className="card-description">
              Relational like mechanics, moderated discussion threads, and collaborative investment
              insights with full data integrity.
            </p>
            <span className="badge badge-success">Ready for Phase 6</span>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <Cpu size={22} />
              </div>
              <h3 className="card-title">Aura Intelligence</h3>
            </div>
            <p className="card-description">
              Context-aware financial coach powered by Gemini with strict RAG context resolution,
              structured outputs, and safety guardrails.
            </p>
            <span className="badge badge-success">Ready for Phase 8</span>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <Activity size={22} />
              </div>
              <h3 className="card-title">Observability & Health</h3>
            </div>
            <p className="card-description">
              Structured JSON logging, sanitized request correlation, OpenTelemetry readiness, and
              production health telemetry.
            </p>
            <span className="badge badge-success">Active in Foundation</span>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 {APP_NAME}. Greenfield Rebuild — All rights reserved.</p>
      </footer>
    </div>
  );
};
