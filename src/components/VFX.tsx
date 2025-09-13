// src/components/VFX.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
import { floatingNumbersSystem } from '../engine/FloatingNumbersSystem';
import { vfxController } from '../engine/VFXController';
import { GameLayer, useLayer, layerSystem } from '../engine/LayerManager';
// import { Z_INDEX } from '../constants/zIndex'; // Reemplazado por LayerManager

interface PixiCard {
  sprite: PIXI.Sprite;
  card: CardType;
  originalPosition: { x: number; y: number };
}


export const VFX: React.FC = () => {
  const vfxLayer = useLayer(GameLayer.PIXI_STAGE);
  const debugToolsLayer = useLayer(GameLayer.DEBUG_OVERLAY);
  
  const [pixiCards, setPixiCards] = useState<Record<string, PixiCard>>({});
  const [pixiApp, setPixiApp] = useState<PIXI.Application | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [_activeZoomContainer, setActiveZoomContainer] = useState<PIXI.Container | null>(null);
  
  /**
   * Cleanup function for removing active zoom containers
   * Called when context menu actions are taken
   */
  const cleanupActiveZoom = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logPrefix = `[${timestamp}] 🧽 VFX.cleanupActiveZoom`;
    
    console.log(`${logPrefix}: Cleaning up active zoom containers`);
    
    if (!pixiApp || !pixiApp.stage) {
      console.warn(`${logPrefix}: No PIXI app available for cleanup`);
      return;
    }
    
    // Find and remove all zoom containers
    const zoomContainers = pixiApp.stage.children.filter(child => 
      child.label && child.label.startsWith('cardZoomContainer')
    );
    
    console.log(`${logPrefix}: Found ${zoomContainers.length} zoom containers to clean`);
    
    zoomContainers.forEach((container, index) => {
      console.log(`${logPrefix}: Animating out zoom container ${index + 1}/${zoomContainers.length}`);
      
      gsap.to(container, {
        scale: 0.1,
        alpha: 0,
        duration: 0.3,
        ease: 'back.in(1.6)',
        onComplete: () => {
          if (pixiApp && pixiApp.stage && container.parent) {
            pixiApp.stage.removeChild(container);
            console.log(`${logPrefix}: ✅ Zoom container ${index + 1} removed from stage`);
          }
        }
      });
    });
    
    // CRITICAL: Also cleanup any lingering play zone indicators
    const playZoneIndicators = pixiApp.stage.children.filter(child => 
      child.label && child.label === 'playZoneIndicator'
    );
    
    console.log(`${logPrefix}: Found ${playZoneIndicators.length} play zone indicators to clean`);
    
    playZoneIndicators.forEach((indicator, index) => {
      console.log(`${logPrefix}: Removing play zone indicator ${index + 1}/${playZoneIndicators.length}`);
      
      // Kill any ongoing animations
      gsap.killTweensOf(indicator.scale);
      gsap.killTweensOf(indicator);
      
      if (indicator.parent) {
        indicator.parent.removeChild(indicator);
        console.log(`${logPrefix}: ✅ Play zone indicator ${index + 1} removed from stage`);
      }
    });
    
    // Clear active zoom reference
    setActiveZoomContainer(null);
    console.log(`${logPrefix}: Cleanup initiated for ${zoomContainers.length} containers and ${playZoneIndicators.length} indicators`);
  }, [pixiApp]);

  // Callback to get the PIXI app instance when it's created
  const onAppInit = (app: PIXI.Application) => {
    console.log('🎨 VFX: PIXI App initialized', app);
    
    // CRITICAL: Enable z-index sorting for proper layering
    app.stage.sortableChildren = true;
    console.log('🎯 VFX: sortableChildren enabled for z-index support');
    
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
    
    // Initialize FloatingNumbers system
    floatingNumbersSystem.initialize(app);
    console.log('🔢 VFX: FloatingNumbersSystem initialized');
    
    // CRITICAL: Initialize LayerManager with PixiJS
    layerSystem.initPixi(app);
    console.log('🎯 VFX: LayerManager initialized with PixiJS layers');
    
    setPixiApp(app);
    
    // Register cleanup callback with VFXController
    vfxController.registerZoomCleanup(cleanupActiveZoom);
    console.log('🎮 VFX: Zoom cleanup callback registered with VFXController');
    
    console.log('🌨 VFX: Canvas setup complete - transparent background');
    console.log('🌨 VFX: Ready for sprite lifecycle tracking');
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
      child.label && child.label.startsWith('debug')
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
        circle.label = `debug-${basic.label}`;
        pixiApp.stage.addChild(circle);
        console.log(`🔴 VFX: Debug ${basic.label} at (${basic.x}, ${basic.y})`);
      });
    } else {
      console.log('🔴 VFX: DEBUG MODE OFF - Debug sprites removed');
    }
  }, [debugMode, pixiApp]);

  // Cleanup VFXController callback on unmount
  useEffect(() => {
    return () => {
      vfxController.unregisterZoomCleanup();
      console.log('🎮 VFX: Zoom cleanup callback unregistered on unmount');
    };
  }, []);
  
  // Global cleanup function for orphaned visual effects
  const globalCleanup = useCallback(() => {
    if (!pixiApp || !pixiApp.stage) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logPrefix = `[${timestamp}] 🧽 VFX.globalCleanup`;
    
    console.log(`${logPrefix}: Starting global cleanup of orphaned visual effects`);
    
    // Clean up play zone indicators
    const playZoneIndicators = pixiApp.stage.children.filter(child => 
      child.label && child.label === 'playZoneIndicator'
    );
    
    playZoneIndicators.forEach((indicator) => {
      console.log(`${logPrefix}: Removing orphaned play zone indicator`);
      gsap.killTweensOf(indicator.scale);
      gsap.killTweensOf(indicator);
      if (indicator.parent) {
        indicator.parent.removeChild(indicator);
      }
    });
    
    // Clean up any orphaned particles or trails
    const orphanedEffects = pixiApp.stage.children.filter(child => 
      child.label && (
        child.label.includes('trail') || 
        child.label.includes('particle') ||
        child.label.includes('indicator')
      )
    );
    
    orphanedEffects.forEach((effect) => {
      console.log(`${logPrefix}: Removing orphaned effect: ${effect.label}`);
      gsap.killTweensOf(effect);
      if (effect.parent) {
        effect.parent.removeChild(effect);
      }
    });
    
    console.log(`${logPrefix}: Cleaned ${playZoneIndicators.length} indicators and ${orphanedEffects.length} orphaned effects`);
  }, [pixiApp]);
  
  // Run global cleanup when game phase changes
  useEffect(() => {
    const cleanup = setTimeout(() => {
      globalCleanup();
    }, 500); // Small delay to let animations finish
    
    return () => clearTimeout(cleanup);
  }, [gameStateManager.phase, globalCleanup]);

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
                
                // Create a container to combine base and text to avoid Sprite.addChild deprecation
                const container = new PIXI.Container();
                const baseSprite = new PIXI.Sprite(app.renderer.generateTexture(graphics));
                container.addChild(baseSprite);
                
                const text = new PIXI.Text({
                  text: `${card.rank}${card.suit[0]}`,
                  style: {
                    fontSize: 16, 
                    fill: 0x000000, 
                    fontWeight: 'bold'
                  }
                });
                text.x = -40;
                text.y = -60;
                container.addChild(text);
                
                return app.renderer.generateTexture(container);
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
              // Enable pointer events in PixiJS v8
              sprite.eventMode = 'static';
              // Keep interactive for backward compatibility
              // @ts-ignore
              sprite.interactive = true;
              sprite.cursor = 'pointer'; // Make it clear cards are clickable
              
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
              let clickCount = 0;
              let clickTimer: number | null = null;
              const DOUBLE_CLICK_DELAY = 300; // ms
              
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
                    particle.label = `hover-particle-${i}`;
                    
                    // Usar LayerManager para partículas de hover
                    const addedToParticleLayer = layerSystem.addToPixi(GameLayer.PARTICLE_EFFECTS, particle);
                    if (!addedToParticleLayer) {
                      app.stage.addChild(particle); // Fallback
                    }
                    
                    gsap.to(particle, {
                      x: particle.x + (Math.random() - 0.5) * 60,
                      y: particle.y - Math.random() * 80 - 20,
                      alpha: 0,
                      duration: 0.8,
                      ease: 'power2.out',
                      onComplete: () => { 
                        if (particle.parent) {
                          particle.parent.removeChild(particle); 
                        }
                      }
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
                // Allow pointer interaction always, but show visual feedback for no AP
                if (gameStateManager.pa <= 0) {
                  console.log('⚠️ VFX: Low AP warning - allowing interaction but showing visual feedback');
                  
                  // Visual feedback for no AP - red pulse (but don't block interaction)
                  const noAPGlow = new GlowFilter({ distance: 15, outerStrength: 2, color: 0xff4444 });
                  sprite.filters = [noAPGlow];
                  
                  gsap.to(sprite.scale, { x: 0.9, y: 0.9, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
                  
                  setTimeout(() => {
                    const baseOutline = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                    sprite.filters = [baseOutline];
                  }, 300);
                  
                  // Continue with interaction instead of returning
                }
                
                dragData = e.data;
                dragging = true;
                
                // Store INITIAL click position for accurate drag detection
                (sprite as any).clickStartPosition = { x: sprite.x, y: sprite.y };
                // Keep original position separate (for return animations)
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
                  particle.label = `drag-start-particle-${i}`;
                  
                  // Usar LayerManager para partículas de inicio de drag
                  const addedToParticleLayer = layerSystem.addToPixi(GameLayer.PARTICLE_EFFECTS, particle);
                  if (!addedToParticleLayer) {
                    app.stage.addChild(particle); // Fallback
                  }
                  
                  gsap.to(particle, {
                    x: particle.x + (Math.random() - 0.5) * 100,
                    y: particle.y - Math.random() * 100 - 30,
                    alpha: 0,
                    scale: 0,
                    duration: 1.2,
                    ease: 'power2.out',
                    onComplete: () => { 
                      if (particle.parent) {
                        particle.parent.removeChild(particle); 
                      }
                    }
                  });
                }
              });

              sprite.on('pointerup', (_e: PIXI.FederatedPointerEvent) => {
                const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
                const logPrefix = `[${timestamp}] 🎯 VFX.pointerup`;
                
                // Handle double-click detection using INITIAL click position
                const wasDragging = dragging;
                const clickStartPos = (sprite as any).clickStartPosition || (sprite as any).originalPosition;
                const currentPos = { x: sprite.x, y: sprite.y };
                const dragDistance = Math.sqrt(Math.pow(currentPos.x - clickStartPos.x, 2) + Math.pow(currentPos.y - clickStartPos.y, 2));
                
                console.log(`${logPrefix}: Card ${card.id} released`, {
                  wasDragging,
                  dragDistance,
                  clickStartPos,
                  currentPos
                });
                
                // CRITICAL: Always cleanup play zone indicator on pointer up
                cleanupPlayZoneIndicator();
                
                dragging = false;
                dragData = null;
                
                // More generous threshold for click detection (accounts for hover movement)
                if (dragDistance < 50) {
                  clickCount++;
                  console.log(`${logPrefix}: Click detected (count: ${clickCount})`);
                  
                  if (clickCount === 1) {
                    // Start timer for double-click detection
                    clickTimer = setTimeout(() => {
                      console.log(`${logPrefix}: Single click confirmed after timeout`);
                      clickCount = 0;
                      clickTimer = null;
                    }, DOUBLE_CLICK_DELAY);
                  } else if (clickCount >= 2) {
                    // Double-click detected!
                    if (clickTimer) {
                      clearTimeout(clickTimer);
                      clickTimer = null;
                    }
                    clickCount = 0;
                    
                    console.log(`${logPrefix}: ✨ Double-click detected! Triggering card menu`);
                    vfxSystem.cardClick({ 
                      card, 
                      position: { x: sprite.x, y: sprite.y } 
                    });
                    
                    // Reset visual state for menu
                    const baseGlow = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                    sprite.filters = [baseGlow];
                    gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.2, ease: 'back.out(1.2)' });
                    
                    return;
                  }
                }
                
                // Enhanced zone detection for drag-to-play
                const cardCenterX = sprite.x;
                const cardCenterY = sprite.y;
                
                // Fixed canvas coordinates for 1280x800 layout
                // Play area is the central region above the hand
                const PLAY_AREA = {
                  left: 200,    // Left boundary
                  right: 1080,  // Right boundary  
                  top: 100,     // Top boundary
                  bottom: 500   // Bottom boundary (above hand area)
                };
                
                const isInPlayArea = (
                  cardCenterX >= PLAY_AREA.left && 
                  cardCenterX <= PLAY_AREA.right &&
                  cardCenterY >= PLAY_AREA.top && 
                  cardCenterY <= PLAY_AREA.bottom
                );
                
                // Special center zone for direct play (no menu)
                const CENTER_PLAY_ZONE = {
                  left: 540,   // Center - 100px
                  right: 740,  // Center + 100px
                  top: 200,    // 
                  bottom: 400  // 
                };
                
                const isInCenterPlayZone = (
                  cardCenterX >= CENTER_PLAY_ZONE.left && 
                  cardCenterX <= CENTER_PLAY_ZONE.right &&
                  cardCenterY >= CENTER_PLAY_ZONE.top && 
                  cardCenterY <= CENTER_PLAY_ZONE.bottom
                );
                
                console.log(`${logPrefix}: Zone detection`, {
                  cardPosition: { x: cardCenterX, y: cardCenterY },
                  playArea: PLAY_AREA,
                  centerZone: CENTER_PLAY_ZONE,
                  isInPlayArea,
                  isInCenterPlayZone,
                  dragDistance
                });
                
                // Priority 1: Check if card is dropped in CENTER ZONE for direct play
                if (isInCenterPlayZone && dragDistance > 20) {
                  console.log(`${logPrefix}: 🎯 Card dropped in CENTER ZONE - Playing directly!`);
                  
                  // Animate card to exact center and play
                  const centerX = 640;
                  const centerY = 300;
                  
                  gsap.to(sprite, {
                    x: centerX,
                    y: centerY,
                    scale: 1.2,
                    rotation: 0,
                    duration: 0.5,
                    ease: 'back.out(1.4)',
                    onComplete: () => {
                      // Execute card directly via Hand component
                      const handComponent = document.querySelector('[data-component="hand"]');
                      if (handComponent) {
                        const playEvent = new CustomEvent('direct-play-card', {
                          detail: { cardId: card.id, action: 'play' }
                        });
                        handComponent.dispatchEvent(playEvent);
                      }
                    }
                  });
                  
                  // Epic glow effect for center drop
                  const centerGlow = new GlowFilter({ distance: 25, outerStrength: 3, innerStrength: 1, color: 0x00ff88 });
                  sprite.filters = [centerGlow];
                  
                  return;
                }
                
                // Priority 2: Check if card is in general play area (show menu)
                if (isInPlayArea && dragDistance > 20) {
                  console.log(`${logPrefix}: 🎲 Card dragged to play area - triggering action menu`);
                  vfxSystem.cardClick({ 
                    card, 
                    position: { x: sprite.x, y: sprite.y } 
                  });
                  
                  // Return card to original position while menu is open
                  const originalPos = (sprite as any).originalPosition;
                  gsap.to(sprite, {
                    x: originalPos.x,
                    y: originalPos.y,
                    scale: 0.8,
                    rotation: 0,
                    duration: 0.4,
                    ease: 'back.out(1.4)'
                  });
                  
                  // Reset filters
                  const baseGlow = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                  sprite.filters = [baseGlow];
                  
                  return;
                }
                
                // Return to original position (card not in valid zone or minimal drag)
                console.log(`${logPrefix}: 🔄 Returning card to original position`);
                const origPos = (sprite as any).originalPosition;
                
                gsap.to(sprite, {
                  x: origPos.x,
                  y: origPos.y,
                  rotation: 0,
                  duration: 0.8,
                  ease: "elastic.out(1, 0.6)"
                });
                gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.4, ease: 'back.out(1.2)' });
                
                // Visual feedback for return
                const returnGlow = new GlowFilter({ distance: 12, outerStrength: 1.2, innerStrength: 0.3, color: 0xffaa00 });
                sprite.filters = [returnGlow];
                
                setTimeout(() => {
                  const baseOutline = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                  sprite.filters = [baseOutline];
                }, 400);
              });

              let trailTimer: number | null = null;
              
              let playZoneIndicator: PIXI.Graphics | null = null;
              
              // Function to safely clean up play zone indicator
              const cleanupPlayZoneIndicator = () => {
                if (playZoneIndicator) {
                  console.log('🦽 VFX: Cleaning up play zone indicator');
                  
                  // Cancelar todas las animaciones GSAP
                  gsap.killTweensOf(playZoneIndicator.scale);
                  gsap.killTweensOf(playZoneIndicator);
                  
                  // Remover del contenedor padre (ya sea LayerManager o stage)
                  if (playZoneIndicator.parent) {
                    playZoneIndicator.parent.removeChild(playZoneIndicator);
                    console.log('✅ VFX: Play zone indicator removed from parent container');
                  }
                  
                  playZoneIndicator = null;
                }
              };
              
              sprite.on('pointermove', () => {
                if (dragging && dragData) {
                  const parent = sprite.parent || app.stage;
                  const newPosition = dragData.getLocalPosition(parent);
                  sprite.x = newPosition.x;
                  sprite.y = newPosition.y;
                  
                  // Check if card is in center play zone and show indicator
                  const CENTER_ZONE = { left: 540, right: 740, top: 200, bottom: 400 };
                  const isInCenterZone = (
                    sprite.x >= CENTER_ZONE.left && sprite.x <= CENTER_ZONE.right &&
                    sprite.y >= CENTER_ZONE.top && sprite.y <= CENTER_ZONE.bottom
                  );
                  
                  // Show/hide play zone indicator
                  if (isInCenterZone && !playZoneIndicator) {
                    // Create center play zone indicator with enhanced visibility
                    playZoneIndicator = new PIXI.Graphics()
                      // Outer ring - más brillante
                      .circle(640, 300, 100)
                      .stroke({ width: 6, color: 0x00ff88, alpha: 1.0 })
                      // Middle ring
                      .circle(640, 300, 80)
                      .stroke({ width: 4, color: 0x00ff88, alpha: 0.8 })
                      // Inner ring
                      .circle(640, 300, 60)
                      .stroke({ width: 2, color: 0x00ff88, alpha: 0.6 })
                      // Center fill - más visible
                      .circle(640, 300, 50)
                      .fill({ color: 0x00ff88, alpha: 0.2 })
                      // Punto central
                      .circle(640, 300, 8)
                      .fill({ color: 0x00ff88, alpha: 0.9 });
                    
                    // Usar LayerManager para z-index correcto
                    const indicatorZIndex = layerSystem.get(GameLayer.UI_INDICATORS, true); // Traer al frente
                    playZoneIndicator.zIndex = indicatorZIndex;
                    playZoneIndicator.label = 'playZoneIndicator';
                    playZoneIndicator.eventMode = 'none'; // No interceptar eventos
                    
                    // Agregar a la capa correcta usando LayerManager
                    const addedToLayer = layerSystem.addToPixi(GameLayer.UI_INDICATORS, playZoneIndicator);
                    if (!addedToLayer) {
                      // Fallback: agregar directamente al stage
                      app.stage.addChild(playZoneIndicator);
                      console.log('⚠️ VFX: Indicador agregado directamente al stage como fallback');
                    }
                    
                    // Pulsing animation con más visibilidad
                    gsap.to(playZoneIndicator.scale, {
                      x: 1.3, y: 1.3, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut'
                    });
                    
                    // Animación de rotación sutil para más visibilidad
                    gsap.to(playZoneIndicator, {
                      rotation: Math.PI * 2, duration: 2, repeat: -1, ease: 'linear'
                    });
                    
                    console.log('✨ VFX: Play zone indicator created with LayerManager');
                    console.log('🔍 VFX: Indicator details:', {
                      zIndex: indicatorZIndex,
                      layer: 'UI_INDICATORS',
                      position: { x: 640, y: 300 },
                      visible: playZoneIndicator.visible,
                      alpha: playZoneIndicator.alpha,
                      parent: playZoneIndicator.parent?.label || 'stage'
                    });
                    
                  } else if (!isInCenterZone && playZoneIndicator) {
                    // Remove indicator when card leaves zone
                    cleanupPlayZoneIndicator();
                  }
                  
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
                      trail.label = `trail-particle-${i}`;
                      
                      // Usar LayerManager para partículas
                      const addedToParticleLayer = layerSystem.addToPixi(GameLayer.PARTICLE_EFFECTS, trail);
                      if (!addedToParticleLayer) {
                        // Fallback: agregar directamente al stage
                        app.stage.addChild(trail);
                      }
                      
                      gsap.to(trail, {
                        alpha: 0,
                        scale: 0,
                        y: trail.y + 20,
                        duration: 0.4,
                        ease: 'power2.out',
                        onComplete: () => { 
                          if (trail.parent) {
                            trail.parent.removeChild(trail); 
                          }
                        }
                      });
                    }
                    trailTimer = null;
                  }, 50);
                  
                  // This cleanup is now handled by the cleanupPlayZoneIndicator function
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
              
              // Usar LayerManager para las cartas
              const addedToCardLayer = layerSystem.addToPixi(GameLayer.CARDS_IDLE, sprite);
              if (!addedToCardLayer) {
                // Fallback: agregar directamente al stage
                const childrenBefore = app.stage.children.length;
                app.stage.addChild(sprite);
                const childrenAfter = app.stage.children.length;
                console.log(`⚠️ VFX: Card sprite added directly to stage (fallback) - Stage children: ${childrenBefore} -> ${childrenAfter}`);
              } else {
                console.log(`✅ VFX: Card sprite added to CARDS_IDLE layer via LayerManager`);
              }
              
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

            gsap.to(wave.scale, {
                x: 10,
                y: 10,
                duration: 1,
                ease: 'power2.out'
            });
            gsap.to(wave, {
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
            ecoSprite.zIndex = 9000; // Z-index alto para aparecer encima de cartas ECO
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
              gsap.to(wave.scale, { x: 8, y: 8, duration: 0.6, ease: 'power2.out' });
              gsap.to(wave, { alpha: 0, duration: 0.6, ease: 'power2.out', onComplete: () => { app.stage.removeChild(wave); } });
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
        
        case 'ecoDiscardCard': {
          const discardData = event.data as VFXEventData['ecoDiscardCard'];
          const { card, position } = discardData;
          console.log('🔥 VFX: ECO discard card with fire effect for', card.rank, card.suit);
          
          // Create a temporary sprite to represent the card being discarded
          const discardTexture = new PIXI.Graphics()
            .rect(0, 0, 108, 150)
            .fill(0x1f2937)
            .rect(4, 4, 100, 142)
            .stroke({ width: 2, color: 0xb91c1c });
          const texture = app.renderer.generateTexture(discardTexture);
          const discardSprite = new PIXI.Sprite(texture);
          
          discardSprite.anchor.set(0.5);
          discardSprite.x = position.x;
          discardSprite.y = position.y;
          discardSprite.scale.set(1);
          discardSprite.zIndex = 15000; // MUY ALTO para estar encima de TODO
          
          app.stage.addChild(discardSprite);
          
          // Crear partículas de fuego
          const fireParticles: PIXI.Graphics[] = [];
          for (let i = 0; i < 25; i++) {
            const fireParticle = new PIXI.Graphics();
            const size = 3 + Math.random() * 4;
            const color = Math.random() > 0.5 ? 0xff4444 : (Math.random() > 0.5 ? 0xff8800 : 0xffaa00);
            
            fireParticle.circle(0, 0, size).fill(color);
            fireParticle.x = position.x + (Math.random() - 0.5) * 80;
            fireParticle.y = position.y + (Math.random() - 0.5) * 100;
            fireParticle.alpha = 0.8 + Math.random() * 0.2;
            fireParticle.zIndex = 15100; // Alto para estar encima
            
            app.stage.addChild(fireParticle);
            fireParticles.push(fireParticle);
          }
          
          // Animación de la carta - shake y fade
          gsap.to(discardSprite, {
            alpha: 0,
            duration: 1.2,
            ease: 'power2.out'
          });
          
          // Shake effect en la carta
          gsap.to(discardSprite, {
            rotation: 0.1,
            duration: 0.1,
            yoyo: true,
            repeat: 8,
            ease: 'power2.inOut'
          });
          
          // Animación de partículas de fuego
          fireParticles.forEach((particle) => {
            const delay = Math.random() * 0.3;
            const duration = 0.8 + Math.random() * 0.6;
            
            // Movimiento hacia arriba con dispersión
            gsap.to(particle, {
              y: particle.y - Math.random() * 80 - 40,
              x: particle.x + (Math.random() - 0.5) * 60,
              alpha: 0,
              scale: 0.2,
              duration: duration,
              delay: delay,
              ease: 'power2.out',
              onComplete: () => { 
                app.stage.removeChild(particle);
              }
            });
            
            // Pulsación de fuego
            gsap.to(particle.scale, {
              x: 1.3,
              y: 1.3,
              duration: 0.2,
              delay: delay,
              yoyo: true,
              repeat: 2,
              ease: 'sine.inOut'
            });
          });
          
          // Efecto de calor - ondas de distorsión
          const heatWave = new PIXI.Graphics()
            .circle(0, 0, 60)
            .stroke({ width: 3, color: 0xff6600, alpha: 0.6 });
          heatWave.x = position.x;
          heatWave.y = position.y;
          heatWave.zIndex = 15050; // Alto para estar encima
          app.stage.addChild(heatWave);
          
          gsap.to(heatWave.scale, {
            x: 2,
            y: 2,
            duration: 1,
            ease: 'power2.out'
          });
          gsap.to(heatWave, {
            alpha: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
              app.stage.removeChild(heatWave);
              app.stage.removeChild(discardSprite);
            }
          });
          
          // Sonido de fuego (opcional - se puede agregar después)
          console.log('🔥 VFX: Fire effect completed for ECO discard');
          
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
          repairRing.label = 'repair-ring';
          
          // Usar LayerManager para efectos de reparación
          const addedToEffectsLayer = layerSystem.addToPixi(GameLayer.SCREEN_EFFECTS, repairRing);
          if (!addedToEffectsLayer) {
            app.stage.addChild(repairRing); // Fallback
          }
          
          // Expanding ring animation
          gsap.to(repairRing.scale, {
            x: 3,
            y: 3,
            duration: 0.8,
            ease: 'power2.out'
          });
          gsap.to(repairRing, {
            alpha: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => { 
              if (repairRing.parent) {
                repairRing.parent.removeChild(repairRing);
              }
            }
          });
          
          // Repair particles rising upward
          for (let i = 0; i < 12; i++) {
            const particle = new PIXI.Graphics().circle(0, 0, 3).fill(0x10b981);
            particle.x = position.x + (Math.random() - 0.5) * 40;
            particle.y = position.y + (Math.random() - 0.5) * 40;
            particle.alpha = 0.9;
            particle.label = `repair-particle-${i}`;
            
            // Usar LayerManager para partículas de reparación
            const addedToParticleLayer = layerSystem.addToPixi(GameLayer.PARTICLE_EFFECTS, particle);
            if (!addedToParticleLayer) {
              app.stage.addChild(particle); // Fallback
            }
            
            gsap.to(particle, {
              x: particle.x + (Math.random() - 0.5) * 20,
              y: particle.y - Math.random() * 60 - 30,
              alpha: 0,
              scale: 0.2,
              duration: 1.2,
              delay: Math.random() * 0.3,
              ease: 'power2.out',
              onComplete: () => { 
                if (particle.parent) {
                  particle.parent.removeChild(particle);
                }
              }
            });
          }
          
          // Repair amount text popup
          const repairText = new PIXI.Text({
            text: `+${repairAmount}%`,
            style: {
              fontSize: 24,
              fill: 0x22c55e,
              fontWeight: 'bold',
              stroke: { color: 0x000000, width: 2 }
            }
          });
          repairText.anchor.set(0.5);
          repairText.x = position.x;
          repairText.y = position.y - 20;
          repairText.alpha = 0;
          repairText.label = 'repair-text';
          
          // Usar LayerManager para floating text de reparación
          const addedToFloatingLayer2 = layerSystem.addToPixi(GameLayer.FLOATING_UI, repairText);
          if (!addedToFloatingLayer2) {
            app.stage.addChild(repairText); // Fallback
          }
          
          gsap.to(repairText, { alpha: 1, y: position.y - 50, duration: 0.5, ease: 'back.out(1.6)' });
          gsap.to(repairText, { 
            alpha: 0, 
            duration: 0.4, 
            delay: 1, 
            onComplete: () => { 
              if (repairText.parent) {
                repairText.parent.removeChild(repairText);
              }
            }
          });
          
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
          damageBlast.label = 'damage-blast';
          
          // Usar LayerManager para efectos de explosión
          const addedToScreenEffectsLayer = layerSystem.addToPixi(GameLayer.SCREEN_EFFECTS, damageBlast);
          if (!addedToScreenEffectsLayer) {
            app.stage.addChild(damageBlast); // Fallback
          }
          
          // Expanding blast animation
          gsap.to(damageBlast.scale, {
            x: 4,
            y: 4,
            duration: 0.6,
            ease: 'power2.out'
          });
          gsap.to(damageBlast, {
            alpha: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => { 
              if (damageBlast.parent) {
                damageBlast.parent.removeChild(damageBlast);
              }
            }
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
            debris.label = `damage-debris-${i}`;
            
            // Usar LayerManager para partículas de escombros
            const addedToParticleLayer = layerSystem.addToPixi(GameLayer.PARTICLE_EFFECTS, debris);
            if (!addedToParticleLayer) {
              app.stage.addChild(debris); // Fallback
            }
            
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
              onComplete: () => { 
                if (debris.parent) {
                  debris.parent.removeChild(debris);
                }
              }
            });
          }
          
          // Damage amount text popup
          const damageText = new PIXI.Text({
            text: `-${damageAmount}%`,
            style: {
              fontSize: 24,
              fill: 0xef4444,
              fontWeight: 'bold',
              stroke: { color: 0x000000, width: 2 }
            }
          });
          damageText.anchor.set(0.5);
          damageText.x = position.x;
          damageText.y = position.y - 20;
          damageText.alpha = 0;
          damageText.label = 'damage-text';
          
          // Usar LayerManager para floating text
          const addedToFloatingLayer = layerSystem.addToPixi(GameLayer.FLOATING_UI, damageText);
          if (!addedToFloatingLayer) {
            app.stage.addChild(damageText); // Fallback
          }
          
          gsap.to(damageText, { alpha: 1, y: position.y - 50, duration: 0.5, ease: 'back.out(1.6)' });
          gsap.to(damageText, { 
            alpha: 0, 
            duration: 0.4, 
            delay: 1, 
            onComplete: () => { 
              if (damageText.parent) {
                damageText.parent.removeChild(damageText); 
              }
            } 
          });
          
          break;
        }
        
        case 'cardClick': {
          const clickData = event.data as { card: any; position: { x: number; y: number } };
          const { card } = clickData;
          console.log('🔍 VFX: Card click - creating zoom view for', card.rank, card.suit, 'with imageFile:', card.imageFile);
          
          // Create a container to hold the zoom elements
          const zoomContainer = new PIXI.Container();
          zoomContainer.x = 640;
          zoomContainer.y = 400;
          zoomContainer.scale.set(0.1);
          zoomContainer.alpha = 0;
          zoomContainer.label = 'cardZoomContainer'; // PixiJS v8 syntax
          
          // Create fallback background first
          const fallbackBg = new PIXI.Graphics()
            .rect(-150, -210, 300, 420)
            .fill(0x2a2a3a)
            .rect(-142, -202, 284, 404)
            .stroke({ width: 4, color: 0x4a90e2 });
          fallbackBg.label = 'zoomFallbackBg';
          
          // Create fallback text with PixiJS v8 syntax
          const fallbackText = new PIXI.Text({
            text: `${card.rank} of ${card.suit}`,
            style: {
              fontSize: 28,
              fill: 0xffffff,
              fontWeight: 'bold',
              align: 'center'
            }
          });
          fallbackText.anchor.set(0.5);
          fallbackText.x = 0;
          fallbackText.y = 0;
          fallbackText.label = 'zoomFallbackText';
          
          // Add fallback elements to container
          zoomContainer.addChild(fallbackBg);
          zoomContainer.addChild(fallbackText);
          
          // Add glow effect to container
          try {
            zoomContainer.filters = [new GlowFilter({ distance: 20, outerStrength: 2, color: 0x4a90e2 })];
          } catch (error) {
            console.warn('⚠️ VFX: Zoom container GlowFilter failed:', error);
            zoomContainer.filters = [];
          }
          
          // Usar LayerManager para zoom containers
          const addedToZoomLayer = layerSystem.addToPixi(GameLayer.CARDS_SELECTED, zoomContainer);
          if (!addedToZoomLayer) {
            // Fallback: agregar directamente al stage
            app.stage.addChild(zoomContainer);
            console.log('⚠️ VFX: Zoom container added directly to stage (fallback)');
          } else {
            console.log('✅ VFX: Zoom container added to CARDS_SELECTED layer via LayerManager');
          }
          
          // Try to load real card texture
          const imagePath = `/images/decks/default/${card.imageFile}`;
          console.log('🔍 VFX: Loading card image from:', imagePath);
          
          PIXI.Assets.load(imagePath)
            .then((cardTexture) => {
              console.log('🔍 VFX: Real texture loaded successfully for', card.rank, card.suit);
              
              // Only update if the container still exists
              if (zoomContainer.parent) {
                // Create real card sprite
                const realCardSprite = new PIXI.Sprite(cardTexture);
                realCardSprite.anchor.set(0.5);
                realCardSprite.width = 300;
                realCardSprite.height = 420;
                realCardSprite.x = 0;
                realCardSprite.y = 0;
                realCardSprite.label = 'zoomRealCard';
                
                // Clear fallback elements and add real card
                zoomContainer.removeChildren();
                zoomContainer.addChild(realCardSprite);
                
                console.log('🔍 VFX: Real card sprite added to zoom container');
              }
            })
            .catch((error) => {
              console.warn('⚠️ VFX: Could not load real texture for', card.rank, card.suit, '- using fallback. Error:', error);
            });
          
          // Animate container in
          gsap.to(zoomContainer, {
            scale: 1,
            alpha: 1,
            duration: 0.4,
            ease: 'back.out(1.6)'
          });
          
          // NO auto-hide - zoom persists until user takes action from context menu
          // The zoom will be removed when the context menu closes
          console.log('🔍 VFX: Zoom created, will persist until context menu action');
          
          // Store zoom container reference for manual cleanup
          (zoomContainer as any).cardId = card.id;
          setActiveZoomContainer(zoomContainer);
          console.log('🔍 VFX: Zoom container stored for future cleanup');
          
          break;
        }
        
        default:
          console.warn('Unknown VFX event type:', event.type);
      }
    };

    const unsubscribe = vfxSystem.subscribe(handleVFXEvent);
    return unsubscribe;
  }, [pixiCards, pixiApp]);
  
  // Register zoom cleanup callback with VFXController
  useEffect(() => {
    if (pixiApp) {
      console.log('🎆 VFX: Registering zoom cleanup callback with VFXController');
      vfxController.registerZoomCleanup(cleanupActiveZoom);
      
      return () => {
        console.log('🎆 VFX: Unregistering zoom cleanup callback from VFXController');
        vfxController.unregisterZoomCleanup();
      };
    }
  }, [pixiApp, cleanupActiveZoom]);

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
        zIndex: debugToolsLayer.zIndex, // Gestionado por LayerManager
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
        zIndex: vfxLayer.zIndex, // Gestionado por LayerManager
        pointerEvents: 'auto' // Necesario para interacción con cartas
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
        zIndex: debugToolsLayer.zIndex, // Gestionado por LayerManager
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