'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, History, Key, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const mobileNavItems = [
  { path: '/verify', label: 'Verify', icon: ShieldCheck },
  { path: '/history', label: 'History', icon: History, requiresAuth: true },
  { path: '/api-keys', label: 'API Keys', icon: Key, requiresAuth: true },
  { path: '/profile', label: 'Profile', icon: User, requiresAuth: true },
  { path: '/settings', label: 'Settings', icon: Settings, requiresAuth: true },
];

export const MobileNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const visibleItems = mobileNavItems.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
      <div className="flex items-stretch pb-safe">
        {visibleItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-colors ${
                isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 bg-purple-500 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
