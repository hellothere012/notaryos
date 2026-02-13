/**
 * NotaryOS TypeScript SDK - Cryptographic Receipt Verification in 3 Lines
 *
 * Usage:
 *   import { NotaryClient } from './notary-sdk';
 *   const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
 *   const receipt = await notary.issue('my_action', { key: 'value' });
 *
 * Zero dependencies - uses native fetch (Node 18+ / browser / Deno / Bun).
 */

export const SDK_VERSION = '1.0.0';

// =============================================================================
// Types
// =============================================================================

export interface NotaryConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface Receipt {
  receipt_id: string;
  timestamp: string;
  agent_id: string;
  action_type: string;
  payload_hash: string;
  signature: string;
  signature_type: string;
  key_id: string;
  kid?: string;
  alg?: string;
  schema_version?: string;
  chain_sequence?: number;
  previous_receipt_hash?: string | null;
  receipt_hash?: string;
  verify_url?: string;
}

export interface VerificationResult {
  valid: boolean;
  signature_ok: boolean;
  structure_ok: boolean;
  chain_ok?: boolean | null;
  reason: string;
  details: Record<string, unknown>;
  from_cache?: boolean;
}

export interface ServiceStatus {
  status: string;
  signature_type: string;
  key_id: string;
  has_public_key: boolean;
  capabilities: string[];
  timestamp: string;
}

export interface PublicKeyInfo {
  key_id: string;
  signature_type: string;
  public_key_pem: string;
  verification_note: string;
}

export interface AgentInfo {
  agent_id: string;
  agent_name: string;
  tier: string;
  scopes: string[];
  rate_limit_per_minute: number;
}

export interface IssueOptions {
  previousReceiptHash?: string;
  metadata?: Record<string, unknown>;
}

export interface NotaryErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Errors
// =============================================================================

export class NotaryError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;

  constructor(message: string, code = '', status = 0, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'NotaryError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class AuthenticationError extends NotaryError {
  constructor(message: string, code = 'ERR_INVALID_API_KEY') {
    super(message, code, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends NotaryError {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'ERR_RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends NotaryError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'ERR_VALIDATION_FAILED', 422, details);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// Client
// =============================================================================

export class NotaryClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  static readonly DEFAULT_BASE_URL = 'https://api.agenttownsquare.com';
  static readonly DEFAULT_TIMEOUT = 30_000; // ms

  constructor(config: NotaryConfig) {
    const { apiKey, baseUrl, timeout, maxRetries } = config;

    if (!apiKey || !(apiKey.startsWith('notary_live_') || apiKey.startsWith('notary_test_'))) {
      throw new AuthenticationError(
        'Invalid API key format. Keys must start with notary_live_ or notary_test_'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || NotaryClient.DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = timeout || NotaryClient.DEFAULT_TIMEOUT;
    this.maxRetries = maxRetries ?? 2;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/v1/notary${path}`;
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': `notary-typescript-sdk/${SDK_VERSION}`,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          return text ? JSON.parse(text) : ({} as T);
        }

        // Handle errors
        let errorData: { error?: NotaryErrorDetail } = {};
        try {
          errorData = await response.json();
        } catch {
          // Response body not JSON
        }

        const errorInfo = errorData.error || { message: response.statusText, code: '' };
        const errorMsg = errorInfo.message || response.statusText;
        const errorCode = errorInfo.code || '';

        if (response.status === 401) {
          throw new AuthenticationError(errorMsg, errorCode);
        }
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          if (attempt < this.maxRetries) {
            await this.sleep(Math.min(retryAfter * 1000, 5000));
            continue;
          }
          throw new RateLimitError(errorMsg, retryAfter);
        }
        if (response.status === 422) {
          throw new ValidationError(errorMsg, errorInfo.details || {});
        }
        if (response.status >= 500 && attempt < this.maxRetries) {
          await this.sleep(2 ** attempt * 1000);
          lastError = new NotaryError(errorMsg, errorCode, response.status);
          continue;
        }

        throw new NotaryError(errorMsg, errorCode, response.status, errorInfo.details || {});
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof NotaryError) throw err;

        if (attempt < this.maxRetries) {
          await this.sleep(2 ** attempt * 1000);
          lastError = err as Error;
          continue;
        }

        throw new NotaryError(
          `Connection failed: ${(err as Error).message}`,
          'ERR_CONNECTION'
        );
      }
    }

    throw lastError || new NotaryError('Request failed', 'ERR_UNKNOWN');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Issue a signed receipt for an action.
   *
   * @example
   * const receipt = await notary.issue('my_action', { key: 'value' });
   */
  async issue(
    actionType: string,
    payload: Record<string, unknown>,
    options: IssueOptions = {}
  ): Promise<Receipt> {
    const body: Record<string, unknown> = {
      action_type: actionType,
      payload,
    };
    if (options.previousReceiptHash) {
      body.previous_receipt_hash = options.previousReceiptHash;
    }
    if (options.metadata) {
      body.metadata = options.metadata;
    }

    const response = await this.request<{
      receipt: Receipt;
      receipt_hash: string;
      verify_url: string;
      chain_position?: number;
    }>('POST', '/issue', body);

    return {
      ...response.receipt,
      receipt_hash: response.receipt_hash,
      verify_url: response.verify_url,
      chain_sequence: response.chain_position,
    };
  }

  /**
   * Verify a receipt's signature and integrity.
   *
   * @example
   * const result = await notary.verify(receipt);
   * console.log(result.valid); // true
   */
  async verify(receipt: Receipt | Record<string, unknown>): Promise<VerificationResult> {
    return this.request<VerificationResult>('POST', '/verify', { receipt });
  }

  /**
   * Verify a receipt by its ID (server-side lookup).
   */
  async verifyById(receiptId: string): Promise<VerificationResult> {
    return this.request<VerificationResult>('POST', '/verify', { receipt_id: receiptId });
  }

  /**
   * Get Notary service status.
   *
   * @example
   * const status = await notary.status();
   * console.log(status.status); // "active"
   */
  async status(): Promise<ServiceStatus> {
    return this.request<ServiceStatus>('GET', '/status');
  }

  /**
   * Get the public key for offline verification.
   */
  async publicKey(): Promise<PublicKeyInfo> {
    return this.request<PublicKeyInfo>('GET', '/public-key');
  }

  /**
   * Get authenticated agent info.
   */
  async me(): Promise<AgentInfo> {
    return this.request<AgentInfo>('GET', '/agents/me');
  }
}

// =============================================================================
// Convenience function (no API key needed for verification)
// =============================================================================

/**
 * Quick receipt verification without API key.
 *
 * @example
 * const isValid = await verifyReceipt(receiptJson);
 */
export async function verifyReceipt(
  receipt: Record<string, unknown>,
  baseUrl = NotaryClient.DEFAULT_BASE_URL
): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/notary/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt }),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.valid === true;
  } catch {
    return false;
  }
}
