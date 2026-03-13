'use client';

import React from 'react';
import { Loader2, Shield } from 'lucide-react';
import { PermissionToggle } from '../shared/PermissionToggle';
import type { PermissionCategoryGroup, PermissionLevel } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  communication: 'COMMUNICATION',
  filesystem: 'FILE SYSTEM',
  web_api: 'WEB & API',
  financial: 'FINANCIAL',
};

const CATEGORY_ICONS: Record<string, string> = {
  communication: '\u2709\uFE0F',
  filesystem: '\uD83D\uDCC1',
  web_api: '\uD83C\uDF10',
  financial: '\uD83D\uDCB3',
};

interface Props {
  permissions: PermissionCategoryGroup[];
  isLoading: boolean;
  onUpdate: (category: string, name: string, level: PermissionLevel) => void;
}

export const PermissionsTab: React.FC<Props> = ({ permissions, isLoading, onUpdate }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Policy note */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-6">
        <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <div>
          <div className="text-sm text-white font-medium">
            Permission changes are sealed as receipts
          </div>
          <div className="text-[11px] text-gray-400">
            Every change creates a verifiable audit trail
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {permissions.map((cat) => (
          <div key={cat.category}>
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-3 font-mono flex items-center gap-2">
              <span>{CATEGORY_ICONS[cat.category] || ''}</span>
              {CATEGORY_LABELS[cat.category] || cat.category}
            </div>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/40 border border-gray-700/50"
                >
                  <div>
                    <div className="text-sm text-white font-medium">{item.name}</div>
                  </div>
                  <PermissionToggle
                    level={item.level}
                    onChange={(level) => onUpdate(cat.category, item.name, level)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
