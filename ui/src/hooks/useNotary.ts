/**
 * useNotary - Custom hook for notary operations
 *
 * Features:
 * - verify(receipt): Promise<VerificationResult>
 * - getHistory(filters): Promise<PaginatedResponse<VerificationHistoryItem>>
 * - Loading and error states
 * - Automatic error handling
 */

import { useState, useCallback } from 'react';
import { authClient, publicClient, API_ENDPOINTS } from '../config/api';
import {
  VerificationReceipt,
  VerificationResult,
  VerificationHistoryItem,
  HistoryFilters,
  PaginatedResponse,
} from '../types';

/**
 * Hook state interface
 */
interface UseNotaryState {
  isVerifying: boolean;
  isFetchingHistory: boolean;
  verifyError: string | null;
  historyError: string | null;
  lastResult: VerificationResult | null;
}

/**
 * Hook return interface
 */
interface UseNotaryReturn extends UseNotaryState {
  /** Verify a receipt signature */
  verify: (receipt: VerificationReceipt | string) => Promise<VerificationResult>;

  /** Get verification history (requires auth) */
  getHistory: (filters?: HistoryFilters, page?: number, pageSize?: number) => Promise<PaginatedResponse<VerificationHistoryItem>>;

  /** Clear error states */
  clearErrors: () => void;

  /** Clear last result */
  clearResult: () => void;
}

/**
 * useNotary Hook
 *
 * @example
 * ```tsx
 * const { verify, isVerifying, verifyError, lastResult } = useNotary();
 *
 * const handleVerify = async () => {
 *   try {
 *     const result = await verify(receiptJson);
 *     console.log('Valid:', result.valid);
 *   } catch (err) {
 *     console.error('Verification failed:', err);
 *   }
 * };
 * ```
 */
export const useNotary = (): UseNotaryReturn => {
  // State
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);

  /**
   * Verify a receipt signature
   *
   * @param receipt - The receipt object or JSON string to verify
   * @returns Promise resolving to verification result
   * @throws Error if verification request fails
   */
  const verify = useCallback(async (
    receipt: VerificationReceipt | string
  ): Promise<VerificationResult> => {
    setIsVerifying(true);
    setVerifyError(null);

    try {
      // Parse receipt if it's a string
      let receiptData: VerificationReceipt;

      if (typeof receipt === 'string') {
        try {
          receiptData = JSON.parse(receipt);
        } catch (parseError) {
          throw new Error('Invalid JSON format. Please provide valid receipt JSON.');
        }
      } else {
        receiptData = receipt;
      }

      // Validate required fields
      if (!receiptData.receipt_hash || !receiptData.signature) {
        throw new Error('Missing required fields: receipt_hash and signature are required.');
      }

      // Send verification request (public endpoint - no auth required)
      const response = await publicClient.post<VerificationResult>(
        API_ENDPOINTS.verify,
        receiptData
      );

      const result = response.data;
      setLastResult(result);

      return result;
    } catch (err: any) {
      // Extract error message
      let errorMessage: string;

      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Verification request failed. Please try again.';
      }

      setVerifyError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  }, []);

  /**
   * Get verification history
   *
   * @param filters - Optional filters for history query
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @returns Promise resolving to paginated history items
   * @throws Error if request fails
   */
  const getHistory = useCallback(async (
    filters?: HistoryFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<VerificationHistoryItem>> => {
    setIsFetchingHistory(true);
    setHistoryError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('page_size', String(pageSize));

      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters?.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('end_date', filters.endDate);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      // Fetch history (requires auth)
      const response = await authClient.get<PaginatedResponse<VerificationHistoryItem>>(
        `${API_ENDPOINTS.history}?${params.toString()}`
      );

      return response.data;
    } catch (err: any) {
      // Extract error message
      let errorMessage: string;

      if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in to view history.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Failed to fetch history. Please try again.';
      }

      setHistoryError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsFetchingHistory(false);
    }
  }, []);

  /**
   * Clear all error states
   */
  const clearErrors = useCallback(() => {
    setVerifyError(null);
    setHistoryError(null);
  }, []);

  /**
   * Clear last verification result
   */
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    // State
    isVerifying,
    isFetchingHistory,
    verifyError,
    historyError,
    lastResult,

    // Methods
    verify,
    getHistory,
    clearErrors,
    clearResult,
  };
};

/**
 * Sample receipt for testing (exported for convenience)
 */
export const SAMPLE_RECEIPT: VerificationReceipt = {
  receipt_hash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef',
  original_hash: 'sha256:0123456789abcdef0123456789abcdef01234567',
  signature: 'base64:SGVsbG8gV29ybGQhIFRoaXMgaXMgYSBzYW1wbGUgc2lnbmF0dXJl',
  signed_at: new Date().toISOString(),
  signer_id: 'notary-v1-hmac',
  protocol_version: '1.0',
  chain: {
    previous_hash: 'sha256:00000000000000000000000000000000genesis',
    sequence_number: 1,
    chain_signature: 'base64:Y2hhaW4tc2lnbmF0dXJlLWV4YW1wbGU=',
  },
};

export default useNotary;
