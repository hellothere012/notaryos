'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Globe,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  User,
  Link2,
  ExternalLink,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  receiptHash: string;
  receiptId: string;
  agentId: string;
  actionType: string;
  isValid: boolean;
  groundingStatus: string;
  verifiedAt: string | null;
  createdAt: string | null;
  signatureType: string;
  chainSequence: number;
  result: {
    valid: boolean;
    message: string;
    signature_valid: boolean;
    chain_valid: boolean;
    timestamp_valid: boolean;
  };
}

interface ActivityRowProps {
  item: ActivityItem;
}

// ── Action type → display label ─────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  'forge.analysis': 'Forge Analysis',
  'forge.synthesis': 'Forge Synthesis',
  'forge.counterfactual': 'Counterfactual Proof',
  'forge.prompt': 'Forge Prompt',
  'forge.reasoning': 'Forge Reasoning',
  'panopticon.observation': 'OSINT Observation',
  'panopticon.assessment': 'OSINT Assessment',
  'panopticon.fusion': 'OSINT Fusion',
  seal: 'Receipt Sealed',
  issue: 'Receipt Issued',
  verify: 'Verification',
};

function getActionLabel(actionType: string): string {
  if (ACTION_LABELS[actionType]) return ACTION_LABELS[actionType];
  // Fallback: title-case with dots → spaces
  return actionType
    .replace(/\./g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Category detection ──────────────────────────────────────────
type Category = 'forge' | 'osint' | 'verification';

function getCategory(actionType: string): Category {
  if (actionType.startsWith('forge')) return 'forge';
  if (actionType.startsWith('panopticon')) return 'osint';
  return 'verification';
}

const CATEGORY_CONFIG: Record<
  Category,
  { icon: typeof Zap; color: string; bg: string; border: string }
> = {
  forge: {
    icon: Zap,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
  },
  osint: {
    icon: Globe,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
  },
  verification: {
    icon: ShieldCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
  },
};

// ── Relative time ───────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateHash(hash: string, start = 8, end = 8): string {
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

// ── Grounding badge ─────────────────────────────────────────────
function GroundingBadge({ status }: { status: string }) {
  if (status === 'grounded') {
    return (
      <span className="badge-success flex items-center gap-1 text-xs">
        <ShieldCheck className="w-3 h-3" />
        Verified
      </span>
    );
  }
  if (status === 'invalid') {
    return (
      <span className="badge-error flex items-center gap-1 text-xs">
        <Activity className="w-3 h-3" />
        Invalid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
}

// ── Component ───────────────────────────────────────────────────
export const ActivityRow: React.FC<ActivityRowProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const category = getCategory(item.actionType);
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const timestamp = item.createdAt || item.verifiedAt;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        {/* Left: Icon + Details */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg} border ${config.border}`}
          >
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium text-sm">
                {getActionLabel(item.actionType)}
              </span>
              <code className="text-gray-500 font-mono text-xs hidden sm:inline">
                {truncateHash(item.receiptHash)}
              </code>
              <button
                onClick={handleCopy}
                className="p-1 text-gray-500 hover:text-white hover:bg-gray-700/50 rounded transition-colors hidden sm:block"
                title="Copy full hash"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.agentId.length > 20
                  ? `${item.agentId.slice(0, 20)}...`
                  : item.agentId}
              </span>
              {timestamp && (
                <span className="flex items-center gap-1" title={fullDate(timestamp)}>
                  <Clock className="w-3 h-3" />
                  {relativeTime(timestamp)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Badge + Expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <GroundingBadge status={item.groundingStatus} />
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
              {/* Verification checks */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.result.signature_valid ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    <Check
                      className={`w-2.5 h-2.5 ${
                        item.result.signature_valid ? 'text-green-400' : 'text-red-400'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-400">Signature</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.result.chain_valid ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    <Check
                      className={`w-2.5 h-2.5 ${
                        item.result.chain_valid ? 'text-green-400' : 'text-red-400'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-400">Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.result.timestamp_valid ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    <Check
                      className={`w-2.5 h-2.5 ${
                        item.result.timestamp_valid ? 'text-green-400' : 'text-red-400'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-400">Timestamp</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Receipt:</span>
                  <code className="text-gray-300 font-mono text-xs">
                    {truncateHash(item.receiptHash, 12, 12)}
                  </code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Agent:</span>
                  <code className="text-gray-300 font-mono text-xs">{item.agentId}</code>
                </div>
                {item.signatureType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Signature:</span>
                    <code className="text-gray-300 font-mono text-xs">
                      {item.signatureType}
                    </code>
                  </div>
                )}
                {item.chainSequence > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Chain #:</span>
                    <span className="text-gray-300">{item.chainSequence}</span>
                  </div>
                )}
              </div>

              {/* View receipt link */}
              <div className="mt-3">
                <a
                  href={`/r/${item.receiptHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Receipt
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
