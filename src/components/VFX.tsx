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

  // Callback to get the PIXI app instance when it's created
  const onAppInit = (app: PIXI.Application) => {
    console.log('🎨 VFX: PIXI App initialized', app);
    setPixiApp(app);
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

  useEffect(() => {
    if (!pixiApp) return;

    const handleVFXEvent = (event: VFXEvent<VFXEventType>) => {
      console.log('🎨 VFX: Received event', event.type, event.data);
      const app = pixiApp;
      if (!app?.stage) {
        console.warn('⚠️ VFX: No PIXI app or stage available');
        return;
      }

      switch (event.type) {
        case 'dealCard': {
          // This case will now primarily handle the initial animation of a card being dealt
          // The 'updateHand' case will manage its ongoing position in the hand.
          const dealData = event.data as {
            card: CardType;
            startPosition: { x: number; y: number };
            endPosition: { x: number; y: number };
            delay: number;
          };

          const { card, startPosition, endPosition, delay } = dealData;

          // If the card already exists as a PixiSprite, just update its position
          if (pixiCards[card.id]) {
            const sprite = pixiCards[card.id].sprite;
            gsap.to(sprite, {
              x: endPosition.x,
              y: endPosition.y,
              rotation: 0,
              duration: 0.8,
              ease: 'back.out(1.7)',
              delay: delay,
            });
            // Update original position in pixiCards state
            setPixiCards(prev => ({
              ...prev,
              [card.id]: { ...prev[card.id], originalPosition: { x: endPosition.x, y: endPosition.y } }
            }));
            break;
          }

          // Create fallback texture first
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
          const fallbackTexture = createFallbackTexture();
          const texture = fallbackTexture;
          
          // Try to load real image asynchronously
          PIXI.Assets.load(`/images/decks/default/${card.imageFile}`)
            .then((loadedTexture) => {
              sprite.texture = loadedTexture;
            })
            .catch((_error) => {
              console.log(`Could not load ${card.imageFile}, using fallback`);
              // Keep the fallback texture
            });
          const sprite = new PIXI.Sprite(texture);
          sprite.anchor.set(0.5);
          sprite.x = startPosition.x;
          sprite.y = startPosition.y;
          sprite.rotation = -1;
          sprite.scale.set(0.8); // Smaller scale for dealt cards initially

          // Make card interactive
          sprite.interactive = true;

          let dragging = false;
          let dragData: PIXI.FederatedPointerEvent | null = null;
          let originalCardPosition = { x: startPosition.x, y: startPosition.y }; // Store original position for drag return

          sprite.on('pointerover', () => {
            if (!dragging) {
              gsap.to(sprite.scale, { x: 0.9, y: 0.9, duration: 0.2 });
              gsap.to(sprite, { y: sprite.y - 30, duration: 0.2 });
              sprite.filters = [new GlowFilter({ distance: 15, outerStrength: 1, color: 0xffffff })];
            }
          });

          sprite.on('pointerout', () => {
            if (!dragging) {
              gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.2 });
              gsap.to(sprite, { y: originalCardPosition.y, duration: 0.2 });
              sprite.filters = [];
            }
          });

          sprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
            dragData = e.data;
            dragging = true;
            originalCardPosition = { x: sprite.x, y: sprite.y }; // Save current position as original
            gsap.to(sprite.scale, { x: 1, y: 1, duration: 0.2 });
            sprite.filters = [new GlowFilter({ distance: 15, outerStrength: 2, color: 0x00ffcc })];
            app.stage.addChild(sprite); // Bring to front
          });

          sprite.on('pointerup', () => {
            dragging = false;
            dragData = null;
            sprite.filters = [];

            const playAreaRect = uiPositionManager.get('playArea');
            if (playAreaRect && playAreaRect.height !== undefined && sprite.y < playAreaRect.y + playAreaRect.height / 2) {
              // Card played
              turnManager.playCard(card); // This will eventually remove the card from hand
            } else {
              // Return to hand
              gsap.to(sprite, {
                x: originalCardPosition.x,
                y: originalCardPosition.y,
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

          app.stage.addChild(sprite);

          gsap.to(sprite, {
            x: endPosition.x,
            y: endPosition.y,
            rotation: 0,
            duration: 0.8,
            ease: 'back.out(1.7)',
            delay: delay,
            onComplete: (() => {
              const newPixiCard = { sprite, card, originalPosition: { x: endPosition.x, y: endPosition.y } };
              setPixiCards(prev => ({ ...prev, [card.id]: newPixiCard }));
            }) as () => void
          });
          break;
        }

        case 'updateHand': {
          console.log('🎨 VFX: Processing updateHand event');
          const updateHandData = event.data as VFXEventData['updateHand'];
          const newHandCards = updateHandData.cards;
          console.log('🎨 VFX: updateHand - received', newHandCards.length, 'cards:', newHandCards.map(c => `${c.card.rank}${c.card.suit[0]} at (${c.position.x}, ${c.position.y})`));

          const currentPixiCardIds = new Set(Object.keys(pixiCards));
          const newHandCardIds = new Set(newHandCards.map((c: { card: CardType; }) => c.card.id));
          console.log('🎨 VFX: Current pixiCards keys:', Array.from(currentPixiCardIds));
          console.log('🎨 VFX: New hand card IDs:', Array.from(newHandCardIds));

          // Remove cards no longer in hand
          for (const cardId of currentPixiCardIds) {
            if (!newHandCardIds.has(cardId)) {
              const cardToDiscard = pixiCards[cardId];
              if (cardToDiscard && app.stage) {
                gsap.to(cardToDiscard.sprite, {
                  alpha: 0,
                  y: cardToDiscard.sprite.y + 100, // Animate downwards
                  duration: 0.4,
                  onComplete: () => {
                    const currentStage = app.stage;
                    if (currentStage) {
                      currentStage.removeChild(cardToDiscard.sprite);
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

          // Add or update cards in hand
          newHandCards.forEach((handCardData: { card: CardType; position: { x: number; y: number; }; rotation: number; delay: number; }) => {
            const { card, position, rotation, delay } = handCardData;
            let sprite = pixiCards[card.id]?.sprite;

            if (!sprite) {
              console.log('🎨 VFX: Creating new sprite for card', card.rank, card.suit, 'at position', position);
              // Create fallback texture for new cards
              const createFallbackTexture = () => {
                const graphics = new PIXI.Graphics()
                  .rect(0, 0, 120, 160)
                  .fill(0x2a2a3a)
                  .rect(5, 5, 110, 150)
                  .stroke({ width: 2, color: 0x4a90e2 })
                  .rect(15, 20, 90, 20)
                  .fill(0xffffff);
                
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
              
              // Create new sprite with fallback texture
              const fallbackTexture = createFallbackTexture();
              sprite = new PIXI.Sprite(fallbackTexture);
              
              // Try to load real image asynchronously
              PIXI.Assets.load(`/images/decks/default/${card.imageFile}`)
                .then((loadedTexture) => {
                  if (sprite) {
                    sprite.texture = loadedTexture;
                  }
                })
                .catch((_error) => {
                  console.log(`Could not load ${card.imageFile} in updateHand, using fallback`);
                });
              sprite.anchor.set(0.5);
              sprite.x = position.x;
              sprite.y = position.y; // Use correct position directly
              sprite.rotation = rotation;
              sprite.scale.set(0.8);
              sprite.interactive = true;
              console.log('🎨 VFX: Sprite positioned at', sprite.x, sprite.y, 'should be visible');

              let dragging = false;
              let dragData: PIXI.FederatedPointerEvent | null = null;
              let originalCardPosition = { x: position.x, y: position.y };

              sprite.on('pointerover', () => {
                if (!dragging) {
                  gsap.to(sprite.scale, { x: 0.9, y: 0.9, duration: 0.2 });
                  gsap.to(sprite, { y: sprite.y - 30, duration: 0.2 });
                  sprite.filters = [new GlowFilter({ distance: 15, outerStrength: 1, color: 0xffffff })];
                }
              });

              sprite.on('pointerout', () => {
                if (!dragging) {
                  gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.2 });
                  gsap.to(sprite, { y: originalCardPosition.y, duration: 0.2 });
                  sprite.filters = [];
                }
              });

              sprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                dragData = e.data;
                dragging = true;
                originalCardPosition = { x: sprite.x, y: sprite.y };
                gsap.to(sprite.scale, { x: 1, y: 1, duration: 0.2 });
                sprite.filters = [new GlowFilter({ distance: 15, outerStrength: 2, color: 0x00ffcc })];
                app.stage.addChild(sprite); // Bring to front
              });

              sprite.on('pointerup', () => {
                dragging = false;
                dragData = null;
                sprite.filters = [];

                const playAreaRect = uiPositionManager.get('playArea');
                if (playAreaRect && playAreaRect.height !== undefined && sprite.y < playAreaRect.y + playAreaRect.height / 2) {
                  turnManager.playCard(card);
                } else {
                  gsap.to(sprite, {
                    x: originalCardPosition.x,
                    y: originalCardPosition.y,
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

              console.log('🎨 VFX: Adding sprite to stage for card', card.rank, card.suit, 'sprite position:', sprite.x, sprite.y);
              app.stage.addChild(sprite);
              setPixiCards(prev => ({ ...prev, [card.id]: { sprite, card, originalPosition: { x: position.x, y: position.y } } }));
              console.log('🎨 VFX: Sprite added to stage, total children:', app.stage.children.length);

              // Simple fade in animation
              sprite.alpha = 0;
              gsap.to(sprite, {
                alpha: 1,
                duration: 0.3,
                delay: delay,
                ease: 'power2.out',
              });

            } else {
              console.log('🎨 VFX: Updating existing sprite for card', card.rank, card.suit, 'from', sprite.x, sprite.y, 'to', position.x, position.y);
              // Update existing sprite's position
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

  return (
    <div className="vfx-layer absolute inset-0 z-20">
      <Application 
        width={window.innerWidth} 
        height={window.innerHeight}
        onInit={onAppInit}
      />
    </div>
  );
};