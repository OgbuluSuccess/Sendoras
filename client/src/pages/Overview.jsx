import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  MousePointerClick,
  TrendingUp,
  Activity,
  Plus,
  Clock,
  CheckCircle2,
  SendHorizonal,
  Zap,
  Users,
  Globe,
  Key,
  BarChart2,
  LifeBuoy,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import campaignService from "../services/campaigns";
import api from "../services/api";

const STATUS_BADGE = {
  sent: { cls: "d-badge-success", label: "Sent" },
  draft: { cls: "d-badge-neutral", label: "Draft" },
  sending: { cls: "d-badge-info", label: "Sending" },
  failed: { cls: "d-badge-danger", label: "Failed" },
  queued: { cls: "d-badge-warning", label: "Queued" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        padding: "0.75rem 1rem",
      }}
    >
      <p
        style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0 0 0.5rem" }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <p
          key={p.name}
          style={{
            color: p.color,
            fontSize: "0.82rem",
            margin: "0.2rem 0",
            fontWeight: 600,
          }}
        >
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// Build chart data from real campaigns — last 6 months
// Uses sentCount (delivered), recipientCount (attempted), failedCount — fields that are actually tracked
const buildChartData = (campaigns) => {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString("default", { month: "short" }),
      year: d.getFullYear(),
      monthIdx: d.getMonth(),
      sent: 0,
      delivered: 0,
      failed: 0,
    });
  }
  campaigns.forEach((c) => {
    if (c.status !== "sent" && c.status !== "Sent") return;
    const d = new Date(c.createdAt);
    const bucket = months.find(
      (m) => m.monthIdx === d.getMonth() && m.year === d.getFullYear(),
    );
    if (!bucket) return;
    bucket.sent += c.recipientCount || c.recipients?.length || 0;
    bucket.delivered += c.sentCount || 0;
    bucket.failed += c.failedCount || 0;
  });
  return months;
};

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
const pct = (n) => (n > 0 ? `${n.toFixed(1)}%` : "—");

const QuotaRow = ({ icon, label, value, valueColor }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        color: "#64748b",
        fontSize: "0.78rem",
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      {label}
    </div>
    <span
      style={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: valueColor ?? "#0f172a",
      }}
    >
      {value}
    </span>
  </div>
);

const Overview = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      campaignService.getCampaigns(),
      api
        .get("/auth/me")
        .then((r) => r.data)
        .catch(() => null),
    ])
      .then(([data, prof]) => {
        const list = Array.isArray(data) ? data : [];
        setAllCampaigns(list);
        setCampaigns(list.slice(0, 5));
        setProfile(prof);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Real aggregate stats from sent campaigns only
  const sentCampaigns = allCampaigns.filter((c) => c.status === "sent");
  const totalSent = sentCampaigns.reduce(
    (s, c) => s + (c.recipients?.length || 0),
    0,
  );
  const avgOpen = sentCampaigns.length
    ? sentCampaigns.reduce((s, c) => s + (c.analytics?.openRate || 0), 0) /
      sentCampaigns.length
    : 0;
  const avgClick = sentCampaigns.length
    ? sentCampaigns.reduce((s, c) => s + (c.analytics?.clickRate || 0), 0) /
      sentCampaigns.length
    : 0;
  const avgBounce = sentCampaigns.length
    ? sentCampaigns.reduce((s, c) => s + (c.analytics?.bounceRate || 0), 0) /
      sentCampaigns.length
    : 0;

  // Usage from profile (real plan data — now includes plan object from getMe)
  const emailsUsed = profile?.emailsUsed ?? profile?.emailsSentThisMonth ?? 0;
  const emailsLimit =
    profile?.emailsLimit ?? profile?.plan?.monthlyEmails ?? null;
  const emailsRemaining =
    profile?.emailsRemaining ??
    (emailsLimit !== null ? Math.max(0, emailsLimit - emailsUsed) : null);
  const planName = profile?.plan?.name ?? profile?.tier ?? null;
  const planSlug = profile?.plan?.slug ?? profile?.tier ?? "free";
  const planColor = profile?.plan?.color ?? "#f97316";
  const resetDate = profile?.emailsResetDate
    ? new Date(profile.emailsResetDate)
    : null;
  const usagePct = emailsLimit
    ? Math.min(100, Math.round((emailsUsed / emailsLimit) * 100))
    : 0;
  const usageBarColor =
    usagePct >= 90 ? "#ef4444" : usagePct >= 70 ? "#f59e0b" : "#f97316";

  const chartData = buildChartData(allCampaigns);
  const hasChartData = chartData.some((m) => m.sent > 0);

  const STAT_CARDS = [
    {
      label: "Total Sent",
      value: fmt(totalSent),
      icon: <SendHorizonal size={18} />,
      iconBg: "#fff7ed",
      iconColor: "#f97316",
    },
    {
      label: "Avg Open Rate",
      value: pct(avgOpen),
      icon: <Mail size={18} />,
      iconBg: "#f0fdf4",
      iconColor: "#10b981",
    },
    {
      label: "Avg Click Rate",
      value: pct(avgClick),
      icon: <MousePointerClick size={18} />,
      iconBg: "#eff6ff",
      iconColor: "#3b82f6",
    },
    {
      label: "Avg Bounce Rate",
      value: pct(avgBounce),
      icon: <Activity size={18} />,
      iconBg: "#fff1f2",
      iconColor: "#ef4444",
    },
  ];

  const subText =
    sentCampaigns.length > 0
      ? `from ${sentCampaigns.length} campaign${sentCampaigns.length > 1 ? "s" : ""}`
      : "No sent campaigns yet";

  return (
    <>
      {/* ── Stat Cards ── */}
      <div className="d-stats-grid">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="d-stat-card">
            <div className="d-stat-header">
              <span className="d-stat-label">{s.label}</span>
              <div
                className="d-stat-icon"
                style={{ background: s.iconBg, color: s.iconColor }}
              >
                {s.icon}
              </div>
            </div>
            <div className="d-stat-val">{s.value}</div>
            <div className="d-stat-delta" style={{ color: "#94a3b8" }}>
              {subText}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid: chart + sidebar ── */}
      <div className="d-grid-2-3" style={{ marginBottom: "1.5rem" }}>
        {/* Area Chart */}
        <div
          className="d-card"
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="d-card-header" style={{ marginBottom: "0.25rem" }}>
            <div>
              <p className="d-card-title">Email Performance</p>
              <p className="d-card-sub">
                Sent, delivered &amp; failed — last 6 months
              </p>
            </div>
            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {[
                { color: "#f97316", label: "Sent" },
                { color: "#10b981", label: "Delivered" },
                { color: "#ef4444", label: "Failed" },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {hasChartData ? (
            <div style={{ flex: 1, minHeight: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#f97316"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#ef4444"
                        stopOpacity={0.12}
                      />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    name="Sent"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#gSent)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    name="Delivered"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gDelivered)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    name="Failed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#gFailed)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="d-empty" style={{ flex: 1, minHeight: 220 }}>
              <Mail size={28} color="#cbd5e1" />
              <p
                style={{
                  color: "#94a3b8",
                  marginTop: "0.5rem",
                  fontSize: "0.85rem",
                }}
              >
                No data yet — send your first campaign to see performance
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Plan Usage — detailed breakdown */}
          <div className="d-card" style={{ padding: "1.25rem" }}>
            {/* Header */}
            <div className="d-card-header" style={{ marginBottom: "1rem" }}>
              <p className="d-card-title" style={{ margin: 0 }}>
                Plan Usage
              </p>
              {planName && (
                <span
                  className="d-badge"
                  style={{
                    background: planColor + "18",
                    color: planColor,
                    border: `1px solid ${planColor}40`,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {planName}
                </span>
              )}
            </div>

            {/* Email quota — big numbers */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "0.35rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Emails this month
                </span>
                {resetDate && (
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    Resets{" "}
                    {resetDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.35rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    letterSpacing: "-1px",
                    color: "#0f172a",
                  }}
                >
                  {emailsUsed.toLocaleString()}
                </span>
                {emailsLimit !== null && (
                  <span
                    style={{
                      fontSize: "0.95rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    / {emailsLimit.toLocaleString()}
                  </span>
                )}
              </div>
              {emailsLimit !== null ? (
                <>
                  <div
                    style={{
                      background: "#f1f5f9",
                      borderRadius: 999,
                      height: 7,
                      overflow: "hidden",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${usagePct}%`,
                        background: usageBarColor,
                        borderRadius: 999,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: usagePct >= 90 ? "#ef4444" : "#64748b",
                        fontWeight: usagePct >= 90 ? 700 : 400,
                      }}
                    >
                      {usagePct}% used
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#10b981",
                        fontWeight: 600,
                      }}
                    >
                      {(emailsRemaining ?? 0).toLocaleString()} remaining
                    </span>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0 }}>
                  Unlimited sending
                </p>
              )}
            </div>

            {/* Divider */}
            <div
              style={{ borderTop: "1px solid #f1f5f9", margin: "0.85rem 0" }}
            />

            {/* Plan feature rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
              }}
            >
              <QuotaRow
                icon={<SendHorizonal size={13} />}
                label="Monthly emails"
                value={
                  emailsLimit !== null
                    ? emailsLimit.toLocaleString()
                    : "Unlimited"
                }
              />
              {profile?.plan?.maxContactsPerList != null && (
                <QuotaRow
                  icon={<Users size={13} />}
                  label="Contacts per list"
                  value={profile.plan.maxContactsPerList.toLocaleString()}
                />
              )}
              {profile?.plan?.maxSenderIdentities != null && (
                <QuotaRow
                  icon={<Globe size={13} />}
                  label="Sender domains"
                  value={profile.plan.maxSenderIdentities.toLocaleString()}
                />
              )}
              {profile?.plan && (
                <QuotaRow
                  icon={<Key size={13} />}
                  label="API access"
                  value={profile.plan.apiAccess ? "Included" : "Not included"}
                  valueColor={profile.plan.apiAccess ? "#10b981" : "#94a3b8"}
                />
              )}
              {profile?.plan && (
                <QuotaRow
                  icon={<BarChart2 size={13} />}
                  label="Advanced analytics"
                  value={
                    profile.plan.analyticsAccess ? "Included" : "Not included"
                  }
                  valueColor={
                    profile.plan.analyticsAccess ? "#10b981" : "#94a3b8"
                  }
                />
              )}
              {profile?.plan?.support && (
                <QuotaRow
                  icon={<LifeBuoy size={13} />}
                  label="Support"
                  value={
                    profile.plan.support.charAt(0).toUpperCase() +
                    profile.plan.support.slice(1)
                  }
                />
              )}
            </div>

            <Link
              to="/billing"
              className="d-btn d-btn-primary"
              style={{
                marginTop: "1rem",
                width: "100%",
                justifyContent: "center",
              }}
            >
              {planSlug === "free" ? "Upgrade Plan" : "Manage Plan"}
            </Link>
          </div>

          {/* Quick actions */}
          <div className="d-card">
            <p className="d-card-title" style={{ marginBottom: "0.85rem" }}>
              Quick Actions
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <Link
                to="/campaigns/new"
                className="d-btn d-btn-primary"
                style={{ justifyContent: "center" }}
              >
                <Plus size={16} /> New Campaign
              </Link>
              <Link
                to="/validation"
                className="d-btn d-btn-secondary"
                style={{ justifyContent: "center" }}
              >
                <CheckCircle2 size={16} /> Validate Email
              </Link>
              <Link
                to="/contacts"
                className="d-btn d-btn-ghost"
                style={{ justifyContent: "center" }}
              >
                <TrendingUp size={16} /> Upload Contacts
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Campaigns ── */}
      <div className="d-card" style={{ padding: 0 }}>
        <div
          className="d-card-header"
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div>
            <p className="d-card-title">Recent Campaigns</p>
            <p className="d-card-sub">Your last 5 email campaigns</p>
          </div>
          <Link to="/campaigns" className="d-btn d-btn-ghost d-btn-sm">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="d-empty">
            <Clock size={24} style={{ color: "#94a3b8" }} />
            <p>Loading…</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="d-empty">
            <div className="d-empty-icon">
              <Mail size={24} />
            </div>
            <h3>No campaigns yet</h3>
            <p>Create your first email campaign to get started.</p>
            <Link to="/campaigns/new" className="d-btn d-btn-primary">
              <Plus size={16} /> New Campaign
            </Link>
          </div>
        ) : (
          <div
            className="d-table-wrap"
            style={{ borderRadius: 0, border: "none" }}
          >
            <table className="d-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                  return (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <span className={`d-badge ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td>{(c.recipients?.length ?? 0).toLocaleString()}</td>
                      <td>
                        {c.analytics?.openRate
                          ? `${c.analytics.openRate.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td>
                        {c.analytics?.clickRate
                          ? `${c.analytics.clickRate.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td style={{ color: "#64748b", fontSize: "0.82rem" }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Overview;
