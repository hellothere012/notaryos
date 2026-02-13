import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react';
import { ApiKey } from '../../types';

interface KeyRowProps {
  apiKey: ApiKey;
  onRevoke: (id: string) => Promise<void>;
  onRotate: (id: string) => Promise<void>;
}

export const KeyRow: React.FC<KeyRowProps> = ({ apiKey, onRevoke, onRotate }) => {
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format relative time for last used
  const formatLastUsed = (dateString?: string): string => {
    if (!dateString) return 'Never used';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Handle copy key prefix
  const handleCopyPrefix = async () => {
    await navigator.clipboard.writeText(apiKey.prefix + '...');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle revoke
  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke(apiKey.id);
    } finally {
      setIsRevoking(false);
      setShowRevokeConfirm(false);
    }
  };

  // Handle rotate
  const handleRotate = async () => {
    setIsRotating(true);
    try {
      await onRotate(apiKey.id);
    } finally {
      setIsRotating(false);
    }
  };

  // Permission badge color mapping
  const getPermissionBadgeClass = (permission: string): string => {
    switch (permission) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'write':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'read':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="card-hover p-4"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Key Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5 text-purple-400" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {/* Name and Key Prefix */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-medium truncate">{apiKey.name}</h3>
                <button
                  onClick={handleCopyPrefix}
                  className="flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors font-mono"
                  title="Copy key prefix"
                >
                  {apiKey.prefix}...
                  {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Created {formatDate(apiKey.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {formatLastUsed(apiKey.lastUsedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {apiKey.permissions.map((permission) => (
              <span
                key={permission}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPermissionBadgeClass(
                  permission
                )}`}
              >
                {permission}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRotate}
              disabled={isRotating}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50"
              title="Rotate key"
            >
              <RotateCcw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowRevokeConfirm(true)}
              disabled={isRevoking}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Revoke key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* IP Allowlist (if present) */}
        {apiKey.ipAllowlist && apiKey.ipAllowlist.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">
              <span className="font-medium">IP Allowlist:</span>{' '}
              {apiKey.ipAllowlist.join(', ')}
            </p>
          </div>
        )}
      </motion.div>

      {/* Revoke Confirmation Dialog */}
      <AnimatePresence>
        {showRevokeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRevokeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Revoke API Key</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to revoke <span className="font-medium text-white">"{apiKey.name}"</span>?
                Any applications using this key will immediately lose access.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRevokeConfirm(false)}
                  className="btn-secondary"
                  disabled={isRevoking}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRevoking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Revoke Key
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
