import React, { useState, useEffect } from "react";
import { User, Mail, Shield, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { UserProfile } from "../../../api/profile.api";
import { useUpdateProfileMutation } from "../hooks/use-profile";

export interface ProfileDetailsFormProps {
  profile: UserProfile;
  accessToken?: string | null;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export const ProfileDetailsForm: React.FC<ProfileDetailsFormProps> = ({
  profile,
  accessToken,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateMutation = useUpdateProfileMutation(accessToken);

  useEffect(() => {
    setDisplayName(profile.displayName || "");
  }, [profile.displayName]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayName(val);
    setSuccessMessage(null);

    if (val.length > 100) {
      setValidationError("Display name must not exceed 100 characters");
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const trimmed = displayName.trim();
    if (trimmed.length > 100) {
      setValidationError("Display name must not exceed 100 characters");
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({ displayName: trimmed });
      setSuccessMessage("Profile information updated successfully");
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || "Failed to update profile details";
      setValidationError(errorMsg);
    }
  };

  const formattedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Member";

  const isSaving = updateMutation.isPending;
  const isChanged = (displayName.trim()) !== (profile.displayName || "").trim();

  return (
    <form className="profile-details-form card" onSubmit={handleSubmit} noValidate>
      <div className="card-header">
        <div className="card-icon-wrap" aria-hidden="true">
          <User size={20} className="text-accent" />
        </div>
        <h2 className="card-title">Profile Information</h2>
      </div>

      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Read-only User ID */}
        <div className="form-group">
          <label htmlFor="profile-user-id" className="form-label" style={{ fontWeight: 600 }}>
            Account ID
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="profile-user-id"
              type="text"
              readOnly
              value={profile.id}
              className="form-input font-mono"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", cursor: "default" }}
              aria-label="Account ID"
            />
          </div>
          <span className="form-hint text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
            Unique cryptographic identity identifier (read-only)
          </span>
        </div>

        {/* Read-only Email Address */}
        <div className="form-group">
          <label htmlFor="profile-email" className="form-label" style={{ fontWeight: 600 }}>
            Email Address
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="profile-email"
              type="email"
              readOnly
              value={profile.email}
              className="form-input"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", cursor: "default", paddingLeft: "2.25rem" }}
              aria-label="Email Address"
            />
            <Mail
              size={16}
              className="text-muted"
              style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
              aria-hidden="true"
            />
          </div>
          <span className="form-hint text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
            Primary verified account email for authentication (read-only)
          </span>
        </div>

        {/* Server-Authoritative Roles & Badges */}
        <div className="form-group">
          <span className="form-label" style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
            Assigned Roles & Permissions
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            {profile.roles && profile.roles.length > 0 ? (
              profile.roles.map((r) => {
                const isAdmin = r.toUpperCase() === "ADMIN";
                return (
                  <span
                    key={r}
                    className={`badge ${isAdmin ? "badge-warning" : "badge-info"}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.75rem" }}
                  >
                    <Shield size={13} aria-hidden="true" />
                    <span>{r.toUpperCase() === "ADMIN" ? "ADMIN" : "LEARNER"}</span>
                  </span>
                );
              })
            ) : (
              <span className="badge badge-info">
                <Shield size={13} aria-hidden="true" />
                <span>LEARNER</span>
              </span>
            )}
            <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>{profile.status || "ACTIVE"}</span>
            </span>
          </div>
          <span className="form-hint text-muted" style={{ fontSize: "0.8rem", marginTop: "0.35rem", display: "block" }}>
            Member since {formattedDate}. Roles are evaluated strictly server-side and cannot be modified locally.
          </span>
        </div>

        {/* Editable Display Name */}
        <div className="form-group">
          <label htmlFor="profile-display-name" className="form-label" style={{ fontWeight: 600 }}>
            Display Name
          </label>
          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            onChange={handleDisplayNameChange}
            placeholder="e.g. Alex Rivera"
            className={`form-input ${validationError ? "form-input-error" : ""}`}
            maxLength={100}
            disabled={isSaving}
            aria-invalid={Boolean(validationError)}
            aria-describedby={validationError ? "display-name-error" : "display-name-hint"}
          />
          {validationError ? (
            <div id="display-name-error" className="text-danger" style={{ fontSize: "0.85rem", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <AlertCircle size={14} aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          ) : (
            <span id="display-name-hint" className="form-hint text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>
              Public name shown on community discussion boards and trading leaderboards. Max 100 characters.
            </span>
          )}
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div
            className="alert alert-success"
            role="status"
            style={{
              padding: "0.75rem 1rem",
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

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving || Boolean(validationError) || !isChanged}
            aria-label="Save profile details"
          >
            <Save size={16} aria-hidden="true" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
