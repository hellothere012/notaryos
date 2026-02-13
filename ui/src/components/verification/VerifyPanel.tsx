import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

export const VerifyPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [receipt, setReceipt] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sampleLoadedRef = useRef(false);

  // Handle ?sample=true query param from landing page
  useEffect(() => {
    if (searchParams.get('sample') === 'true' && !sampleLoadedRef.current) {
      sampleLoadedRef.current = true;
      // Load sample and remove the query param
      publicClient.get(API_ENDPOINTS.sampleReceipt)
        .then(response => {
          const formatted = JSON.stringify(response.data, null, 2);
          setReceipt(formatted);
          setSearchParams({}, { replace: true });
        })
        .catch(() => {
          setError('Failed to load sample receipt');
          setSearchParams({}, { replace: true });
        });
    }
  }, [searchParams, setSearchParams]);

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

      const response = await publicClient.post(API_ENDPOINTS.verify, parsed);
      setResult(mapApiResponse(response.data));
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
      setError(null);
      setResult(null);
    } catch (err: any) {
      setError('Failed to load sample receipt');
    }
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
          <div className="card">
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
                <button
                  onClick={handleLoadSample}
                  className="btn-ghost flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Load Sample
                </button>
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
                <ResultPanel result={result} />
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
                <button
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
                >
                  <Sparkles className="w-5 h-5" />
                  Load Sample Receipt
                </button>
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
