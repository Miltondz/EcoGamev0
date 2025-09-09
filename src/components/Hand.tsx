// src/components/Hand.tsx

import React, { useRef, useEffect } from 'react';
import { gameStateManager } from '../engine/GameStateManager';
import { vfxSystem } from '../engine/VFXSystem';
import { uiPositionManager } from '../engine/UIPositionManager';

interface HandProps {
    // No longer receives card-specific interaction props, as VFX handles them
}

export const Hand: React.FC<HandProps> = () => {
    const handRef = useRef<HTMLDivElement>(null);

    // Register position for UI manager (but don't track rect changes)
    useEffect(() => {
        const updateHandPosition = () => {
            if (handRef.current) {
                const rect = handRef.current.getBoundingClientRect();
                uiPositionManager.register('playerHand', { x: rect.left, y: rect.top });
            }
        };
        updateHandPosition();
    }, []);

    useEffect(() => {
        const cardsInHand = gameStateManager.hand;
        const numCards = cardsInHand.length;
        console.log('🃏 Hand: Processing', numCards, 'cards in hand - triggered by hand change');
        
        if (numCards === 0) {
            console.log('🃏 Hand: No cards to display');
            vfxSystem.updateHand({ cards: [] });
            return;
        }

        // TEMPORARY FIX: Use fixed positions to stop the position chaos
        const fixedY = 850; // Fixed Y position that should be visible
        const handVFXData = cardsInHand.map((card, index) => {
            const cardX = 200 + index * 120; // Fixed spacing
            const cardY = fixedY;

            console.log(`🃏 Hand: Card ${index} (${card.rank}${card.suit[0]}) FIXED position: x=${cardX}, y=${cardY}`);

            return {
                card,
                position: { x: cardX, y: cardY },
                rotation: 0,
                delay: index * 0.1
            };
        });

        console.log('🃏 Hand: Calling vfxSystem.updateHand with', handVFXData.length, 'cards');
        vfxSystem.updateHand({ cards: handVFXData });

    }, [gameStateManager.hand.length]); // Only depend on hand length to avoid infinite updates

    // Debug: Log hand changes
    useEffect(() => {
        console.log('🃏 Hand: Current hand state:', gameStateManager.hand);
    }, [gameStateManager.hand]);

    return (
        <div 
            className="player-section flex flex-col items-center justify-center py-4 w-full flex-shrink-0" 
            ref={handRef}
            style={{ 
                height: '25vh', 
                minHeight: '150px',
                width: '100%',
                minWidth: '800px' // Ensure minimum width for card positioning
            }}
        >
            <div className="flex justify-center p-4 h-full w-full items-end relative" style={{ width: '100%' }}>
                {/* No direct card rendering here */}
            </div>
            {/* Interaction buttons will be moved to App.tsx or handled by VFX.tsx */}
        </div>
    );
};