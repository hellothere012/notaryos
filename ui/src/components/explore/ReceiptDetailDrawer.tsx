'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  Link2,
  Shield,
} from 'lucide-react';

/* ========================================================================== */
/*  Types                                                                      */
/* ========================================================================== */

interface ReceiptDetailDrawerProps {
  receipt: any;
  open: boolean;
  onClose: () => void;
  /** Navigate to a different receipt (e.g. following the previous_hash chain). */
  onNavigate?: (hash: string) => void;
}

/* ========================================================================== */
/*  Helpers                                                                    */
/* ========================================================================== */

function StatusBadge({
  label,
  ok,
}: {
  label: string;
  ok: boolean | undefined;
}) {
  const resolved = ok ?? false;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
        resolved
          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
          : 'bg-red-500/15 text-red-400 border border-red-500/25'
      }`}
    >
      {resolved ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <XCircle className="w-3.5 h-3.5" />
      )}
      {label}
    </span>
  );
}

function DetailRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-800/40 last:border-b-0">
      <span className="text-xs text-gray-500 uppercase tracking-wider shrink-0 pt-0.5">
        {label}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-sm text-gray-300 truncate text-right ${
            mono ? 'font-mono' : ''
          }`}
          title={value}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Component                                                                  */
/* ========================================================================== */

export const ReceiptDetailDrawer: React.FC<ReceiptDetailDrawerProps> = ({
  receipt,
  open,
  onClose,
  onNavigate,
}) => {
  const [rawExpanded, setRawExpanded] = useState(false);

  /* Close on Escape key */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [open, onClose]);

  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  /* Reset raw JSON state when receipt changes */
  useEffect(() => {
    setRawExpanded(false);
  }, [receipt]);

  /* Derive receipt fields, handling varied API response shapes */
  const hash =
    receipt?.receipt_hash ||
    receipt?.receipt_id ||
    receipt?.hash ||
    '';
  const details = receipt?.details || receipt || {};
  const signatureOk = receipt?.signature_ok ?? details?.signature_ok;
  const chainOk = receipt?.chain_ok ?? details?.chain_ok;
  const structureOk = receipt?.structure_ok ?? details?.structure_ok;
  const previousHash =
    details?.previous_hash ?? receipt?.previous_hash ?? '';
  const isGenesis =
    !previousHash ||
    previousHash === 'genesis' ||
    previousHash === '0';

  return (
    <AnimatePresence>
      {open && receipt && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-gray-950 border-l border-gray-800/60 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-800/60 bg-gray-950/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <h2 className="text-base font-semibold text-white truncate">
                  Receipt Details
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* ---- Verification Status Banner ---- */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Verification Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label="Signature" ok={signatureOk} />
                  <StatusBadge label="Chain" ok={chainOk} />
                  <StatusBadge label="Structure" ok={structureOk} />
                </div>
              </div>

              {/* ---- Receipt Details ---- */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Details
                </h3>
                <div>
                  <DetailRow
                    label="Hash"
                    value={hash}
                    mono
                    copyable
                  />
                  <DetailRow
                    label="Action"
                    value={
                      receipt?.action_type || details?.action_type || ''
                    }
                  />
                  <DetailRow
                    label="Agent"
                    value={
                      receipt?.agent_id || details?.agent_id || ''
                    }
                    mono
                    copyable
                  />
                  <DetailRow
                    label="Timestamp"
                    value={
                      receipt?.timestamp ||
                      details?.timestamp ||
                      details?.signed_at ||
                      ''
                    }
                  />
                  <DetailRow
                    label="Signature"
                    value={
                      details?.signature_type ||
                      details?.alg ||
                      receipt?.signature_type ||
                      ''
                    }
                    mono
                  />
                  <DetailRow
                    label="Key ID"
                    value={
                      details?.key_id ||
                      details?.kid ||
                      receipt?.key_id ||
                      ''
                    }
                    mono
                    copyable
                  />
                  <DetailRow
                    label="Chain Position"
                    value={
                      details?.chain_position != null
                        ? String(details.chain_position)
                        : ''
                    }
                  />
                </div>
              </div>

              {/* ---- Provenance Chain ---- */}
              {!isGenesis && previousHash && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Provenance Chain
                  </h3>
                  <div className="flex items-start gap-3">
                    {/* Vertical timeline dots */}
                    <div className="flex flex-col items-center gap-0 pt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/30" />
                      <span className="w-px h-8 bg-gray-700" />
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-600 ring-2 ring-gray-600/30" />
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* Current receipt */}
                      <div>
                        <span className="text-[10px] uppercase text-gray-500 tracking-wider">
                          Current
                        </span>
                        <p className="font-mono text-xs text-gray-300 truncate">
                          {hash}
                        </p>
                      </div>
                      {/* Previous receipt link */}
                      <div>
                        <span className="text-[10px] uppercase text-gray-500 tracking-wider">
                          Previous
                        </span>
                        <button
                          onClick={() => onNavigate?.(previousHash)}
                          className="flex items-center gap-1.5 font-mono text-xs text-purple-400 hover:text-purple-300 transition-colors truncate group"
                        >
                          <Link2 className="w-3 h-3 shrink-0" />
                          <span className="truncate group-hover:underline">
                            {previousHash}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Raw JSON ---- */}
              <div>
                <button
                  onClick={() => setRawExpanded(!rawExpanded)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors w-full"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      rawExpanded ? 'rotate-180' : ''
                    }`}
                  />
                  Raw Receipt JSON
                </button>
                <AnimatePresence>
                  {rawExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <pre className="mt-3 p-4 bg-gray-900/80 border border-gray-800/50 rounded-lg text-xs font-mono text-gray-400 overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
                        {JSON.stringify(receipt, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---- Actions ---- */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800/40">
                <button
                  onClick={() =>
                    window.open(`/r/${encodeURIComponent(hash)}`, '_blank')
                  }
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full Receipt
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(hash);
                  }}
                  className="btn-ghost flex items-center gap-2 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy Hash
                </button>
                <button
                  onClick={() =>
                    window.open('/verify', '_blank')
                  }
                  className="btn-ghost flex items-center gap-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
