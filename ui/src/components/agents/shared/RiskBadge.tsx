'use client';

import React from 'react';
import type { RiskLevel } from '../types';

const RISK_STYLES: Record<RiskLevel, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => (
  <span
    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${RISK_STYLES[risk] || RISK_STYLES.medium}`}
  >
    {risk}
  </span>
);
