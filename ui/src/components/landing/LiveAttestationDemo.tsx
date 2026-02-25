'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, Shield, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { publicClient, API_ENDPOINTS } from '@/lib/api-client';
import { DEMO_FALLBACK } from './demo-fallback';
import type { DemoResponse, DemoReceipt, VerifyResult } from '@/types/demo';

/* ========================================================================== */
/*  Sub-components                                                            */
/* ========================================================================== */

/** Shimmer skeleton matching the FOIA paper layout. */
function DemoSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl p-6 bg-foia-paper/80 animate-pulse">
          <div className="h-4 w-32 bg-foia-ink/10 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-3 bg-foia-ink/8 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
          <div className="mt-6 h-3 w-48 bg-foia-ink/10 rounded" />
        </div>
      ))}
    </div>
  );
}

/** A single field row inside a document panel. */
function DocField({
  label,
  value,
  mono = false,
  truncate = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 py-1">
      <span className="text-[10px] uppercase tracking-widest text-foia-ink/50 font-courier font-bold shrink-0 w-32">
        {label}
      </span>
      <span
        className={`text-xs text-foia-ink/90 break-all ${mono ? 'font-ibm' : 'font-courier'} ${truncate ? 'truncate max-w-[240px] sm:max-w-none' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

/** Animated redaction bars that dissolve when revealed. */
function RedactionOverlay({
  revealed,
  lines = 5,
}: {
  revealed: boolean;
  lines?: number;
}) {
  return (
    <div className="absolute inset-0 flex flex-col gap-2 p-6 pt-14 pointer-events-none z-10">
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`redaction-bar ${revealed ? 'revealed' : ''}`}
          style={{
            width: `${60 + Math.random() * 35}%`,
            transitionDelay: `${i * 50}ms`,
            animationDelay: `${i * 200}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** FOIA-styled document panel for a receipt. */
function DocumentPanel({
  entry,
  type,
  isRedacted,
  onDeclassify,
}: {
  entry: {
    explanation: string;
    receipt: DemoReceipt;
    receipt_hash: string;
    payload_preview: Record<string, unknown>;
  };
  type: 'standard' | 'counterfactual';
  isRedacted: boolean;
  onDeclassify?: () => void;
}) {
  const { receipt, receipt_hash, payload_preview } = entry;
  const isCounterfactual = type === 'counterfactual';

  return (
    <div className="relative foia-paper rounded-xl p-5 sm:p-6 overflow-hidden">
      {/* Stamp watermark */}
      <div className="foia-stamp top-3 right-3 text-[10px]">
        {isCounterfactual ? 'FOR PUBLIC RELEASE' : 'AGENT DECISION LOG'}
      </div>

      {/* Redaction overlay (counterfactual only) */}
      {isCounterfactual && <RedactionOverlay revealed={!isRedacted} lines={7} />}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-foia-ink/10">
        <div
          className={`w-2 h-2 rounded-full ${isCounterfactual ? 'bg-amber-500' : 'bg-green-600'}`}
        />
        <h4 className="font-courier font-bold text-xs uppercase tracking-wider text-foia-ink/80">
          {isCounterfactual ? 'Action Considered \u2014 Not Executed' : 'Action Taken'}
        </h4>
      </div>

      {/* Fields */}
      <div
        className={`space-y-0.5 transition-opacity duration-700 ${isCounterfactual && isRedacted ? 'opacity-0' : 'opacity-100'}`}
      >
        <DocField label="Receipt ID" value={receipt.receipt_id} mono />
        <DocField label="Timestamp" value={new Date(receipt.timestamp).toUTCString()} />
        <DocField label="Agent" value={receipt.agent_id} mono />
        <DocField
          label="Action"
          value={receipt.action_type}
          mono
        />
        <DocField label="Payload Hash" value={receipt.payload_hash} mono truncate />
        <DocField label="Signature" value={receipt.signature} mono truncate />
        {receipt.previous_receipt_hash && (
          <DocField label="Chain Link" value={receipt.previous_receipt_hash} mono truncate />
        )}
        <DocField label="Sequence" value={`#${receipt.chain_sequence}`} />

        {/* Payload preview */}
        <div className="mt-3 pt-3 border-t border-foia-ink/10">
          <span className="text-[10px] uppercase tracking-widest text-foia-ink/50 font-courier font-bold">
            Payload Preview
          </span>
          <pre className="mt-1 text-[11px] font-ibm text-foia-ink/70 whitespace-pre-wrap break-all leading-relaxed">
            {JSON.stringify(payload_preview, null, 2)}
          </pre>
        </div>
      </div>

      {/* Mobile declassify button (counterfactual only) */}
      {isCounterfactual && isRedacted && onDeclassify && (
        <button
          onClick={onDeclassify}
          className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-foia-ink text-foia-paper text-xs font-courier font-bold uppercase tracking-wider rounded hover:bg-foia-ink/80 transition-colors"
        >
          Declassify
        </button>
      )}

      {/* Receipt hash footer */}
      <div className="mt-4 pt-3 border-t border-foia-ink/10 flex items-center gap-2">
        <Shield className="w-3 h-3 text-foia-ink/30" />
        <span className="text-[10px] font-ibm text-foia-ink/40 truncate">
          SHA-256: {receipt_hash}
        </span>
      </div>
    </div>
  );
}

/** Hash-chain ribbon connecting the two panels. */
function HashChainRibbon({ hash }: { hash: string }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center gap-2 py-4">
      <div className="w-px h-8 bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-violet-500/30 flex items-center justify-center">
          <span className="text-[10px] font-ibm text-violet-300">
            #2
          </span>
        </div>
      </div>
      <div className="w-px h-8 bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />
      <p className="text-[9px] font-ibm text-gray-500 text-center max-w-[100px] leading-tight">
        hash chain link
      </p>
    </div>
  );
}

/** Tamper test section — editable hash + verify button. */
function TamperTest({
  receipt,
  isFallback,
}: {
  receipt: DemoReceipt;
  isFallback: boolean;
}) {
  const [editedHash, setEditedHash] = useState(receipt.payload_hash);
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'valid' | 'tampered'>('idle');
  const [shaking, setShaking] = useState(false);

  // Reset if receipt changes (new API fetch)
  useEffect(() => {
    setEditedHash(receipt.payload_hash);
    setVerifyState('idle');
  }, [receipt.payload_hash]);

  const handleVerify = useCallback(async () => {
    if (isFallback) {
      // Can't verify static fallback data — link to verify page
      window.open('/verify', '_blank');
      return;
    }

    setVerifyState('loading');

    try {
      const tampered = { ...receipt, payload_hash: editedHash };
      const { data } = await publicClient.post<VerifyResult>(API_ENDPOINTS.verify, {
        receipt: tampered,
      });

      if (data.valid) {
        setVerifyState('valid');
      } else {
        setVerifyState('tampered');
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
    } catch {
      setVerifyState('tampered');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }, [receipt, editedHash, isFallback]);

  return (
    <div className={`mt-10 max-w-3xl mx-auto ${shaking ? 'animate-shake' : ''}`}>
      <div className="glass-card rounded-xl p-5 sm:p-6">
        <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Tamper Test
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Edit the payload hash below, then verify. Even a single character change breaks the signature.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-ibm block mb-1">
              payload_hash
            </label>
            <input
              type="text"
              value={editedHash}
              onChange={(e) => {
                setEditedHash(e.target.value);
                setVerifyState('idle');
              }}
              spellCheck={false}
              className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-xs font-ibm text-gray-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
            {editedHash !== receipt.payload_hash && (
              <span className="absolute right-2 top-7 text-[9px] text-amber-400 font-ibm">
                modified
              </span>
            )}
          </div>

          <button
            onClick={handleVerify}
            disabled={verifyState === 'loading'}
            className="self-end px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
          >
            {verifyState === 'loading' ? 'Verifying...' : 'Verify Receipt'}
          </button>
        </div>

        {/* Result stamp */}
        <AnimatePresence mode="wait">
          {verifyState === 'valid' && (
            <motion.div
              key="valid"
              initial={{ scale: 3, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="mt-5 flex justify-center"
            >
              <div className="valid-stamp text-center">
                Verified Authentic
              </div>
            </motion.div>
          )}
          {verifyState === 'tampered' && (
            <motion.div
              key="tampered"
              initial={{ scale: 3, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: -3 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="mt-5 flex justify-center"
            >
              <div className="tamper-stamp text-center">
                Evidence Tampered
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Copyable curl terminal block. */
function CurlTerminalBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [command]);

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <div className="code-window rounded-xl overflow-hidden">
        <div className="code-header flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-2 text-[10px] text-gray-500 font-mono">terminal</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-[11px] font-mono text-gray-400 overflow-x-auto leading-relaxed">
          <span className="text-green-400">$</span>{' '}
          {command}
        </pre>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Mobile Carousel                                                           */
/* ========================================================================== */

function MobileCarousel({
  children,
  activeIndex,
  onChangeIndex,
}: {
  children: React.ReactNode[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;
}) {
  return (
    <div className="md:hidden">
      <div className="relative overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${activeIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {children.map((child, i) => (
            <div key={i} className="w-full flex-shrink-0 px-1">
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => onChangeIndex(0)}
          disabled={activeIndex === 0}
          className="p-1.5 rounded-full bg-gray-800/50 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => onChangeIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === activeIndex ? 'bg-violet-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => onChangeIndex(1)}
          disabled={activeIndex === children.length - 1}
          className="p-1.5 rounded-full bg-gray-800/50 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Main Component                                                            */
/* ========================================================================== */

export default function LiveAttestationDemo() {
  const [data, setData] = useState<DemoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [redacted, setRedacted] = useState(true);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Scroll-triggered redaction reveal (desktop)
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  useEffect(() => {
    if (isInView && redacted) {
      // Desktop only: auto-reveal via scroll. On mobile the user taps "DECLASSIFY".
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      if (!isDesktop) return;
      const timer = setTimeout(() => setRedacted(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isInView, redacted]);

  // Fetch demo data
  useEffect(() => {
    let cancelled = false;

    async function fetchDemo() {
      try {
        const { data: resp } = await publicClient.get<DemoResponse>(API_ENDPOINTS.demo);
        if (!cancelled) {
          setData(resp);
          setIsFallback(false);
        }
      } catch {
        if (!cancelled) {
          setData(DEMO_FALLBACK);
          setIsFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDemo();
    return () => { cancelled = true; };
  }, []);

  const demo = data;

  return (
    <section ref={sectionRef} className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {/* Section header */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 glass-card rounded-full text-sm text-violet-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Live Demo
              {isFallback && (
                <span className="text-[10px] text-gray-500 ml-1">(cached)</span>
              )}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Proof of what your AI chose{' '}
              <span className="gradient-text">not</span> to do
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Two live-signed receipts. One action taken, one deliberately declined.
              Linked by a tamper-evident hash chain and independently verifiable.
            </p>
          </motion.div>

          {/* Loading skeleton */}
          {loading && <DemoSkeleton />}

          {/* Document panels */}
          {demo && !loading && (
            <motion.div
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            >
              {/* Desktop: side-by-side */}
              <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-4 max-w-5xl mx-auto items-start">
                <DocumentPanel
                  entry={demo.receipts.standard_action}
                  type="standard"
                  isRedacted={false}
                />
                <HashChainRibbon hash={demo.hash_chain.receipt_1_hash} />
                <DocumentPanel
                  entry={demo.receipts.counterfactual}
                  type="counterfactual"
                  isRedacted={redacted}
                />
              </div>

              {/* Mobile: carousel */}
              <MobileCarousel activeIndex={mobileIndex} onChangeIndex={setMobileIndex}>
                <DocumentPanel
                  entry={demo.receipts.standard_action}
                  type="standard"
                  isRedacted={false}
                />
                <DocumentPanel
                  entry={demo.receipts.counterfactual}
                  type="counterfactual"
                  isRedacted={redacted}
                  onDeclassify={() => setRedacted(false)}
                />
              </MobileCarousel>

              {/* Hash chain explanation (mobile) */}
              <div className="md:hidden mt-4 text-center">
                <p className="text-[10px] font-ibm text-gray-500">
                  Receipt #2 chains to #{`1`} via{' '}
                  <span className="text-violet-400">previous_receipt_hash</span>
                </p>
              </div>

              {/* Tamper test */}
              <TamperTest
                receipt={demo.receipts.counterfactual.receipt}
                isFallback={isFallback}
              />

              {/* Curl terminal block */}
              <CurlTerminalBlock
                command={`curl -s https://api.agenttownsquare.com/v1/notary/demo | python3 -m json.tool`}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
