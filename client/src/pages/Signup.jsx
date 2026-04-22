import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import authService, {
  GOOGLE_AUTH_RESULT_STORAGE_KEY,
  clearGoogleAuthResult,
} from "../services/auth";
import { APP_NAME } from "../config/brand";
import iconImg from "../assets/icon_orange.svg";
import "../styles/Auth.css";

const AUTH_ORIGIN = (() => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return "http://localhost:5000";
  if (apiUrl.startsWith("/")) return window.location.origin;

  try {
    return new URL(apiUrl, window.location.origin).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const oauthProcessingRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleAuthResult = async (payload) => {
      if (!payload?.type || oauthProcessingRef.current) return;

      if (payload.type === "GOOGLE_AUTH_ERROR") {
        setError("Google sign-in failed. Please try again.");
        clearGoogleAuthResult();
        return;
      }

      if (payload.type !== "GOOGLE_AUTH_SUCCESS" || !payload.token) return;

      oauthProcessingRef.current = true;

      try {
        setError("");
        clearGoogleAuthResult();
        await authService.completeOAuthLogin(payload.token);
        navigate("/dashboard");
      } catch {
        setError("Google sign-in failed. Please try again.");
      } finally {
        oauthProcessingRef.current = false;
      }
    };

    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      await handleGoogleAuthResult(event.data);
    };

    const handleStorage = async (event) => {
      if (event.key !== GOOGLE_AUTH_RESULT_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        await handleGoogleAuthResult(JSON.parse(event.newValue));
      } catch {
        clearGoogleAuthResult();
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [navigate]);

  const openGooglePopup = () => {
    const w = 500,
      h = 620;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    clearGoogleAuthResult();
    window.open(
      `${AUTH_ORIGIN}/api/auth/google`,
      "google-auth",
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.register({ name, email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-centered-page">
      {/* Hex decorations */}
      <div className="auth-hex auth-hex-1" />
      <div className="auth-hex auth-hex-2" />
      <div className="auth-hex auth-hex-3" />
      <div className="auth-hex auth-hex-4" />
      <div className="auth-hex auth-hex-5" />
      <div className="auth-hex auth-hex-6" />

      <div className="auth-card">
        {/* Icon */}
        <Link to="/" className="auth-card-logo-link">
          <div className="auth-card-icon-box">
            <img src={iconImg} alt={APP_NAME} />
          </div>
        </Link>

        <h1 className="auth-card-title">Get started with {APP_NAME}</h1>
        <p className="auth-card-sub">
          Already have an account?{" "}
          <Link to="/login" className="auth-text-link auth-text-link--bold">
            Log in
          </Link>
        </p>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Google button — top, dark */}
        <button
          type="button"
          onClick={openGooglePopup}
          className="auth-google-dark-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="name">
              Full Name <span className="auth-required">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="auth-input"
            />
          </div>

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

          <div className="auth-field">
            <label htmlFor="password">
              Password <span className="auth-required">*</span>
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

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Creating account…" : "Create free account"}
          </button>

          <p className="auth-terms">
            By signing up you agree to our <a href="#">Terms of Use</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
