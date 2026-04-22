import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import iconOrange from "./assets/icon_orange_animated.svg";
import { Toaster } from "react-hot-toast";
import { APP_NAME } from "./config/brand";

import { PrivateRoute, PublicRoute } from "./components/RouteGuards";

import LandingPage from "./pages/LandingPage";
import Unsubscribe from "./pages/Unsubscribe";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/Overview";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import EditCampaign from "./pages/EditCampaign";
import Domains from "./pages/Domains";
import Contacts from "./pages/Contacts";
import Analytics from "./pages/Analytics";
import ActivityLogs from "./pages/ActivityLogs";
import EmailValidation from "./pages/EmailValidation";
import ApiKeys from "./pages/ApiKeys";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import Transactions from "./pages/admin/Transactions";
import SystemCampaigns from "./pages/admin/SystemCampaigns";
import GlobalSettings from "./pages/admin/GlobalSettings";
import Plans from "./pages/admin/Plans";

const PAGE_TITLES = {
  "/": APP_NAME,
  "/login": `Log in - ${APP_NAME}`,
  "/signup": `Sign up - ${APP_NAME}`,
  "/forgot-password": `Forgot password - ${APP_NAME}`,
  "/reset-password": `Reset password - ${APP_NAME}`,
  "/unsubscribe": `Unsubscribe - ${APP_NAME}`,
  "/dashboard": `Overview - ${APP_NAME}`,
  "/campaigns": `Campaigns - ${APP_NAME}`,
  "/campaigns/new": `New Campaign - ${APP_NAME}`,
  "/contacts": `Contacts - ${APP_NAME}`,
  "/domains": `Custom Domains - ${APP_NAME}`,
  "/analytics": `Analytics - ${APP_NAME}`,
  "/logs": `Activity Logs - ${APP_NAME}`,
  "/validation": `Email Validation - ${APP_NAME}`,
  "/api-keys": `API Keys - ${APP_NAME}`,
  "/billing": `Billing - ${APP_NAME}`,
  "/settings": `Settings - ${APP_NAME}`,
  "/admin": `Admin Dashboard - ${APP_NAME}`,
  "/admin/users": `User Management - ${APP_NAME}`,
  "/admin/transactions": `Transactions - ${APP_NAME}`,
  "/admin/campaigns": `Campaigns - ${APP_NAME}`,
  "/admin/plans": `Plans - ${APP_NAME}`,
  "/admin/settings": `Global Settings - ${APP_NAME}`,
};

function TitleManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Exact match first, then check if it's a dynamic route like /campaigns/:id/edit
    const title =
      PAGE_TITLES[pathname] ||
      (pathname.endsWith("/edit") ? `Edit Campaign - ${APP_NAME}` : null) ||
      APP_NAME;
    document.title = title;
  }, [pathname]);
  return null;
}

function SplashScreen({ visible }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1.25rem",
        transition: "opacity 0.5s ease, visibility 0.5s ease",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        pointerEvents: "none",
      }}
    >
      <img
        src={iconOrange}
        alt="Sendora"
        style={{
          width: 72,
          height: 72,
          animation: "splashPulse 1s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          width: 36,
          height: 3,
          borderRadius: 99,
          background: "linear-gradient(90deg, #E63E00, #FFAA00)",
          animation: "splashBar 1s ease-in-out infinite alternate",
          transformOrigin: "left",
        }}
      />
    </div>
  );
}

function App() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes splashPulse {
          from { transform: scale(0.92); opacity: 0.8; }
          to   { transform: scale(1.05); opacity: 1; }
        }
        @keyframes splashBar {
          from { transform: scaleX(0.4); opacity: 0.6; }
          to   { transform: scaleX(1);   opacity: 1; }
        }
      `}</style>
      <SplashScreen visible={splashVisible} />
      <Router>
        <TitleManager />
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "Inter, sans-serif",
              fontSize: "0.875rem",
              padding: 0,
              background: "transparent",
              boxShadow: "none",
              maxWidth: 380,
            },
            success: {
              style: {},
              icon: null,
            },
            error: {
              style: {},
              icon: null,
            },
          }}
          containerStyle={{ top: 20, right: 20 }}
        />
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

          {/* Public routes — redirect to /dashboard if already logged in */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected routes — all share the dashboard layout */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/new" element={<CampaignBuilder />} />
              <Route path="/campaigns/:id/edit" element={<EditCampaign />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/logs" element={<ActivityLogs />} />
              <Route path="/validation" element={<EmailValidation />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/transactions" element={<Transactions />} />
              <Route path="/admin/campaigns" element={<SystemCampaigns />} />
              <Route path="/admin/plans" element={<Plans />} />
              <Route path="/admin/settings" element={<GlobalSettings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
