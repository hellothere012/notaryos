'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileJson,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Keyboard,
  AlertCircle,
  ChevronDown,
  ShieldOff,
} from 'lucide-react';
import { publicClient, API_ENDPOINTS } from '../../config/api';
import { VerificationResult } from '../../types';
import { ResultPanel } from './ResultPanel';
import { ChainVisualization } from './ChainVisualization';

/**
 * Map the raw API verify response to the VerificationResult shape the UI expects.
 * The API uses field names like signature_ok / chain_ok / reason / details.key_id,
 * while the UI components expect signature_valid / chain_valid / message / details.signer_id.
 */
function mapApiResponse(raw: any): VerificationResult {
  const details = raw.details || {};

  // Derive timestamp validity: valid if timestamp parses to a real date
  const ts = details.timestamp || details.signed_at;
  const timestampValid = ts ? !isNaN(new Date(ts).getTime()) : false;

  return {
    valid: raw.valid ?? false,
    message: raw.reason || raw.message || '',
    signature_valid: raw.signature_ok ?? raw.signature_valid ?? false,
    chain_valid: raw.chain_ok ?? raw.chain_valid ?? false,
    timestamp_valid: raw.timestamp_valid ?? timestampValid,
    details: {
      receipt_hash: details.receipt_hash || details.receipt_id || '',
      algorithm: details.algorithm || details.alg || details.signature_type || '',
      signed_at: details.signed_at || details.timestamp || '',
      signer_id: details.signer_id || details.key_id || details.kid || '',
      chain_position: details.chain_position,
    },
    errors: raw.errors,
  };
}

// Hardcoded counterfactual receipt for demo
const COUNTERFACTUAL_SAMPLE: Record<string, any> = {
  receipt_id: 'cf_demo_r8k2m4n6p0',
  receipt_type: 'counterfactual',
  timestamp: '2026-02-14T05:30:00.000Z',
  agent_id: 'compliance-monitor-01',
  action_type: 'counterfactual',
  action_not_taken: 'transfer_funds',
  decision_reason:
    'Recipient account failed KYC verification. Transfer blocked per compliance policy AML-2024-07.',
  capability_proof:
    'Agent holds transfer.execute permission with limit $50,000',
  opportunity_context:
    'User requested $12,500 wire transfer to unverified account ending in 4829',
  payload_hash: 'cf_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
  signature: 'COUNTERFACTUAL_DEMO_ed25519_7f8e9d0c1b2a3948576a5b4c3d2e1f',
  signature_type: 'Ed25519',
  key_id: 'notary-prod-key-2026',
  schema_version: '2.0',
};

// Mock verification result for counterfactual demo
const COUNTERFACTUAL_RESULT: VerificationResult = {
  valid: true,
  message: 'Counterfactual receipt verified. Proof of non-action is authentic.',
  signature_valid: true,
  chain_valid: true,
  timestamp_valid: true,
  details: {
    receipt_hash: 'cf_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
    algorithm: 'Ed25519',
    signed_at: '2026-02-14T05:30:00.000Z',
    signer_id: 'notary-prod-key-2026',
    chain_position: 1,
  },
};

export const VerifyPanel: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [receipt, setReceipt] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sampleLoadedRef = useRef(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoType, setDemoType] = useState<'valid' | 'tampered' | 'counterfactual' | null>(null);
  const [, setOriginalReceipt] = useState<string>('');
  const [tamperInfo, setTamperInfo] = useState<{
    field: string;
    originalValue: string;
    tamperedValue: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle ?sample=true query param from landing page
  useEffect(() => {
    if (searchParams.get('sample') === 'true' && !sampleLoadedRef.current) {
      sampleLoadedRef.current = true;
      // Load sample and remove the query param
      publicClient.get(API_ENDPOINTS.sampleReceipt)
        .then(response => {
          const formatted = JSON.stringify(response.data, null, 2);
          setReceipt(formatted);
          router.replace(pathname);
        })
        .catch(() => {
          setError('Failed to load sample receipt');
          router.replace(pathname);
        });
    }
  }, [searchParams, router, pathname]);

  // Keyboard shortcut: Cmd/Ctrl+Enter to verify
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleVerify();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [receipt]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVerify = async () => {
    if (!receipt.trim()) {
      setError('Paste a receipt JSON or upload a .json file to continue.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      // Parse to validate JSON
      const parsed = JSON.parse(receipt.trim());

      // Counterfactual demo uses a mock result (not a real server-signed receipt)
      if (demoType === 'counterfactual') {
        await new Promise((r) => setTimeout(r, 800));
        setResult(COUNTERFACTUAL_RESULT);
      } else {
        const response = await publicClient.post(API_ENDPOINTS.verify, parsed);
        setResult(mapApiResponse(response.data));
      }
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON. Check for missing commas or quotes.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Verification timed out. Please try again, or verify locally if the receipt is large.');
      } else if (!navigator.onLine || err.message?.includes('Network')) {
        setError("Can't reach the verification service. Check your connection and try again.");
      } else {
        setError(err.response?.data?.detail || err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      const response = await publicClient.get(API_ENDPOINTS.sampleReceipt);
      const formatted = JSON.stringify(response.data, null, 2);
      setReceipt(formatted);
      setDemoType('valid');
      setTamperInfo(null);
      setOriginalReceipt('');
      setError(null);
      setResult(null);
      setDropdownOpen(false);
    } catch (err: any) {
      setError('Failed to load sample receipt');
      setDropdownOpen(false);
    }
  };

  const handleLoadTampered = async () => {
    try {
      const response = await publicClient.get(API_ENDPOINTS.sampleReceipt);
      const original = response.data;
      setOriginalReceipt(JSON.stringify(original, null, 2));

      // Deep copy to avoid mutating the original
      const tampered = JSON.parse(JSON.stringify(original));

      // Tamper the timestamp — could be nested inside receipt or at top level
      const target = tampered.receipt || tampered;
      const origTimestamp = target.timestamp;
      target.timestamp = '2025-01-01T00:00:00.000Z';

      setReceipt(JSON.stringify(tampered, null, 2));
      setDemoType('tampered');
      setTamperInfo({
        field: 'timestamp',
        originalValue: origTimestamp,
        tamperedValue: target.timestamp,
      });
      setError(null);
      setResult(null);
      setDropdownOpen(false);
    } catch {
      setError('Failed to load sample receipt');
      setDropdownOpen(false);
    }
  };

  const handleLoadCounterfactual = () => {
    setReceipt(JSON.stringify(COUNTERFACTUAL_SAMPLE, null, 2));
    setDemoType('counterfactual');
    setTamperInfo(null);
    setOriginalReceipt('');
    setError(null);
    setResult(null);
    setDropdownOpen(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      readFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        setReceipt(JSON.stringify(parsed, null, 2));
        setError(null);
        setResult(null);
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setReceipt('');
    setResult(null);
    setError(null);
    setDemoType(null);
    setTamperInfo(null);
    setOriginalReceipt('');
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Receipt Verifier
        </h1>
        <p className="text-gray-400">
          Paste a JSON receipt or upload a file to verify signatures and chain integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Verification Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input Card */}
          <div className="card relative z-10">
            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <textarea
                ref={textareaRef}
                value={receipt}
                onChange={(e) => {
                  setReceipt(e.target.value);
                  setError(null);
                }}
                placeholder="Paste receipt JSON here... Tip: Press Cmd+Enter (Ctrl+Enter) to verify."
                className="w-full h-64 p-4 bg-transparent text-gray-300 placeholder-gray-500 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />

              {/* Drop Overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-300 font-medium">Drop JSON file here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                  <FileJson className="w-4 h-4" />
                  Upload File
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="flex items-center">
                    <button
                      onClick={handleLoadSample}
                      className="btn-ghost flex items-center gap-2 rounded-r-none pr-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Load Sample
                    </button>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="btn-ghost px-1.5 rounded-l-none border-l border-gray-600"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                      <button
                        onClick={handleLoadSample}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3 text-sm"
                      >
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-white font-medium">Valid Receipt</div>
                          <div className="text-gray-500 text-xs">A real, properly signed receipt</div>
                        </div>
                      </button>
                      <button
                        onClick={handleLoadTampered}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <div>
                          <div className="text-white font-medium">Tampered Receipt</div>
                          <div className="text-gray-500 text-xs">See what happens when data is modified</div>
                        </div>
                      </button>
                      <button
                        onClick={handleLoadCounterfactual}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-700/50 flex items-center gap-3 text-sm"
                      >
                        <ShieldOff className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="text-white font-medium">Counterfactual Receipt</div>
                          <div className="text-gray-500 text-xs">Proof an agent chose NOT to act</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                {receipt && (
                  <>
                    <button
                      onClick={handleCopy}
                      className="btn-ghost flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleClear}
                      className="btn-ghost text-gray-400"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Keyboard className="w-4 h-4" />
                <span>⌘+Enter to verify</span>
              </div>
            </div>
          </div>

          {/* Demo Type Banner */}
          <AnimatePresence>
            {demoType && demoType !== 'valid' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-lg flex items-center gap-3 text-sm ${
                  demoType === 'tampered'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-indigo-500/10 border border-indigo-500/30'
                }`}
              >
                {demoType === 'tampered' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-300">
                      <strong>Demo:</strong> This receipt has been tampered with. The timestamp was modified after signing — click Verify to see it fail.
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="text-indigo-300">
                      <strong>Demo:</strong> Counterfactual receipt — cryptographic proof that an agent chose <em>not</em> to act.
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || !receipt.trim()}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-6 h-6" />
                Verify Receipt
              </>
            )}
          </button>

          {/* Result Panel or Empty State */}
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ResultPanel
                  result={result}
                  demoType={demoType}
                  tamperInfo={tamperInfo}
                  counterfactualReceipt={demoType === 'counterfactual' ? COUNTERFACTUAL_SAMPLE : undefined}
                />
              </motion.div>
            ) : !receipt.trim() && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card text-center py-12"
              >
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ShieldCheck className="w-10 h-10 text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">No receipt loaded</h3>
                <p className="text-gray-400 mb-2 max-w-md mx-auto">
                  Paste a receipt JSON, drag a <code className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">.json</code> file, or load our sample to see verification in action.
                </p>
                <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
                  Verification checks signature validity, chain integrity, timestamp bounds, and receipt structure.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
                  >
                    <Sparkles className="w-5 h-5" />
                    Valid Receipt
                  </button>
                  <button
                    onClick={handleLoadTampered}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 font-medium rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Tampered Demo
                  </button>
                  <button
                    onClick={handleLoadCounterfactual}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium rounded-lg hover:bg-indigo-500/30 transition-colors text-sm"
                  >
                    <ShieldOff className="w-4 h-4" />
                    Counterfactual Demo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - Chain Visualization */}
        <div className="space-y-4">
          <ChainVisualization />

          {/* Quick Info Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>You provide a receipt (paste or upload)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>Notary parses and normalizes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>Cryptography is verified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                <span>Chain + time are checked</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
