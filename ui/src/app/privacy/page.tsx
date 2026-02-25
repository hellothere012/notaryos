/**
 * Privacy Policy Page (/privacy) - Server Component
 *
 * Static privacy policy for NotaryOS. Exports metadata for SEO.
 * Styled to match the dark theme with purple accents used site-wide.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy -- NotaryOS',
  description:
    'How NotaryOS collects, uses, and protects your data. We store hashed receipts, not raw payloads.',
  openGraph: {
    title: 'Privacy Policy -- NotaryOS',
    description:
      'How NotaryOS collects, uses, and protects your data.',
    url: 'https://notaryos.org/privacy',
    siteName: 'NotaryOS',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header accent bar */}
      <div className="h-1 bg-gradient-to-r from-purple-600 via-violet-500 to-cyan-500" />

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Title block */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>
        <p className="text-gray-400 text-sm mb-12">
          Effective February 25, 2026
        </p>

        {/* Policy content */}
        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. What We Collect
            </h2>
            <p className="mb-3">
              NotaryOS collects only the minimum data necessary to operate the
              service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>
                <span className="text-gray-300">API keys</span> -- stored as
                irreversible SHA-256 hashes. We never retain your raw key after
                initial creation.
              </li>
              <li>
                <span className="text-gray-300">Email address</span> --
                collected during authentication via Clerk. Used for account
                identification and service communications.
              </li>
              <li>
                <span className="text-gray-300">Usage metadata</span> -- receipt
                count, timestamps, and tier information. This data is used for
                billing and rate-limit enforcement.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. What We Do NOT Collect
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>
                <span className="text-gray-300">Raw payloads</span> -- receipt
                contents are hashed with SHA-256 before storage. NotaryOS never
                sees or stores the original payload data.
              </li>
              <li>
                <span className="text-gray-300">
                  Credit card or bank details
                </span>{' '}
                -- all payment processing is handled entirely by Stripe. Card
                numbers never touch NotaryOS servers.
              </li>
              <li>
                <span className="text-gray-300">Biometric data</span> -- we do
                not collect fingerprints, facial recognition data, or any
                biometric identifiers.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. How We Use Your Data
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>
                <span className="text-gray-300">Service operation</span> --
                authenticating requests, generating cryptographic receipts, and
                maintaining hash chains.
              </li>
              <li>
                <span className="text-gray-300">Abuse prevention</span> --
                rate-limiting, anomaly detection, and protecting the integrity
                of the receipt infrastructure.
              </li>
              <li>
                <span className="text-gray-300">Billing</span> -- tracking
                usage against your tier limits and generating invoices via
                Stripe.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Data Retention
            </h2>
            <p className="mb-3">
              Cryptographic receipts are retained indefinitely to preserve audit
              trail integrity. Deleting receipts would break the hash chain,
              which is the core guarantee of the service.
            </p>
            <p>
              API keys can be revoked at any time from your dashboard. Upon
              revocation the hashed key is marked inactive. Account deletion
              requests can be submitted to{' '}
              <a
                href="mailto:hello@notaryos.org"
                className="text-purple-400 hover:text-purple-300 transition-colors underline"
              >
                hello@notaryos.org
              </a>
              .
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Third-Party Services
            </h2>
            <p className="mb-3">
              NotaryOS integrates with the following third-party providers, each
              governed by their own privacy policies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>
                <span className="text-gray-300">Clerk</span> -- authentication
                and user management.
              </li>
              <li>
                <span className="text-gray-300">Stripe</span> -- payment
                processing and subscription billing.
              </li>
              <li>
                <span className="text-gray-300">DigitalOcean</span> --
                infrastructure hosting and data storage.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Contact
            </h2>
            <p>
              For privacy-related inquiries, data export requests, or account
              deletion, contact us at{' '}
              <a
                href="mailto:hello@notaryos.org"
                className="text-purple-400 hover:text-purple-300 transition-colors underline"
              >
                hello@notaryos.org
              </a>
              .
            </p>
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500 text-sm">
              This policy was last updated on February 25, 2026. We will notify
              registered users via email before making material changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
