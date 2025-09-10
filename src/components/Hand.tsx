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
    const updateCardPositions = (createNew = false) => {
        const cardsInHand = gameStateManager.hand;
        const numCards = cardsInHand.length;
        console.log('🎃 Hand: Processing', numCards, 'cards in hand - createNew:', createNew);
        
        if (numCards === 0) {
            console.log('🎃 Hand: No cards to display');
            vfxSystem.updateHand({ cards: [] });
            return;
        }

        // Use fixed layout positioning for cards (1280x800 layout)
        const LAYOUT_WIDTH = 1280;
        const LAYOUT_HEIGHT = 720;
        const HAND_AREA = { x: 200, y: 560, width: 880, height: 100 };
        
        // Position cards in the fixed hand area
        const handCenterX = HAND_AREA.x + HAND_AREA.width / 2; // 640px from left
        const handCenterY = HAND_AREA.y + HAND_AREA.height / 2; // 670px from top
        
        console.log(`🎃 Hand: Fixed layout ${LAYOUT_WIDTH}x${LAYOUT_HEIGHT}, hand center: (${handCenterX}, ${handCenterY})`);
        
        const cardSpacing = Math.min(120, HAND_AREA.width / Math.max(numCards, 1)); // Adapt spacing to fit in area
        const totalWidth = (numCards - 1) * cardSpacing;
        const startX = handCenterX - totalWidth / 2;
        
        const handVFXData = cardsInHand.map((card, index) => {
            const cardX = startX + index * cardSpacing;
            const cardY = handCenterY;

            // console.log(`🎃 Hand: Card ${index} (${card.rank}${card.suit[0]}) position: x=${cardX}, y=${cardY}`);

            return {
                card,
                position: { x: cardX, y: cardY },
                rotation: 0,
                delay: createNew ? index * 0.1 : 0 // Only delay for new cards
            };
        });

        if (createNew) {
            console.log('🎃 Hand: Creating new hand with', handVFXData.length, 'cards');
            vfxSystem.updateHand({ cards: handVFXData });
        } else {
            console.log('🎃 Hand: Repositioning existing cards');
            vfxSystem.repositionHand({ cards: handVFXData });
        }
    };

    // Single consolidated effect to handle all hand changes
    useEffect(() => {
        const currentHandIds = gameStateManager.hand.map(c => c.id);
        console.log('🎃 Hand: Hand state changed - IDs:', currentHandIds.join(','));
        
        // Single debounced update to avoid multiple rapid calls
        const timer = setTimeout(() => {
            console.log('🎃 Hand: Processing consolidated hand update');
            updateCardPositions(true); // Always use createNew to handle all scenarios
        }, 150); // Single delay for all hand changes
        
        return () => clearTimeout(timer);
    }, [gameStateManager.hand.map(c => c.id).join(',')]); // Only depend on actual card composition

    // No longer need window resize handling for fixed layout
    // useEffect for resize removed as we use fixed 1280x800 layout

    // Debug: Log hand changes
    useEffect(() => {
        console.log('🃏 Hand: Current hand state:', gameStateManager.hand);
    }, [gameStateManager.hand]);

    return (
        <div 
            className="player-section flex flex-col items-center justify-center" 
            ref={handRef}
            style={{ 
                width: '880px',
                height: '100px',
                position: 'absolute',
                left: 0,
                top: 0
            }}
        >
            <div className="flex justify-center items-center h-full w-full relative">
                {/* No direct card rendering here - handled by VFX.tsx */}
            </div>
            {/* Interaction buttons will be moved to App.tsx or handled by VFX.tsx */}
        </div>
    );
};