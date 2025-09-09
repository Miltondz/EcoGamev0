// src/components/Hand.tsx

import React, { useRef, useEffect, useState } from 'react';
import { gameStateManager } from '../engine/GameStateManager';
import { vfxSystem } from '../engine/VFXSystem';
import { uiPositionManager } from '../engine/UIPositionManager';

interface HandProps {
    // No longer receives card-specific interaction props, as VFX handles them
}

export const Hand: React.FC<HandProps> = () => {
    const handRef = useRef<HTMLDivElement>(null);

    const [handRect, setHandRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const updateHandRect = () => {
            if (handRef.current) {
                const rect = handRef.current.getBoundingClientRect();
                setHandRect(rect);
                uiPositionManager.register('playerHand', { x: rect.left, y: rect.top });
            }
        };

        updateHandRect();
        window.addEventListener('resize', updateHandRect);

        const unsubscribeGameState = gameStateManager.subscribe(updateHandRect); // Update hand rect on game state changes

        return () => {
            window.removeEventListener('resize', updateHandRect);
            unsubscribeGameState();
        };
    }, []);

    useEffect(() => {
        if (!handRect) {
            console.log('🃏 Hand: No handRect available yet');
            return;
        }

        const cardsInHand = gameStateManager.hand;
        const numCards = cardsInHand.length;
        console.log('🃏 Hand: Processing', numCards, 'cards in hand, handRect:', handRect);
        const cardWidth = 100; // Approximate card width for spacing calculation
        const spacing = 20; // Space between cards
        const totalWidth = numCards * cardWidth + (numCards - 1) * spacing;

        // Calculate start X to center the hand
        let startX = handRect.left + (handRect.width / 2) - (totalWidth / 2);
        if (numCards === 0) {
            startX = handRect.left + handRect.width / 2; // Center if no cards
        }

        const handVFXData = cardsInHand.map((card, index) => {
            const cardX = startX + index * (cardWidth + spacing) + cardWidth / 2;
            const cardY = handRect.top + handRect.height / 2; // Center vertically in the hand area

            return {
                card,
                position: { x: cardX, y: cardY },
                rotation: 0, // No rotation for now
                delay: index * 0.1 // Staggered deal animation
            };
        });

        console.log('🃏 Hand: Calling vfxSystem.updateHand with', handVFXData.length, 'cards');
        vfxSystem.updateHand({ cards: handVFXData });

    }, [gameStateManager.hand, handRect]); // Re-run when hand changes or handRect updates

    // Debug: Log hand changes
    useEffect(() => {
        console.log('🃏 Hand: Current hand state:', gameStateManager.hand);
    }, [gameStateManager.hand]);

    return (
        <div 
            className="player-section flex flex-col items-center justify-center py-4 w-full flex-shrink-0" 
            ref={handRef}
            style={{ height: '25vh', minHeight: '150px' }} // Flexible height for hand area
        >
            <div className="flex justify-center p-4 h-full w-full items-end relative">
                {/* No direct card rendering here */}
            </div>
            {/* Interaction buttons will be moved to App.tsx or handled by VFX.tsx */}
        </div>
    );
};