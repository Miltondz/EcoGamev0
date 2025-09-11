// src/components/EnhancedHUD.tsx

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  FaHeart, 
  FaBrain, 
  FaBolt, 
  FaCog, 
  FaBroadcastTower, 
  FaLungs, 
  FaRocket,
  FaEye,
  FaSkull,
  FaFire
} from 'react-icons/fa';
import { gameStateManager, GamePhase } from '../engine/GameStateManager';
import { ecoAI } from '../engine/EcoAI';
import { nodeSystem } from '../engine/NodeSystem';
import { textStyles, colors } from '../utils/styles';

export const EnhancedHUD: React.FC = () => {
  const pvBarRef = useRef<HTMLDivElement>(null);
  const corBarRef = useRef<HTMLDivElement>(null);
  const ecoBarRef = useRef<HTMLDivElement>(null);

  // Animate health/sanity bars when values change
  useEffect(() => {
    if (pvBarRef.current) {
      const percentage = (gameStateManager.pv / 20) * 100;
      gsap.to(pvBarRef.current, {
        width: `${percentage}%`,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, [gameStateManager.pv]);

  useEffect(() => {
    if (corBarRef.current) {
      const percentage = (gameStateManager.sanity / 20) * 100;
      gsap.to(corBarRef.current, {
        width: `${percentage}%`,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, [gameStateManager.sanity]);

  useEffect(() => {
    if (ecoBarRef.current) {
      const percentage = (gameStateManager.ecoHp / gameStateManager.maxEcoHp) * 100;
      gsap.to(ecoBarRef.current, {
        width: `${percentage}%`,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, [gameStateManager.ecoHp]);

  // Helper function to get node icon
  const getNodeIcon = (nodeId: string) => {
    switch (nodeId) {
      case 'reactor': return FaCog;
      case 'communications': return FaBroadcastTower;
      case 'life_support': return FaLungs;
      case 'propulsion': return FaRocket;
      default: return FaCog;
    }
  };

  // Helper function to get damage color
  const getDamageColor = (damage: number, maxDamage: number) => {
    const percentage = damage / maxDamage;
    if (percentage === 0) return 'text-green-400 bg-green-500/20';
    if (percentage <= 0.33) return 'text-yellow-400 bg-yellow-500/20';
    if (percentage <= 0.66) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  // Helper function to get Eco phase info
  const getEcoPhaseInfo = (phase: string) => {
    switch (phase) {
      case 'vigilante':
        return { icon: FaEye, color: 'text-blue-400', name: 'VIGILANTE' };
      case 'predador':
        return { icon: FaSkull, color: 'text-orange-400', name: 'PREDADOR' };
      case 'devastador':
        return { icon: FaFire, color: 'text-red-400', name: 'DEVASTADOR' };
      default:
        return { icon: FaEye, color: 'text-blue-400', name: 'VIGILANTE' };
    }
  };

  const ecoPhase = getEcoPhaseInfo(ecoAI.currentPhase);

  return (
    <div className="enhanced-hud w-full h-full flex items-center justify-between px-6 relative">
      
      {/* Left Section: Player Stats */}
      <div className="player-stats flex items-center space-x-6">
        
        {/* Health (PV) */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="stat-group flex items-center space-x-3"
        >
          <div className="stat-icon p-2 bg-red-500/20 rounded-lg border border-red-500/30">
            <FaHeart className="text-red-400 text-xl" />
          </div>
          <div className="stat-info">
            <div style={{ ...textStyles.label, fontSize: '10px', color: colors.mutedAlpha }}>Vida</div>
            <div style={{ ...textStyles.body, fontSize: '18px', fontWeight: 'bold', color: '#fca5a5' }}>
              {gameStateManager.pv}/20
            </div>
            <div className="stat-bar w-16 h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div 
                ref={pvBarRef}
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-800"
                style={{ width: `${(gameStateManager.pv / 20) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Sanity (COR) */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="stat-group flex items-center space-x-3"
        >
          <div className="stat-icon p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <FaBrain className="text-purple-400 text-xl" />
          </div>
          <div className="stat-info">
            <div style={{ ...textStyles.label, fontSize: '10px', color: colors.mutedAlpha }}>Cordura</div>
            <div style={{ ...textStyles.body, fontSize: '18px', fontWeight: 'bold', color: '#c4b5fd' }}>
              {gameStateManager.sanity}/20
            </div>
            <div className="stat-bar w-16 h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div 
                ref={corBarRef}
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-800"
                style={{ width: `${(gameStateManager.sanity / 20) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Action Points (PA) */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="stat-group flex items-center space-x-3"
        >
          <div className="stat-icon p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <FaBolt className="text-yellow-400 text-xl" />
          </div>
          <div className="stat-info">
            <div style={{ ...textStyles.label, fontSize: '10px', color: colors.mutedAlpha }}>PA</div>
            <div style={{ ...textStyles.body, fontSize: '24px', fontWeight: 'bold', color: '#fde047' }}>
              {gameStateManager.pa}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Center Section: Turn/Phase Info */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="turn-info text-center"
      >
        <div className="bg-gradient-to-r from-amber-900/60 to-amber-800/60 px-6 py-3 rounded-lg border border-amber-600/40 shadow-lg">
          <div style={{ ...textStyles.smallTitle, fontSize: '14px', color: '#fcd34d' }}>
            Turno {gameStateManager.turn}
          </div>
          <div style={{ ...textStyles.smallTitle, fontSize: '18px', color: '#fef3c7' }}>
            {GamePhase[gameStateManager.phase].replace('_', ' ')}
          </div>
        </div>
      </motion.div>

      {/* Right Section: Eco Status & Nodes */}
      <div className="eco-section flex items-center space-x-6">
        
        {/* Eco Status */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="eco-status flex items-center space-x-3"
        >
          <div className="eco-info text-right">
            <div style={{ ...textStyles.label, fontSize: '10px', color: colors.mutedAlpha }}>ECO</div>
            <div style={{ ...textStyles.body, fontSize: '18px', fontWeight: 'bold', color: '#fca5a5' }}>
              {gameStateManager.ecoHp}/{gameStateManager.maxEcoHp}
            </div>
            <div className="stat-bar w-20 h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div 
                ref={ecoBarRef}
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-800"
                style={{ width: `${(gameStateManager.ecoHp / gameStateManager.maxEcoHp) * 100}%` }}
              />
            </div>
          </div>
          <div className={`stat-icon p-2 ${ecoPhase.color.replace('text-', 'bg-').replace('400', '500/20')} rounded-lg border ${ecoPhase.color.replace('text-', 'border-').replace('400', '500/30')}`}>
            <ecoPhase.icon className={`${ecoPhase.color} text-xl`} />
          </div>
        </motion.div>

        {/* Phase indicator */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="phase-indicator"
        >
          <div className="text-xs text-gray-400 uppercase tracking-wide">Fase:</div>
          <div className={`text-sm font-bold ${ecoPhase.color}`}>
            {ecoPhase.name}
          </div>
        </motion.div>

        {/* Nodes Grid */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="nodes-grid grid grid-cols-2 gap-2"
        >
          {nodeSystem.allNodes.slice(0, 4).map((node, index) => {
            const IconComponent = getNodeIcon(node.id);
            const damageColor = getDamageColor(node.damage, node.maxDamage);
            
            return (
              <motion.div
                key={node.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                className={`node-status p-2 rounded border transition-all duration-300 ${damageColor.split(' ')[1]} ${damageColor.split(' ')[0]}`}
                title={`${node.name}: ${node.damage}/${node.maxDamage} damage`}
              >
                <div className="flex items-center justify-center">
                  <IconComponent className="text-sm" />
                </div>
                <div className="text-xs mt-1 text-center font-semibold">
                  {node.maxDamage - node.damage}
                </div>
                
                {/* Damage indicators */}
                <div className="flex justify-center mt-1 space-x-0.5">
                  {[...Array(node.maxDamage)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        i < node.damage ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Exposed Eco indicator */}
      {gameStateManager.isEcoExposed && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-full font-bold text-sm animate-pulse"
        >
          ECO EXPUESTO!
        </motion.div>
      )}
    </div>
  );
};
