/**
 * NotaryOS SDK - Cryptographic receipts for AI agent actions.
 *
 * Issue, verify, and audit agent behavior with Ed25519 signatures.
 * Zero dependencies. Uses native fetch() and Web Crypto API.
 *
 * Quick start (no signup needed):
 *
 *   import { NotaryClient } from 'notaryos';
 *   const notary = new NotaryClient();  // uses free demo key (10 req/min)
 *   const receipt = await notary.seal('my_action', { key: 'value' });
 *
 * Production (unlimited):
 *
 *   const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
 *
 * Verify without API key:
 *
 *   import { verifyReceipt } from 'notaryos';
 *   const isValid = await verifyReceipt(receiptJson);
 *
 * @packageDocumentation
 */

export const SDK_VERSION = '2.2.0';

// =============================================================================
// Types
// =============================================================================

/** Client configuration options. */
export interface NotaryConfig {
  /** Your Notary API key. If omitted, uses the free demo key (10 req/min). */
  apiKey?: string;
  /** API base URL (default: https://api.agenttownsquare.com). */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000). */
  timeout?: number;
  /** Max retry attempts on transient failures (default: 2). */
  maxRetries?: number;
}

/** A signed Notary receipt. */
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

/** Result of receipt verification. */
export interface VerificationResult {
  valid: boolean;
  signature_ok: boolean;
  structure_ok: boolean;
  chain_ok?: boolean | null;
  reason: string;
  details: Record<string, unknown>;
  from_cache?: boolean;
}

/** Notary service status. */
export interface ServiceStatus {
  status: string;
  signature_type: string;
  key_id: string;
  has_public_key: boolean;
  capabilities: string[];
  timestamp: string;
}

/** Public key for offline verification. */
export interface PublicKeyInfo {
  key_id: string;
  signature_type: string;
  public_key_pem: string;
  verification_note: string;
}

/** Authenticated agent information. */
export interface AgentInfo {
  agent_id: string;
  agent_name: string;
  tier: string;
  scopes: string[];
  rate_limit_per_minute: number;
}

/** Options for issuing receipts. */
export interface IssueOptions {
  /** Hash of previous receipt for chaining. */
  previousReceiptHash?: string;
  /** Additional metadata. */
  metadata?: Record<string, unknown>;
}

/** Object-form argument for issue()/seal(). */
export interface IssueRequest {
  /** Type of action (e.g., "data_processing", "api_call"). */
  actionType: string;
  /** Action payload to be receipted. */
  payload: Record<string, unknown>;
  /** Hash of previous receipt for chaining. */
  previousReceiptHash?: string;
  /** Additional metadata. */
  metadata?: Record<string, unknown>;
}

interface NotaryErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Errors
// =============================================================================

/** Base error for all NotaryOS SDK errors. */
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

/** Invalid or missing API key. */
export class AuthenticationError extends NotaryError {
  constructor(message: string, code = 'ERR_INVALID_API_KEY') {
    super(message, code, 401);
    this.name = 'AuthenticationError';
  }
}

/** Rate limit exceeded. */
export class RateLimitError extends NotaryError {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'ERR_RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/** Request validation failed. */
export class ValidationError extends NotaryError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'ERR_VALIDATION_FAILED', 422, details);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// Client
// =============================================================================

/**
 * NotaryOS API client.
 *
 * @example
 * ```typescript
 * // No signup needed — uses free demo key (10 req/min)
 * const notary = new NotaryClient();
 * const receipt = await notary.seal('data_processing', { key: 'value' });
 *
 * // Production (unlimited)
 * const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
 *
 * // Verify a receipt
 * const result = await notary.verify(receipt);
 * console.log(result.valid); // true
 * ```
 */
export class NotaryClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  static readonly DEFAULT_BASE_URL = 'https://api.agenttownsquare.com';
  static readonly DEFAULT_TIMEOUT = 30_000;
  static readonly DEMO_API_KEY = 'notary_test_public_demo_b0821da365e0e8ce';

  constructor(config: NotaryConfig = {}) {
    const { baseUrl, timeout, maxRetries } = config;
    const apiKey = config.apiKey || NotaryClient.DEMO_API_KEY;

    if (!(apiKey.startsWith('notary_live_') || apiKey.startsWith('notary_test_'))) {
      throw new AuthenticationError(
        'Invalid API key format. Keys must start with notary_live_ or notary_test_.\n\n' +
        '  Quick start (no signup):\n' +
        '    new NotaryClient()  // uses free demo key\n\n' +
        '  Production (unlimited):\n' +
        '    Sign up at https://notaryos.org to get your own key.\n'
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

  /**
   * Issue a signed receipt for an action.
   *
   * Supports two calling conventions:
   * - `issue('action_type', { key: 'value' })` — positional args
   * - `issue({ actionType: 'action_type', payload: { key: 'value' } })` — object form
   *
   * @example
   * ```typescript
   * // Positional (recommended)
   * const receipt = await notary.issue('transfer', { amount: 100 });
   *
   * // Object form
   * const receipt = await notary.issue({ actionType: 'transfer', payload: { amount: 100 } });
   * ```
   */
  async issue(
    actionTypeOrRequest: string | IssueRequest,
    payload?: Record<string, unknown>,
    options: IssueOptions = {}
  ): Promise<Receipt> {
    let actionType: string;
    let actionPayload: Record<string, unknown>;

    if (typeof actionTypeOrRequest === 'object' && actionTypeOrRequest !== null) {
      // Object form: issue({ actionType, payload, ... })
      actionType = actionTypeOrRequest.actionType;
      actionPayload = actionTypeOrRequest.payload || {};
      options = {
        previousReceiptHash: actionTypeOrRequest.previousReceiptHash,
        metadata: actionTypeOrRequest.metadata,
        ...options,
      };
    } else {
      // Positional form: issue('action_type', { key: 'value' })
      actionType = actionTypeOrRequest as string;
      actionPayload = payload || {};
    }

    if (!actionType || typeof actionType !== 'string') {
      throw new ValidationError('actionType is required and must be a non-empty string');
    }

    const body: Record<string, unknown> = {
      action_type: actionType,
      payload: actionPayload,
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

  /** Alias: seal() → issue() for the 3-line integration pattern. */
  seal = this.issue.bind(this);

  /**
   * Verify a receipt's signature and integrity.
   *
   * @param receipt - Receipt object or raw receipt dict
   * @returns VerificationResult with validity details
   *
   * @example
   * ```typescript
   * const result = await notary.verify(receipt);
   * if (result.valid) {
   *   console.log('Receipt is authentic');
   * }
   * ```
   */
  async verify(receipt: Receipt | Record<string, unknown>): Promise<VerificationResult> {
    return this.request<VerificationResult>('POST', '/verify', { receipt });
  }

  /** Verify a receipt by its ID (server-side lookup). */
  async verifyById(receiptId: string): Promise<VerificationResult> {
    return this.request<VerificationResult>('POST', '/verify', { receipt_id: receiptId });
  }

  /**
   * Get Notary service status.
   *
   * @example
   * ```typescript
   * const status = await notary.status();
   * console.log(status.status); // "active"
   * ```
   */
  async status(): Promise<ServiceStatus> {
    return this.request<ServiceStatus>('GET', '/status');
  }

  /** Get the public key for offline verification. */
  async publicKey(): Promise<PublicKeyInfo> {
    return this.request<PublicKeyInfo>('GET', '/public-key');
  }

  /** Get authenticated agent info. */
  async me(): Promise<AgentInfo> {
    return this.request<AgentInfo>('GET', '/agents/me');
  }
}

// =============================================================================
// Convenience: verify without API key (public endpoint)
// =============================================================================

/**
 * Quick receipt verification without API key.
 *
 * Uses the public /verify endpoint — no authentication needed.
 *
 * @param receipt - Receipt JSON object
 * @param baseUrl - API base URL (default: production)
 * @returns true if the receipt is valid
 *
 * @example
 * ```typescript
 * import { verifyReceipt } from 'notaryos';
 *
 * const isValid = await verifyReceipt(receiptJson);
 * console.log(isValid); // true
 * ```
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

/**
 * Compute SHA-256 hash of a payload using Web Crypto API.
 *
 * Matches the server-side hashing for independent verification.
 *
 * @param payload - String or JSON-serializable object
 * @returns Hex-encoded SHA-256 digest
 */
export async function computeHash(
  payload: Record<string, unknown> | string
): Promise<string> {
  const data =
    typeof payload === 'string'
      ? payload
      : JSON.stringify(payload, Object.keys(payload).sort());

  const encoded = new TextEncoder().encode(data);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(buffer);

  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}
