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
                onClick={() => router.push('/verify')}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                Try the Demo
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
              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                Verify AI agent receipts
                <span className="gradient-text">—cryptographically.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-400 mb-8 max-w-xl"
              >
                Notary is the trust layer for agent-to-agent systems. Upload a receipt (JSON) and
                verify signatures, chain integrity, and timestamps in seconds—open source core with
                a public hosted demo.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 mb-8">
                <button
                  onClick={() => router.push('/verify')}
                  className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
                >
                  Try the Demo
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="https://github.com/hellothere012/notaryos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-sm text-gray-500 mb-6">
                No signup required for the demo. Works with sample receipts.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center gap-6 text-sm text-gray-400"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Ed25519 + HMAC support
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Chain-aware verification
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Human-readable results
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
              <h2 className="text-2xl font-bold text-white mb-2">Paste a receipt. Get a verdict.</h2>
              <p className="text-gray-400">
                Drop a JSON receipt into the verifier and see exactly what passed, what failed, and why.
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
              Most agent logs are easy to fake.{' '}
              <span className="gradient-text">Receipts aren't.</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-400 max-w-3xl mx-auto"
            >
              Agent systems increasingly make decisions and trigger actions across tools, services,
              and teams. Notary receipts add cryptographic proof—so "this happened" can be verified,
              not just asserted.
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
              Everything you need to validate receipts in production.
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
              Notary checks proof, not promises. Here's the flow:
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
              Built for builders and security teams
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

      {/* OpenClaw Integration Callout */}
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
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-900/30 via-gray-900 to-purple-900/20 border border-orange-500/20 p-8 lg:p-12"
            >
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

              <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🦞</span>
                    <div>
                      <span className="text-xs font-medium text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        Featured Integration
                      </span>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Using OpenClaw?
                    <br />
                    <span className="text-orange-400">Your agents need receipts.</span>
                  </h2>

                  <p className="text-gray-400 mb-6">
                    OpenClaw agents execute commands, manage files, and browse the web autonomously.
                    NotaryOS adds cryptographic proof of every action&mdash;so security teams can
                    verify what happened without trusting the agent's own logs.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/docs"
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      See Integration Guide
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => router.push('/verify?sample=true')}
                      className="btn-ghost flex items-center gap-2 text-sm"
                    >
                      Try a Sample Receipt
                    </button>
                  </div>
                </div>

                {/* Code preview */}
                <div className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border-b border-gray-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="ml-2 text-xs text-gray-500 font-mono">skills/notary_seal.py</span>
                  </div>
                  <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto leading-relaxed">
                    <code>{`from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_sk_...")

# Every OpenClaw action gets a receipt
receipt = notary.seal(
    action="file.written",
    agent_id="openclaw-agent",
    payload={"path": "/home/user/report.md"}
)

print(receipt.hash)   # "sha256:a1b2c3..."
print(receipt.valid)  # True`}</code>
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
                question="Do I need an account?"
                answer="No for the public demo verifier. Accounts are required for history, API keys, and admin features."
              />
              <FAQItem
                question="What formats do you support?"
                answer="JSON receipts following the Notary receipt format. We show raw JSON and crypto details to make debugging straightforward."
              />
              <FAQItem
                question="Can I verify offline?"
                answer="Yes. The format is designed to be portable, and the open source core can be run locally."
              />
              <FAQItem
                question="Is this a blockchain?"
                answer="No. 'Chain' refers to cryptographic linkage between receipts for integrity, not a public blockchain."
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
              Verify your first receipt in under a minute.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8">
              Use the hosted demo now, then pull the open source core when you're ready to self-host.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => router.push('/verify')}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                Try the Demo
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="https://github.com/hellothere012/notaryos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-sm text-gray-500">
              Want API access?{' '}
              <Link href="/signup" className="text-purple-400 hover:text-purple-300">
                Create an account
              </Link>{' '}
              to generate keys with scoped permissions.
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
