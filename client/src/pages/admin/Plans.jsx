import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Star, X, Check, Power } from "lucide-react";
import api from "../../services/api";
import toast from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/DashboardNew.css";

const EMPTY_PLAN = {
  slug: "",
  name: "",
  description: "",
  priceMonthlyUSD: "",
  priceYearlyUSD: "",
  priceMonthlyNGN: "",
  monthlyEmails: 1000,
  maxContactsPerList: 500,
  maxSenderIdentities: 1,
  apiAccess: false,
  analyticsAccess: false,
  support: "community",
  isPopular: false,
  isActive: true,
  sortOrder: 0,
  color: "#f97316",
  features: "", // one feature per line in form, converted to array on save
};

const PlanModal = ({ plan, onClose, onSaved }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_PLAN,
    ...plan,
    features: Array.isArray(plan?.features) ? plan.features.join("\n") : "",
  }));
  const [saving, setSaving] = useState(false);
  const isEdit = !!plan?._id;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        priceMonthlyUSD: Number(form.priceMonthlyUSD),
        priceYearlyUSD: Number(form.priceYearlyUSD),
        priceMonthlyNGN: Number(form.priceMonthlyNGN),
        monthlyEmails: Number(form.monthlyEmails),
        maxContactsPerList: Number(form.maxContactsPerList),
        maxSenderIdentities: Number(form.maxSenderIdentities),
        sortOrder: Number(form.sortOrder),
      };
      if (isEdit) {
        const { data } = await api.put(`/admin/plans/${plan._id}`, payload);
        onSaved(data, "update");
        toast.success(`"${data.name}" plan updated!`);
      } else {
        const { data } = await api.post("/admin/plans", payload);
        onSaved(data, "create");
        toast.success(`"${data.name}" plan created!`);
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to save plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-modal-overlay" onClick={onClose}>
      <div
        className="d-modal"
        style={{ maxWidth: 600, maxHeight: "92vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-modal-header">
          <h2>{isEdit ? `Edit "${plan.name}"` : "Create New Plan"}</h2>
          <button className="d-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="d-form">
          <div className="d-grid-2">
            <div className="d-field">
              <label className="d-label">Plan Name *</label>
              <input
                className="d-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Business"
                required
              />
            </div>
            <div className="d-field">
              <label className="d-label">
                Slug *{" "}
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  (used in user.tier)
                </span>
              </label>
              <input
                className="d-input"
                value={form.slug}
                onChange={(e) =>
                  set("slug", e.target.value.toLowerCase().replace(/\s/g, "-"))
                }
                placeholder="e.g. business"
                required
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="d-field">
            <label className="d-label">Description</label>
            <input
              className="d-input"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description shown on pricing card"
            />
          </div>

          {/* Pricing */}
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#374151",
              marginBottom: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            Pricing
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
            }}
          >
            {[
              ["priceMonthlyUSD", "Monthly (USD $)"],
              ["priceYearlyUSD", "Yearly (USD $)"],
              ["priceMonthlyNGN", "Monthly (NGN ₦)"],
            ].map(([k, label]) => (
              <div className="d-field" key={k}>
                <label className="d-label">{label}</label>
                <input
                  className="d-input"
                  type="number"
                  min="0"
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Limits */}
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#374151",
              marginBottom: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            Limits
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
            }}
          >
            {[
              ["monthlyEmails", "Emails/Month"],
              ["maxContactsPerList", "Contacts/List"],
              ["maxSenderIdentities", "Sender Identities"],
            ].map(([k, label]) => (
              <div className="d-field" key={k}>
                <label className="d-label">{label}</label>
                <input
                  className="d-input"
                  type="number"
                  min="0"
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Access Toggles */}
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#374151",
              marginBottom: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            Feature Access
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              ["apiAccess", "API Access"],
              ["analyticsAccess", "Advanced Analytics"],
              ["isPopular", "⭐ Mark as Popular"],
              ["isActive", "✓ Active (visible)"],
            ].map(([k, label]) => (
              <label
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form[k]}
                  onChange={(e) => set(k, e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#f97316" }}
                />
                {label}
              </label>
            ))}
          </div>

          {/* Other */}
          <div className="d-grid-2" style={{ marginTop: "0.75rem" }}>
            <div className="d-field">
              <label className="d-label">Support Level</label>
              <select
                className="d-input"
                value={form.support}
                onChange={(e) => set("support", e.target.value)}
              >
                <option value="community">Community</option>
                <option value="priority">Priority</option>
                <option value="dedicated">Dedicated</option>
              </select>
            </div>
            <div className="d-field">
              <label className="d-label">Accent Color</label>
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  style={{
                    width: 40,
                    height: 36,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: 2,
                  }}
                />
                <input
                  className="d-input"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  style={{ fontFamily: "monospace" }}
                />
              </div>
            </div>
          </div>

          <div className="d-grid-2">
            <div className="d-field">
              <label className="d-label">Sort Order</label>
              <input
                className="d-input"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
              />
            </div>
            <div className="d-field">
              <label className="d-label">Stripe Price ID</label>
              <input
                className="d-input"
                value={form.stripePriceId || ""}
                onChange={(e) => set("stripePriceId", e.target.value)}
                placeholder="price_xxx"
              />
            </div>
          </div>

          <div className="d-field">
            <label className="d-label">
              Features{" "}
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                (one per line — commas in numbers are safe)
              </span>
            </label>
            <textarea
              className="d-input"
              rows={5}
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
              placeholder={`50,000 emails/month\nAPI access\nPriority support`}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              className="d-btn d-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="d-btn d-btn-primary"
              disabled={saving}
            >
              {saving ? (
                "Saving…"
              ) : isEdit ? (
                <>
                  <Check size={15} /> Save Changes
                </>
              ) : (
                <>
                  <Plus size={15} /> Create Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState(null); // null=closed, {}=new, {...plan}=edit
  const [confirm, setConfirm] = useState({ open: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/admin/plans");
      setPlans(data);
    } catch {
      toast.error("Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (plan, mode) => {
    if (mode === "create")
      setPlans((prev) =>
        [...prev, plan].sort((a, b) => a.sortOrder - b.sortOrder),
      );
    else setPlans((prev) => prev.map((p) => (p._id === plan._id ? plan : p)));
  };

  const handleToggleActive = async (plan) => {
    try {
      const { data } = await api.put(`/admin/plans/${plan._id}`, {
        isActive: !plan.isActive,
      });
      setPlans((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      toast.success(
        `"${data.name}" ${data.isActive ? "activated" : "deactivated"}.`,
      );
    } catch {
      toast.error("Failed to update plan.");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/plans/${confirm.id}`);
      setPlans((prev) => prev.filter((p) => p._id !== confirm.id));
      toast.success(`"${confirm.name}" plan deleted.`);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to delete plan.");
    } finally {
      setDeleting(false);
      setConfirm({ open: false, id: null, name: "" });
    }
  };

  return (
    <>
      <ConfirmModal
        open={confirm.open}
        title="Delete Plan"
        message={`Are you sure you want to delete the "${confirm.name}" plan? Users on this plan won't be affected, but new signups won't be able to select it.`}
        confirmLabel="Delete Plan"
        danger={true}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: "" })}
      />

      {modalPlan !== null && (
        <PlanModal
          plan={modalPlan}
          onClose={() => setModalPlan(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="d-page-header">
        <div>
          <h1>Plans & Pricing</h1>
          <p>Manage subscription tiers — changes go live instantly</p>
        </div>
        <button
          className="d-btn d-btn-primary"
          onClick={() => setModalPlan({})}
        >
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {loading ? (
        <div className="d-empty">
          <p>Loading plans…</p>
        </div>
      ) : (
        <>
          {/* Plan cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.25rem",
              marginBottom: "2rem",
            }}
          >
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="d-card"
                style={{
                  border: `2px solid ${plan.isActive ? plan.color + "33" : "#e2e8f0"}`,
                  opacity: plan.isActive ? 1 : 0.6,
                  position: "relative",
                  transition: "all 0.2s",
                }}
              >
                {plan.isPopular && (
                  <div
                    style={{
                      position: "absolute",
                      top: -1,
                      right: 16,
                      background: plan.color,
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "0 0 8px 8px",
                    }}
                  >
                    ⭐ POPULAR
                  </div>
                )}
                {!plan.isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "#e2e8f0",
                      color: "#64748b",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.5rem",
                      borderRadius: 999,
                    }}
                  >
                    INACTIVE
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: plan.color + "22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: plan.color,
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: "#0f172a",
                      }}
                    >
                      {plan.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        textTransform: "capitalize",
                      }}
                    >
                      /{plan.slug}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: plan.color,
                    }}
                  >
                    ${plan.priceMonthlyUSD}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    /mo USD
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    marginBottom: "0.75rem",
                    lineHeight: 1.8,
                  }}
                >
                  📧{" "}
                  {plan.monthlyEmails >= 999999
                    ? "Unlimited"
                    : plan.monthlyEmails.toLocaleString()}{" "}
                  emails
                  <br />
                  👥{" "}
                  {plan.maxContactsPerList >= 999999
                    ? "Unlimited"
                    : plan.maxContactsPerList.toLocaleString()}{" "}
                  contacts
                  <br />
                  🔑 API: {plan.apiAccess ? "✓" : "✗"} &nbsp;·&nbsp; Support:{" "}
                  {plan.support}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="d-btn d-btn-secondary d-btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setModalPlan(plan)}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    className="d-btn d-btn-sm"
                    style={{
                      background: plan.isActive ? "#f1f5f9" : "#dcfce7",
                      color: plan.isActive ? "#64748b" : "#16a34a",
                    }}
                    onClick={() => handleToggleActive(plan)}
                    title={plan.isActive ? "Deactivate" : "Activate"}
                  >
                    <Power size={13} />
                  </button>
                  <button
                    className="d-btn d-btn-danger d-btn-sm"
                    onClick={() =>
                      setConfirm({ open: true, id: plan._id, name: plan.name })
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary table */}
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Slug</th>
                  <th>USD/mo</th>
                  <th>NGN/mo</th>
                  <th>Emails</th>
                  <th>Contacts</th>
                  <th>API</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 700, color: p.color }}>
                      {p.name}
                    </td>
                    <td>
                      <code
                        style={{
                          background: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: "0.78rem",
                        }}
                      >
                        {p.slug}
                      </code>
                    </td>
                    <td>${p.priceMonthlyUSD}</td>
                    <td>₦{p.priceMonthlyNGN?.toLocaleString()}</td>
                    <td>
                      {p.monthlyEmails >= 999999
                        ? "∞"
                        : p.monthlyEmails.toLocaleString()}
                    </td>
                    <td>
                      {p.maxContactsPerList >= 999999
                        ? "∞"
                        : p.maxContactsPerList.toLocaleString()}
                    </td>
                    <td>
                      {p.apiAccess ? (
                        <Check size={14} style={{ color: "#10b981" }} />
                      ) : (
                        <X size={14} style={{ color: "#ef4444" }} />
                      )}
                    </td>
                    <td>
                      <span
                        className={`d-badge ${p.isActive ? "d-badge-success" : "d-badge-neutral"}`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default Plans;
