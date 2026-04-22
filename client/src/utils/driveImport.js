import * as XLSX from "xlsx";

// Backend base URL — always route through our server to avoid browser CORS
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Extract Google Drive file ID from any sharing URL format.
 * Returns null if not a Drive URL.
 */
export function extractDriveFileId(url) {
  try {
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

/**
 * Fetch a public Google Drive file via our backend proxy (avoids CORS)
 * and parse it as XLSX/CSV.
 * Throws errors with human-readable messages.
 * Returns an array of { email, firstName, lastName }
 */
export async function importFromDriveUrl(shareUrl) {
  const fileId = extractDriveFileId(shareUrl.trim());
  if (!fileId)
    throw new Error(
      'Not a valid Google Drive link. Use a "Share" link from Google Drive.',
    );

  // Route through backend proxy — server has no CORS restrictions
  const proxyUrl = `${API_BASE}/proxy/drive?id=${fileId}`;

  let response;
  try {
    response = await fetch(proxyUrl);
  } catch {
    throw new Error(
      "Could not reach the Sendhiiv server. Make sure the backend is running.",
    );
  }

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body.msg === "PRIVATE_FILE") throw new Error("PRIVATE_FILE");
    throw new Error(
      "Access denied by Google Drive. Make sure the file is publicly shared.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Proxy error (${response.status}). Make sure the file is publicly shared on Google Drive.`,
    );
  }

  const buffer = await response.arrayBuffer();
  const data = new Uint8Array(buffer);

  const wb = XLSX.read(data, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (!rows || rows.length < 2)
    throw new Error("The file appears to be empty or has no data rows.");

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const emailIdx = headers.findIndex(
    (h) => h === "email" || h.includes("email"),
  );
  const firstIdx = headers.findIndex((h) => h.includes("first"));
  const lastIdx = headers.findIndex((h) => h.includes("last"));

  if (emailIdx === -1)
    throw new Error(
      'No "email" column found. Make sure your file has an email column header.',
    );

  const parsed = rows
    .slice(1)
    .filter((r) => r[emailIdx] && String(r[emailIdx]).trim())
    .map((r) => ({
      email: String(r[emailIdx]).trim(),
      firstName: firstIdx > -1 ? String(r[firstIdx] || "").trim() : "",
      lastName: lastIdx > -1 ? String(r[lastIdx] || "").trim() : "",
    }));

  if (parsed.length === 0)
    throw new Error("No valid email addresses found in the file.");
  return parsed;
}
