// src/engine/ZIndexManager.ts

/**
 * Sistema de Gestión de Capas Z-Index para el Juego ECO
 * 
 * Resuelve problemas de superposición entre:
 * - Menús contextuales
 * - Efectos visuales
 * - UI elements
 * - Modales y popups
 */

import { useState, useEffect, useCallback } from 'react';

// Definición de capas ordenadas de menor a mayor prioridad
export enum ZLayer {
  BACKGROUND = 0,
  GAME_LAYOUT = 10,
  PIXI_CANVAS = 100,
  CARD_BASE = 200,
  CARD_SELECTED = 300,
  CARD_HOVERED = 350,
  EFFECTS = 400,
  UI_BASE = 500,
  UI_INTERACTIVE = 600,
  TOOLTIPS = 700,
  CONTEXT_MENU = 800,
  MODAL_BACKDROP = 900,
  MODAL_CONTENT = 950,
  CRITICAL_UI = 980,
  DEBUG = 1000
}

// Manager centralizado de Z-Index
class ZIndexManager {
  private static instance: ZIndexManager;
  private currentZIndex = new Map<ZLayer, number>();
  private subscribers = new Set<(layer: ZLayer, zIndex: number) => void>();

  constructor() {
    // Inicializar valores base
    Object.values(ZLayer).forEach(layer => {
      if (typeof layer === 'number') {
        this.currentZIndex.set(layer, layer);
      }
    });
  }

  static getInstance(): ZIndexManager {
    if (!ZIndexManager.instance) {
      ZIndexManager.instance = new ZIndexManager();
    }
    return ZIndexManager.instance;
  }

  /**
   * Obtener z-index para una capa específica
   */
  getZIndex(layer: ZLayer, increment: boolean = false): number {
    const current = this.currentZIndex.get(layer) || layer;
    
    if (increment) {
      const newValue = current + 1;
      this.currentZIndex.set(layer, newValue);
      this.notifySubscribers(layer, newValue);
      return newValue;
    }
    
    return current;
  }

  /**
   * Traer elemento al frente de su capa
   */
  bringToFront(layer: ZLayer): number {
    return this.getZIndex(layer, true);
  }

  /**
   * Resetear capa a su valor base
   */
  resetLayer(layer: ZLayer): number {
    this.currentZIndex.set(layer, layer);
    this.notifySubscribers(layer, layer);
    return layer;
  }

  /**
   * Obtener el siguiente z-index disponible por encima de una capa
   */
  getNextAbove(referenceLayer: ZLayer): number {
    const baseValue = this.getZIndex(referenceLayer);
    return baseValue + 1;
  }

  /**
   * Suscribirse a cambios de z-index
   */
  subscribe(callback: (layer: ZLayer, zIndex: number) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(layer: ZLayer, zIndex: number): void {
    this.subscribers.forEach(callback => callback(layer, zIndex));
  }

  /**
   * Debug: Obtener estado actual de todas las capas
   */
  getDebugInfo(): Record<string, number> {
    const info: Record<string, number> = {};
    this.currentZIndex.forEach((value, key) => {
      const layerName = ZLayer[key];
      if (layerName) {
        info[layerName] = value;
      }
    });
    return info;
  }
}

/**
 * Hook de React para manejo de Z-Index
 */
export function useZIndex(layer: ZLayer, autoIncrement: boolean = false) {
  const manager = ZIndexManager.getInstance();
  const [zIndex, setZIndex] = useState(() => 
    manager.getZIndex(layer, autoIncrement)
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
  }, [layer, manager]);

  const reset = useCallback(() => {
    const resetZ = manager.resetLayer(layer);
    setZIndex(resetZ);
    return resetZ;
  }, [layer, manager]);

  return {
    zIndex,
    bringToFront,
    reset,
    manager
  };
}

/**
 * Utilidades para obtener z-index sin React hooks
 */
export const zIndexUtils = {
  get: (layer: ZLayer, increment?: boolean) => 
    ZIndexManager.getInstance().getZIndex(layer, increment),
  
  bringToFront: (layer: ZLayer) => 
    ZIndexManager.getInstance().bringToFront(layer),
  
  getNextAbove: (layer: ZLayer) => 
    ZIndexManager.getInstance().getNextAbove(layer),

  getDebugInfo: () => 
    ZIndexManager.getInstance().getDebugInfo()
};

export default ZIndexManager;
