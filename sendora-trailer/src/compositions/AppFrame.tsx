import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

// ── Configuration ──────────────────────────────────────────────────────────────
const APP_URL = 'http://localhost:5173';

// Sequence of pages + how long to stay (seconds) — Desktop
const PAGES = [
  { path: '/',          label: 'Landing Page', durationSec: 5 },
  { path: '/login',     label: 'Login',        durationSec: 4 },
  { path: '/dashboard', label: 'Dashboard',    durationSec: 8 },
  { path: '/campaigns', label: 'Campaigns',    durationSec: 5 },
  { path: '/contacts',  label: 'Contacts',     durationSec: 5 },
  { path: '/analytics', label: 'Analytics',    durationSec: 5 },
  { path: '/billing',   label: 'Billing',      durationSec: 5 },
  { path: '/settings',  label: 'Settings',     durationSec: 5 },
  { path: '/domains',   label: 'Domains',      durationSec: 3 },
];

// Mobile subset
const PAGES_MOBILE = [
  { path: '/',          label: 'Landing Page', durationSec: 5 },
  { path: '/login',     label: 'Login',        durationSec: 4 },
  { path: '/dashboard', label: 'Dashboard',    durationSec: 8 },
  { path: '/campaigns', label: 'Campaigns',    durationSec: 5 },
  { path: '/contacts',  label: 'Contacts',     durationSec: 5 },
  { path: '/billing',   label: 'Billing',      durationSec: 3 },
];

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AppFrameProps {
  mode: 'desktop' | 'mobile';
  token: string;
  userJson: string;
}

// ── Component ──────────────────────────────────────────────────────────────────
// Fully SYNCHRONOUS — no useEffect, no delayRender, no async.
// The token is injected into the Sendoras app via a ?__token= URL query param.
// main.jsx in the Sendoras client reads that param and stores it in localStorage.
export const AppFrame: React.FC<AppFrameProps> = ({ mode, token, userJson }) => {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Determine current page from frame number ──────────────────────────────
  const pages = mode === 'mobile' ? PAGES_MOBILE : PAGES;
  let currentPage = pages[0];
  let elapsed = 0;
  for (const page of pages) {
    const pageDurationFrames = page.durationSec * fps;
    if (frame < elapsed + pageDurationFrames) {
      currentPage = page;
      break;
    }
    elapsed += pageDurationFrames;
    currentPage = page;
  }

  // ── Build iframe URL — inject token as query param ────────────────────────
  // main.jsx in the Sendoras client reads __token + __user from the URL
  // and stores them in localStorage before React boots.
  const params = new URLSearchParams();
  if (token)    params.set('__token', token);
  if (userJson) params.set('__user',  userJson);
  const paramString = params.toString();
  const iframeSrc = `${APP_URL}${currentPage.path}${paramString ? '?' + paramString : ''}`;

  // ── Layout ────────────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0f0f0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  };

  const phoneBezelStyle: React.CSSProperties = mode === 'mobile'
    ? {
        border: '16px solid #1a1a2e',
        borderRadius: '44px',
        boxShadow: '0 0 0 4px #16213e, 0 40px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }
    : { width: '100%', height: '100%', position: 'relative' };

  // For mobile: render at 390px width (iPhone viewport), then scale up
  const viewportW = mode === 'desktop' ? 1920 : 390;
  const viewportH = mode === 'desktop' ? 1080 : 844;
  const scale     = mode === 'mobile' ? 1080 / viewportW : 1;

  const iframeStyle: React.CSSProperties = {
    width:           viewportW,
    height:          viewportH,
    border:          'none',
    display:         'block',
    transform:       `scale(${scale})`,
    transformOrigin: 'top left',
    pointerEvents:   'none',
  };

  return (
    <div style={containerStyle}>
      <div style={phoneBezelStyle}>
        <iframe
          src={iframeSrc}
          style={iframeStyle}
          title={`Sendoras — ${currentPage.label}`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>

      {/* Page label pill */}
      <div style={{
        position:       'absolute',
        bottom:         mode === 'mobile' ? 32 : 24,
        left:           '50%',
        transform:      'translateX(-50%)',
        background:     'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(12px)',
        color:          '#fff',
        fontFamily:     'Inter, sans-serif',
        fontSize:       mode === 'mobile' ? 28 : 18,
        fontWeight:     600,
        padding:        '10px 28px',
        borderRadius:   999,
        letterSpacing:  '0.02em',
        border:         '1px solid rgba(255,255,255,0.15)',
        whiteSpace:     'nowrap',
      }}>
        {currentPage.label}
      </div>
    </div>
  );
};
