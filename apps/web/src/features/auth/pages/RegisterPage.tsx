import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSafeReturnUrl } from "../utils/return-url";
import { AuthApiError } from "../../../api/auth.api";

/**
 * FEAT-071: Canonical Registration Page (FR-001, FR-003, FR-004, FR-005, FR-006, AC-001..AC-006)
 *
 * Implements:
 * - Registration form with FEAT-003 password policy (min 12 characters)
 * - Safe 409 conflict and rate limit presentation
 * - Email normalization (lowercase, trimmed)
 * - Confirmation matching and client guidance
 */
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, login, isAuthenticated } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const isPasswordLongEnough = password.length >= 12;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 12) {
      setErrorMessage("Password must be at least 12 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(normalizedEmail, password, displayName.trim() || undefined);
      // Attempt auto-login after successful registration
      try {
        await login(normalizedEmail, password);
        navigate(safeReturnUrl, { replace: true });
      } catch {
        // If auto-login fails, redirect to login page with pre-filled state
        navigate(`/login?returnTo=${encodeURIComponent(safeReturnUrl)}&registered=true`, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.status === 409) {
          setErrorMessage("An account with this email address already exists. Please sign in instead.");
        } else if (err.status === 429) {
          setErrorMessage("Too many registration attempts. Please wait a few minutes before trying again.");
        } else if (err.status >= 500) {
          setErrorMessage("Registration service is temporarily unavailable. Please try again later.");
        } else {
          setErrorMessage(err.message || "Registration failed. Please check your information.");
        }
      } else {
        setErrorMessage("Registration failed. Please verify your information and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginHref = rawReturnTo
    ? `/login?returnTo=${encodeURIComponent(rawReturnTo)}`
    : "/login";

  return (
    <main className="auth-page-container" id="main-content">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-wrap" aria-hidden="true">
            <UserPlus size={28} className="text-accent" />
          </div>
          <h1 className="auth-title">Create your Account</h1>
          <p className="auth-subtitle">
            Join Aura Capital to access institutional financial education and trading simulations.
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
            <label htmlFor="register-displayName" className="form-label">
              Display Name <span className="text-muted">(Optional)</span>
            </label>
            <input
              id="register-displayName"
              type="text"
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Chen"
              maxLength={100}
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email" className="form-label">
              Email Address <span className="text-error">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password" className="form-label">
              Password <span className="text-error">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className="form-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 12 characters"
                required
                maxLength={128}
                autoComplete="new-password"
                disabled={isSubmitting}
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
            <div className="password-rules-hint">
              <span className={isPasswordLongEnough ? "rule-met" : "rule-unmet"}>
                {isPasswordLongEnough ? (
                  <CheckCircle2 size={13} aria-hidden="true" />
                ) : (
                  <span className="dot" aria-hidden="true" />
                )}
                Minimum 12 characters (FEAT-003 policy)
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-confirmPassword" className="form-label">
              Confirm Password <span className="text-error">*</span>
            </label>
            <input
              id="register-confirmPassword"
              type={showPassword ? "text" : "password"}
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              maxLength={128}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {confirmPassword.length > 0 && !doPasswordsMatch && (
              <span className="form-field-error">Passwords do not match</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting || !isPasswordLongEnough}
          >
            {isSubmitting ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p className="text-muted">
            Already have an account?{" "}
            <Link to={loginHref} className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
