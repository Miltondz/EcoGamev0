// src/components/GameLayout.tsx

import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
  playerHP?: number;
  playerMaxHP?: number;
  playerCorruption?: number;
  playerAP?: number;
  playerMaxAP?: number;
  playerHandSize?: number;
  ecoHP?: number;
  ecoMaxHP?: number;
  ecoHandSize?: number;
  ecoState?: string;
  currentTurn?: number;
  currentPhase?: string;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ 
  children
}) => {
  return (
    <div className="game-container fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Background atmospheric layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Atmospheric overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      
      {/* Children content overlay */}
      {children}
    </div>
  );
};
