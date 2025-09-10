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

        // Use screen-relative positioning for cards
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Position cards in the bottom area of screen
        const handCenterX = screenWidth / 2;
        const handCenterY = screenHeight - 120; // Fixed position from bottom
        
        console.log(`🎃 Hand: Screen size: ${screenWidth}x${screenHeight}, hand center: (${handCenterX}, ${handCenterY})`);
        
        const cardSpacing = 120;
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

    // Update card positions when window resizes
    useEffect(() => {
        const handleResize = () => {
            console.log('🎃 Hand: Window resized, updating card positions');
            updateCardPositions(false); // Only reposition existing cards on resize
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array - set up once

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