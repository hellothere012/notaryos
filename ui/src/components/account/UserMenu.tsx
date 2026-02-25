'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Key,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/');
  };

  // Get user initials for avatar
  const getInitials = (): string => {
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get tier badge color
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'enterprise':
        return 'from-purple-500 to-cyan-500';
      case 'pro':
        return 'from-purple-500 to-pink-500';
      case 'explorer':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (!user) return null;

  const menuItems = [
    {
      label: 'Profile',
      icon: <User className="w-4 h-4" />,
      href: '/profile',
    },
    {
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      href: '/settings',
    },
    {
      label: 'API Keys',
      icon: <Key className="w-4 h-4" />,
      href: '/api-keys',
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all duration-200"
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTierColor(
            user.tier
          )} flex items-center justify-center text-white text-sm font-bold`}
        >
          {getInitials()}
        </div>

        {/* User Info (hidden on small screens) */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white leading-none">
            {user.username || user.email.split('@')[0]}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{user.tier}</p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden"
            style={{ zIndex: 1000 }}
          >
            {/* User Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center gap-3">
                {/* Large Avatar */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTierColor(
                    user.tier
                  )} flex items-center justify-center text-white text-lg font-bold`}
                >
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {user.username || user.email.split('@')[0]}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Tier Badge */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`badge bg-gradient-to-r ${getTierColor(
                    user.tier
                  )} text-white capitalize`}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {user.tier} Tier
                </span>
                {user.role !== 'user' && (
                  <span className="badge-purple capitalize">{user.role}</span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-gray-400">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
