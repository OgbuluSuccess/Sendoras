import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Send,
  Download,
  Upload,
  List,
  Link2,
  AlertCircle,
} from "lucide-react";
import toast from "../utils/toast";
import campaignService from "../services/campaigns";
import listService from "../services/lists";
import { importFromDriveUrl, extractDriveFileId } from "../utils/driveImport";
import { APP_NAME, APP_DOMAIN } from "../config/brand";
import "../styles/DashboardNew.css";

const CampaignBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    sender: "",
    content: "",
  });

  // Recipient State
  const [recipientSource, setRecipientSource] = useState("upload"); // 'upload' or 'list'
  const [recipients, setRecipients] = useState([]);
  const [fileName, setFileName] = useState("");
  const [userLists, setUserLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const lists = await listService.getLists();
        setUserLists(lists);
      } catch (err) {
        console.error("Failed to fetch lists", err);
      }
    };
    fetchLists();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setDriveUrl(""); // clear drive url when file chosen
    const reader = new FileReader();
    const tid = toast.loading("Parsing file…");
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
          }))
          .filter(Boolean);
        setRecipients(parsed);
        toast.success(`${parsed.length} recipients loaded`, { id: tid });
      } catch (err) {
        toast.error("Failed to parse file", { id: tid });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDriveImport = async () => {
    if (!extractDriveFileId(driveUrl))
      return toast.error(
        'Not a valid Google Drive link. Use the "Share" link from Drive.',
      );
    const tid = toast.loading("Fetching file from Google Drive…");
    try {
      const parsed = await importFromDriveUrl(driveUrl);
      setRecipients(parsed);
      setFileName(`Google Drive (${parsed.length} contacts)`);
      toast.success(`${parsed.length} recipients loaded from Drive`, {
        id: tid,
      });
    } catch (error) {
      if (error.message === "PRIVATE_FILE") {
        toast.error(
          "This Google Drive file is private. Open the file → Share → Anyone with the link → Viewer.",
          { id: tid, duration: 8000 },
        );
      } else {
        toast.error(error.message || "Failed to import from Google Drive", {
          id: tid,
        });
      }
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

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.subject ||
      !formData.sender ||
      !formData.content
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (recipientSource === "upload" && recipients.length === 0) {
      toast.error("Please upload a recipient list.");
      return;
    }

    if (recipientSource === "list" && !selectedListId) {
      toast.error("Please select a contact list.");
      return;
    }

    setLoading(true);
    const tid = toast.loading("Creating campaign…");
    try {
      const payload = { ...formData };
      if (recipientSource === "upload") {
        payload.recipients = recipients;
      } else {
        payload.listId = selectedListId;
      }

      await campaignService.createCampaign(payload);
      toast.success("Campaign created!", { id: tid });
      navigate("/campaigns");
    } catch (err) {
      toast.error("Failed to save campaign.", { id: tid });
    } finally {
      setLoading(false);
    }
  };

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
            <h1 style={{ margin: 0 }}>New Campaign</h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
              Fill in the details and upload recipients
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="d-btn d-btn-secondary" disabled={loading}>
            <Save size={16} /> Save Draft
          </button>
          <button
            className="d-btn d-btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            <Send size={16} /> {loading ? "Saving…" : "Create & Schedule"}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="d-grid-2-3" style={{ alignItems: "start" }}>
        {/* Left — form fields */}
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
                placeholder="e.g. You won't believe this update…"
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

            {/* Recipient Source Toggle */}
            <div className="d-field" style={{ marginBottom: "0.5rem" }}>
              <label className="d-label">
                Recipients <span className="req">*</span>
              </label>
              <div
                style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  <input
                    type="radio"
                    name="recipientSource"
                    value="upload"
                    checked={recipientSource === "upload"}
                    onChange={() => setRecipientSource("upload")}
                  />
                  Upload CSV
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  <input
                    type="radio"
                    name="recipientSource"
                    value="list"
                    checked={recipientSource === "list"}
                    onChange={() => setRecipientSource("list")}
                  />
                  Select Existing List
                </label>
              </div>
            </div>

            {/* Recipient Input (Conditional) */}
            <div className="d-field">
              {recipientSource === "upload" ? (
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

                  {/* File drop zone */}
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "1.75rem 1rem",
                      cursor: "pointer",
                      border: "2px dashed #e2e8f0",
                      borderRadius: "12px",
                      background: recipients.length ? "#f0fdf4" : "#f8fafc",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <Upload
                      size={22}
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
                        ? `${recipients.length} recipients loaded ✓`
                        : "Supports .xlsx, .xls, .csv"}
                    </span>
                  </label>

                  {/* OR divider */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      margin: "0.85rem 0",
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

                  {/* Google Drive URL */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className="d-input"
                      style={{ flex: 1, fontSize: "0.83rem" }}
                      placeholder="Or paste a Google Drive link…"
                      value={driveUrl}
                      onChange={(e) => {
                        setDriveUrl(e.target.value);
                      }}
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
                      Drive file must be set to{" "}
                      <strong>Anyone with the link → Viewer</strong>. Private
                      files will be rejected.
                    </span>
                  </div>
                </>
              ) : (
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
                      You don't have any contact lists yet. Go to the{" "}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/contacts");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#f97316",
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 600,
                        }}
                      >
                        Contacts page
                      </button>{" "}
                      to import one.
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
                          {list.name} ({list.contactCount.toLocaleString()}{" "}
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

        {/* Right — email content editor */}
        <div
          className="d-card"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div className="d-card-header">
            <p className="d-card-title">
              Email Content <span style={{ color: "#ef4444" }}>*</span>
            </p>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              HTML supported
            </span>
          </div>
          <textarea
            className="d-textarea"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder={
              "<h1>Hello {{firstName}}!</h1>\n<p>Write your email body here...</p>"
            }
            style={{ minHeight: 380, flex: 1 }}
          />
          {formData.content && (
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Preview
              </p>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  padding: "1rem",
                  fontSize: "0.875rem",
                  maxHeight: 200,
                  overflow: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CampaignBuilder;
