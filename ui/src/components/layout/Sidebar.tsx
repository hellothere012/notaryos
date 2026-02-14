'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  History,
  Key,
  Settings,
  User,
  Shield,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  requiredRole?: string;
}

const navItems: NavItem[] = [
  {
    path: '/verify',
    label: 'Verify',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    path: '/history',
    label: 'History',
    icon: <History className="w-5 h-5" />,
    requiresAuth: true,
  },
  {
    path: '/api-keys',
    label: 'API Keys',
    icon: <Key className="w-5 h-5" />,
    requiresAuth: true,
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" />,
    requiresAuth: true,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    requiresAuth: true,
  },
  {
    path: '/admin',
    label: 'Admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
    requiresAuth: true,
    requiredRole: 'admin',
  },
];

export const Sidebar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiredRole && user?.role !== item.requiredRole) return false;
    return true;
  });

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-gray-900/50 border-r border-gray-800 p-4">
      {/* Brand Section */}
      <div className="mb-8 px-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Notary</h2>
            <p className="text-xs text-gray-500">Verification System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-white bg-purple-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-1 h-8 bg-purple-500 rounded-r-full"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <span className={isActive ? 'text-purple-400' : ''}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-800">
        <div className="px-3 py-2 text-xs text-gray-500">
          <p>NotaryOS v1.0</p>
          <p className="mt-1">
            <a
              href="https://docs.agenttownsquare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              Documentation
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
};
