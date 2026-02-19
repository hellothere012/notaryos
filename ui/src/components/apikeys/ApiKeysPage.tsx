import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Plus,
  Shield,
  AlertCircle,
  Loader2,
  RefreshCcw,
  KeyRound,
} from 'lucide-react';
import { authClient, API_ENDPOINTS } from '../../config/api';
import { ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from '../../types';
import { KeyRow } from './KeyRow';
import { CreateKeyModal } from './CreateKeyModal';

export const ApiKeysPage: React.FC = () => {
  // State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authClient.get(API_ENDPOINTS.apiKeys);
      // Extract keys array from response — must check Array.isArray first
      // because Array.prototype.keys is a built-in method (truthy function)
      // that would short-circuit a naive `response.data.keys || ...` chain.
      const data = response.data;
      const keys = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.keys)
            ? data.keys
            : [];
      setApiKeys(keys);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  // Create new API key
  const handleCreateKey = async (data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
    const response = await authClient.post(API_ENDPOINTS.createApiKey, data);

    // Add the new key to the list
    if (response.data.apiKey) {
      setApiKeys((prev) => [response.data.apiKey, ...prev]);
    } else {
      // Refresh the list if we don't get the key back
      fetchApiKeys();
    }

    return response.data;
  };

  // Revoke API key
  const handleRevokeKey = async (keyId: string): Promise<void> => {
    await authClient.delete(API_ENDPOINTS.revokeApiKey(keyId));
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
  };

  // Rotate API key
  const handleRotateKey = async (keyId: string): Promise<void> => {
    const response = await authClient.post(API_ENDPOINTS.rotateApiKey(keyId));

    // Update the key in the list if we get a new one back
    if (response.data.apiKey) {
      setApiKeys((prev) =>
        prev.map((key) => (key.id === keyId ? response.data.apiKey : key))
      );
    }

    // Show the new key to the user
    if (response.data.key) {
      // Open modal with new key displayed
      alert(`New key generated: ${response.data.key}\n\nSave this key - it won't be shown again!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400">
            Manage your API keys for programmatic access to the verification system
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Security Note */}
      <div className="card mb-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-medium mb-1">API Key Security</h3>
          <p className="text-sm text-gray-400">
            API keys provide full access to your account. Store them securely, never share them in
            public repositories, and rotate them regularly. Use IP allowlists to restrict access
            from trusted sources only.
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        /* Loading State */
        <div className="card flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading API keys...</p>
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Failed to load API keys</h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchApiKeys}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      ) : apiKeys.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No API Keys</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You haven't created any API keys yet. Create one to start using the verification API
            programmatically.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Key
          </button>
        </motion.div>
      ) : (
        /* Keys List */
        <div className="space-y-4">
          {/* List Header */}
          <div className="flex items-center justify-between px-4">
            <span className="text-sm text-gray-500">
              {apiKeys.length} {apiKeys.length === 1 ? 'key' : 'keys'}
            </span>
            <button
              onClick={fetchApiKeys}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Keys */}
          <AnimatePresence mode="popLayout">
            {apiKeys.map((key) => (
              <KeyRow
                key={key.id}
                apiKey={key}
                onRevoke={handleRevokeKey}
                onRotate={handleRotateKey}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Key Modal */}
      <CreateKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateKey}
      />
    </div>
  );
};
