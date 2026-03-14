'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'notaryos-onboarded';

const steps = [
  {
    icon: Shield,
    title: 'Welcome to NotaryOS',
    description:
      'The AI Decision Plane. Run prompts through multiple AI models in parallel, visualize reasoning trees, and seal every decision with cryptographic proof.',
    gradient: 'from-purple-500 to-cyan-500',
  },
  {
    icon: Key,
    title: 'Get Your API Key',
    description:
      'Create an API key to unlock the Forge, issue receipts, and access the full platform.',
    href: '/api-keys',
    cta: 'Create API Key',
    gradient: 'from-cyan-500 to-emerald-500',
  },
  {
    icon: Sparkles,
    title: 'Try the Forge',
    description:
      'Send a prompt to DeepSeek, Gemini, Sonnet, and Kimi simultaneously. Watch them reason in real-time and see where they agree.',
    href: '/forge',
    cta: 'Open the Forge',
    gradient: 'from-amber-500 to-purple-500',
  },
];

export function WelcomeModal() {
  const { user } = useUser();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && dismiss()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl p-8 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-8 bg-purple-500'
                    : i < step
                      ? 'w-4 bg-purple-500/40'
                      : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-white text-center mb-3">
            {current.title}
          </h2>
          <p className="text-sm text-gray-400 text-center leading-relaxed mb-8">
            {current.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Skip
            </button>

            <div className="flex gap-3">
              {current.href && (
                <Link
                  href={current.href}
                  onClick={dismiss}
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
                >
                  {current.cta}
                </Link>
              )}
              <button
                onClick={() => {
                  if (isLast) {
                    dismiss();
                  } else {
                    setStep(step + 1);
                  }
                }}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
              >
                {isLast ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
