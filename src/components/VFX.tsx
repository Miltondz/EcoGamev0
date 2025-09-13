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
// import { uiPositionManager } from '../engine/UIPositionManager'; // No se usa actualmente
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
   * ✅ SIGUIENDO MEJORES PRÁCTICAS PIXI.JS v8
   * - Destrucción completa de DisplayObjects con destroy()
   * - Limpieza de texturas generadas
   * - Limpieza de event listeners
   * - Cleanup síncrono para evitar timing issues
   * - Búsqueda optimizada solo en capas relevantes
   */
  const cleanupActiveZoom = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logPrefix = `[${timestamp}] 🧽 VFX.cleanupActiveZoom`;
    
    console.log(`${logPrefix}: Starting PIXI.js v8 compliant zoom cleanup`);
    
    if (!pixiApp || !pixiApp.stage) {
      console.warn(`${logPrefix}: No PIXI app available for cleanup`);
      return;
    }
    
    // ✅ OPTIMIZACIÓN: Buscar solo en capas relevantes, no en todo el stage
    const findZoomContainersInLayer = (layer: PIXI.Container): PIXI.Container[] => {
      const found: PIXI.Container[] = [];
      
      // Direct children check (más eficiente que recursivo)
      layer.children.forEach(child => {
        if (child instanceof PIXI.Container && child.label && 
            child.label.startsWith('cardZoomContainer')) {
          found.push(child);
          console.log(`${logPrefix}: Found zoom container: ${child.label}`);
        }
      });
      
      return found;
    };
    
    let allZoomContainers: PIXI.Container[] = [];
    
    // ✅ BÚSQUEDA OPTIMIZADA: Solo en stage y capas específicas
    // 1. Buscar directamente en stage (fallback containers)
    pixiApp.stage.children.forEach(child => {
      if (child instanceof PIXI.Container && child.label && 
          child.label.startsWith('cardZoomContainer')) {
        allZoomContainers.push(child);
        console.log(`${logPrefix}: Found direct stage zoom container: ${child.label}`);
      }
      
      // 2. Buscar en capa FLOATING_UI (donde se crean los zooms)
      if (child instanceof PIXI.Container && child.label === 'layer-FLOATING_UI') {
        const layerZooms = findZoomContainersInLayer(child);
        allZoomContainers = allZoomContainers.concat(layerZooms);
        console.log(`${logPrefix}: Found ${layerZooms.length} zoom containers in FLOATING_UI layer`);
      }
    });
    
    console.log(`${logPrefix}: Found ${allZoomContainers.length} total zoom containers for cleanup`);
    
    // ✅ CLEANUP SÍNCRONO Y COMPLETO - Sin animaciones
    let cleanedCount = 0;
    allZoomContainers.forEach((zoomContainer, index) => {
      console.log(`${logPrefix}: Cleaning zoom container ${index + 1}/${allZoomContainers.length}: ${zoomContainer.label}`);
      
      try {
        // ✅ PASO 1: Matar todas las animaciones inmediatamente
        gsap.killTweensOf(zoomContainer);
        
        // ✅ PASO 2: Limpiar recursivamente todos los children
        const cleanupChildren = (container: PIXI.Container) => {
          // Crear copia del array children para evitar modificación durante iteración
          const childrenCopy = [...container.children];
          
          childrenCopy.forEach(child => {
            // Limpiar event listeners si los tiene
            if (child.eventMode !== 'passive' && child.eventMode !== 'auto') {
              child.removeAllListeners();
            }
            
            // Si es un Sprite, destruir su textura si fue generada
            if (child instanceof PIXI.Sprite && child.texture) {
              // Solo destruir texturas generadas dinámicamente (no assets cargados)
              if (child.texture.label && (child.texture.label.includes('generated') || 
                  child.texture.label.includes('fallback'))) {
                child.texture.destroy(true); // true = destroy base texture
                console.log(`${logPrefix}: Destroyed generated texture`);
              }
            }
            
            // Si es un Graphics, destruir
            if (child instanceof PIXI.Graphics) {
              child.clear(); // Limpiar geometría
            }
            
            // Si el child tiene children, limpiar recursivamente
            if (child instanceof PIXI.Container && child.children.length > 0) {
              cleanupChildren(child);
            }
            
            // ✅ CRÍTICO: Usar destroy() para liberar memoria completamente
            child.destroy({
              children: true,    // Destruir children también
              texture: false     // No destruir texturas de assets (solo generadas)
            });
          });
        };
        
        // Limpiar children del zoom container
        cleanupChildren(zoomContainer);
        
        // ✅ PASO 3: Remover del parent
        if (zoomContainer.parent) {
          zoomContainer.parent.removeChild(zoomContainer);
        }
        
        // ✅ PASO 4: Destruir el container principal
        zoomContainer.destroy({
          children: true,    // Ya limpiamos children, pero por seguridad
          texture: false     // No destruir texturas de assets
        });
        
        cleanedCount++;
        console.log(`${logPrefix}: ✅ Container ${index + 1} completely destroyed and cleaned`);
        
      } catch (error) {
        console.error(`${logPrefix}: ❌ Error cleaning container ${index + 1}:`, error);
        
        // ✅ FALLBACK: Intentar cleanup básico si falla el completo
        try {
          if (zoomContainer.parent) {
            zoomContainer.parent.removeChild(zoomContainer);
          }
        } catch (fallbackError) {
          console.error(`${logPrefix}: ❌ Fallback cleanup also failed:`, fallbackError);
        }
      }
    });
    
    // ✅ PASO 5: Limpiar referencias inmediatamente
    setActiveZoomContainer(null);
    
    // ✅ PASO 6: Forzar garbage collection y render update
    if (pixiApp.renderer) {
      pixiApp.renderer.render(pixiApp.stage);
      // Opcional: Sugerir garbage collection
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
    }
    
    console.log(`${logPrefix}: ✅ PIXI.js v8 compliant cleanup completed - ${cleanedCount}/${allZoomContainers.length} containers destroyed`);
    
    // ✅ VERIFICACIÓN POST-CLEANUP
    const remainingZooms = pixiApp.stage.children.filter(child => 
      child instanceof PIXI.Container && child.label && 
      child.label.startsWith('cardZoomContainer')
    );
    
    if (remainingZooms.length > 0) {
      console.warn(`${logPrefix}: ⚠️ Still ${remainingZooms.length} zoom containers remaining after cleanup!`);
    } else {
      console.log(`${logPrefix}: ✅ All zoom containers successfully cleaned`);
    }
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
    
    // TEMPORAL: Crear indicador visual de la zona de drop
    const dropZoneIndicator = new PIXI.Graphics();
    dropZoneIndicator.rect(300, 260, 680, 280); // PLAY_AREA ajustado: bajado 110px, reducido 20px altura
    dropZoneIndicator.stroke({ width: 3, color: 0x00ff00, alpha: 0.5 });
    dropZoneIndicator.fill({ color: 0x00ff00, alpha: 0.1 });
    dropZoneIndicator.label = 'dropZoneIndicator';
    
    // Usar LayerManager para z-index correcto
    const addedToGameBoard = layerSystem.addToPixi(GameLayer.GAME_BOARD, dropZoneIndicator);
    if (!addedToGameBoard) {
      dropZoneIndicator.zIndex = GameLayer.GAME_BOARD; // Fallback
      app.stage.addChild(dropZoneIndicator);
    }
    console.log('🎯 VFX: Drop zone indicator created at (300,260) size: 680x280');
    
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
    
    // Clean up any orphaned particles or trails
    const orphanedEffects = pixiApp.stage.children.filter(child => 
      child.label && (
        child.label.includes('trail') || 
        child.label.includes('particle')
      )
    );
    
    orphanedEffects.forEach((effect) => {
      console.log(`${logPrefix}: Removing orphaned effect: ${effect.label}`);
      gsap.killTweensOf(effect);
      if (effect.parent) {
        effect.parent.removeChild(effect);
      }
    });
    
    console.log(`${logPrefix}: Cleaned ${orphanedEffects.length} orphaned effects`);
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
  // COMENTADO: No se usa actualmente para evitar lag durante el drag
  /*
  const _triggerCardRearrangement = (_draggedCardId: string, _newPos: { x: number; y: number }) => {
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
      if (item.id === _draggedCardId) return; // skip the dragged card
      const targetX = startX + index * spacing;
      const targetY = handCenterY; // keep aligned vertically
      const sprite = pixiCards[item.id]?.sprite;
      if (!sprite) return;
      gsap.to(sprite, { x: targetX, y: targetY, duration: 0.2, ease: 'power1.out' });
    });
  };
  */

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

          // 🔧 MEJORA PixiJS v8: Limpieza completa de sprites huérfanos
          for (const cardId of currentPixiCardIds) {
            if (!newHandCardIds.has(cardId)) {
              const cardToDiscard = pixiCards[cardId];
              console.log('🗑️ VFX: Removing sprite for card', cardId, 'no longer in hand');
              if (cardToDiscard && app.stage) {
                const sprite = cardToDiscard.sprite;
                
                // 🔧 PASO 1: Matar animaciones activas
                gsap.killTweensOf(sprite);
                
                // 🔧 PASO 2: Remover event listeners y limpiar timers
                sprite.removeAllListeners();
                
                // 🔧 PASO 2.1: Limpiar trail timer si existe
                if ((sprite as any).cleanupTrailTimer) {
                  (sprite as any).cleanupTrailTimer();
                }
                
                // 🔧 PASO 3: Animación de salida
                gsap.to(sprite, {
                  alpha: 0,
                  y: sprite.y + 100,
                  duration: 0.4,
                  onComplete: () => {
                    try {
                      // 🔧 PASO 4: Remover del parent correctamente
                      if (sprite.parent) {
                        sprite.parent.removeChild(sprite);
                      }
                      
                      // 🔧 PASO 5: Destruir sprite con PixiJS v8 best practices
                      sprite.destroy({
                        children: true,   // Destruir children también
                        texture: false    // No destruir texturas de assets
                      });
                      
                      console.log('🗑️ VFX: Sprite completely destroyed for card', cardId);
                    } catch (error) {
                      console.error('🗑️ VFX: Error during sprite cleanup:', error);
                    }
                  }
                });
                
                // 🔧 PASO 6: Remove from our synchronous state immediately
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
              
              // 🔧 MEJORA PixiJS v8: Manejo correcto de texturas generadas
              const createFallbackTexture = () => {
                const graphics = new PIXI.Graphics()
                  .rect(0, 0, 120, 160)
                  .fill(0x2a2a3a)
                  .rect(5, 5, 110, 150)
                  .stroke({ width: 2, color: 0x4a90e2 })
                  .rect(15, 20, 90, 20)
                  .fill(0xffffff);
                
                // Create container for combining elements
                const container = new PIXI.Container();
                
                // 🔧 CRITICO: Generar textura del graphics y luego limpiar
                const graphicsTexture = app.renderer.generateTexture(graphics);
                const baseSprite = new PIXI.Sprite(graphicsTexture);
                container.addChild(baseSprite);
                
                // 🔧 CLEANUP: Destruir graphics después de generar textura
                graphics.destroy();
                
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
                
                // 🔧 CRITICO: Generar textura final y limpiar container
                const finalTexture = app.renderer.generateTexture(container);
                finalTexture.label = 'generated-fallback'; // Marcar como generada
                
                // 🔧 CLEANUP: Destruir container temporal
                container.destroy({ children: true, texture: false });
                
                return finalTexture;
              };
              
              // Start with fallback texture
              const texture = createFallbackTexture();
              console.log('🌨 VFX: Fallback texture created successfully');
              
              const sprite = new PIXI.Sprite(texture);
              console.log('🎨 VFX: Sprite created, setting anchor');
              sprite.anchor.set(0.5);

              // REMOVED: Border overlay to fix PixiJS v8 Container deprecation warning
              // Sprites cannot have children in PixiJS v8 - border is now part of the texture

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
              sprite.cursor = 'grab'; // Cambiar a grab para indicar que se puede arrastrar
              
              // TODA la carta debe ser clickeable/draggable
              // Como el anchor está en 0.5 (centro), el hitArea debe estar centrado
              sprite.hitArea = new PIXI.Rectangle(-60, -80, 120, 160); // Área centrada cubriendo toda la carta
              
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

              // Usar el sistema de drag nativo de PixiJS v8
              sprite.eventMode = 'static';
              sprite.cursor = 'pointer';
              
              // Store original position directly on the sprite - CRITICAL para retorno
              (sprite as any).originalPosition = { x: position.x, y: position.y };
              (sprite as any).isDragging = false;
              console.log('🌨 VFX: Original card position set to:', (sprite as any).originalPosition);

              sprite.on('pointerover', () => {
                if (!(sprite as any).isDragging) {
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
                if (!(sprite as any).isDragging) {
                  // Smooth return animation
                  gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 0.4, ease: 'power2.out' });
                  
                  // Use the originalPosition stored directly on the sprite
                  const targetY = (sprite as any).originalPosition.y;
                  console.log('🎭 VFX: Hover OFF - card', card.rank, card.suit, 'returning from y:', sprite.y, 'to y:', targetY);
                  gsap.to(sprite, { y: targetY, rotation: 0, duration: 0.4, ease: 'elastic.out(0.8, 0.6)' });
                  
                  // 🔧 MEJORA PixiJS v8: Manejo optimizado de filtros sin setTimeout excess
                  let baseOutline: GlowFilter | null = null;
                  try {
                    baseOutline = new GlowFilter({ distance: 8, outerStrength: 0.8, innerStrength: 0.2, color: 0x4a90e2 });
                    sprite.filters = [baseOutline];
                    
                    // 🔧 USAR GSAP en lugar de setTimeout para mejor control
                    gsap.to({}, {
                      duration: 0.05, 
                      onComplete: () => {
                        try {
                          const shimmerGlow = new GlowFilter({ distance: 12, outerStrength: 1.5, innerStrength: 0.3, color: 0xffffff });
                          sprite.filters = [shimmerGlow];
                          
                          // Return to base glow after shimmer using GSAP
                          gsap.to({}, {
                            duration: 0.2,
                            onComplete: () => {
                              try {
                                if (baseOutline && sprite.parent) { // Verificar que sprite aún existe
                                  sprite.filters = [baseOutline];
                                }
                              } catch (e) {
                                if (sprite.parent) sprite.filters = baseOutline ? [baseOutline] : [];
                              }
                            }
                          });
                        } catch (e) {
                          console.warn('⚠️ VFX: Shimmer GlowFilter failed:', e);
                          if (baseOutline && sprite.parent) {
                            sprite.filters = [baseOutline];
                          }
                        }
                      }
                    });
                  } catch (error) {
                    console.warn('⚠️ VFX: Base outline GlowFilter failed:', error);
                    sprite.filters = [];
                  }
                }
              });

              // OPTIMIZADO: Sistema de drag nativo de PixiJS
              sprite.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
                // Guardar posición inicial del click
                (sprite as any).clickStartPosition = { x: sprite.x, y: sprite.y };
                (sprite as any).dragData = event;
                (sprite as any).isDragging = true;
                
                sprite.cursor = 'grabbing';
                
                // Animación simple sin filtros pesados
                gsap.to(sprite.scale, { x: 1.1, y: 1.1, duration: 0.2 });
                
                // Mover al frente
                if (sprite.parent) {
                  sprite.parent.setChildIndex(sprite, sprite.parent.children.length - 1);
                }
                
                // Prevenir propagación
                event.stopPropagation();
              });

              // OPTIMIZADO: Sistema simplificado de release
              sprite.on('pointerup', () => {
                handlePointerUp();
              });
              
              sprite.on('pointerupoutside', () => {
                handlePointerUp();
              });
              
              const handlePointerUp = () => {
                if (!(sprite as any).isDragging) return;
                
                (sprite as any).isDragging = false;
                sprite.cursor = 'pointer';
                
                const clickStartPos = (sprite as any).clickStartPosition || (sprite as any).originalPosition;
                const dragDistance = Math.sqrt(
                  Math.pow(sprite.x - clickStartPos.x, 2) + 
                  Math.pow(sprite.y - clickStartPos.y, 2)
                );
                
                // 🔧 CRÍTICO: Obtener carta desde el estado actual, NO del closure
                const currentPixiCard = pixiCards[card.id];
                const actualCard = currentPixiCard ? currentPixiCard.card : card;
                
                console.log('🔍 VFX: Click detected on sprite with card ID:', card.id);
                console.log('🔍 VFX: Current pixiCards state has this ID:', !!currentPixiCard);
                console.log('🔍 VFX: Using card from state:', actualCard.rank, actualCard.suit);
                
                // Si no se movió mucho, es un click
                if (dragDistance < 20) {
                  // Mostrar menú centrado
                  const canvasBounds = app.canvas.getBoundingClientRect();
                  const menuPosition = {
                    x: canvasBounds.left + (640 * canvasBounds.width / app.screen.width),
                    y: canvasBounds.top + (400 * canvasBounds.height / app.screen.height)
                  };
                  
                  // 🔧 CRÍTICO: Usar carta actual del estado, no del closure
                  vfxSystem.cardClick({ card: actualCard, position: menuPosition });
                  
                  // Regresar carta a posición original
                  const origPos = (sprite as any).originalPosition;
                  gsap.to(sprite, {
                    x: origPos.x,
                    y: origPos.y,
                    scale: 0.8,
                    duration: 0.3
                  });
                  return;
                }
                
                // Verificar si está en zona de drop
                const PLAY_AREA = {
                  left: 350,
                  right: 930,
                  top: 200,
                  bottom: 450
                };
                
                const isInPlayArea = (
                  sprite.x >= PLAY_AREA.left && 
                  sprite.x <= PLAY_AREA.right &&
                  sprite.y >= PLAY_AREA.top && 
                  sprite.y <= PLAY_AREA.bottom
                );
                
                if (isInPlayArea && dragDistance > 30) {
                  // Mostrar menú centrado
                  const canvasBounds = app.canvas.getBoundingClientRect();
                  const menuPosition = {
                    x: canvasBounds.left + (640 * canvasBounds.width / app.screen.width),
                    y: canvasBounds.top + (400 * canvasBounds.height / app.screen.height)
                  };
                  
                  // 🔧 CRÍTICO: Usar carta actual del estado, no del closure
                  vfxSystem.cardClick({ card: actualCard, position: menuPosition });
                }
                
                // SIEMPRE regresar carta a posición original
                const origPos = (sprite as any).originalPosition;
                gsap.to(sprite, {
                  x: origPos.x,
                  y: origPos.y,
                  scale: 0.8,
                  duration: 0.4,
                  ease: "back.out(1.2)"
                });
              };

              // 🔧 MEJORA PixiJS v8: Manejo seguro de trail timers
              let trailTimer: number | null = null;
              
              // Función para limpiar trail timer
              const cleanupTrailTimer = () => {
                if (trailTimer) {
                  clearTimeout(trailTimer);
                  trailTimer = null;
                }
              };
              
              // Almacenar referencia para cleanup posterior
              (sprite as any).cleanupTrailTimer = cleanupTrailTimer;
              
              // OPTIMIZADO: Movimiento fluido sin lag
              sprite.on('globalpointermove', (event: PIXI.FederatedPointerEvent) => {
                if ((sprite as any).isDragging) {
                  const parent = sprite.parent || app.stage;
                  const newPosition = parent.toLocal(event.global);
                  
                  // Actualizar posición directamente
                  sprite.x = newPosition.x;
                  sprite.y = newPosition.y;
                  
                  // 🔧 Create trailing particle effect - con mejor cleanup
                  cleanupTrailTimer(); // Limpiar timer anterior
                  trailTimer = window.setTimeout(() => {
                    // Verificar que sprite aún existe antes de crear partículas
                    if (!sprite.parent) return;
                    
                    for (let i = 0; i < 3; i++) {
                      const trail = new PIXI.Graphics().circle(0, 0, 2 + Math.random()).fill(0x00ffcc);
                      trail.x = sprite.x + (Math.random() - 0.5) * 20;
                      trail.y = sprite.y + (Math.random() - 0.5) * 20;
                      trail.alpha = 0.6;
                      trail.label = `trail-particle-${i}`;
                      
                      // Usar LayerManager para partículas
                      const addedToParticleLayer = layerSystem.addToPixi(GameLayer.PARTICLE_EFFECTS, trail);
                      if (!addedToParticleLayer) {
                        app.stage.addChild(trail);
                      }
                      
                      gsap.to(trail, {
                        alpha: 0,
                        scale: 0,
                        y: trail.y + 20,
                        duration: 0.4,
                        ease: 'power2.out',
                        onComplete: () => { 
                          try {
                            if (trail.parent) {
                              trail.parent.removeChild(trail);
                            }
                            trail.destroy(); // 🔧 Destruir completamente
                          } catch (error) {
                            console.warn('⚠️ VFX: Error cleaning trail particle:', error);
                          }
                        }
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
            
            console.log('🤖 VFX: ECO playing card', card.rank, card.suit, 'from', startPosition, 'to', centerPosition);

            // FASE 1: Crear carta ECO usando PixiJS Container para mejor control
            const ecoCardContainer = new PIXI.Container();
            ecoCardContainer.x = startPosition.x;
            ecoCardContainer.y = startPosition.y;
            ecoCardContainer.scale.set(0.1); // ✅ Empezar pequeño como el zoom del jugador
            ecoCardContainer.rotation = -0.15; // Inclinación hacia la izquierda (unos -8.5 grados)
            ecoCardContainer.label = `ecoCard_${card.id}`;
            
            // Intentar cargar textura real del card-back
            const cardBackPath = '/images/scenarios/default/cards/card-back.png';
            console.log('🤖 VFX: Loading ECO card-back texture from:', cardBackPath);
            
            PIXI.Assets.load(cardBackPath)
              .then((cardBackTexture) => {
                console.log('🤖 VFX: ECO card-back texture loaded successfully');
                
                // Usar textura real del card-back
                const cardBackSprite = new PIXI.Sprite(cardBackTexture);
                cardBackSprite.anchor.set(0.5);
                cardBackSprite.width = 300; // ✅ MISMO tamaño que el zoom del jugador
                cardBackSprite.height = 420;
                cardBackSprite.x = 0;
                cardBackSprite.y = 0;
                cardBackSprite.label = 'ecoRealCardBack';
                ecoCardContainer.addChild(cardBackSprite);
              })
              .catch((error) => {
                console.warn('⚠️ VFX: Failed to load ECO card-back texture, using fallback:', error);
                
                // Crear fondo fallback si falla la carga
                const cardBack = new PIXI.Graphics()
                  .rect(-150, -210, 300, 420) // ✅ MISMO tamaño que el zoom del jugador
                  .fill(0x1f2937)
                  .rect(-142, -202, 284, 404)
                  .stroke({ width: 3, color: 0xb91c1c })
                  .rect(-100, -150, 200, 60)
                  .fill(0xff4444);
                cardBack.label = 'ecoCardBackFallback';
                ecoCardContainer.addChild(cardBack);
                
                // Texto fallback
                const cardText = new PIXI.Text({
                  text: 'ECO',
                  style: {
                    fontSize: 18,
                    fill: 0xffffff,
                    fontWeight: 'bold',
                    align: 'center'
                  }
                });
                cardText.anchor.set(0.5);
                cardText.x = 0;
                cardText.y = -60;
                cardText.label = 'ecoCardTextFallback';
                ecoCardContainer.addChild(cardText);
              });
            
            // Aplicar filtros PixiJS
            try {
              ecoCardContainer.filters = [new GlowFilter({ distance: 15, outerStrength: 1.5, color: 0xff4444 })];
            } catch (error) {
              console.warn('⚠️ VFX: GlowFilter failed for ECO card:', error);
              ecoCardContainer.filters = [];
            }
            
            // Usar LayerManager para posicionamiento correcto
            const addedToEcoLayer = layerSystem.addToPixi(GameLayer.FLOATING_UI, ecoCardContainer);
            if (!addedToEcoLayer) {
              ecoCardContainer.zIndex = 4100;
              app.stage.addChild(ecoCardContainer);
            }
            
            console.log('🤖 VFX: ECO card container created at hand position, starting drag animation');

            // FASE 2: DRAG usando PixiJS Ticker para animación suave
            const startTime = performance.now();
            const dragDuration = 1200; // 1.2 segundos
            const startX = startPosition.x;
            const startY = startPosition.y;
            const deltaX = centerPosition.x - startX;
            const deltaY = centerPosition.y - startY;
            
            const dragTicker = new PIXI.Ticker();
            dragTicker.add(() => {
              const elapsed = performance.now() - startTime;
              const progress = Math.min(elapsed / dragDuration, 1);
              
              // Usar easing power2.inOut
              const easedProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - 2 * (1 - progress) * (1 - progress);
                
              // Actualizar posición
              ecoCardContainer.x = startX + (deltaX * easedProgress);
              ecoCardContainer.y = startY + (deltaY * easedProgress);
              
              // ✅ Escalar durante el movimiento para dar sensación de profundidad
              const scale = 0.1 + (0.9 * easedProgress); // De 0.1 a 1.0 (MISMO rango que zoom jugador)
              ecoCardContainer.scale.set(scale);
              
              // Rotación sutil usando seno para movimiento natural + inclinación base
              ecoCardContainer.rotation = -0.15 + (Math.sin(progress * Math.PI) * 0.05);
              
              if (progress >= 1) {
                dragTicker.stop();
                dragTicker.destroy();
                console.log('🤖 VFX: ECO card reached play zone, starting reveal sequence');
                
                // FASE 3: REVEAL con PixiJS
                setTimeout(() => {
                  performEcoCardReveal(ecoCardContainer, card, centerPosition, app);
                }, 200);
              }
            });
            dragTicker.start();
            
            // FASE 4: Auto-cleanup después de 5 segundos
            setTimeout(() => {
              console.log('🤖 VFX: Starting ECO card cleanup sequence');
              performEcoCardCleanup(ecoCardContainer, app);
            }, 6000);

            // Old flip animation code removed - now handled by PixiJS native performEcoCardReveal method

            // Old animation code removed - now handled by PixiJS native methods

            break;
        }
        
        // Cleanup old flip animation code that is now replaced by PixiJS native methods
        
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
          discardSprite.zIndex = 2000; // Ajustado para no interferir con el zoom
          
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
          
          // ✅ CLEANUP SÍNCRONO INMEDIATO - Sin setTimeout problemático
          console.log('🔍 VFX: Starting SYNCHRONOUS cleanup before creating new zoom');
          cleanupActiveZoom();
          
          // ✅ CREAR ZOOM INMEDIATAMENTE - Sin timing issues
          console.log('🔍 VFX: Creating new zoom container immediately after cleanup');
          
          // Posición central del zoom (centro del canvas)
          const zoomCenterX = 640;
          const zoomCenterY = 400;
          
          // ✅ Create zoom container with PIXI.js v8 best practices
          const zoomContainer = new PIXI.Container();
          zoomContainer.x = zoomCenterX;
          zoomContainer.y = zoomCenterY;
          zoomContainer.scale.set(0.1);
          zoomContainer.alpha = 0;
          zoomContainer.label = `cardZoomContainer_${card.id}`; // Label único por carta
          
          // ✅ Marcar textura como generada para cleanup correcto
          const createFallbackElements = () => {
            // Create fallback background
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
            
            return { fallbackBg, fallbackText };
          };
          
          // Add fallback elements
          const { fallbackBg, fallbackText } = createFallbackElements();
          zoomContainer.addChild(fallbackBg);
          zoomContainer.addChild(fallbackText);
          
          // ✅ Add glow effect with proper error handling
          try {
            zoomContainer.filters = [new GlowFilter({ distance: 20, outerStrength: 2, color: 0x4a90e2 })];
          } catch (error) {
            console.warn('⚠️ VFX: Zoom container GlowFilter failed:', error);
            zoomContainer.filters = [];
          }
          
          // ✅ AGREGAR AL STAGE - Usar LayerManager correctamente
          console.log('🔍 VFX: Adding zoom container to FLOATING_UI layer');
          const addedToZoomLayer = layerSystem.addToPixi(GameLayer.FLOATING_UI, zoomContainer);
          if (!addedToZoomLayer) {
            // Fallback: agregar directamente al stage con alto z-index
            zoomContainer.zIndex = GameLayer.FLOATING_UI; // 4100
            app.stage.addChild(zoomContainer);
            console.log('⚠️ VFX: Zoom container added directly to stage with FLOATING_UI z-index (fallback)');
          } else {
            console.log('✅ VFX: Zoom container successfully added to FLOATING_UI layer via LayerManager');
          }
          
          // ✅ LOAD REAL TEXTURE - Con proper async handling
          const imagePath = `/images/decks/default/${card.imageFile}`;
          console.log('🔍 VFX: Loading card image from:', imagePath);
          
          // ✅ Asynchronous texture loading (no afecta el timing del zoom)
          PIXI.Assets.load(imagePath)
            .then((cardTexture) => {
              console.log('🔍 VFX: Real texture loaded successfully for', card.rank, card.suit);
              
              // ✅ Verificar que el container aún existe antes de actualizar
              if (zoomContainer.parent) {
                // Create real card sprite
                const realCardSprite = new PIXI.Sprite(cardTexture);
                realCardSprite.anchor.set(0.5);
                realCardSprite.width = 300; // ✅ Tamaño estándar del zoom del jugador
                realCardSprite.height = 420;
                realCardSprite.x = 0;
                realCardSprite.y = 0;
                realCardSprite.label = 'zoomRealCard';
                
                // ✅ Clear fallback elements properly
                zoomContainer.removeChildren();
                zoomContainer.addChild(realCardSprite);
                
                console.log('🔍 VFX: Real card sprite replaced fallback in zoom container');
              } else {
                console.warn('⚠️ VFX: Zoom container was removed before texture loaded');
              }
            })
            .catch((error) => {
              console.warn('⚠️ VFX: Could not load real texture for', card.rank, card.suit, '- keeping fallback. Error:', error);
              // Keep fallback - no action needed
            });
          
          // ✅ ANIMATE CONTAINER IN - Immediate animation
          console.log('🔍 VFX: Starting zoom-in animation');
          gsap.to(zoomContainer, {
            scale: 1,
            alpha: 1,
            duration: 0.4,
            ease: 'back.out(1.6)',
            onComplete: () => {
              console.log('🔍 VFX: Zoom animation completed successfully');
            }
          });
          
          // ✅ STORE REFERENCE - Para cleanup manual
          (zoomContainer as any).cardId = card.id;
          setActiveZoomContainer(zoomContainer);
          console.log('🔍 VFX: Zoom container stored for future cleanup, will persist until context menu action');
          
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
  
  // Helper functions for ECO card animations - moved outside useEffect to avoid scope issues
  const performEcoCardReveal = (container: PIXI.Container, card: any, position: {x: number, y: number}, app: PIXI.Application) => {
    console.log('🤖 VFX: Starting ECO card reveal using PixiJS native methods');
    
    // FASE 1: Flip usando PixiJS transform
    const revealTicker = new PIXI.Ticker();
    const flipStartTime = performance.now();
    const flipDuration = 300; // 0.3 segundos para cada lado del flip
    let flipPhase = 'shrink'; // 'shrink' -> 'expand'
    
    revealTicker.add(() => {
      const elapsed = performance.now() - flipStartTime;
      
      if (flipPhase === 'shrink') {
        const progress = Math.min(elapsed / flipDuration, 1);
        const scaleX = 1.0 - (0.95 * progress); // ✅ De 1.0 a 0.05 (MISMO rango que zoom jugador)
        container.scale.set(scaleX, 1.0);
        
        if (progress >= 1) {
          flipPhase = 'loadTexture';
          
          // Cargar textura real usando PixiJS Assets
          PIXI.Assets.load(`/images/decks/default/${card.imageFile}`)
            .then((texture) => {
              // Reemplazar el contenido del container
              container.removeChildren();
              
              const realCardSprite = new PIXI.Sprite(texture);
              realCardSprite.anchor.set(0.5);
              realCardSprite.width = 300; // ✅ MISMO tamaño que el zoom del jugador
              realCardSprite.height = 420;
              realCardSprite.label = `ecoRealCard_${card.id}`;
              container.addChild(realCardSprite);
              
              console.log('🤖 VFX: Real ECO card texture loaded with CONSISTENT size (300x420)');
              flipPhase = 'expand';
            })
            .catch((error) => {
              console.warn('⚠️ VFX: Failed to load ECO card texture:', error);
              flipPhase = 'expand'; // Continuar con placeholder
            });
        }
      } else if (flipPhase === 'expand') {
        const expandProgress = Math.min((elapsed - flipDuration) / flipDuration, 1);
        const scaleX = 0.05 + (0.95 * expandProgress); // ✅ De 0.05 a 1.0 (MISMO rango que zoom jugador)
        container.scale.set(scaleX, 1.0);
        
        if (expandProgress >= 1) {
          revealTicker.stop();
          revealTicker.destroy();
          
          // Shockwave effect usando PixiJS Graphics
          const shockwave = new PIXI.Graphics()
            .circle(0, 0, 30)
            .stroke({ width: 8, color: 0xff5555, alpha: 0.9 });
          shockwave.x = position.x;
          shockwave.y = position.y;
          shockwave.label = 'ecoShockwave';
          app.stage.addChild(shockwave);
          
          // Animar shockwave con función helper
          animateShockwave(shockwave);
          
          console.log('🤖 VFX: ECO card reveal completed with shockwave effect');
        }
      }
    });
    
    revealTicker.start();
  };
  
  const performEcoCardCleanup = (container: PIXI.Container, app: PIXI.Application) => {
    console.log('🤖 VFX: Starting ECO card cleanup using PixiJS native methods');
    
    // FASE 1: Pulso de advertencia usando PixiJS
    const pulseTicker = new PIXI.Ticker();
    const pulseStartTime = performance.now();
    const pulseDuration = 1000; // 1 segundo de pulsos
    
    pulseTicker.add(() => {
      const elapsed = performance.now() - pulseStartTime;
      const progress = elapsed / pulseDuration;
      
      // ✅ Crear efecto de pulso usando seno con escala consistente
      const pulseScale = 1.0 + (Math.sin(progress * Math.PI * 6) * 0.1); // ✅ 3 pulsos, escala 0.9-1.1
      container.scale.set(pulseScale, pulseScale);
      
      // Cambiar filtro de color durante el pulso
      try {
        const intensity = 1.5 + (Math.sin(progress * Math.PI * 6) * 0.5);
        container.filters = [new GlowFilter({ distance: 30, outerStrength: intensity, color: 0xff9999 })];
      } catch (error) {
        // Fallback sin filtros
      }
      
      if (progress >= 1) {
        pulseTicker.stop();
        pulseTicker.destroy();
        
        // FASE 2: Cleanup con rotación y fade usando PixiJS
        performFinalCleanup(container, app);
      }
    });
    
    pulseTicker.start();
  };
  
  const animateShockwave = (shockwave: PIXI.Graphics) => {
    const shockTicker = new PIXI.Ticker();
    const shockStartTime = performance.now();
    const shockDuration = 800;
    
    shockTicker.add(() => {
      const elapsed = performance.now() - shockStartTime;
      const progress = Math.min(elapsed / shockDuration, 1);
      
      // Escalar y desvanecer
      const scale = 1 + (progress * 9); // De 1 a 10
      const alpha = 0.9 - (progress * 0.9); // De 0.9 a 0
      
      shockwave.scale.set(scale);
      shockwave.alpha = alpha;
      
      
      if (progress >= 1) {
        shockTicker.stop();
        shockTicker.destroy();
        if (shockwave.parent) {
          shockwave.parent.removeChild(shockwave);
        }
      }
    });
    
    shockTicker.start();
  };
  
  const performFinalCleanup = (container: PIXI.Container, _app: PIXI.Application) => {
    const cleanupTicker = new PIXI.Ticker();
    const cleanupStartTime = performance.now();
    const cleanupDuration = 800;
    
    cleanupTicker.add(() => {
      const elapsed = performance.now() - cleanupStartTime;
      const progress = Math.min(elapsed / cleanupDuration, 1);
      
      // ✅ Fade, scale y rotate con escala consistente
      const alpha = 1 - progress;
      const scale = 1.0 - (0.9 * progress); // ✅ De 1.0 a 0.1 (MISMO rango que zoom jugador)
      const rotation = progress * Math.PI; // 180 grados
      
      container.alpha = alpha;
      container.scale.set(scale);
      container.rotation = rotation;
      
      if (progress >= 1) {
        cleanupTicker.stop();
        cleanupTicker.destroy();
        
        if (container.parent) {
          container.parent.removeChild(container);
        }
        console.log('🤖 VFX: ECO card cleanup completed and removed from stage');
      }
    });
    
    cleanupTicker.start();
  };

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