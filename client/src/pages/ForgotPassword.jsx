import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { APP_NAME } from "../config/brand";
import iconImg from "../assets/icon_orange.svg";
import "../styles/Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.msg || "Something went wrong. Please try again.",
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

        <h1 className="auth-card-title">Reset your password</h1>

        {!sent ? (
          <>
            <p className="auth-card-sub">
              Enter your email address and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="auth-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email">
                  Email <span className="auth-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send password reset email"}
              </button>
            </form>
          </>
        ) : (
          <div className="auth-success-state">
            <CheckCircle2 size={40} className="auth-success-icon" />
            <p>
              If <strong>{email}</strong> is registered, a reset link has been
              sent. Check your inbox (and spam folder).
            </p>
          </div>
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

export default ForgotPassword;
