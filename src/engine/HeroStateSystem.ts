/**
 * Sistema de Estados del Héroe
 * 
 * Maneja los diferentes estados visuales del héroe basados en:
 * - Vitalidad (PV) restante
 * - Cordura (Sanity) restante 
 * - Combinación de ambos stats
 * 
 * Estados disponibles:
 * - healthy: Buena salud y cordura (PV >= 75%, Sanity >= 75%)
 * - tired: Cansado pero funcional (PV >= 50%, Sanity >= 50%)
 * - wounded: Herido físicamente (PV < 50%, Sanity >= 50%)
 * - stressed: Mentalmente afectado (PV >= 50%, Sanity < 50%)  
 * - critical: Estado crítico (PV < 50%, Sanity < 50%)
 * - dying: Al borde de la muerte (PV <= 25% || Sanity <= 25%)
 */

import { gameStateManager } from './GameStateManager';

export type HeroState = 'healthy' | 'tired' | 'wounded' | 'stressed' | 'critical' | 'dying';

export interface HeroStateConfig {
  state: HeroState;
  imagePath: string;
  description: string;
  priority: number; // Para resolver conflictos entre estados
  requirements: {
    pvMin?: number; // Porcentaje mínimo
    pvMax?: number; // Porcentaje máximo 
    sanityMin?: number;
    sanityMax?: number;
  };
}

const HERO_STATE_CONFIGS: Record<HeroState, HeroStateConfig> = {
  healthy: {
    state: 'healthy',
    imagePath: '/images/scenarios/default/characters/player-healthy.png',
    description: 'El héroe está en buena forma física y mental',
    priority: 1,
    requirements: {
      pvMin: 75,
      sanityMin: 75
    }
  },
  tired: {
    state: 'tired', 
    imagePath: '/images/scenarios/default/characters/player-tired.png',
    description: 'El héroe muestra signos de fatiga',
    priority: 2,
    requirements: {
      pvMin: 50,
      sanityMin: 50,
      pvMax: 74,
      sanityMax: 74
    }
  },
  wounded: {
    state: 'wounded',
    imagePath: '/images/scenarios/default/characters/player-wounded.png', 
    description: 'El héroe está herido físicamente pero mentalmente estable',
    priority: 3,
    requirements: {
      pvMax: 49,
      sanityMin: 50
    }
  },
  stressed: {
    state: 'stressed',
    imagePath: '/images/scenarios/default/characters/player-stressed.png',
    description: 'El héroe está mentalmente afectado pero físicamente bien',
    priority: 3,
    requirements: {
      pvMin: 50,
      sanityMax: 49
    }
  },
  critical: {
    state: 'critical',
    imagePath: '/images/scenarios/default/characters/player-critical.png',
    description: 'El héroe está en estado crítico tanto física como mentalmente',
    priority: 4,
    requirements: {
      pvMax: 49,
      sanityMax: 49
    }
  },
  dying: {
    state: 'dying',
    imagePath: '/images/scenarios/default/characters/player-dying.png',
    description: 'El héroe está al borde de la muerte',
    priority: 5,
    requirements: {
      // Se activa si PV <= 25% O Sanity <= 25%
    }
  }
};

class HeroStateSystem {
  private currentState: HeroState = 'healthy';
  private listeners: ((state: HeroState, config: HeroStateConfig) => void)[] = [];

  constructor() {
    // Subscribe to game state changes
    gameStateManager.subscribe(() => {
      this.updateHeroState();
    });
  }

  /**
   * Calcula el estado actual del héroe basado en PV y Sanity
   */
  private calculateHeroState(): HeroState {
    const currentPV = gameStateManager.pv;
    const maxPV = gameStateManager.maxPV;
    const currentSanity = gameStateManager.sanity;
    const maxSanity = gameStateManager.maxSanity;
    
    const pvPercentage = maxPV > 0 ? Math.round((currentPV / maxPV) * 100) : 0;
    const sanityPercentage = maxSanity > 0 ? Math.round((currentSanity / maxSanity) * 100) : 0;

    // Verificar estado de muerte primero (prioridad más alta)
    if (pvPercentage <= 25 || sanityPercentage <= 25) {
      return 'dying';
    }

    // Verificar otros estados en orden de prioridad
    const possibleStates: HeroState[] = [];

    for (const [stateName, config] of Object.entries(HERO_STATE_CONFIGS)) {
      if (stateName === 'dying') continue; // Ya verificado arriba

      const req = config.requirements;
      let matches = true;

      // Verificar requisitos de PV
      if (req.pvMin !== undefined && pvPercentage < req.pvMin) matches = false;
      if (req.pvMax !== undefined && pvPercentage > req.pvMax) matches = false;
      
      // Verificar requisitos de Sanity
      if (req.sanityMin !== undefined && sanityPercentage < req.sanityMin) matches = false;
      if (req.sanityMax !== undefined && sanityPercentage > req.sanityMax) matches = false;

      if (matches) {
        possibleStates.push(stateName as HeroState);
      }
    }

    // Si hay múltiples estados posibles, elegir el de mayor prioridad
    if (possibleStates.length > 0) {
      possibleStates.sort((a, b) => 
        HERO_STATE_CONFIGS[b].priority - HERO_STATE_CONFIGS[a].priority
      );
      return possibleStates[0];
    }

    // Fallback
    return 'tired';
  }

  /**
   * Actualiza el estado del héroe si ha cambiado
   */
  private updateHeroState(): void {
    const newState = this.calculateHeroState();
    
    if (newState !== this.currentState) {
      const oldState = this.currentState;
      this.currentState = newState;
      const config = HERO_STATE_CONFIGS[newState];
      
      console.log(`👤 HeroStateSystem: Estado cambió de '${oldState}' a '${newState}' (PV: ${gameStateManager.pv}/${gameStateManager.maxPV}, Sanity: ${gameStateManager.sanity}/${gameStateManager.maxSanity})`);
      
      // Notificar a listeners
      this.notifyListeners(newState, config);
    }
  }

  /**
   * Obtiene el estado actual del héroe
   */
  getCurrentState(): HeroState {
    return this.currentState;
  }

  /**
   * Obtiene la configuración del estado actual
   */
  getCurrentConfig(): HeroStateConfig {
    return HERO_STATE_CONFIGS[this.currentState];
  }

  /**
   * Obtiene la configuración de un estado específico
   */
  getStateConfig(state: HeroState): HeroStateConfig {
    return HERO_STATE_CONFIGS[state];
  }

  /**
   * Forzar actualización del estado (útil para debugging)
   */
  forceUpdate(): void {
    this.updateHeroState();
  }

  /**
   * Subscribirse a cambios de estado del héroe
   */
  subscribe(listener: (state: HeroState, config: HeroStateConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Enviar estado actual inmediatamente
    const currentConfig = this.getCurrentConfig();
    listener(this.currentState, currentConfig);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners(state: HeroState, config: HeroStateConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(state, config);
      } catch (error) {
        console.error('🚨 HeroStateSystem: Error en listener:', error);
      }
    });
  }

  /**
   * Obtener todas las configuraciones disponibles (para debugging/UI)
   */
  getAllConfigs(): Record<HeroState, HeroStateConfig> {
    return { ...HERO_STATE_CONFIGS };
  }

  /**
   * Obtener información de diagnóstico
   */
  getDebugInfo(): {
    currentState: HeroState;
    pvPercentage: number;
    sanityPercentage: number;
    pvRaw: string;
    sanityRaw: string;
    config: HeroStateConfig;
  } {
    const pvPercentage = Math.round((gameStateManager.pv / gameStateManager.maxPV) * 100);
    const sanityPercentage = Math.round((gameStateManager.sanity / gameStateManager.maxSanity) * 100);
    
    return {
      currentState: this.currentState,
      pvPercentage,
      sanityPercentage,
      pvRaw: `${gameStateManager.pv}/${gameStateManager.maxPV}`,
      sanityRaw: `${gameStateManager.sanity}/${gameStateManager.maxSanity}`,
      config: this.getCurrentConfig()
    };
  }
}

// Singleton instance
export const heroStateSystem = new HeroStateSystem();
