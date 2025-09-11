// src/components/VFX.tsx

import React, { useState, useEffect } from 'react';
import { Application } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { GlowFilter } from 'pixi-filters';
import { vfxSystem } from '../engine/VFXSystem';
import type { VFXEvent, VFXEventType, VFXEventData } from '../engine/VFXSystem';
import type { Card as CardType } from '../engine/types';
import { gameStateManager } from '../engine/GameStateManager';
import { uiPositionManager } from '../engine/UIPositionManager';
import { pixiScreenEffects } from '../engine/PixiScreenEffects';

interface PixiCard {
  sprite: PIXI.Sprite;
  card: CardType;
  originalPosition: { x: number; y: number };
}


export const VFX: React.FC = () => {
  const [pixiCards, setPixiCards] = useState<Record<string, PixiCard>>({});
  const [pixiApp, setPixiApp] = useState<PIXI.Application | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Callback to get the PIXI app instance when it's created
  const onAppInit = (app: PIXI.Application) => {
    console.log('🎨 VFX: PIXI App initialized', app);
    
    // CRITICAL: Make canvas completely transparent
    app.renderer.background.alpha = 0;
    
    // Force canvas transparency
    if (app.canvas) {
      app.canvas.style.backgroundColor = 'transparent';
    }
    
    // Clean any existing sprites from previous sessions
    const childrenBeforeClear = app.stage.children.length;
    app.stage.removeChildren();
    console.log(`🎨 VFX: Stage cleared - removed ${childrenBeforeClear} existing children`);
    
    // Initialize PixiScreenEffects system
    pixiScreenEffects.initialize(app);
    console.log('🎆 VFX: PixiScreenEffects initialized');
    
    setPixiApp(app);
    console.log('🎨 VFX: Canvas setup complete - transparent background');
    console.log('🎨 VFX: Ready for sprite lifecycle tracking');
  };

  // Effect to handle card removal from hand (discard animation)
  useEffect(() => {
    const currentHandIds = new Set(gameStateManager.hand.map(c => c.id));
    for (const cardId in pixiCards) {
      if (!currentHandIds.has(cardId)) {
        const cardToDiscard = pixiCards[cardId];
        if (cardToDiscard && pixiApp?.stage) {
          gsap.to(cardToDiscard.sprite, {
            alpha: 0,
            duration: 0.4,
            onComplete: () => {
              if (pixiApp?.stage) {
                pixiApp.stage.removeChild(cardToDiscard.sprite);
              }
              setPixiCards(prev => {
                const newCards = { ...prev };
                delete newCards[cardId];
                return newCards;
              });
            }
          });
        }
      }
    }
  }, [gameStateManager.hand, pixiCards, pixiApp]);

  // Handle debug mode changes
  useEffect(() => {
    if (!pixiApp) return;
    
    // Clean up existing debug sprites
    const debugSprites = pixiApp.stage.children.filter(child => 
      child.name && child.name.startsWith('debug')
    );
    debugSprites.forEach(sprite => {
      pixiApp.stage.removeChild(sprite);
    });
    
    // Add debug sprites if debug mode is on
    if (debugMode) {
      console.log('🔴 VFX: DEBUG MODE ON - Creating debug sprites');
      
      const basicSprites = [
        { x: 50, y: 50, color: 0xff0000, label: 'TOP-LEFT' },
        { x: 200, y: 150, color: 0x00ff00, label: 'NEAR-TOP' },
        { x: 400, y: 250, color: 0x0000ff, label: 'CENTER' }
      ];
      
      basicSprites.forEach((basic) => {
        const circle = new PIXI.Graphics()
          .circle(0, 0, 25)
          .fill(basic.color);
        
        circle.x = basic.x;
        circle.y = basic.y;
        circle.name = `debug-${basic.label}`;
        pixiApp.stage.addChild(circle);
        console.log(`🔴 VFX: Debug ${basic.label} at (${basic.x}, ${basic.y})`);
      });
    } else {
      console.log('🔴 VFX: DEBUG MODE OFF - Debug sprites removed');
    }
  }, [debugMode, pixiApp]);

  // No longer need window resize handling - using fixed dimensions
  useEffect(() => {
    if (!pixiApp) return;
    
    // Set fixed dimensions for 1280x800 layout
    console.log('🎨 VFX: Setting fixed canvas size to 1280x800');
    pixiApp.renderer.resize(1280, 800);
  }, [pixiApp]);

  // Helper: Rearrange cards horizontally/vertically while dragging
  const triggerCardRearrangement = (draggedCardId: string, _newPos: { x: number; y: number }) => {
    if (!pixiApp) return;
    const handCards = Object.values(pixiCards);
    if (handCards.length === 0) return;

    // Determine hand center from UI manager
    const handArea = uiPositionManager.get('playerHand') || { x: 200, y: 560 };

    // Sort cards by x to get a tentative order
    const sorted = handCards
      .map(pc => ({ id: pc.card.id, x: pc.sprite.x, y: pc.sprite.y, card: pc.card }))
      .sort((a, b) => a.x - b.x);

    // Compute spacing based on number of cards
    const width = 880;
    const height = 100;
    const handCenterX = handArea.x + width / 2;
    const handCenterY = handArea.y + height / 2;
    const numCards = sorted.length;
    const spacing = Math.min(120, width / Math.max(numCards, 1));
    const totalWidth = (numCards - 1) * spacing;
    const startX = handCenterX - totalWidth / 2;

    // Reposition non-dragging cards smoothly to their slots
    sorted.forEach((item, index) => {
      if (item.id === draggedCardId) return; // skip the dragged card
      const targetX = startX + index * spacing;
      const targetY = handCenterY; // keep aligned vertically
      const sprite = pixiCards[item.id]?.sprite;
      if (!sprite) return;
      gsap.to(sprite, { x: targetX, y: targetY, duration: 0.2, ease: 'power1.out' });
    });
  };

  useEffect(() => {
    if (!pixiApp) return;

    const handleVFXEvent = (event: VFXEvent<VFXEventType>) => {
      console.log(`🎨 VFX: Received event ${event.type} - Stage has ${pixiApp?.stage?.children.length || 0} children, tracking ${Object.keys(pixiCards).length} cards`);
      const app = pixiApp;
      if (!app?.stage) {
        console.warn('⚠️ VFX: No PIXI app or stage available');
        return;
      }

      switch (event.type) {
        case 'dealCard': {
          const dealData = event.data as {
            card: CardType;
            startPosition: { x: number; y: number };
            endPosition: { x: number; y: number };
            delay: number;
          };

          const { card, startPosition, endPosition, delay } = dealData;
          console.log('🌴 VFX: Enhanced dealCard animation for', card.rank, card.suit);
          
          // Create temporary sprite for deal animation
          const dealTexture = new PIXI.Graphics()
            .rect(0, 0, 120, 160)
            .fill(0x1f2937)
            .rect(4, 4, 112, 152)
            .stroke({ width: 2, color: 0x4a90e2 })
            .rect(12, 16, 96, 24)
            .fill(0xffffff);
          const texture = app.renderer.generateTexture(dealTexture);
          const dealSprite = new PIXI.Sprite(texture);
          
          dealSprite.anchor.set(0.5);
          dealSprite.x = startPosition.x;
          dealSprite.y = startPosition.y;
          dealSprite.scale.set(0.6);
          dealSprite.rotation = -0.2 + Math.random() * 0.4;
          dealSprite.alpha = 0;
          
          // Enhanced glow effect
          try {
            dealSprite.filters = [new GlowFilter({ distance: 12, outerStrength: 1, color: 0x4a90e2 })];
          } catch (error) {
            console.warn('⚠️ VFX: Deal card GlowFilter failed:', error);
            dealSprite.filters = [];
          }
          
          app.stage.addChild(dealSprite);
          
          // Dramatic entrance with multiple effects
          gsap.to(dealSprite, { alpha: 1, duration: 0.2, delay });
          gsap.to(dealSprite, {
            x: endPosition.x,
            y: endPosition.y,
            rotation: 0,
            duration: 0.8,
            delay,
            ease: 'back.out(1.4)',
            onComplete: () => {
              // Sparkle effect on arrival
              for (let i = 0; i < 8; i++) {
                const sparkle = new PIXI.Graphics().circle(0, 0, 2).fill(0xffffff);
                sparkle.x = endPosition.x + (Math.random() - 0.5) * 40;
                sparkle.y = endPosition.y + (Math.random() - 0.5) * 40;
                app.stage.addChild(sparkle);
                
                gsap.to(sparkle, {
                  alpha: 0,
                  scale: 0,
                  duration: 0.6,
                  ease: 'power2.out',
                  onComplete: () => { app.stage.removeChild(sparkle); }
                });
              }
              
              // Remove deal sprite after arrival
              app.stage.removeChild(dealSprite);
            }
          });
          
          gsap.to(dealSprite.scale, { x: 0.8, y: 0.8, duration: 0.8, delay, ease: 'back.out(1.4)' });
          
          break;
        }

        case 'updateHand': {
          console.log('🌨 VFX: Processing updateHand event - CREATE NEW OR UPDATE EXISTING');
          const updateHandData = event.data as VFXEventData['updateHand'];
          const newHandCards = updateHandData.cards;
          console.log('🌨 VFX: updateHand - received', newHandCards.length, 'cards:', newHandCards.map(c => `${c.card.rank}${c.card.suit[0]} (ID: ${c.card.id}) at (${c.position.x}, ${c.position.y})`));
          console.log('🌨 VFX: Current stage children count BEFORE:', app.stage.children.length);
          console.log('🎃 VFX: Current game state hand length:', gameStateManager.hand.length);
          console.log('🎃 VFX: Actual game state hand IDs:', gameStateManager.hand.map(c => c.id));

          const currentPixiCardIds = new Set(Object.keys(pixiCards));
          const newHandCardIds = new Set(newHandCards.map((c: { card: CardType; }) => c.card.id));
          console.log('🎨 VFX: Current pixiCards keys:', Array.from(currentPixiCardIds));
          console.log('🎨 VFX: New hand card IDs:', Array.from(newHandCardIds));
          
          // Build new pixiCards state synchronously
          let newPixiCards = { ...pixiCards };

          // Remove cards no longer in hand
          for (const cardId of currentPixiCardIds) {
            if (!newHandCardIds.has(cardId)) {
              const cardToDiscard = pixiCards[cardId];
              console.log('🗑️ VFX: Removing sprite for card', cardId, 'no longer in hand');
              if (cardToDiscard && app.stage) {
                gsap.to(cardToDiscard.sprite, {
                  alpha: 0,
                  y: cardToDiscard.sprite.y + 100, // Animate downwards
                  duration: 0.4,
                  onComplete: () => {
                    const currentStage = app.stage;
                    if (currentStage) {
                      currentStage.removeChild(cardToDiscard.sprite);
                      console.log('🗑️ VFX: Sprite removed from stage for card', cardId);
                    }
                  }
                });
                // Remove from our synchronous state immediately
                delete newPixiCards[cardId];
              }
            }
          }

          // Add or update cards in hand
          newHandCards.forEach((handCardData: { card: CardType; position: { x: number; y: number; }; rotation: number; delay: number; }) => {
            const { card, position, rotation, delay } = handCardData;
            const existingPixiCard = pixiCards[card.id];

            if (!existingPixiCard) {
              console.log('🎨 VFX: Creating NEW sprite for card', card.rank, card.suit, 'at position', position);
              
              // Create fallback texture first (will be replaced with real image)
              console.log('🌨 VFX: Creating fallback texture for card', card.rank, card.suit);
              
              const createFallbackTexture = () => {
                const graphics = new PIXI.Graphics()
                  .rect(0, 0, 120, 160)
                  .fill(0x2a2a3a)
                  .rect(5, 5, 110, 150)
                  .stroke({ width: 2, color: 0x4a90e2 })
                  .rect(15, 20, 90, 20)
                  .fill(0xffffff);
                
                // Add card text
                const text = new PIXI.Text(`${card.rank}${card.suit[0]}`, { 
                  fontSize: 16, 
                  fill: 0x000000, 
                  fontWeight: 'bold' 
                });
                text.x = 20;
                text.y = 25;
                graphics.addChild(text);
                
                return app.renderer.generateTexture(graphics);
              };
              
              // Start with fallback texture
              const texture = createFallbackTexture();
              console.log('🌨 VFX: Fallback texture created successfully');
              
              const sprite = new PIXI.Sprite(texture);
              console.log('🎨 VFX: Sprite created, setting anchor');
              sprite.anchor.set(0.5);

              // Add visible white border overlay to ensure clear edge
              const borderOverlay = new PIXI.Graphics()
                .rect(-60, -80, 120, 160)
                .stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
              sprite.addChild(borderOverlay);

              console.log('🎨 VFX: Anchor set, positioning sprite');
              
              // CRITICAL: Set position IMMEDIATELY to avoid flash at (0,0)
              sprite.x = position.x;
              sprite.y = position.y;
              console.log('🎨 VFX: Position set to:', sprite.x, sprite.y);
              console.log('🎨 VFX: Position should be:', position.x, position.y);
              
              sprite.rotation = rotation;
              sprite.scale.set(0.8);
              sprite.interactive = true;
              
              // Add default border effect to all cards
              try {
                sprite.filters = [new GlowFilter({ 
                  distance: 8, 
                  outerStrength: 0.8, 
                  innerStrength: 0.2, 
                  color: 0x4a90e2,
                  quality: 0.5 
                })];
              } catch (error) {
                console.warn('⚠️ VFX: GlowFilter failed, using no filters:', error);
                sprite.filters = [];
              }
              
              console.log('🎨 VFX: Final sprite position before adding to stage:', sprite.x, sprite.y);

              let dragging = false;
              let dragData: PIXI.FederatedPointerEvent | null = null;
              
              // Store original position directly on the sprite to avoid closure/state issues
              (sprite as any).originalPosition = { x: position.x, y: position.y };
              console.log('🌨 VFX: Original card position set to:', (sprite as any).originalPosition);

              sprite.on('pointerover', () => {
                if (!dragging) {
                  console.log('🎭 VFX: Hover ON - card', card.rank, card.suit, 'moving from y:', sprite.y, 'to y:', sprite.y - 30);
                  
                  // Advanced hover animation with multiple effects
                  gsap.to(sprite.scale, { x: 1.1, y: 1.1, duration: 0.3, ease: 'back.out(1.6)' });
                  gsap.to(sprite, { y: sprite.y - 40, rotation: 0.05, duration: 0.3, ease: 'back.out(1.2)' });
                  
                  // Advanced filter stack for hover
                  try {
                    const baseGlow = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                    const hoverGlow = new GlowFilter({ distance: 20, outerStrength: 1.5, innerStrength: 0.4, color: 0x00ffff });
                    sprite.filters = [baseGlow, hoverGlow];
                  } catch (error) {
                    console.warn('⚠️ VFX: Hover GlowFilter failed:', error);
                    sprite.filters = [];
                  }
                  
                  // Subtle particle burst on hover
                  for (let i = 0; i < 6; i++) {
                    const particle = new PIXI.Graphics().circle(0, 0, 2).fill(0x00ffff);
                    particle.x = sprite.x + (Math.random() - 0.5) * 40;
                    particle.y = sprite.y + (Math.random() - 0.5) * 40;
                    particle.alpha = 0.8;
                    app.stage.addChild(particle);
                    
                    gsap.to(particle, {
                      x: particle.x + (Math.random() - 0.5) * 60,
                      y: particle.y - Math.random() * 80 - 20,
                      alpha: 0,
                      duration: 0.8,
                      ease: 'power2.out',
                      onComplete: () => { app.stage.removeChild(particle); }
                    });
                  }
                }
              });

              sprite.on('pointerout', () => {
                if (!dragging) {
                  // Smooth return animation
                  gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.4, ease: 'power2.out' });
                  
                  // Use the originalPosition stored directly on the sprite
                  const targetY = (sprite as any).originalPosition.y;
                  console.log('🎭 VFX: Hover OFF - card', card.rank, card.suit, 'returning from y:', sprite.y, 'to y:', targetY);
                  gsap.to(sprite, { y: targetY, rotation: 0, duration: 0.4, ease: 'elastic.out(0.8, 0.6)' });
                  
                  // Fade back to base filters with smooth transition
                  let baseOutline: GlowFilter | null = null;
                  try {
                    baseOutline = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                    sprite.filters = [baseOutline];
                    
                    // Brief shimmer effect on leave with glow intensity change
                    setTimeout(() => {
                      try {
                        const shimmerGlow = new GlowFilter({ distance: 12, outerStrength: 1.5, innerStrength: 0.3, color: 0xffffff });
                        sprite.filters = [shimmerGlow];
                        
                        // Return to base glow after shimmer
                        setTimeout(() => {
                          try {
                            if (baseOutline) {
                              sprite.filters = [baseOutline];
                            } else {
                              sprite.filters = [];
                            }
                          } catch (e) {
                            sprite.filters = baseOutline ? [baseOutline] : [];
                          }
                        }, 200);
                      } catch (e) {
                        console.warn('⚠️ VFX: Shimmer GlowFilter failed:', e);
                        if (baseOutline) {
                          sprite.filters = [baseOutline];
                        } else {
                          sprite.filters = [];
                        }
                      }
                    }, 50);
                  } catch (error) {
                    console.warn('⚠️ VFX: Base outline GlowFilter failed:', error);
                    sprite.filters = [];
                  }
                  
                  setTimeout(() => {
                    if (baseOutline) {
                      sprite.filters = [baseOutline];
                    } else {
                      sprite.filters = [];
                    }
                  }, 400);
                }
              });

              sprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                // Check if player has AP before allowing drag
                if (gameStateManager.pa <= 0) {
                  console.log('🚫 VFX: Cannot drag card - no AP remaining');
                  
                  // Visual feedback for no AP - red pulse
                  const noAPGlow = new GlowFilter({ distance: 15, outerStrength: 2, color: 0xff4444 });
                  sprite.filters = [noAPGlow];
                  
                  gsap.to(sprite.scale, { x: 0.9, y: 0.9, duration: 0.1, yoyo: true, repeat: 3, ease: 'power2.inOut' });
                  
                  setTimeout(() => {
                    const baseOutline = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                    sprite.filters = [baseOutline];
                  }, 600);
                  
                  return;
                }
                
                dragData = e.data;
                dragging = true;
                
                // Update original position when drag starts
                (sprite as any).originalPosition = { x: sprite.x, y: sprite.y };
                
                // Enhanced drag start animation
                gsap.to(sprite.scale, { x: 1.2, y: 1.2, duration: 0.3, ease: 'back.out(1.6)' });
                gsap.to(sprite, { rotation: 0.1, duration: 0.2, ease: 'power2.out' });
                
                // Advanced filter stack for dragging
                const dragGlow = new GlowFilter({ distance: 25, outerStrength: 2.5, innerStrength: 0.5, color: 0x00ffcc });
                
                sprite.filters = [dragGlow];
                
                // Move to front without re-adding
                if (sprite.parent) {
                  sprite.parent.setChildIndex(sprite, sprite.parent.children.length - 1);
                }
                
                // Particle trail start
                for (let i = 0; i < 8; i++) {
                  const particle = new PIXI.Graphics().circle(0, 0, 3).fill(0x00ffcc);
                  particle.x = sprite.x + (Math.random() - 0.5) * 60;
                  particle.y = sprite.y + (Math.random() - 0.5) * 60;
                  particle.alpha = 0.9;
                  app.stage.addChild(particle);
                  
                  gsap.to(particle, {
                    x: particle.x + (Math.random() - 0.5) * 100,
                    y: particle.y - Math.random() * 100 - 30,
                    alpha: 0,
                    scale: 0,
                    duration: 1.2,
                    ease: 'power2.out',
                    onComplete: () => { app.stage.removeChild(particle); }
                  });
                }
              });

              sprite.on('pointerup', () => {
                dragging = false;
                dragData = null;
                
                const playAreaRect = uiPositionManager.get('playArea');
                const isInPlayArea = playAreaRect && playAreaRect.height !== undefined && sprite.y < playAreaRect.y + playAreaRect.height / 2;
                
                if (isInPlayArea) {
                  // Dispatch cardClick event instead of auto-playing
                  console.log('🎲 VFX: Card clicked for action menu');
                  vfxSystem.cardClick({ 
                    card, 
                    position: { x: sprite.x, y: sprite.y } 
                  });
                  
                  // Return card to original position for now
                  const originalPos = (sprite as any).originalPosition;
                  gsap.to(sprite, {
                    x: originalPos.x,
                    y: originalPos.y,
                    scale: 0.8,
                    rotation: 0,
                    duration: 0.3,
                    ease: 'back.out(1.4)'
                  });
                  
                  // Reset filters
                  const baseGlow = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                  sprite.filters = [baseGlow];
                  
                  return;
                }
                
                // If not in play area, return to original position
                const origPos = (sprite as any).originalPosition;
                
                // Return effects
                gsap.to(sprite, {
                  x: origPos.x,
                  y: origPos.y,
                  rotation: 0,
                  duration: 0.8,
                  ease: "elastic.out(1, 0.6)"
                });
                gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.4, ease: 'back.out(1.2)' });
                
                // Brief color shift to indicate return
                const returnGlow = new GlowFilter({ distance: 12, outerStrength: 1.2, innerStrength: 0.3, color: 0xffaa00 });
                sprite.filters = [returnGlow];
                
                setTimeout(() => {
                  const baseOutline = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                  sprite.filters = [baseOutline];
                }, 400);
              });

              let trailTimer: number | null = null;
              
              sprite.on('pointermove', () => {
                if (dragging && dragData) {
                  const parent = sprite.parent || app.stage;
                  const newPosition = dragData.getLocalPosition(parent);
                  sprite.x = newPosition.x;
                  sprite.y = newPosition.y;
                  
                  // Trigger automatic rearrangement of other cards
                  triggerCardRearrangement(card.id, newPosition);
                  
                  // Create trailing particle effect while dragging
                  if (trailTimer) clearTimeout(trailTimer);
                  trailTimer = setTimeout(() => {
                    for (let i = 0; i < 3; i++) {
                      const trail = new PIXI.Graphics().circle(0, 0, 2 + Math.random()).fill(0x00ffcc);
                      trail.x = sprite.x + (Math.random() - 0.5) * 20;
                      trail.y = sprite.y + (Math.random() - 0.5) * 20;
                      trail.alpha = 0.6;
                      app.stage.addChild(trail);
                      
                      gsap.to(trail, {
                        alpha: 0,
                        scale: 0,
                        y: trail.y + 20,
                        duration: 0.4,
                        ease: 'power2.out',
                        onComplete: () => { app.stage.removeChild(trail); }
                      });
                    }
                    trailTimer = null;
                  }, 50);
                }
              });

              console.log('🌨 VFX: Adding sprite to stage for card', card.rank, card.suit, 'at target position:', position.x, position.y);
              
              // Start sprite from deck position for deal animation
              const deckPosition = { x: window.innerWidth / 2, y: 0 };
              sprite.x = deckPosition.x;
              sprite.y = deckPosition.y;
              sprite.rotation = -0.3;
              sprite.alpha = 1;
              sprite.scale.set(0.6); // Start smaller
              
              const childrenBefore = app.stage.children.length;
              app.stage.addChild(sprite);
              const childrenAfter = app.stage.children.length;
              console.log(`🌨 VFX: ✅ Sprite added! Stage children: ${childrenBefore} -> ${childrenAfter}`);
              
              // Add to our synchronous state immediately
              newPixiCards[card.id] = { sprite, card, originalPosition: { x: position.x, y: position.y } };

              // Animate to final position with deal effect
              gsap.to(sprite, {
                x: position.x,
                y: position.y,
                rotation: rotation,
                duration: 0.6,
                ease: 'back.out(1.2)',
                delay: delay
              });
              
              gsap.to(sprite.scale, {
                x: 0.8,
                y: 0.8,
                duration: 0.6,
                ease: 'back.out(1.2)',
                delay: delay
              });

              // Load real texture asynchronously
              PIXI.Assets.load(`/images/decks/default/${card.imageFile}`)
                .then((loadedTexture) => {
                  console.log('🇺 VFX: Real texture loaded for', card.rank, card.suit);
                  sprite.texture = loadedTexture;
                })
                .catch((_error) => {
                  console.log('⚠️ VFX: Could not load real texture for', card.rank, card.suit, '- keeping fallback');
                  // Keep the fallback texture
                });

            } else {
              const sprite = existingPixiCard.sprite;
              console.log('🌨 VFX: Updating EXISTING sprite for card', card.rank, card.suit, 'from', sprite.x, sprite.y, 'to', position.x, position.y);
              
              // Update the sprite's stored original position
              (sprite as any).originalPosition = { x: position.x, y: position.y };
              
              // Update existing sprite's position
              gsap.to(sprite, {
                x: position.x,
                y: position.y,
                rotation: rotation,
                duration: 0.3,
                delay: delay,
                ease: 'power1.out',
              });
              
              // Update in our synchronous state
              newPixiCards[card.id] = { ...existingPixiCard, originalPosition: { x: position.x, y: position.y } };
            }
          });
          
          // Apply all pixiCards state changes in a single batch update
          setPixiCards(newPixiCards);
          
          // Summary logging
          console.log(`🌨 VFX: 🆙 updateHand COMPLETE - Stage has ${app.stage.children.length} total children`);
          console.log(`🌨 VFX: 🃏 Will track ${Object.keys(newPixiCards).length} cards in pixiCards state`);
          break;
        }
        
        case 'repositionHand': {
          console.log('🎨 VFX: Processing repositionHand event - ONLY MOVING EXISTING SPRITES');
          const repositionHandData = event.data as VFXEventData['repositionHand'];
          const repositionCards = repositionHandData.cards;
          console.log('🎨 VFX: repositionHand - received', repositionCards.length, 'cards for repositioning');
          console.log('🎨 VFX: Current stage children count:', app.stage.children.length);

          // Only update positions of existing sprites, don't create new ones
          repositionCards.forEach((handCardData: { card: CardType; position: { x: number; y: number; }; rotation: number; delay: number; }) => {
            const { card, position, rotation, delay } = handCardData;
            const existingPixiCard = pixiCards[card.id];
            
            if (existingPixiCard) {
              const sprite = existingPixiCard.sprite;
              console.log('🌨 VFX: Repositioning', card.rank, card.suit, 'to', position.x, position.y);
              
              // Update the sprite's stored original position
              (sprite as any).originalPosition = { x: position.x, y: position.y };
              
              // Animate to new position
              gsap.to(sprite, {
                x: position.x,
                y: position.y,
                rotation: rotation,
                duration: 0.3,
                delay: delay,
                ease: 'power1.out',
              });
              
              // Update original position in pixiCards state
              setPixiCards(prev => ({
                ...prev,
                [card.id]: { ...prev[card.id], originalPosition: { x: position.x, y: position.y } }
              }));
            } else {
              console.warn('⚠️ VFX: Cannot reposition card', card.rank, card.suit, '- sprite does not exist');
            }
          });
          break;
        }
        
        case 'hoverCard':
          // This is now handled by the drag-and-drop interaction, but could be re-enabled if needed
          break;

        case 'selectCard':
          // This is now handled by the drag-and-drop interaction
          break;

        case 'cardAttack': {
            const attackData = event.data as {
              startPosition: { x: number; y: number };
              endPosition: { x: number; y: number };
            };

            const { startPosition: attackStart, endPosition: attackEnd } = attackData;
            const projectile = new PIXI.Graphics().rect(0, 0, 10, 10).fill(0xff0000);
            const projectileTexture = app.renderer.generateTexture(projectile);
            const projectileSprite = new PIXI.Sprite(projectileTexture);
            projectileSprite.anchor.set(0.5);
            projectileSprite.x = attackStart.x;
            projectileSprite.y = attackStart.y;
            app.stage.addChild(projectileSprite);

            gsap.to(projectileSprite, {
                x: attackEnd.x,
                y: attackEnd.y,
                duration: 0.6,
                ease: 'power2.in',
                onComplete: () => {
                  const currentStage = app.stage;
                  if (currentStage) {
                    currentStage.removeChild(projectileSprite);
                  }
                }
            });
            break;
        }
        
        case 'cardDefend': {
            const defendData = event.data as {
              position: { x: number; y: number };
            };

            const { position: defendPosition } = defendData;
            const wave = new PIXI.Graphics()
                .circle(0, 0, 20)
                .stroke({ width: 4, color: 0x00ffcc });
            wave.x = defendPosition.x;
            wave.y = defendPosition.y;
            app.stage.addChild(wave);

            gsap.to(wave, {
                scaleX: 10,
                scaleY: 10,
                alpha: 0,
                duration: 1,
                ease: 'power2.out',
                onComplete: () => {
                  const currentStage = app.stage;
                  if (currentStage) {
                    currentStage.removeChild(wave);
                  }
                }
            });
            break;
        }
        case 'cardResearch': {
            const researchData = event.data as {
              startPosition: { x: number; y: number };
              endPosition: { x: number; y: number };
            };

            const { startPosition: researchStart, endPosition: researchEnd } = researchData;
            for (let i = 0; i < 10; i++) {
                const particle = new PIXI.Graphics().rect(0, 0, 5, 5).fill(0x00ffcc);
                particle.x = researchStart.x;
                particle.y = researchStart.y;
                app.stage.addChild(particle);

                gsap.to(particle, {
                    x: researchEnd.x,
                    y: researchEnd.y,
                    duration: 1 + Math.random() * 0.5,
                    delay: Math.random() * 0.2,
                    ease: 'power1.inOut',
                    onComplete: (() => {
                      const currentStage = app.stage;
                      if (currentStage) {
                        currentStage.removeChild(particle);
                      }
                    }) as () => void
                });
            }
            break;
        }
        case 'ecoPlayCard': {
            const ecoData = event.data as VFXEventData['ecoPlayCard'];
            const { card, startPosition, centerPosition } = ecoData;

            // Create a temp sprite for eco card
            const placeholder = new PIXI.Graphics()
              .rect(0, 0, 120, 160)
              .fill(0x1f2937)
              .rect(4, 4, 112, 152)
              .stroke({ width: 2, color: 0xb91c1c })
              .rect(12, 16, 96, 24)
              .fill(0xffffff);
            const phTex = app.renderer.generateTexture(placeholder);
            const ecoSprite = new PIXI.Sprite(phTex);
            ecoSprite.anchor.set(0.5);
            ecoSprite.x = startPosition.x;
            ecoSprite.y = startPosition.y;
            ecoSprite.scale.set(0.6);
            ecoSprite.filters = [new GlowFilter({ distance: 12, outerStrength: 1.2, color: 0xff4444 })];
            app.stage.addChild(ecoSprite);

            // Drag to center with slight arc
            gsap.to(ecoSprite, { x: centerPosition.x, y: centerPosition.y - 20, rotation: -0.15, duration: 0.5, ease: 'power2.out' });
            gsap.to(ecoSprite.scale, { x: 0.9, y: 0.9, duration: 0.5, ease: 'power2.out' });

            // Flip animation with texture swap
            setTimeout(() => {
              // First half flip
              gsap.to(ecoSprite.scale, { x: 0.05, duration: 0.25, ease: 'power2.in' , onComplete: () => {
                // Load real texture
                PIXI.Assets.load(`/images/decks/default/${card.imageFile}`)
                  .then((tex) => {
                    ecoSprite.texture = tex;
                  })
                  .catch(() => {/* keep placeholder */});
                
                // Second half flip
                gsap.to(ecoSprite.scale, { x: 1.2, duration: 0.25, ease: 'power2.out' });
              }});

              // Shockwave effect at center
              const wave = new PIXI.Graphics().circle(0,0,20).stroke({ width: 6, color: 0xff5555, alpha: 0.8 });
              wave.x = centerPosition.x;
              wave.y = centerPosition.y;
              app.stage.addChild(wave);
              gsap.to(wave, { scaleX: 8, scaleY: 8, alpha: 0, duration: 0.6, ease: 'power2.out', onComplete: () => { app.stage.removeChild(wave); } });
            }, 520);

            // Hold big for a moment
            setTimeout(() => {
              gsap.to(ecoSprite.scale, { x: 1.4, y: 1.4, duration: 0.3, ease: 'back.out(1.6)' });
              ecoSprite.filters = [new GlowFilter({ distance: 20, outerStrength: 2, color: 0xff9999 })];
            }, 900);

            // Consume with fade and glow reduction
            setTimeout(() => {
              ecoSprite.filters = [new GlowFilter({ distance: 5, outerStrength: 0.5, color: 0xff4444 })];
              gsap.to(ecoSprite, { alpha: 0, duration: 0.5, ease: 'power2.in', onComplete: () => {
                app.stage.removeChild(ecoSprite);
              }});
            }, 1500);

            break;
        }
        
        case 'cardResource': {
            const resourceData = event.data as {
              startPosition: { x: number; y: number };
              endPosition: { x: number; y: number };
            };

            const { startPosition: resourceStart, endPosition: resourceEnd } = resourceData;
            for (let i = 0; i < 15; i++) {
                const particle = new PIXI.Graphics().rect(0, 0, 6, 6).fill(0xffd700);
                particle.x = resourceStart.x;
                particle.y = resourceStart.y;
                app.stage.addChild(particle);

                gsap.to(particle, {
                    x: resourceEnd.x,
                    y: resourceEnd.y,
                    duration: 0.8 + Math.random() * 0.4,
                    delay: Math.random() * 0.2,
                    ease: 'power1.inOut',
                    onComplete: (() => {
                      const currentStage = app.stage;
                      if (currentStage) {
                        currentStage.removeChild(particle);
                      }
                    }) as () => void
                });
            }
            break;
        }
        
        case 'dealEcoCard': {
          const dealEcoData = event.data as VFXEventData['dealEcoCard'];
          const { card, startPosition, endPosition, delay } = dealEcoData;
          console.log('🤖 VFX: Enhanced dealEcoCard animation for', card.rank, card.suit);
          
          // Create temporary sprite for ECO deal animation
          const dealTexture = new PIXI.Graphics()
            .rect(0, 0, 120, 160)
            .fill(0x2a1a1a)
            .rect(4, 4, 112, 152)
            .stroke({ width: 2, color: 0xb91c1c })
            .rect(12, 16, 96, 24)
            .fill(0xffffff);
          const texture = app.renderer.generateTexture(dealTexture);
          const dealSprite = new PIXI.Sprite(texture);
          
          dealSprite.anchor.set(0.5);
          dealSprite.x = startPosition.x;
          dealSprite.y = startPosition.y;
          dealSprite.scale.set(0.9);
          dealSprite.rotation = -0.2 + Math.random() * 0.4;
          dealSprite.alpha = 0;
          
          // Red glow for ECO cards
          try {
            dealSprite.filters = [new GlowFilter({ distance: 12, outerStrength: 1, color: 0xb91c1c })];
          } catch (error) {
            console.warn('⚠️ VFX: ECO deal card GlowFilter failed:', error);
            dealSprite.filters = [];
          }
          
          app.stage.addChild(dealSprite);
          
          // Animate to ECO hand
          gsap.to(dealSprite, { alpha: 1, duration: 0.2, delay });
          gsap.to(dealSprite, {
            x: endPosition.x,
            y: endPosition.y,
            rotation: 0,
            duration: 0.8,
            delay,
            ease: 'back.out(1.4)',
            onComplete: () => {
              // Dark sparkle effect on arrival
              for (let i = 0; i < 6; i++) {
                const sparkle = new PIXI.Graphics().circle(0, 0, 2).fill(0xaa3333);
                sparkle.x = endPosition.x + (Math.random() - 0.5) * 40;
                sparkle.y = endPosition.y + (Math.random() - 0.5) * 40;
                app.stage.addChild(sparkle);
                
                gsap.to(sparkle, {
                  alpha: 0,
                  scale: 0,
                  duration: 0.6,
                  ease: 'power2.out',
                  onComplete: () => { app.stage.removeChild(sparkle); }
                });
              }
              
              // Remove deal sprite after arrival
              app.stage.removeChild(dealSprite);
            }
          });
          
          gsap.to(dealSprite.scale, { x: 1.2, y: 1.2, duration: 0.8, delay, ease: 'back.out(1.4)' });
          
          break;
        }
        
        case 'nodeRepaired': {
          const nodeData = event.data as VFXEventData['nodeRepaired'];
          const { nodeId, repairAmount, position } = nodeData;
          console.log('🔧 VFX: Node repair animation for', nodeId, 'amount:', repairAmount);
          
          // Create repair effect - green healing energy
          const repairRing = new PIXI.Graphics()
            .circle(0, 0, 20)
            .stroke({ width: 4, color: 0x22c55e, alpha: 0.8 });
          repairRing.x = position.x;
          repairRing.y = position.y;
          app.stage.addChild(repairRing);
          
          // Expanding ring animation
          gsap.to(repairRing, {
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => { app.stage.removeChild(repairRing); }
          });
          
          // Repair particles rising upward
          for (let i = 0; i < 12; i++) {
            const particle = new PIXI.Graphics().circle(0, 0, 3).fill(0x10b981);
            particle.x = position.x + (Math.random() - 0.5) * 40;
            particle.y = position.y + (Math.random() - 0.5) * 40;
            particle.alpha = 0.9;
            app.stage.addChild(particle);
            
            gsap.to(particle, {
              x: particle.x + (Math.random() - 0.5) * 20,
              y: particle.y - Math.random() * 60 - 30,
              alpha: 0,
              scale: 0.2,
              duration: 1.2,
              delay: Math.random() * 0.3,
              ease: 'power2.out',
              onComplete: () => { app.stage.removeChild(particle); }
            });
          }
          
          // Repair amount text popup
          const repairText = new PIXI.Text(`+${repairAmount}%`, {
            fontSize: 24,
            fill: 0x22c55e,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 }
          });
          repairText.anchor.set(0.5);
          repairText.x = position.x;
          repairText.y = position.y - 20;
          repairText.alpha = 0;
          app.stage.addChild(repairText);
          
          gsap.to(repairText, { alpha: 1, y: position.y - 50, duration: 0.5, ease: 'back.out(1.6)' });
          gsap.to(repairText, { alpha: 0, duration: 0.4, delay: 1, onComplete: () => { app.stage.removeChild(repairText); } });
          
          break;
        }
        
        case 'nodeDamaged': {
          const damageData = event.data as VFXEventData['nodeDamaged'];
          const { nodeId, damageAmount, position } = damageData;
          console.log('💥 VFX: Node damage animation for', nodeId, 'amount:', damageAmount);
          
          // Create damage effect - red explosion
          const damageBlast = new PIXI.Graphics()
            .circle(0, 0, 15)
            .fill({ color: 0xef4444, alpha: 0.8 });
          damageBlast.x = position.x;
          damageBlast.y = position.y;
          app.stage.addChild(damageBlast);
          
          // Expanding blast animation
          gsap.to(damageBlast, {
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => { app.stage.removeChild(damageBlast); }
          });
          
          // Screen shake effect (shake the entire stage briefly)
          const originalX = app.stage.x;
          const originalY = app.stage.y;
          gsap.to(app.stage, {
            x: originalX + 5,
            y: originalY + 3,
            duration: 0.05,
            yoyo: true,
            repeat: 6,
            ease: 'power2.inOut',
            onComplete: () => {
              app.stage.x = originalX;
              app.stage.y = originalY;
            }
          });
          
          // Damage particles scattering outward
          for (let i = 0; i < 15; i++) {
            const debris = new PIXI.Graphics().rect(0, 0, 4, 4).fill(0xdc2626);
            debris.x = position.x;
            debris.y = position.y;
            debris.alpha = 0.9;
            app.stage.addChild(debris);
            
            const angle = (i / 15) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            const targetX = position.x + Math.cos(angle) * distance;
            const targetY = position.y + Math.sin(angle) * distance;
            
            gsap.to(debris, {
              x: targetX,
              y: targetY,
              rotation: Math.random() * Math.PI * 2,
              alpha: 0,
              scale: 0.1,
              duration: 0.8 + Math.random() * 0.4,
              ease: 'power2.out',
              onComplete: () => { app.stage.removeChild(debris); }
            });
          }
          
          // Damage amount text popup
          const damageText = new PIXI.Text(`-${damageAmount}%`, {
            fontSize: 24,
            fill: 0xef4444,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 }
          });
          damageText.anchor.set(0.5);
          damageText.x = position.x;
          damageText.y = position.y - 20;
          damageText.alpha = 0;
          app.stage.addChild(damageText);
          
          gsap.to(damageText, { alpha: 1, y: position.y - 50, duration: 0.5, ease: 'back.out(1.6)' });
          gsap.to(damageText, { alpha: 0, duration: 0.4, delay: 1, onComplete: () => { app.stage.removeChild(damageText); } });
          
          break;
        }
        
        default:
          console.warn('Unknown VFX event type:', event.type);
      }
    };

    const unsubscribe = vfxSystem.subscribe(handleVFXEvent);
    return unsubscribe;
  }, [pixiCards, pixiApp]);

  if (debugMode) {
    return (
      <div className="debug-vfx" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1280px',
        height: '800px',
        backgroundColor: 'rgba(0,0,0,0.1)',
        border: '3px solid red',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'white',
          fontSize: '14px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '5px'
        }}>
          DEBUG MODE - PixiJS Canvas Area (1280x800)
        </div>
        <Application 
          width={1280} 
          height={800}
          backgroundAlpha={0}
          antialias={false}
          clearBeforeRender={false}
          preference="webgl"
          onInit={onAppInit}
        />
      </div>
    );
  }

  return (
    <>
      <div className="vfx-layer" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1280px',
        height: '800px',
        zIndex: 40,
        pointerEvents: 'auto'
      }}>
        <Application 
          width={1280} 
          height={800}
          backgroundAlpha={0}
          antialias={false}
          clearBeforeRender={false}
          preference="webgl"
          onInit={onAppInit}
        />
      </div>
      
      {/* Debug toggle button */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => setDebugMode(!debugMode)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: debugMode ? '#ff4444' : 'rgba(255,255,255,0.1)',
            color: debugMode ? 'white' : '#888',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = debugMode ? '#ff6666' : 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = debugMode ? '#ff4444' : 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={debugMode ? 'Desactivar modo debug' : 'Activar modo debug VFX'}
        >
          🔧
        </button>
      </div>
    </>
  );
};