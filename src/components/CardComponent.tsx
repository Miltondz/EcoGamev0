// src/components/CardComponent.tsx

import React, { useState } from 'react';
import type { Card as CardType } from '../engine/types';

interface CardProps {
    card: CardType;
    // Style prop for motion component
    style?: React.CSSProperties;
}

export const CardComponent: React.FC<CardProps> = ({ 
    card,
    ...motionProps
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    const imagePath = `/images/decks/default/${card.imageFile}`;
    
    const handleImageLoad = () => {
        console.log(`✅ CardComponent: Imagen cargada - ${imagePath}`);
        setImageLoaded(true);
        setImageError(false);
    };
    
    const handleImageError = () => {
        console.error(`❌ CardComponent: Error cargando imagen - ${imagePath}`);
        setImageLoaded(false);
        setImageError(true);
    };

    return (
        <div 
            id={`card-container-${card.id}`}
            className="card"
            {...motionProps}
            style={{
                border: imageError ? '2px solid red' : imageLoaded ? '2px solid green' : '2px solid yellow',
                ...(motionProps.style || {})
            }}
        >
            {imageError ? (
                <div className="card-error" style={{
                    width: '100%',
                    height: '100%',
                    background: '#2a2a2a',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff6b6b',
                    fontSize: '12px',
                    textAlign: 'center',
                    padding: '10px'
                }}>
                    <div>❌</div>
                    <div>{card.rank}{card.suit[0]}</div>
                    <div style={{fontSize: '8px', marginTop: '5px'}}>Image Error</div>
                </div>
            ) : (
                <>
                    <img 
                        src={imagePath} 
                        alt={`Card ${card.rank} of ${card.suit}`}
                        className="card-image"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{
                            display: imageLoaded ? 'block' : 'none'
                        }}
                    />
                    {!imageLoaded && (
                        <div className="card-loading" style={{
                            width: '100%',
                            height: '100%',
                            background: '#3a3a3a',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffd700',
                            fontSize: '12px'
                        }}>
                            <div>⏳</div>
                            <div>{card.rank}{card.suit[0]}</div>
                        </div>
                    )}
                </>
            )}
            {card.value > 0 && <div className="card-power-indicator">{card.value}</div>}
        </div>
    );
};
