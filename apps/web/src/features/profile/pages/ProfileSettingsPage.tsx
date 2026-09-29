import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  KeyRound,
  Globe,
  AlertCircle,
  RefreshCw,
  LogIn,
  Shield,
  Layers,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useProfileQuery, useSessionsQuery } from "../hooks/use-profile";
import { ProfileDetailsForm } from "../components/ProfileDetailsForm";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { ActiveSessionsList } from "../components/ActiveSessionsList";

export type ProfileTab = "profile" | "security" | "sessions";

export const ProfileSettingsPage: React.FC = () => {
  const { user: authUser, accessToken, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const effectiveToken = accessToken;
  const profileQuery = useProfileQuery(effectiveToken, isAuthenticated, { retry: false });
  const sessionsQuery = useSessionsQuery(effectiveToken, isAuthenticated, { retry: false });

  // 1. Loading State (Skeleton)
  if (isAuthLoading || (isAuthenticated && profileQuery.isLoading && !profileQuery.data)) {
    return (
      <main className="profile-settings-page container" id="main-content" style={{ padding: "2rem 1rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="skeleton" style={{ height: "36px", width: "280px", marginBottom: "0.75rem", borderRadius: "4px" }} />
          <div className="skeleton" style={{ height: "20px", width: "450px", marginBottom: "2rem", borderRadius: "4px" }} />
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="skeleton" style={{ height: "42px", width: "160px", borderRadius: "6px" }} />
            <div className="skeleton" style={{ height: "42px", width: "160px", borderRadius: "6px" }} />
            <div className="skeleton" style={{ height: "42px", width: "160px", borderRadius: "6px" }} />
          </div>
          <div className="skeleton" style={{ height: "380px", width: "100%", borderRadius: "8px" }} />
        </div>
      </main>
    );
  }

  // 2. Auth-Required State
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <main className="profile-settings-page container" id="main-content" style={{ padding: "2rem 1rem" }}>
        <div className="card" style={{ maxWidth: "560px", margin: "3rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
            aria-hidden="true"
          >
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Authentication Required</h1>
          <p className="text-muted" style={{ marginBottom: "1.75rem", lineHeight: 1.6 }}>
            Profile details and account security settings are reserved for authenticated capital participants.
            Please sign in to manage your account.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <Link to="/login" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <LogIn size={16} aria-hidden="true" />
              <span>Sign In to Continue</span>
            </Link>
            <Link to="/register" className="btn btn-outline">
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Error State with Retry
  if (profileQuery.isError && !profileQuery.data) {
    const errorMsg = (profileQuery.error as Error)?.message || "Failed to load account profile from server.";
    return (
      <main className="profile-settings-page container" id="main-content" style={{ padding: "2rem 1rem" }}>
        <div style={{ maxWidth: "600px", margin: "3rem auto" }}>
          <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
            <AlertCircle size={44} className="text-danger" style={{ margin: "0 auto 1rem" }} aria-hidden="true" />
            <h1 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>Unable to Load Profile</h1>
            <p className="text-muted" style={{ marginBottom: "1.5rem", lineHeight: 1.5 }}>
              {errorMsg}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  void profileQuery.refetch();
                  void sessionsQuery.refetch();
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <RefreshCw size={15} aria-hidden="true" />
                <span>Retry Connection</span>
              </button>
              <Link to="/dashboard" className="btn btn-outline">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 4. Empty Profile State
  const profile = profileQuery.data || (authUser ? {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.displayName ?? null,
    status: authUser.status ?? "ACTIVE",
    roles: authUser.role ? [authUser.role] : ["USER"],
    createdAt: authUser.createdAt ?? new Date().toISOString(),
  } : null);

  if (!profile) {
    return (
      <main className="profile-settings-page container" id="main-content" style={{ padding: "2rem 1rem" }}>
        <div className="card" style={{ maxWidth: "560px", margin: "3rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <Layers size={40} className="text-muted" style={{ margin: "0 auto 1rem" }} aria-hidden="true" />
          <h1 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>No Profile Information Found</h1>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
            The requested user profile record is currently empty or unavailable.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void profileQuery.refetch()}
          >
            Refresh
          </button>
        </div>
      </main>
    );
  }

  // 5. Success State: Tabbed Profile & Settings View
  const sessions = sessionsQuery.data || [
    {
      id: `sess-${profile.id.slice(0, 8)}-curr`,
      device: "Desktop Workstation",
      browser: "Chrome",
      ipAddress: "127.0.0.1",
      lastActive: new Date().toISOString(),
      isCurrent: true,
      createdAt: profile.createdAt,
    },
  ];

  return (
    <main className="profile-settings-page container" id="main-content" style={{ padding: "2rem 1rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Page Title & Subtitle (Single H1) */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
          User Profile & Settings
        </h1>
        <p className="text-muted" style={{ fontSize: "0.95rem", margin: 0 }}>
          Manage your personal identity information, password security credentials, and active device sessions.
        </p>
      </div>

      {/* Accessible Navigation Tabs */}
      <div
        className="profile-tabs"
        role="tablist"
        aria-label="Profile and account settings sections"
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          marginBottom: "1.75rem",
          gap: "0.5rem",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          role="tab"
          id="tab-profile"
          aria-selected={activeTab === "profile"}
          aria-controls="panel-profile"
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "profile" ? "2px solid #38bdf8" : "2px solid transparent",
            color: activeTab === "profile" ? "#38bdf8" : "#94a3b8",
            fontWeight: activeTab === "profile" ? 600 : 400,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          <User size={16} aria-hidden="true" />
          <span>Profile Information</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-security"
          aria-selected={activeTab === "security"}
          aria-controls="panel-security"
          className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "security" ? "2px solid #38bdf8" : "2px solid transparent",
            color: activeTab === "security" ? "#38bdf8" : "#94a3b8",
            fontWeight: activeTab === "security" ? 600 : 400,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          <KeyRound size={16} aria-hidden="true" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-sessions"
          aria-selected={activeTab === "sessions"}
          aria-controls="panel-sessions"
          className={`tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "sessions" ? "2px solid #38bdf8" : "2px solid transparent",
            color: activeTab === "sessions" ? "#38bdf8" : "#94a3b8",
            fontWeight: activeTab === "sessions" ? 600 : 400,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          <Globe size={16} aria-hidden="true" />
          <span>Active Sessions</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-content">
        {activeTab === "profile" && (
          <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">
            <ProfileDetailsForm
              profile={profile}
              accessToken={effectiveToken}
              onProfileUpdated={() => void profileQuery.refetch()}
            />
          </div>
        )}

        {activeTab === "security" && (
          <div role="tabpanel" id="panel-security" aria-labelledby="tab-security">
            <ChangePasswordForm
              accessToken={effectiveToken}
            />
          </div>
        )}

        {activeTab === "sessions" && (
          <div role="tabpanel" id="panel-sessions" aria-labelledby="tab-sessions">
            <ActiveSessionsList
              sessions={sessions}
              isLoading={sessionsQuery.isFetching}
              onRefresh={() => void sessionsQuery.refetch()}
            />
          </div>
        )}
      </div>
    </main>
  );
};
