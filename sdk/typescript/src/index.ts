/**
 * NotaryOS SDK - Cryptographic receipts for AI agent actions.
 *
 * Issue, verify, and audit agent behavior with Ed25519 signatures.
 * Zero dependencies. Uses native fetch() and Web Crypto API.
 *
 * Quick start:
 *
 *   import { NotaryClient } from 'notaryos';
 *   const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
 *   const receipt = await notary.issue('my_action', { key: 'value' });
 *
 * Verify without API key:
 *
 *   import { verifyReceipt } from 'notaryos';
 *   const isValid = await verifyReceipt(receiptJson);
 *
 * @packageDocumentation
 */

export const SDK_VERSION = '2.0.0';

// =============================================================================
// Error Codes
// =============================================================================

/** Standardized error codes mirroring the backend API. */
export const NotaryErrorCode = {
  // 4xx Client Errors
  ERR_RECEIPT_NOT_FOUND: 'ERR_RECEIPT_NOT_FOUND',
  ERR_INVALID_SIGNATURE: 'ERR_INVALID_SIGNATURE',
  ERR_INVALID_STRUCTURE: 'ERR_INVALID_STRUCTURE',
  ERR_INVALID_TIMESTAMP: 'ERR_INVALID_TIMESTAMP',
  ERR_UNKNOWN_SIGNER: 'ERR_UNKNOWN_SIGNER',
  ERR_UNSUPPORTED_ALGORITHM: 'ERR_UNSUPPORTED_ALGORITHM',
  ERR_CHAIN_BROKEN: 'ERR_CHAIN_BROKEN',
  ERR_CHAIN_MISSING: 'ERR_CHAIN_MISSING',
  ERR_PAYLOAD_TOO_LARGE: 'ERR_PAYLOAD_TOO_LARGE',
  ERR_RATE_LIMIT_EXCEEDED: 'ERR_RATE_LIMIT_EXCEEDED',
  ERR_INVALID_API_KEY: 'ERR_INVALID_API_KEY',
  ERR_INSUFFICIENT_SCOPE: 'ERR_INSUFFICIENT_SCOPE',
  ERR_VALIDATION_FAILED: 'ERR_VALIDATION_FAILED',
  // 5xx Server Errors
  ERR_INTERNAL_ERROR: 'ERR_INTERNAL_ERROR',
  ERR_DATABASE_ERROR: 'ERR_DATABASE_ERROR',
  ERR_SIGNING_ERROR: 'ERR_SIGNING_ERROR',
} as const;

export type NotaryErrorCodeType = (typeof NotaryErrorCode)[keyof typeof NotaryErrorCode];

// =============================================================================
// Types
// =============================================================================

/** Client configuration options. */
export interface NotaryConfig {
  /** Your Notary API key (notary_live_xxx or notary_test_xxx). */
  apiKey: string;
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

/** Result of a receipt lookup by hash. */
export interface LookupResult {
  found: boolean;
  receipt: Receipt | null;
  verification: VerificationResult | null;
  meta: Record<string, unknown> | null;
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

/** Paginated history result. */
export interface HistoryResult {
  items: Record<string, unknown>[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/** Options for history queries. */
export interface HistoryOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  clerkToken?: string;
}

/** Counterfactual issue options. */
export interface CounterfactualIssueOptions {
  actionNotTaken: string;
  capabilityProof: Record<string, unknown>;
  opportunityContext: Record<string, unknown>;
  decisionReason: string;
  declinationReason?: string;
  provenanceRefs?: string[];
  validityWindowMinutes?: number;
}

/** Counterfactual commit options (v2 commit-reveal). */
export interface CounterfactualCommitOptions extends CounterfactualIssueOptions {
  minRevealDelaySeconds?: number;
  maxRevealWindowSeconds?: number;
}

/** Auto-receipt configuration. */
export interface AutoReceiptConfig {
  mode?: 'all' | 'errors_only' | 'sample';
  sampleRate?: number;
  fireAndForget?: boolean;
  maxPayloadBytes?: number;
  dryRun?: boolean;
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
// Counterfactual Client
// =============================================================================

/**
 * Sub-client for counterfactual receipt operations (proof of non-action).
 *
 * @example
 * ```typescript
 * const stamp = await notary.counterfactual.issue({
 *   actionNotTaken: 'delete_user_data',
 *   capabilityProof: { scope: 'data:delete', granted: true },
 *   opportunityContext: { user_id: 'u_123' },
 *   decisionReason: 'GDPR retention period not yet expired',
 * });
 * ```
 */
export class CounterfactualClient {
  constructor(private client: NotaryClient) {}

  /** Issue a v1 counterfactual receipt (proof of non-action). */
  async issue(options: CounterfactualIssueOptions): Promise<Record<string, unknown>> {
    return this.client['request']('POST', '/counterfactual/issue', {
      action_not_taken: options.actionNotTaken,
      capability_proof: options.capabilityProof,
      opportunity_context: options.opportunityContext,
      decision_reason: options.decisionReason,
      declination_reason: options.declinationReason || 'unknown',
      provenance_refs: options.provenanceRefs,
      validity_window_minutes: options.validityWindowMinutes || 60,
    });
  }

  /** Retrieve/verify a counterfactual receipt by hash (public). */
  async get(receiptHash: string): Promise<Record<string, unknown>> {
    return this.client['publicGet'](`/v1/notary/counterfactual/r/${receiptHash}`);
  }

  /** List counterfactual receipts for a specific agent (public). */
  async listByAgent(agentId: string, limit = 50, offset = 0): Promise<Record<string, unknown>> {
    return this.client['publicGet'](
      `/v1/notary/counterfactual/agent/${agentId}?limit=${limit}&offset=${offset}`
    );
  }

  /** Commit a v2 counterfactual receipt (Phase 1 of commit-reveal). */
  async commit(options: CounterfactualCommitOptions): Promise<Record<string, unknown>> {
    return this.client['request']('POST', '/counterfactual/commit', {
      action_not_taken: options.actionNotTaken,
      capability_proof: options.capabilityProof,
      opportunity_context: options.opportunityContext,
      decision_reason: options.decisionReason,
      declination_reason: options.declinationReason || 'unknown',
      provenance_refs: options.provenanceRefs,
      validity_window_minutes: options.validityWindowMinutes || 60,
      min_reveal_delay_seconds: options.minRevealDelaySeconds || 300,
      max_reveal_window_seconds: options.maxRevealWindowSeconds || 86400,
    });
  }

  /** Reveal a committed counterfactual receipt (Phase 2). */
  async reveal(receiptHash: string, decisionReasonPlaintext: string): Promise<Record<string, unknown>> {
    return this.client['request']('POST', '/counterfactual/reveal', {
      receipt_hash: receiptHash,
      decision_reason_plaintext: decisionReasonPlaintext,
    });
  }

  /** Check commit-reveal lifecycle status (public). */
  async commitStatus(receiptHash: string): Promise<Record<string, unknown>> {
    return this.client['publicGet'](
      `/v1/notary/counterfactual/commit-status/${receiptHash}`
    );
  }

  /** Counter-sign a counterfactual receipt (corroboration). */
  async corroborate(receiptHash: string, signals: string[]): Promise<Record<string, unknown>> {
    return this.client['request']('POST', '/counterfactual/corroborate', {
      receipt_hash: receiptHash,
      corroboration_signals: signals,
    });
  }

  /** Generate a compliance certificate for a counterfactual receipt (public). */
  async certificate(receiptHash: string, format = 'markdown'): Promise<Record<string, unknown>> {
    return this.client['publicGet'](
      `/v1/notary/counterfactual/r/${receiptHash}/certificate?format=${format}`
    );
  }

  /** Verify counterfactual chain continuity for an agent (public). */
  async verifyChain(agentId: string): Promise<Record<string, unknown>> {
    return this.client['publicGet'](
      `/v1/notary/counterfactual/chain/${agentId}/verify`
    );
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
 * const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
 *
 * // Issue a receipt
 * const receipt = await notary.issue('data_processing', { key: 'value' });
 *
 * // Verify a receipt
 * const result = await notary.verify(receipt);
 * console.log(result.valid); // true
 *
 * // Counterfactual receipts
 * const stamp = await notary.counterfactual.issue({ ... });
 *
 * // Auto-receipt wrapping
 * const agent = notary.wrap(myAgent, { mode: 'all' });
 * ```
 */
export class NotaryClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private _counterfactual?: CounterfactualClient;

  static readonly DEFAULT_BASE_URL = 'https://api.agenttownsquare.com';
  static readonly DEFAULT_TIMEOUT = 30_000;

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

  /** Access counterfactual receipt operations (enterprise premium). */
  get counterfactual(): CounterfactualClient {
    if (!this._counterfactual) {
      this._counterfactual = new CounterfactualClient(this);
    }
    return this._counterfactual;
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

  /** Public GET helper (no API key in headers). */
  private async publicGet<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `notary-typescript-sdk/${SDK_VERSION}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return { found: false } as T;
      }

      if (!response.ok) {
        throw new NotaryError(response.statusText, 'ERR_REQUEST', response.status);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof NotaryError) throw err;
      throw new NotaryError(`Connection failed: ${(err as Error).message}`, 'ERR_CONNECTION');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // =========================================================================
  // Core API
  // =========================================================================

  /**
   * Issue a signed receipt for an action.
   *
   * @param actionType - Type of action (e.g., "data_processing", "api_call")
   * @param payload - Action payload to be receipted
   * @param options - Optional chaining and metadata
   * @returns A signed Receipt
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

  /** Verify a receipt's signature and integrity. */
  async verify(receipt: Receipt | Record<string, unknown>): Promise<VerificationResult> {
    return this.request<VerificationResult>('POST', '/verify', { receipt });
  }

  /** Verify a receipt by its ID (server-side lookup). */
  async verifyById(receiptId: string): Promise<VerificationResult> {
    return this.request<VerificationResult>('POST', '/verify', { receipt_id: receiptId });
  }

  /** Get Notary service status. */
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

  /** Look up a receipt by hash (public endpoint). */
  async lookup(receiptHash: string): Promise<LookupResult> {
    return this.publicGet<LookupResult>(`/v1/notary/r/${receiptHash}`);
  }

  // =========================================================================
  // History & Provenance
  // =========================================================================

  /**
   * Get paginated receipt history (requires Clerk JWT).
   *
   * @param options - Pagination, filters, and Clerk token
   * @returns Paginated history with items, total, totalPages
   */
  async history(options: HistoryOptions = {}): Promise<HistoryResult> {
    const params = new URLSearchParams();
    params.set('page', String(options.page || 1));
    params.set('page_size', String(options.pageSize || 10));
    if (options.status) params.set('status', options.status);
    if (options.search) params.set('search', options.search);
    if (options.startDate) params.set('start_date', options.startDate);
    if (options.endDate) params.set('end_date', options.endDate);

    const url = `${this.baseUrl}/v1/notary/history?${params.toString()}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `notary-typescript-sdk/${SDK_VERSION}`,
    };
    if (options.clerkToken) {
      headers['Authorization'] = `Bearer ${options.clerkToken}`;
    } else {
      headers['X-API-Key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NotaryError(response.statusText, 'ERR_HISTORY', response.status);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof NotaryError) throw err;
      throw new NotaryError(`Connection failed: ${(err as Error).message}`, 'ERR_CONNECTION');
    }
  }

  /**
   * Get the provenance DAG report for a receipt (public).
   *
   * @param receiptHash - The receipt hash to check
   * @returns Provenance report with grounding status, ancestors, paths
   */
  async provenance(receiptHash: string): Promise<Record<string, unknown>> {
    return this.publicGet(`/v1/notary/r/${receiptHash}/provenance`);
  }

  // =========================================================================
  // Auto-receipting (wrap)
  // =========================================================================

  /**
   * Wrap an object so method calls are automatically receipted.
   *
   * Uses ES6 Proxy to intercept method calls. Receipts are issued
   * in the background via fire-and-forget (won't slow down your agent).
   *
   * @param obj - The agent or object to wrap
   * @param config - Optional auto-receipt configuration
   * @returns A proxied version of the object
   *
   * @example
   * ```typescript
   * const agent = notary.wrap(myAgent, { mode: 'all', fireAndForget: true });
   * await agent.processData(input); // auto-receipted!
   * ```
   */
  wrap<T extends object>(obj: T, config: AutoReceiptConfig = {}): T {
    const client = this;
    const cfg: Required<AutoReceiptConfig> = {
      mode: config.mode || 'all',
      sampleRate: config.sampleRate ?? 1.0,
      fireAndForget: config.fireAndForget ?? true,
      maxPayloadBytes: config.maxPayloadBytes ?? 4096,
      dryRun: config.dryRun ?? false,
    };
    const className = obj.constructor?.name || 'UnknownAgent';
    let lastHash: string | undefined;

    return new Proxy(obj, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        // Only intercept function calls on public methods
        if (typeof value !== 'function' || typeof prop !== 'string' || prop.startsWith('_')) {
          return value;
        }

        return async function (this: unknown, ...args: unknown[]) {
          const start = performance.now();
          let status = 'success';
          let errorType: string | undefined;
          let result: unknown;

          try {
            result = await value.apply(target, args);
            return result;
          } catch (err) {
            status = 'error';
            errorType = (err as Error).constructor?.name || 'Error';
            throw err;
          } finally {
            // Determine if we should receipt this call
            const shouldReceipt =
              cfg.mode === 'all' ||
              (cfg.mode === 'errors_only' && status === 'error') ||
              (cfg.mode === 'sample' && Math.random() < cfg.sampleRate);

            if (shouldReceipt) {
              const durationMs = Math.round((performance.now() - start) * 100) / 100;
              const payload: Record<string, unknown> = {
                agent: className,
                auto_receipt: true,
                function: prop,
                timestamp: new Date().toISOString(),
                duration_ms: durationMs,
                status,
                error_type: errorType,
                arguments: _safeRepr(args),
                result_summary: _safeRepr(result),
              };

              if (cfg.dryRun) {
                console.error(`[NotaryOS DRY RUN] ${String(prop)}: ${JSON.stringify(payload)}`);
              } else if (cfg.fireAndForget) {
                // Fire and forget — don't await
                client
                  .issue(String(prop), payload, { previousReceiptHash: lastHash })
                  .then((r) => {
                    if (r.receipt_hash) lastHash = r.receipt_hash;
                  })
                  .catch(() => {});
              } else {
                try {
                  const r = await client.issue(String(prop), payload, {
                    previousReceiptHash: lastHash,
                  });
                  if (r.receipt_hash) lastHash = r.receipt_hash;
                } catch {
                  // Never break the agent
                }
              }
            }
          }
        };
      },
    });
  }
}

// =============================================================================
// Convenience: verify without API key (public endpoint)
// =============================================================================

/**
 * Quick receipt verification without API key.
 * Uses the public /verify endpoint — no authentication needed.
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
 * Matches the server-side hashing for independent verification.
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

// =============================================================================
// Internal helpers
// =============================================================================

function _safeRepr(value: unknown, depth = 3): unknown {
  if (depth <= 0) return value != null ? '...' : null;
  if (value === null || value === undefined) return value;
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.length > 500 ? value.slice(0, 500) : value;
  if (Array.isArray(value)) return `<array len=${value.length}>`;
  if (typeof value === 'object') return `<object keys=${Object.keys(value).length}>`;
  return `<${typeof value}>`;
}
