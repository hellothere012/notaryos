/**
 * PricingPage - Three-tier pricing comparison for Notary
 *
 * Starter (Free) / Explorer ($59/mo) / Pro ($159/mo) / Enterprise (Custom) pricing.
 * Follows the existing LandingPage animation patterns.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Zap,
  Shield,
  Server,
  Building,
  ArrowRight,
  Star,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { authClient, API_ENDPOINTS } from '../../config/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

interface PricingTier {
  name: string;
  price: string;
  priceNote: string;
  description: string;
  icon: React.ReactNode;
  features: { label: string; included: boolean }[];
  limits: { label: string; value: string }[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$0',
    priceNote: 'forever',
    description: 'Get started with cryptographic receipts. No credit card required.',
    icon: <Zap className="w-6 h-6" />,
    features: [
      { label: 'Ed25519 signed receipts', included: true },
      { label: 'Receipt verification API', included: true },
      { label: 'Python, TypeScript & Go SDKs', included: true },
      { label: 'Public key endpoint', included: true },
      { label: 'Hash chain linking', included: false },
      { label: 'Webhook notifications', included: false },
      { label: 'Priority support', included: false },
      { label: 'Custom signer algorithm', included: false },
    ],
    limits: [
      { label: 'Receipts / month', value: '100' },
      { label: 'Verifications / month', value: '500' },
      { label: 'Rate limit', value: '60 req/min' },
      { label: 'Key rotation', value: 'Manual' },
    ],
    cta: 'Get Started Free',
  },
  {
    name: 'Explorer',
    price: '$59',
    priceNote: '/month',
    description: 'For teams building trust into their AI agent workflows.',
    icon: <Shield className="w-6 h-6" />,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      { label: 'Ed25519 signed receipts', included: true },
      { label: 'Receipt verification API', included: true },
      { label: 'Python, TypeScript & Go SDKs', included: true },
      { label: 'Public key endpoint', included: true },
      { label: 'Hash chain linking', included: true },
      { label: 'Webhook notifications', included: true },
      { label: 'Priority support', included: false },
      { label: 'Custom signer algorithm', included: false },
    ],
    limits: [
      { label: 'Receipts / month', value: '10,000' },
      { label: 'Verifications / month', value: '50,000' },
      { label: 'Rate limit', value: '300 req/min' },
      { label: 'Key rotation', value: 'Auto (90d)' },
    ],
    cta: 'Start Building',
  },
  {
    name: 'Pro',
    price: '$159',
    priceNote: '/month',
    description: 'Production-grade receipt infrastructure for high-volume workloads.',
    icon: <Server className="w-6 h-6" />,
    features: [
      { label: 'Ed25519 signed receipts', included: true },
      { label: 'Receipt verification API', included: true },
      { label: 'Python, TypeScript & Go SDKs', included: true },
      { label: 'Public key endpoint', included: true },
      { label: 'Hash chain linking', included: true },
      { label: 'Webhook notifications', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom signer algorithm', included: false },
    ],
    limits: [
      { label: 'Receipts / month', value: '100,000' },
      { label: 'Verifications / month', value: '500,000' },
      { label: 'Rate limit', value: '1,000 req/min' },
      { label: 'Key rotation', value: 'Auto (custom)' },
    ],
    cta: 'Go Pro',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'pricing',
    description: 'Dedicated infrastructure, SLAs, and custom integrations for large-scale deployments.',
    icon: <Building className="w-6 h-6" />,
    features: [
      { label: 'Ed25519 signed receipts', included: true },
      { label: 'Receipt verification API', included: true },
      { label: 'Python, TypeScript & Go SDKs', included: true },
      { label: 'Public key endpoint', included: true },
      { label: 'Hash chain linking', included: true },
      { label: 'Webhook notifications', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom signer algorithm', included: true },
    ],
    limits: [
      { label: 'Receipts / month', value: 'Unlimited' },
      { label: 'Verifications / month', value: 'Unlimited' },
      { label: 'Rate limit', value: 'Custom' },
      { label: 'Key rotation', value: 'Auto (custom)' },
    ],
    cta: 'Contact Sales',
  },
];

const TierCard: React.FC<{ tier: PricingTier; index: number }> = ({ tier, index }) => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCta = useCallback(async () => {
    // Free tier → sign-up page
    if (tier.name === 'Starter') {
      router.push('/sign-up');
      return;
    }

    // Enterprise tier → email contact
    if (tier.name === 'Enterprise') {
      window.location.href = 'mailto:hello@agenttownsquare.com?subject=NotaryOS Enterprise Inquiry';
      return;
    }

    // Paid tiers → require login, then create Stripe Checkout session
    if (!isSignedIn) {
      router.push(`/sign-up?plan=${tier.name.toLowerCase()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.post(API_ENDPOINTS.createCheckout, {
        tier: tier.name.toLowerCase(),
      });
      // Redirect to Stripe Checkout
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err?.response?.data || err);
      // Fallback: direct to sign-up if checkout fails
      router.push(`/sign-up?plan=${tier.name.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [tier.name, router, isSignedIn]);

  return (
    <motion.div
      variants={fadeInUp}
      className={`relative flex flex-col rounded-2xl border p-8 ${
        tier.highlighted
          ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
          : 'border-gray-700/50 bg-gray-900/40'
      }`}
    >
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
            <Star className="w-3 h-3" />
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-gray-400">
          {tier.icon}
          <span className="text-sm font-medium uppercase tracking-wider">
            {tier.name}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{tier.price}</span>
          <span className="text-gray-400 text-sm">{tier.priceNote}</span>
        </div>
        <p className="mt-2 text-sm text-gray-400">{tier.description}</p>
      </div>

      {/* Limits */}
      <div className="mb-6 space-y-2">
        {tier.limits.map((limit) => (
          <div
            key={limit.label}
            className="flex justify-between text-sm"
          >
            <span className="text-gray-400">{limit.label}</span>
            <span className="font-medium text-white">{limit.value}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleCta}
        disabled={loading}
        className={`w-full rounded-lg py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-6 disabled:opacity-60 ${
          tier.highlighted
            ? 'bg-emerald-500 text-white hover:bg-emerald-400'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            {tier.cta}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Features */}
      <div className="space-y-3 border-t border-gray-700/50 pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Features
        </p>
        {tier.features.map((feature) => (
          <div
            key={feature.label}
            className="flex items-center gap-2 text-sm"
          >
            {feature.included ? (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
            )}
            <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center"
      >
        <motion.div variants={fadeInUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-6">
            <Shield className="w-4 h-4" />
            Simple, transparent pricing
          </span>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
        >
          Cryptographic receipts for every scale
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-lg text-gray-400 max-w-2xl mx-auto"
        >
          Start free. Scale as you grow. Every receipt is Ed25519 signed and
          hash-chain linked for tamper-proof audit trails.
        </motion.p>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {tiers.map((tier, i) => (
          <TierCard key={tier.name} tier={tier} index={i} />
        ))}
      </motion.div>

      {/* SDK Section */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-2xl font-bold mb-3"
          >
            3 lines of code. Any language.
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-gray-400">
            Our SDKs have zero external dependencies. Install and integrate in under a minute.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              lang: 'Python',
              code: `from notaryos import NotaryClient\nnotary = NotaryClient(api_key="notary_live_xxx")\nreceipt = notary.issue("action", {"key": "val"})`,
            },
            {
              lang: 'TypeScript',
              code: `import { NotaryClient } from 'notaryos';\nconst notary = new NotaryClient({ apiKey: 'notary_live_xxx' });\nconst receipt = await notary.issue('action', { key: 'val' });`,
            },
            {
              lang: 'Go',
              code: `client, _ := notary.NewClient("notary_live_xxx", nil)\nreceipt, _ := client.Issue("action",\n  map[string]any{"key": "val"})`,
            },
          ].map((snippet) => (
            <motion.div
              key={snippet.lang}
              variants={fadeInUp}
              className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {snippet.lang}
                </span>
              </div>
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                {snippet.code}
              </pre>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: 'What happens if I exceed my plan limits?',
              a: "We'll send a notification at 80% usage. Requests are soft-capped at 120% of your quota. Upgrade anytime — changes take effect immediately.",
            },
            {
              q: 'Can I verify receipts without an API key?',
              a: 'Yes! The /verify endpoint and the standalone verifyReceipt() function in all SDKs work without authentication. Anyone can verify a receipt.',
            },
            {
              q: 'What signing algorithm do you use?',
              a: 'Ed25519 by default (fast, quantum-resistant-friendly). Enterprise plans can switch to HMAC-SHA256 or request custom algorithms.',
            },
            {
              q: 'Is there a self-hosted option?',
              a: "Not yet, but it's on our roadmap. Contact us if you need on-premise deployment.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group rounded-lg border border-gray-700/50 bg-gray-900/40 p-4"
            >
              <summary className="cursor-pointer text-sm font-medium text-white flex items-center justify-between">
                {faq.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform">
                  &#9662;
                </span>
              </summary>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};
