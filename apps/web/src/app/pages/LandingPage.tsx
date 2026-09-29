import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Cpu,
  BookOpen,
  TrendingUp,
  Users,
  BadgeDollarSign,
  Sparkles,
  Flame,
  BrainCircuit,
  Lock,
  CheckCircle2,
  Coins,
  Award,
  Zap,
} from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";

/**
 * Modern Corporate Landing Page (Inspired by Jabil & Institutional FinTech Platforms)
 * 100% English Localization per User Request
 * Ref: AURA_UI_REDESIGN_SPEC.md (Sections S1 - S10)
 */
export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <main id="main-content" className="landing-container">
      {/* ====================================================================
          S1. HERO SECTION (Jabil-inspired: Made Possible. Made Better.)
          ==================================================================== */}
      <section className="hero-jabil" aria-labelledby="hero-heading">
        <div className="hero-content">
          <div className="hero-chip-badge">
            <Sparkles size={14} className="chip-icon" aria-hidden="true" />
            <span>INTERACTIVE INVESTMENT PLATFORM</span>
          </div>

          <h2 id="hero-heading" className="hero-title-main">
            LEARN SMART. <br />
            <span className="text-gradient">INVEST SAFE.</span>
          </h2>

          <h2 className="hero-subtitle-lead">
            AI-Assisted Financial Learning & Investment Simulation
          </h2>

          <p className="hero-description">
            A standardized pedagogical ecosystem for financial markets.
            Conquer emotional volatility in the <strong>FOMO Arena</strong>, master asset allocation in the <strong>Pro Room</strong>,
            and build lasting wealth discipline with zero capital risk.
          </p>

          <div className="hero-cta-group">
            <Link to="/academy" className="btn btn-gradient btn-lg">
              <BookOpen size={18} aria-hidden="true" />
              <span>Explore Courses</span>
            </Link>
            <Link to="/simulation" className="btn btn-secondary btn-lg">
              <TrendingUp size={18} aria-hidden="true" />
              <span>Open Simulation Desk</span>
            </Link>
          </div>

          <div className="hero-guarantee">
            <CheckCircle2 size={15} className="text-success" aria-hidden="true" />
            <span>$100,000.00 Virtual Capital · Zero Real Money · Risk-Free Learning Environment</span>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="mockup-ticker">AURA CAPITAL · SIMULATION CYCLE 01</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-stat-row">
                <div>
                  <span className="mockup-label">Virtual Portfolio NAV</span>
                  <div className="mockup-value text-gradient">$100,000.00</div>
                </div>
                <div className="mockup-badge">+5.24%</div>
              </div>
              <div className="mockup-graph">
                <div className="graph-bar h-40" />
                <div className="graph-bar h-55" />
                <div className="graph-bar h-45" />
                <div className="graph-bar h-70" />
                <div className="graph-bar h-65" />
                <div className="graph-bar h-85 active" />
                <div className="graph-bar h-95" />
              </div>
              <div className="mockup-pills">
                <span className="mini-pill">🔥 FOMO Arena</span>
                <span className="mini-pill">📊 Pro Room</span>
                <span className="mini-pill">🛡️ Risk-Free</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S2. ABOUT — PLATFORM MISSION
          ==================================================================== */}
      <section className="section-about" aria-labelledby="about-heading">
        <div className="about-grid">
          <div className="about-text-col">
            <span className="section-tag">PLATFORM MISSION</span>
            <h2 id="about-heading" className="section-title">
              WELCOME TO <span className="text-gradient">AURA CAPITAL</span>
            </h2>
            <p className="about-lead">
              Aura Capital was founded to eliminate the fear of market volatility and costly beginners' losses for aspiring investors.
            </p>
            <p className="about-body">
              We unite structured curricula, deterministic market simulation, and institutional portfolio analytics.
              Here, every decision is a learning milestone—without risking a single dollar of hard-earned capital.
            </p>
            <div className="about-features-list">
              <div className="about-feature-item">
                <CheckCircle2 size={18} className="text-success" />
                <span>100% Server-Authoritative Execution & Settlement Matching</span>
              </div>
              <div className="about-feature-item">
                <CheckCircle2 size={18} className="text-success" />
                <span>Real-Time Emotional Discipline & Cognitive Trap Neutralization</span>
              </div>
              <div className="about-feature-item">
                <CheckCircle2 size={18} className="text-success" />
                <span>Collaborative Knowledge Sharing with Serious Learners</span>
              </div>
            </div>
          </div>

          <div className="about-card-col">
            <div className="about-highlight-box">
              <div className="highlight-icon-wrap">
                <BrainCircuit size={32} />
              </div>
              <h3>Experiential Learning Framework</h3>
              <p>
                Move beyond static textbooks. Master concepts in the <strong>Academy Curriculum</strong>, execute trades in <strong>Simulation</strong>, and verify results inside <strong>Portfolio</strong> analytics.
              </p>
              <Link to="/academy" className="btn btn-ghost btn-sm">
                <span>Explore Learning Roadmap →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S3. STATS COUNTER GRID
          ==================================================================== */}
      <section className="section-stats" aria-label="Platform Statistics">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number text-gradient">2</div>
            <div className="stat-label">Specialized Simulation Maps</div>
            <div className="stat-sub">FOMO Arena & Pro Room</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">7</div>
            <div className="stat-label">High-Pressure Rounds</div>
            <div className="stat-sub">45-second execution windows</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">12</div>
            <div className="stat-label">Macroeconomic Quarters</div>
            <div className="stat-sub">Financial statements & market cycles</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">4</div>
            <div className="stat-label">Core Asset Allocation Classes</div>
            <div className="stat-sub">Growth, Value, Fixed Income & Cash</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">100%</div>
            <div className="stat-label">Virtual Capital — Risk Free</div>
            <div className="stat-sub">Zero financial downside</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">24/7</div>
            <div className="stat-label">AI Advisor Companion</div>
            <div className="stat-sub">Disciplined portfolio analytics</div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S4. CORE CAPABILITIES (Features Showcase Grid)
          ==================================================================== */}
      <section className="section-features" aria-labelledby="features-heading">
        <div className="section-header-center">
          <span className="section-tag">ECOSYSTEM ARCHITECTURE</span>
          <h2 id="features-heading" className="section-title">
            CORE <span className="text-gradient">CAPABILITIES</span>
          </h2>
          <p className="section-subtitle">
            Everything required to graduate from beginner speculation to disciplined, systematic investing
          </p>
        </div>

        <div className="grid-cards">
          {/* 1. Academy Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-blue-subtle">
                <BookOpen size={22} className="text-blue" aria-hidden="true" />
              </div>
              <h3 className="card-title">Academy</h3>
            </div>
            <p className="card-description">
              Progressive financial curriculum with interactive quiz challenges, flashcards, and verified XP milestone tracking.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Ready</span>
              <Link to="/academy" className="card-action-link">
                <span>View Courses →</span>
              </Link>
            </div>
          </div>

          {/* 2. Simulation Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-teal-subtle">
                <TrendingUp size={22} className="text-teal" aria-hidden="true" />
              </div>
              <h3 className="card-title">Simulation Engine</h3>
            </div>
            <p className="card-description">
              Execute simulated trades in two dedicated maps: manage psychological herd traps in FOMO Arena, and master valuation in Pro Room.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Ready</span>
              <Link to="/simulation" className="card-action-link">
                <span>Open Trading Desk →</span>
              </Link>
            </div>
          </div>

          {/* 3. Community Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-green-subtle">
                <Users size={22} className="text-green" aria-hidden="true" />
              </div>
              <h3 className="card-title">Community</h3>
            </div>
            <p className="card-description">
              Share market perspectives, formulate trade theses, and collaborate with like-minded learners in moderated discussion channels.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Ready</span>
              <Link to="/community" className="card-action-link">
                <span>Join Discussions →</span>
              </Link>
            </div>
          </div>

          {/* 4. Subscription Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-amber-subtle">
                <BadgeDollarSign size={22} className="text-amber" aria-hidden="true" />
              </div>
              <h3 className="card-title">Membership & Plans</h3>
            </div>
            <p className="card-description">
              Start completely free. Upgrade when you require advanced institutional analytics and enhanced simulation quotas.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-amber-subtle">Coming Soon</span>
              <Link to="/subscription" className="card-action-link">
                <span>Explore Plans →</span>
              </Link>
            </div>
          </div>

          {/* 5. Security & Protection */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-blue-subtle">
                <ShieldCheck size={22} className="text-blue" aria-hidden="true" />
              </div>
              <h3 className="card-title">Security & Protection</h3>
            </div>
            <p className="card-description">
              Strict Argon2id password hashing, revocable refresh token rotation, in-memory access tokens, and server-side role validation.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Active</span>
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>Protected</span>
            </div>
          </div>

          {/* 6. Aura Intelligence */}
          <div className="card card-aura card-deferred">
            <div className="card-header">
              <div className="card-icon-wrap bg-purple-subtle">
                <Cpu size={22} className="text-purple" aria-hidden="true" />
              </div>
              <h3 className="card-title">Aura Intelligence</h3>
            </div>
            <p className="card-description">
              Context-aware AI financial learning coach powered by isolated gateway adapters, strict retrieval grounding, and educational safety guardrails.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-neutral">Phase 8 Intelligence — Coming Soon</span>
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>Deferred for MVP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S5. DUAL SIMULATION MAPS (Navy Band)
          ==================================================================== */}
      <section className="section-navy-band" aria-labelledby="maps-showcase-heading">
        <div className="navy-band-inner">
          <div className="section-header-center text-white">
            <span className="section-tag-navy">SIMULATION SPOTLIGHT</span>
            <h2 id="maps-showcase-heading" className="section-title text-white">
              INVESTMENT EXPERIENCE <span className="text-gradient-navy">ACROSS 2 MAPS</span>
            </h2>
            <p className="section-subtitle-navy">
              Evolve from panic-driven retail speculation to systematic, institutional-grade portfolio management
            </p>
          </div>

          <div className="maps-showcase-grid">
            {/* Map 1 Card */}
            <div className="map-showcase-card map1-card">
              <div className="map-card-badge-row">
                <span className="map-chip map1-chip">
                  <Flame size={14} /> MAP 1
                </span>
                <span className="badge badge-success-subtle">AVAILABLE</span>
              </div>
              <h3 className="map-card-title">FOMO ARENA</h3>
              <p className="map-card-tagline">Psychological Endurance & Short-Term Speculation</p>

              <div className="map-specs-list">
                <div className="map-spec-item">
                  <span className="spec-label">⏱ Mechanics:</span>
                  <span className="spec-val">Real-time · 7 rounds × 45s</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">💰 Capital:</span>
                  <span className="spec-val">$10,000.00 Virtual Funds</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🎯 Objective:</span>
                  <span className="spec-val">Survive rumor traps, achieve +5–10%</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🏆 Rewards:</span>
                  <span className="spec-val">"Survivor" Badge + Map 2 Access Key</span>
                </div>
              </div>

              <Link to="/simulation" className="btn btn-primary btn-md map-cta-btn">
                <span>Start Map 1 (FOMO Arena) →</span>
              </Link>
            </div>

            {/* Map 2 Card */}
            <div className="map-showcase-card map2-card">
              <div className="map-card-badge-row">
                <span className="map-chip map2-chip">
                  <BrainCircuit size={14} /> MAP 2
                </span>
                <span className="badge badge-amber-subtle">
                  <Lock size={12} /> UNLOCK REQUIRED
                </span>
              </div>
              <h3 className="map-card-title">PRO ROOM</h3>
              <p className="map-card-tagline">Disciplined Value Investing & Macro Allocation</p>

              <div className="map-specs-list">
                <div className="map-spec-item">
                  <span className="spec-label">📅 Mechanics:</span>
                  <span className="spec-val">Turn-based · 12 economic quarters</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">💰 Capital:</span>
                  <span className="spec-val">$100,000.00 Virtual Funds</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🎯 Objective:</span>
                  <span className="spec-val">Consistent Alpha, Max Drawdown &lt; 15%</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🤖 AI Support:</span>
                  <span className="spec-val">CrediFin AI Advisor Insights</span>
                </div>
              </div>

              <div className="map-locked-box">
                <Lock size={14} className="text-amber" />
                <span>Complete Map 1 to unlock Pro Room</span>
              </div>
            </div>
          </div>

          <div className="navy-band-action">
            <Link to="/simulation" className="btn btn-gradient btn-lg">
              <span>Go to Simulation Map Picker →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S6. 4-STEP ROADMAP
          ==================================================================== */}
      <section className="section-how-it-works" aria-labelledby="steps-heading">
        <div className="section-header-center">
          <span className="section-tag">LEARNER PATHWAY</span>
          <h2 id="steps-heading" className="section-title">
            4-STEP <span className="text-gradient">SYSTEMATIC ROADMAP</span>
          </h2>
          <p className="section-subtitle">
            A proven pedagogy engineered to build autonomous, confident investors
          </p>
        </div>

        <div className="roadmap-grid">
          <div className="roadmap-step">
            <div className="step-number">1</div>
            <div className="step-icon-wrap">
              <BookOpen size={24} />
            </div>
            <h4>LEARN AT ACADEMY</h4>
            <p>Master 9 practical stations: equity ownership, order books, balance sheets, P/E ratios, and macro drivers.</p>
          </div>

          <div className="roadmap-step">
            <div className="step-number">2</div>
            <div className="step-icon-wrap">
              <Flame size={24} />
            </div>
            <h4>TEST IN MAP 1</h4>
            <p>Face 7 rounds of high-speed FOMO waves, breaking news, and herd traps to solidify stop-loss discipline.</p>
          </div>

          <div className="roadmap-step">
            <div className="step-number">3</div>
            <div className="step-icon-wrap">
              <BrainCircuit size={24} />
            </div>
            <h4>UPGRADE IN MAP 2</h4>
            <p>Manage multi-asset portfolios across 12 macroeconomic quarters with AI-guided valuation and risk budgeting.</p>
          </div>

          <div className="roadmap-step">
            <div className="step-number">4</div>
            <div className="step-icon-wrap">
              <Users size={24} />
            </div>
            <h4>SHARE IN COMMUNITY</h4>
            <p>Publish market analyses, debate investment theses, and sharpen your rationale alongside ambitious peers.</p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S7. LATEST COMMUNITY INSIGHTS
          ==================================================================== */}
      <section className="section-community-insights" aria-labelledby="community-preview-heading">
        <div className="community-insights-header">
          <div>
            <span className="section-tag">REAL DISCUSSIONS</span>
            <h2 id="community-preview-heading" className="section-title">
              COMMUNITY <span className="text-gradient">HIGHLIGHTS</span>
            </h2>
          </div>
          <Link to="/community" className="btn btn-ghost">
            <span>View All Discussions →</span>
          </Link>
        </div>

        <div className="community-cards-grid">
          <div className="community-preview-card">
            <div className="card-author-row">
              <div className="author-avatar">AM</div>
              <div>
                <span className="author-name">Alex Morgan</span>
                <span className="post-date">Just now</span>
              </div>
            </div>
            <h4 className="post-title">Risk Management During High Volatility Cycles</h4>
            <p className="post-snippet">
              Maintaining at least a 30% cash buffer during rapid multiple contraction keeps psychology grounded and capital preserved...
            </p>
            <div className="post-meta-row">
              <span className="like-badge">❤️ 1 like</span>
              <span className="topic-tag">Risk Management</span>
            </div>
          </div>

          <div className="community-preview-card">
            <div className="card-author-row">
              <div className="author-avatar bg-teal">LT</div>
              <div>
                <span className="author-name">Learner Tour</span>
                <span className="post-date">1 day ago</span>
              </div>
            </div>
            <h4 className="post-title">Key Takeaways from Round 4 in the FOMO Arena</h4>
            <p className="post-snippet">
              Never deploy 5x margin before news confirmation. Maintaining strict limit order entries preserved my account to +8.5%...
            </p>
            <div className="post-meta-row">
              <span className="like-badge">❤️ 4 likes</span>
              <span className="topic-tag">Simulation Map 1</span>
            </div>
          </div>

          <div className="community-preview-card">
            <div className="card-author-row">
              <div className="author-avatar bg-purple">VI</div>
              <div>
                <span className="author-name">Global Trader</span>
                <span className="post-date">2 days ago</span>
              </div>
            </div>
            <h4 className="post-title">Impact of Central Bank Rate Adjustments on Equity Multiple</h4>
            <p className="post-snippet">
              When interest rates decline, the present value of future earnings rises, sparking multiple expansion in growth stocks...
            </p>
            <div className="post-meta-row">
              <span className="like-badge">❤️ 7 likes</span>
              <span className="topic-tag">Macro Economics</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S8. STUDENT-CENTERED CTA
          ==================================================================== */}
      <section className="section-people-centered" aria-label="Student Community Call to Action">
        <div className="people-card">
          <div className="people-text">
            <span className="section-tag">COMMUNITY POWERED</span>
            <h2 className="section-title">
              LEARN TOGETHER, <br />
              <span className="text-gradient">PROGRESS EVERY DAY</span>
            </h2>
            <p className="people-desc">
              Over 10,000 risk-free trade simulations have been executed on Aura Capital.
              Equip yourself with unbreakable habits before stepping into live capital markets.
            </p>
            <div className="people-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  <span>Open Your Dashboard →</span>
                </Link>
              ) : (
                <Link to="/register" className="btn btn-gradient btn-lg">
                  <Sparkles size={18} />
                  <span>Get Started for Free</span>
                </Link>
              )}
            </div>
          </div>
          <div className="people-badges-column" aria-hidden="true">
            <div className="floating-badge fb-1">
              <Award size={20} className="text-amber" />
              <div>
                <strong>Survivor Badge</strong>
                <span>Overcame the FOMO Storm</span>
              </div>
            </div>
            <div className="floating-badge fb-2">
              <Coins size={20} className="text-green" />
              <div>
                <strong>+50 XP Awarded</strong>
                <span>Station 1 Completed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S9. FINAL CONVERSION CTA BAND
          ==================================================================== */}
      <section className="section-final-cta" aria-labelledby="cta-final-heading">
        <div className="final-cta-content">
          <h2 id="cta-final-heading" className="final-cta-title">
            Ready to trade without the fear of losing money?
          </h2>
          <p className="final-cta-sub">
            Experience both simulation maps completely free with $100,000.00 in pedagogical funds.
          </p>
          <div className="final-cta-buttons">
            <Link to="/simulation" className="btn btn-gradient btn-lg">
              <Zap size={18} />
              <span>Launch Simulation (Map 1)</span>
            </Link>
            <Link to="/academy" className="btn btn-secondary btn-lg">
              <span>Explore 9 Academy Stations</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};
