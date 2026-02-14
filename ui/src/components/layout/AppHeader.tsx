'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LogIn, UserPlus, Menu, X, ChevronDown, BookOpen, Zap, FileCode, Github } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu } from '../account/UserMenu';

export const AppHeader: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [resourcesOpen, setResourcesOpen] = React.useState(false);
  const resourcesRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                NotaryOS
              </h1>
              <p className="text-xs text-gray-500">
                Cryptographic Verification
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/verify"
              className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                isActive('/verify') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Verify
            </Link>
            <Link
              href="/docs"
              className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                isActive('/docs') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                isActive('/pricing') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                isActive('/about') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              About
            </Link>

            {isAuthenticated && (
              <>
                <div className="w-px h-6 bg-gray-700 mx-1" />
                <Link
                  href="/history"
                  className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                    isActive('/history') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  History
                </Link>
                <Link
                  href="/api-keys"
                  className={`px-3 py-2 rounded-lg transition-colors font-medium ${
                    isActive('/api-keys') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  API Keys
                </Link>
              </>
            )}

            {/* GitHub link */}
            <a
              href="https://github.com/hellothere012/notaryos"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              title="View on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            ) : isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => router.push('/sign-in')}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium rounded-lg hover:bg-gray-800/50"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/sign-up')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get Started Free
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-gray-800"
            >
              <nav className="flex flex-col gap-1">
                <Link
                  href="/verify"
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isActive('/verify') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Verify Receipt
                </Link>
                <Link
                  href="/docs"
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isActive('/docs') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <Link
                  href="/pricing"
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isActive('/pricing') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isActive('/about') ? 'text-white bg-purple-500/20' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>

                {isAuthenticated && (
                  <>
                    <div className="h-px bg-gray-800 my-2" />
                    <Link
                      href="/history"
                      className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      History
                    </Link>
                    <Link
                      href="/api-keys"
                      className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      API Keys
                    </Link>
                  </>
                )}

                {!isAuthenticated && (
                  <>
                    <div className="h-px bg-gray-800 my-2" />
                    <Link
                      href="/sign-in"
                      className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/sign-up"
                      className="px-4 py-2.5 text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-semibold text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
