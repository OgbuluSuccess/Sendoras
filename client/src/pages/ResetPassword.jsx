import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { APP_NAME } from "../config/brand";
import iconImg from "../assets/icon_orange.svg";
import "../styles/Auth.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err.response?.data?.msg || "Reset failed. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-centered-page">
      <div className="auth-hex auth-hex-1" />
      <div className="auth-hex auth-hex-2" />
      <div className="auth-hex auth-hex-3" />
      <div className="auth-hex auth-hex-4" />
      <div className="auth-hex auth-hex-5" />
      <div className="auth-hex auth-hex-6" />

      <div className="auth-card">
        <Link to="/" className="auth-card-logo-link">
          <div className="auth-card-icon-box">
            <img src={iconImg} alt={APP_NAME} />
          </div>
        </Link>

        <h1 className="auth-card-title">Choose a new password</h1>

        {!token ? (
          <div className="auth-error-banner" style={{ marginTop: "1rem" }}>
            <AlertCircle size={16} />
            <span>Invalid reset link. Please request a new one.</span>
          </div>
        ) : done ? (
          <div className="auth-success-state">
            <CheckCircle2 size={40} className="auth-success-icon" />
            <p>Password updated! Redirecting to login…</p>
          </div>
        ) : (
          <>
            <p className="auth-card-sub">Must be at least 8 characters.</p>

            {error && (
              <div className="auth-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="password">
                  New password <span className="auth-required">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirm">
                  Confirm password <span className="auth-required">*</span>
                </label>
                <input
                  id="confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="auth-input"
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch" style={{ marginTop: "1.5rem" }}>
          <Link to="/login" className="auth-text-link auth-text-link--bold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
