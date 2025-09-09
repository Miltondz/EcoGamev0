// src/components/GameLayout.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  return (
    <div className="game-container fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={{ zIndex: 1 }}>
      
      {/* Background atmospheric layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Atmospheric overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      
      {/* Wooden frame border */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-4 pointer-events-none"
      >
        {/* Frame border using CSS - will be replaced with image later */}
        <div className="absolute inset-0 rounded-lg shadow-2xl border-8 border-amber-900/80 bg-gradient-to-r from-amber-900/20 via-transparent to-amber-900/20" 
             style={{
               boxShadow: `
                 inset 0 0 0 2px rgba(180, 83, 9, 0.3),
                 inset 0 0 0 4px rgba(146, 64, 14, 0.2),
                 0 0 50px rgba(0, 0, 0, 0.5)
               `
             }} 
        />
        
        {/* Inner frame details */}
        <div className="absolute inset-2 rounded border-2 border-amber-800/40" />
        
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-12 h-12 border-l-4 border-t-4 border-amber-700/60 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-12 h-12 border-r-4 border-t-4 border-amber-700/60 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-12 h-12 border-l-4 border-b-4 border-amber-700/60 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-12 h-12 border-r-4 border-b-4 border-amber-700/60 rounded-br-lg" />
      </motion.div>

      {/* Game content area with 3-zone layout */}
      <div className="relative z-10 h-full flex flex-col p-8">
        
        {/* Zone 1: HUD Area (Top 20%) - BLUE */}
        <div className="hud-zone h-20 flex-shrink-0 relative bg-blue-500/30 border-2 border-blue-400">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-blue-100 font-bold text-lg">HUD ZONE</span>
          </div>
        </div>

        {/* Zone 2: Central Game Area (50-60%) - GREEN */}
        <div className="central-zone flex-grow flex items-center justify-between px-8 py-6 relative bg-green-500/30 border-2 border-green-400">
          
          {/* Player area (left) - YELLOW */}
          <div className="player-area w-80 h-96 relative bg-yellow-500/30 border-2 border-yellow-400">
            {/* Player portrait placeholder */}
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative w-full h-full"
            >
              {/* Portrait frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-amber-800/60 rounded-lg border-2 border-amber-700/50 shadow-xl">
                <div className="absolute inset-2 rounded border border-amber-600/30" />
              </div>
              
          {/* Portrait placeholder */}
          <div className="absolute inset-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded flex items-center justify-center text-amber-200">
            {/* Will be replaced with player image */}
            <div className="w-24 h-24 rounded-full bg-amber-800/50 flex items-center justify-center text-4xl">👤</div>
          </div>
          
          {/* Player label */}
          <div className="absolute bottom-2 left-2 right-2 text-center bg-black/80 text-amber-200 py-2 px-2 rounded text-lg font-bold border border-amber-700/50">
            SURVIVOR
          </div>
            </motion.div>
          </div>

          {/* Central play area - PURPLE */}
          <div className="play-area flex-grow mx-8 h-full flex flex-col items-center justify-center relative bg-purple-500/30 border-2 border-purple-400">
            {/* Play zone indicator */}
            <div className="w-80 h-96 border-4 border-dashed border-amber-600/70 rounded-xl flex items-center justify-center text-amber-300 text-2xl font-bold bg-black/30 backdrop-blur-sm shadow-xl">
              <div className="text-center">
                <div className="text-amber-400 text-3xl mb-2">⚔️</div>
                <div>PLAY ZONE</div>
                <div className="text-sm text-amber-500/80 mt-1">Drop cards here</div>
              </div>
            </div>
            
            {/* Turn phase indicator */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute top-4 bg-gradient-to-r from-amber-900/90 to-amber-800/90 text-amber-100 px-8 py-3 rounded-full border-2 border-amber-600/70 shadow-xl backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="text-sm opacity-90 font-semibold">TURN 1</div>
                <div className="text-lg font-bold tracking-wide">PLAYER ACTION</div>
              </div>
            </motion.div>
          </div>

          {/* Eco area (right) - RED */}
          <div className="eco-area w-80 h-96 relative bg-red-500/30 border-2 border-red-400">
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="relative w-full h-full"
            >
              {/* Eco frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 to-red-800/60 rounded-lg border-2 border-red-700/50 shadow-xl">
                <div className="absolute inset-2 rounded border border-red-600/30" />
              </div>
              
              {/* Eco placeholder */}
              <div className="absolute inset-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded flex items-center justify-center text-red-300">
                {/* Will be replaced with Eco creature */}
                <div className="w-32 h-32 rounded-full bg-red-800/50 flex items-center justify-center text-6xl animate-pulse">👹</div>
              </div>
              
              {/* Eco status */}
              <div className="absolute top-2 left-2 right-2 text-center bg-black/80 text-red-300 py-2 px-2 rounded text-lg font-bold border border-red-700/50">
                ECO - VIGILANTE
              </div>
              
              {/* HP indicator */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded p-2">
                <div className="text-red-300 text-xs mb-1">HP: 50/50</div>
                <div className="w-full bg-black/60 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full" style={{width: '100%'}} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Zone 3: Hand/Controls Area (Bottom 30%) - ORANGE */}
        <div className="hand-zone h-64 flex-shrink-0 relative bg-orange-500/30 border-2 border-orange-400">
          {/* Zone identifier */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-orange-100 font-bold text-lg">HAND & CONTROLS ZONE</span>
          </div>
          
          {/* Hand area will be positioned here */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Hand cards area */}
            <div className="flex-grow flex items-center justify-center">
              {/* Cards will be rendered here by PixiJS */}
            </div>
            
            {/* Control buttons area */}
            <div className="h-16 flex items-center justify-center space-x-4 pb-4">
              {/* Buttons will be injected here */}
            </div>
          </div>
        </div>
      </div>

      {/* Children content overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
