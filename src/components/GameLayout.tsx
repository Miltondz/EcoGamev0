// src/components/GameLayout.tsx

import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ 
  children
}) => {
  return (
    <div className="absolute inset-0" style={{ width: '1280px', height: '720px' }}>
      
      {/* Background atmospheric layer for 1280x720 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Atmospheric overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      
      {/* Children content overlay */}
      {children}
    </div>
  );
};
