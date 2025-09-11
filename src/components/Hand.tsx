// src/components/Hand.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gameStateManager, GamePhase } from '../engine/GameStateManager';
import { vfxSystem } from '../engine/VFXSystem';
import type { VFXEvent } from '../engine/VFXSystem';
import { uiPositionManager } from '../engine/UIPositionManager';
import { turnManager } from '../engine/TurnManager';
import { CardActionButtons } from './CardActionButtons';
import type { Card } from '../engine/types';

interface HandProps {
    // No longer receives card-specific interaction props, as VFX handles them
}

export const Hand: React.FC<HandProps> = () => {
    const handRef = useRef<HTMLDivElement>(null);
    const [enlargedCard, setEnlargedCard] = useState<Card | null>(null);
    const [actionButtonsPosition, setActionButtonsPosition] = useState<{ x: number; y: number } | null>(null);

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

    // Handle card click for enlargement
    const handleCardClick = useCallback((card: Card, position: { x: number; y: number }) => {
        if (gameStateManager.phase !== GamePhase.PLAYER_ACTION) {
            console.log('🃏 Hand: Cannot interact with cards - not player turn');
            return;
        }

        console.log('🃏 Hand: Card clicked:', card.id, 'at position:', position);
        setEnlargedCard(card);
        // Position buttons in the center of the screen, above the enlarged card
        setActionButtonsPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.25 // Above the enlarged card
        });
    }, []);

    // Handle action button clicks
    const handleCardAction = (action: 'play' | 'sacrifice' | 'research' | 'discard' | 'cancel') => {
        if (!enlargedCard) return;

        console.log('🃏 Hand: Card action:', action, 'for card:', enlargedCard.id);
        
        switch (action) {
            case 'play':
                turnManager.playCard(enlargedCard);
                break;
            case 'sacrifice':
                // Implement sacrifice logic if needed
                console.log('🃏 Hand: Sacrifice not yet implemented');
                break;
            case 'research':
                turnManager.performFocus(enlargedCard);
                break;
            case 'discard':
                turnManager.performFocus(enlargedCard); // Focus = discard + draw
                break;
            case 'cancel':
                // Just close the action menu
                break;
        }
        
        // Close the enlarged card view
        setEnlargedCard(null);
        setActionButtonsPosition(null);
    };

    // Subscribe to VFX card click events
    useEffect(() => {
        const unsubscribe = vfxSystem.subscribe((event: VFXEvent<any>) => {
            if (event.type === 'cardClick') {
                const { card, position } = event.data;
                handleCardClick(card, position);
            }
        });

        return unsubscribe;
    }, [handleCardClick]);

    // Close enlarged card when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (enlargedCard && handRef.current && !handRef.current.contains(event.target as Node)) {
                setEnlargedCard(null);
                setActionButtonsPosition(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [enlargedCard]);

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
            
            {/* Enlarged Card Display */}
            {enlargedCard && (
                <>
                    {/* Backdrop */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 8000,
                        pointerEvents: 'auto'
                    }} />
                    
                    {/* Enlarged Card */}
                    <div style={{
                        position: 'fixed',
                        left: '50%',
                        top: '40%',
                        transform: 'translate(-50%, -50%)',
                        width: '280px', // Increased size for better visibility
                        height: '392px', // Maintain card aspect ratio
                        borderRadius: '16px',
                        backgroundColor: '#ffffff',
                        border: '4px solid #d97706',
                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        zIndex: 9000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: `url(/images/scenarios/default/cards/${enlargedCard.imageFile}), url(/images/scenarios/default/cards/missing-card.png)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        overflow: 'hidden'
                    }}>
                        {/* Card details when no image available */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: enlargedCard.suit === 'Hearts' || enlargedCard.suit === 'Diamonds' 
                                ? 'linear-gradient(135deg, #7f1d1d, #991b1b, #dc2626)' 
                                : 'linear-gradient(135deg, #1e293b, #374151, #475569)',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            border: '2px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{
                                fontSize: '48px',
                                fontWeight: 'bold',
                                color: enlargedCard.suit === 'Hearts' || enlargedCard.suit === 'Diamonds' ? '#dc2626' : '#1f2937',
                                marginBottom: '8px'
                            }}>
                                {enlargedCard.rank}
                            </div>
                            <div style={{
                                fontSize: '32px',
                                color: enlargedCard.suit === 'Hearts' || enlargedCard.suit === 'Diamonds' ? '#dc2626' : '#1f2937'
                            }}>
                                {enlargedCard.suit === 'Spades' ? '♠' : 
                                 enlargedCard.suit === 'Hearts' ? '♥' : 
                                 enlargedCard.suit === 'Diamonds' ? '♦' : '♣'}
                            </div>
                        </div>
                    </div>
                </>
            )}
            
            {/* Action Buttons */}
            {actionButtonsPosition && enlargedCard && (
                <CardActionButtons
                    card={enlargedCard}
                    position={actionButtonsPosition}
                    onAction={handleCardAction}
                    isVisible={true}
                />
            )}
        </div>
    );
};