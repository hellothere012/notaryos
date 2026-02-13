// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin' | 'agent_operator';
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  createdAt: string;
  emailVerified: boolean;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  username?: string;
}

// API Key types
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: ('read' | 'write' | 'admin')[];
  ipAllowlist?: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: ('read' | 'write' | 'admin')[];
  ipAllowlist?: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  key: string;  // Full key shown only once
  apiKey: ApiKey;
}

// Verification types
export interface VerificationReceipt {
  receipt_hash: string;
  original_hash: string;
  signature: string;
  signed_at: string;
  signer_id: string;
  protocol_version: string;
  chain?: ChainLink;
}

export interface ChainLink {
  previous_hash: string;
  sequence_number: number;
  chain_signature: string;
}

export interface VerificationResult {
  valid: boolean;
  message: string;
  signature_valid: boolean;
  chain_valid: boolean;
  timestamp_valid: boolean;
  details?: {
    receipt_hash: string;
    algorithm: string;
    signed_at: string;
    signer_id: string;
    chain_position?: number;
  };
  errors?: string[];
}

// History types
export interface VerificationHistoryItem {
  id: string;
  receiptHash: string;
  isValid: boolean;
  verifiedAt: string;
  result: VerificationResult;
}

export interface HistoryFilters {
  status?: 'valid' | 'invalid' | 'all';
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Admin types
export interface SignerConfig {
  signerType: 'hmac' | 'ed25519';
  activeKeyId: string;
  keyCreatedAt: string;
  autoRotateEnabled: boolean;
}

export interface SystemStats {
  totalVerifications: number;
  validCount: number;
  invalidCount: number;
  activeUsers: number;
  apiKeysIssued: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
