/**
 * DocsPage - NotaryOS Documentation & Quickstart Guide
 *
 * A full-screen documentation page with sticky sidebar navigation,
 * syntax-highlighted code blocks with copy buttons, language tabs,
 * and Intersection Observer-driven active section tracking.
 *
 * Design: Dark theme (bg-gray-950, purple/cyan gradients), Framer Motion
 * animations matching LandingPage/AboutPage patterns. Uses its own
 * full-screen layout (no AppHeader/Sidebar from the app shell).
 *
 * Sections: Quickstart, API Reference, Counterfactual Receipts, SDKs, Self-Hosting
 *
 * Documentation page for NotaryOS
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Copy,
  Check,
  BookOpen,
  Code,
  Terminal,
  Package,
  Server,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
  Lock,
  Eye,
  EyeOff,
  FileCheck,
  Layers,
  Github,
  Hash,
  Clock,
  ShieldCheck,
} from 'lucide-react';

// ============================================================================
// ANIMATION VARIANTS
// Consistent with LandingPage and AboutPage patterns
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// ============================================================================
// TYPES
// ============================================================================

/** Sidebar navigation section definition */
interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

/** Language option for tabbed code blocks */
type Language = 'python' | 'typescript' | 'go' | 'bash' | 'json' | 'yaml';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = 'https://api.agenttownsquare.com';

/** Sidebar navigation entries - each maps to a content section via anchor id */
const NAV_SECTIONS: NavSection[] = [
  { id: 'quickstart', label: 'Quickstart', icon: <Zap className="w-4 h-4" /> },
  { id: 'api', label: 'API Reference', icon: <Code className="w-4 h-4" /> },
  { id: 'counterfactuals', label: 'Counterfactuals', icon: <EyeOff className="w-4 h-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Layers className="w-4 h-4" /> },
  { id: 'sdks', label: 'SDKs', icon: <Package className="w-4 h-4" /> },
  { id: 'self-hosting', label: 'Self-Hosting', icon: <Server className="w-4 h-4" /> },
];

// ============================================================================
// ANIMATED BACKGROUND
// Matches the AboutPage mesh background pattern
// ============================================================================

const DocsBackground: React.FC = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gray-950" />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
      style={{
        background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
        top: '5%',
        left: '60%',
      }}
      animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04]"
      style={{
        background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
        bottom: '10%',
        left: '20%',
      }}
      animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
      transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

// ============================================================================
// CODE BLOCK COMPONENT
// Renders a styled code block with a copy-to-clipboard button and
// optional filename label. Uses Fira Code monospace (loaded globally).
// ============================================================================

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative rounded-xl bg-gray-900 border border-gray-800 overflow-hidden my-4 group">
      {/* Header bar with terminal dots and optional filename */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 border-b border-gray-800">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        {filename && (
          <span className="ml-2 text-xs text-gray-500 font-mono">{filename}</span>
        )}
        {language && !filename && (
          <span className="ml-2 text-xs text-gray-500 font-mono uppercase">{language}</span>
        )}

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="ml-auto p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-gray-300 font-mono" style={{ fontFamily: '"Fira Code", monospace' }}>
          {code}
        </code>
      </pre>
    </div>
  );
};

// ============================================================================
// TABBED CODE BLOCK
// Renders multiple language tabs with a shared code display area.
// Used for Quickstart and SDK examples.
// ============================================================================

interface TabbedCodeProps {
  tabs: { label: string; language: Language; code: string; filename?: string }[];
}

const TabbedCode: React.FC<TabbedCodeProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeCode = tabs[activeTab];

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeCode.code]);

  return (
    <div className="relative rounded-xl bg-gray-900 border border-gray-800 overflow-hidden my-4">
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-800 bg-gray-800/60">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            className={`relative px-4 py-2.5 text-xs font-medium transition-colors ${
              idx === activeTab
                ? 'text-purple-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {idx === activeTab && (
              <motion.div
                layoutId="docs-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="ml-auto mr-3 p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-all"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code content with smooth crossfade */}
      <AnimatePresence mode="wait">
        <motion.pre
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="p-4 overflow-x-auto text-sm leading-relaxed"
        >
          <code className="text-gray-300 font-mono" style={{ fontFamily: '"Fira Code", monospace' }}>
            {activeCode.code}
          </code>
        </motion.pre>
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// API ENDPOINT ROW
// Displays a single API endpoint inside the reference table.
// ============================================================================

interface EndpointRowProps {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
}

const EndpointRow: React.FC<EndpointRowProps> = ({ method, path, description, auth }) => {
  const methodColors: Record<string, string> = {
    GET: 'text-green-400 bg-green-500/10',
    POST: 'text-blue-400 bg-blue-500/10',
    PUT: 'text-yellow-400 bg-yellow-500/10',
    DELETE: 'text-red-400 bg-red-500/10',
  };

  return (
    <tr className="border-b border-gray-800/50 last:border-0">
      <td className="py-3 pr-3">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${methodColors[method] || 'text-gray-400'}`}>
          {method}
        </span>
      </td>
      <td className="py-3 pr-3">
        <code className="text-sm text-purple-300 font-mono">{path}</code>
      </td>
      <td className="py-3 pr-3 text-sm text-gray-400">{description}</td>
      <td className="py-3 text-center">
        {auth ? (
          <Lock className="w-3.5 h-3.5 text-yellow-500 inline-block" />
        ) : (
          <span className="text-xs text-gray-600">Public</span>
        )}
      </td>
    </tr>
  );
};

// ============================================================================
// SEAL LEVEL CARD
// Used in the Counterfactual Receipts section to display seal tiers.
// ============================================================================

interface SealLevelProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SealLevel: React.FC<SealLevelProps> = ({ title, description, icon, color }) => (
  <div className={`p-4 rounded-xl border ${color} flex items-start gap-3`}>
    <div className="flex-shrink-0 mt-0.5">{icon}</div>
    <div>
      <h4 className="text-white font-medium text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

// ============================================================================
// MAIN DOCS PAGE COMPONENT
// ============================================================================

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('quickstart');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // --------------------------------------------------------------------------
  // Intersection Observer: track which section is currently in view
  // to highlight the corresponding sidebar link.
  // --------------------------------------------------------------------------
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section anchor targets
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        sectionRefs.current[id] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  // --------------------------------------------------------------------------
  // Smooth-scroll to a section when the user clicks a sidebar link
  // --------------------------------------------------------------------------
  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // --------------------------------------------------------------------------
  // Memoize the quickstart code tabs to avoid recreating on every render
  // --------------------------------------------------------------------------
  const quickstartInstall = useMemo(() => [
    { label: 'Python', language: 'bash' as Language, code: 'pip install notaryos' },
    { label: 'TypeScript', language: 'bash' as Language, code: 'npm install @notaryos/sdk' },
    { label: 'Go', language: 'bash' as Language, code: 'go get github.com/notaryos/notaryos-go' },
  ], []);

  const quickstartInit = useMemo(() => [
    {
      label: 'Python',
      language: 'python' as Language,
      code: `from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_sk_...")`,
      filename: 'main.py',
    },
    {
      label: 'TypeScript',
      language: 'typescript' as Language,
      code: `import { NotaryClient } from '@notaryos/sdk';

const notary = new NotaryClient({ apiKey: 'notary_live_sk_...' });`,
      filename: 'index.ts',
    },
  ], []);

  const quickstartSeal = useMemo(() => [
    {
      label: 'Python',
      language: 'python' as Language,
      code: `receipt = notary.seal(
    action="payment.processed",
    agent_id="billing-agent-01",
    payload={
        "amount": 49.99,
        "currency": "USD",
        "customer_id": "cust_abc123"
    }
)

print(receipt.hash)       # "sha256:a1b2c3d4..."
print(receipt.signature)  # "ed25519:SGVsbG8g..."
print(receipt.valid)      # True`,
      filename: 'seal_example.py',
    },
    {
      label: 'TypeScript',
      language: 'typescript' as Language,
      code: `const receipt = await notary.seal({
  action: 'payment.processed',
  agentId: 'billing-agent-01',
  payload: {
    amount: 49.99,
    currency: 'USD',
    customerId: 'cust_abc123',
  },
});

console.log(receipt.hash);       // "sha256:a1b2c3d4..."
console.log(receipt.signature);  // "ed25519:SGVsbG8g..."
console.log(receipt.valid);      // true`,
      filename: 'seal-example.ts',
    },
  ], []);

  const quickstartVerify = useMemo(() => [
    {
      label: 'Python',
      language: 'python' as Language,
      code: `result = notary.verify(receipt.hash)

assert result.valid           # True
print(result.signer_id)       # "notary-v1-ed25519"
print(result.chain_position)  # 42`,
      filename: 'verify_example.py',
    },
    {
      label: 'TypeScript',
      language: 'typescript' as Language,
      code: `const result = await notary.verify(receipt.hash);

console.log(result.valid);          // true
console.log(result.signerId);       // "notary-v1-ed25519"
console.log(result.chainPosition);  // 42`,
      filename: 'verify-example.ts',
    },
  ], []);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen relative" style={{ scrollBehavior: 'smooth' }}>
      <DocsBackground />

      {/* ================================================================== */}
      {/* TOP NAVIGATION BAR                                                 */}
      {/* ================================================================== */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">NotaryOS</span>
              <span className="text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 font-mono">
                docs
              </span>
            </Link>

            {/* Top-level nav links */}
            <div className="hidden md:flex items-center gap-5">
              <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                About
              </Link>
              <Link to="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">
                Pricing
              </Link>
              <span className="text-white text-sm font-medium">Docs</span>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/notaryos/notaryos"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <Link
                to="/verify"
                className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2"
              >
                Try Demo
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* HERO SECTION                                                       */}
      {/* ================================================================== */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Developer Documentation
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
            >
              NotaryOS Documentation
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-400 leading-relaxed max-w-2xl"
            >
              Cryptographic receipts for AI agent actions. Issue, verify, and chain
              receipts in three lines of code.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* MAIN LAYOUT: SIDEBAR + CONTENT                                     */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex gap-10">

          {/* -------------------------------------------------------------- */}
          {/* STICKY SIDEBAR NAV                                             */}
          {/* -------------------------------------------------------------- */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <nav className="sticky top-20 space-y-1">
              {NAV_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeSection === section.id
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {/* Active indicator pill - Framer Motion layoutId for smooth sliding */}
                  {activeSection === section.id && (
                    <motion.div
                      layoutId="docs-sidebar-active"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border border-purple-500/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    {section.icon}
                    {section.label}
                  </span>
                </button>
              ))}

              {/* Quick links */}
              <div className="pt-6 mt-6 border-t border-gray-800/50 space-y-2">
                <a
                  href="https://github.com/notaryos/notaryos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repository
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <Link
                  to="/pricing"
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Pricing Plans
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </Link>
              </div>
            </nav>
          </aside>

          {/* -------------------------------------------------------------- */}
          {/* CONTENT AREA                                                   */}
          {/* -------------------------------------------------------------- */}
          <main className="flex-1 min-w-0 max-w-3xl">

            {/* ============================================================ */}
            {/* SECTION 1: QUICKSTART                                        */}
            {/* ============================================================ */}
            <section id="quickstart" className="scroll-mt-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-2xl font-bold text-white mb-2 flex items-center gap-3"
                >
                  <Zap className="w-6 h-6 text-yellow-400" />
                  Quickstart
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-gray-400 mb-8">
                  Go from zero to a verified receipt in under 60 seconds.
                </motion.p>

                {/* Step 1: Install */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <h3 className="text-lg font-semibold text-white">Install the SDK</h3>
                  </div>
                  <TabbedCode tabs={quickstartInstall} />
                </motion.div>

                {/* Step 2: Initialize */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-white">Initialize with your API key</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 ml-10">
                    Get your API key from the{' '}
                    <Link to="/api-keys" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                      API Keys dashboard
                    </Link>
                    . Starter tier includes 100 receipts/month.
                  </p>
                  <TabbedCode tabs={quickstartInit} />
                </motion.div>

                {/* Step 3: Seal */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <h3 className="text-lg font-semibold text-white">Issue a receipt (seal)</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 ml-10">
                    Call <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">seal()</code> whenever
                    your agent performs an action. The receipt is Ed25519-signed, timestamped,
                    and linked to the previous receipt in the agent's hash chain.
                  </p>
                  <TabbedCode tabs={quickstartSeal} />
                </motion.div>

                {/* Step 4: Verify */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      4
                    </div>
                    <h3 className="text-lg font-semibold text-white">Verify a receipt</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 ml-10">
                    Verification is public. No API key required. Anyone with the receipt
                    hash can confirm it is authentic, untampered, and correctly chained.
                  </p>
                  <TabbedCode tabs={quickstartVerify} />
                </motion.div>

                {/* Success callout */}
                <motion.div
                  variants={fadeInUp}
                  className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3"
                >
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-300 font-medium text-sm mb-1">You are set up.</p>
                    <p className="text-xs text-gray-400">
                      Every receipt is now Ed25519-signed, hash-chained, and third-party verifiable.
                      Explore the API reference below for advanced usage.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </section>

            {/* Divider */}
            <hr className="border-gray-800/50 my-16" />

            {/* ============================================================ */}
            {/* SECTION 2: API REFERENCE                                     */}
            {/* ============================================================ */}
            <section id="api" className="scroll-mt-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-2xl font-bold text-white mb-2 flex items-center gap-3"
                >
                  <Code className="w-6 h-6 text-cyan-400" />
                  API Reference
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-gray-400 mb-3">
                  Base URL: <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">{API_BASE}</code>
                </motion.p>
                <motion.p variants={fadeInUp} className="text-sm text-gray-500 mb-8">
                  All authenticated endpoints require a Bearer token in the Authorization header.
                  Verification endpoints are public and require no authentication.
                </motion.p>

                {/* Endpoints table */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-xl bg-gray-900/60 border border-gray-800 overflow-hidden mb-10"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                          <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Auth</th>
                        </tr>
                      </thead>
                      <tbody>
                        <EndpointRow
                          method="POST"
                          path="/v1/notary/seal"
                          description="Issue a new cryptographic receipt"
                          auth
                        />
                        <EndpointRow
                          method="POST"
                          path="/v1/notary/verify"
                          description="Verify a receipt by hash or full JSON"
                        />
                        <EndpointRow
                          method="GET"
                          path="/v1/notary/r/:hash"
                          description="Public receipt lookup by hash"
                        />
                        <EndpointRow
                          method="GET"
                          path="/v1/notary/history"
                          description="Paginated verification history"
                          auth
                        />
                        <EndpointRow
                          method="GET"
                          path="/v1/notary/status"
                          description="Service health and signer info"
                        />
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                {/* POST /v1/notary/seal example */}
                <motion.div variants={fadeInUp} className="mb-10">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">POST</span>
                    /v1/notary/seal
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Creates a signed receipt for an agent action. Returns the receipt with
                    its hash, signature, chain position, and timestamp.
                  </p>

                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Request Body</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "action": "payment.processed",
  "agent_id": "billing-agent-01",
  "payload": {
    "amount": 49.99,
    "currency": "USD",
    "customer_id": "cust_abc123"
  },
  "metadata": {
    "idempotency_key": "txn_20260212_001"
  }
}`}
                  />

                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 mt-6">Response (201 Created)</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "receipt_hash": "sha256:a1b2c3d4e5f6...",
  "signature": "ed25519:SGVsbG8gV29ybGQ...",
  "signer_id": "notary-v1-ed25519",
  "signed_at": "2026-02-12T10:30:00.000Z",
  "action": "payment.processed",
  "agent_id": "billing-agent-01",
  "chain": {
    "previous_hash": "sha256:f6e5d4c3b2a1...",
    "sequence_number": 42
  },
  "valid": true
}`}
                  />
                </motion.div>

                {/* POST /v1/notary/verify example */}
                <motion.div variants={fadeInUp} className="mb-10">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">POST</span>
                    /v1/notary/verify
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Verify a receipt. Accepts either a receipt hash string or a full receipt
                    JSON object. No authentication required.
                  </p>

                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Request Body</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "receipt_hash": "sha256:a1b2c3d4e5f6..."
}`}
                  />

                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 mt-6">Response (200 OK)</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "valid": true,
  "signer_id": "notary-v1-ed25519",
  "signed_at": "2026-02-12T10:30:00.000Z",
  "chain_position": 42,
  "chain_valid": true,
  "checks": {
    "signature": "pass",
    "timestamp": "pass",
    "chain_linkage": "pass",
    "format": "pass"
  }
}`}
                  />
                </motion.div>

                {/* GET /v1/notary/r/:hash */}
                <motion.div variants={fadeInUp} className="mb-10">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">GET</span>
                    /v1/notary/r/:hash
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Public receipt lookup. Returns the full receipt for any valid hash.
                    Use this to build shareable receipt verification links.
                  </p>
                  <CodeBlock
                    language="bash"
                    code={`curl ${API_BASE}/v1/notary/r/sha256:a1b2c3d4e5f6...`}
                    filename="terminal"
                  />
                </motion.div>

                {/* Authentication note */}
                <motion.div
                  variants={fadeInUp}
                  className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3"
                >
                  <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium text-sm mb-1">Authentication</p>
                    <p className="text-xs text-gray-400">
                      Authenticated endpoints require a Bearer token:{' '}
                      <code className="text-purple-300 bg-purple-500/10 px-1 py-0.5 rounded">
                        Authorization: Bearer notary_live_sk_...
                      </code>
                      . Generate keys from the{' '}
                      <Link to="/api-keys" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                        API Keys page
                      </Link>.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </section>

            {/* Divider */}
            <hr className="border-gray-800/50 my-16" />

            {/* ============================================================ */}
            {/* SECTION 3: COUNTERFACTUAL RECEIPTS                           */}
            {/* ============================================================ */}
            <section id="counterfactuals" className="scroll-mt-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-2xl font-bold text-white mb-2 flex items-center gap-3"
                >
                  <EyeOff className="w-6 h-6 text-purple-400" />
                  Counterfactual Receipts
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-gray-400 mb-8">
                  Prove an agent <em>could</em> have acted but <em>chose</em> not to.
                  This is essential for regulated industries where proof of restraint
                  is as important as proof of action.
                </motion.p>

                {/* Three proofs */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Three Cryptographic Proofs</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">Capability</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Proves the agent had the permissions and resources required to perform the action.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">Opportunity</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Proves the action was available at the time. Timestamp, state context, and trigger conditions are recorded.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                        <Eye className="w-5 h-5 text-green-400" />
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">Decision</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Records the agent's deliberate choice not to act, with the reasoning provided.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Seal levels */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Seal Levels</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Receipts can be sealed at different trust levels, each providing
                    increasing assurance guarantees.
                  </p>
                  <div className="space-y-3">
                    <SealLevel
                      icon={<FileCheck className="w-5 h-5 text-purple-400" />}
                      title="Self-Inked"
                      description="The agent signs its own receipt. Suitable for internal audit trails where the agent is trusted."
                      color="bg-purple-500/10 border-purple-500/20"
                    />
                    <SealLevel
                      icon={<Layers className="w-5 h-5 text-cyan-400" />}
                      title="Counter-Sealed"
                      description="A second agent or service co-signs the receipt. Provides mutual attestation and is the default for production workflows."
                      color="bg-cyan-500/10 border-cyan-500/20"
                    />
                    <SealLevel
                      icon={<Lock className="w-5 h-5 text-yellow-400" />}
                      title="Oracle-Bound"
                      description="An external oracle (timestamp authority, blockchain anchor, or trusted third party) provides an independent attestation. Maximum assurance for compliance-critical actions."
                      color="bg-yellow-500/10 border-yellow-500/20"
                    />
                  </div>
                </motion.div>

                {/* Commit-Reveal Protocol */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">Commit-Reveal Protocol</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Counterfactual receipts use a two-phase commit-reveal protocol to prevent
                    after-the-fact fabrication.
                  </p>

                  <div className="space-y-4 ml-2">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Commit Phase</p>
                        <p className="text-xs text-gray-400">
                          The agent publishes a hash of its decision <em>before</em> the outcome is known.
                          This locks in the decision without revealing it.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center text-cyan-300 text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Reveal Phase</p>
                        <p className="text-xs text-gray-400">
                          After the decision window closes, the agent reveals the original data.
                          Anyone can verify the reveal matches the commitment hash.
                        </p>
                      </div>
                    </div>
                  </div>

                  <CodeBlock
                    language="python"
                    filename="counterfactual.py"
                    code={`# Phase 1: Commit the decision
commitment = notary.commit(
    action="trade.execute",
    agent_id="trading-bot-01",
    decision="decline",
    reason="Risk threshold exceeded",
    proofs={
        "capability": capability_proof,
        "opportunity": opportunity_proof,
        "decision": decision_proof,
    }
)

# Phase 2: Reveal after the window closes
receipt = notary.reveal(commitment.id)
print(receipt.counterfactual)  # True
print(receipt.proofs)          # All three proofs attached`}
                  />
                </motion.div>
              </motion.div>
            </section>

            {/* Divider */}
            <hr className="border-gray-800/50 my-16" />

            {/* ============================================================ */}
            {/* SECTION 4: INTEGRATIONS (OpenClaw featured)                  */}
            {/* ============================================================ */}
            <section id="integrations" className="scroll-mt-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-2xl font-bold text-white mb-2 flex items-center gap-3"
                >
                  <Layers className="w-6 h-6 text-orange-400" />
                  Integrations
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-gray-400 mb-8">
                  Add cryptographic accountability to your existing agent framework
                  in minutes. NotaryOS works with any agent system that makes API calls.
                </motion.p>

                {/* OpenClaw Featured Integration */}
                <motion.div
                  variants={fadeInUp}
                  className="mb-10 p-6 rounded-2xl bg-gradient-to-br from-orange-900/20 to-purple-900/10 border border-orange-500/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-400 text-lg font-bold">🦞</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        OpenClaw
                        <span className="text-xs font-medium text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">Featured</span>
                      </h3>
                      <p className="text-xs text-gray-400">145K+ GitHub stars &middot; Autonomous AI agent framework</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                    OpenClaw agents execute shell commands, manage files, send emails,
                    and browse the web autonomously. NotaryOS adds the missing accountability
                    layer&mdash;every action gets a cryptographic receipt that proves <em>what</em> happened,
                    <em> when</em>, and <em>in what order</em>.
                  </p>

                  <div className="grid sm:grid-cols-3 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                      <p className="text-white text-sm font-medium mb-1">Audit every action</p>
                      <p className="text-xs text-gray-400">Tamper-proof logs for file changes, API calls, and shell commands</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                      <p className="text-white text-sm font-medium mb-1">Chain integrity</p>
                      <p className="text-xs text-gray-400">Hash-linked receipts detect if any action is inserted or deleted</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                      <p className="text-white text-sm font-medium mb-1">Security teams</p>
                      <p className="text-xs text-gray-400">Verify agent behavior without trusting OpenClaw&apos;s own logs</p>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">OpenClaw AgentSkill &mdash; 3 lines to integrate</p>
                  <CodeBlock
                    language="python"
                    filename="skills/notary_seal.py"
                    code={`from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_sk_...")

async def notary_seal(action: str, payload: dict) -> dict:
    """OpenClaw AgentSkill: Seal every agent action with a cryptographic receipt."""
    receipt = notary.seal(
        action=action,
        agent_id="openclaw-agent",
        payload=payload
    )
    return {"receipt_hash": receipt.hash, "valid": receipt.valid}

# Register as an OpenClaw skill
SKILL_NAME = "notary_seal"
SKILL_DESCRIPTION = "Create a tamper-proof receipt for any agent action"
SKILL_HANDLER = notary_seal`}
                  />

                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 mt-6">Verify what your OpenClaw agent did</p>
                  <CodeBlock
                    language="python"
                    filename="verify_openclaw_actions.py"
                    code={`from notaryos import NotaryClient

notary = NotaryClient()  # No API key needed for verification

# Get the receipt hash from OpenClaw's action log
receipt_hash = "sha256:a1b2c3d4e5f6..."

# Verify — works offline, no trust in OpenClaw required
result = notary.verify(receipt_hash)

print(result.valid)           # True — cryptographically verified
print(result.chain_position)  # 47 — position in the agent's action chain
print(result.checks)          # {"signature": "pass", "chain": "pass", "timestamp": "pass"}

# If someone tampered with the logs:
# result.valid = False
# result.checks["chain_linkage"] = "fail — hash mismatch"`}
                  />

                  <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-300 font-medium text-sm mb-1">Why this matters</p>
                      <p className="text-xs text-gray-400">
                        Security researchers have flagged OpenClaw's autonomous capabilities as high-risk.
                        NotaryOS receipts give security teams independent, cryptographic proof of every
                        action&mdash;without relying on the agent's own logs.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Other integrations grid */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Works with any agent framework</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <h4 className="text-white font-medium text-sm mb-1">LangChain / LangGraph</h4>
                      <p className="text-xs text-gray-400">Add seal() as a tool in your agent's toolkit. Every chain step gets a receipt.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <h4 className="text-white font-medium text-sm mb-1">CrewAI</h4>
                      <p className="text-xs text-gray-400">Wrap crew task callbacks with NotaryOS. Audit multi-agent crew workflows.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <h4 className="text-white font-medium text-sm mb-1">AutoGen</h4>
                      <p className="text-xs text-gray-400">Seal conversation turns and function calls between AutoGen agents.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <h4 className="text-white font-medium text-sm mb-1">Custom A2A / MCP</h4>
                      <p className="text-xs text-gray-400">Use the REST API or SDKs directly. 3 lines of code, any language.</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </section>

            {/* Divider */}
            <hr className="border-gray-800/50 my-16" />

            {/* ============================================================ */}
            {/* SECTION 5: SDKs                                              */}
            {/* ============================================================ */}
            <section id="sdks" className="scroll-mt-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-2xl font-bold text-white mb-2 flex items-center gap-3"
                >
                  <Package className="w-6 h-6 text-green-400" />
                  SDKs
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-gray-400 mb-8">
                  Official SDKs for Python, TypeScript, and Go. Zero external dependencies.
                  Install and integrate in under a minute.
                </motion.p>

                {/* Python SDK */}
                <motion.div variants={fadeInUp} className="mb-10">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-yellow-400" />
                    Python
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Requires Python 3.8+. Async-first with synchronous wrappers.
                  </p>
                  <CodeBlock
                    language="bash"
                    filename="terminal"
                    code="pip install notaryos"
                  />
                  <CodeBlock
                    language="python"
                    filename="example.py"
                    code={`from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_sk_...")

# Seal an action
receipt = notary.seal(
    action="data.exported",
    agent_id="export-agent",
    payload={"rows": 15000, "format": "csv"}
)

# Verify by hash (no auth needed)
result = notary.verify(receipt.hash)
assert result.valid

# List recent receipts
history = notary.history(agent_id="export-agent", limit=10)
for r in history:
    print(f"{r.action} @ {r.signed_at} -> {r.hash[:16]}...")`}
                  />
                </motion.div>

                {/* TypeScript SDK */}
                <motion.div variants={fadeInUp} className="mb-10">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    TypeScript
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Works in Node.js 18+ and modern browsers. Ships with full type definitions.
                  </p>
                  <CodeBlock
                    language="bash"
                    filename="terminal"
                    code="npm install @notaryos/sdk"
                  />
                  <CodeBlock
                    language="typescript"
                    filename="example.ts"
                    code={`import { NotaryClient } from '@notaryos/sdk';

const notary = new NotaryClient({ apiKey: 'notary_live_sk_...' });

// Seal an action
const receipt = await notary.seal({
  action: 'email.sent',
  agentId: 'comms-agent',
  payload: {
    to: 'user@example.com',
    subject: 'Your order has shipped',
  },
});

// Verify anywhere (no API key required)
const result = await notary.verify(receipt.hash);
console.log(result.checks); // { signature: 'pass', ... }`}
                  />
                </motion.div>

                {/* Go SDK */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Go
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Requires Go 1.21+. Context-aware with built-in retries.
                  </p>
                  <CodeBlock
                    language="bash"
                    filename="terminal"
                    code="go get github.com/notaryos/notaryos-go"
                  />
                  <CodeBlock
                    language="go"
                    filename="main.go"
                    code={`package main

import (
    "context"
    "fmt"
    "log"

    notary "github.com/notaryos/notaryos-go"
)

func main() {
    client, err := notary.NewClient("notary_live_sk_...", nil)
    if err != nil {
        log.Fatal(err)
    }

    // Seal an action
    receipt, err := client.Seal(context.Background(), &notary.SealRequest{
        Action:  "deployment.completed",
        AgentID: "deploy-agent",
        Payload: map[string]any{
            "version": "2.1.0",
            "env":     "production",
        },
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Receipt: %s\\n", receipt.Hash)

    // Verify (no auth required)
    result, _ := client.Verify(context.Background(), receipt.Hash)
    fmt.Printf("Valid: %v\\n", result.Valid)
}`}
                  />
                </motion.div>
              </motion.div>
            </section>

            {/* Divider */}
            <hr className="border-gray-800/50 my-16" />

            {/* ============================================================ */}
            {/* SECTION 5: SELF-HOSTING                                      */}
            {/* ============================================================ */}
            <section id="self-hosting" className="scroll-mt-20">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-2xl font-bold text-white mb-2 flex items-center gap-3"
                >
                  <Server className="w-6 h-6 text-orange-400" />
                  Self-Hosting
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-gray-400 mb-8">
                  Run NotaryOS in your own infrastructure for full control, air-gapped
                  environments, or data residency requirements.
                </motion.p>

                {/* Docker Compose */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">Docker Compose</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    The fastest way to self-host. Requires Docker and Docker Compose.
                  </p>
                  <CodeBlock
                    language="yaml"
                    filename="docker-compose.yml"
                    code={`version: "3.8"

services:
  notary-api:
    image: notaryos/notary-api:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://notary:secret@postgres:5432/notary
      - REDIS_URL=redis://redis:6379/0
      - NOTARY_SIGNING_KEY=\${NOTARY_SIGNING_KEY}
      - JWT_SECRET_KEY=\${JWT_SECRET_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: notary
      POSTGRES_USER: notary
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:`}
                  />
                </motion.div>

                {/* Environment variables */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">Environment Variables</h3>
                  <div className="rounded-xl bg-gray-900/60 border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          <tr className="border-b border-gray-800/50">
                            <td className="py-2.5 px-4"><code className="text-purple-300 text-xs font-mono">DATABASE_URL</code></td>
                            <td className="py-2.5 px-4 text-green-400 text-xs">Yes</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">PostgreSQL connection string</td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-2.5 px-4"><code className="text-purple-300 text-xs font-mono">REDIS_URL</code></td>
                            <td className="py-2.5 px-4 text-green-400 text-xs">Yes</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">Redis connection string for caching and rate limiting</td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-2.5 px-4"><code className="text-purple-300 text-xs font-mono">NOTARY_SIGNING_KEY</code></td>
                            <td className="py-2.5 px-4 text-green-400 text-xs">Yes</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">Ed25519 private key (base64-encoded) for receipt signing</td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-2.5 px-4"><code className="text-purple-300 text-xs font-mono">JWT_SECRET_KEY</code></td>
                            <td className="py-2.5 px-4 text-green-400 text-xs">Yes</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">Secret key for JWT token signing (min 32 chars)</td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-2.5 px-4"><code className="text-purple-300 text-xs font-mono">CORS_ORIGINS</code></td>
                            <td className="py-2.5 px-4 text-gray-500 text-xs">No</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">Comma-separated allowed origins (default: none)</td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-2.5 px-4"><code className="text-purple-300 text-xs font-mono">LOG_LEVEL</code></td>
                            <td className="py-2.5 px-4 text-gray-500 text-xs">No</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">Logging verbosity: debug, info, warning, error (default: info)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4"><code className="text-purple-300 text-xs font-mono">KEY_ROTATION_DAYS</code></td>
                            <td className="py-2.5 px-4 text-gray-500 text-xs">No</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">Auto-rotate signing key every N days (default: disabled)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>

                {/* Quick start commands */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">Running</h3>
                  <CodeBlock
                    language="bash"
                    filename="terminal"
                    code={`# Generate a signing key
openssl genpkey -algorithm ed25519 | base64 -w0 > signing_key.txt
export NOTARY_SIGNING_KEY=$(cat signing_key.txt)

# Generate JWT secret
export JWT_SECRET_KEY=$(openssl rand -hex 32)

# Start services
docker compose up -d

# Verify it's running
curl http://localhost:8000/v1/notary/status
# {"status":"healthy","signer_id":"notary-v1-ed25519","version":"1.0.0"}`}
                  />
                </motion.div>

                {/* Hosted alternative */}
                <motion.div
                  variants={fadeInUp}
                  className="p-5 rounded-xl bg-gradient-to-r from-purple-900/20 to-cyan-900/10 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm mb-1">
                      Prefer not to self-host?
                    </p>
                    <p className="text-xs text-gray-400">
                      Use our managed service at{' '}
                      <code className="text-purple-300 bg-purple-500/10 px-1 py-0.5 rounded">{API_BASE}</code>{' '}
                      with a free tier of 100 receipts/month. No infrastructure to manage.
                    </p>
                  </div>
                  <Link
                    to="/signup"
                    className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2 whitespace-nowrap"
                  >
                    Get Started Free
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              </motion.div>
            </section>

            {/* ============================================================ */}
            {/* FOOTER CTA                                                   */}
            {/* ============================================================ */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mt-20 pt-12 border-t border-gray-800/50 text-center"
            >
              <h3 className="text-xl font-bold text-white mb-3">
                Ready to get started?
              </h3>
              <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
                Create your free account and issue your first cryptographic receipt
                in under a minute. No credit card required.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/verify"
                  className="flex items-center gap-2 px-6 py-2.5 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg text-sm font-medium transition-all"
                >
                  Try the Demo
                </Link>
              </div>

              {/* Footer links */}
              <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-gray-600">
                <Link to="/" className="hover:text-gray-400 transition-colors">Home</Link>
                <Link to="/about" className="hover:text-gray-400 transition-colors">About</Link>
                <Link to="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
                <a
                  href="https://github.com/notaryos/notaryos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-400 transition-colors flex items-center gap-1"
                >
                  GitHub <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 mt-8">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-600">NotaryOS</span>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
