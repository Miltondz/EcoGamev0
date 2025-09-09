// src/components/TempStats.tsx

import React from 'react';
import { gameStateManager } from '../engine/GameStateManager';
import { ecoAI } from '../engine/EcoAI';
import { turnManager } from '../engine/TurnManager';
import { FaHeart, FaBrain, FaBolt, FaSkull, FaPlay } from 'react-icons/fa';

export const TempStats: React.FC = () => {
  return (
    <div className="debug-stats">
      <div style={{ fontSize: '12px', marginBottom: '8px' }}>DEBUG STATS</div>
      <div className="flex items-center space-x-6">
        {/* Player Stats */}
        <div className="flex items-center space-x-3">
          <FaHeart className="text-red-400" />
          <span className="text-red-300 font-bold">{gameStateManager.pv}/20</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <FaBrain className="text-purple-400" />
          <span className="text-purple-300 font-bold">{gameStateManager.sanity}/20</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <FaBolt className="text-yellow-400" />
          <span className="text-yellow-300 font-bold text-xl">{gameStateManager.pa}</span>
        </div>
        
        {/* Eco Stats */}
        <div className="border-l border-amber-700 pl-6 ml-6">
          <div className="flex items-center space-x-3">
            <FaSkull className="text-red-500" />
            <span className="text-red-400 font-bold">{gameStateManager.ecoHp}/50</span>
            <span className="text-red-500 text-sm">({ecoAI.currentPhase})</span>
          </div>
        </div>
        
        {/* Turn Info */}
        <div className="border-l border-amber-700 pl-6 ml-6">
          <div className="text-amber-300 text-sm">
            <div>Turn: {gameStateManager.turn}</div>
            <div>Phase: {gameStateManager.phase}</div>
            <div className="text-yellow-400">Cards: {gameStateManager.hand.length}</div>
            <div className="text-blue-400 text-xs">Deck: {gameStateManager.hand.length > 0 ? 'loaded' : 'empty'}</div>
            <div className="text-green-400 text-xs">VFX: PIXI ACTIVE</div>
          </div>
        </div>
        
        {/* Debug button */}
        <div className="border-l border-amber-700 pl-6 ml-6">
          <button 
            onClick={() => {
              console.log('Debug: Starting game and dealing cards');
              turnManager.startGame();
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
          >
            <FaPlay className="text-xs" />
            <span>Debug Start</span>
          </button>
        </div>
      </div>
    </div>
  );
};
