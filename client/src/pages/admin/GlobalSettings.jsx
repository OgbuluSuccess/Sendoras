import React, { useState, useEffect } from "react";
import {
  Settings,
  Server,
  Shield,
  Mail,
  CreditCard,
  AlertTriangle,
  Check,
  Save,
  Globe,
  Key,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import toast from "../../utils/toast";
import "../../styles/DashboardNew.css";

const FIELD_DEFS = [
  {
    key: "defaultSenderName",
    label: "Default Sender Name",
    placeholder: "Sendhiiv",
    icon: <Mail size={15} />,
    hint: "Used when no custom sender name is set on a campaign or API call.",
  },
  {
    key: "defaultSenderEmail",
    label: "Default Sender Email",
    placeholder: "hello@sendhiiv.com",
    icon: <Mail size={15} />,
    hint: "Fallback FROM address when a user has no verified domain.",
  },
  {
    key: "appBaseUrl",
    label: "App Base URL",
    placeholder: "https://app.sendhiiv.com",
    icon: <Globe size={15} />,
    hint: "Used in unsubscribe links inside outgoing emails.",
  },
  {
    key: "docsUrl",
    label: "Docs URL",
    placeholder: "https://sendhiiv.com/docs",
    icon: <Globe size={15} />,
    hint: "Returned in the v1 API info endpoint.",
  },
  {
    key: "stripeProductPrefix",
    label: "Stripe Product Name Prefix",
    placeholder: "Sendhiiv",
    icon: <CreditCard size={15} />,
    hint: 'Shown on Stripe checkout pages as "{prefix} Pro Plan".',
  },
  {
    key: "apiName",
    label: "API Display Name",
    placeholder: "Sendhiiv Email API",
    icon: <Key size={15} />,
    hint: "Returned as the api field in GET /api/v1.",
  },
];

const GlobalSettings = () => {
  const [platformSettings, setPlatformSettings] = useState({
    defaultSenderName: "",
    defaultSenderEmail: "",
    appBaseUrl: "",
    docsUrl: "",
    stripeProductPrefix: "",
    apiName: "",
  });
  const [toggles, setToggles] = useState({
    maintenanceMode: false,
    allowSignups: true,
  });
  const [integrations, setIntegrations] = useState({
    awsSes: false,
    stripe: false,
    paystack: false,
    mongodb: true,
  });
  const [emailProvider, setEmailProvider] = useState("resend");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/admin/settings"), api.get("/admin/stats")])
      .then(([settingsRes, statsRes]) => {
        const s = settingsRes.data;
        setPlatformSettings({
          defaultSenderName: s.defaultSenderName || "",
          defaultSenderEmail: s.defaultSenderEmail || "",
          appBaseUrl: s.appBaseUrl || "",
          docsUrl: s.docsUrl || "",
          stripeProductPrefix: s.stripeProductPrefix || "",
          apiName: s.apiName || "",
        });
        setToggles({
          maintenanceMode: !!s.maintenanceMode,
          allowSignups: s.allowSignups !== false,
        });
        if (s.emailProvider) setEmailProvider(s.emailProvider);
        if (statsRes.data?.integrations)
          setIntegrations(statsRes.data.integrations);
      })
      .catch(() => {
        toast.error("Failed to load settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", {
        ...platformSettings,
        ...toggles,
        emailProvider,
      });
      toast.success("Settings saved successfully.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key) => {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    try {
      await api.put("/admin/settings", updated);
      toast.success(
        `${key === "maintenanceMode" ? "Maintenance mode" : "New signups"} ${updated[key] ? "enabled" : "disabled"}.`,
      );
    } catch {
      toast.error("Failed to update toggle.");
      setToggles(toggles); // revert
    }
  };

  return (
    <>
      <div className="d-page-header">
        <div>
          <h1>Global Settings</h1>
          <p>Platform-wide configuration and toggles</p>
        </div>
      </div>

      {/* ── Platform Defaults ─────────────────────────────────────── */}
      <div className="d-card" style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Zap size={18} /> Platform Defaults
        </h3>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            marginBottom: "1.5rem",
          }}
        >
          These values are used as live fallbacks across email sending, billing,
          and the public API. Changes take effect within 30 seconds of saving.
        </p>

        {loading ? (
          <p className="d-empty" style={{ margin: 0 }}>
            Loading…
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {FIELD_DEFS.map(({ key, label, placeholder, icon, hint }) => (
                <div className="d-field" key={key}>
                  <label
                    className="d-label"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {icon} {label}
                  </label>
                  <input
                    className="d-input"
                    value={platformSettings[key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setPlatformSettings((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                  <span
                    style={{
                      fontSize: "0.73rem",
                      color: "#94a3b8",
                      marginTop: "0.25rem",
                      display: "block",
                    }}
                  >
                    {hint}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="d-btn d-btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Save size={15} />
                {saving ? "Saving…" : "Save Platform Defaults"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Platform Toggles ──────────────────────────────────────── */}
      <div className="d-card" style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Settings size={18} /> Platform Controls
        </h3>

        {[
          {
            key: "maintenanceMode",
            title: "Maintenance Mode",
            desc: "When enabled, all users (except admins) will see a maintenance message.",
            icon: <Server size={18} />,
            danger: true,
          },
          {
            key: "allowSignups",
            title: "Allow New Signups",
            desc: "Disable this to prevent new users from registering on the platform.",
            icon: <Shield size={18} />,
            danger: true,
          },
        ].map((item) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 0",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <div style={{ color: "#ef4444", marginTop: 2 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {item.title}
                </div>
                <div
                  style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              style={{
                width: 48,
                height: 26,
                borderRadius: 999,
                background: toggles[item.key] ? "#f97316" : "#e2e8f0",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: toggles[item.key] ? 24 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* ── Email Provider ────────────────────────────────────────── */}
      <div className="d-card" style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Mail size={18} /> Email Provider
        </h3>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            marginBottom: "1.25rem",
          }}
        >
          Choose which service sends outgoing emails. Changes take effect
          immediately — no restart needed.
        </p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {[
            {
              value: "resend",
              label: "Resend",
              desc: "Resend only (current default)",
            },
            { value: "ses", label: "AWS SES", desc: "AWS SES only" },
            {
              value: "resend,ses",
              label: "Resend → SES fallback",
              desc: "Try Resend first, fall back to SES if it fails",
            },
            {
              value: "ses,resend",
              label: "SES → Resend fallback",
              desc: "Try SES first, fall back to Resend if it fails",
            },
          ].map((opt) => {
            const active = emailProvider === opt.value;
            return (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  padding: "0.85rem 1rem",
                  borderRadius: 10,
                  border: `1.5px solid ${active ? "#f97316" : "#e2e8f0"}`,
                  background: active ? "rgba(249,115,22,0.04)" : "#f8fafc",
                  cursor: "pointer",
                  transition: "border 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="emailProvider"
                  value={opt.value}
                  checked={active}
                  onChange={() => setEmailProvider(opt.value)}
                  style={{
                    accentColor: "#f97316",
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#64748b",
                      marginTop: 1,
                    }}
                  >
                    {opt.desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "1rem",
          }}
        >
          <button
            className="d-btn d-btn-primary"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await api.put("/admin/settings", { emailProvider });
                toast.success(`Email provider set to: ${emailProvider}`);
              } catch {
                toast.error("Failed to update provider.");
              } finally {
                setSaving(false);
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Save size={15} /> {saving ? "Saving…" : "Apply Provider"}
          </button>
        </div>
      </div>

      {/* ── Integration Status ────────────────────────────────────── */}
      <div className="d-card" style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <CreditCard size={18} /> Integration Status
        </h3>
        {loading ? (
          <p className="d-empty" style={{ margin: 0 }}>
            Loading status…
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {[
              {
                label: "AWS SES (Email Delivery)",
                ok: integrations.awsSes,
                errReason:
                  "Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in .env",
              },
              {
                label: "Stripe (USD Payments)",
                ok: integrations.stripe,
                errReason: "Needs STRIPE_SECRET_KEY in .env",
              },
              {
                label: "Paystack (NGN Payments)",
                ok: integrations.paystack,
                errReason: "Needs PAYSTACK_SECRET_KEY in .env",
              },
              {
                label: "MongoDB Atlas",
                ok: integrations.mongodb,
                errReason: "Not connected",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  borderRadius: 10,
                  background: item.ok
                    ? "rgba(16,185,129,0.05)"
                    : "rgba(245,158,11,0.05)",
                  border: `1px solid ${item.ok ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                }}
              >
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: item.ok ? "#10b981" : "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  {item.ok ? (
                    <>
                      <Check size={13} /> Configured
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} /> {item.errReason}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Danger Zone ───────────────────────────────────────────── */}
      <div
        className="d-card"
        style={{
          border: "1px solid rgba(239,68,68,0.3)",
          background: "rgba(239,68,68,0.02)",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertTriangle size={18} /> Danger Zone
        </h3>
        <p
          style={{
            fontSize: "0.82rem",
            color: "#64748b",
            marginBottom: "1rem",
          }}
        >
          These actions are irreversible. Proceed with caution.
        </p>
        <button
          className="d-btn d-btn-danger"
          onClick={() =>
            toast.error("Not implemented yet — connect to your backend first!")
          }
        >
          Purge All Inactive Users
        </button>
      </div>
    </>
  );
};

export default GlobalSettings;
