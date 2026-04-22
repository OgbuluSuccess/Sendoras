import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Zap, CreditCard, ArrowUpRight } from "lucide-react";
import billingService from "../services/billing";
import authService from "../services/auth";
import toast from "../utils/toast";
import "../styles/DashboardNew.css";

const formatLimit = (value, unit) => {
  if (value == null) return null;
  if (value >= 999999) return `Unlimited ${unit}`;
  return `${value.toLocaleString()} ${unit}`;
};

const normalizeFeatures = (features = []) => {
  const normalized = [];

  for (let index = 0; index < features.length; index += 1) {
    const current = String(features[index] || "").trim();
    const next = String(features[index + 1] || "").trim();

    if (/^\d+$/.test(current) && /^\d{3}\b/.test(next)) {
      normalized.push(`${current},${next}`);
      index += 1;
      continue;
    }

    if (current) normalized.push(current);
  }

  return normalized;
};

const buildPlanFeatures = (plan) => {
  const derived = [
    formatLimit(plan.monthlyEmails, "emails / month"),
    formatLimit(plan.maxContactsPerList, "contacts"),
    plan.apiAccess ? "API access" : null,
    plan.analyticsAccess ? "Advanced analytics" : "Basic analytics",
    plan.support
      ? `${plan.support.charAt(0).toUpperCase()}${plan.support.slice(1)} support`
      : null,
  ].filter(Boolean);

  const configured = normalizeFeatures(plan.features);
  const uniqueFeatures = [...configured];

  derived.forEach((feature) => {
    if (
      !uniqueFeatures.some(
        (item) => item.toLowerCase() === feature.toLowerCase(),
      )
    ) {
      uniqueFeatures.push(feature);
    }
  });

  return uniqueFeatures;
};

const formatPlanPrice = (plan) => {
  const amount = Number(plan.priceMonthlyUSD || 0);
  return `$${amount.toLocaleString()}`;
};

const Billing = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [loading, setLoading] = useState(null); // plan id being processed
  const [searchParams] = useSearchParams();

  // Always fetch fresh user data on mount so plan changes made by admin are reflected immediately
  useEffect(() => {
    authService
      .refreshUser()
      .then((freshUser) => {
        if (freshUser) setUser(freshUser);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get("success")) {
      toast.success("Payment successful! Your plan has been upgraded.");
      authService
        .refreshUser()
        .then((freshUser) => {
          if (freshUser) setUser(freshUser);
        })
        .catch(() => {});
    }
    if (searchParams.get("canceled")) toast.error("Payment cancelled.");
  }, [searchParams]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await billingService.getPlans();
        setPlans(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load billing plans.");
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleStripe = async (planId) => {
    setLoading(planId);
    try {
      const { url } = await billingService.createStripeSession(planId);
      window.location.href = url;
    } catch {
      toast.error("Failed to start Stripe checkout");
      setLoading(null);
    }
  };

  const handlePaystack = async (planId) => {
    setLoading(planId);
    try {
      const { authorization_url } =
        await billingService.initializePaystack(planId);
      window.location.href = authorization_url;
    } catch {
      toast.error("Failed to start Paystack checkout");
      setLoading(null);
    }
  };

  const currentTier = user?.tier || "free";

  return (
    <>
      <div className="d-page-header">
        <div>
          <h1>Billing & Plans</h1>
          <p>Manage your subscription and upgrade your plan</p>
        </div>
      </div>

      {/* Current plan banner */}
      <div
        className="d-card"
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: "#fff7ed",
          border: "1px solid #fed7aa",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            background: "#f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Zap size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}
          >
            Current Plan:{" "}
            <span style={{ color: "#f97316", textTransform: "uppercase" }}>
              {currentTier}
            </span>
          </div>
          <div style={{ fontSize: "0.82rem", color: "#92400e" }}>
            You are currently on the {currentTier} tier.
          </div>
        </div>
        <div
          className="d-badge d-badge-primary"
          style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
        >
          Active
        </div>
      </div>

      {/* Plan cards */}
      <div className="d-grid-3">
        {plansLoading ? (
          <div
            className="d-card"
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div
            className="d-card"
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            No active plans available.
          </div>
        ) : (
          plans.map((plan) => {
            const isCurrent = currentTier === plan.slug;
            const features = buildPlanFeatures(plan);

            return (
              <div
                key={plan._id || plan.slug}
                className="d-card"
                style={{
                  position: "relative",
                  border: plan.isPopular
                    ? `2px solid ${plan.color || "#f97316"}`
                    : undefined,
                  overflow: "hidden",
                }}
              >
                {plan.isPopular && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: plan.color || "#f97316",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.8rem",
                      borderBottomLeftRadius: 10,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: plan.color || "#f97316",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {plan.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#64748b",
                      marginBottom: "1rem",
                    }}
                  >
                    {plan.description || "Flexible plan for your sending needs"}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "2.2rem",
                        fontWeight: 900,
                        letterSpacing: "-1.5px",
                        color: "#0f172a",
                      }}
                    >
                      {formatPlanPrice(plan)}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      /month
                    </span>
                  </div>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.86rem",
                        color: "#334155",
                      }}
                    >
                      <Check
                        size={15}
                        style={{ color: "#10b981", flexShrink: 0 }}
                      />{" "}
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    className="d-btn d-btn-secondary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      cursor: "default",
                    }}
                    disabled
                  >
                    Current Plan
                  </button>
                ) : Number(plan.priceMonthlyUSD || 0) <= 0 ? (
                  <button
                    className="d-btn d-btn-secondary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      cursor: "default",
                    }}
                    disabled
                  >
                    Included
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      className="d-btn d-btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => handleStripe(plan.slug)}
                      disabled={loading === plan.slug}
                    >
                      <CreditCard size={15} />
                      {loading === plan.slug
                        ? "Redirecting…"
                        : "Pay with Stripe"}
                    </button>
                    <button
                      className="d-btn d-btn-secondary"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => handlePaystack(plan.slug)}
                      disabled={loading === plan.slug}
                    >
                      <ArrowUpRight size={15} />
                      Pay with Paystack
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default Billing;
