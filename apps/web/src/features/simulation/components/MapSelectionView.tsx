import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  BrainCircuit,
  Lock,
  CheckCircle2,
  Clock,
  Coins,
  Target,
  Award,
  X,
  Sparkles,
} from "lucide-react";

interface MapSelectionViewProps {
  onEnterCockpit: (mapId: "map1-fomo" | "map2-pro") => void;
  hasActiveSession: boolean;
  activeSessionCycle?: number;
  activeScenarioName?: string;
}

export const MapSelectionView: React.FC<MapSelectionViewProps> = ({
  onEnterCockpit,
  hasActiveSession,
  activeSessionCycle,
  activeScenarioName,
}) => {
  const navigate = useNavigate();
  const [briefingMap, setBriefingMap] = useState<"map1-fomo" | "map2-pro" | null>(null);

  return (
    <div className="map-selection-view">
      {/* Active Session Notice if one is already running */}
      {hasActiveSession && (
        <div className="active-session-banner card-aura">
          <div className="active-session-info">
            <span className="badge badge-success-subtle">SESSION IN PROGRESS</span>
            <h4>{activeScenarioName || "Active Trading Simulation"}</h4>
            <p>Cycle {activeSessionCycle ?? 1} · Live Order Matching Active</p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => onEnterCockpit("map1-fomo")}
          >
            <span>Resume Active Desk →</span>
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="map-picker-header">
        <span className="section-tag">SIMULATION ARENA</span>
        <h2 className="section-title">
          SELECT YOUR <span className="text-gradient">SIMULATION MAP</span>
        </h2>
        <p className="map-picker-subtitle">
          Choose a battleground to train specific financial instincts—from high-pressure volatility to multi-quarter portfolio strategy.
        </p>
      </div>

      {/* Dual Map Grid */}
      <div className="maps-selection-grid">
        {/* MAP 1: FOMO ARENA */}
        <div className="map-picker-card map1-picker">
          <div className="map-picker-top">
            <div className="map-chip map1-chip">
              <Flame size={15} />
              <span>MAP 1</span>
            </div>
            <span className="badge badge-success-subtle">AVAILABLE</span>
          </div>

          <div className="map-card-hero">
            <div className="map-icon-halo map1-halo">
              <Flame size={32} className="text-orange" />
            </div>
            <h3 className="map-title-lg">MAP 1 — FOMO ARENA</h3>
            <p className="map-tagline-lg">Psychological Endurance & Short-Term Speculation</p>
          </div>

          <div className="map-specs-box">
            <div className="spec-row">
              <span className="spec-icon-label">
                <Clock size={15} className="text-muted" /> Mechanics:
              </span>
              <strong>Real-time · 7 rounds × 45s</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Coins size={15} className="text-muted" /> Virtual Capital:
              </span>
              <strong>10.000.000 VND virtual cash</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Target size={15} className="text-muted" /> Target Win:
              </span>
              <strong>Survive traps, achieve +5–10%</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Award size={15} className="text-muted" /> Milestone:
              </span>
              <strong>Survivor Badge + Map 2 Key</strong>
            </div>
          </div>

          <div className="map-picker-actions">
            <button
              type="button"
              className={`btn ${hasActiveSession ? "btn-secondary" : "btn-primary"} btn-md btn-block`}
              onClick={() => navigate("/simulation/map-1")}
              data-testid="enter-fomo-arena-button"
            >
              <span>Start Map 1 (FOMO Arena) →</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBriefingMap("map1-fomo")}
            >
              <span>View Map 1 Rules & Briefing</span>
            </button>
          </div>
        </div>

        {/* MAP 2: PRO ROOM */}
        <div className="map-picker-card map2-picker">
          <div className="map-picker-top">
            <div className="map-chip map2-chip">
              <BrainCircuit size={15} />
              <span>MAP 2</span>
            </div>
            <span className="badge badge-amber-subtle">
              <Lock size={13} /> Locked until Map 1 is survived
            </span>
          </div>

          <div className="map-card-hero">
            <div className="map-icon-halo map2-halo">
              <BrainCircuit size={32} className="text-teal" />
            </div>
            <h3 className="map-title-lg">MAP 2 — PRO ROOM</h3>
            <p className="map-tagline-lg">Disciplined Value Investing & Strategic Allocation</p>
          </div>

          <div className="map-specs-box">
            <div className="spec-row">
              <span className="spec-icon-label">
                <Clock size={15} className="text-muted" /> Mechanics:
              </span>
              <strong>Turn-based · 12 quarters</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Coins size={15} className="text-muted" /> Virtual Capital:
              </span>
              <strong>100.000.000 VND virtual cash</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Target size={15} className="text-muted" /> Target Win:
              </span>
              <strong>Consistent Alpha, Drawdown &lt; 15%</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Sparkles size={15} className="text-muted" /> AI Support:
              </span>
              <strong>Graham & Buffett AI Advisor</strong>
            </div>
          </div>

          <div className="map-picker-actions">
            <button
              type="button"
              className="btn btn-secondary btn-md btn-block"
              onClick={() => navigate("/simulation/map-2")}
              data-testid="enter-pro-room-button"
            >
              <span>Start Map 2 (Pro Room) →</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBriefingMap("map2-pro")}
            >
              <span>View Pro Room Curriculum & Rules</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Roadmap Footer */}
      <div className="simulation-stepper-card">
        <div className="stepper-track">
          <div className="stepper-node active">
            <div className="node-circle">1</div>
            <span className="node-title">Map 1: FOMO Arena</span>
            <span className="node-desc">Survive the emotional storm</span>
          </div>
          <div className="stepper-arrow">
            <span className="key-pill">🔑 Access Key</span>
            <div className="arrow-line" />
          </div>
          <div className="stepper-node locked">
            <div className="node-circle">
              <Lock size={14} />
            </div>
            <span className="node-title">Map 2: Pro Room</span>
            <span className="node-desc">Multi-quarter value allocation</span>
          </div>
        </div>
      </div>

      {/* Briefing Modal */}
      {briefingMap && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="map-chip">
                  {briefingMap === "map1-fomo" ? "MAP 1 BRIEFING" : "MAP 2 BRIEFING"}
                </span>
                <h3>
                  {briefingMap === "map1-fomo" ? "FOMO Arena: Mission Briefing" : "Pro Room: Strategic Briefing"}
                </h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setBriefingMap(null)}
                aria-label="Close briefing dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {briefingMap === "map1-fomo" ? (
                <>
                  <p className="briefing-lead">
                    You have been allocated <strong>10.000.000 VND</strong> in virtual capital.
                    Your objective is to survive 7 consecutive rounds (45 seconds each) without blowing up your account.
                  </p>
                  <div className="briefing-rules">
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Beware Herd Traps:</strong> Breaking rumors and volatile pumps are engineered to test stop-loss discipline.
                      </div>
                    </div>
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Execution Limits:</strong> Market and Limit orders match deterministically against order book liquidity.
                      </div>
                    </div>
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Scoring Metric:</strong> You will be graded on your <em>FOMO Resistance Score</em> and <em>Net PnL</em>.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="briefing-lead">
                    You have been allocated <strong>100.000.000 VND</strong> in institutional virtual capital across 12 economic quarters.
                  </p>
                  <div className="briefing-rules">
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Multi-Asset Allocation:</strong> Balance capital across Growth Equities, Value Equities, Fixed Income, and Cash.
                      </div>
                    </div>
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Macro Sensitivity:</strong> Navigate inflation spikes, central bank interest rate hikes, and economic recessions.
                      </div>
                    </div>
                    <div className="rule-item">
                      <Lock size={16} className="text-amber" />
                      <div>
                        <strong>Prerequisite:</strong> Complete Map 1 to earn the accreditation key for Pro Room activation.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setBriefingMap(null)}
              >
                Close
              </button>
              {briefingMap === "map1-fomo" ? (
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  onClick={() => {
                    setBriefingMap(null);
                    navigate("/simulation/map-1");
                  }}
                >
                  <span>Enter FOMO Arena →</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  onClick={() => {
                    setBriefingMap(null);
                    navigate("/simulation/map-2");
                  }}
                >
                  <span>Enter Pro Room →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
