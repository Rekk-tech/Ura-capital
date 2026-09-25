import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

/**
 * FEAT-070: Route-level Error Boundary (FR-004, AC-004)
 *
 * Catches unhandled runtime exceptions in route components.
 * Guarantees zero sensitive data leakage (no stack traces, database info, or secrets)
 * and provides safe recovery paths (Retry, Return to Home).
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(): State {
    // Generate a sanitized pseudo-random error correlation ID for user reference
    const errorId = `err-${Math.random().toString(36).substring(2, 9)}`;
    return { hasError: true, errorId };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // In production, errors can be logged to a telemetry collector.
    // Ensure raw error details are never rendered into the user-visible DOM.
    if (process.env.NODE_ENV !== "test") {
      console.error("[RouteErrorBoundary] Caught error:", error.name, errorInfo.componentStack?.slice(0, 100));
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorId: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container" role="alert" aria-live="assertive">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrap" aria-hidden="true">
              <AlertTriangle size={36} className="text-error" />
            </div>

            <h1 className="error-boundary-title">Something went wrong</h1>

            <p className="error-boundary-copy">
              An unexpected error occurred while loading this view. You can retry loading the page or return to the main platform.
            </p>

            {this.state.errorId && (
              <p className="error-boundary-ref">
                Reference ID: <code>{this.state.errorId}</code>
              </p>
            )}

            <div className="error-boundary-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleRetry}
                aria-label="Retry loading this view"
              >
                <RefreshCw size={16} aria-hidden="true" />
                <span>Try Again</span>
              </button>

              <Link to="/" className="btn btn-secondary" onClick={this.handleRetry}>
                <Home size={16} aria-hidden="true" />
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
