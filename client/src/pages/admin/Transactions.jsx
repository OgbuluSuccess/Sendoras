import React, { useState, useEffect } from "react";
import {
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import adminService from "../../services/admin";
import toast from "../../utils/toast";
import "../../styles/DashboardNew.css";

const statusColors = {
  success: "d-badge-success",
  pending: "d-badge-warning",
  failed: "d-badge-danger",
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, usd: 0, ngn: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await adminService.getAllTransactions();
      setTransactions(Array.isArray(data) ? data : []);

      const successful = (Array.isArray(data) ? data : []).filter(
        (t) => t.status === "success",
      );
      const usd = successful
        .filter((t) => t.currency === "USD")
        .reduce((a, b) => a + b.amount / 100, 0);
      const ngn = successful
        .filter((t) => t.currency === "NGN")
        .reduce((a, b) => a + b.amount / 100, 0);
      setStats({ total: successful.length, usd, ngn });
    } catch {
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-page-header">
        <div>
          <h1>Transactions & Revenue</h1>
          <p>All payment history across the platform</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="d-stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="d-card d-stat-card">
          <div className="d-stat-info">
            <div className="d-stat-label">Total Payments</div>
            <div className="d-stat-val">{stats.total}</div>
          </div>
          <div
            className="d-stat-icon"
            style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}
          >
            <CreditCard size={20} />
          </div>
        </div>
        <div className="d-card d-stat-card">
          <div className="d-stat-info">
            <div className="d-stat-label">USD Revenue</div>
            <div className="d-stat-val">${stats.usd.toFixed(2)}</div>
          </div>
          <div
            className="d-stat-icon"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
          >
            <ArrowUpRight size={20} />
          </div>
        </div>
        <div className="d-card d-stat-card">
          <div className="d-stat-info">
            <div className="d-stat-label">NGN Revenue</div>
            <div className="d-stat-val">₦{stats.ngn.toLocaleString()}</div>
          </div>
          <div
            className="d-stat-icon"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
          >
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="d-empty">
          <p>Loading transactions…</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="d-card">
          <div className="d-empty" style={{ padding: "3rem" }}>
            <div className="d-empty-icon">
              <CreditCard size={22} />
            </div>
            <h3>No transactions yet</h3>
            <p>Payments will appear here once users subscribe.</p>
          </div>
        </div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Provider</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {t.user?.name || "Unknown"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {t.user?.email}
                    </div>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{t.provider}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {t.plan || "—"}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {t.currency === "USD"
                      ? `$${(t.amount / 100).toFixed(2)}`
                      : `₦${(t.amount / 100).toLocaleString()}`}
                  </td>
                  <td>{t.currency}</td>
                  <td>
                    <span
                      className={`d-badge ${statusColors[t.status] || "d-badge-neutral"}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.82rem" }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default Transactions;
