/**
 * Terms of Service Page (/terms) - Server Component
 *
 * Static terms of service for NotaryOS. Exports metadata for SEO.
 * Styled to match the dark theme with purple accents used site-wide.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service -- NotaryOS',
  description:
    'Terms of Service for NotaryOS cryptographic receipt infrastructure. Acceptable use, API key policies, licensing, and liability.',
  openGraph: {
    title: 'Terms of Service -- NotaryOS',
    description:
      'Terms governing use of NotaryOS cryptographic receipt infrastructure.',
    url: 'https://notaryos.org/terms',
    siteName: 'NotaryOS',
    type: 'website',
  },
};

export default function TermsPage() {
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
            <Scale className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        </div>
        <p className="text-gray-400 text-sm mb-12">
          Effective February 25, 2026
        </p>

        {/* Terms content */}
        <div className="space-y-10 text-gray-300 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Service Description
            </h2>
            <p>
              NotaryOS provides cryptographic receipt infrastructure for AI
              agents. The service generates tamper-evident, Ed25519-signed
              receipts that form per-agent hash chains, enabling verifiable
              audit trails for autonomous agent actions.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Acceptable Use
            </h2>
            <p className="mb-3">
              By using NotaryOS you agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>
                Abuse the service through automated flooding, denial-of-service
                attempts, or intentional circumvention of rate limits.
              </li>
              <li>
                Impersonate other agents or users by forging agent identifiers
                in receipt requests.
              </li>
              <li>
                Use receipts to fabricate false audit trails or manufacture
                fraudulent evidence of actions that did not occur.
              </li>
              <li>
                Reverse-engineer, decompile, or attempt to extract source code
                from the NotaryOS backend services.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. API Keys
            </h2>
            <p>
              Each API key is non-transferable and tied to a single user
              account. You are responsible for safeguarding your key. NotaryOS
              reserves the right to revoke any key that is involved in abusive
              behavior, shared publicly, or used in violation of these terms.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Free Tier
            </h2>
            <p>
              The free tier includes up to 100 receipts per month per account.
              Free-tier usage is subject to fair-use policies. NotaryOS may
              throttle or suspend accounts that consistently exceed reasonable
              usage patterns on the free tier.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Paid Tiers
            </h2>
            <p>
              Paid subscriptions are billed monthly via Stripe. You may cancel
              at any time; cancellation takes effect at the end of the current
              billing period. No prorated refunds are issued for partial months.
              Pricing and tier limits are published on the{' '}
              <Link
                href="/pricing"
                className="text-purple-400 hover:text-purple-300 transition-colors underline"
              >
                pricing page
              </Link>
              .
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              Receipts generated by NotaryOS are cryptographic records of data
              submissions. They attest that a specific payload hash was
              submitted at a specific time -- nothing more. NotaryOS is not
              liable for business decisions, disputes, or legal proceedings
              based on receipt data. The service is provided &quot;as is&quot;
              without warranties of any kind, express or implied.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. SDK License
            </h2>
            <p>
              The NotaryOS SDK is licensed under the Business Source License 1.1
              (BUSL-1.1). The license converts automatically to Apache 2.0 on
              February 25, 2029. Full license terms are included in the SDK
              repository.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Governing Law
            </h2>
            <p>
              These terms are governed by the laws of the State of Delaware,
              USA, without regard to conflict-of-law provisions. Any disputes
              arising under these terms shall be resolved in the courts of
              Delaware.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Contact
            </h2>
            <p>
              For questions about these terms, contact us at{' '}
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
              These terms were last updated on February 25, 2026. Material
              changes will be communicated to registered users via email at
              least 30 days before taking effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
