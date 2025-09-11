// src/components/CardActionButtons.tsx

import React from 'react';
import { assetManager } from '../engine/AssetManager';
import type { Card } from '../engine/types';

interface CardActionButtonsProps {
  card: Card;
  position: { x: number; y: number };
  onAction: (action: 'play' | 'sacrifice' | 'research' | 'discard' | 'cancel') => void;
  isVisible: boolean;
}

export const CardActionButtons: React.FC<CardActionButtonsProps> = ({
  position,
  onAction,
  isVisible
}) => {
  const [buttonImages, setButtonImages] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const loadButtonImages = async () => {
      const actions = ['play', 'sacrifice', 'research', 'discard', 'cancel'];
      const imagePromises = actions.map(async (action) => {
        const path = await assetManager.getCardActionPath(action as 'play' | 'sacrifice' | 'research' | 'discard' | 'cancel');
        return { action, path };
      });
      
      try {
        const results = await Promise.all(imagePromises);
        const imageMap: Record<string, string> = {};
        results.forEach(result => {
          imageMap[result.action] = result.path;
        });
        setButtonImages(imageMap);
      } catch (error) {
        console.error('❌ CardActionButtons: Error loading button images:', error);
      }
    };

    if (isVisible) {
      loadButtonImages();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const buttons = [
    { action: 'play' as const, angle: -90, color: '#22c55e', label: 'Usar' },
    { action: 'research' as const, angle: -45, color: '#3b82f6', label: 'Investigar' },
    { action: 'discard' as const, angle: 0, color: '#6b7280', label: 'Descartar' },
    { action: 'sacrifice' as const, angle: 45, color: '#ef4444', label: 'Sacrificar' },
    { action: 'cancel' as const, angle: 90, color: '#1f2937', label: 'Cancelar' }
  ];

  const radius = 150; // Increased radius for better spacing
  const buttonSize = 70; // Larger buttons for better visibility

  return (
    <div style={{
      position: 'fixed',
      left: position.x,
      top: position.y,
      zIndex: 10000,
      pointerEvents: 'none'
    }}>
      {buttons.map((button) => {
        const angleRad = button.angle * Math.PI / 180; // Direct angle conversion
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;
        
        return (
          <button
            key={button.action}
            style={{
              position: 'absolute',
              left: x - buttonSize / 2,
              top: y - buttonSize / 2,
              width: `${buttonSize}px`,
              height: `${buttonSize}px`,
              borderRadius: '50%',
              border: '3px solid rgba(255, 255, 255, 0.4)',
              background: `linear-gradient(135deg, ${button.color}dd, ${button.color}99)`,
              backgroundImage: buttonImages[button.action] ? `url(${buttonImages[button.action]})` : 'none',
              backgroundSize: '50%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              cursor: 'pointer',
              pointerEvents: 'auto',
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 2px ${button.color}88, inset 0 2px 4px rgba(255, 255, 255, 0.2)`,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: 0.95,
              transform: 'scale(1)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.boxShadow = `0 15px 50px rgba(0, 0, 0, 0.9), 0 0 0 3px ${button.color}cc, inset 0 3px 6px rgba(255, 255, 255, 0.3)`;
              e.currentTarget.style.filter = 'brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '0.95';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 2px ${button.color}88, inset 0 2px 4px rgba(255, 255, 255, 0.2)`;
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onClick={() => onAction(button.action)}
            title={button.label}
          >
            {/* Semi-transparent background circle for better visibility */}
            <div style={{
              position: 'absolute',
              inset: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(2px)'
            }} />
            
            {/* Button content */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!buttonImages[button.action] && (
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
                }}>
                  {button.action === 'play' ? '▶' :
                   button.action === 'research' ? '🔍' :
                   button.action === 'discard' ? '🗑' :
                   button.action === 'sacrifice' ? '⚔' :
                   '✕'}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
