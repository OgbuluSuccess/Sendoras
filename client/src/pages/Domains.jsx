import React, { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
} from "lucide-react";
import domainService from "../services/domains";
import toast from "../utils/toast";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/DashboardNew.css";

// ── DNS record row ─────────────────────────────────────────────────────────
const CopyCell = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        maxWidth: 340,
      }}
    >
      <code
        style={{
          fontSize: "0.72rem",
          color: "#0f172a",
          wordBreak: "break-all",
          flex: 1,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {label ?? value}
      </code>
      <button
        onClick={copy}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: copied ? "#10b981" : "#94a3b8",
          padding: "0.2rem",
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
};

const RecordRow = ({ type, name, displayName, value, ttl, priority }) => (
  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
    <td style={{ padding: "0.6rem 0.75rem" }}>
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          padding: "0.15rem 0.5rem",
          borderRadius: 4,
          background: type === "TXT" ? "#fef3c7" : "#dbeafe",
          color: type === "TXT" ? "#92400e" : "#1e40af",
        }}
      >
        {type}
      </span>
    </td>
    <td style={{ padding: "0.6rem 0.75rem" }}>
      <CopyCell value={name} label={displayName} />
    </td>
    <td style={{ padding: "0.6rem 0.75rem" }}>
      <CopyCell value={value} />
    </td>
    <td
      style={{
        padding: "0.6rem 0.75rem",
        color: "#94a3b8",
        fontSize: "0.72rem",
      }}
    >
      {ttl || "Auto"}
    </td>
  </tr>
);

// ── Status badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status, label }) => {
  const cfg = {
    verified: {
      bg: "#dcfce7",
      color: "#15803d",
      icon: <CheckCircle2 size={12} />,
      text: label || "Verified",
    },
    pending: {
      bg: "#fef9c3",
      color: "#a16207",
      icon: <Clock size={12} />,
      text: label || "Pending",
    },
    failed: {
      bg: "#fee2e2",
      color: "#dc2626",
      icon: <XCircle size={12} />,
      text: label || "Failed",
    },
    not_added: {
      bg: "#f1f5f9",
      color: "#94a3b8",
      icon: null,
      text: "Not set up",
    },
    not_started: {
      bg: "#f1f5f9",
      color: "#94a3b8",
      icon: null,
      text: "Not started",
    },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.72rem",
        fontWeight: 600,
        padding: "0.2rem 0.55rem",
        borderRadius: 99,
        background: c.bg,
        color: c.color,
      }}
    >
      {c.icon}
      {c.text}
    </span>
  );
};

// ── Provider section (collapsible DNS records table) ───────────────────────
const ProviderSection = ({ icon, title, status, records, badge }) => {
  const [open, setOpen] = useState(status !== "verified");
  if (!records || records.length === 0) return null;

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: "0.75rem",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          background: "#f8fafc",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontWeight: 600,
            fontSize: "0.85rem",
            color: "#334155",
          }}
        >
          {icon}
          {title}
          {badge && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "0.1rem 0.45rem",
                borderRadius: 99,
                background: "#e0f2fe",
                color: "#0369a1",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <StatusBadge status={status} />
          {open ? (
            <ChevronUp size={16} color="#94a3b8" />
          ) : (
            <ChevronDown size={16} color="#94a3b8" />
          )}
        </div>
      </button>
      {open && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Type", "Name / Host", "Value / Points to", "TTL"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.4rem 0.75rem",
                        textAlign: "left",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <RecordRow key={i} {...r} />
              ))}
            </tbody>
          </table>
          <div
            style={{
              padding: "0.65rem 1rem",
              fontSize: "0.72rem",
              color: "#64748b",
              background: "#f8fafc",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            💡 DNS changes can take up to <strong>48 hours</strong> to
            propagate. Click <strong>"Check Status"</strong> to refresh.
          </div>
        </div>
      )}
    </div>
  );
};

// ── Domain card ─────────────────────────────────────────────────────────────
const DomainCard = ({ domain, onDelete, onCheck }) => {
  const [checking, setChecking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [providerErrors, setProviderErrors] = useState(null);

  const doCheck = async () => {
    setChecking(true);
    try {
      const updated = await domainService.checkDomain(domain._id);
      onCheck(updated);
      if (updated.status === "verified")
        toast.success(`✅ ${domain.domain} is fully verified!`);
      else toast(`Still pending — DNS may take a few hours`, { icon: "⏳" });
    } catch {
      toast.error("Check failed. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const doRegenerate = async () => {
    setRegenerating(true);
    setProviderErrors(null);
    const tid = toast.loading("Connecting to email providers…");
    try {
      const updated = await domainService.regenerateDomain(domain._id);
      onCheck(updated);

      if (updated._success) {
        toast.success(
          "DNS records generated! Add them to your registrar below.",
          { id: tid, duration: 5000 },
        );
      } else {
        const errParts = [];
        if (updated._providerErrors?.ses)
          errParts.push(`Primary: ${updated._providerErrors.ses}`);
        if (updated._providerErrors?.resend)
          errParts.push(`Secondary: ${updated._providerErrors.resend}`);
        setProviderErrors(errParts);
        toast.error("Could not reach sending servers. See details below.", {
          id: tid,
          duration: 6000,
        });
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.msg || "Server error. Check the console.",
        { id: tid },
      );
    } finally {
      setRegenerating(false);
    }
  };

  // Build SES records from tokens
  const sesRecords = [];
  if (domain.verificationToken) {
    sesRecords.push({
      type: "TXT",
      name: `_amazonses.${domain.domain}`,
      value: domain.verificationToken,
    });
  }
  (domain.dkimTokens || []).forEach((t) => {
    sesRecords.push({
      type: "CNAME",
      name: `${t}._domainkey.${domain.domain}`,
      value: `${t}.dkim.amazonses.com`,
    });
  });

  // SPF record — required by Yahoo & Gmail bulk sender policy
  const spfRecords = [
    {
      type: "TXT",
      name: domain.domain,
      value: "v=spf1 include:amazonses.com ~all",
      ttl: "Auto",
    },
  ];

  // Build Resend records — filter out SPF TXT rows (shown in dedicated SPF section)
  const resendRecords = (domain.resendRecords || [])
    .filter(
      (r) =>
        !(
          (r.type === "TXT" || r.record_type === "TXT") &&
          typeof r.value === "string" &&
          r.value.startsWith("v=spf1")
        ),
    )
    .map((r) => ({
      type: r.type || r.record_type,
      name: r.name,
      // Mask provider name in display; copy value remains the real DNS selector
      displayName:
        typeof r.name === "string"
          ? r.name.replace(/resend\._domainkey/gi, "mail._domainkey")
          : r.name,
      value: r.value,
      ttl: r.ttl,
    }));

  const hasSes = sesRecords.length > 0;
  const hasResend = resendRecords.length > 0;
  const hasRecords = hasSes || hasResend;

  // Build DMARC record
  const dmarcRecords = [
    {
      type: "TXT",
      name: `_dmarc.${domain.domain}`,
      value: `v=DMARC1; p=none; rua=mailto:dmarc-reports@${domain.domain}`,
      ttl: "Auto",
    },
  ];

  return (
    <div className="d-card" style={{ marginBottom: "1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Globe size={18} color="#64748b" />
          </div>
          <div>
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "#0f172a",
                margin: 0,
              }}
            >
              {domain.domain}
            </p>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: 0 }}>
              Added {new Date(domain.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div
          className="domain-card-actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          <StatusBadge
            status={domain.status}
            label={domain.status === "verified" ? "✓ Active" : undefined}
          />
          {hasRecords && (
            <button
              className="d-btn d-btn-secondary d-btn-sm"
              onClick={doCheck}
              disabled={checking}
              style={{ gap: "0.35rem" }}
            >
              <RefreshCw size={13} className={checking ? "spin" : ""} />
              {checking ? "Checking…" : "Check Status"}
            </button>
          )}
          <button
            className="d-btn d-btn-danger d-btn-sm"
            onClick={() => onDelete(domain._id, domain.domain)}
            style={{ gap: "0.35rem" }}
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      </div>

      {/* ── No records yet state ─────────────────────────────────────── */}
      {!hasRecords && (
        <div>
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 700,
                  color: "#c2410c",
                  margin: "0 0 0.2rem",
                  fontSize: "0.85rem",
                }}
              >
                ⚠️ DNS records not generated yet
              </p>
              <p style={{ fontSize: "0.78rem", color: "#92400e", margin: 0 }}>
                Could not reach email providers when this domain was added.
                Click below to retry.
              </p>
            </div>
            <button
              className="d-btn d-btn-primary"
              onClick={doRegenerate}
              disabled={regenerating}
              style={{
                background: "#f97316",
                whiteSpace: "nowrap",
                gap: "0.4rem",
              }}
            >
              <RefreshCw size={14} className={regenerating ? "spin" : ""} />
              {regenerating ? "Connecting…" : "Generate DNS Records"}
            </button>
          </div>
          {providerErrors && providerErrors.length > 0 && (
            <div
              style={{
                marginTop: "0.5rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "0.75rem 1rem",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: "#dc2626",
                  margin: "0 0 0.35rem",
                }}
              >
                Provider errors:
              </p>
              {providerErrors.map((e, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "0.75rem",
                    color: "#b91c1c",
                    margin: "0.15rem 0",
                    fontFamily: "monospace",
                  }}
                >
                  {e}
                </p>
              ))}
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "#94a3b8",
                  margin: "0.5rem 0 0",
                }}
              >
                💡 Contact support if this problem persists.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Has records — show guidance + tables ────────────────────── */}
      {hasRecords && domain.status !== "verified" && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            padding: "0.85rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.8rem",
            color: "#166534",
          }}
        >
          <p style={{ fontWeight: 700, margin: "0 0 0.3rem" }}>
            📋 Next Step: Add these DNS records
          </p>
          <p style={{ margin: 0, color: "#15803d" }}>
            Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.),
            find <strong>DNS settings</strong> for{" "}
            <strong>{domain.domain}</strong>, and add the records below exactly
            as shown. Then click <strong>"Check Status"</strong>.
          </p>
        </div>
      )}

      {/* Hide per-provider status from customers */}

      {hasSes && (
        <ProviderSection
          icon={<Mail size={15} color="#64748b" />}
          title="Email Authentication Records"
          status={domain.sesStatus || "pending"}
          records={sesRecords}
          badge={hasResend ? "1 of 2" : null}
        />
      )}

      {hasResend && (
        <ProviderSection
          icon={<Mail size={15} color="#64748b" />}
          title="Sending Records"
          status={domain.resendStatus || "pending"}
          records={resendRecords}
          badge={hasSes ? "2 of 2" : null}
        />
      )}

      {hasRecords && (
        <ProviderSection
          icon={<Globe size={15} color="#64748b" />}
          title="SPF Record (Yahoo & Gmail Required)"
          status={domain.spfStatus || "pending"}
          records={spfRecords}
          badge="Required"
        />
      )}

      {hasRecords && (
        <div
          style={{
            padding: "0 0 0.5rem",
            fontSize: "0.72rem",
            color: "#64748b",
          }}
        >
          ⚠️ If you already have a TXT record starting with <code>v=spf1</code>{" "}
          on this domain, <strong>do not add a second one</strong>. Instead, add{" "}
          <code>include:amazonses.com</code> into your existing SPF record.
        </div>
      )}

      {hasRecords && (
        <ProviderSection
          icon={<Globe size={15} color="#64748b" />}
          title="Anti-Spam Policy (DMARC)"
          status={domain.dmarcStatus || "pending"}
          records={dmarcRecords}
          badge="Required"
        />
      )}

      {domain.status === "verified" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            color: "#15803d",
            marginTop: "0.25rem",
          }}
        >
          <CheckCircle2 size={16} /> Domain verified! Emails from{" "}
          <strong>{domain.domain}</strong> are ready to send.
        </div>
      )}
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────
const Domains = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const data = await domainService.getDomains();
      setDomains(data);
    } catch {
      toast.error("Failed to load domains.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const d = newDomain
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!d) return;
    setAdding(true);
    const tid = toast.loading(`Setting up ${d}…`);
    try {
      const created = await domainService.addDomain(d);
      setDomains((prev) => [created, ...prev]);
      setNewDomain("");
      setShowAdd(false);
      toast.success(`${d} added! Now add the DNS records shown below.`, {
        id: tid,
        duration: 5000,
      });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to add domain.", {
        id: tid,
      });
    } finally {
      setAdding(false);
    }
  };

  const handleCheck = (updated) => {
    setDomains((prev) =>
      prev.map((d) => (d._id === updated._id ? updated : d)),
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await domainService.deleteDomain(deleteTarget.id);
      setDomains((prev) => prev.filter((d) => d._id !== deleteTarget.id));
      toast.success(`${deleteTarget.domain} removed.`);
    } catch {
      toast.error("Failed to remove domain.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <ConfirmModal
        open={!!deleteTarget}
        title="Remove Domain"
        message={`Remove "${deleteTarget?.domain}"? DNS records you added will no longer be used for sending.`}
        confirmLabel="Remove"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="d-page-header">
        <div>
          <h1>Custom Domains</h1>
          <p>
            Send emails from your own domain — builds trust and improves
            deliverability
          </p>
        </div>
        <button
          className="d-btn d-btn-primary"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={16} /> Add Domain
        </button>
      </div>

      {/* How it works banner */}
      {domains.length === 0 && !loading && (
        <div
          className="d-card"
          style={{
            marginBottom: "1.25rem",
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            border: "1px solid #bae6fd",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#0369a1",
              marginBottom: "0.75rem",
            }}
          >
            🚀 How to set up your domain in 3 steps
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {[
              {
                n: "1",
                title: "Enter your domain",
                desc: "Type your business domain e.g. acme.com",
              },
              {
                n: "2",
                title: "Add DNS records",
                desc: "We'll show you exactly which records to paste into your registrar",
              },
              {
                n: "3",
                title: "Verify & send",
                desc: 'Click "Check Status" — once verified, start sending instantly',
              },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#0284c7",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {s.n}
                </span>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      color: "#0c4a6e",
                      margin: "0 0 0.15rem",
                    }}
                  >
                    {s.title}
                  </p>
                  <p
                    style={{ fontSize: "0.76rem", color: "#0369a1", margin: 0 }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain list */}
      {loading ? (
        <div className="d-empty">
          <p>Loading domains…</p>
        </div>
      ) : domains.length === 0 ? (
        <div className="d-card">
          <div className="d-empty" style={{ padding: "3rem" }}>
            <div className="d-empty-icon">
              <Globe size={22} />
            </div>
            <h3>No domains yet</h3>
            <p>Add your business domain to start sending emails from it.</p>
            <button
              className="d-btn d-btn-primary"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={16} /> Add Your First Domain
            </button>
          </div>
        </div>
      ) : (
        domains.map((d) => (
          <DomainCard
            key={d._id}
            domain={d}
            onDelete={(id, domain) => setDeleteTarget({ id, domain })}
            onCheck={handleCheck}
          />
        ))
      )}

      {/* Add Domain Modal */}
      {showAdd && (
        <div className="d-modal-overlay" onClick={() => setShowAdd(false)}>
          <div
            className="d-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className="d-modal-header">
              <h2>Add a Domain</h2>
              <button
                className="d-modal-close"
                onClick={() => setShowAdd(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="d-form">
              <div className="d-field">
                <label className="d-label">
                  Your Domain <span className="req">*</span>
                </label>
                <input
                  className="d-input"
                  type="text"
                  placeholder="acme.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  autoFocus
                  required
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginTop: "0.3rem",
                  }}
                >
                  Enter just the domain name — no https:// or www.
                </p>
              </div>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: "0.85rem 1rem",
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginBottom: "0.5rem",
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    color: "#334155",
                    margin: "0 0 0.3rem",
                  }}
                >
                  What happens next:
                </p>
                <ol
                  style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.8 }}
                >
                  <li>We generate your unique DNS records</li>
                  <li>You add them to your registrar (takes ~2 min)</li>
                  <li>
                    Click "Check Status" — usually verifies within 1-24 hrs
                  </li>
                </ol>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="d-btn d-btn-secondary"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="d-btn d-btn-primary"
                  disabled={adding}
                >
                  <Globe size={15} />{" "}
                  {adding ? "Setting up…" : "Generate DNS Records"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Domains;
