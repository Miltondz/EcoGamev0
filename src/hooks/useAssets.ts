// src/hooks/useAssets.ts

import { useState, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { assetManager } from '../engine/AssetManager';
import { chapterManager } from '../engine/ChapterManager';

export interface UseAssetsResult {
  // Loading state
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  
  // Asset getters
  getTexture: (path: string, fallbackPath?: string) => Promise<PIXI.Texture>;
  getCachedTexture: (path: string) => PIXI.Texture | null;
  getImagePath: (path: string) => Promise<string>;
  
  // Scenario-specific getters
  getCardTexture: (cardId: string) => Promise<PIXI.Texture>;
  getEventTexture: (eventId: string) => Promise<PIXI.Texture>;
  getBackgroundTexture: () => Promise<PIXI.Texture>;
  getPlayerPortraitTexture: () => Promise<PIXI.Texture>;
  getEcoTexture: (phase: 'vigilante' | 'predator' | 'devastator') => Promise<PIXI.Texture>;
  
  // Utility functions
  preloadScenario: (scenarioId: string) => Promise<void>;
  clearCache: () => void;
}

export function useAssets(): UseAssetsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Setup PIXI.Assets progress tracking
  useEffect(() => {
    // const onProgress = (progress: number) => {
    //   setLoadingProgress(progress * 100);
    // };

    // Note: PIXI.Assets doesn't have a direct progress event in v7+
    // We'll track progress manually in our loading functions
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Subscribe to chapter changes to reload assets
  useEffect(() => {
    const unsubscribe = chapterManager.subscribe(() => {
      const currentChapter = chapterManager.currentChapterConfig;
      if (currentChapter) {
        // Assets will be loaded by ChapterManager
        console.log(`🎨 useAssets: Chapter changed to ${currentChapter.name}`);
      }
    });

    return unsubscribe;
  }, []);

  // Generic texture getter
  const getTexture = useCallback(async (path: string, fallbackPath?: string): Promise<PIXI.Texture> => {
    try {
      return await assetManager.getTexture(path, fallbackPath);
    } catch (error) {
      console.error(`Failed to get texture: ${path}`, error);
      setError(`Failed to load texture: ${path}`);
      throw error;
    }
  }, []);

  // Cached texture getter
  const getCachedTexture = useCallback((path: string): PIXI.Texture | null => {
    return assetManager.getCachedTexture(path);
  }, []);

  // Generic image path getter (for HTML images)
  const getImagePath = useCallback(async (path: string): Promise<string> => {
    try {
      // Use existing AssetManager methods
      if (path.includes('card')) {
        return await assetManager.getCardImagePath(path);
      } else if (path.includes('event')) {
        return await assetManager.getEventImagePath(path);
      } else if (path.includes('background')) {
        return await assetManager.getBackgroundPath();
      } else if (path.includes('portrait')) {
        return await assetManager.getPlayerPortraitPath();
      } else if (path.includes('eco')) {
        const phase = path.includes('vigilante') ? 'vigilante' : 
                     path.includes('predator') ? 'predator' : 'devastator';
        return await assetManager.getEcoImagePath(phase);
      }
      return path;
    } catch (error) {
      console.error(`Failed to get image path: ${path}`, error);
      setError(`Failed to get image path: ${path}`);
      return path;
    }
  }, []);

  // Scenario-specific getters
  const getCardTexture = useCallback(async (cardId: string): Promise<PIXI.Texture> => {
    const scenario = chapterManager.currentScenarioConfig?.id || 'default';
    const primaryPath = `/images/scenarios/${scenario}/cards/${cardId}.png`;
    const fallbackPath = `/images/scenarios/${scenario}/cards/missing-card.svg`;
    return getTexture(primaryPath, fallbackPath);
  }, [getTexture]);

  const getEventTexture = useCallback(async (eventId: string): Promise<PIXI.Texture> => {
    const scenario = chapterManager.currentScenarioConfig?.id || 'default';
    const primaryPath = `/images/scenarios/${scenario}/events/${eventId}.png`;
    const fallbackPath = `/images/scenarios/${scenario}/events/missing-event.svg`;
    return getTexture(primaryPath, fallbackPath);
  }, [getTexture]);

  const getBackgroundTexture = useCallback(async (): Promise<PIXI.Texture> => {
    const scenario = chapterManager.currentScenarioConfig?.id || 'default';
    const paths = [
      `/images/scenarios/${scenario}/backgrounds/main-bg.jpg`,
      `/images/scenarios/${scenario}/backgrounds/main-bg.png`,
      `/images/scenarios/${scenario}/backgrounds/main-bg.svg`
    ];
    
    // Try each path in order
    for (const path of paths) {
      try {
        return await getTexture(path);
      } catch (error) {
        console.warn(`Failed to load background: ${path}`);
      }
    }
    
    // Final fallback
    return await getTexture('/images/scenarios/default/backgrounds/main-bg.svg');
  }, [getTexture]);

  const getPlayerPortraitTexture = useCallback(async (): Promise<PIXI.Texture> => {
    const scenario = chapterManager.currentScenarioConfig?.id || 'default';
    const primaryPath = `/images/scenarios/${scenario}/characters/player-portrait.png`;
    const fallbackPath = `/images/scenarios/${scenario}/characters/player-portrait.svg`;
    return getTexture(primaryPath, fallbackPath);
  }, [getTexture]);

  const getEcoTexture = useCallback(async (phase: 'vigilante' | 'predator' | 'devastator'): Promise<PIXI.Texture> => {
    const scenario = chapterManager.currentScenarioConfig?.id || 'default';
    const primaryPath = `/images/scenarios/${scenario}/eco/eco-${phase}.png`;
    const fallbackPath = `/images/scenarios/${scenario}/eco/eco-${phase}.svg`;
    return getTexture(primaryPath, fallbackPath);
  }, [getTexture]);

  // Preload scenario assets
  const preloadScenario = useCallback(async (scenarioId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      console.log(`🎨 useAssets: Preloading scenario ${scenarioId}...`);
      
      // Use AssetManager to preload
      await assetManager.preloadScenarioAssets(scenarioId);
      
      setLoadingProgress(100);
      console.log(`✅ useAssets: Scenario ${scenarioId} preloaded successfully`);
    } catch (error) {
      console.error(`Failed to preload scenario ${scenarioId}:`, error);
      setError(`Failed to preload scenario: ${scenarioId}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear asset cache
  const clearCache = useCallback(() => {
    assetManager.clearScenarioCache();
    setError(null);
    setLoadingProgress(0);
  }, []);

  return {
    // State
    isLoading,
    loadingProgress,
    error,
    
    // Generic getters
    getTexture,
    getCachedTexture,
    getImagePath,
    
    // Scenario-specific getters
    getCardTexture,
    getEventTexture,
    getBackgroundTexture,
    getPlayerPortraitTexture,
    getEcoTexture,
    
    // Utilities
    preloadScenario,
    clearCache
  };
}

// Hook for specific asset types
export function useCardAssets() {
  const assets = useAssets();
  
  const getCardSprite = useCallback(async (cardId: string): Promise<PIXI.Sprite> => {
    const texture = await assets.getCardTexture(cardId);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  }, [assets]);

  return {
    ...assets,
    getCardSprite
  };
}

// Hook for UI assets
export function useUIAssets() {
  const assets = useAssets();

  const getUITexture = useCallback(async (uiElement: string): Promise<PIXI.Texture> => {
    const path = `/images/ui/${uiElement}.png`;
    const svgFallback = `/images/ui/${uiElement}.svg`;
    return assets.getTexture(path, svgFallback);
  }, [assets]);

  const getCardActionTexture = useCallback(async (action: string): Promise<PIXI.Texture> => {
    const path = `/images/ui/card-actions/${action}.png`;
    return assets.getTexture(path);
  }, [assets]);

  return {
    ...assets,
    getUITexture,
    getCardActionTexture
  };
}
