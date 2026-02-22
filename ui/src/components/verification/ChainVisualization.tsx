import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  CheckCircle2,
  XCircle,
  Clock,
  Hash,
  X,
  ExternalLink,
} from 'lucide-react';
import { VerificationHistoryItem } from '../../types';

interface ChainVisualizationProps {
  recentVerifications?: VerificationHistoryItem[];
}

// Mock data for demonstration when no real data is available
const generateMockData = (): VerificationHistoryItem[] => {
  const now = Date.now();
  return [
    {
      id: 'v1',
      receiptHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
      isValid: true,
      verifiedAt: new Date(now - 5 * 60 * 1000).toISOString(),
      result: {
        valid: true,
        message: 'Receipt verified successfully',
        signature_valid: true,
        chain_valid: true,
        timestamp_valid: true,
        details: {
          receipt_hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
          algorithm: 'HMAC-SHA256',
          signed_at: new Date(now - 10 * 60 * 1000).toISOString(),
          signer_id: 'notary-primary',
          chain_position: 1247,
        },
      },
    },
    {
      id: 'v2',
      receiptHash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
      isValid: true,
      verifiedAt: new Date(now - 15 * 60 * 1000).toISOString(),
      result: {
        valid: true,
        message: 'Receipt verified successfully',
        signature_valid: true,
        chain_valid: true,
        timestamp_valid: true,
        details: {
          receipt_hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
          algorithm: 'HMAC-SHA256',
          signed_at: new Date(now - 20 * 60 * 1000).toISOString(),
          signer_id: 'notary-primary',
          chain_position: 1246,
        },
      },
    },
    {
      id: 'v3',
      receiptHash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
      isValid: false,
      verifiedAt: new Date(now - 30 * 60 * 1000).toISOString(),
      result: {
        valid: false,
        message: 'Signature verification failed',
        signature_valid: false,
        chain_valid: true,
        timestamp_valid: true,
        errors: ['Invalid signature: hash mismatch'],
      },
    },
    {
      id: 'v4',
      receiptHash: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3',
      isValid: true,
      verifiedAt: new Date(now - 45 * 60 * 1000).toISOString(),
      result: {
        valid: true,
        message: 'Receipt verified successfully',
        signature_valid: true,
        chain_valid: true,
        timestamp_valid: true,
        details: {
          receipt_hash: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3',
          algorithm: 'HMAC-SHA256',
          signed_at: new Date(now - 50 * 60 * 1000).toISOString(),
          signer_id: 'notary-primary',
          chain_position: 1244,
        },
      },
    },
    {
      id: 'v5',
      receiptHash: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4',
      isValid: true,
      verifiedAt: new Date(now - 60 * 60 * 1000).toISOString(),
      result: {
        valid: true,
        message: 'Receipt verified successfully',
        signature_valid: true,
        chain_valid: true,
        timestamp_valid: true,
        details: {
          receipt_hash: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4',
          algorithm: 'HMAC-SHA256',
          signed_at: new Date(now - 65 * 60 * 1000).toISOString(),
          signer_id: 'notary-primary',
          chain_position: 1243,
        },
      },
    },
  ];
};

export const ChainVisualization: React.FC<ChainVisualizationProps> = ({
  recentVerifications,
}) => {
  const [selectedNode, setSelectedNode] = useState<VerificationHistoryItem | null>(null);
  const [data, setData] = useState<VerificationHistoryItem[]>([]);

  // Use provided data or mock data
  useEffect(() => {
    if (recentVerifications && recentVerifications.length > 0) {
      setData(recentVerifications.slice(0, 5));
    } else {
      setData(generateMockData());
    }
  }, [recentVerifications]);

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Truncate hash for display
  const truncateHash = (hash: string): string => {
    if (hash.length <= 10) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Verification Chain</h3>
            <p className="text-xs text-gray-500">Recent verifications</p>
          </div>
        </div>
      </div>

      {/* Hexagonal Chain Visualization */}
      <div className="relative py-4">
        {/* Connection Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {data.slice(0, -1).map((_, index) => {
            const startY = 40 + index * 56;
            const endY = 40 + (index + 1) * 56;
            return (
              <motion.line
                key={`line-${index}`}
                x1="28"
                y1={startY + 20}
                x2="28"
                y2={endY - 4}
                stroke={data[index].isValid && data[index + 1].isValid ? '#8b5cf6' : '#6b7280'}
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              />
            );
          })}
        </svg>

        {/* Chain Nodes */}
        <div className="relative space-y-3" style={{ zIndex: 1 }}>
          {data.map((item, index) => (
            <ChainNode
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedNode?.id === item.id}
              onClick={() => setSelectedNode(item)}
              formatRelativeTime={formatRelativeTime}
              truncateHash={truncateHash}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Valid</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Invalid</span>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailModal
            item={selectedNode}
            onClose={() => setSelectedNode(null)}
            formatRelativeTime={formatRelativeTime}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Chain Node Component (Hexagonal design)
interface ChainNodeProps {
  item: VerificationHistoryItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  formatRelativeTime: (ts: string) => string;
  truncateHash: (hash: string) => string;
}

const ChainNode: React.FC<ChainNodeProps> = ({
  item,
  index,
  isSelected,
  onClick,
  formatRelativeTime,
  truncateHash,
}) => (
  <motion.button
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-gray-800/50 ${
      isSelected ? 'bg-gray-800/70 ring-1 ring-purple-500/50' : ''
    }`}
  >
    {/* Hexagonal Status Indicator */}
    <div className="relative">
      <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
        <motion.polygon
          points="20,2 38,12 38,28 20,38 2,28 2,12"
          fill={item.isValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
          stroke={item.isValid ? '#10b981' : '#ef4444'}
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {item.isValid ? (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>

    {/* Node Info */}
    <div className="flex-1 text-left min-w-0">
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono text-white truncate">
          {truncateHash(item.receiptHash)}
        </code>
        {item.result.details?.chain_position && (
          <span className="badge-purple text-xs">
            #{item.result.details.chain_position}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Clock className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-500">
          {formatRelativeTime(item.verifiedAt)}
        </span>
      </div>
    </div>

    {/* View Detail Indicator */}
    <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
  </motion.button>
);

// Node Detail Modal
interface NodeDetailModalProps {
  item: VerificationHistoryItem;
  onClose: () => void;
  formatRelativeTime: (ts: string) => string;
}

const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  item,
  onClose,
  formatRelativeTime,
}) => (
  <>
    {/* Backdrop */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      onClick={onClose}
    />

    {/* Modal */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-800 rounded-xl border border-gray-700 shadow-2xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              item.isValid
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {item.isValid ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {item.isValid ? 'Valid Receipt' : 'Invalid Receipt'}
            </h3>
            <p className="text-xs text-gray-500">
              Verified {formatRelativeTime(item.verifiedAt)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Receipt Hash */}
        <div>
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Hash className="w-4 h-4" />
            <span className="text-sm font-medium">Receipt Hash</span>
          </div>
          <code className="block text-xs font-mono text-white bg-gray-900/50 p-3 rounded-lg break-all">
            {item.receiptHash}
          </code>
        </div>

        {/* Validation Status */}
        <div>
          <p className="text-sm font-medium text-gray-400 mb-2">Validation Status</p>
          <div className="grid grid-cols-3 gap-2">
            <StatusChip
              label="Signature"
              valid={item.result.signature_valid}
            />
            <StatusChip
              label="Chain"
              valid={item.result.chain_valid}
            />
            <StatusChip
              label="Timestamp"
              valid={item.result.timestamp_valid}
            />
          </div>
        </div>

        {/* Additional Details */}
        {item.result.details && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-900/30 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Algorithm</p>
              <p className="text-sm text-white font-mono">
                {item.result.details.algorithm}
              </p>
            </div>
            {item.result.details.chain_position && (
              <div className="p-3 bg-gray-900/30 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Chain Position</p>
                <p className="text-sm text-white font-mono">
                  #{item.result.details.chain_position}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {item.result.errors && item.result.errors.length > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm font-medium text-red-400 mb-2">Errors</p>
            <ul className="space-y-1">
              {item.result.errors.map((error, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Message */}
        <div className="p-3 bg-gray-900/30 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Message</p>
          <p className="text-sm text-gray-300">{item.result.message}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button onClick={onClose} className="w-full btn-secondary">
          Close
        </button>
      </div>
    </motion.div>
  </>
);

// Status Chip Component
interface StatusChipProps {
  label: string;
  valid: boolean;
}

const StatusChip: React.FC<StatusChipProps> = ({ label, valid }) => (
  <div
    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium ${
      valid
        ? 'bg-green-500/20 text-green-400'
        : 'bg-red-500/20 text-red-400'
    }`}
  >
    {valid ? (
      <CheckCircle2 className="w-3.5 h-3.5" />
    ) : (
      <XCircle className="w-3.5 h-3.5" />
    )}
    <span>{label}</span>
  </div>
);
