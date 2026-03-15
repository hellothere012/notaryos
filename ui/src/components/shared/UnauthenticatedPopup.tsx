'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Check, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface UnauthenticatedPopupProps {
  pageName: 'forge' | 'tutor' | 'panopticon';
}

const PAGE_LABELS: Record<string, string> = {
  forge: 'the Forge',
  tutor: 'AI Tutor',
  panopticon: 'Panopticon',
};

export function UnauthenticatedPopup({ pageName }: UnauthenticatedPopupProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const STORAGE_KEY = `notaryos-guest-dismissed-${pageName}`;

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, STORAGE_KEY]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }, [STORAGE_KEY]);

  // Escape key handler
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  const label = PAGE_LABELS[pageName] || pageName;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Sign Up for Full Access
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6">
              You&apos;re browsing {label} as a guest with limited access.
            </p>

            {/* Feature comparison list */}
            <div className="space-y-3 mb-8">
              {/* What guests get */}
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">Unlimited receipt verification</span>
              </div>
              {/* What guests don't get */}
              <div className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0" />
                <span className="text-sm text-gray-400">Limited to 5 sessions per day</span>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0" />
                <span className="text-sm text-gray-400">No saved history or workspace</span>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0" />
                <span className="text-sm text-gray-400">No API key access</span>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0" />
                <span className="text-sm text-gray-400">Basic rate limits</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/sign-up"
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white text-center hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/20"
              >
                Sign Up Free
              </Link>
              <button
                onClick={dismiss}
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Continue as Guest
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
