// src/components/GameLayout.tsx

import React, { useEffect, useState } from 'react';
import { assetManager } from '../engine/AssetManager';
import { Z_INDEX } from '../constants/zIndex';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ 
  children
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [frameBorderImage, setFrameBorderImage] = useState<string>('');
  
  useEffect(() => {
    const loadGameAssets = async () => {
      try {
        const assets = assetManager.getCurrentAssetPaths();
        console.log('🎨 GameLayout: Loading game assets...', {
          background: assets.scenario.backgrounds.main,
          frameBorder: assets.ui.frameBorder
        });
        
        // Load background image with fallback
        try {
          const backgroundResult = await assetManager.loadImage(assets.scenario.backgrounds.main);
          if (backgroundResult.loaded) {
            const cachedImage = assetManager.getCachedImage(assets.scenario.backgrounds.main);
            if (cachedImage) {
              setBackgroundImage(cachedImage.src);
              console.log('✅ GameLayout: Game background loaded successfully');
            }
          } else {
            console.log('🎨 GameLayout: Using fallback gradient background (main image not available)');
          }
        } catch (error) {
          console.log('🎨 GameLayout: Using fallback gradient background (load error)');
        }
        
        // Load frame border image (optional)
        try {
          const frameBorderResult = await assetManager.loadImage(assets.ui.frameBorder);
          if (frameBorderResult.loaded) {
            const cachedBorder = assetManager.getCachedImage(assets.ui.frameBorder);
            if (cachedBorder) {
              setFrameBorderImage(cachedBorder.src);
              console.log('✅ GameLayout: Frame border loaded successfully');
            }
          } else {
            console.log('🖼️ GameLayout: No frame border (optional UI element)');
          }
        } catch (error) {
          console.log('🖼️ GameLayout: No frame border (load error)');
        }
      } catch (error) {
        console.error('❌ GameLayout: Error loading game assets:', error);
      }
    };
    
    loadGameAssets();
  }, []);
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '1280px',
      height: '720px'
    }}>
      
      {/* Background image layer */}
      {backgroundImage && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      
      {/* Fallback background gradient if image doesn't load */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        opacity: backgroundImage ? 0.3 : 1
      }} />
      
      {/* Atmospheric overlay effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)'
      }} />
      
      {/* Children content overlay */}
      {children}
      
      {/* Frame border overlay - debe ir encima de todo */}
      {frameBorderImage && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${frameBorderImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none', // Permitir interacción con elementos debajo
            zIndex: Z_INDEX.FRAME_BORDER // Frame border debe estar en su capa apropiada
          }}
        />
      )}
    </div>
  );
};
