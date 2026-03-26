# Sendora Trailer — Remotion Video Recorder

Records the live Sendora app as a programmatically rendered MP4 video in both desktop and mobile formats.

## Prerequisites

1. **Sendora must be running**:
   ```bash
   # From the project root
   npm run dev
   ```
   - Client: `http://localhost:5173`
   - Server: `http://localhost:5000`

2. **Install dependencies** (one time):
   ```bash
   cd sendoras-trailer
   npm install
   ```

---

## Usage

### 🎬 Preview in Remotion Studio (recommended first step)
```bash
npx remotion preview src/index.ts
```
Opens the Remotion Studio at `http://localhost:3000`. You can scrub through the video timeline, check both Desktop and Mobile compositions, and verify auth is working.

---

### 📹 Render to MP4

**Render both desktop and mobile:**
```bash
node render.mjs both
```

**Render only desktop (1920×1080):**
```bash
node render.mjs desktop
```

**Render only mobile (1080×1920):**
```bash
node render.mjs mobile
```

Output files are saved to `./out/`:
- `out/sendoras-desktop.mp4`
- `out/sendoras-mobile.mp4`

---

## How Authentication Works

The `render.mjs` script:
1. Calls `POST /api/auth/login` to get a JWT token
2. Injects the token into Chromium's `localStorage` **before** the React app boots (via `puppeteerOptions.evaluateOnNewDocument`)
3. The React app then reads the token from `localStorage` and treats the user as logged in

If the server is unreachable or credentials fail, only public pages (Landing, Login) will be recorded.

---

## Customising the Video

### Change which pages are shown and for how long
Edit `src/compositions/AppFrame.tsx` → the `PAGES` / `PAGES_MOBILE` arrays:
```ts
const PAGES = [
  { path: '/dashboard', label: 'Dashboard', durationSec: 8 },
  // ...
];
```

### Change video length / frame rate
Edit `src/Root.tsx`:
```ts
const FPS              = 60;
const DESKTOP_SECONDS  = 45;
const MOBILE_SECONDS   = 30;
```
