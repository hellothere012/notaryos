/**
 * AboutPage - NotaryOS Product Story
 *
 * Explains what NotaryOS is, why it's unique, how it differs,
 * why you should use it, and the value vs. cost.
 *
 * Design: Matches LandingPage patterns (Framer Motion, purple/cyan gradients)
 * with visual elements inspired by KIMI's PublicVerifyPage (mesh backgrounds, animated cards).
 *
 * IMPORTANT: This page does NOT expose any backend/protocol implementation details.
 * NotaryOS is presented as a standalone, open-source product.
 *
 * About page for NotaryOS
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Lock,
  GitBranch,
  Eye,
  EyeOff,
  Scale,
  Fingerprint,
  Layers,
  Clock,
  Zap,
  Users,
  Globe,
  ChevronRight,
  ExternalLink,
  Github,
  Code,
  Sparkles,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  BarChart3,
  BadgeCheck,
} from 'lucide-react';

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─── Animated Background ─────────────────────────────────────────────────────

const AnimatedMeshBackground: React.FC = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gray-950" />
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
      style={{
        background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
        top: '10%',
        left: '15%',
      }}
      animate={{
        x: [0, 40, 0],
        y: [0, -30, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
      style={{
        background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
        bottom: '15%',
        right: '10%',
      }}
      animate={{
        x: [0, -30, 0],
        y: [0, 40, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04]"
      style={{
        background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
        top: '50%',
        right: '30%',
      }}
      animate={{
        x: [0, 25, 0],
        y: [0, 25, 0],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon }) => (
  <motion.div
    variants={scaleIn}
    className="text-center p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300"
  >
    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
      {icon}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </motion.div>
);

// ─── Comparison Row ──────────────────────────────────────────────────────────

interface ComparisonRowProps {
  feature: string;
  notary: boolean | string;
  others: boolean | string;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({ feature, notary, others }) => (
  <motion.tr variants={fadeInUp} className="border-b border-gray-800/50">
    <td className="py-4 pr-4 text-gray-300 font-medium">{feature}</td>
    <td className="py-4 px-4 text-center">
      {typeof notary === 'boolean' ? (
        notary ? (
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
        ) : (
          <span className="text-gray-600">&mdash;</span>
        )
      ) : (
        <span className="text-green-400 text-sm font-medium">{notary}</span>
      )}
    </td>
    <td className="py-4 pl-4 text-center">
      {typeof others === 'boolean' ? (
        others ? (
          <CheckCircle className="w-5 h-5 text-gray-500 mx-auto" />
        ) : (
          <span className="text-gray-600">&mdash;</span>
        )
      ) : (
        <span className="text-gray-500 text-sm">{others}</span>
      )}
    </td>
  </motion.tr>
);

// ─── Timeline Item ───────────────────────────────────────────────────────────

interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ icon, title, description, color }) => (
  <motion.div variants={fadeInUp} className="flex gap-4 items-start">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// ─── Value Card ──────────────────────────────────────────────────────────────

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

const ValueCard: React.FC<ValueCardProps> = ({ icon, title, description, highlight }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="p-6 rounded-2xl bg-gray-800/40 border border-gray-700/50 hover:border-purple-500/40 transition-all duration-300 group"
  >
    <div className="w-12 h-12 rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 flex items-center justify-center mb-4 transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed mb-3">{description}</p>
    {highlight && (
      <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
        {highlight}
      </span>
    )}
  </motion.div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  return (
    <div className="min-h-screen relative">
      <AnimatedMeshBackground />

      {/* ─── Navigation ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NotaryOS</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-white text-sm font-medium">
                About
              </Link>
              <Link to="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">
                Pricing
              </Link>
              <Link to="/docs" className="text-gray-400 hover:text-white text-sm transition-colors">
                Docs
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/verify')}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                Try the Demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero: What is NotaryOS ─────────────────────────────────────── */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              Built by a collaboration of AI agents
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Digital notarization
              <br />
              <span className="gradient-text">for the age of AI agents.</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              NotaryOS creates tamper-evident, cryptographically signed receipts for every
              AI agent action. When agents make decisions, send messages, or execute tasks,
              NotaryOS provides the proof that it actually happened&mdash;and that nobody
              altered the record afterward.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                onClick={() => navigate('/verify')}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                Verify a Receipt
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                to="/pricing"
                className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
              >
                View Pricing
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-8 text-sm text-gray-500"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                Cryptographic signing
              </span>
              <span className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                Chain integrity
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-400" />
                Third-party verifiable
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── By the Numbers ─────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-800/20 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <StatCard
              value="<5ms"
              label="Receipt sealing time"
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
            />
            <StatCard
              value="100%"
              label="Tamper detection rate"
              icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
            />
            <StatCard
              value="3"
              label="Lines of code to integrate"
              icon={<Code className="w-6 h-6 text-cyan-400" />}
            />
            <StatCard
              value="$0"
              label="Starter tier — forever free"
              icon={<BadgeCheck className="w-6 h-6 text-purple-400" />}
            />
          </motion.div>
        </div>
      </section>

      {/* ─── The Problem ────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInLeft}
                className="text-3xl sm:text-4xl font-bold text-white mb-6"
              >
                AI agents are making decisions.
                <br />
                <span className="text-gray-500">But who's keeping the receipts?</span>
              </motion.h2>

              <motion.div variants={fadeInLeft} className="space-y-4 text-gray-400">
                <p className="leading-relaxed">
                  As AI agents become more autonomous&mdash;managing finances, orchestrating
                  workflows, making recommendations&mdash;a critical gap emerges: <strong className="text-white">
                  there's no standardized way to prove what happened.</strong>
                </p>
                <p className="leading-relaxed">
                  Logs can be edited. Timestamps can be faked. Without cryptographic proof,
                  "this agent did X" is just an assertion, not a fact.
                </p>
                <p className="leading-relaxed">
                  NotaryOS closes that gap. Every action gets a signed, chained, verifiable
                  receipt. Anyone can check it. Nobody can alter it.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-4"
            >
              {/* Problem cards */}
              {[
                {
                  icon: <EyeOff className="w-5 h-5 text-red-400" />,
                  title: 'No visibility',
                  desc: 'Agent actions disappear into logs that nobody audits',
                  color: 'bg-red-500/10 border-red-500/20',
                },
                {
                  icon: <Scale className="w-5 h-5 text-orange-400" />,
                  title: 'No accountability',
                  desc: 'When something goes wrong, there\'s no tamper-proof record',
                  color: 'bg-orange-500/10 border-orange-500/20',
                },
                {
                  icon: <Users className="w-5 h-5 text-yellow-400" />,
                  title: 'No trust between agents',
                  desc: 'Multi-agent systems can\'t verify each other\'s claims',
                  color: 'bg-yellow-500/10 border-yellow-500/20',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInRight}
                  className={`p-5 rounded-xl border ${item.color} flex items-start gap-4`}
                >
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}

              {/* Solution arrow */}
              <motion.div
                variants={fadeInRight}
                className="p-5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-4"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-green-400 font-medium mb-1">NotaryOS solves all three</h4>
                  <p className="text-sm text-gray-400">
                    Cryptographic receipts that prove action, identity, sequence, and time
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── What Makes NotaryOS Unique ─────────────────────────────────── */}
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
              Four things no one else does.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 max-w-2xl mx-auto">
              NotaryOS isn't just logging with extra steps. It's a fundamentally different
              approach to agent accountability.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            <ValueCard
              icon={<Fingerprint className="w-6 h-6 text-purple-400" />}
              title="Per-Agent Hash Chains"
              description="Every agent maintains its own cryptographic chain. Each receipt links to the previous one. If anyone inserts, deletes, or reorders a receipt, the chain breaks — and you'll know."
              highlight="Tamper detection built in"
            />

            <ValueCard
              icon={<EyeOff className="w-6 h-6 text-cyan-400" />}
              title="Counterfactual Receipts"
              description="Prove an agent could have acted but chose not to. Three cryptographic proofs — capability, opportunity, and decision — create an irrefutable record of restraint. Essential for regulated industries."
              highlight="Proof of non-action"
            />

            <ValueCard
              icon={<GitBranch className="w-6 h-6 text-green-400" />}
              title="Provenance DAG"
              description="Track trust across multi-agent workflows with a directed acyclic graph. If an upstream receipt is invalidated, everything downstream automatically becomes ungrounded — trust doesn't silently persist."
              highlight="Cascading trust verification"
            />

            <ValueCard
              icon={<Globe className="w-6 h-6 text-yellow-400" />}
              title="Third-Party Verifiable"
              description="Receipts are self-contained JSON with embedded signatures. Anyone can verify them offline — no need to trust our servers, call our API, or even be online. The math speaks for itself."
              highlight="Zero-trust by default"
            />
          </motion.div>
        </div>
      </section>

      {/* ─── How It's Different ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
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
              Not another logging tool.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400">
              Here's how NotaryOS compares to what you're probably using today.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="rounded-2xl bg-gray-800/30 border border-gray-700/50 overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <span className="text-purple-400 font-semibold text-sm">NotaryOS</span>
                  </th>
                  <th className="py-4 px-4 text-center">
                    <span className="text-gray-500 font-medium text-sm">Traditional Logging</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                <ComparisonRow feature="Cryptographic signatures" notary={true} others={false} />
                <ComparisonRow feature="Per-agent hash chains" notary={true} others={false} />
                <ComparisonRow feature="Tamper detection" notary="Automatic" others="Manual audit" />
                <ComparisonRow feature="Third-party verification" notary="Offline capable" others="Requires access" />
                <ComparisonRow feature="Proof of non-action" notary={true} others={false} />
                <ComparisonRow feature="Provenance tracking" notary="DAG-based" others="Linear or none" />
                <ComparisonRow feature="Integration effort" notary="3 lines" others="Varies" />
                <ComparisonRow feature="Self-hostable" notary={true} others={true} />
                <ComparisonRow feature="Agent-native design" notary={true} others={false} />
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works (Visual Flow) ─────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-gray-800/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
              Seal. Verify. Trust.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400">
              Three concepts. One line of code. Complete accountability.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <TimelineItem
              icon={<FileCheck className="w-6 h-6 text-purple-400" />}
              title="Seal — Create a cryptographic receipt"
              description="When an agent takes an action, seal() creates a receipt with a signed hash, timestamp, agent identity, and chain linkage. One function call. The receipt is immutable from the moment it's created."
              color="bg-purple-500/20"
            />
            <TimelineItem
              icon={<ShieldCheck className="w-6 h-6 text-cyan-400" />}
              title="Verify — Confirm it's authentic"
              description="Anyone with the receipt can verify the signature, check the chain position, and confirm the timestamp. No API key needed. No server required. The receipt carries its own proof."
              color="bg-cyan-500/20"
            />
            <TimelineItem
              icon={<Layers className="w-6 h-6 text-green-400" />}
              title="Track — Follow the chain of custody"
              description="When multiple agents collaborate, provenance references link their receipts into a directed graph. If any upstream receipt is invalidated, downstream receipts are automatically flagged — trust cascades in both directions."
              color="bg-green-500/20"
            />
            <TimelineItem
              icon={<EyeOff className="w-6 h-6 text-yellow-400" />}
              title="Decline — Prove you chose not to act"
              description="Counterfactual receipts cryptographically prove that an agent had the capability and opportunity to act, but deliberately chose not to. Three separate proofs. One irrefutable record."
              color="bg-yellow-500/20"
            />
          </motion.div>

          {/* Code snippet */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-2xl bg-gray-800/60 border border-gray-700/50 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700/50">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-sm text-gray-500">your_agent.py</span>
            </div>
            <pre className="p-6 text-sm text-gray-300 font-mono overflow-x-auto leading-relaxed">
              <code>{`from notary import seal, verify

# Seal an action — one line
receipt = await seal(
    {"message": "Task completed", "result": data},
    from_agent="my-agent",
    to_agent="dashboard"
)

# Verify anywhere — no API key needed
assert receipt.valid   # True
print(receipt.badge)   # "seal:a1b2...c3d4"`}</code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* ─── Who Is This For ────────────────────────────────────────────── */}
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
              Built for teams that take agent trust seriously.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeInUp} className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Agent Developers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Add accountability to your agent in 3 lines
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Python, TypeScript, and Go SDKs
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Works with any agent framework
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Platform Teams</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Audit trail for every agent interaction
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Provenance tracking across microservices
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Self-hostable for air-gapped environments
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Compliance & Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Counterfactual proofs for regulated industries
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Exportable verification history
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Cryptographic evidence for disputes
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Value vs. Cost ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-gray-800/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              The cost of <span className="text-red-400">not</span> having receipts
              <br />
              is always higher.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              One disputed agent action. One compliance audit. One customer asking
              "did your AI actually do what it said?" That's when you wish you had
              cryptographic proof.
            </motion.p>

            <motion.div variants={staggerContainer} className="grid md:grid-cols-2 gap-8 text-left">
              {/* Cost side */}
              <motion.div
                variants={fadeInUp}
                className="p-8 rounded-2xl bg-gray-800/40 border border-gray-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  What you get
                </h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Immutable proof for every agent action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Instant tamper detection across chains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Compliance-ready audit trails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Customer-facing verification (shareable receipt links)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Counterfactual proofs (regulated industries)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Multi-agent provenance tracking</span>
                  </li>
                </ul>
              </motion.div>

              {/* Price side */}
              <motion.div
                variants={fadeInUp}
                className="p-8 rounded-2xl bg-gradient-to-br from-purple-900/30 to-cyan-900/20 border border-purple-500/20"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  What it costs
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-3xl font-bold text-white">$0<span className="text-lg text-gray-400 font-normal">/month</span></div>
                    <p className="text-sm text-gray-400 mt-1">
                      Starter: 100 receipts/month. Perfect for development, testing, and small projects.
                    </p>
                  </div>
                  <div className="border-t border-gray-700/50 pt-4">
                    <div className="text-2xl font-bold text-white">$59<span className="text-lg text-gray-400 font-normal">/month</span></div>
                    <p className="text-sm text-gray-400 mt-1">
                      Explorer: 10,000 receipts/month. For production agents that need real accountability.
                    </p>
                  </div>
                  <div className="border-t border-gray-700/50 pt-4">
                    <p className="text-sm text-purple-300">
                      That's less than <strong>$0.006 per receipt</strong> on Explorer.
                      A single disputed agent action costs more than a year of NotaryOS.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Origin Story ───────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Built by AI agents.{' '}
              <span className="gradient-text">For AI agents.</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 max-w-2xl mx-auto">
              NotaryOS was designed and implemented through a real-time collaboration
              between five AI agents, each contributing their specialized expertise.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {[
              { name: 'OPUS', role: 'Architecture', color: 'from-purple-500 to-purple-700' },
              { name: 'TELE', role: 'Integration', color: 'from-cyan-500 to-cyan-700' },
              { name: 'KIMI', role: 'Design', color: 'from-pink-500 to-pink-700' },
              { name: 'GROK', role: 'Security', color: 'from-orange-500 to-orange-700' },
              { name: 'GEMINI', role: 'Optimization', color: 'from-green-500 to-green-700' },
            ].map((agent, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className="text-center p-4 rounded-xl bg-gray-800/30 border border-gray-700/50"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-white text-xs font-bold">{agent.name[0]}</span>
                </div>
                <div className="text-white text-sm font-semibold">{agent.name}</div>
                <div className="text-gray-500 text-xs">{agent.role}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center text-sm text-gray-500 mt-8"
          >
            This is the first cryptographic receipt system designed, debated, and built
            entirely through multi-agent collaboration. NotaryOS practices what it preaches.
          </motion.p>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────────── */}
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
              Your agents deserve receipts.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
              Start with the free tier. Verify your first receipt in under a minute.
              Scale to production when you're ready.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-8">
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/verify')}
                className="flex items-center gap-2 px-8 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
              >
                Try the Demo
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link to="/pricing" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                View pricing <ChevronRight className="w-3 h-3" />
              </Link>
              <a
                href="/docs"
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Read the docs <ChevronRight className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/hellothere012/notaryos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                View on GitHub <Github className="w-3 h-3" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/verify" className="text-gray-400 hover:text-white">Verifier</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link to="/history" className="text-gray-400 hover:text-white">History</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Developers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/docs" className="text-gray-400 hover:text-white">Docs</Link></li>
                <li><Link to="/api-keys" className="text-gray-400 hover:text-white">API Keys</Link></li>
                <li><a href="https://github.com/hellothere012/notaryos" className="text-gray-400 hover:text-white">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Security</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Security Practices</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Responsible Disclosure</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-400 text-sm">NotaryOS</span>
            </div>
            <p className="text-gray-500 text-sm text-center sm:text-right">
              Cryptographic receipts for AI agents. Built by agents, for agents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
