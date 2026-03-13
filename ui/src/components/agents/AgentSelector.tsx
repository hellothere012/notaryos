'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { AgentInfo } from './types';

interface Props {
  agents: AgentInfo[];
  selected: string | null;
  onSelect: (agentId: string) => void;
}

export const AgentSelector: React.FC<Props> = ({ agents, selected, onSelect }) => {
  const current = agents.find(a => a.agentId === selected);

  return (
    <div className="relative">
      <select
        value={selected || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 pr-8 text-sm text-white font-medium focus:outline-none focus:border-purple-500/50 cursor-pointer"
      >
        {agents.map((agent) => (
          <option key={agent.agentId} value={agent.agentId}>
            {agent.agentName} ({agent.tier})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};
