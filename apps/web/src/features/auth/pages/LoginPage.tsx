import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSafeReturnUrl } from "../utils/return-url";
import { AuthApiError } from "../../../api/auth.api";

/**
 * FEAT-071: Canonical Login Page (FR-001, FR-003, FR-004, FR-005, FR-006, AC-001..AC-006)
 *
 * Implements:
 * - Secure login form with FEAT-003 normalization
 * - Uniform failure presentation (zero username enumeration leakage)
 * - Safe internal return-path redirection
 * - Zero token or credential storage in browser storage
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rawReturnTo = searchParams.get("returnTo");
  const safeReturnUrl = getSafeReturnUrl(rawReturnTo, "/account");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(safeReturnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, safeReturnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(normalizedEmail, password);
      // Navigate to validated return URL on successful login
      navigate(safeReturnUrl, { replace: true });
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.status === 429) {
          setErrorMessage("Too many login attempts. Please wait a few minutes before trying again.");
        } else if (err.status >= 500) {
          setErrorMessage("Authentication service is temporarily unavailable. Please try again later.");
        } else {
          // Uniform message for 400, 401, or any client failure (zero enumeration)
          setErrorMessage("Invalid email or password.");
        }
      } else {
        setErrorMessage("Invalid email or password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerHref = rawReturnTo
    ? `/register?returnTo=${encodeURIComponent(rawReturnTo)}`
    : "/register";

  return (
    <main className="auth-page-container" id="main-content">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-wrap" aria-hidden="true">
            <LogIn size={28} className="text-accent" />
          </div>
          <h1 className="auth-title">Sign in to Aura Capital</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your courses, simulation desk, and community portfolio.
          </p>
        </div>

        {errorMessage && (
          <div className="auth-error-banner" role="alert" aria-live="polite">
            <AlertCircle size={18} className="text-error" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={Boolean(errorMessage)}
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
            </div>
            <div className="password-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="form-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(errorMessage)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p className="text-muted">
            Don&apos;t have an account?{" "}
            <Link to={registerHref} className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
