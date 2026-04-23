import React, { useState, useEffect } from "react";
import { Shield, User, Trash2 } from "lucide-react";
import adminService from "../../services/admin";
import toast from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import "../../styles/DashboardNew.css";

const TIER_OPTIONS = ["free", "pro", "enterprise"];
const ROLE_OPTIONS = ["b2c", "b2b", "admin"];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({
    open: false,
    type: null,
    id: null,
    label: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const totalPages = Math.ceil(users.length / limit) || 1;
  const paginatedUsers = users.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const askConfirm = (type, id, label) =>
    setConfirm({ open: true, type, id, label });

  const executeConfirm = async () => {
    setActionLoading(true);
    const { type, id, label } = confirm;
    try {
      if (type === "role") {
        const user = users.find((u) => u._id === id);
        const newRole = user.role === "admin" ? "b2c" : "admin";
        await adminService.updateUser(id, { role: newRole });
        toast.success(`Role updated to "${newRole}".`);
        fetchUsers();
      } else if (type === "delete") {
        await adminService.deleteUser(id);
        setUsers((prev) => prev.filter((u) => u._id !== id));
        toast.success(`User "${label}" deleted.`);
      }
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, type: null, id: null, label: "" });
    }
  };

  const handleTierChange = async (id, tier) => {
    try {
      await adminService.updateUser(id, { tier });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, tier } : u)));
      toast.success(`Plan updated to "${tier}".`);
    } catch {
      toast.error("Failed to update plan.");
    }
  };

  return (
    <>
      <ConfirmModal
        open={confirm.open}
        title={confirm.type === "delete" ? "Delete User" : "Change User Role"}
        message={
          confirm.type === "delete"
            ? `Are you sure you want to permanently delete "${confirm.label}"? All their data will be removed.`
            : `Are you sure you want to change the role for "${confirm.label}"?`
        }
        confirmLabel={confirm.type === "delete" ? "Delete User" : "Change Role"}
        danger={confirm.type === "delete"}
        loading={actionLoading}
        onConfirm={executeConfirm}
        onCancel={() =>
          setConfirm({ open: false, type: null, id: null, label: "" })
        }
      />

      <div className="d-page-header">
        <div>
          <h1>User Management</h1>
          <p>View and manage all platform users</p>
        </div>
        <span
          className="d-badge d-badge-danger"
          style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
        >
          Admin
        </span>
      </div>

      {loading ? (
        <div className="d-empty">
          <p>Loading users…</p>
        </div>
      ) : (
        <>
          <div className="d-table-wrap">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {u.email}
                    </td>
                    <td>
                      <span
                        className={`d-badge ${u.role === "admin" ? "d-badge-danger" : "d-badge-neutral"}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <select
                        value={u.tier || "free"}
                        onChange={(e) =>
                          handleTierChange(u._id, e.target.value)
                        }
                        style={{
                          padding: "0.3rem 0.6rem",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        {TIER_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.82rem" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className={`d-btn d-btn-sm ${u.role === "admin" ? "d-btn-secondary" : "d-btn-primary"}`}
                          onClick={() => askConfirm("role", u._id, u.name)}
                          style={{ gap: "0.35rem", fontSize: "0.78rem" }}
                        >
                          {u.role === "admin" ? (
                            <>
                              <User size={13} /> Demote
                            </>
                          ) : (
                            <>
                              <Shield size={13} /> Make Admin
                            </>
                          )}
                        </button>
                        <button
                          className="d-btn d-btn-danger d-btn-sm"
                          onClick={() => askConfirm("delete", u._id, u.name)}
                          style={{ gap: "0.35rem" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
};

export default UserManagement;
