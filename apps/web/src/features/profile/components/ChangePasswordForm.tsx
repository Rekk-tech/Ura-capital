import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { useChangePasswordMutation } from "../hooks/use-profile";

export interface ChangePasswordFormProps {
  accessToken?: string | null;
  onPasswordChanged?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  accessToken,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const changeMutation = useChangePasswordMutation(accessToken);

  // Password Policy Analysis
  const hasMinLength = newPassword.length >= 12;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const strengthScore = [
    hasMinLength,
    hasUppercase && hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!newPassword) return { text: "None", color: "#64748b" };
    if (!hasMinLength) return { text: "Too Short (Min 12 chars)", color: "#ef4444" };
    if (strengthScore <= 2) return { text: "Moderate", color: "#f59e0b" };
    if (strengthScore === 3) return { text: "Strong", color: "#10b981" };
    return { text: "Very Strong", color: "#06b6d4" };
  };

  const strength = getStrengthLabel();

  const isFormValid =
    Boolean(currentPassword) &&
    hasMinLength &&
    passwordsMatch &&
    !changeMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage("Please enter your current password.");
      return;
    }

    if (!hasMinLength) {
      setErrorMessage("New password must be at least 12 characters long per security policy.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation password do not match.");
      return;
    }

    try {
      const res = await changeMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccessMessage(res.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (onPasswordChanged) {
        onPasswordChanged();
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Failed to update password. Please check your credentials.";
      setErrorMessage(msg);
    }
  };

  return (
    <form className="change-password-form card" onSubmit={handleSubmit} noValidate>
      <div className="card-header">
        <div className="card-icon-wrap" aria-hidden="true">
          <KeyRound size={20} className="text-accent" />
        </div>
        <h2 className="card-title">Security & Password</h2>
      </div>

      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Success Alert Banner */}
        {successMessage && (
          <div
            className="alert alert-success"
            role="status"
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
            }}
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            className="alert alert-danger"
            role="alert"
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
            }}
          >
            <AlertCircle size={18} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Current Password Field */}
        <div className="form-group">
          <label htmlFor="current-password" className="form-label" style={{ fontWeight: 600 }}>
            Current Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Enter current password"
              className="form-input"
              style={{ paddingRight: "2.75rem" }}
              required
              aria-label="Current Password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0.25rem",
              }}
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password Field */}
        <div className="form-group">
          <label htmlFor="new-password" className="form-label" style={{ fontWeight: 600 }}>
            New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Enter new strong password"
              className="form-input"
              style={{ paddingRight: "2.75rem" }}
              required
              aria-label="New Password"
              aria-describedby="password-policy-checklist"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0.25rem",
              }}
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password Strength Bar */}
          {newPassword.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                <span className="text-muted">Password Strength</span>
                <span style={{ color: strength.color, fontWeight: 600 }}>{strength.text}</span>
              </div>
              <div
                style={{
                  height: "4px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${hasMinLength ? Math.min(100, strengthScore * 25 + 25) : 15}%`,
                    backgroundColor: strength.color,
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm New Password Field */}
        <div className="form-group">
          <label htmlFor="confirm-password" className="form-label" style={{ fontWeight: 600 }}>
            Confirm New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Re-enter new password"
              className="form-input"
              style={{ paddingRight: "2.75rem" }}
              required
              aria-label="Confirm New Password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0.25rem",
              }}
              aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <span className="text-danger" style={{ fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
              Passwords do not match
            </span>
          )}
        </div>

        {/* Security Policy Requirements Checklist */}
        <div
          id="password-policy-checklist"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            fontSize: "0.825rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <ShieldCheck size={16} className="text-accent" aria-hidden="true" />
            <strong style={{ color: "var(--color-text, #f1f5f9)" }}>Aura Capital Password Policy</strong>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: hasMinLength ? "#10b981" : "#94a3b8" }}>
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>12+ characters</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: hasUppercase && hasLowercase ? "#10b981" : "#94a3b8" }}>
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>Upper & lower case</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: hasNumber ? "#10b981" : "#94a3b8" }}>
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>At least one number</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: hasSpecial ? "#10b981" : "#94a3b8" }}>
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>Symbol / special char</span>
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isFormValid}
            aria-label="Update account password"
          >
            <KeyRound size={16} aria-hidden="true" />
            <span>{changeMutation.isPending ? "Updating Password..." : "Update Password"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
