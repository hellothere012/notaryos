'use client';

import React from 'react';
import type { PermissionLevel } from '../types';

const LEVELS: PermissionLevel[] = ['never', 'ask', 'allow'];
const LABELS: Record<PermissionLevel, string> = { never: 'NEVER', ask: 'ASK ME', allow: 'ALLOW' };
const ACTIVE_COLORS: Record<PermissionLevel, string> = {
  never: 'bg-red-500/20 text-red-400',
  ask: 'bg-orange-500/20 text-orange-400',
  allow: 'bg-green-500/20 text-green-400',
};

interface Props {
  level: PermissionLevel;
  onChange: (level: PermissionLevel) => void;
}

export const PermissionToggle: React.FC<Props> = ({ level, onChange }) => (
  <div className="flex rounded-lg overflow-hidden border border-gray-700/50">
    {LEVELS.map((l) => (
      <button
        key={l}
        onClick={() => onChange(l)}
        className={`px-3 py-1 text-[10px] font-bold tracking-wider transition-all duration-200 font-mono ${
          level === l ? ACTIVE_COLORS[l] : 'text-gray-600 hover:text-gray-400'
        } ${l !== 'allow' ? 'border-r border-gray-700/50' : ''}`}
      >
        {LABELS[l]}
      </button>
    ))}
  </div>
);
