/**
 * TrustPage - Security & Compliance for NotaryOS
 *
 * Comprehensive security page covering cryptographic signing architecture,
 * compliance frameworks, defense-in-depth layers, live verification demo,
 * and API security overview.
 *
 * Design: Matches LandingPage / AboutPage patterns (Framer Motion,
 * purple/cyan gradients, glass-card styling, dark theme).
 *
 * IMPORTANT: This page does NOT expose any backend/protocol implementation
 * details, internal IPs, ports, database schema, or architecture specifics.
 * NotaryOS is presented as a standalone, open-source product.
 *
 * Security & Trust page for NotaryOS
 */

'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  CheckCircle,
  Link2,
  Fingerprint,
  Layers,
  Eye,
  Server,
  ArrowRight,
  Search,
  ExternalLink,
  AlertTriangle,
  ShieldCheck,
  Globe,
  FileCheck,
  XCircle,
  Loader2,
  RefreshCw,
  Zap,
  Network,
} from 'lucide-react';
import { publicClient, API_ENDPOINTS } from '@/lib/api-client';

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─── Static Data ────────────────────────────────────────────────────────────

/** Three pillars of the signing architecture. */
const signingCards = [
  {
    icon: Fingerprint,
    title: 'Ed25519 Digital Signatures',
    description:
      'Every receipt signed with Ed25519 -- the same elliptic curve used by SSH, Signal, and TLS 1.3.',
    details: [
      '256-bit keys, 64-byte signatures',
      'Deterministic signing (no random nonce needed)',
      'Fastest elliptic curve verification available',
      'Immune to timing side-channel attacks',
    ],
    accent: 'purple',
  },
  {
    icon: Key,
    title: 'JWKS Key Management',
    description:
      'Public keys published via RFC 7517 JWKS endpoint. Any client can verify signatures independently.',
    details: [
      'Key rotation support with overlap windows',
      'Key ID (kid) tracking per receipt',
      'Automatic key retirement scheduling',
      'Standard JWKS discovery endpoint',
    ],
    accent: 'cyan',
  },
  {
    icon: Link2,
    title: 'Hash Chain Integrity',
    description:
      'Every receipt links to the previous via SHA-256 hash chain. Tampering with one receipt breaks the entire chain.',
    details: [
      'Genesis hash initialization per agent',
      'Chain sequence numbering',
      'Provenance reference linking',
      'Verifiable from any point in the chain',
    ],
    accent: 'emerald',
  },
];

/** Compliance frameworks with current status. */
const complianceItems = [
  {
    framework: 'SOC 2 Type II',
    icon: ShieldCheck,
    status: 'In Progress',
    badgeClass: 'badge-warning',
    description:
      'Audit controls aligned with SOC 2 Trust Service Criteria. Formal certification in progress.',
  },
  {
    framework: 'GDPR',
    icon: Globe,
    status: 'Compliant',
    badgeClass: 'badge-success',
    description:
      'Consent-gated analytics, data deletion API, and EU-compliant data handling throughout.',
  },
  {
    framework: 'ISO 27001',
    icon: FileCheck,
    status: 'Aligned',
    badgeClass: 'badge-warning',
    description:
      'Information security management practices aligned with ISO 27001 control framework.',
  },
  {
    framework: 'HIPAA',
    icon: Lock,
    status: 'Available',
    badgeClass: 'badge-success',
    description:
      'Business Associate Agreement available for Enterprise tier. PHI is never stored in receipts.',
  },
];

/** Seven layers of defense in depth, ordered from outermost to innermost. */
const securityLayers = [
  {
    number: 1,
    title: 'CORS Origin Validation',
    description: 'Cross-origin requests restricted to explicitly allowed domains.',
    icon: Globe,
  },
  {
    number: 2,
    title: 'Security Headers',
    description: 'Content-Security-Policy, X-Frame-Options, Strict-Transport-Security enforced.',
    icon: Shield,
  },
  {
    number: 3,
    title: 'Authentication',
    description: 'JWT session tokens and scoped API keys validated on every request.',
    icon: Key,
  },
  {
    number: 4,
    title: 'Rate Limiting',
    description: 'Per-endpoint, per-tier throttling to prevent abuse and ensure fair usage.',
    icon: Zap,
  },
  {
    number: 5,
    title: 'Agent Trust Management',
    description: 'Behavioral scoring tracks agent reliability over time.',
    icon: Eye,
  },
  {
    number: 6,
    title: 'Certificate Validation',
    description: 'Mutual TLS-ready certificate verification for agent-to-agent communication.',
    icon: Fingerprint,
  },
  {
    number: 7,
    title: 'Circuit Breaker',
    description: 'Fault isolation prevents cascading failures across the system.',
    icon: Network,
  },
];

/** Rate limiting tiers shown in the API security section. */
const rateTiers = [
  { tier: 'Starter', requests: '60', receipts: '100' },
  { tier: 'Explorer', requests: '300', receipts: '10,000' },
  { tier: 'Pro', requests: '1,000', receipts: '100,000' },
  { tier: 'Enterprise', requests: 'Custom', receipts: 'Unlimited' },
];

/** Security features listed beside the rate tier table. */
const securityFeatures = [
  'API key scoping (read / write permissions)',
  'SHA-256 key hashing -- plain keys never stored',
  'Automatic key rotation support',
  'IP allowlisting (Enterprise tier)',
  'CORS origin validation on every request',
];

// ─── Verification State ─────────────────────────────────────────────────────

interface VerifyResult {
  valid: boolean;
  signature_ok: boolean;
  structure_ok: boolean;
  chain_ok: boolean;
  reason?: string;
}

// ─── Gradient helpers for the depth layers ──────────────────────────────────

/**
 * Returns a left-border gradient color that deepens from purple to cyan
 * as the layer number increases from 1 to 7.
 */
function layerBorderColor(index: number): string {
  const colors = [
    'border-l-purple-400',
    'border-l-purple-500',
    'border-l-violet-500',
    'border-l-indigo-500',
    'border-l-blue-500',
    'border-l-cyan-500',
    'border-l-teal-400',
  ];
  return colors[index] ?? 'border-l-purple-400';
}

// ═══════════════════════════════════════════════════════════════════════════
//  TrustPage Component
// ═══════════════════════════════════════════════════════════════════════════

export function TrustPage() {
  // ── Live Verification Demo state ────────────────────────────────────────
  const [hashInput, setHashInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  /**
   * Calls the public receipt lookup endpoint and parses the verification
   * fields from the response. Handles network errors and invalid hashes
   * gracefully with user-friendly messages.
   */
  const handleVerify = useCallback(async () => {
    const trimmed = hashInput.trim();
    if (!trimmed) return;

    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError(null);

    try {
      const response = await publicClient.get(API_ENDPOINTS.publicReceiptLookup(trimmed));
      const data = response.data;

      // The endpoint returns verification details at top level
      setVerifyResult({
        valid: data.valid ?? false,
        signature_ok: data.signature_ok ?? data.details?.signature_ok ?? false,
        structure_ok: data.structure_ok ?? data.details?.structure_ok ?? false,
        chain_ok: data.chain_ok ?? data.details?.chain_ok ?? false,
        reason: data.reason,
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosErr.response?.status === 404) {
          setVerifyError('Receipt not found. Double-check the hash and try again.');
        } else if (axiosErr.response?.status === 400) {
          setVerifyError(
            axiosErr.response?.data?.detail ?? 'Invalid receipt hash format.',
          );
        } else {
          setVerifyError('Verification failed. Please try again later.');
        }
      } else {
        setVerifyError('Network error. Check your connection and try again.');
      }
    } finally {
      setVerifyLoading(false);
    }
  }, [hashInput]);

  /** Allow Enter key to submit the verification form. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleVerify();
    },
    [handleVerify],
  );

  /** Reset the verification demo to its initial state. */
  const resetVerify = useCallback(() => {
    setHashInput('');
    setVerifyResult(null);
    setVerifyError(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ================================================================ */}
      {/* SECTION 1 -- Hero                                                */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background mesh gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            {/* Animated badge */}
            <motion.div variants={fadeInUp}>
              <span className="badge-purple text-sm px-4 py-1.5">
                Enterprise-Grade Security
              </span>
            </motion.div>

            {/* Shield icon */}
            <motion.div
              variants={scaleIn}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/30 flex items-center justify-center icon-glow"
            >
              <Shield className="w-10 h-10 text-purple-400" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
            >
              Cryptographic Trust,{' '}
              <span className="gradient-text">Verified</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="max-w-2xl text-lg text-gray-400 leading-relaxed"
            >
              Every AI agent action sealed with Ed25519 signatures and hash-chain
              integrity. Verify any receipt, anytime, anywhere.
            </motion.p>

            {/* Quick-nav buttons */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center mt-2">
              <Link
                href="#verify"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <Search className="w-4 h-4" />
                Verify a Receipt
              </Link>
              <Link
                href="#compliance"
                className="btn-ghost inline-flex items-center gap-2 px-6 py-3 border border-gray-700/60 rounded-lg"
              >
                Compliance Frameworks
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 2 -- Signing Architecture                                */}
      {/* ================================================================ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Signing Architecture
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Three cryptographic primitives work together to make every receipt
              tamper-evident and independently verifiable.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {signingCards.map((card) => {
              const Icon = card.icon;
              const accentMap: Record<string, string> = {
                purple: 'from-purple-500/20 to-purple-900/10 border-purple-500/30 text-purple-400',
                cyan: 'from-cyan-500/20 to-cyan-900/10 border-cyan-500/30 text-cyan-400',
                emerald: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400',
              };
              const accent = accentMap[card.accent] ?? accentMap.purple;
              const iconColor = accent.split(' ').pop() ?? 'text-purple-400';

              return (
                <motion.div
                  key={card.title}
                  variants={fadeInUp}
                  className="glass-card rounded-xl p-6 card-hover flex flex-col gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${accent.split(' ').slice(0, 2).join(' ')} border ${accent.split(' ')[2]} flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{card.description}</p>
                  <ul className="mt-auto space-y-2">
                    {card.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 3 -- Compliance Grid                                     */}
      {/* ================================================================ */}
      <section id="compliance" className="py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Compliance Frameworks
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              NotaryOS is designed to meet the requirements of major regulatory
              and industry compliance frameworks.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {complianceItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.framework}
                  variants={fadeInUp}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">{item.framework}</h3>
                    </div>
                    <span className={item.badgeClass}>{item.status}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 4 -- Defense in Depth (Security Layers)                  */}
      {/* ================================================================ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Defense in Depth
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Seven independent security layers. A request must pass every layer
              before it can read or write a single receipt.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto flex flex-col gap-4"
          >
            {securityLayers.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={layer.number}
                  variants={fadeInUp}
                  className={`bg-gray-800/40 backdrop-blur-sm rounded-lg p-5 border border-gray-700/40 border-l-4 ${layerBorderColor(idx)} flex items-start gap-4`}
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-gray-500 w-6 text-right">
                      {layer.number}
                    </span>
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{layer.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{layer.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 5 -- Live Verification Demo                              */}
      {/* ================================================================ */}
      <section id="verify" className="py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Verify Any Receipt
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Paste a receipt hash below to verify its signature, structure, and
              chain integrity in real time. No account required.
            </motion.p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card rounded-xl p-8 border border-gray-700/50">
              {/* Input row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., a1b2c3d4e5f6..."
                    className="input-field pl-10"
                    disabled={verifyLoading}
                    aria-label="Receipt hash"
                  />
                </div>
                <button
                  onClick={handleVerify}
                  disabled={verifyLoading || !hashInput.trim()}
                  className="btn-primary px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Verify Now
                    </>
                  )}
                </button>
              </div>

              {/* ── Result display ──────────────────────────────────────── */}
              {verifyResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  {/* Overall status banner */}
                  <div
                    className={`rounded-lg p-4 mb-4 flex items-center gap-3 ${
                      verifyResult.valid
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    {verifyResult.valid ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <span
                      className={`font-semibold ${
                        verifyResult.valid ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {verifyResult.valid
                        ? 'Receipt is valid and fully verified.'
                        : `Verification failed${verifyResult.reason ? `: ${verifyResult.reason}` : '.'}`}
                    </span>
                  </div>

                  {/* Individual check cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: 'Signature', ok: verifyResult.signature_ok },
                      { label: 'Structure', ok: verifyResult.structure_ok },
                      { label: 'Chain', ok: verifyResult.chain_ok },
                    ] as const).map((check) => (
                      <div
                        key={check.label}
                        className="bg-gray-800/60 rounded-lg p-3 text-center border border-gray-700/40"
                      >
                        <div className="flex justify-center mb-1">
                          {check.ok ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{check.label}</p>
                        <p
                          className={`text-sm font-semibold ${
                            check.ok ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {check.ok ? 'Pass' : 'Fail'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* View full receipt link */}
                  <div className="mt-4 text-center">
                    <Link
                      href={`/r/${hashInput.trim()}`}
                      className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition-colors"
                    >
                      View full receipt
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ── Error display ───────────────────────────────────────── */}
              {verifyError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-lg p-4 bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-medium">{verifyError}</p>
                    <button
                      onClick={resetVerify}
                      className="text-xs text-gray-500 hover:text-gray-300 mt-2 inline-flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Try again
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Helper text */}
            <p className="text-center text-xs text-gray-600 mt-4">
              Receipt hashes are public identifiers. Verification requires no authentication.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 6 -- API Security Overview                               */}
      {/* ================================================================ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              API Security
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Tiered rate limiting and scoped API keys ensure fair usage and
              protect against abuse at every level.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left -- Rate Limiting Table */}
            <motion.div
              variants={fadeInUp}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Rate Limiting Tiers
                </h3>
              </div>
              <table className="w-full comparison-table">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Tier</th>
                    <th className="px-6 py-3">Requests/min</th>
                    <th className="px-6 py-3">Receipts/mo</th>
                  </tr>
                </thead>
                <tbody>
                  {rateTiers.map((row) => (
                    <tr key={row.tier} className="text-sm">
                      <td className="px-6 py-3 text-white font-medium">{row.tier}</td>
                      <td className="px-6 py-3 text-gray-400 font-mono">{row.requests}</td>
                      <td className="px-6 py-3 text-gray-400 font-mono">{row.receipts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* Right -- Security Features */}
            <motion.div
              variants={fadeInUp}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex flex-col gap-5"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                Security Features
              </h3>
              <ul className="space-y-4">
                {securityFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4 border-t border-gray-700/40">
                <Link
                  href="/api-docs"
                  className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition-colors"
                >
                  Full API documentation
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 7 -- CTA                                                 */}
      {/* ================================================================ */}
      <section className="py-20 cta-gradient">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center flex flex-col items-center gap-6"
          >
            <motion.div
              variants={scaleIn}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/30 flex items-center justify-center"
            >
              <Lock className="w-8 h-8 text-purple-400" />
            </motion.div>

            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold">
              Ready to secure your{' '}
              <span className="gradient-text">AI operations</span>?
            </motion.h2>

            <motion.p variants={fadeInUp} className="text-gray-400 max-w-xl">
              Get the full security whitepaper or speak with our team about
              Enterprise-grade compliance requirements.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center mt-2">
              <a
                href="mailto:hello@notaryos.org?subject=Security Whitepaper Request"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <FileCheck className="w-4 h-4" />
                Request Security Whitepaper
              </a>
              <a
                href="mailto:hello@notaryos.org?subject=Enterprise Security Inquiry"
                className="btn-ghost inline-flex items-center gap-2 px-6 py-3 border border-gray-700/60 rounded-lg"
              >
                <Server className="w-4 h-4" />
                Talk to Sales
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bottom spacer for mobile nav */}
      <div className="pb-24" />
    </div>
  );
}
