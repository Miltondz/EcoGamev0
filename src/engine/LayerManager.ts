// src/engine/LayerManager.ts

/**
 * Sistema de Gestión de Capas Z-Index para el Motor del Juego ECO
 * 
 * PROBLEMAS QUE RESUELVE:
 * - Menú contextual de cartas no visible/clickeable
 * - Botones de fin de turno detrás de otros elementos
 * - Conflictos entre efectos visuales y UI
 * - Z-index hardcodeados causando inconsistencias
 * 
 * PROBLEMAS ANTICIPADOS:
 * - Múltiples modales superpuestos
 * - Tooltips detrás de elementos
 * - Debug tools interfiriendo con juego
 * - Efectos PixiJS bloqueando UI React
 */

import { useState, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';

// Definición de capas del juego ordenadas por prioridad
export enum GameLayer {
  // Fondo y layout base (0-99)
  BACKGROUND = 0,
  GAME_BACKGROUND = 10,
  LAYOUT_FRAME = 20,
  
  // Contenido del juego (100-999)
  PIXI_STAGE = 100,        // Canvas PixiJS principal
  GAME_BOARD = 200,        // Tablero/área de juego
  CARDS_IDLE = 300,        // Cartas en estado normal
  CARDS_HOVERED = 350,     // Cartas con hover
  CARDS_SELECTED = 400,    // Cartas seleccionadas
  CARDS_DRAGGING = 450,    // Cartas siendo arrastradas
  
  // Efectos visuales (1000-1999)
  PARTICLE_EFFECTS = 1000, // Partículas y efectos menores
  SCREEN_EFFECTS = 1100,   // Efectos de pantalla completa
  TRANSITIONS = 1200,      // Transiciones entre estados
  
  // UI Base (2000-3999)
  UI_BACKGROUND = 2000,    // Fondos de paneles UI
  UI_PANELS = 2100,        // Paneles informativos
  UI_STATS = 2200,         // HUD con stats del jugador
  UI_BUTTONS = 2300,       // Botones de acción (CRÍTICO)
  UI_INDICATORS = 2400,    // Indicadores de estado
  
  // UI Interactiva (4000-5999)
  INTERACTIVE_UI = 4000,   // Elementos que DEBEN responder a clicks
  FLOATING_UI = 4100,      // UI flotante (damage numbers, etc.)
  TOOLTIPS = 4200,         // Tooltips informativos
  DROPDOWN_MENUS = 4300,   // Menús desplegables
  
  // Menús contextuales (6000-6999)
  CONTEXT_MENU_BACKDROP = 6000, // Fondo transparente del menú
  CONTEXT_MENU = 6100,          // Menú contextual (CRÍTICO)
  CONTEXT_SUBMENU = 6200,       // Submenús de contexto
  
  // Modales y overlays (7000-8999)
  MODAL_BACKDROP = 7000,   // Fondo oscuro de modales
  MODAL_CONTENT = 7100,    // Contenido de modales
  EVENT_MODAL = 7200,      // Modales de eventos
  NARRATIVE_MODAL = 7300,  // Modales de narrativa
  GAME_END_MODAL = 7400,   // Modal de fin de juego
  
  // UI Crítica (9000-9999)
  CRITICAL_ALERTS = 9000,  // Alertas importantes
  SYSTEM_MESSAGES = 9100,  // Mensajes del sistema
  ERROR_OVERLAYS = 9200,   // Overlays de error
  
  // Debug y desarrollo (10000+)
  DEBUG_OVERLAY = 10000,   // Herramientas de debug
  DEV_TOOLS = 10100        // Tools de desarrollo
}

/**
 * Manager centralizado de capas Z-Index
 */
class LayerManager {
  private static instance: LayerManager;
  private layerStack = new Map<GameLayer, number>();
  private subscribers = new Set<(layer: GameLayer, zIndex: number) => void>();
  private pixiLayerContainers = new Map<GameLayer, PIXI.Container>();
  private pixiApp: PIXI.Application | null = null;

  constructor() {
    this.initializeLayers();
  }

  static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  private initializeLayers(): void {
    // Inicializar todas las capas con sus valores base
    Object.values(GameLayer).forEach(layer => {
      if (typeof layer === 'number') {
        this.layerStack.set(layer, layer);
      }
    });
  }

  /**
   * Inicializar sistema PixiJS
   */
  initializePixi(app: PIXI.Application): void {
    this.pixiApp = app;
    app.stage.sortableChildren = true;
    
    // Crear contenedores para cada capa relevante de PixiJS
    const pixiLayers = [
      GameLayer.GAME_BOARD,
      GameLayer.CARDS_IDLE,
      GameLayer.CARDS_HOVERED, 
      GameLayer.CARDS_SELECTED,
      GameLayer.CARDS_DRAGGING,
      GameLayer.PARTICLE_EFFECTS,
      GameLayer.SCREEN_EFFECTS,
      GameLayer.FLOATING_UI
    ];

    pixiLayers.forEach(layer => {
      const container = new PIXI.Container();
      container.label = `layer-${GameLayer[layer]}`;
      container.zIndex = layer;
      this.pixiLayerContainers.set(layer, container);
      app.stage.addChild(container);
    });

    console.log('🎯 LayerManager: Sistema PixiJS inicializado con', pixiLayers.length, 'capas');
  }

  /**
   * Obtener z-index para una capa
   */
  getZIndex(layer: GameLayer, bringToFront: boolean = false): number {
    const current = this.layerStack.get(layer) || layer;
    
    if (bringToFront) {
      const newValue = current + 1;
      this.layerStack.set(layer, newValue);
      this.notifySubscribers(layer, newValue);
      console.log(`🎯 LayerManager: ${GameLayer[layer]} traído al frente (${newValue})`);
      return newValue;
    }
    
    return current;
  }

  /**
   * Traer elemento al frente de su capa
   */
  bringToFront(layer: GameLayer): number {
    return this.getZIndex(layer, true);
  }

  /**
   * Resetear capa a su valor original
   */
  resetLayer(layer: GameLayer): number {
    this.layerStack.set(layer, layer);
    this.notifySubscribers(layer, layer);
    console.log(`🎯 LayerManager: ${GameLayer[layer]} reseteado a ${layer}`);
    return layer;
  }

  /**
   * Agregar sprite de PixiJS a una capa específica
   */
  addToPixiLayer(layer: GameLayer, displayObject: PIXI.DisplayObject): boolean {
    const container = this.pixiLayerContainers.get(layer);
    if (container) {
      container.addChild(displayObject);
      console.log(`🎯 LayerManager: Objeto agregado a capa PixiJS ${GameLayer[layer]}`);
      return true;
    }
    
    console.warn(`🎯 LayerManager: Capa PixiJS ${GameLayer[layer]} no encontrada`);
    return false;
  }

  /**
   * Mover objeto entre capas PixiJS
   */
  movePixiObject(displayObject: PIXI.DisplayObject, newLayer: GameLayer): boolean {
    // Remover del contenedor actual
    if (displayObject.parent) {
      displayObject.parent.removeChild(displayObject);
    }
    
    return this.addToPixiLayer(newLayer, displayObject);
  }

  /**
   * Suscribirse a cambios de z-index
   */
  subscribe(callback: (layer: GameLayer, zIndex: number) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(layer: GameLayer, zIndex: number): void {
    this.subscribers.forEach(callback => callback(layer, zIndex));
  }

  /**
   * Debug: Estado actual de todas las capas
   */
  getDebugInfo(): Record<string, number> {
    const info: Record<string, number> = {};
    this.layerStack.forEach((value, key) => {
      const layerName = GameLayer[key];
      if (layerName) {
        info[layerName] = value;
      }
    });
    return info;
  }

  /**
   * Resolver conflictos comunes automáticamente
   */
  resolveConflict(conflictType: 'context_menu' | 'modal' | 'tooltip'): void {
    switch (conflictType) {
      case 'context_menu':
        this.bringToFront(GameLayer.CONTEXT_MENU);
        break;
      case 'modal':
        this.bringToFront(GameLayer.MODAL_BACKDROP);
        this.bringToFront(GameLayer.MODAL_CONTENT);
        break;
      case 'tooltip':
        this.bringToFront(GameLayer.TOOLTIPS);
        break;
    }
  }
}

/**
 * Hook de React para usar el sistema de capas
 */
export function useLayer(layer: GameLayer, autoFront: boolean = false) {
  const manager = LayerManager.getInstance();
  const [zIndex, setZIndex] = useState(() => 
    manager.getZIndex(layer, autoFront)
  );

  useEffect(() => {
    const unsubscribe = manager.subscribe((changedLayer, newZIndex) => {
      if (changedLayer === layer) {
        setZIndex(newZIndex);
      }
    });

    return unsubscribe;
  }, [layer]);

  const bringToFront = useCallback(() => {
    const newZ = manager.bringToFront(layer);
    setZIndex(newZ);
    return newZ;
  }, [layer]);

  const reset = useCallback(() => {
    const resetZ = manager.resetLayer(layer);
    setZIndex(resetZ);
    return resetZ;
  }, [layer]);

  return { zIndex, bringToFront, reset };
}

/**
 * Utilidades sin hooks para usar en cualquier parte
 */
export const layerSystem = {
  get: (layer: GameLayer, bringToFront?: boolean) => 
    LayerManager.getInstance().getZIndex(layer, bringToFront),
  
  bringToFront: (layer: GameLayer) => 
    LayerManager.getInstance().bringToFront(layer),
  
  reset: (layer: GameLayer) => 
    LayerManager.getInstance().resetLayer(layer),

  addToPixi: (layer: GameLayer, object: PIXI.DisplayObject) =>
    LayerManager.getInstance().addToPixiLayer(layer, object),

  movePixi: (object: PIXI.DisplayObject, newLayer: GameLayer) =>
    LayerManager.getInstance().movePixiObject(object, newLayer),

  initPixi: (app: PIXI.Application) =>
    LayerManager.getInstance().initializePixi(app),

  resolve: (conflict: 'context_menu' | 'modal' | 'tooltip') =>
    LayerManager.getInstance().resolveConflict(conflict),

  debug: () => LayerManager.getInstance().getDebugInfo()
};

export default LayerManager;
