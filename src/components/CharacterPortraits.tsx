// src/components/CharacterPortraits.tsx

import React, { useState, useEffect } from 'react';
import { assetManager } from '../engine/AssetManager';

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

  useEffect(() => {
    const loadPlayerPortrait = async () => {
      try {
        const result = await assetManager.loadImage(
          '/images/scenarios/default/characters/player-portrait.png',
          '/images/scenarios/default/characters/player-portrait.svg'
        );

        if (result.loaded) {
          const cachedImage = assetManager.getCachedImage('/images/scenarios/default/characters/player-portrait.png') ||
                            assetManager.getCachedImage('/images/scenarios/default/characters/player-portrait.svg');
          
          if (cachedImage) {
            setPortraitSrc(cachedImage.src);
            console.log('✅ PlayerPortrait: Loaded successfully');
          }
        }
      } catch (error) {
        console.warn('⚠️ PlayerPortrait: Failed to load, using fallback');
      }
    };

    loadPlayerPortrait();
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

  // Fallback
  return (
    <div 
      className={className}
      style={{
        width,
        height,
        borderRadius: '8px',
        backgroundColor: 'rgba(146, 64, 14, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        border: '2px solid rgba(217, 119, 6, 0.3)',
        ...style
      }}
    >
      👤
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

  useEffect(() => {
    const loadEcoPortrait = async () => {
      try {
        // Start with vigilante phase
        const result = await assetManager.loadImage(
          '/images/scenarios/default/eco/eco-vigilante.png',
          '/images/scenarios/default/eco/eco-vigilante.svg'
        );

        if (result.loaded) {
          const cachedImage = assetManager.getCachedImage('/images/scenarios/default/eco/eco-vigilante.png') ||
                            assetManager.getCachedImage('/images/scenarios/default/eco/eco-vigilante.svg');
          
          if (cachedImage) {
            setEcoSrc(cachedImage.src);
            console.log('✅ EcoPortrait: Loaded successfully');
          }
        }
      } catch (error) {
        console.warn('⚠️ EcoPortrait: Failed to load, using fallback');
      }
    };

    loadEcoPortrait();
  }, []);

  if (ecoSrc) {
    return (
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
    );
  }

  // Fallback
  return (
    <div 
      className={className}
      style={{
        width,
        height,
        borderRadius: '8px',
        backgroundColor: 'rgba(185, 28, 28, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        border: '2px solid rgba(220, 38, 38, 0.3)',
        ...style
      }}
    >
      👹
    </div>
  );
};
