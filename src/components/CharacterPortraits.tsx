// src/components/CharacterPortraits.tsx

import React, { useEffect, useState, useRef } from 'react';
import { assetManager } from '../engine/AssetManager';
import { uiPositionManager } from '../engine/UIPositionManager';
import { ecoStateSystem, type EcoState, type EcoStateConfig } from '../engine/EcoStateSystem';
import { heroStateSystem, type HeroState, type HeroStateConfig } from '../engine/HeroStateSystem';
import { gameStateManager } from '../engine/GameStateManager';

interface PortraitProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PlayerPortrait: React.FC<PortraitProps> = ({ 
  width = '180px', 
  height = '350px', 
  className = '',
  style = {}
}) => {
  const [portraitSrc, setPortraitSrc] = useState<string>('');
  const [currentState, setCurrentState] = useState<HeroState>('healthy');
  const [stateConfig, setStateConfig] = useState<HeroStateConfig>(heroStateSystem.getCurrentConfig());

  // Subscribirse a cambios de estado del héroe
  useEffect(() => {
    const unsubscribe = heroStateSystem.subscribe((newState: HeroState, config: HeroStateConfig) => {
      console.log(`🧑 PlayerPortrait: Estado cambió a '${newState}'`);
      setCurrentState(newState);
      setStateConfig(config);
      
      // Cargar nueva imagen del estado
      loadHeroImage(config.imagePath);
    });

    return unsubscribe;
  }, []);

  // Función para cargar imagen del héroe
  const loadHeroImage = async (imagePath: string) => {
    try {
      const fallbackSvg = imagePath.replace('.png', '.svg');
      const result = await assetManager.loadImage(imagePath, fallbackSvg);

      if (result.loaded) {
        const cachedImage = assetManager.getCachedImage(imagePath) ||
                          assetManager.getCachedImage(fallbackSvg);
        
        if (cachedImage) {
          setPortraitSrc(cachedImage.src);
          console.log(`✅ PlayerPortrait: Loaded ${currentState} state successfully`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ PlayerPortrait: Failed to load ${currentState} state, keeping current image`);
    }
  };

  // Carga inicial
  useEffect(() => {
    const initialConfig = heroStateSystem.getCurrentConfig();
    loadHeroImage(initialConfig.imagePath);
  }, []);

  if (portraitSrc) {
    return (
      <img
        src={portraitSrc}
        alt="Player"
        className={className}
        style={{
          width,
          height,
          objectFit: 'contain',
          border: '2px solid rgba(217, 119, 6, 0.3)',
          borderRadius: '8px',
          ...style
        }}
      />
    );
  }

  // Fallback con información del estado del héroe
  const getHeroStateColor = (state: HeroState) => {
    switch (state) {
      case 'healthy': return 'rgba(34, 197, 94, 0.3)'; // Verde
      case 'tired': return 'rgba(249, 115, 22, 0.3)';   // Naranja
      case 'wounded': return 'rgba(239, 68, 68, 0.3)';  // Rojo
      case 'stressed': return 'rgba(168, 85, 247, 0.3)'; // Púrpura
      case 'critical': return 'rgba(220, 38, 38, 0.4)'; // Rojo intenso
      case 'dying': return 'rgba(75, 85, 99, 0.5)';     // Gris oscuro
      default: return 'rgba(146, 64, 14, 0.3)';
    }
  };
  
  const getHeroStateEmoji = (state: HeroState) => {
    switch (state) {
      case 'healthy': return '😊'; // Sonriente
      case 'tired': return '😅';   // Sudando
      case 'wounded': return '🤕'; // Vendado
      case 'stressed': return '😖'; // Confundido
      case 'critical': return '🥴'; // Woozy
      case 'dying': return '💀';   // Calavera
      default: return '👤';
    }
  };
  
  return (
    <div 
      className={className}
      style={{
        width,
        height,
        borderRadius: '8px',
        backgroundColor: getHeroStateColor(currentState),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
        border: '2px solid rgba(217, 119, 6, 0.3)',
        position: 'relative',
        ...style
      }}
      title={stateConfig.description} // Tooltip con descripción
    >
      <div style={{ marginBottom: '8px' }}>{getHeroStateEmoji(currentState)}</div>
      <div style={{ 
        fontSize: '10px', 
        color: 'rgba(255,255,255,0.9)', 
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        {currentState.toUpperCase()}
      </div>
      
      {/* Debug info en desarrollo */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '4px',
          fontSize: '8px',
          color: 'rgba(255,255,255,0.6)',
          background: 'rgba(0,0,0,0.5)',
          padding: '2px 4px',
          borderRadius: '2px',
          lineHeight: '1.2'
        }}>
          PV: {Math.round((gameStateManager.pv / gameStateManager.maxPV) * 100)}%<br/>
          San: {Math.round((gameStateManager.sanity / gameStateManager.maxSanity) * 100)}%
        </div>
      )}
    </div>
  );
};

export const EcoPortrait: React.FC<PortraitProps> = ({ 
  width = '180px', 
  height = '350px', 
  className = '',
  style = {}
}) => {
  const [ecoSrc, setEcoSrc] = useState<string>('');
  const [currentState, setCurrentState] = useState<EcoState>('vigilante');
  const [stateConfig, setStateConfig] = useState<EcoStateConfig | null>(ecoStateSystem.getCurrentConfig());
  const ecoRef = useRef<HTMLDivElement>(null);

  // Registrar posición del ECO para efectos VFX
  useEffect(() => {
    if (ecoRef.current) {
      const rect = ecoRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      uiPositionManager.register('eco', {
        x: centerX,
        y: centerY,
        width: rect.width,
        height: rect.height
      });
      
      console.log(`🎯 EcoPortrait: Registered position at`, centerX, centerY);
    }
  }, [ecoSrc]); // Re-register when image loads

  // Subscribirse a cambios de estado del ECO
  useEffect(() => {
    const unsubscribe = ecoStateSystem.subscribe((newState: EcoState, config: EcoStateConfig) => {
      console.log(`🎭 EcoPortrait: Estado cambió a '${newState}'`);
      setCurrentState(newState);
      setStateConfig(config);
      
      // Cargar nueva imagen del estado
      loadEcoImage(config.imagePath);
    });

    return unsubscribe;
  }, []);

  // Función para cargar imagen del ECO
  const loadEcoImage = async (imagePath: string) => {
    try {
      const fallbackSvg = imagePath.replace('.png', '.svg');
      const result = await assetManager.loadImage(imagePath, fallbackSvg);

      if (result.loaded) {
        const cachedImage = assetManager.getCachedImage(imagePath) ||
                          assetManager.getCachedImage(fallbackSvg);
        
        if (cachedImage) {
          setEcoSrc(cachedImage.src);
          console.log(`✅ EcoPortrait: Loaded ${currentState} state successfully`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ EcoPortrait: Failed to load ${currentState} state, keeping current image`);
    }
  };

  // Carga inicial
  useEffect(() => {
    const initialConfig = ecoStateSystem.getCurrentConfig();
    if (initialConfig) {
      loadEcoImage(initialConfig.imagePath);
    }
  }, []);

  if (ecoSrc) {
    return (
      <div ref={ecoRef}>
        <img
          src={ecoSrc}
          alt="Eco"
          className={className}
          style={{
            width,
            height,
            objectFit: 'contain',
            border: '2px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            ...style
          }}
        />
      </div>
    );
  }

  // Fallback con información del estado
  const getStateColor = (state: EcoState) => {
    switch (state) {
      case 'vigilante': return 'rgba(185, 28, 28, 0.3)';
      case 'aggressive': return 'rgba(239, 68, 68, 0.4)';
      case 'wounded': return 'rgba(220, 38, 38, 0.5)';
      case 'desperate': return 'rgba(153, 27, 27, 0.6)';
      case 'defeated': return 'rgba(75, 85, 99, 0.4)';
      default: return 'rgba(185, 28, 28, 0.3)';
    }
  };
  
  const getStateEmoji = (state: EcoState) => {
    switch (state) {
      case 'vigilante': return '👹';
      case 'aggressive': return '😡';
      case 'wounded': return '🤕';
      case 'desperate': return '🔥';
      case 'defeated': return '☠️';
      default: return '👹';
    }
  };
  
  return (
    <div 
      ref={ecoRef}
      className={className}
      style={{
        width,
        height,
        borderRadius: '8px',
        backgroundColor: getStateColor(currentState),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
        border: `2px solid rgba(220, 38, 38, 0.3)`,
        position: 'relative',
        ...style
      }}
      title={stateConfig?.description || 'Eco Status'} // Tooltip con descripción
    >
      <div style={{ marginBottom: '8px' }}>{getStateEmoji(currentState)}</div>
      <div style={{ 
        fontSize: '10px', 
        color: 'rgba(255,255,255,0.8)', 
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        {currentState.toUpperCase()}
      </div>
      
      {/* Debug info en desarrollo */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          fontSize: '8px',
          color: 'rgba(255,255,255,0.6)',
          background: 'rgba(0,0,0,0.5)',
          padding: '2px 4px',
          borderRadius: '2px'
        }}>
          {Math.round((gameStateManager.ecoHp / gameStateManager.maxEcoHp) * 100)}%
        </div>
      )}
    </div>
  );
};
