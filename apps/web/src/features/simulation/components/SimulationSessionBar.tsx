import React from "react";
import { Play, RotateCcw, PlusCircle, CheckCircle2, Clock, XCircle, ChevronDown } from "lucide-react";
import { SimulationSessionDto } from "../types/simulation-ui.types";

interface SimulationSessionBarProps {
  session: SimulationSessionDto;
  sessions?: SimulationSessionDto[];
  onSelectSession?: (sessionId: string) => void;
  onStartSession?: () => void;
  onResetSession?: () => void;
  onCreateSession?: () => void;
  isStarting?: boolean;
  isResetting?: boolean;
  isCreating?: boolean;
}

export const SimulationSessionBar: React.FC<SimulationSessionBarProps> = ({
  session,
  sessions = [],
  onSelectSession,
  onStartSession,
  onResetSession,
  onCreateSession,
  isStarting = false,
  isResetting = false,
  isCreating = false,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="badge badge-success" data-testid="session-status-badge">
            <CheckCircle2 size={13} style={{ marginRight: "4px" }} />
            ACTIVE
          </span>
        );
      case "CREATED":
        return (
          <span className="badge badge-warning" data-testid="session-status-badge">
            <Clock size={13} style={{ marginRight: "4px" }} />
            READY TO START
          </span>
        );
      case "COMPLETED":
        return (
          <span className="badge badge-info" data-testid="session-status-badge">
            <CheckCircle2 size={13} style={{ marginRight: "4px" }} />
            COMPLETED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="badge badge-error" data-testid="session-status-badge">
            <XCircle size={13} style={{ marginRight: "4px" }} />
            CANCELLED
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="card simulation-session-bar" data-testid="simulation-session-bar">
      <div className="session-bar-left">
        <div className="session-title-wrap">
          <span className="session-scenario-name">
            {session.scenario?.name ?? "Market Simulation"}
          </span>
          {getStatusBadge(session.status)}
        </div>

        <div className="session-meta-items">
          <div className="session-meta-item">
            <span className="meta-label">Current Cycle</span>
            <span className="meta-value" data-testid="session-cycle-value">Cycle {session.currentCycle}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-label">Starting Cash</span>
            <span className="meta-value" data-testid="session-starting-cash">${session.startingCash}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-label">Session ID</span>
            <span className="meta-value-mono" title={session.id}>
              {session.id.slice(0, 8)}...{session.id.slice(-4)}
            </span>
          </div>
        </div>
      </div>

      <div className="session-bar-right">
        {sessions.length > 1 && onSelectSession && (
          <div className="session-select-wrapper">
            <label htmlFor="session-select" className="sr-only">Switch Session</label>
            <div className="select-with-icon">
              <select
                id="session-select"
                className="input-select"
                value={session.id}
                onChange={(e) => onSelectSession(e.target.value)}
                aria-label="Switch Simulation Session"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Session #{s.id.slice(0, 6)} ({s.status} - Cycle {s.currentCycle})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
            </div>
          </div>
        )}

        {session.status === "CREATED" && onStartSession && (
          <button
            type="button"
            className="button button-success"
            onClick={onStartSession}
            disabled={isStarting}
            data-testid="start-session-button"
          >
            <Play size={16} style={{ marginRight: "6px" }} />
            {isStarting ? "Starting..." : "Start Session"}
          </button>
        )}

        {(session.status === "ACTIVE" || session.status === "COMPLETED") && onResetSession && (
          <button
            type="button"
            className="button button-outline"
            onClick={onResetSession}
            disabled={isResetting}
            data-testid="reset-session-button"
            title="Reset cash and positions to beginning of Cycle 1"
          >
            <RotateCcw size={15} style={{ marginRight: "6px" }} />
            {isResetting ? "Resetting..." : "Reset"}
          </button>
        )}

        {onCreateSession && (
          <button
            type="button"
            className="button button-secondary"
            onClick={onCreateSession}
            disabled={isCreating}
            data-testid="new-session-button"
            title="Create a new simulation session"
          >
            <PlusCircle size={15} style={{ marginRight: "6px" }} />
            New
          </button>
        )}
      </div>
    </div>
  );
};
