'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

const STORAGE_KEY = 'notaryos-cookie-consent';

export function ConsentGatedAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => {
      setConsented(localStorage.getItem(STORAGE_KEY) === 'accepted');
    };
    check();
    window.addEventListener('cookie-consent-changed', check);
    return () => window.removeEventListener('cookie-consent-changed', check);
  }, []);

  if (!consented) return null;
  return <Analytics />;
}
