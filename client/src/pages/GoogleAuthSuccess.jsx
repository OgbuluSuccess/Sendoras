import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService, { storeGoogleAuthResult } from "../services/auth";

const PARENT_ORIGIN = window.location.origin;

// This page handles the Google OAuth redirect.
// - If opened as a popup: sends a postMessage to the parent, then closes.
// - If opened directly: stores the token and navigates to the dashboard.
const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const isError = searchParams.get("error");

    if (isError) {
      if (window.opener) {
        storeGoogleAuthResult({ type: "GOOGLE_AUTH_ERROR" });
        window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR" }, PARENT_ORIGIN);
        window.close();
      } else {
        navigate("/login?error=google_failed", { replace: true });
      }
      return;
    }

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (window.opener) {
      // Popup flow: send token to parent window and close
      storeGoogleAuthResult({ type: "GOOGLE_AUTH_SUCCESS", token });
      window.opener.postMessage(
        { type: "GOOGLE_AUTH_SUCCESS", token },
        PARENT_ORIGIN,
      );
      window.close();
    } else {
      // If the opener was lost, publish the result for the original window and try to close.
      storeGoogleAuthResult({ type: "GOOGLE_AUTH_SUCCESS", token });
      window.close();

      // Direct navigation fallback if the popup cannot be closed.
      authService
        .completeOAuthLogin(token)
        .then(() => navigate("/dashboard", { replace: true }))
        .catch(() => navigate("/login?error=google_failed", { replace: true }));
    }
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        background: "#fff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f1f5f9",
            borderTopColor: "#f97316",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 0.8s linear infinite",
          }}
        ></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#64748b", fontSize: "15px" }}>Signing you in…</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
