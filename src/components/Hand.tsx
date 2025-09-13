// src/components/Hand.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gameStateManager, GamePhase } from '../engine/GameStateManager';
import { vfxSystem } from '../engine/VFXSystem';
import type { VFXEvent } from '../engine/VFXSystem';
import { uiPositionManager } from '../engine/UIPositionManager';
import { turnManager } from '../engine/TurnManager';
import { CardContextMenu, type CardActionType } from './CardContextMenu';
import { vfxController } from '../engine/VFXController';
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

        // Use fixed layout positioning for cards (1280x720 layout)
        const LAYOUT_WIDTH = 1280;
        const LAYOUT_HEIGHT = 720;
        const HAND_AREA = { x: 140, y: 580, width: 1000, height: 100 }; // Centrado y con más espacio
        
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

    // Handle card click for context menu
    const handleCardClick = useCallback((card: Card, position: { x: number; y: number }) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const logPrefix = `[${timestamp}] 🃷 Hand.handleCardClick`;
        
        if (gameStateManager.phase !== GamePhase.PLAYER_ACTION) {
            console.log(`${logPrefix}: Cannot interact with cards - not player turn (phase: ${gameStateManager.phase})`);
            return;
        }

        console.log(`${logPrefix}: Card clicked: ${card.rank}${card.suit} (${card.id}) at position:`, position);
        
        // Set card and menu position for context menu (NO enlarged card display)
        setEnlargedCard(card); // Only for menu logic, not for display
        
        // Use the ACTUAL card position from VFX, not hardcoded center
        setActionButtonsPosition({
            x: position.x,
            y: position.y - 50 // Slightly above the card to avoid overlap
        });
        
        console.log(`${logPrefix}: Context menu activated for card ${card.id}`);
    }, []);

    /**
     * Maneja las acciones del menú contextual de cartas
     * Implementa logging completo para debug y seguimiento
     */
    const handleCardAction = (action: CardActionType) => {
        if (!enlargedCard) {
            console.warn('[Hand] ⚠️ handleCardAction called without enlarged card');
            return;
        }

        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`[${timestamp}] 🃷 Hand: Card action '${action}' for card ${enlargedCard.rank}${enlargedCard.suit} (ID: ${enlargedCard.id})`);
        
        switch (action) {
            case 'play':
                console.log(`[${timestamp}] ▶ Hand: Playing card with turnManager.playCard()`);
                turnManager.playCard(enlargedCard);
                break;
                
            case 'sacrifice':
                console.log(`[${timestamp}] ⚔ Hand: Sacrifice logic not yet implemented`);
                // TODO: Implement sacrifice logic when game mechanics are defined
                break;
                
            case 'research':
                console.log(`[${timestamp}] 🔍 Hand: Research action with turnManager.performFocus()`);
                turnManager.performFocus(enlargedCard);
                break;
                
            case 'discard':
                console.log(`[${timestamp}] 🗑 Hand: Discard action with turnManager.performFocus()`);
                turnManager.performFocus(enlargedCard); // Focus = discard + draw
                break;
                
            case 'cancel':
                console.log(`[${timestamp}] ✖ Hand: Action cancelled by user`);
                // Just close the menu - no game action
                break;
                
            default:
                console.error(`[${timestamp}] ❌ Hand: Unknown action type: ${action}`);
                break;
        }
        
        // Close the menu and clear state
        setEnlargedCard(null);
        setActionButtonsPosition(null);
        
        // Clean up VFX zoom when action is taken
        console.log(`[${timestamp}] 🧽 Hand: Requesting VFX zoom cleanup`);
        console.log(`[${timestamp}] 🧽 Hand: VFXController has active zooms: ${vfxController.hasActiveZooms()}`);
        
        vfxController.cleanupActiveZooms();
        
        console.log(`[${timestamp}] 📷 Hand: Menu closed, state cleared, and zoom cleanup requested`);
        
        // Adicional: Limpiar después de un pequeño delay para asegurar que se ejecute
        setTimeout(() => {
            console.log(`[${timestamp}] 🧽 Hand: Backup zoom cleanup after delay`);
            vfxController.cleanupActiveZooms();
        }, 100);
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
    
    // Handle direct drag-to-play events from VFX
    useEffect(() => {
        const handleDirectPlay = (event: CustomEvent) => {
            const { cardId, action } = event.detail;
            const card = gameStateManager.hand.find(c => c.id === cardId);
            
            if (card && action === 'play') {
                const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
                console.log(`[${timestamp}] 🎯 Hand: Direct drag-to-play for card ${card.rank}${card.suit} (${cardId})`);
                
                // Execute play action directly
                turnManager.playCard(card);
                
                console.log(`[${timestamp}] 🎯 Hand: Direct play completed`);
            }
        };
        
        // Add event listener to hand element
        const handElement = handRef.current;
        if (handElement) {
            handElement.addEventListener('direct-play-card', handleDirectPlay as EventListener);
            
            // Also add data attribute for VFX to find
            handElement.setAttribute('data-component', 'hand');
            
            return () => {
                handElement.removeEventListener('direct-play-card', handleDirectPlay as EventListener);
            };
        }
    }, []);

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
                top: 0,
                pointerEvents: 'none' // CRÍTICO: Permitir que los clicks pasen a PixiJS
            }}
        >
            <div className="flex justify-center items-center h-full w-full relative">
                {/* No direct card rendering here - handled by VFX.tsx */}
            </div>
            
            {/* Enlarged Card Display - COMPLETELY DISABLED: Using VFX zoom instead */}
            {/* No enlarged card rendering to prevent placeholder cards */}
            
            {/* Context Menu */}
            {actionButtonsPosition && (enlargedCard || gameStateManager.hand.length > 0) && (
                <CardContextMenu
                    card={enlargedCard || (gameStateManager.hand.length > 0 ? gameStateManager.hand[0] : null)}
                    position={actionButtonsPosition}
                    isVisible={!!(actionButtonsPosition && enlargedCard)}
                    onAction={handleCardAction}
                    radius={140}
                    animationDuration={250}
                />
            )}
        </div>
    );
};