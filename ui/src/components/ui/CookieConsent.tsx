'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'notaryos-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const respond = (accepted: boolean) => {
    localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'declined');
    setVisible(false);
    // Force re-render of ConsentGatedAnalytics
    window.dispatchEvent(new Event('cookie-consent-changed'));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl px-6 py-4 shadow-2xl">
        <p className="text-sm text-gray-300 leading-relaxed">
          We use analytics to improve NotaryOS.
          No personal data is sold or shared.{' '}
          <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
            Privacy Policy
          </a>
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => respond(true)}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => respond(false)}
            className="rounded-lg border border-white/10 px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:border-white/20 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
