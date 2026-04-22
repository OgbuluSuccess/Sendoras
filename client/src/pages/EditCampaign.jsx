import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Send,
  Download,
  Upload,
  Link2,
  AlertCircle,
  Eye,
  Code,
} from "lucide-react";
import toast from "../utils/toast";
import campaignService from "../services/campaigns";
import listService from "../services/lists";
import { importFromDriveUrl, extractDriveFileId } from "../utils/driveImport";
import { APP_NAME, APP_DOMAIN } from "../config/brand";
import "../styles/DashboardNew.css";

const EditCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    sender: "",
    content: "",
  });

  // Recipients state
  const [recipientSource, setRecipientSource] = useState("keep"); // 'keep' | 'upload' | 'list'
  const [recipients, setRecipients] = useState([]);
  const [fileName, setFileName] = useState("");
  const [userLists, setUserLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  // Content tab: 'code' | 'preview'
  const [contentTab, setContentTab] = useState("code");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [data, lists] = await Promise.all([
          campaignService.getCampaign(id),
          listService.getLists(),
        ]);
        setCampaign(data);
        setFormData({
          name: data.name || "",
          subject: data.subject || "",
          sender: data.sender || "",
          content: data.content || "",
        });
        setUserLists(lists);
      } catch {
        toast.error("Failed to load campaign.");
        navigate("/campaigns");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setDriveUrl("");
    const reader = new FileReader();
    const tid = toast.loading("Parsing fileâ€¦");
    reader.onload = async (evt) => {
      try {
        const xlsx = await import("xlsx");
        const data = new Uint8Array(evt.target.result);
        const wb = xlsx.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!rows || rows.length < 2)
          return toast.error("File is empty", { id: tid });
        const headers = rows[0].map((h) => String(h).toLowerCase().trim());
        const emailIdx = headers.findIndex(
          (h) => h === "email" || h.includes("email"),
        );
        const firstIdx = headers.findIndex((h) => h.includes("first"));
        const lastIdx = headers.findIndex((h) => h.includes("last"));
        if (emailIdx === -1)
          return toast.error('No "email" column found', { id: tid });
        const parsed = rows
          .slice(1)
          .filter((r) => r[emailIdx] && String(r[emailIdx]).trim())
          .map((r) => ({
            email: String(r[emailIdx]).trim(),
            firstName: firstIdx > -1 ? String(r[firstIdx] || "").trim() : "",
            lastName: lastIdx > -1 ? String(r[lastIdx] || "").trim() : "",
          }));
        setRecipients(parsed);
        toast.success(`${parsed.length} recipients loaded`, { id: tid });
      } catch {
        toast.error("Failed to parse file", { id: tid });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDriveImport = async () => {
    if (!extractDriveFileId(driveUrl))
      return toast.error("Not a valid Google Drive link.");
    const tid = toast.loading("Fetching from Google Driveâ€¦");
    try {
      const parsed = await importFromDriveUrl(driveUrl);
      setRecipients(parsed);
      setFileName(`Google Drive (${parsed.length} contacts)`);
      toast.success(`${parsed.length} recipients loaded from Drive`, {
        id: tid,
      });
    } catch (error) {
      toast.error(
        error.message === "PRIVATE_FILE"
          ? "File is private. Share â†’ Anyone with the link â†’ Viewer."
          : error.message || "Failed to import from Drive",
        { id: tid },
      );
    }
  };

  const handleDownloadSample = async (e) => {
    e.preventDefault();
    try {
      const xlsx = await import("xlsx");
      const ws = xlsx.utils.json_to_sheet([
        { email: "john@example.com", firstName: "John", lastName: "Doe" },
        { email: "jane@example.com", firstName: "Jane", lastName: "Smith" },
      ]);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Recipients");
      xlsx.writeFile(wb, `${APP_NAME.toLowerCase()}_recipient_sample.xlsx`);
      toast.success("Sample downloaded!");
    } catch {
      toast.error("Failed to download sample.");
    }
  };

  const buildPayload = () => {
    const payload = { ...formData };
    if (recipientSource === "upload") payload.recipients = recipients;
    else if (recipientSource === "list") payload.listId = selectedListId;
    return payload;
  };

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.subject ||
      !formData.sender ||
      !formData.content
    )
      return toast.error("Please fill in all required fields.");
    if (recipientSource === "upload" && recipients.length === 0)
      return toast.error("Please upload a recipient list.");
    if (recipientSource === "list" && !selectedListId)
      return toast.error("Please select a contact list.");
    setSaving(true);
    const tid = toast.loading("Saving changesâ€¦");
    try {
      await campaignService.updateCampaign(id, buildPayload());
      toast.success("Campaign updated!", { id: tid });
      navigate("/campaigns");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to save.", { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (
      !formData.name ||
      !formData.subject ||
      !formData.sender ||
      !formData.content
    )
      return toast.error("Please fill in all required fields.");
    if (recipientSource === "upload" && recipients.length === 0)
      return toast.error("Please upload a recipient list.");
    if (recipientSource === "list" && !selectedListId)
      return toast.error("Please select a contact list.");
    setSaving(true);
    const tid = toast.loading("Saving and sendingâ€¦");
    try {
      await campaignService.updateCampaign(id, buildPayload());
      await campaignService.resendCampaign(id);
      toast.success("Campaign saved and re-queued!", { id: tid });
      navigate("/campaigns");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed.", { id: tid });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-empty" style={{ marginTop: "4rem" }}>
        <p>Loading campaignâ€¦</p>
      </div>
    );
  }

  const isSentOrFailed =
    campaign?.status === "Sent" || campaign?.status === "Failed";

  return (
    <>
      {/* Page header */}
      <div className="d-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="d-btn d-btn-ghost d-btn-sm"
            onClick={() => navigate("/campaigns")}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>Edit Campaign</h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
              Editing: <strong>{campaign?.name}</strong>{" "}
              <span style={{ color: "#94a3b8" }}>Â· {campaign?.status}</span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="d-btn d-btn-secondary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} /> Save
          </button>
          {isSentOrFailed && (
            <button
              className="d-btn d-btn-primary"
              onClick={handleSaveAndSend}
              disabled={saving}
            >
              <Send size={16} /> Save & Resend
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="d-grid-2-3" style={{ alignItems: "start" }}>
        {/* Left â€” form fields */}
        <div className="d-card">
          <p className="d-card-title" style={{ marginBottom: "1.25rem" }}>
            Campaign Details
          </p>
          <div className="d-form">
            <div className="d-field">
              <label className="d-label">
                Campaign Name <span className="req">*</span>
              </label>
              <input
                className="d-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Monthly Newsletter"
              />
            </div>
            <div className="d-field">
              <label className="d-label">
                Email Subject <span className="req">*</span>
              </label>
              <input
                className="d-input"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g. You won't believe this updateâ€¦"
              />
            </div>
            <div className="d-field">
              <label className="d-label">
                Sender Name / Email <span className="req">*</span>
              </label>
              <input
                className="d-input"
                type="text"
                name="sender"
                value={formData.sender}
                onChange={handleInputChange}
                placeholder={`e.g. John from ${APP_NAME} <john@${APP_DOMAIN}>`}
              />
            </div>

            {/* Recipients */}
            <div className="d-field">
              <label className="d-label">Recipients</label>
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  flexWrap: "wrap",
                  marginBottom: "0.75rem",
                }}
              >
                {[
                  { val: "keep", label: "Keep existing" },
                  { val: "upload", label: "Upload new CSV" },
                  { val: "list", label: "Select list" },
                ].map(({ val, label }) => (
                  <label
                    key={val}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    <input
                      type="radio"
                      name="recipientSource"
                      checked={recipientSource === val}
                      onChange={() => setRecipientSource(val)}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {recipientSource === "keep" && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  {campaign?.listId
                    ? `ðŸ“‹ ${campaign.listId.name || "Linked list"} (${campaign.listId.contactCount?.toLocaleString() || "?"} contacts)`
                    : `ðŸ“Ž ${campaign?.recipients?.length?.toLocaleString() || 0} uploaded recipients`}
                </div>
              )}

              {recipientSource === "upload" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <label className="d-label" style={{ margin: 0 }}>
                      Upload File
                    </label>
                    <button
                      onClick={handleDownloadSample}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#f97316",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      <Download size={13} /> Sample
                    </button>
                  </div>
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "1.5rem 1rem",
                      cursor: "pointer",
                      border: "2px dashed #e2e8f0",
                      borderRadius: "12px",
                      background: recipients.length ? "#f0fdf4" : "#f8fafc",
                    }}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <Upload
                      size={20}
                      color={recipients.length ? "#10b981" : "#94a3b8"}
                    />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: recipients.length ? "#10b981" : "#64748b",
                      }}
                    >
                      {fileName || "Click to Upload List"}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                      {recipients.length > 0
                        ? `${recipients.length} recipients loaded âœ“`
                        : "Supports .xlsx, .xls, .csv"}
                    </span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      margin: "0.75rem 0",
                    }}
                  >
                    <div
                      style={{ flex: 1, height: 1, background: "#e2e8f0" }}
                    />
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      OR
                    </span>
                    <div
                      style={{ flex: 1, height: 1, background: "#e2e8f0" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className="d-input"
                      style={{ flex: 1, fontSize: "0.83rem" }}
                      placeholder="Paste a Google Drive linkâ€¦"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="d-btn d-btn-secondary"
                      style={{
                        flexShrink: 0,
                        fontSize: "0.82rem",
                        padding: "0 0.85rem",
                      }}
                      onClick={handleDriveImport}
                      disabled={!driveUrl.trim()}
                    >
                      <Link2 size={14} /> Import
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      alignItems: "flex-start",
                      fontSize: "0.71rem",
                      color: "#92400e",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      padding: "0.4rem 0.6rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <AlertCircle
                      size={12}
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <span>
                      Drive file must be{" "}
                      <strong>Anyone with the link â†’ Viewer</strong>.
                    </span>
                  </div>
                </>
              )}

              {recipientSource === "list" && (
                <>
                  <label className="d-label">Select Contact List</label>
                  {userLists.length === 0 ? (
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        color: "#64748b",
                      }}
                    >
                      No contact lists yet.{" "}
                      <button
                        onClick={() => navigate("/contacts")}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#f97316",
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 600,
                        }}
                      >
                        Go to Contacts
                      </button>
                    </div>
                  ) : (
                    <select
                      className="d-input"
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      style={{
                        display: "block",
                        width: "100%",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">-- Choose a list --</option>
                      {userLists.map((list) => (
                        <option key={list._id} value={list._id}>
                          {list.name} ({list.contactCount?.toLocaleString()}{" "}
                          contacts)
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right â€” content editor + preview */}
        <div
          className="d-card"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <p className="d-card-title" style={{ margin: 0 }}>
              Email Content <span className="req">*</span>
            </p>
            {/* Tab toggle */}
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              <button
                onClick={() => setContentTab("code")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.3rem 0.7rem",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: contentTab === "code" ? "#fff" : "transparent",
                  color: contentTab === "code" ? "#0f172a" : "#64748b",
                  boxShadow:
                    contentTab === "code"
                      ? "0 1px 3px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                <Code size={13} /> HTML
              </button>
              <button
                onClick={() => setContentTab("preview")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.3rem 0.7rem",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: contentTab === "preview" ? "#fff" : "transparent",
                  color: contentTab === "preview" ? "#0f172a" : "#64748b",
                  boxShadow:
                    contentTab === "preview"
                      ? "0 1px 3px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                <Eye size={13} /> Preview
              </button>
            </div>
          </div>

          {contentTab === "code" ? (
            <textarea
              className="d-input"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={22}
              style={{
                resize: "vertical",
                fontFamily: "monospace",
                fontSize: "0.82rem",
                flex: 1,
              }}
              placeholder="<h1>Hello {{firstName}}!</h1>&#10;<p>Write your email body here...</p>"
            />
          ) : (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                overflow: "hidden",
                flex: 1,
                minHeight: 440,
              }}
            >
              {formData.content ? (
                <iframe
                  srcDoc={formData.content}
                  title="Email Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 440,
                    border: "none",
                    display: "block",
                  }}
                  sandbox="allow-same-origin"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 440,
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                  }}
                >
                  Write some HTML content to see the preview.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditCampaign;
