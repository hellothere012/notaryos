import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileJson,
  Lock,
  Copy,
  Check,
  Clock,
  Link2,
  Hash,
  Key,
} from 'lucide-react';
import { VerificationResult } from '../../types';

interface ResultPanelProps {
  result: VerificationResult;
}

type TabId = 'overview' | 'raw' | 'crypto';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'raw', label: 'Raw JSON', icon: <FileJson className="w-4 h-4" /> },
  { id: 'crypto', label: 'Crypto Details', icon: <Lock className="w-4 h-4" /> },
];

export const ResultPanel: React.FC<ResultPanelProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState(false);

  const isValid = result.valid;

  // Copy raw JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return timestamp;
    }
  };

  // Truncate hash for display
  const truncateHash = (hash: string, length: number = 12): string => {
    if (hash.length <= length * 2) return hash;
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  return (
    <div
      className={`card overflow-hidden transition-all duration-300 ${
        isValid
          ? 'border-green-500/50 glow-green'
          : 'border-red-500/50 glow-red'
      }`}
    >
      {/* Main Result Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status Icon with Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              isValid
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isValid ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <ShieldX className="w-8 h-8" />
            )}
          </motion.div>

          {/* Status Text */}
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-xl font-bold ${
                isValid ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isValid ? 'Receipt Verified' : 'Verification Failed'}
            </motion.h3>
            <p className="text-gray-400 text-sm mt-0.5">
              {isValid
                ? 'Signature and chain checks passed.'
                : 'One or more checks did not pass. Review the details below.'}
            </p>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-ghost flex items-center gap-2"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Validation Status Badges */}
      <div className="flex flex-wrap gap-3 mt-4">
        <StatusBadge
          label="Signature"
          valid={result.signature_valid}
          icon={<Key className="w-3.5 h-3.5" />}
        />
        <StatusBadge
          label="Chain"
          valid={result.chain_valid}
          icon={<Link2 className="w-3.5 h-3.5" />}
        />
        <StatusBadge
          label="Timestamp"
          valid={result.timestamp_valid}
          icon={<Clock className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Errors List */}
      {result.errors && result.errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <h4 className="text-red-400 font-medium text-sm mb-2">What failed</h4>
          <ul className="space-y-1">
            {result.errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-red-300">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Fix the issue at the source, then re-verify the updated receipt.
          </p>
        </motion.div>
      )}

      {/* Expandable Details Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-700">
              {/* Tab Navigation */}
              <div className="flex gap-1 mb-4 bg-gray-800/50 rounded-lg p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'overview' && (
                    <OverviewTab result={result} formatTimestamp={formatTimestamp} />
                  )}
                  {activeTab === 'raw' && (
                    <RawJsonTab
                      result={result}
                      onCopy={handleCopyJson}
                      copied={copied}
                    />
                  )}
                  {activeTab === 'crypto' && (
                    <CryptoDetailsTab
                      result={result}
                      truncateHash={truncateHash}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  label: string;
  valid: boolean;
  icon: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, valid, icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
      valid
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : 'bg-red-500/20 text-red-400 border border-red-500/30'
    }`}
  >
    {icon}
    <span>{label}</span>
    {valid ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    )}
  </motion.div>
);

// Overview Tab Content
interface OverviewTabProps {
  result: VerificationResult;
  formatTimestamp: (ts: string) => string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ result, formatTimestamp }) => {
  if (!result.details) {
    return (
      <div className="text-center py-8 text-gray-500">
        No additional details available
      </div>
    );
  }

  const details = [
    { label: 'Signer ID', value: result.details.signer_id, icon: <Key className="w-4 h-4" /> },
    { label: 'Signed At', value: formatTimestamp(result.details.signed_at), icon: <Clock className="w-4 h-4" /> },
    { label: 'Algorithm', value: result.details.algorithm, icon: <Lock className="w-4 h-4" /> },
    { label: 'Chain Position', value: result.details.chain_position?.toString() || 'N/A', icon: <Link2 className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {details.map((detail, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            {detail.icon}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{detail.label}</p>
            <p className="text-white font-medium">{detail.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Raw JSON Tab Content
interface RawJsonTabProps {
  result: VerificationResult;
  onCopy: () => void;
  copied: boolean;
}

const RawJsonTab: React.FC<RawJsonTabProps> = ({ result, onCopy, copied }) => (
  <div className="relative">
    <button
      onClick={onCopy}
      className="absolute top-3 right-3 btn-ghost flex items-center gap-2 text-xs"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
    <pre className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-auto max-h-80 text-sm font-mono text-gray-300">
      {JSON.stringify(result, null, 2)}
    </pre>
  </div>
);

// Crypto Details Tab Content
interface CryptoDetailsTabProps {
  result: VerificationResult;
  truncateHash: (hash: string, length?: number) => string;
}

const CryptoDetailsTab: React.FC<CryptoDetailsTabProps> = ({ result, truncateHash }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!result.details) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cryptographic details available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Receipt Hash */}
      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Hash className="w-4 h-4" />
            <span className="text-sm font-medium">Receipt Hash</span>
          </div>
          <button
            onClick={() => copyToClipboard(result.details!.receipt_hash, 'hash')}
            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
          >
            {copiedField === 'hash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedField === 'hash' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <code className="block text-sm font-mono text-white break-all bg-gray-900/50 p-3 rounded">
          {result.details.receipt_hash}
        </code>
      </div>

      {/* Algorithm Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Signature Algorithm</span>
          </div>
          <p className="text-white font-mono">{result.details.algorithm}</p>
        </div>

        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Key className="w-4 h-4" />
            <span className="text-sm font-medium">Signer Identity</span>
          </div>
          <p className="text-white font-mono">{result.details.signer_id}</p>
        </div>
      </div>

      {/* Verification Status Summary */}
      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Verification Checks</h4>
        <div className="space-y-2">
          <VerificationCheckRow
            label="Signature Verification"
            description="HMAC-SHA256 signature matches the receipt content"
            valid={result.signature_valid}
          />
          <VerificationCheckRow
            label="Chain Integrity"
            description="Previous hash links correctly to chain history"
            valid={result.chain_valid}
          />
          <VerificationCheckRow
            label="Timestamp Validity"
            description="Signed timestamp is within acceptable range"
            valid={result.timestamp_valid}
          />
        </div>
      </div>
    </div>
  );
};

// Verification Check Row
interface VerificationCheckRowProps {
  label: string;
  description: string;
  valid: boolean;
}

const VerificationCheckRow: React.FC<VerificationCheckRowProps> = ({
  label,
  description,
  valid,
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
    <div>
      <p className="text-white text-sm font-medium">{label}</p>
      <p className="text-gray-500 text-xs">{description}</p>
    </div>
    <div
      className={`flex items-center gap-1.5 text-sm font-medium ${
        valid ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {valid ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Pass
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4" />
          Fail
        </>
      )}
    </div>
  </div>
);
