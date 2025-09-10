// src/components/VFX.tsx

import React, { useState, useEffect } from 'react';
import { Application } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { GlowFilter } from 'pixi-filters';
import { vfxSystem } from '../engine/VFXSystem';
import type { VFXEvent, VFXEventType, VFXEventData } from '../engine/VFXSystem';
import type { Card as CardType } from '../engine/types';
import { turnManager } from '../engine/TurnManager';
import { gameStateManager } from '../engine/GameStateManager';
import { uiPositionManager } from '../engine/UIPositionManager';

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

  // Handle window resize to adjust canvas size
  useEffect(() => {
    if (!pixiApp) return;
    
    const handleResize = () => {
      console.log('🎨 VFX: Window resized, updating canvas size');
      pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pixiApp]);

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
          // DEPRECATED: dealCard now only logs, all sprite creation and animation handled by updateHand
          const dealData = event.data as {
            card: CardType;
            startPosition: { x: number; y: number };
            endPosition: { x: number; y: number };
            delay: number;
          };

          const { card } = dealData;
          console.log('🎴 VFX: dealCard event received for', card.rank, card.suit, '- updateHand will handle creation and animation');
          
          // All sprite creation and animation is now handled by updateHand event
          // This event is now essentially a no-op to avoid race conditions
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
              console.log('🎨 VFX: Anchor set, positioning sprite');
              
              // CRITICAL: Set position IMMEDIATELY to avoid flash at (0,0)
              sprite.x = position.x;
              sprite.y = position.y;
              console.log('🎨 VFX: Position set to:', sprite.x, sprite.y);
              console.log('🎨 VFX: Position should be:', position.x, position.y);
              
              sprite.rotation = rotation;
              sprite.scale.set(0.8);
              sprite.interactive = true;
              console.log('🎨 VFX: Final sprite position before adding to stage:', sprite.x, sprite.y);

              let dragging = false;
              let dragData: PIXI.FederatedPointerEvent | null = null;
              
              // Store original position directly on the sprite to avoid closure/state issues
              (sprite as any).originalPosition = { x: position.x, y: position.y };
              console.log('🌨 VFX: Original card position set to:', (sprite as any).originalPosition);

              sprite.on('pointerover', () => {
                if (!dragging) {
                  console.log('🎭 VFX: Hover ON - card', card.rank, card.suit, 'moving from y:', sprite.y, 'to y:', sprite.y - 30);
                  gsap.to(sprite.scale, { x: 0.9, y: 0.9, duration: 0.2 });
                  gsap.to(sprite, { y: sprite.y - 30, duration: 0.2 });
                  sprite.filters = [new GlowFilter({ distance: 15, outerStrength: 1, color: 0xffffff })];
                }
              });

              sprite.on('pointerout', () => {
                if (!dragging) {
                  gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.2 });
                  // Use the originalPosition stored directly on the sprite
                  const targetY = (sprite as any).originalPosition.y;
                  console.log('🎭 VFX: Hover OFF - card', card.rank, card.suit, 'returning from y:', sprite.y, 'to y:', targetY);
                  gsap.to(sprite, { y: targetY, duration: 0.2 });
                  sprite.filters = [];
                }
              });

              sprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                dragData = e.data;
                dragging = true;
                // Update original position when drag starts
                (sprite as any).originalPosition = { x: sprite.x, y: sprite.y };
                gsap.to(sprite.scale, { x: 1, y: 1, duration: 0.2 });
                sprite.filters = [new GlowFilter({ distance: 15, outerStrength: 2, color: 0x00ffcc })];
                // Move to front without re-adding
                if (sprite.parent) {
                  sprite.parent.setChildIndex(sprite, sprite.parent.children.length - 1);
                }
              });

              sprite.on('pointerup', () => {
                dragging = false;
                dragData = null;
                sprite.filters = [];

                const playAreaRect = uiPositionManager.get('playArea');
                if (playAreaRect && playAreaRect.height !== undefined && sprite.y < playAreaRect.y + playAreaRect.height / 2) {
                  turnManager.playCard(card);
                } else {
                  // Return to stored original position
                  const origPos = (sprite as any).originalPosition;
                  gsap.to(sprite, {
                    x: origPos.x,
                    y: origPos.y,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.4)"
                  });
                  gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.2 });
                }
              });

              sprite.on('pointermove', () => {
                if (dragging && dragData) {
                  const parent = sprite.parent || app.stage;
                  const newPosition = dragData.getLocalPosition(parent);
                  sprite.x = newPosition.x;
                  sprite.y = newPosition.y;
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
      }
    };

    const unsubscribe = vfxSystem.subscribe(handleVFXEvent);
    return unsubscribe;
  }, [pixiCards, pixiApp]);

  if (debugMode) {
    return (
      <div className="debug-vfx" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
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
          DEBUG MODE - PixiJS Canvas Area
        </div>
        <Application 
          width={window.innerWidth} 
          height={window.innerHeight}
          backgroundAlpha={0}
          antialias={false}
          clearBeforeRender={false}
          onInit={onAppInit}
        />
      </div>
    );
  }

  return (
    <>
      <div className="vfx-layer" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 20,
        pointerEvents: 'auto'
      }}>
        <Application 
          width={window.innerWidth} 
          height={window.innerHeight}
          backgroundAlpha={0}
          antialias={false}
          clearBeforeRender={false}
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