import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900/50 border-t border-gray-800 py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Brand */}
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-sm">
              NotaryOS - Cryptographic Receipt Verification
            </span>
          </div>

          {/* Center - Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/docs"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Docs
            </Link>
            <a
              href="https://api.agenttownsquare.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              API
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms
            </Link>
          </div>

          {/* Right - Copyright */}
          <div className="text-sm text-gray-500">
            &copy; {currentYear} NotaryOS. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
