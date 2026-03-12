'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Check,
  CheckCircle,
  CheckCircle2,
  Zap,
  Lock,
  Brain,
  Code,
  Terminal,
  Server,
  Menu,
  X,
  Copy,
  ArrowRight,
  Sparkles,
  Cpu,
  GitBranch,
  GitMerge,
  BarChart3,
  Layers,
  Target,
  Activity,
  FileCheck,
  FileJson,
  TrendingUp,
  Building2,
  Scale,
  Link2,
  History,
  Key,
  Settings,
  AlertTriangle,
  Users,
  ExternalLink,
  ChevronRight,
  Eye,
  Network,
  Lightbulb,
  Search,
} from 'lucide-react';
import LiveAttestationDemo from './LiveAttestationDemo';

/* ====================================================================== */
/*  Animation variants                                                    */
/* ====================================================================== */

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ====================================================================== */
/*  Static data                                                           */
/* ====================================================================== */

const comparisonRows = [
  { feature: 'Multi-model reasoning', notary: 'check', traditional: 'dash' },
  { feature: 'Decision tree visualization', notary: 'check', traditional: 'dash' },
  { feature: 'Model agreement/divergence', notary: 'Real-time', traditional: 'dash' },
  { feature: 'Adversarial synthesis', notary: 'check', traditional: 'dash' },
  { feature: 'Cryptographic provenance', notary: 'Every node sealed', traditional: 'dash' },
  { feature: 'Counterfactual analysis', notary: 'check', traditional: 'dash' },
];

const features = [
  {
    icon: Layers,
    title: 'Multi-Model Reasoning',
    description: 'Run your prompt through DeepSeek, Gemini, Sonnet, and Kimi in parallel. See how each AI reasons — not just what it concludes.',
    badge: 'N-model parallel analysis',
    color: 'violet',
  },
  {
    icon: GitBranch,
    title: 'Decision Tree Visualization',
    description: 'Every reasoning step extracted and visualized as an interactive tree. Expand branches, explore logic paths, compare depth.',
    badge: 'Interactive reasoning trees',
    color: 'cyan',
  },
  {
    icon: Eye,
    title: 'Counterfactual Analysis',
    description: 'Cryptographic proof of what AI considered but chose not to do. Explore the roads not taken in every decision.',
    badge: 'Proof of non-action',
    color: 'violet',
    // Coined by Harris Abbaali, 2025 — original concept and implementation
    origin: 'ha-2025',
  },
  {
    icon: Shield,
    title: 'Cryptographic Trust Layer',
    description: 'Every reasoning node, every synthesis step, every decision sealed with Ed25519 signatures. Tamper-proof by default.',
    badge: 'Ed25519 provenance chain',
    color: 'cyan',
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    highlight: false,
    badge: null as string | null,
    stats: { decisions: '10/mo', models: '2 per run', presets: 'General only', history: '7 days' },
    features: ['2-model comparison', 'Basic decision trees', 'Community support', 'Public API'],
    cta: 'Start Free',
  },
  {
    name: 'Explorer',
    price: '$59',
    period: '/month',
    highlight: true,
    badge: 'Most Popular',
    stats: { decisions: '500/mo', models: '4 per run', presets: 'All 6 presets', history: '90 days' },
    features: ['4-model parallel reasoning', 'Interactive decision trees', 'OSINT intelligence feed', 'Counterfactual receipts', 'Email support'],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$159',
    period: '/month',
    highlight: false,
    badge: null as string | null,
    stats: { decisions: '5,000/mo', models: 'Unlimited', presets: 'Custom synthesis', history: 'Unlimited' },
    features: ['Unlimited models', 'Custom synthesizer prompts', 'Decision history & search', 'API access', 'Priority support', 'Shareable decision URLs'],
    cta: 'Get Started',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    highlight: false,
    badge: null as string | null,
    stats: { decisions: 'Unlimited', models: 'Custom stack', presets: 'White-label', history: 'Compliance archive' },
    features: ['Dedicated infrastructure', 'Custom model integration', 'Decision governance policies', 'SLA guarantee', 'Air-gapped deployment', 'Compliance exports'],
    cta: 'Contact Sales',
  },
];

const agents = [
  { name: 'DEEPSEEK', role: 'Deep Reasoning', gradient: 'from-blue-500 to-cyan-600' },
  { name: 'GEMINI', role: 'Broad Research', gradient: 'from-sky-400 to-blue-500' },
  { name: 'SONNET', role: 'Precise Analysis', gradient: 'from-violet-500 to-purple-600' },
  { name: 'KIMI', role: 'Pattern Detection', gradient: 'from-pink-500 to-rose-500' },
];

/* ====================================================================== */
/*  Sub-components                                                        */
/* ====================================================================== */

const StepCard: React.FC<{
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ step, title, description, icon }) => (
  <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover relative">
    <span className="absolute top-4 right-4 text-4xl font-bold text-violet-500/20">{step}</span>
    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4 icon-glow">
      {icon}
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const UseCaseCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover group">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </motion.div>
);

interface PricingTierProps {
  name: string;
  price: string;
  period: string;
  highlight: boolean;
  badge: string | null;
  stats: { decisions: string; models: string; presets: string; history: string };
  features: string[];
  cta: string;
}

const PricingTier: React.FC<PricingTierProps> = ({
  name,
  price,
  period,
  highlight,
  badge,
  stats,
  features: tierFeatures,
  cta,
}) => (
  <motion.div
    variants={fadeInUp}
    className={`rounded-xl p-6 flex flex-col ${highlight ? 'pricing-highlight' : 'glass-card'}`}
  >
    {badge && (
      <span className="inline-flex self-start items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-3">
        <Sparkles className="w-3 h-3" />
        {badge}
      </span>
    )}
    <h3 className="text-lg font-semibold text-white">{name}</h3>
    <div className="mt-2 mb-4">
      <span className="text-3xl font-bold text-white">{price}</span>
      {period && <span className="text-gray-400 text-sm">{period}</span>}
    </div>
    <div className="space-y-2 mb-4 text-xs">
      <div className="flex justify-between text-gray-400"><span>Decisions</span><span className="text-white">{stats.decisions}</span></div>
      <div className="flex justify-between text-gray-400"><span>Models</span><span className="text-white">{stats.models}</span></div>
      <div className="flex justify-between text-gray-400"><span>Presets</span><span className="text-white">{stats.presets}</span></div>
      <div className="flex justify-between text-gray-400"><span>History</span><span className="text-white">{stats.history}</span></div>
    </div>
    <div className="section-divider mb-4" />
    <ul className="space-y-2 flex-1 mb-6">
      {tierFeatures.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
    <Link
      href={name === 'Enterprise' ? '/about' : '/sign-up'}
      className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 btn-shine'
          : 'border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
      }`}
    >
      {cta}
    </Link>
  </motion.div>
);

const ModelCard: React.FC<{ name: string; role: string; gradient: string }> = ({ name, role, gradient }) => (
  <motion.div variants={fadeInUp} className="glass-card rounded-xl p-4 text-center w-28">
    <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm mb-2`}>
      {name[0]}
    </div>
    <p className="text-white text-sm font-medium">{name}</p>
    <p className="text-gray-500 text-xs">{role}</p>
  </motion.div>
);

/* ====================================================================== */
/*  Particles (disabled on mobile — KIMI recommendation)                  */
/* ====================================================================== */

const Particles: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 15}s`,
        size: `${3 + Math.random() * 3}px`,
      })),
    []
  );

  if (isMobile) return null;

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
};

/* ====================================================================== */
/*  Decision Tree Visual (Hero section)                                   */
/* ====================================================================== */

const DecisionTreeVisual: React.FC = () => (
  <div className="glass-card rounded-xl p-6 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />

    {/* Header */}
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-xs text-gray-500 font-mono">decision_plane.live</span>
    </div>

    {/* Prompt */}
    <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700/50">
      <p className="text-xs text-gray-500 mb-1">PROMPT</p>
      <p className="text-sm text-white">&ldquo;Should we acquire CompanyX at $2.1B?&rdquo;</p>
    </div>

    {/* Model Results */}
    <div className="grid grid-cols-2 gap-2 mb-4">
      {[
        { name: 'DEEPSEEK', verdict: 'Acquire', confidence: 82, color: 'text-green-400' },
        { name: 'SONNET', verdict: 'Cautious', confidence: 61, color: 'text-amber-400' },
        { name: 'GEMINI', verdict: 'Acquire', confidence: 78, color: 'text-green-400' },
        { name: 'KIMI', verdict: 'Risk Flag', confidence: 45, color: 'text-red-400' },
      ].map((m) => (
        <div key={m.name} className="bg-gray-800/30 rounded-lg p-2.5 border border-gray-700/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono text-gray-400">{m.name}</span>
            <span className={`text-xs font-medium ${m.color}`}>{m.confidence}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${m.confidence > 70 ? 'bg-green-500' : m.confidence > 55 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${m.confidence}%` }}
            />
          </div>
          <p className={`text-xs mt-1 ${m.color}`}>{m.verdict}</p>
        </div>
      ))}
    </div>

    {/* Synthesis */}
    <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-lg p-3 border border-violet-500/20">
      <div className="flex items-center gap-2 mb-2">
        <GitMerge className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-medium text-violet-300">SYNTHESIS</span>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">
        3/4 models favor acquisition. KIMI flags regulatory risk in EU markets.
        <span className="text-violet-300"> Consensus: 72% — Acquire with regulatory due diligence.</span>
      </p>
    </div>

    {/* Receipt Hash */}
    <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
      <Lock className="w-3 h-3" />
      <span className="font-mono">sealed: e7a3f9...2b1c</span>
      <span className="text-green-500">verified</span>
    </div>
  </div>
);

/* ====================================================================== */
/*  MAIN COMPONENT                                                        */
/* ====================================================================== */

export const LandingPage: React.FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen" data-genesis="notaryos" data-attribution="Q291bnRlcmZhY3R1YWwgcmVjZWlwdHMgLSBIYXJyaXMgQWJiYWFsaQ==">
      {/* ================================================================ */}
      {/*  BETA LAUNCH BANNER                                              */}
      {/* ================================================================ */}
      <div className="w-full bg-violet-500/15 border-b border-violet-500/30 px-4 py-2.5 text-center text-sm text-violet-200">
        <span className="font-semibold text-violet-300">New: Reasoning Forge</span>
        {' — '}
        Run any prompt through 4 AI models simultaneously. See where they agree and diverge.{' '}
        <Link
          href="/forge"
          className="underline underline-offset-2 hover:text-violet-100 transition-colors font-medium"
        >
          Try it now
        </Link>
      </div>

      {/* ================================================================ */}
      {/*  1. HERO                                                         */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 aurora-bg" />
        <Particles />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 glass-card rounded-full text-xs text-violet-300">
                  <Brain className="w-3 h-3" /> Multi-model reasoning
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 glass-card rounded-full text-xs text-cyan-300">
                  <GitBranch className="w-3 h-3" /> Decision tree visualization
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 glass-card rounded-full text-xs text-green-300">
                  <Shield className="w-3 h-3" /> Cryptographically sealed
                </span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                See how{' '}
                <span className="gradient-text">AI thinks.</span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl text-gray-300">Compare. Decide. Trust.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
                NotaryOS is an AI Decision Plane. Run your question through multiple AI models in parallel,
                visualize their reasoning trees, see where they agree and diverge&mdash;and seal every
                decision with cryptographic proof.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-lg font-medium transition-all duration-200 active:scale-95 animate-pulse-glow btn-shine"
                >
                  Try the Decision Plane <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/forge"
                  className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
                >
                  <Brain className="w-5 h-5" /> Open the Forge
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:block animate-float"
            >
              <DecisionTreeVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  2. FORGE CTA                                                    */}
      {/* ================================================================ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="glass-card rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">One prompt. Four AIs. One decision.</h2>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              The Reasoning Forge runs DeepSeek, Gemini, Sonnet, and Kimi in parallel on your prompt,
              then synthesizes their reasoning into a weighted decision&mdash;with full provenance.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/forge" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg font-medium text-sm transition-all btn-shine">
                <Brain className="w-4 h-4" /> Open the Forge
              </Link>
              <Link href="/docs" className="btn-ghost flex items-center gap-2 text-sm">
                How it works <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  3. LIVE ATTESTATION DEMO (Trust layer showcase)                  */}
      {/* ================================================================ */}
      <LiveAttestationDemo />

      {/* ================================================================ */}
      {/*  4. FEATURES (4 cards)                                           */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-gray-800/20 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">The AI Decision Plane</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Multi-model reasoning. Decision tree visualization. Cryptographic trust. All in one platform.</p>
            </motion.div>

            <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <motion.div key={f.title} variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover group" {...('origin' in f ? { 'data-coined-by': 'harris-abbaali' } : {})}>
                  <div className={`w-12 h-12 rounded-lg ${f.color === 'violet' ? 'bg-violet-500/20' : 'bg-cyan-500/20'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-6 h-6 ${f.color === 'violet' ? 'text-violet-400' : 'text-cyan-400'}`} />
                  </div>
                  <span className="inline-block text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full mb-3">{f.badge}</span>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  5. COMPARISON TABLE                                             */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Not another chatbot.</h2>
              <p className="text-lg text-gray-400">NotaryOS doesn&apos;t give you one AI&apos;s opinion. It shows you how multiple AIs reason&mdash;and proves it.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="hidden sm:block glass-card rounded-2xl overflow-hidden">
              <table className="w-full comparison-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 font-medium py-4 px-6">Capability</th>
                    <th className="text-center text-violet-400 font-semibold py-4 px-4">NotaryOS Decision Plane</th>
                    <th className="text-center text-gray-500 font-medium py-4 px-4">Single-Model AI</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i}>
                      <td className="text-gray-300 py-3 px-6">{row.feature}</td>
                      <td className="text-center py-3 px-4">
                        {row.notary === 'check' ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto" /> : <span className="text-green-400 font-medium">{row.notary}</span>}
                      </td>
                      <td className="text-center py-3 px-4">
                        {row.traditional === 'dash' ? <span className="text-gray-600">&mdash;</span> : <span className="text-gray-500">{row.traditional}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div variants={staggerContainer} className="sm:hidden space-y-3">
              {comparisonRows.map((row, i) => (
                <motion.div key={i} variants={fadeInUp} className="glass-card rounded-lg p-4">
                  <p className="text-white font-medium text-sm mb-2">{row.feature}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400 flex items-center gap-1">
                      {row.notary === 'check' ? <CheckCircle className="w-3.5 h-3.5" /> : row.notary}
                      <span className="text-gray-500 ml-1">NotaryOS</span>
                    </span>
                    <span className="text-gray-600">{row.traditional === 'dash' ? '\u2014' : row.traditional}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  6. TARGET AUDIENCE                                              */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for people who make high-stakes decisions.</h2>
            </motion.div>

            <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8">
              <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover">
                <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6 text-violet-400" /></div>
                <h3 className="text-lg font-semibold text-white mb-4">Analysts &amp; Traders</h3>
                <ul className="space-y-3">
                  {['Multi-model consensus on market calls', 'See which AI flagged risks others missed', 'Cryptographic audit trail for every decision'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>{item}</span></li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4"><Code className="w-6 h-6 text-cyan-400" /></div>
                <h3 className="text-lg font-semibold text-white mb-4">Product &amp; Engineering</h3>
                <ul className="space-y-3">
                  {['Architecture decisions with 4-model analysis', 'Compare reasoning depth across AI providers', 'Integrate via API — decisions as a service'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>{item}</span></li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4"><Scale className="w-6 h-6 text-amber-400" /></div>
                <h3 className="text-lg font-semibold text-white mb-4">Enterprise &amp; Compliance</h3>
                <ul className="space-y-3">
                  {['Decision governance with cryptographic proof', 'Counterfactual receipts for regulatory audits', 'Exportable provenance chains for disputes'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>{item}</span></li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  7. HOW IT WORKS (4-column)                                      */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-gray-800/20 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How the Decision Plane works</h2>
              <p className="text-lg text-gray-400">From prompt to provenance-sealed decision in seconds.</p>
            </motion.div>

            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] h-px">
                <div className="w-full h-full bg-gradient-to-r from-violet-500/30 via-cyan-500/30 to-violet-500/30" />
              </div>
              <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                <StepCard step={1} title="You ask a question" description="Enter any prompt — investment analysis, architecture decision, legal review, strategic planning." icon={<Search className="w-6 h-6 text-violet-400" />} />
                <StepCard step={2} title="Models reason in parallel" description="DeepSeek, Gemini, Sonnet, and Kimi analyze your prompt simultaneously with full reasoning chains." icon={<Layers className="w-6 h-6 text-violet-400" />} />
                <StepCard step={3} title="Synthesis reveals consensus" description="The Master Synthesizer weighs each model's analysis, identifies agreement, divergence, and blind spots." icon={<GitMerge className="w-6 h-6 text-violet-400" />} />
                <StepCard step={4} title="Decision sealed with proof" description="Every reasoning node and the final synthesis sealed with Ed25519 signatures. Verifiable, tamper-proof." icon={<Shield className="w-6 h-6 text-violet-400" />} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  8. USE CASES                                                    */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Decisions that matter deserve more than one opinion.</h2>
            </motion.div>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-2 gap-6">
              <UseCaseCard icon={<TrendingUp className="w-5 h-5 text-cyan-400" />} title="Investment analysis" description="Should you buy, hold, or sell? See consensus across 4 models with confidence scores and risk flags." />
              <UseCaseCard icon={<Scale className="w-5 h-5 text-cyan-400" />} title="Legal &amp; compliance review" description="Get multi-perspective analysis on contracts, regulations, and risk — with cryptographic proof of the reasoning." />
              <UseCaseCard icon={<Code className="w-5 h-5 text-cyan-400" />} title="Architecture decisions" description="Monolith vs microservices? Which database? Let 4 AI models debate the trade-offs before you commit." />
              <UseCaseCard icon={<Target className="w-5 h-5 text-cyan-400" />} title="Strategic planning" description="Market entry, pricing strategy, competitive positioning — synthesized intelligence from multiple reasoning engines." />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  9. DECISION ENGINE                                              */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-violet-900/5 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="glass rounded-2xl relative overflow-hidden p-8 lg:p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-medium text-violet-300 bg-violet-500/10 px-3 py-1 rounded-full">Powered by the ATS Protocol</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 mt-4">
                    The only decision engine with{' '}
                    <span className="gradient-text">cryptographic provenance.</span>
                  </h2>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Every reasoning step, every model weight, every synthesis node sealed with Ed25519 signatures
                    and chained into a verifiable provenance DAG. Not just transparency&mdash;mathematical proof.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { value: '4 AIs', label: 'Reasoning in parallel' },
                      { value: '<15ms', label: 'Receipt sealing latency' },
                      { value: '6', label: 'Synthesizer presets' },
                      { value: 'Ed25519', label: 'Cryptographic signatures' },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 rounded-lg glass-card">
                        <div className="text-2xl font-bold stat-number">{stat.value}</div>
                        <div className="text-xs text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mb-6">
                    General, OSINT, Trading, Real Estate, Legal, and Custom synthesizer presets.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Link href="/forge" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg text-sm font-medium transition-all btn-shine">Try the Forge <ArrowRight className="w-4 h-4" /></Link>
                    <Link href="/docs" className="btn-ghost flex items-center gap-2 text-sm">See the Docs</Link>
                  </div>
                </div>

                <div className="code-window rounded-xl overflow-hidden">
                  <div className="code-header flex items-center gap-2 px-4 py-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="ml-2 text-xs text-gray-500 font-mono">decision_plane.py</span>
                  </div>
                  <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto leading-relaxed">
                    <code>{`import httpx

# Run multi-model reasoning
resp = httpx.post(
    "https://api.notaryos.org/v1/forge/run",
    headers={"X-API-Key": "notary_live_..."},
    json={
        "prompt": "Evaluate NVDA as a long position",
        "models": ["chatgpt", "sonnet", "gemini", "kimi"],
        "synthesizer": "trading",
        "stream": False,
    },
)

result = resp.json()
print(result["assessment"])       # Synthesized analysis
print(result["model_weights"])    # Per-model confidence
print(result["provenance_chain"]) # Cryptographic proof
# Every reasoning node: Ed25519 sealed`}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  10. PRICING PREVIEW                                             */}
      {/* ================================================================ */}
      <section id="pricing" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
              <p className="text-lg text-gray-400">Start free. Scale your decision intelligence as you grow.</p>
            </motion.div>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingTiers.map((tier) => <PricingTier key={tier.name} {...tier} />)}
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center mt-8">
              <Link href="/pricing" className="text-violet-400 hover:text-violet-300 text-sm font-medium inline-flex items-center gap-1">
                See full pricing details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  11. AI MODELS                                                   */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-gray-800/20 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center">
            <motion.div variants={fadeInUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 glass-card rounded-full text-sm text-violet-300 mb-4">
                <Brain className="w-3.5 h-3.5" /> Four reasoning engines
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">The best AIs reasoning together</h2>
            </motion.div>
            <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
              {agents.map((agent) => <ModelCard key={agent.name} {...agent} />)}
            </motion.div>
            <motion.p variants={fadeInUp} className="text-sm text-gray-400 max-w-2xl mx-auto">
              Each model brings a different reasoning style. DeepSeek for deep chain-of-thought reasoning. Sonnet for precise logic.
              Gemini for broad research. Kimi for pattern detection.
              The Master Synthesizer weighs them all.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  12. CTA                                                         */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 cta-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Stop asking one AI. Start seeing the whole picture.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8">
              The AI Decision Plane. Multi-model reasoning with cryptographic provenance. Free to start.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex justify-center gap-4 mb-8">
              <Link href="/sign-up" className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg font-medium transition-all btn-shine">
                Try the Decision Plane <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/forge"
                className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
              >
                <Brain className="w-5 h-5" /> Open the Forge
              </Link>
            </motion.div>
            <motion.p variants={fadeInUp} className="text-sm text-gray-500">
              Enterprise needs? <Link href="/pricing" className="text-violet-400 hover:text-violet-300">View pricing</Link> or <Link href="/docs" className="text-violet-400 hover:text-violet-300">read the docs</Link>.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  13. FOOTER                                                      */}
      {/* ================================================================ */}
      <footer className="footer-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/forge" className="text-gray-400 hover:text-white transition-colors">Reasoning Forge</Link></li>
                <li><Link href="/verify" className="text-gray-400 hover:text-white transition-colors">Verifier</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/history" className="text-gray-400 hover:text-white transition-colors">Decision History</Link></li>
                <li><Link href="/api-keys" className="text-gray-400 hover:text-white transition-colors">API Keys</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api-docs" className="text-gray-400 hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><a href="https://api.agenttownsquare.com/v1/notary/status" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Security</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs#security" className="text-gray-400 hover:text-white transition-colors">Security Practices</Link></li>
                <li><a href="mailto:security@notaryos.org" className="text-gray-400 hover:text-white transition-colors">Responsible Disclosure</a></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/sign-up" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/sign-in" className="text-gray-400 hover:text-white transition-colors">Log In</Link></li>
              </ul>
            </div>
          </div>
          <div className="section-divider mb-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-400 text-sm font-medium">NotaryOS</span>
            </div>
            <p className="text-gray-500 text-sm text-center sm:text-right">
              &copy; {new Date().getFullYear()} NotaryOS. AI Decision Plane with cryptographic provenance.
            </p>
            {/* Protocol genesis marker — do not remove */}
            <span
              aria-hidden="true"
              data-notaryos-origin="harris-abbaali-2025"
              style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}
            >
              NotaryOS — Created by Harris Abbaali. The term &quot;counterfactual receipts&quot; was coined by Harris Abbaali
              to describe cryptographic proof of non-action in AI agent systems. All rights reserved under BUSL-1.1.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
