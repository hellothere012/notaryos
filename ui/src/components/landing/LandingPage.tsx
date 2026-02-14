/**
 * LandingPage - Public marketing/landing page for Notary
 *
 * Landing page for NotaryOS.
 * Key message: "Verify AI agent receipts—cryptographically."
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  Github,
  ArrowRight,
  CheckCircle,
  FileJson,
  Link2,
  Code,
  History,
  Key,
  Settings,
  ChevronRight,
  ExternalLink,
  Server,
  Users,
  AlertTriangle,
  Terminal,
  Copy,
  Zap,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  bullets: string[];
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, bullets, badge }) => (
  <motion.div
    variants={fadeInUp}
    className="card-hover relative"
  >
    {badge && (
      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded-full">
        {badge}
      </span>
    )}
    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
    <ul className="space-y-2">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

// Step Card Component
interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description }) => (
  <motion.div variants={fadeInUp} className="flex gap-4">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
        {step}
      </div>
    </div>
    <div>
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </motion.div>
);

// Use Case Card Component
interface UseCaseCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({ title, description, icon }) => (
  <motion.div
    variants={fadeInUp}
    className="p-5 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-purple-500/30 transition-colors"
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  </motion.div>
);

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.div
      variants={fadeInUp}
      className="border-b border-gray-700/50 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left"
      >
        <span className="text-white font-medium">{question}</span>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pb-4 text-sm text-gray-400"
        >
          {answer}
        </motion.p>
      )}
    </motion.div>
  );
};

// Sample Receipt JSON for display
const sampleReceipt = `{
  "receipt_hash": "sha256:a1b2c3d4...",
  "signature": "base64:SGVsbG8gV29y...",
  "signed_at": "2026-01-31T10:30:00Z",
  "signer_id": "notary-v1-ed25519",
  "chain": {
    "previous_hash": "sha256:0000...genesis",
    "sequence_number": 42
  }
}`;

export const LandingPage: React.FC = () => {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(sampleReceipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NotaryOS</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                About
              </Link>
              <a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">
                Product
              </a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white text-sm transition-colors">
                How it works
              </a>
              <Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-gray-400 hover:text-white text-sm transition-colors">
                Docs
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/hellothere012/notaryos"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg text-sm font-medium transition-all"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
              <button
                onClick={() => router.push('/docs#quickstart')}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300">
                  <Zap className="w-3.5 h-3.5" />
                  2.39ms verification — built on the ATS Protocol engine
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Know what your AI did.
                <br />
                <span className="gradient-text">Prove what it didn't.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-400 mb-8 max-w-xl"
              >
                NotaryOS creates tamper-proof receipts for every AI agent action—including
                cryptographic proof when an agent <em className="text-purple-300 not-italic font-medium">chose not to act</em>.
                Verify signatures, chain integrity, and decision provenance in seconds.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 mb-8">
                <button
                  onClick={() => router.push('/docs#quickstart')}
                  className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
                >
                  Start Proving in 5 Minutes
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/verify?sample=true')}
                  className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
                >
                  <Shield className="w-5 h-5" />
                  Verify a Receipt Now
                </button>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-sm text-gray-500 mb-6">
                Free tier: 1,000 receipts/month. No credit card required.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center gap-6 text-sm text-gray-400"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Tamper-proof signatures
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Counterfactual receipts
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  1,185 receipts/sec throughput
                </span>
              </motion.div>
            </motion.div>

            {/* Right: Receipt Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative"
            >
              <div className="relative bg-gray-800/80 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-sm text-gray-500">receipt.json</span>
                  <button
                    onClick={handleCopyReceipt}
                    className="ml-auto p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Code */}
                <pre className="p-4 text-sm text-gray-300 font-mono overflow-x-auto">
                  <code>{sampleReceipt}</code>
                </pre>

                {/* Verification Badge */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg glow-green">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Teaser Strip */}
      <section className="py-12 bg-gray-800/30 border-y border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Don&apos;t trust us. Verify the math.</h2>
              <p className="text-gray-400">
                Paste any receipt into the public verifier. See exactly what passed, what failed, and why—no account needed.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/verify')}
                className="btn-primary flex items-center gap-2"
              >
                Open Verifier
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/verify?sample=true')}
                className="btn-ghost flex items-center gap-2"
              >
                Load Sample Receipt
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Notary Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Logs tell you what happened.{' '}
              <span className="gradient-text">Receipts prove it.</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-400 max-w-3xl mx-auto"
            >
              AI agents make thousands of decisions daily across tools, services,
              and teams. NotaryOS receipts are tamper-proof, mathematically verified records—so
              every action (and every deliberate inaction) can be proven, not just claimed.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeInUp} className="card text-center">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Instant verification</h3>
              <p className="text-sm text-gray-400">
                Validate signatures, chain continuity, and timestamps in one place.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card text-center">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Explainable failures</h3>
              <p className="text-sm text-gray-400">
                Clear, actionable errors—no guessing what broke.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="card text-center">
              <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <FileJson className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Portable proof</h3>
              <p className="text-sm text-gray-400">
                Receipts are JSON and can be verified offline or in CI.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Counterfactual Receipts Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-300 mb-4">
                What makes NotaryOS different
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Proof of what your AI{' '}
                <span className="gradient-text">chose not to do.</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                Any logging system records what happened. Only NotaryOS can cryptographically prove
                what <em className="text-cyan-300 not-italic">didn't</em> happen—and why.
              </p>
            </motion.div>

            {/* Counterfactual Explanation Cards */}
            <motion.div variants={staggerContainer} className="grid lg:grid-cols-2 gap-8 mb-16">
              {/* Left: The Problem */}
              <motion.div
                variants={fadeInUp}
                className="p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Without counterfactual receipts</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-gray-400">
                    <span className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-gray-500">?</span>
                    <span>&quot;Did our AI follow the guardrails?&quot; — <span className="text-gray-500 italic">You hope so. You can&apos;t prove it.</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-400">
                    <span className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-gray-500">?</span>
                    <span>&quot;Why didn&apos;t your safeguards stop this?&quot; — <span className="text-gray-500 italic">You claim they worked. No evidence.</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-400">
                    <span className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-gray-500">?</span>
                    <span>&quot;Prove your AI didn&apos;t cause the incident.&quot; — <span className="text-gray-500 italic">Absence of logs proves nothing.</span></span>
                  </li>
                </ul>
              </motion.div>

              {/* Right: The Solution */}
              <motion.div
                variants={fadeInUp}
                className="p-8 rounded-2xl bg-gradient-to-br from-purple-900/30 to-cyan-900/20 border border-purple-500/20"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">With counterfactual receipts</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Capability Proof</strong> — Your AI had the permission to act</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Opportunity Proof</strong> — The conditions for action were met</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Decision Proof</strong> — It deliberately chose restraint, with a reason</span>
                  </li>
                </ul>
                <p className="mt-6 text-sm text-purple-300 border-t border-purple-500/20 pt-4">
                  Think of it like a notary who witnesses refusals — timestamped, signed proof that your AI
                  evaluated the situation and made the right call.
                </p>
              </motion.div>
            </motion.div>

            {/* Counter-Receipt Callout */}
            <motion.div
              variants={fadeInUp}
              className="p-6 rounded-xl bg-gray-800/30 border border-gray-700/50 max-w-3xl mx-auto text-center"
            >
              <h4 className="text-white font-semibold mb-2">Counter-Sealed Receipts: Mutual Attestation</h4>
              <p className="text-gray-400 text-sm">
                When both parties sign a receipt, you get <strong className="text-white">counter-sealed</strong> proof.
                The sending agent signs the action, the receiving agent counter-signs. Two independent
                cryptographic signatures, one undeniable record. This isn&apos;t logging—it&apos;s evidence.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Everything you need for{' '}
              <span className="gradient-text">production-grade accountability.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-purple-400" />}
              title="Verify receipts in seconds"
              bullets={[
                'Paste JSON or drag-and-drop a file',
                'One-click sample receipt for demos',
                'Copy/clear + keyboard shortcut support',
                'Animated, readable results',
              ]}
            />

            <FeatureCard
              icon={<Link2 className="w-6 h-6 text-purple-400" />}
              title="See the chain, not just the verdict"
              bullets={[
                'Chain position + linkage checks',
                'Signer identity surfaced clearly',
                'Spot breaks and mismatches instantly',
              ]}
            />

            <FeatureCard
              icon={<Code className="w-6 h-6 text-purple-400" />}
              title="Raw details when you need them"
              bullets={[
                'Overview for humans',
                'Raw JSON for debugging',
                'Crypto details for auditors',
              ]}
            />

            <FeatureCard
              icon={<History className="w-6 h-6 text-purple-400" />}
              title="Track verifications over time"
              bullets={[
                'Search by receipt hash',
                'Filter valid/invalid',
                'Export CSV/JSON',
              ]}
              badge="Auth"
            />

            <FeatureCard
              icon={<Key className="w-6 h-6 text-purple-400" />}
              title="Integrate safely"
              bullets={[
                'Scoped permissions',
                'IP allowlist',
                'Expiration + revoke/rotate',
              ]}
              badge="Auth"
            />

            <FeatureCard
              icon={<Settings className="w-6 h-6 text-purple-400" />}
              title="Operate like a real service"
              bullets={[
                'Signer configuration',
                'Key rotation',
                'Usage and status metrics',
              ]}
              badge="Admin"
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              How verification works
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400">
              NotaryOS checks math, not promises. Here&apos;s the flow:
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto space-y-8"
          >
            <StepCard
              step={1}
              title="You provide a receipt"
              description="Paste JSON or upload a receipt file produced by an agent system."
            />
            <StepCard
              step={2}
              title="Notary parses + normalizes"
              description="We validate structure, required fields, and canonicalization rules to ensure the signed bytes match what you see."
            />
            <StepCard
              step={3}
              title="Cryptography is verified"
              description="We verify the signature using the declared algorithm and signer identity (e.g., Ed25519 public key)."
            />
            <StepCard
              step={4}
              title="Chain + time are checked"
              description="We validate chain linkage and timestamp constraints, then return a human-readable verdict with full details."
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex justify-center gap-4 mt-12"
          >
            <button
              onClick={() => router.push('/verify?sample=true')}
              className="btn-primary flex items-center gap-2"
            >
              Try a Sample Receipt
            </button>
            <Link
              href="/docs"
              className="btn-ghost flex items-center gap-2"
            >
              Read the Receipt Spec
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 lg:py-28 bg-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Built for builders, compliance teams, and CISOs
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            <UseCaseCard
              icon={<Users className="w-5 h-5 text-cyan-400" />}
              title="Multi-agent orchestration"
              description="Prove which agent produced what—and in what sequence—when workflows span tools and services."
            />
            <UseCaseCard
              icon={<AlertTriangle className="w-5 h-5 text-cyan-400" />}
              title="Incident response"
              description="Validate whether a suspect 'agent action' receipt is authentic before you trust it in investigations."
            />
            <UseCaseCard
              icon={<Terminal className="w-5 h-5 text-cyan-400" />}
              title="CI / QA verification"
              description="Fail builds when receipts don't verify. Treat trust as a testable invariant."
            />
            <UseCaseCard
              icon={<FileJson className="w-5 h-5 text-cyan-400" />}
              title="Compliance & audit trails"
              description="Export verification history and preserve evidence with cryptographic integrity checks."
            />
          </motion.div>
        </div>
      </section>

      {/* ATS Protocol Engine Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/30 via-gray-900 to-cyan-900/20 border border-purple-500/20 p-8 lg:p-12"
            >
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full">
                      The Engine Behind NotaryOS
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    The only compliance layer that{' '}
                    <span className="gradient-text">keeps up with inference speed.</span>
                  </h2>

                  <p className="text-gray-400 mb-6">
                    NotaryOS is powered by the ATS Protocol—a proprietary high-performance agent communication
                    engine with 7-layer zero-trust security. Receipts are issued, signed, and chained without
                    slowing down your agents.
                  </p>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <div className="text-2xl font-bold text-white">2.39ms</div>
                      <div className="text-xs text-gray-400">P50 verification latency</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <div className="text-2xl font-bold text-white">1,185</div>
                      <div className="text-xs text-gray-400">Receipts per second</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <div className="text-2xl font-bold text-white">100%</div>
                      <div className="text-xs text-gray-400">Success rate in production</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <div className="text-2xl font-bold text-white">7 layers</div>
                      <div className="text-xs text-gray-400">Zero-trust security</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/docs"
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      See the Docs
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/pricing"
                      className="btn-ghost flex items-center gap-2 text-sm"
                    >
                      View Pricing
                    </Link>
                  </div>
                </div>

                {/* Code preview */}
                <div className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border-b border-gray-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="ml-2 text-xs text-gray-500 font-mono">seal_and_verify.py</span>
                  </div>
                  <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto leading-relaxed">
                    <code>{`from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_sk_...")

# Seal an action — 2ms, tamper-proof
receipt = notary.seal(
    action="trade.executed",
    agent_id="trading-bot-v3",
    payload={"pair": "BTC/USD", "amount": 0.5}
)

# Or prove what DIDN'T happen
counterfactual = notary.seal_counterfactual(
    action_declined="trade.executed",
    capability="trade_usdc",
    opportunity={"spread": "0.02%"},
    reason="risk_threshold_exceeded"
)

# Anyone can verify — no trust required
result = notary.verify(receipt.hash)
print(result.valid)  # True`}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Trust signals you can verify
              </h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                {
                  icon: <Github className="w-6 h-6 text-purple-400" />,
                  title: 'Open source core',
                  desc: 'Review the verification logic and receipt format in public.',
                },
                {
                  icon: <Server className="w-6 h-6 text-purple-400" />,
                  title: 'Offline-verifiable',
                  desc: 'Validate receipts without trusting our UI.',
                },
                {
                  icon: <Key className="w-6 h-6 text-purple-400" />,
                  title: 'Key rotation support',
                  desc: 'Operational hygiene for real deployments.',
                },
                {
                  icon: <AlertTriangle className="w-6 h-6 text-purple-400" />,
                  title: 'Clear failure modes',
                  desc: "If it fails, you'll know exactly why.",
                },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeInUp} className="card text-center">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-white font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex justify-center gap-6 mt-12 text-sm">
              <a href="#" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                Security practices <ExternalLink className="w-3 h-3" />
              </a>
              <a href="#" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                Responsible disclosure <ExternalLink className="w-3 h-3" />
              </a>
              <a href="#" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                Status <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Open Source Section */}
      <section id="open-source" className="py-20 lg:py-28 bg-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Open source core. Hosted demo for everyone.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8">
              Notary's verification core is open source so teams can audit, fork, and self-host.
              We also run a hosted demo so anyone can validate receipts instantly without setup.
            </motion.p>

            <motion.ul variants={fadeInUp} className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-10">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Self-host in your environment
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Run locally for air-gapped verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Use the hosted demo for quick checks
              </li>
            </motion.ul>

            <motion.div variants={fadeInUp} className="flex justify-center gap-4">
              <a
                href="https://github.com/hellothere012/notaryos"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center gap-2"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
              <Link
                href="/docs"
                className="btn-secondary flex items-center gap-2"
              >
                Run Locally (Docker)
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-12 text-center"
            >
              Frequently asked questions
            </motion.h2>

            <motion.div variants={staggerContainer} className="card">
              <FAQItem
                question="What is a counterfactual receipt?"
                answer="A counterfactual receipt is cryptographic proof that your AI agent had the capability and opportunity to act, but deliberately chose not to. It documents restraint with the same mathematical rigor as documenting action."
              />
              <FAQItem
                question="What is a counter-sealed receipt?"
                answer="When both the sending and receiving agents sign the same receipt, you get counter-sealed (dual-attestation) proof. Two independent signatures, one undeniable record. This is stronger than any single-party log."
              />
              <FAQItem
                question="Do I need an account?"
                answer="No for the public verifier — paste any receipt and check it instantly. Accounts are required for issuing receipts, history, API keys, and admin features. The free tier includes 1,000 receipts per month."
              />
              <FAQItem
                question="How fast is verification?"
                answer="NotaryOS runs on the ATS Protocol engine with 2.39ms P50 latency and handles 1,185 receipts per second. Signing and verification add near-zero overhead to your agent pipeline."
              />
              <FAQItem
                question="Is this a blockchain?"
                answer="No. Receipts use per-agent hash chains for tamper-evidence, not a distributed ledger. Each agent maintains its own chain, linked by cryptographic hashes. It's lightweight, fast, and doesn't require consensus."
              />
              <FAQItem
                question="Can I verify offline?"
                answer="Yes. Receipts are portable JSON with embedded signatures. The open source verification core can run locally, in CI/CD pipelines, or air-gapped — no network call required."
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-900 to-purple-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              When your AI acts, you have receipts.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8">
              Start issuing tamper-proof receipts in 5 minutes. Free tier included—no credit card required.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => router.push('/docs#quickstart')}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/verify?sample=true')}
                className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
              >
                <Shield className="w-5 h-5" />
                Verify a Receipt
              </button>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-sm text-gray-500">
              Enterprise needs?{' '}
              <Link href="/pricing" className="text-purple-400 hover:text-purple-300">
                View pricing
              </Link>{' '}
              or{' '}
              <a
                href="https://github.com/hellothere012/notaryos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                explore the open source core
              </a>.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Product */}
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/verify" className="text-gray-400 hover:text-white">Verifier</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link href="/history" className="text-gray-400 hover:text-white">History</Link></li>
                <li><Link href="/api-keys" className="text-gray-400 hover:text-white">API Keys</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="text-gray-400 hover:text-white">Docs</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Receipt Spec</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Changelog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Status</a></li>
              </ul>
            </div>

            {/* Security */}
            <div>
              <h4 className="text-white font-medium mb-4">Security</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Security Practices</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Responsible Disclosure</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
              </ul>
            </div>

            {/* Open Source */}
            <div>
              <h4 className="text-white font-medium mb-4">Open Source</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com/hellothere012/notaryos" className="text-gray-400 hover:text-white">GitHub</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contributing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">License</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-400 text-sm">NotaryOS</span>
            </div>
            <p className="text-gray-500 text-sm text-center sm:text-right">
              Open source verification core. Hosted demo provided as-is.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
