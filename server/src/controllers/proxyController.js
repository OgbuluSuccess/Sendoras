const https = require("https");
const http = require("http");
const { URL } = require("url");

// @desc  Proxy-download a public Google Drive file (bypasses browser CORS)
// @route GET /api/proxy/drive?id=FILE_ID&type=sheet|file
// @access Public (file must already be publicly shared on Drive)
exports.proxyDriveFile = (req, res) => {
  const { id, type } = req.query;
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res
      .status(400)
      .json({ msg: "Invalid or missing Google Drive file ID" });
  }

  // Google Sheets need the spreadsheet export endpoint; regular files use uc?export=download
  const downloadUrl =
    type === "sheet"
      ? `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`
      : `https://drive.google.com/uc?export=download&id=${id}`;

  // Abort the request if Google doesn't respond within 20 seconds
  const TIMEOUT_MS = 20000;
  let responded = false;
  const timeout = setTimeout(() => {
    if (!responded) {
      responded = true;
      res
        .status(504)
        .json({ msg: "Google Drive did not respond in time. Try again." });
    }
  }, TIMEOUT_MS);

  const follow = (url, redirects = 0) => {
    if (redirects > 8) {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        res.status(500).json({ msg: "Too many redirects from Google Drive" });
      }
      return;
    }

    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;

    const reqOptions = { headers: { "User-Agent": "Mozilla/5.0" } };
    lib
      .get(url, reqOptions, (upstream) => {
        const { statusCode, headers: upHeaders } = upstream;

        // Follow redirects
        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          upHeaders.location
        ) {
          upstream.resume();
          return follow(upHeaders.location, redirects + 1);
        }

        if (statusCode === 403 || statusCode === 401) {
          upstream.resume();
          if (!responded) {
            responded = true;
            clearTimeout(timeout);
            res.status(403).json({ msg: "PRIVATE_FILE" });
          }
          return;
        }

        if (statusCode !== 200) {
          upstream.resume();
          if (!responded) {
            responded = true;
            clearTimeout(timeout);
            res
              .status(502)
              .json({ msg: `Google Drive returned ${statusCode}` });
          }
          return;
        }

        // Check content-type — if Google returns HTML it's a virus-scan/login page
        const ct = upHeaders["content-type"] || "application/octet-stream";
        if (ct.includes("text/html")) {
          upstream.resume();
          if (!responded) {
            responded = true;
            clearTimeout(timeout);
            res.status(403).json({ msg: "PRIVATE_FILE" });
          }
          return;
        }

        if (!responded) {
          responded = true;
          clearTimeout(timeout);
          res.setHeader("Content-Type", ct);
          res.setHeader("Access-Control-Allow-Origin", "*");
          upstream.pipe(res);
        } else {
          upstream.resume();
        }
      })
      .on("error", (err) => {
        if (!responded) {
          responded = true;
          clearTimeout(timeout);
          res
            .status(502)
            .json({ msg: "Failed to reach Google Drive: " + err.message });
        }
      });
  };

  follow(downloadUrl);
};
