import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Reference — NotaryOS',
  description:
    'NotaryOS REST API reference. Full OpenAPI 3.0.3 specification available. Issue, verify, and audit cryptographic receipts programmatically.',
  openGraph: {
    title: 'API Reference — NotaryOS',
    description: 'REST API for cryptographic receipt verification. OpenAPI spec included.',
    url: 'https://notaryos.org/api-docs',
    siteName: 'NotaryOS',
    type: 'website',
  },
};

const BASE_URL = 'https://api.agenttownsquare.com';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: 'none' | 'api-key' | 'clerk-jwt';
  tag: string;
}

const endpoints: Endpoint[] = [
  // Public
  { method: 'GET', path: '/health', description: 'Liveness probe', auth: 'none', tag: 'Status' },
  { method: 'GET', path: '/v1/notary/status', description: 'Signing key metadata and service capabilities', auth: 'none', tag: 'Status' },
  { method: 'GET', path: '/v1/notary/public-key', description: 'Ed25519 public key (PEM + JWK) for offline verification', auth: 'none', tag: 'Status' },
  { method: 'GET', path: '/v1/notary/sample-receipt', description: 'Synthetic demo receipt for testing', auth: 'none', tag: 'Receipts' },
  { method: 'POST', path: '/v1/notary/verify', description: "Verify a receipt's signature, structure, and chain", auth: 'none', tag: 'Receipts' },
  { method: 'GET', path: '/v1/notary/r/{hash}', description: 'Public receipt lookup by SHA-256 hash', auth: 'none', tag: 'Receipts' },
  // API Key
  { method: 'POST', path: '/v1/notary/seal', description: 'Issue a signed receipt for an agent action', auth: 'api-key', tag: 'Receipts' },
  { method: 'POST', path: '/v1/notary/agents/register', description: 'Register an agent identifier', auth: 'api-key', tag: 'Receipts' },
  // Clerk JWT
  { method: 'GET', path: '/v1/notary/history', description: 'Paginated receipt history', auth: 'clerk-jwt', tag: 'History' },
  { method: 'GET', path: '/v1/api-keys', description: 'List API keys', auth: 'clerk-jwt', tag: 'API Keys' },
  { method: 'POST', path: '/v1/api-keys', description: 'Create a new API key', auth: 'clerk-jwt', tag: 'API Keys' },
  { method: 'DELETE', path: '/v1/api-keys/{id}', description: 'Revoke an API key', auth: 'clerk-jwt', tag: 'API Keys' },
  { method: 'POST', path: '/v1/api-keys/{id}/rotate', description: 'Rotate an API key', auth: 'clerk-jwt', tag: 'API Keys' },
  { method: 'POST', path: '/v1/auth/clerk/sync', description: 'Sync Clerk session to NotaryOS user DB', auth: 'clerk-jwt', tag: 'Auth' },
  { method: 'GET', path: '/v1/auth/clerk/me', description: 'Current user profile and tier', auth: 'clerk-jwt', tag: 'Auth' },
  { method: 'GET', path: '/v1/auth/clerk/stats', description: 'Receipt counts and monthly usage', auth: 'clerk-jwt', tag: 'Auth' },
  { method: 'GET', path: '/v1/auth/clerk/settings', description: 'User preferences', auth: 'clerk-jwt', tag: 'Auth' },
  { method: 'PUT', path: '/v1/auth/clerk/settings', description: 'Save user preferences', auth: 'clerk-jwt', tag: 'Auth' },
  { method: 'GET', path: '/v1/billing/status', description: 'Current subscription status', auth: 'clerk-jwt', tag: 'Billing' },
  { method: 'GET', path: '/v1/billing/subscription', description: 'Full Stripe subscription details', auth: 'clerk-jwt', tag: 'Billing' },
  { method: 'POST', path: '/v1/billing/create-checkout-session', description: 'Create Stripe checkout session', auth: 'clerk-jwt', tag: 'Billing' },
  { method: 'GET', path: '/v1/billing/portal', description: 'Stripe billing portal URL', auth: 'clerk-jwt', tag: 'Billing' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-400/10',
  POST: 'text-blue-400 bg-blue-400/10',
  PUT: 'text-yellow-400 bg-yellow-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
};

const AUTH_BADGE: Record<string, { label: string; color: string }> = {
  none: { label: 'Public', color: 'text-gray-400 bg-gray-700/50' },
  'api-key': { label: 'API Key', color: 'text-purple-400 bg-purple-400/10' },
  'clerk-jwt': { label: 'Clerk JWT', color: 'text-cyan-400 bg-cyan-400/10' },
};

const tags = Array.from(new Set(endpoints.map((e) => e.tag)));

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">API Reference</h1>
          <p className="text-lg text-gray-400 mb-6">
            Base URL:{' '}
            <code className="text-purple-300 bg-gray-800 px-2 py-0.5 rounded text-sm">
              {BASE_URL}
            </code>
          </p>

          {/* OpenAPI spec banner */}
          <div className="flex items-start gap-4 p-5 rounded-xl border border-purple-500/30 bg-purple-500/5">
            <div className="text-2xl mt-0.5">📄</div>
            <div>
              <p className="font-semibold text-white mb-1">
                OpenAPI 3.0.3 specification available
              </p>
              <p className="text-sm text-gray-400 mb-3">
                The full machine-readable spec is included in the open-source repository.
                Import it into Postman, Insomnia, or any OpenAPI-compatible tool.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="https://raw.githubusercontent.com/hellothere012/notaryos/main/docs/openapi.yaml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  Download openapi.yaml
                  <span className="text-xs opacity-75">↗</span>
                </a>
                <a
                  href="https://github.com/hellothere012/notaryos/blob/main/docs/openapi.yaml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
                >
                  View on GitHub
                  <span className="text-xs opacity-75">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Authentication</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium text-gray-400 bg-gray-700/50 mb-3">Public</span>
              <p className="text-sm text-gray-300">No auth required. Works from any HTTP client.</p>
            </div>
            <div className="p-4 rounded-xl border border-purple-500/20 bg-gray-900/50">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium text-purple-400 bg-purple-400/10 mb-3">API Key</span>
              <p className="text-sm text-gray-300 mb-2">For agents issuing receipts.</p>
              <code className="text-xs text-purple-300 bg-gray-800 px-2 py-1 rounded block">
                Authorization: Bearer notary_live_xxx
              </code>
            </div>
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-gray-900/50">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium text-cyan-400 bg-cyan-400/10 mb-3">Clerk JWT</span>
              <p className="text-sm text-gray-300 mb-2">For user profile, billing, and key management.</p>
              <code className="text-xs text-cyan-300 bg-gray-800 px-2 py-1 rounded block">
                Authorization: Bearer &lt;session_jwt&gt;
              </code>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Quick Start</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-2">1. Check service status (no auth)</p>
              <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto">
{`curl ${BASE_URL}/v1/notary/status`}
              </pre>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">2. Seal a receipt (API key)</p>
              <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto">
{`curl -X POST ${BASE_URL}/v1/notary/seal \\
  -H "Authorization: Bearer notary_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action_type": "data_processing",
    "agent_id": "my-agent-v1",
    "payload": {"input_tokens": 1024}
  }'`}
              </pre>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">3. Verify a receipt (no auth)</p>
              <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto">
{`curl -X POST ${BASE_URL}/v1/notary/verify \\
  -H "Content-Type: application/json" \\
  -d '{"receipt": <receipt_object>}'`}
              </pre>
            </div>
          </div>
        </section>

        {/* Endpoint Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Endpoints</h2>
          <div className="space-y-8">
            {tags.map((tag) => (
              <div key={tag}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {tag}
                </h3>
                <div className="border border-gray-800 rounded-xl overflow-hidden">
                  {endpoints
                    .filter((e) => e.tag === tag)
                    .map((ep, i, arr) => {
                      const method = METHOD_COLORS[ep.method] || 'text-gray-400';
                      const auth = AUTH_BADGE[ep.auth];
                      return (
                        <div
                          key={`${ep.method}${ep.path}`}
                          className={`flex items-start gap-4 px-5 py-4 bg-gray-900/30 ${
                            i < arr.length - 1 ? 'border-b border-gray-800/50' : ''
                          }`}
                        >
                          <span
                            className={`inline-block w-16 text-center text-xs font-bold px-2 py-1 rounded shrink-0 ${method}`}
                          >
                            {ep.method}
                          </span>
                          <div className="flex-1 min-w-0">
                            <code className="text-sm text-gray-200 font-mono">{ep.path}</code>
                            <p className="text-xs text-gray-500 mt-0.5">{ep.description}</p>
                          </div>
                          <span
                            className={`inline-block shrink-0 text-xs px-2 py-1 rounded font-medium ${auth.color}`}
                          >
                            {auth.label}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Python SDK */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Python SDK</h2>
          <p className="text-gray-400 mb-4">
            The{' '}
            <code className="text-purple-300 bg-gray-800 px-1.5 py-0.5 rounded text-sm">notaryos</code>{' '}
            package wraps the full API with zero external dependencies.
          </p>
          <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto mb-4">
{`pip install notaryos

from notaryos import NotaryClient, verify_receipt

# Issue a receipt (API key required)
notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.seal("data_processing", "my-agent-v1", {"tokens": 1024})
print(receipt.verify_url)

# Verify a receipt (no API key needed)
is_valid = verify_receipt(receipt_dict)  # → True`}
          </pre>
          <a
            href="https://github.com/hellothere012/notaryos/tree/main/sdk/python"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View Python SDK source on GitHub ↗
          </a>
        </section>

        {/* Footer links */}
        <div className="pt-8 border-t border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500">
          <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <a
            href="https://github.com/hellothere012/notaryos"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://raw.githubusercontent.com/hellothere012/notaryos/main/docs/openapi.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            openapi.yaml
          </a>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>
      </div>
    </main>
  );
}
