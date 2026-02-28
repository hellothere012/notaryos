'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  ShieldCheck,
  ShieldX,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Link2,
  Clock,
  Hash,
  PenLine,
} from 'lucide-react';
import { publicClient, API_ENDPOINTS } from '@/lib/api-client';
import type { DemoResponse, DemoReceipt, VerifyResult } from '@/types/demo';

/* ========================================================================== */
/*  Types                                                                     */
/* ========================================================================== */

interface EditableField {
  key: keyof DemoReceipt;
  label: string;
  icon: React.ReactNode;
  description: string;
  editable: boolean;
}

/* ========================================================================== */
/*  Constants                                                                 */
/* ========================================================================== */

const EDITABLE_FIELDS: EditableField[] = [
  {
    key: 'receipt_id',
    label: 'Receipt ID',
    icon: <Fingerprint className="w-3.5 h-3.5" />,
    description: 'Unique identifier for this receipt',
    editable: true,
  },
  {
    key: 'timestamp',
    label: 'Timestamp',
    icon: <Clock className="w-3.5 h-3.5" />,
    description: 'When the action occurred',
    editable: true,
  },
  {
    key: 'agent_id',
    label: 'Agent ID',
    icon: <Shield className="w-3.5 h-3.5" />,
    description: 'The agent that performed the action',
    editable: true,
  },
  {
    key: 'action_type',
    label: 'Action Type',
    icon: <PenLine className="w-3.5 h-3.5" />,
    description: 'What action was taken',
    editable: true,
  },
  {
    key: 'payload_hash',
    label: 'Payload Hash',
    icon: <Hash className="w-3.5 h-3.5" />,
    description: 'SHA-256 hash of the action payload',
    editable: true,
  },
  {
    key: 'signature',
    label: 'Signature',
    icon: <Fingerprint className="w-3.5 h-3.5" />,
    description: 'Ed25519 digital signature',
    editable: true,
  },
  {
    key: 'previous_receipt_hash',
    label: 'Chain Link',
    icon: <Link2 className="w-3.5 h-3.5" />,
    description: 'Hash of the previous receipt in the chain',
    editable: true,
  },
];

/* ========================================================================== */
/*  Sub-components                                                            */
/* ========================================================================== */

/** FOIA-styled read-only field row. */
function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="py-2 border-b border-foia-ink/8 last:border-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-foia-ink/40">{icon}</span>
        <span className="text-[10px] uppercase tracking-widest text-foia-ink/50 font-courier font-bold">
          {label}
        </span>
      </div>
      <p className="text-xs font-ibm text-foia-ink/80 break-all leading-relaxed pl-5">
        {value}
      </p>
    </div>
  );
}

/** Editable field with diff highlighting. */
function EditableFieldRow({
  field,
  originalValue,
  currentValue,
  onChange,
}: {
  field: EditableField;
  originalValue: string;
  currentValue: string;
  onChange: (value: string) => void;
}) {
  const isModified = originalValue !== currentValue;

  return (
    <div className={`py-2 border-b border-gray-700/30 last:border-0 transition-colors duration-200 ${isModified ? 'bg-amber-500/5 -mx-3 px-3 rounded-lg' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`${isModified ? 'text-amber-400' : 'text-gray-500'} transition-colors`}>
          {field.icon}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-ibm font-medium">
          {field.label}
        </span>
        {isModified && (
          <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-ibm">
            modified
          </span>
        )}
      </div>
      <input
        type="text"
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={`w-full px-2.5 py-1.5 bg-gray-800/60 border rounded-md text-xs font-ibm text-gray-300 focus:outline-none transition-colors ${
          isModified
            ? 'border-amber-500/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
            : 'border-gray-700/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30'
        }`}
      />
    </div>
  );
}

/** Failure explanation panel. */
function FailureExplainer({
  result,
  modifiedFields,
}: {
  result: VerifyResult;
  modifiedFields: string[];
}) {
  const [expanded, setExpanded] = useState(true);

  const checks = [
    {
      label: 'Signature Verification',
      passed: result.signature_ok,
      explanation: result.signature_ok
        ? 'The Ed25519 signature matches the receipt content.'
        : `The Ed25519 signature was computed over the original receipt fields. Changing ${modifiedFields.length === 1 ? `the ${modifiedFields[0]}` : 'any field'} invalidates the signature because the signed data no longer matches.`,
      technical: !result.signature_ok
        ? 'Ed25519 signatures are deterministic: sign(private_key, canonical_bytes) produces a unique 64-byte signature. Any byte change in the input produces a completely different expected signature.'
        : null,
    },
    {
      label: 'Structure Validation',
      passed: result.structure_ok,
      explanation: result.structure_ok
        ? 'All required fields are present and correctly formatted.'
        : 'The receipt structure is malformed. Required fields may be missing or have invalid formats.',
    },
    {
      label: 'Chain Integrity',
      passed: result.chain_ok !== false,
      explanation:
        result.chain_ok === false
          ? 'The hash chain is broken. The previous_receipt_hash does not match any known receipt.'
          : result.chain_ok === null
            ? 'Chain verification was not performed (standalone receipt or chain data unavailable).'
            : 'The receipt correctly links to its predecessor in the hash chain.',
      isNull: result.chain_ok === null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="mt-6"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 glass-card rounded-xl hover:border-white/10 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-white">
          <Info className="w-4 h-4 text-violet-400" />
          Why did it {result.valid ? 'pass' : 'fail'}?
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className={`p-3 rounded-lg border ${
                    check.passed
                      ? 'border-green-500/20 bg-green-500/5'
                      : check.isNull
                        ? 'border-gray-500/20 bg-gray-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {check.passed ? (
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    ) : check.isNull ? (
                      <Shield className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ShieldX className="w-4 h-4 text-red-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        check.passed
                          ? 'text-green-400'
                          : check.isNull
                            ? 'text-gray-400'
                            : 'text-red-400'
                      }`}
                    >
                      {check.label}: {check.passed ? 'PASSED' : check.isNull ? 'SKIPPED' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed pl-6">
                    {check.explanation}
                  </p>
                  {check.technical && (
                    <p className="text-[11px] text-gray-500 leading-relaxed pl-6 mt-1.5 font-ibm border-t border-gray-700/30 pt-1.5">
                      {check.technical}
                    </p>
                  )}
                </div>
              ))}

              {!result.valid && result.reason && (
                <div className="p-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
                  <p className="text-[11px] text-violet-300 font-ibm">
                    <span className="font-bold">Server response:</span> {result.reason}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ========================================================================== */
/*  Main Component                                                            */
/* ========================================================================== */

export default function TamperSimulator() {
  const [original, setOriginal] = useState<DemoReceipt | null>(null);
  const [modified, setModified] = useState<DemoReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'valid' | 'tampered'>('idle');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [shaking, setShaking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch demo receipt on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchReceipt() {
      try {
        const { data } = await publicClient.get<DemoResponse>(API_ENDPOINTS.demo);
        if (!cancelled) {
          const receipt = data.receipts.standard_action.receipt;
          setOriginal(receipt);
          setModified({ ...receipt });
        }
      } catch {
        // Fallback to a minimal static receipt for offline development
        if (!cancelled) {
          const fallback: DemoReceipt = {
            receipt_id: 'receipt_demo_offline',
            timestamp: new Date().toISOString(),
            agent_id: 'demo-agent',
            action_type: 'demo.action',
            payload_hash: 'ef67421c7105c87d07291e66f4f8414ba4f01fd42570cfd9a08f02a0ce84b015',
            previous_receipt_hash: null,
            chain_sequence: 1,
            signature: 'LC88YKWrnYPrIV2OVzJG74eGcIyjjrHKZpjda_1aj2MQDSWqsBXPLh7fKa3qkQvupy_EUkP3SbRaPSn8m4k0Bg',
            signature_type: 'ed25519',
            key_id: 'demo',
            kid: 'demo',
            alg: 'EdDSA',
            schema_version: '1.1',
          };
          setOriginal(fallback);
          setModified({ ...fallback });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReceipt();
    return () => { cancelled = true; };
  }, []);

  // Get list of modified field names
  const modifiedFields = original && modified
    ? EDITABLE_FIELDS
        .filter((f) => String(original[f.key] ?? '') !== String(modified[f.key] ?? ''))
        .map((f) => f.label)
    : [];

  const hasChanges = modifiedFields.length > 0;

  // Debounced verification
  const verifyReceipt = useCallback(
    async (receipt: DemoReceipt) => {
      setVerifyState('loading');
      try {
        const { data } = await publicClient.post<VerifyResult>(API_ENDPOINTS.verify, {
          receipt,
        });
        setVerifyResult(data);
        if (data.valid) {
          setVerifyState('valid');
        } else {
          setVerifyState('tampered');
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
        }
      } catch {
        setVerifyState('tampered');
        setVerifyResult({
          valid: false,
          signature_ok: false,
          structure_ok: true,
          chain_ok: null,
          reason: 'Verification request failed. The receipt may be malformed.',
        });
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
    },
    [],
  );

  // Auto-verify on edit (debounced)
  useEffect(() => {
    if (!modified || !original) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // If nothing changed, show as valid without hitting API
    if (!hasChanges) {
      setVerifyState('idle');
      setVerifyResult(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      verifyReceipt(modified);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [modified, original, hasChanges, verifyReceipt]);

  // Handle field edit
  const handleFieldChange = (key: keyof DemoReceipt, value: string) => {
    if (!modified) return;
    setModified({ ...modified, [key]: value });
  };

  // Reset to original
  const handleReset = () => {
    if (!original) return;
    setModified({ ...original });
    setVerifyState('idle');
    setVerifyResult(null);
  };

  // Loading skeleton
  if (loading || !original || !modified) {
    return (
      <div className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="h-8 w-64 bg-gray-800/50 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-96 bg-gray-800/30 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl p-6 bg-gray-800/30 animate-pulse">
                <div className="h-4 w-32 bg-gray-700/50 rounded mb-4" />
                <div className="space-y-3">
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="h-10 bg-gray-700/30 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 glass-card rounded-full text-sm text-amber-300 mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            Interactive Demo
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Can you break a{' '}
            <span className="gradient-text">cryptographic receipt</span>?
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Edit any field on the right. The Ed25519 signature was computed over the original data
            — even changing a single character will cause verification to fail.
          </p>
        </motion.div>

        {/* Side-by-side panels */}
        <div className={`grid lg:grid-cols-2 gap-6 ${shaking ? 'animate-shake' : ''}`}>
          {/* LEFT: Original (read-only, FOIA aesthetic) */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative foia-paper rounded-xl p-5 sm:p-6 overflow-hidden h-full">
              <div className="foia-stamp top-3 right-3 text-[10px]">
                Original Document
              </div>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-foia-ink/10">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                <h3 className="font-courier font-bold text-xs uppercase tracking-wider text-foia-ink/80">
                  Verified Original
                </h3>
                <div className="ml-auto">
                  <span className="text-[9px] px-2 py-0.5 bg-green-600/10 text-green-700 border border-green-600/20 rounded-full font-courier font-bold uppercase tracking-wider">
                    Authentic
                  </span>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-0">
                {EDITABLE_FIELDS.map((field) => {
                  const value = original[field.key];
                  if (value === null || value === undefined) return null;
                  return (
                    <ReadOnlyField
                      key={field.key}
                      label={field.label}
                      value={String(value)}
                      icon={field.icon}
                    />
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-foia-ink/10 flex items-center gap-2">
                <Shield className="w-3 h-3 text-foia-ink/30" />
                <span className="text-[10px] font-ibm text-foia-ink/40">
                  Ed25519 signed &middot; Schema v{original.schema_version}
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Editable version (dark theme) */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative glass-card rounded-xl p-5 sm:p-6 overflow-hidden h-full border border-gray-700/50">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/30">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    hasChanges ? 'bg-amber-500' : 'bg-gray-500'
                  }`}
                />
                <h3 className="font-ibm font-medium text-xs uppercase tracking-wider text-gray-400">
                  Your Version
                </h3>
                <div className="ml-auto flex items-center gap-2">
                  {hasChanges && (
                    <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-ibm">
                      {modifiedFields.length} field{modifiedFields.length !== 1 ? 's' : ''} changed
                    </span>
                  )}
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className="p-1 rounded hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
                    title="Reset to original"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-0">
                {EDITABLE_FIELDS.map((field) => {
                  const value = modified[field.key];
                  if (original[field.key] === null && !value) return null;
                  return (
                    <EditableFieldRow
                      key={field.key}
                      field={field}
                      originalValue={String(original[field.key] ?? '')}
                      currentValue={String(value ?? '')}
                      onChange={(v) => handleFieldChange(field.key, v)}
                    />
                  );
                })}
              </div>

              {/* Manual verify button */}
              <div className="mt-4 pt-3 border-t border-gray-700/30 flex items-center gap-3">
                <button
                  onClick={() => verifyReceipt(modified)}
                  disabled={verifyState === 'loading'}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {verifyState === 'loading' ? 'Verifying...' : 'Verify Receipt'}
                </button>
                {!hasChanges && verifyState === 'idle' && (
                  <span className="text-[10px] text-gray-500 font-ibm">
                    Edit a field above to see verification fail
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Result stamp */}
        <div className="mt-8 flex justify-center">
          <AnimatePresence mode="wait">
            {verifyState === 'valid' && (
              <motion.div
                key="valid"
                initial={{ scale: 3, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: -2 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
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
              >
                <div className="tamper-stamp text-center">
                  Evidence Tampered
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Failure explanation */}
        {verifyResult && hasChanges && (
          <FailureExplainer result={verifyResult} modifiedFields={modifiedFields} />
        )}

        {/* Educational footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="glass-card rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold text-white mb-2">How does this work?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every NotaryOS receipt is signed with an{' '}
              <span className="text-violet-300">Ed25519 private key</span>. The signature
              covers a canonical string of the receipt fields:{' '}
              <code className="text-[10px] font-ibm text-cyan-300 bg-gray-800/50 px-1 py-0.5 rounded">
                receipt_id|timestamp|agent_id|action_type|payload_hash|previous_hash
              </code>
              . Changing any field produces a different canonical string, which means the
              original signature no longer matches. This is mathematically impossible to
              forge without the private key.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a
                href="/verify"
                className="px-4 py-1.5 text-xs font-medium text-violet-300 border border-violet-500/30 rounded-lg hover:bg-violet-500/10 transition-colors"
              >
                Verify a real receipt
              </a>
              <a
                href="/docs"
                className="px-4 py-1.5 text-xs font-medium text-gray-400 border border-gray-700/50 rounded-lg hover:bg-gray-700/20 transition-colors"
              >
                Read the docs
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
