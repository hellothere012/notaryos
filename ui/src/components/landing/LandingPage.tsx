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
  Eye,
  Code,
  Terminal,
  Server,
  Menu,
  X,
  Copy,
  ArrowRight,
  Sparkles,
  Cpu,
  Network,
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
} from 'lucide-react';

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
  { feature: 'Cryptographic signatures', notary: 'check', traditional: 'dash' },
  { feature: 'Per-agent hash chains', notary: 'check', traditional: 'dash' },
  { feature: 'Tamper detection', notary: 'Automatic', traditional: 'Manual audit' },
  { feature: 'Third-party verification', notary: 'Offline capable', traditional: 'Requires access' },
  { feature: 'Proof of non-action', notary: 'check', traditional: 'dash' },
  { feature: 'Provenance tracking', notary: 'DAG-based', traditional: 'Linear or none' },
];

const features = [
  {
    icon: Lock,
    title: 'Per-Agent Hash Chains',
    description: 'Every action is cryptographically linked to the previous one. Tamper with one receipt and the whole chain breaks.',
    badge: 'Tamper detection built in',
    color: 'violet',
  },
  {
    icon: Eye,
    title: 'Counterfactual Receipts',
    description: 'Cryptographic proof that your AI chose not to act. Prove what didn\u2019t happen\u2014not just what did.',
    badge: 'Proof of non-action',
    color: 'cyan',
  },
  {
    icon: Network,
    title: 'Provenance DAG',
    description: 'Track the causal chain across agents, services, and time with directed acyclic graph verification.',
    badge: 'Cascading trust verification',
    color: 'violet',
  },
  {
    icon: CheckCircle2,
    title: 'Third-Party Verifiable',
    description: 'Anyone can verify a receipt without trusting NotaryOS. Zero-trust verification by default.',
    badge: 'Zero-trust by default',
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
    stats: { receipts: '100/mo', verifications: '500/mo', rateLimit: '10/min', keyRotation: 'Manual' },
    features: ['Single agent', 'Community support', 'Public API', 'Basic dashboard'],
    cta: 'Start Free',
  },
  {
    name: 'Explorer',
    price: '$59',
    period: '/month',
    highlight: true,
    badge: 'Most Popular',
    stats: { receipts: '10,000/mo', verifications: '50,000/mo', rateLimit: '100/min', keyRotation: '30 days' },
    features: ['Up to 10 agents', 'Email support', 'Counterfactual receipts', 'Webhook notifications'],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$159',
    period: '/month',
    highlight: false,
    badge: null as string | null,
    stats: { receipts: '100,000/mo', verifications: '500,000/mo', rateLimit: '1,000/min', keyRotation: '7 days' },
    features: ['Unlimited agents', 'Priority support', 'Provenance DAG', 'Custom webhooks', 'SSO'],
    cta: 'Get Started',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    highlight: false,
    badge: null as string | null,
    stats: { receipts: 'Unlimited', verifications: 'Unlimited', rateLimit: 'Custom', keyRotation: 'Auto' },
    features: ['Dedicated infra', 'SLA guarantee', 'Air-gapped deploy', 'Custom integrations', 'Compliance reports'],
    cta: 'Contact Sales',
  },
];

const agents = [
  { name: 'OPUS', role: 'Architecture', gradient: 'from-violet-500 to-purple-600' },
  { name: 'TELE', role: 'Integration', gradient: 'from-blue-500 to-cyan-500' },
  { name: 'KIMI', role: 'Design', gradient: 'from-pink-500 to-rose-500' },
  { name: 'GROK', role: 'Security', gradient: 'from-amber-500 to-orange-500' },
  { name: 'GEMINI', role: 'Optimization', gradient: 'from-green-500 to-emerald-500' },
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
  stats: { receipts: string; verifications: string; rateLimit: string; keyRotation: string };
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
      <div className="flex justify-between text-gray-400"><span>Receipts</span><span className="text-white">{stats.receipts}</span></div>
      <div className="flex justify-between text-gray-400"><span>Verifications</span><span className="text-white">{stats.verifications}</span></div>
      <div className="flex justify-between text-gray-400"><span>Rate limit</span><span className="text-white">{stats.rateLimit}</span></div>
      <div className="flex justify-between text-gray-400"><span>Key rotation</span><span className="text-white">{stats.keyRotation}</span></div>
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

const AgentCard: React.FC<{ name: string; role: string; gradient: string }> = ({ name, role, gradient }) => (
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
    <div className="min-h-screen">
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
                  <Shield className="w-3 h-3" /> Tamper-proof signatures
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 glass-card rounded-full text-xs text-cyan-300">
                  <Eye className="w-3 h-3" /> Counterfactual receipts
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 glass-card rounded-full text-xs text-green-300">
                  <Zap className="w-3 h-3" /> 1,185 receipts/sec
                </span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Cryptographic receipts for{' '}
                <span className="gradient-text">every AI action</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
                NotaryOS seals, chains, and verifies what your agents did&mdash;and what they
                chose <em>not</em> to do. Tamper-proof. Third-party verifiable. Free tier: 100 receipts/month.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-lg font-medium transition-all duration-200 active:scale-95 animate-pulse-glow btn-shine"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => router.push('/verify?sample=true')}
                  className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all"
                >
                  <Shield className="w-5 h-5" /> Verify a Receipt
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:block animate-float"
            >
              <div className="code-window rounded-xl overflow-hidden">
                <div className="code-header flex items-center gap-2 px-4 py-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-gray-500 font-mono">notary_demo.py</span>
                </div>
                <pre className="p-5 text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto">
                  <code>{`from notaryos import NotaryClient

notary = NotaryClient(api_key="sk_live_...")

# Seal an action — tamper-proof receipt
receipt = notary.seal(
    action="trade.executed",
    agent_id="trading-bot-v3",
    payload={"pair": "BTC/USD", "qty": 0.5}
)

# Verify — anyone can, zero trust
result = notary.verify(receipt.hash)
assert result.valid  # True`}</code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  2. VERIFIER CTA                                                 */}
      {/* ================================================================ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="glass-card rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Don&apos;t trust us. Verify the math.</h2>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              Paste any NotaryOS receipt and verify it instantly&mdash;no account required.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/verify" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg font-medium text-sm transition-all btn-shine">
                <Shield className="w-4 h-4" /> Open Verifier
              </Link>
              <Link href="/docs#receipt-spec" className="btn-ghost flex items-center gap-2 text-sm">
                Read the Spec <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  3. COUNTERFACTUAL RECEIPTS                                      */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 glass-card rounded-full text-sm text-violet-300 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> What makes NotaryOS different
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Proof of what your AI chose <span className="gradient-text">not</span> to do
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Counterfactual Receipts&mdash;cryptographic proof that your AI considered an action and deliberately declined it.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gray-500" /> Without NotaryOS
                </h3>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li className="flex items-start gap-2"><span className="text-gray-600">&mdash;</span> No record when an agent <em>doesn&apos;t</em> act</li>
                  <li className="flex items-start gap-2"><span className="text-gray-600">&mdash;</span> &ldquo;It chose not to trade&rdquo; is just a claim</li>
                  <li className="flex items-start gap-2"><span className="text-gray-600">&mdash;</span> Compliance gaps for regulated industries</li>
                  <li className="flex items-start gap-2"><span className="text-gray-600">&mdash;</span> Disputes devolve into trust arguments</li>
                </ul>
              </motion.div>

              <motion.div variants={fadeInUp} className="pricing-highlight rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 icon-glow" /> With NotaryOS
                </h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Sealed receipt proves the agent saw an opportunity</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Cryptographic proof it declined deliberately</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Third-party verifiable without trust</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Exportable evidence for compliance</li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  4. FEATURES (4 cards)                                           */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-gray-800/20 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Trust infrastructure for autonomous agents</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Every action cryptographically sealed. Every decision verifiable.</p>
            </motion.div>

            <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <motion.div key={f.title} variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover group">
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Not another logging tool.</h2>
              <p className="text-lg text-gray-400">NotaryOS provides cryptographic guarantees that traditional logging simply cannot.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="hidden sm:block glass-card rounded-2xl overflow-hidden">
              <table className="w-full comparison-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 font-medium py-4 px-6">Feature</th>
                    <th className="text-center text-violet-400 font-semibold py-4 px-4">NotaryOS</th>
                    <th className="text-center text-gray-500 font-medium py-4 px-4">Traditional Logging</th>
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for teams that take agent trust seriously.</h2>
            </motion.div>

            <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8">
              <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover">
                <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4"><Code className="w-6 h-6 text-violet-400" /></div>
                <h3 className="text-lg font-semibold text-white mb-4">Agent Developers</h3>
                <ul className="space-y-3">
                  {['Add accountability in 3 lines of code', 'Python, TypeScript, and Go SDKs', 'Works with any agent framework'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>{item}</span></li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4"><Server className="w-6 h-6 text-cyan-400" /></div>
                <h3 className="text-lg font-semibold text-white mb-4">Platform Teams</h3>
                <ul className="space-y-3">
                  {['Audit trail for every agent interaction', 'Provenance tracking across microservices', 'Self-hostable for air-gapped environments'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /><span>{item}</span></li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={fadeInUp} className="glass-card rounded-xl p-6 card-hover">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4"><Scale className="w-6 h-6 text-amber-400" /></div>
                <h3 className="text-lg font-semibold text-white mb-4">Compliance &amp; Legal</h3>
                <ul className="space-y-3">
                  {['Counterfactual proofs for regulated industries', 'Exportable verification history', 'Cryptographic evidence for disputes'].map((item, i) => (
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How verification works</h2>
              <p className="text-lg text-gray-400">NotaryOS checks math, not promises.</p>
            </motion.div>

            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] h-px">
                <div className="w-full h-full bg-gradient-to-r from-violet-500/30 via-cyan-500/30 to-violet-500/30" />
              </div>
              <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                <StepCard step={1} title="You provide a receipt" description="Paste JSON or upload a receipt file produced by an agent system." icon={<FileJson className="w-6 h-6 text-violet-400" />} />
                <StepCard step={2} title="Notary parses + normalizes" description="We validate structure, required fields, and canonicalization to ensure signed bytes match." icon={<FileCheck className="w-6 h-6 text-violet-400" />} />
                <StepCard step={3} title="Cryptography is verified" description="The signature is verified using the declared algorithm and signer identity (e.g., Ed25519)." icon={<Key className="w-6 h-6 text-violet-400" />} />
                <StepCard step={4} title="Chain + time checked" description="Chain linkage and timestamp constraints verified, then a readable verdict with full details." icon={<Link2 className="w-6 h-6 text-violet-400" />} />
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for builders, compliance teams, and CISOs</h2>
            </motion.div>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-2 gap-6">
              <UseCaseCard icon={<Users className="w-5 h-5 text-cyan-400" />} title="Multi-agent orchestration" description="Prove which agent produced what\u2014and in what sequence\u2014when workflows span tools and services." />
              <UseCaseCard icon={<AlertTriangle className="w-5 h-5 text-cyan-400" />} title="Incident response" description="Validate whether a suspect agent action receipt is authentic before you trust it in investigations." />
              <UseCaseCard icon={<Terminal className="w-5 h-5 text-cyan-400" />} title="CI / QA verification" description="Fail builds when receipts don&apos;t verify. Treat trust as a testable invariant." />
              <UseCaseCard icon={<FileJson className="w-5 h-5 text-cyan-400" />} title="Compliance &amp; audit trails" description="Export verification history and preserve evidence with cryptographic integrity checks." />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  9. ATS PROTOCOL ENGINE                                          */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-violet-900/5 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="glass rounded-2xl relative overflow-hidden p-8 lg:p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-medium text-violet-300 bg-violet-500/10 px-3 py-1 rounded-full">The Engine Behind NotaryOS</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 mt-4">
                    The only compliance layer that <span className="gradient-text">keeps up with inference speed.</span>
                  </h2>
                  <p className="text-gray-400 mb-6 leading-relaxed">Powered by the ATS Protocol&mdash;a proprietary high-performance agent communication engine with 7-layer zero-trust security.</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { value: '2.39ms', label: 'P50 verification latency' },
                      { value: '1,185', label: 'Receipts per second' },
                      { value: '100%', label: 'Success rate in production' },
                      { value: '7 layers', label: 'Zero-trust security' },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 rounded-lg glass-card">
                        <div className="text-2xl font-bold stat-number">{stat.value}</div>
                        <div className="text-xs text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href="/docs" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg text-sm font-medium transition-all btn-shine">See the Docs <ArrowRight className="w-4 h-4" /></Link>
                    <Link href="/pricing" className="btn-ghost flex items-center gap-2 text-sm">View Pricing</Link>
                  </div>
                </div>

                <div className="code-window rounded-xl overflow-hidden">
                  <div className="code-header flex items-center gap-2 px-4 py-3">
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

      {/* ================================================================ */}
      {/*  10. PRICING PREVIEW                                             */}
      {/* ================================================================ */}
      <section id="pricing" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
              <p className="text-lg text-gray-400">Start free. Scale as you grow. No surprises.</p>
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
      {/*  11. AI COLLABORATION                                            */}
      {/* ================================================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-900 via-gray-800/20 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center">
            <motion.div variants={fadeInUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 glass-card rounded-full text-sm text-violet-300 mb-4">
                <Cpu className="w-3.5 h-3.5" /> Built by agents, for agents
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Multi-Agent Collaboration</h2>
            </motion.div>
            <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
              {agents.map((agent) => <AgentCard key={agent.name} {...agent} />)}
            </motion.div>
            <motion.p variants={fadeInUp} className="text-sm text-gray-400 max-w-2xl mx-auto">
              The first cryptographic receipt system designed through multi-agent collaboration.
              Five specialized AI agents contributed architecture, integration, design, security, and optimization.
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
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">When your AI acts, you have receipts.</motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-8">Start issuing tamper-proof receipts in 5 minutes. Free tier included&mdash;no credit card required.</motion.p>
            <motion.div variants={fadeInUp} className="flex justify-center gap-4 mb-8">
              <Link href="/sign-up" className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg font-medium transition-all btn-shine">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <button onClick={() => router.push('/verify?sample=true')} className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-all">
                <Shield className="w-5 h-5" /> Verify a Receipt
              </button>
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
                <li><Link href="/verify" className="text-gray-400 hover:text-white transition-colors">Verifier</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/history" className="text-gray-400 hover:text-white transition-colors">History</Link></li>
                <li><Link href="/api-keys" className="text-gray-400 hover:text-white transition-colors">API Keys</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Docs</Link></li>
                <li><Link href="/docs#receipt-spec" className="text-gray-400 hover:text-white transition-colors">Receipt Spec</Link></li>
                <li><Link href="/docs#changelog" className="text-gray-400 hover:text-white transition-colors">Changelog</Link></li>
                <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Security</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors">Security Practices</Link></li>
                <li><Link href="/security#disclosure" className="text-gray-400 hover:text-white transition-colors">Responsible Disclosure</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
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
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-400 text-sm font-medium">NotaryOS</span>
            </div>
            <p className="text-gray-500 text-sm text-center sm:text-right">
              &copy; {new Date().getFullYear()} NotaryOS. Cryptographic receipt verification for AI agents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
