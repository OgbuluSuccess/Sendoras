/**
 * render.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone Node.js render script for the Sendhiiv trailer.
 *
 * Usage:
 *   node render.mjs [desktop|mobile|both]
 *
 * Prerequisites:
 *   1. Sendhiiv client must be running at http://localhost:5173
 *   2. Sendhiiv server must be running at http://localhost:5000
 *   3. npm install must have been run in this directory
 *
 * How it works:
 *   1. Logs in to the Sendhiiv API to get a JWT token
 *   2. Passes that token to Remotion's renderer via puppeteerOptions so that
 *      Chromium pre-injects it into localStorage BEFORE the React app boots
 *   3. Renders the desktop and/or mobile composition to MP4
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const API_URL = "http://localhost:5000/api";
const LOGIN_EMAIL = "banks9226@gmail.com";
const LOGIN_PASSWORD = "1234567";
const ENTRY_POINT = path.join(__dirname, "src", "index.ts");
const OUT_DIR = path.join(__dirname, "out");

// ── Helpers ──────────────────────────────────────────────────────────────────
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      },
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getAuthToken() {
  console.log("🔐 Logging in to Sendhiiv API…");
  try {
    const data = await fetchJson(`${API_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
    });
    if (data.token) {
      console.log("✅ Auth token obtained.");
      return { token: data.token, user: JSON.stringify(data.user || {}) };
    }
    console.warn(
      "⚠️  Login succeeded but no token returned. Recording public pages only.",
    );
    return null;
  } catch (err) {
    console.warn(
      "⚠️  Could not reach auth API:",
      err.message,
      "\nRecording public pages only.",
    );
    return null;
  }
}

async function renderComposition(
  compositionId,
  outputFile,
  authData,
  serveUrl,
) {
  console.log(`\n🎬 Rendering: ${compositionId} → ${outputFile}`);

  // Pass the auth token as inputProps — AppFrame embeds it in the iframe URL
  // as ?__token=xxx so the Sendhiiv client reads it before React boots.
  const inputProps = {
    token: authData?.token ?? "",
    userJson: authData?.user ?? "",
  };

  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputFile,
    inputProps,
    chromiumOptions: {
      disableWebSecurity: true,
    },
    onProgress: ({ progress }) => {
      process.stdout.write(`  Progress: ${(progress * 100).toFixed(1)}%\r`);
    },
  });

  console.log(`\n✅ Saved: ${outputFile}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const target = process.argv[2] || "both";

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("📦 Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: ENTRY_POINT,
    webpackOverride: (config) => config,
  });
  console.log("✅ Bundle ready.");

  const authData = await getAuthToken();

  if (target === "desktop" || target === "both") {
    await renderComposition(
      "DesktopVideo",
      path.join(OUT_DIR, "sendhiiv-desktop.mp4"),
      authData,
      serveUrl,
    );
  }

  if (target === "mobile" || target === "both") {
    await renderComposition(
      "MobileVideo",
      path.join(OUT_DIR, "sendhiiv-mobile.mp4"),
      authData,
      serveUrl,
    );
  }

  console.log("\n🎉 All renders complete! Files saved in ./out/");
}

main().catch((err) => {
  console.error("❌ Render failed:", err);
  process.exit(1);
});
