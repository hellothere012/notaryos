/**
 * NotaryOS Offline Verification - Ed25519 signature verification via JWKS.
 *
 * Uses Web Crypto API — still zero dependencies.
 *
 * Usage:
 *   import { OfflineVerifier } from 'notaryos/offline';
 *   const verifier = await OfflineVerifier.fromJWKS();
 *   const result = await verifier.verify(receipt);
 *   console.log(result.valid); // true
 *
 * @packageDocumentation
 */

export interface OfflineVerificationResult {
  valid: boolean;
  signatureOk: boolean;
  structureOk: boolean;
  reason: string;
  keyId: string;
}

interface JWK {
  kty: string;
  crv: string;
  alg: string;
  use: string;
  kid: string;
  x: string;
  status?: string;
}

/**
 * Offline verifier that fetches JWKS keys and verifies Ed25519 signatures locally.
 *
 * @example
 * ```typescript
 * const verifier = await OfflineVerifier.fromJWKS();
 * const result = await verifier.verify(receipt);
 * if (result.valid) {
 *   console.log('Verified offline!');
 * }
 * ```
 */
export class OfflineVerifier {
  private keys: Map<string, CryptoKey>;

  private constructor(keys: Map<string, CryptoKey>) {
    this.keys = keys;
  }

  /**
   * Create an OfflineVerifier by fetching JWKS from the server.
   *
   * @param baseUrl - API base URL (default: production)
   * @returns OfflineVerifier with cached public keys
   */
  static async fromJWKS(
    baseUrl = 'https://api.agenttownsquare.com'
  ): Promise<OfflineVerifier> {
    const url = `${baseUrl.replace(/\/+$/, '')}/.well-known/jwks.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }

    const jwks: { keys: JWK[] } = await response.json();
    const keys = new Map<string, CryptoKey>();

    for (const jwk of jwks.keys) {
      if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519') continue;
      if (!jwk.kid || !jwk.x) continue;

      try {
        // Import the Ed25519 public key from JWK format
        const cryptoKey = await crypto.subtle.importKey(
          'jwk',
          { kty: 'OKP', crv: 'Ed25519', x: jwk.x },
          { name: 'Ed25519' },
          true,
          ['verify']
        );
        keys.set(jwk.kid, cryptoKey);
      } catch {
        // Skip keys that can't be imported (older runtimes)
      }
    }

    if (keys.size === 0) {
      throw new Error('No Ed25519 keys found in JWKS response');
    }

    return new OfflineVerifier(keys);
  }

  /**
   * Verify a receipt's signature offline using cached keys.
   *
   * @param receipt - Receipt object or dict
   * @returns OfflineVerificationResult
   */
  async verify(receipt: Record<string, unknown>): Promise<OfflineVerificationResult> {
    // Check structure
    const required = [
      'receipt_id', 'timestamp', 'agent_id', 'action_type',
      'payload_hash', 'signature', 'signature_type',
    ];
    const missing = required.filter((f) => !receipt[f]);
    if (missing.length > 0) {
      return {
        valid: false,
        signatureOk: false,
        structureOk: false,
        reason: `Missing required fields: ${missing.join(', ')}`,
        keyId: '',
      };
    }

    // Find the key
    const kid = (receipt.kid || receipt.key_id || '') as string;
    let cryptoKey = this.keys.get(kid);

    // Try prefix match
    if (!cryptoKey) {
      for (const [storedKid, storedKey] of this.keys) {
        if (storedKid.startsWith(kid.slice(0, 8)) || kid.startsWith(storedKid.slice(0, 8))) {
          cryptoKey = storedKey;
          break;
        }
      }
    }

    if (!cryptoKey) {
      return {
        valid: false,
        signatureOk: false,
        structureOk: true,
        reason: `Unknown key ID: ${kid}`,
        keyId: kid,
      };
    }

    // Reconstruct canonical message
    const canonical = buildCanonical(receipt);

    // Verify the signature
    try {
      const sigBytes = base64Decode(receipt.signature as string);
      const messageBytes = new TextEncoder().encode(canonical);

      const valid = await crypto.subtle.verify(
        'Ed25519',
        cryptoKey,
        sigBytes,
        messageBytes
      );

      return {
        valid,
        signatureOk: valid,
        structureOk: true,
        reason: valid ? 'Signature verified locally' : 'Signature mismatch',
        keyId: kid,
      };
    } catch (err) {
      return {
        valid: false,
        signatureOk: false,
        structureOk: true,
        reason: `Signature verification failed: ${(err as Error).message}`,
        keyId: kid,
      };
    }
  }

  /** Return all cached key IDs. */
  get keyIds(): string[] {
    return Array.from(this.keys.keys());
  }
}

// =============================================================================
// Internal helpers
// =============================================================================

function buildCanonical(receipt: Record<string, unknown>): string {
  const parts = [
    receipt.receipt_id || '',
    receipt.timestamp || '',
    receipt.agent_id || '',
    'notary',
    receipt.action_type || '',
    receipt.payload_hash || '',
    (receipt.previous_receipt_hash as string) || 'GENESIS',
  ];
  return parts.join('|');
}

function base64Decode(str: string): Uint8Array {
  // Handle both standard and URL-safe base64
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(b64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
