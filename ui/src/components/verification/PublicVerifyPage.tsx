/**
 * PublicVerifyPage - Public receipt verification page at /r/:hash
 *
 * A standalone, full-screen dark mode page that displays a cryptographically
 * verified Notary receipt. Designed by KIMI (design agent) to feel premium --
 * "like receiving a diploma from the internet." This is the page developers
 * screenshot and share when they integrate with Notary.
 *
 * Design tokens:
 *   - Background: slate-950 with animated mesh gradient (indigo-900/20 + cyan-900/10)
 *   - Card: glassmorphism (bg-white/5 backdrop-blur-xl border-white/10)
 *   - Verified seal: animated ShieldCheck with emerald pulsing ring
 *   - Invalid seal: red glow with ShieldX
 *   - Tier seal colors: free=slate, starter=cyan, pro=gold gradient
 *   - Card flip: 3D perspective transform showing raw JSON on back
 *
 * API endpoint: GET /v1/notary/r/{hash}
 * Fallback:     GET /v1/notary/sample-receipt (demo mode when hash is "demo")
 *
 * OG META TAGS NOTE:
 *   Open Graph / Twitter Card meta tags for link previews must be set
 *   server-side (e.g. via SSR or edge function) since crawlers do not
 *   execute client-side JavaScript. The API response includes a `meta`
 *   object with receipt_hash, agent_id, and action_type that should
 *   populate og:title, og:description, and og:image on the server.
 *
 * Public receipt verification page
 * Date: 2026-02-11
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldX,
  Copy,
  ExternalLink,
  Clock,
  Key,
  Hash,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ArrowLeft,
  Shield,
  User,
  Fingerprint,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { publicClient } from '../../config/api';

// ---------------------------------------------------------------------------
// TypeScript interfaces for the /v1/notary/r/{hash} API response
// ---------------------------------------------------------------------------

/** Individual verification check from the backend */
interface VerificationDetail {
  valid: boolean;
  signature_ok: boolean;
  structure_ok: boolean;
  chain_ok: boolean;
  timestamp_ok: boolean;
  chain_position?: number;
  signed_at?: string;
  signature_type?: string;
  key_id?: string;
  algorithm?: string;
  errors?: string[];
}

/** Metadata about the receipt for display and OG tags */
interface ReceiptMeta {
  receipt_hash: string;
  agent_id?: string;
  action_type?: string;
  tier?: 'free' | 'starter' | 'explorer' | 'pro' | 'enterprise';
}

/** Complete API response from GET /v1/notary/r/{hash} */
interface PublicReceiptResponse {
  found: boolean;
  receipt: Record<string, unknown> | null;
  verification: VerificationDetail | null;
  meta: ReceiptMeta | null;
}

/** Derived state for the component */
type PageState = 'loading' | 'verified' | 'invalid' | 'not_found' | 'error';

// ---------------------------------------------------------------------------
// Tier color configuration (KIMI spec: free=slate, starter=cyan, pro=gold)
// ---------------------------------------------------------------------------

interface TierTheme {
  label: string;
  sealGradient: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
}

const TIER_THEMES: Record<string, TierTheme> = {
  free: {
    label: 'Starter',
    sealGradient: 'from-slate-400 to-slate-600',
    badgeBg: 'bg-slate-500/20 border-slate-500/30',
    badgeText: 'text-slate-300',
    ringColor: 'rgba(148, 163, 184, 0.3)',
  },
  starter: {
    label: 'Starter',
    sealGradient: 'from-cyan-400 to-cyan-600',
    badgeBg: 'bg-cyan-500/20 border-cyan-500/30',
    badgeText: 'text-cyan-300',
    ringColor: 'rgba(34, 211, 238, 0.3)',
  },
  explorer: {
    label: 'Explorer',
    sealGradient: 'from-emerald-400 to-emerald-600',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    ringColor: 'rgba(52, 211, 153, 0.3)',
  },
  pro: {
    label: 'Pro',
    sealGradient: 'from-amber-400 via-yellow-500 to-amber-600',
    badgeBg: 'bg-amber-500/20 border-amber-500/30',
    badgeText: 'text-amber-300',
    ringColor: 'rgba(251, 191, 36, 0.3)',
  },
  enterprise: {
    label: 'Enterprise',
    sealGradient: 'from-purple-400 via-fuchsia-500 to-purple-600',
    badgeBg: 'bg-purple-500/20 border-purple-500/30',
    badgeText: 'text-purple-300',
    ringColor: 'rgba(168, 85, 247, 0.3)',
  },
};

const DEFAULT_TIER_THEME = TIER_THEMES.free;

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

/** Spring physics for the seal stamp: scale 0 -> 1.1 -> 1 */
const sealStampVariants = {
  hidden: { scale: 0, opacity: 0, rotate: -20 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 18,
      mass: 1.2,
    },
  },
};

/** Stagger container for child element cascading */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

/** Fade up for individual detail rows */
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/** Card flip transition */
const cardFlipVariants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Truncate a hex hash string for display, preserving the first and last N chars.
 * Example: "sha256:abcdef1234567890" -> "sha256:abcdef...567890"
 */
function truncateHash(hash: string, prefixLen = 10, suffixLen = 8): string {
  if (!hash) return '';
  if (hash.length <= prefixLen + suffixLen + 3) return hash;
  return `${hash.slice(0, prefixLen)}...${hash.slice(-suffixLen)}`;
}

/**
 * Format an ISO timestamp into a human-readable locale string.
 * Falls back to the raw string if parsing fails.
 */
function formatTimestamp(ts: string | number | undefined): string {
  if (!ts) return 'N/A';
  try {
    const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  } catch {
    return String(ts);
  }
}

/**
 * Build the full proof URL for clipboard copying.
 */
function buildProofUrl(hash: string): string {
  return `${window.location.origin}/r/${hash}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * AnimatedMeshBackground - Full-viewport mesh gradient with subtle animation.
 * Uses CSS radial gradients positioned with Framer Motion for gentle drift.
 */
const AnimatedMeshBackground: React.FC = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
    {/* Primary indigo orb */}
    <motion.div
      className="absolute w-[800px] h-[800px] rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(67, 56, 202, 0.25) 0%, transparent 70%)',
      }}
      animate={{
        x: ['-10%', '5%', '-10%'],
        y: ['-5%', '10%', '-5%'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      initial={{ x: '-10%', y: '-5%' }}
    />
    {/* Secondary cyan orb */}
    <motion.div
      className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full opacity-10"
      style={{
        background: 'radial-gradient(circle, rgba(8, 145, 178, 0.3) 0%, transparent 70%)',
      }}
      animate={{
        x: ['10%', '-5%', '10%'],
        y: ['5%', '-10%', '5%'],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      initial={{ x: '10%', y: '5%' }}
    />
    {/* Subtle noise overlay for texture */}
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
  </div>
);

/**
 * PulsingRing - Emerald ring that pulses every 3s when receipt is verified.
 * Uses Framer Motion's repeat with a pause between pulses.
 */
const PulsingRing: React.FC<{ color: string; active: boolean }> = ({ color, active }) => {
  if (!active) return null;

  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
          }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{
            scale: [1, 1.8, 2.2],
            opacity: [0.6, 0.2, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 0.5,
            delay: i * 1.0,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
};

/**
 * CopyButton - One-click copy with brief success animation.
 * Shows a checkmark and "Copied!" for 2 seconds after click.
 */
const CopyButton: React.FC<{ text: string; label?: string; className?: string }> = ({
  text,
  label = 'Copy Proof URL',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Copied!
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

/**
 * DetailRow - A single labelled data row in the receipt details section.
 * Icon + label on the left, value on the right.
 */
const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}> = ({ icon, label, value, mono = false, copyable = false }) => {
  const [fieldCopied, setFieldCopied] = useState(false);

  const handleFieldCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setFieldCopied(true);
      setTimeout(() => setFieldCopied(false), 2000);
    });
  }, [value]);

  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4"
    >
      <div className="flex items-center gap-3 text-gray-400 flex-shrink-0">
        <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-sm text-white truncate ${mono ? 'font-mono' : ''}`}
          title={value}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleFieldCopy}
            className="flex-shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {fieldCopied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * VerificationCheckBadge - Small status badge for individual checks.
 * Green checkmark for pass, red X for fail.
 */
const VerificationCheckBadge: React.FC<{ label: string; passed: boolean }> = ({
  label,
  passed,
}) => (
  <motion.div
    variants={fadeInUp}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
      passed
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
    }`}
  >
    {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
    {label}
  </motion.div>
);

/**
 * SkeletonCard - Loading state with animated skeleton shimmer.
 * Mirrors the final card layout so there is no layout shift.
 */
const SkeletonCard: React.FC = () => (
  <div className="w-full max-w-2xl mx-auto">
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      {/* Seal skeleton */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse mb-4" />
        <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-32 bg-white/5 rounded-lg animate-pulse" />
      </div>
      {/* Badges skeleton */}
      <div className="flex justify-center gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-24 bg-white/5 rounded-full animate-pulse" />
        ))}
      </div>
      {/* Detail rows skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * NotFoundState - Full-screen error state when the receipt hash is not found.
 * Provides a link back to the manual verifier.
 */
const NotFoundState: React.FC<{ hash: string }> = ({ hash }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full max-w-lg mx-auto text-center"
  >
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center"
      >
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-3">Receipt Not Found</h2>
      <p className="text-gray-400 text-sm mb-2">
        No receipt exists for hash:
      </p>
      <code className="inline-block px-3 py-1.5 bg-white/5 rounded-lg text-xs font-mono text-gray-300 break-all mb-6 max-w-full">
        {hash}
      </code>
      <p className="text-gray-500 text-xs mb-8">
        The receipt may have expired, been revoked, or the hash may be incorrect.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/verify"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/15 transition-colors border border-white/10"
        >
          <ShieldCheck className="w-4 h-4" />
          Manual Verifier
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-gray-400 rounded-lg text-sm hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  </motion.div>
);

/**
 * ErrorState - Generic error state for network or server failures.
 * Includes a retry button.
 */
const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full max-w-lg mx-auto text-center"
  >
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center"
      >
        <XCircle className="w-10 h-10 text-orange-400" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-3">Verification Failed</h2>
      <p className="text-gray-400 text-sm mb-8">{message}</p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/15 transition-colors border border-white/10"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const PublicVerifyPage: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();

  // ---- State ----
  const [pageState, setPageState] = useState<PageState>('loading');
  const [data, setData] = useState<PublicReceiptResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  const fetchAttempted = useRef(false);

  // ---- Derived values ----
  const receipt = data?.receipt ?? null;
  const verification = data?.verification ?? null;
  const meta = data?.meta ?? null;
  const isVerified = verification?.valid === true;
  const tier = meta?.tier ?? 'free';
  const tierTheme = TIER_THEMES[tier] ?? DEFAULT_TIER_THEME;

  // ---- Extract display fields from the receipt ----
  // The /r/{hash} API returns receipts in two possible formats:
  //   - Internal format: from_agent, to_agent, capability, message_hash (sample/demo)
  //   - SDK format:      agent_id, action_type, payload_hash (real DB receipts from /issue)
  // We attempt both with appropriate fallbacks.
  const fromAgent =
    (receipt?.from_agent as string) ??
    (receipt?.agent_id as string) ??
    (meta?.agent_id as string) ??
    'N/A';
  const toAgent =
    (receipt?.to_agent as string) ??
    'notary';
  const capability =
    (receipt?.capability as string) ??
    (receipt?.action_type as string) ??
    (meta?.action_type as string) ??
    'N/A';
  const timestamp =
    (receipt?.signed_at as string) ??
    (receipt?.timestamp as string) ??
    (receipt?.created_at as string) ??
    (verification?.signed_at as string) ??
    '';
  const chainPosition =
    verification?.chain_position ??
    (receipt?.chain as Record<string, unknown>)?.sequence_number ??
    (meta as any)?.chain_sequence ??
    null;
  const algorithm =
    verification?.algorithm ??
    verification?.signature_type ??
    (receipt?.algorithm as string) ??
    'HMAC-SHA256';
  const keyId =
    verification?.key_id ??
    (receipt?.key_id as string) ??
    meta?.agent_id ??
    'N/A';
  const signature = (receipt?.signature as string) ?? '';
  const receiptHash = meta?.receipt_hash ?? hash ?? '';

  // ---- Data fetching ----
  const fetchReceipt = useCallback(async () => {
    if (!hash) {
      setPageState('not_found');
      return;
    }

    setPageState('loading');
    setErrorMessage('');

    try {
      // The /r/demo path is handled server-side, returning a proper PublicReceiptResponse
      const endpoint = `/v1/notary/r/${encodeURIComponent(hash)}`;

      const response = await publicClient.get<PublicReceiptResponse>(endpoint);
      const payload = response.data;

      if (!payload.found) {
        setPageState('not_found');
        return;
      }

      setData(payload);
      setPageState(payload.verification?.valid ? 'verified' : 'invalid');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setPageState('not_found');
      } else if (!navigator.onLine || err.message?.includes('Network')) {
        setErrorMessage(
          'Unable to reach the verification service. Check your connection and try again.'
        );
        setPageState('error');
      } else {
        setErrorMessage(
          err.response?.data?.detail ??
            err.message ??
            'An unexpected error occurred during verification.'
        );
        setPageState('error');
      }
    }
  }, [hash]);

  useEffect(() => {
    if (!fetchAttempted.current) {
      fetchAttempted.current = true;
      fetchReceipt();
    }
  }, [fetchReceipt]);

  // Reset fetch guard when hash changes
  useEffect(() => {
    fetchAttempted.current = false;
  }, [hash]);

  // ---- Handle retry ----
  const handleRetry = useCallback(() => {
    fetchAttempted.current = false;
    fetchReceipt();
  }, [fetchReceipt]);

  // ---- Render ----
  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedMeshBackground />

      {/* Top navigation bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white hidden sm:inline">Notary</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Manual Verifier
          </Link>
          {pageState === 'verified' || pageState === 'invalid' ? (
            <CopyButton text={buildProofUrl(receiptHash)} label="Copy Link" />
          ) : null}
        </div>
      </header>

      {/* Main content area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <AnimatePresence mode="wait">
          {/* Loading state */}
          {pageState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  <Loader2 className="w-8 h-8 text-purple-400" />
                </motion.div>
                <p className="text-gray-400 text-sm mt-3">Verifying receipt...</p>
              </div>
              <SkeletonCard />
            </motion.div>
          )}

          {/* Not found state */}
          {pageState === 'not_found' && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NotFoundState hash={hash ?? ''} />
            </motion.div>
          )}

          {/* Error state */}
          {pageState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ErrorState message={errorMessage} onRetry={handleRetry} />
            </motion.div>
          )}

          {/* Verified or Invalid state -- the main receipt card */}
          {(pageState === 'verified' || pageState === 'invalid') && data && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl mx-auto"
              style={{ perspective: 1200 }}
            >
              {/* 3D card container for flip effect */}
              <motion.div
                animate={isFlipped ? 'back' : 'front'}
                variants={cardFlipVariants}
                className="relative w-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* ========== FRONT FACE ========== */}
                <div
                  className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {/* Top accent line */}
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${
                      isVerified
                        ? 'from-emerald-500 via-emerald-400 to-cyan-500'
                        : 'from-red-500 via-red-400 to-orange-500'
                    }`}
                  />

                  <div className="p-6 sm:p-10">
                    {/* ---- Seal Section ---- */}
                    <div className="flex flex-col items-center mb-8">
                      {/* Animated seal with pulsing ring */}
                      <div className="relative mb-5">
                        <motion.div
                          variants={sealStampVariants}
                          initial="hidden"
                          animate="visible"
                          className={`relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br ${
                            isVerified ? tierTheme.sealGradient : 'from-red-500 to-red-700'
                          } shadow-lg`}
                          style={{
                            boxShadow: isVerified
                              ? `0 0 40px ${tierTheme.ringColor}, 0 0 80px ${tierTheme.ringColor}`
                              : '0 0 40px rgba(239, 68, 68, 0.3), 0 0 80px rgba(239, 68, 68, 0.15)',
                          }}
                        >
                          {isVerified ? (
                            <ShieldCheck className="w-12 h-12 text-white drop-shadow-lg" />
                          ) : (
                            <ShieldX className="w-12 h-12 text-white drop-shadow-lg" />
                          )}
                        </motion.div>

                        {/* Pulsing rings for verified state */}
                        <PulsingRing
                          color={isVerified ? tierTheme.ringColor : 'rgba(239, 68, 68, 0.3)'}
                          active={isVerified}
                        />
                      </div>

                      {/* Status text */}
                      <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className={`text-2xl sm:text-3xl font-bold mb-1 ${
                          isVerified ? 'text-white' : 'text-red-400'
                        }`}
                      >
                        {isVerified ? 'Receipt Verified' : 'Verification Failed'}
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="text-gray-400 text-sm text-center max-w-md"
                      >
                        {isVerified
                          ? 'This receipt has been cryptographically verified. All integrity checks passed.'
                          : 'One or more cryptographic checks did not pass. See details below.'}
                      </motion.p>

                      {/* Tier badge */}
                      {isVerified && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
                          className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tierTheme.badgeBg} ${tierTheme.badgeText}`}
                        >
                          <Shield className="w-3 h-3" />
                          {tierTheme.label} Tier
                        </motion.div>
                      )}
                    </div>

                    {/* ---- Verification Check Badges ---- */}
                    {verification && (
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-wrap items-center justify-center gap-2 mb-8"
                      >
                        <VerificationCheckBadge
                          label="Signature"
                          passed={verification.signature_ok}
                        />
                        <VerificationCheckBadge
                          label="Structure"
                          passed={verification.structure_ok}
                        />
                        <VerificationCheckBadge
                          label="Chain"
                          passed={verification.chain_ok}
                        />
                        <VerificationCheckBadge
                          label="Timestamp"
                          passed={verification.timestamp_ok}
                        />
                      </motion.div>
                    )}

                    {/* ---- Error list for invalid receipts ---- */}
                    {!isVerified && verification?.errors && verification.errors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl"
                      >
                        <h4 className="text-red-400 text-sm font-semibold mb-2">
                          What failed
                        </h4>
                        <ul className="space-y-1.5">
                          {verification.errors.map((err, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-red-300"
                            >
                              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <span>{err}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    {/* ---- Receipt Details ---- */}
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="mb-8"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Receipt Details
                      </h3>
                      <div className="bg-white/[0.02] rounded-xl border border-white/5 px-4">
                        <DetailRow
                          icon={<User className="w-4 h-4 text-purple-400" />}
                          label="From Agent"
                          value={fromAgent}
                        />
                        <DetailRow
                          icon={<User className="w-4 h-4 text-cyan-400" />}
                          label="To Agent"
                          value={toAgent}
                        />
                        <DetailRow
                          icon={<Layers className="w-4 h-4 text-indigo-400" />}
                          label="Capability"
                          value={capability}
                        />
                        <DetailRow
                          icon={<Clock className="w-4 h-4 text-amber-400" />}
                          label="Timestamp"
                          value={formatTimestamp(timestamp)}
                        />
                        {chainPosition !== null && (
                          <DetailRow
                            icon={<Link2 className="w-4 h-4 text-emerald-400" />}
                            label="Chain Position"
                            value={`#${chainPosition}`}
                            mono
                          />
                        )}
                      </div>
                    </motion.div>

                    {/* ---- Signature Details ---- */}
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="mb-8"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Signature Details
                      </h3>
                      <div className="bg-white/[0.02] rounded-xl border border-white/5 px-4">
                        <DetailRow
                          icon={<Fingerprint className="w-4 h-4 text-purple-400" />}
                          label="Algorithm"
                          value={algorithm}
                          mono
                        />
                        <DetailRow
                          icon={<Key className="w-4 h-4 text-cyan-400" />}
                          label="Key ID"
                          value={keyId}
                          mono
                          copyable
                        />
                        <DetailRow
                          icon={<Hash className="w-4 h-4 text-indigo-400" />}
                          label="Receipt Hash"
                          value={truncateHash(receiptHash)}
                          mono
                          copyable
                        />
                        {signature && (
                          <DetailRow
                            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                            label="Signature"
                            value={truncateHash(signature, 12, 8)}
                            mono
                            copyable
                          />
                        )}
                      </div>
                    </motion.div>

                    {/* ---- Action Bar ---- */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5"
                    >
                      <CopyButton
                        text={buildProofUrl(receiptHash)}
                        label="Copy Proof URL"
                        className="w-full sm:w-auto justify-center"
                      />

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsFlipped(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          View Raw JSON
                        </button>
                        <Link
                          href="/verify"
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Full Verifier
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* ========== BACK FACE (Raw JSON) ========== */}
                <div
                  className="absolute inset-0 w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {/* Top accent line */}
                  <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />

                  <div className="p-6 sm:p-10 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Hash className="w-5 h-5 text-purple-400" />
                        Raw Receipt Data
                      </h3>
                      <button
                        onClick={() => setIsFlipped(false)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 border border-white/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Back to Card
                      </button>
                    </div>

                    {/* Copy raw JSON button */}
                    <div className="mb-3">
                      <CopyButton
                        text={JSON.stringify(receipt, null, 2)}
                        label="Copy JSON"
                      />
                    </div>

                    {/* JSON code block */}
                    <div className="flex-1 overflow-auto bg-black/30 rounded-xl border border-white/5 p-4">
                      <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
                        {JSON.stringify(receipt, null, 2)}
                      </pre>
                    </div>

                    {/* Verification summary on back face */}
                    {verification && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                        {isVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span>
                          {isVerified
                            ? 'All verification checks passed'
                            : `${verification.errors?.length ?? 0} check(s) failed`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-white/5">
        <p className="text-xs text-gray-600">
          Verified by{' '}
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            Notary
          </Link>{' '}
          &mdash; Cryptographic receipts for AI agent systems
        </p>
      </footer>
    </div>
  );
};

export default PublicVerifyPage;
