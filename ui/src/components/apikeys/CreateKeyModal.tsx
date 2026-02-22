import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Edit,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { CreateApiKeyRequest, CreateApiKeyResponse } from '../../types';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateApiKeyRequest) => Promise<CreateApiKeyResponse>;
}

type Permission = 'read' | 'write' | 'admin';

export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>(['read']);
  const [ipAllowlist, setIpAllowlist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Toggle permission
  const togglePermission = (perm: Permission) => {
    setPermissions((prev) => {
      if (prev.includes(perm)) {
        // Must have at least read permission
        if (perm === 'read' && prev.length === 1) return prev;
        return prev.filter((p) => p !== perm);
      }
      return [...prev, perm];
    });
  };

  // Add IP to allowlist
  const handleAddIp = () => {
    const trimmed = newIp.trim();
    if (!trimmed) return;

    // Basic IP validation (IPv4 or CIDR)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(trimmed)) {
      setError('Invalid IP address format');
      return;
    }

    if (!ipAllowlist.includes(trimmed)) {
      setIpAllowlist((prev) => [...prev, trimmed]);
    }
    setNewIp('');
    setError(null);
  };

  // Remove IP from allowlist
  const handleRemoveIp = (ip: string) => {
    setIpAllowlist((prev) => prev.filter((i) => i !== ip));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a key name');
      return;
    }

    if (permissions.length === 0) {
      setError('Please select at least one permission');
      return;
    }

    setIsCreating(true);

    try {
      const response = await onCreate({
        name: name.trim(),
        permissions,
        ipAllowlist: ipAllowlist.length > 0 ? ipAllowlist : undefined,
      });
      setCreatedKey(response.key);
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy key to clipboard
  const handleCopy = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset and close
  const handleClose = () => {
    setName('');
    setPermissions(['read']);
    setIpAllowlist([]);
    setNewIp('');
    setError(null);
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  // Permission descriptions
  const permissionInfo: Record<Permission, { label: string; description: string; color: string }> = {
    read: {
      label: 'Read',
      description: 'Verify receipts and view history',
      color: 'green',
    },
    write: {
      label: 'Write',
      description: 'Create and sign receipts',
      color: 'yellow',
    },
    admin: {
      label: 'Admin',
      description: 'Manage keys and access settings',
      color: 'red',
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="card max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Key className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {createdKey ? 'API Key Created' : 'Create API Key'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {createdKey
                      ? 'Save this key securely'
                      : 'Generate a new API key for your application'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {createdKey ? (
              /* Success State - Show Created Key */
              <div className="space-y-4">
                {/* Warning */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Important</p>
                    <p className="text-sm text-yellow-300/80 mt-1">
                      This is the only time you will see this key. Copy it now and store it securely.
                      You will not be able to view it again.
                    </p>
                  </div>
                </div>

                {/* Key Display */}
                <div className="p-4 bg-gray-800/80 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm text-green-400 font-mono break-all flex-1">
                      {createdKey}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Done Button */}
                <button onClick={handleClose} className="w-full btn-primary py-3">
                  Done
                </button>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {/* Key Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Key Name
                  </label>
                  <div className="relative">
                    <Edit className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Production API Key"
                      className="input-field pl-10"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A friendly name to identify this key
                  </p>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {(Object.keys(permissionInfo) as Permission[]).map((perm) => {
                      const info = permissionInfo[perm];
                      const isSelected = permissions.includes(perm);
                      const colorClass =
                        info.color === 'green'
                          ? 'border-green-500/50 bg-green-500/10'
                          : info.color === 'yellow'
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-red-500/50 bg-red-500/10';

                      return (
                        <label
                          key={perm}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? colorClass
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePermission(perm)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
                          />
                          <div>
                            <span className="text-white font-medium">{info.label}</span>
                            <p className="text-sm text-gray-400">{info.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* IP Allowlist (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    IP Allowlist <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddIp();
                          }
                        }}
                        placeholder="e.g., 192.168.1.0/24"
                        className="input-field pl-10"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddIp}
                      className="btn-secondary flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to allow requests from any IP address
                  </p>

                  {/* IP List */}
                  {ipAllowlist.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ipAllowlist.map((ip) => (
                        <span
                          key={ip}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded text-sm text-gray-300 font-mono"
                        >
                          {ip}
                          <button
                            type="button"
                            onClick={() => handleRemoveIp(ip)}
                            className="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Security Note */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-start gap-2">
                  <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-300/80">
                    API keys grant access to your account. Store them securely and never share them
                    in public repositories.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-secondary"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Create Key
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
