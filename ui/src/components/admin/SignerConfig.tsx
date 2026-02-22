/**
 * SignerConfig - Signer configuration management panel
 *
 * Features:
 * - Display current signer configuration
 * - Warning banner before key rotation
 * - Confirmation modal with "type ROTATE to confirm" input
 * - Switch signer type (HMAC/Ed25519)
 * - Success/error feedback with toast-like notification
 */

import React, { useState } from 'react';
import { authClient, API_ENDPOINTS } from '../../config/api';
import { SignerConfig } from '../../types';

// Icons
const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Toast notification type
 */
type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  type: ToastType;
  message: string;
}

/**
 * SignerConfigPanel Props
 */
interface SignerConfigPanelProps {
  config: SignerConfig | null;
  onConfigUpdate: (config: SignerConfig) => void;
}

/**
 * SignerConfigPanel Component
 */
export const SignerConfigPanel: React.FC<SignerConfigPanelProps> = ({
  config,
  onConfigUpdate,
}) => {
  // State
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [selectedSignerType, setSelectedSignerType] = useState<'hmac' | 'ed25519'>(
    config?.signerType || 'hmac'
  );
  const [isRotating, setIsRotating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  /**
   * Show toast notification
   */
  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  /**
   * Handle key rotation
   */
  const handleRotateKey = async () => {
    if (confirmText !== 'ROTATE') {
      showToast('error', 'Please type ROTATE to confirm');
      return;
    }

    setIsRotating(true);

    try {
      const response = await authClient.post(API_ENDPOINTS.rotateKey, {
        signerType: selectedSignerType,
      });

      // Update config in parent
      if (response.data) {
        onConfigUpdate(response.data);
      }

      showToast('success', 'Key rotated successfully. New key is now active.');
      setShowRotateModal(false);
      setConfirmText('');
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to rotate key';
      showToast('error', message);
    } finally {
      setIsRotating(false);
    }
  };

  /**
   * Handle signer type switch
   */
  const handleSwitchSignerType = async (newType: 'hmac' | 'ed25519') => {
    if (newType === config?.signerType) {
      return;
    }

    setIsSwitching(true);

    try {
      const response = await authClient.put(API_ENDPOINTS.signerConfig, {
        signerType: newType,
      });

      if (response.data) {
        onConfigUpdate(response.data);
        setSelectedSignerType(newType);
      }

      showToast('success', `Switched to ${newType.toUpperCase()} signer`);
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to switch signer type';
      showToast('error', message);
    } finally {
      setIsSwitching(false);
    }
  };

  /**
   * Close modal and reset state
   */
  const closeModal = () => {
    setShowRotateModal(false);
    setConfirmText('');
  };

  return (
    <>
      {/* Configuration Panel */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <KeyIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Signer Configuration</h2>
        </div>

        {/* Signer Type Selector */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Signer Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSwitchSignerType('hmac')}
              disabled={isSwitching}
              className={`p-4 rounded-lg border-2 transition-all text-left
                ${config?.signerType === 'hmac'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                }
                ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-medium">HMAC-SHA256</span>
                {config?.signerType === 'hmac' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Symmetric signing. Fast and simple. Requires shared secret for verification.
              </p>
            </button>

            <button
              onClick={() => handleSwitchSignerType('ed25519')}
              disabled={isSwitching}
              className={`p-4 rounded-lg border-2 transition-all text-left
                ${config?.signerType === 'ed25519'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                }
                ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-medium">Ed25519</span>
                {config?.signerType === 'ed25519' && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Asymmetric signing. Third-party verifiable with public key. Recommended for production.
              </p>
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium text-sm">Before Rotating Keys</p>
              <ul className="text-xs text-gray-400 mt-1 space-y-1">
                <li>- All receipts signed with the old key will become unverifiable</li>
                <li>- Update all dependent systems before rotation</li>
                <li>- This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rotate Key Button */}
        <button
          onClick={() => setShowRotateModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3
                    bg-red-500/20 hover:bg-red-500/30 border border-red-500/30
                    text-red-400 rounded-lg transition-colors"
        >
          <RefreshIcon className="w-5 h-5" />
          Rotate Signing Key
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50
                     flex items-start gap-3 animate-slide-up
                     ${toast.type === 'success'
                       ? 'bg-green-500/20 border border-green-500/30'
                       : toast.type === 'error'
                       ? 'bg-red-500/20 border border-red-500/30'
                       : 'bg-yellow-500/20 border border-yellow-500/30'
                     }`}
        >
          {toast.type === 'success' ? (
            <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : toast.type === 'error' ? (
            <XIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
          ) : (
            <AlertIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className={`text-sm
              ${toast.type === 'success'
                ? 'text-green-400'
                : toast.type === 'error'
                ? 'text-red-400'
                : 'text-yellow-400'
              }`}
            >
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <XIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Rotation Confirmation Modal */}
      {showRotateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Confirm Key Rotation</h3>
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300 mb-2">
                You are about to rotate the signing key. This action:
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  Generates a new {selectedSignerType.toUpperCase()} signing key
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  Invalidates all receipts signed with the current key
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  Cannot be undone
                </li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Type <span className="text-red-400 font-mono">ROTATE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="ROTATE"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                          text-white placeholder-gray-500 focus:outline-none focus:border-red-500
                          font-mono text-center tracking-widest"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={isRotating}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300
                          rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRotateKey}
                disabled={confirmText !== 'ROTATE' || isRotating}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2
                  ${confirmText === 'ROTATE'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isRotating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Rotating...
                  </>
                ) : (
                  <>
                    <RefreshIcon className="w-4 h-4" />
                    Rotate Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default SignerConfigPanel;
