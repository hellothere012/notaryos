'use client';

// ═══════════════════════════════════════════════════════════
// AnonymousBanner — Slim sign-in prompt for guest users
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

/* -------------------------------------------------------------------------- */
/*  Style constants                                                            */
/* -------------------------------------------------------------------------- */

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const AMBER = '#e8a838';
const CREAM = '#f0e6d6';
const DIM = '#6b5e52';

const LS_DISMISSED_KEY = 'notaryos_tutor_banner_dismissed';

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AnonymousBanner() {
  const [dismissed, setDismissed] = useState(true); // default to hidden to avoid flash

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wasDismissed = localStorage.getItem(LS_DISMISSED_KEY) === 'true';
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_DISMISSED_KEY, 'true');
    }
  };

  if (dismissed) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '10px 20px',
        background: `${AMBER}0C`,
        borderBottom: `1px solid ${AMBER}22`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: CREAM,
          opacity: 0.85,
        }}
      >
        Sign in to save your workspace across devices
      </div>

      <a
        href="/sign-in?redirect_url=/tutor"
        style={{
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 700,
          padding: '5px 14px',
          borderRadius: 8,
          border: `1px solid ${AMBER}44`,
          background: `${AMBER}18`,
          color: AMBER,
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        Sign in
      </a>

      <button
        onClick={handleDismiss}
        style={{
          fontFamily: FONT,
          fontSize: 16,
          fontWeight: 400,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: DIM,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          lineHeight: 1,
          transition: 'color 0.15s',
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        {'\u00D7'}
      </button>
    </div>
  );
}
