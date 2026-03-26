import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Remotion token injection ──────────────────────────────────────────────────
// When Remotion renders, it passes auth credentials via ?__token & ?__user URL
// params. We read them here and store in localStorage so the app boots as a
// logged-in user — avoiding cross-origin localStorage injection issues.
;(function injectRemotionAuth() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('__token');
    const user   = params.get('__user');
    if (token) {
      localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', user);
      // Clean the URL so the params don't appear in the app's router
      const clean = new URL(window.location.href);
      clean.searchParams.delete('__token');
      clean.searchParams.delete('__user');
      window.history.replaceState({}, '', clean.toString());
    }
  } catch {
    // Silently fail — non-Remotion renders are unaffected
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
