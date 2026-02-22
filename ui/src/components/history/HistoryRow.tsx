import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldX,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  User,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { VerificationHistoryItem } from '../../types';

interface HistoryRowProps {
  item: VerificationHistoryItem;
}

export const HistoryRow: React.FC<HistoryRowProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Truncate hash for display
  const truncateHash = (hash: string, startChars = 8, endChars = 8): string => {
    if (hash.length <= startChars + endChars + 3) return hash;
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Copy hash to clipboard
  const handleCopyHash = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get status badge component
  const StatusBadge: React.FC = () => {
    if (item.isValid) {
      return (
        <span className="badge-success flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Valid
        </span>
      );
    }
    return (
      <span className="badge-error flex items-center gap-1">
        <ShieldX className="w-3.5 h-3.5" />
        Invalid
      </span>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-hover transition-all duration-200 ${
        isExpanded ? 'ring-1 ring-purple-500/50' : ''
      }`}
    >
      {/* Main Row */}
      <div
        className="flex items-center justify-between gap-4 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Status Icon + Hash */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Status Icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.isValid
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}
          >
            {item.isValid ? (
              <ShieldCheck className="w-5 h-5 text-green-400" />
            ) : (
              <ShieldX className="w-5 h-5 text-red-400" />
            )}
          </div>

          {/* Hash and Date */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-white font-mono text-sm">
                {truncateHash(item.receiptHash)}
              </code>
              <button
                onClick={handleCopyHash}
                className="p-1 text-gray-500 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                title="Copy full hash"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(item.verifiedAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: Status Badge + Expand */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <StatusBadge />
          <button
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-700/50">
              {/* Result Summary */}
              <div className="mb-4">
                <p
                  className={`text-sm font-medium ${
                    item.result.valid ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {item.result.message}
                </p>
              </div>

              {/* Verification Checks */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.result.signature_valid ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {item.result.signature_valid ? (
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">Signature</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.result.chain_valid ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {item.result.chain_valid ? (
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.result.timestamp_valid ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {item.result.timestamp_valid ? (
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">Timestamp</span>
                </div>
              </div>

              {/* Details */}
              {item.result.details && (
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Receipt Hash:</span>
                    <code className="text-gray-300 font-mono text-xs">
                      {truncateHash(item.result.details.receipt_hash, 12, 12)}
                    </code>
                  </div>
                  {item.result.details.signer_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">Signer:</span>
                      <code className="text-gray-300 font-mono text-xs">
                        {item.result.details.signer_id}
                      </code>
                    </div>
                  )}
                  {item.result.details.algorithm && (
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">Algorithm:</span>
                      <code className="text-gray-300 font-mono text-xs">
                        {item.result.details.algorithm}
                      </code>
                    </div>
                  )}
                  {item.result.details.chain_position !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">Chain Position:</span>
                      <span className="text-gray-300">
                        #{item.result.details.chain_position}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Errors */}
              {item.result.errors && item.result.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Errors</span>
                  </div>
                  <ul className="space-y-1">
                    {item.result.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-300/80">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
