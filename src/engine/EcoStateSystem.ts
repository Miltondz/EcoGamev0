/**
 * Sistema de Estados del ECO - Configurable
 * 
 * Maneja los diferentes estados visuales del ECO basado en configuración JSON.
 * Permite estados completamente personalizables por escenario.
 * 
 * - Carga configuración desde archivos JSON de escenario
 * - Soporte para transiciones dinámicas basadas en umbrales de HP
 * - Modificadores de comportamiento por fase
 * - Mensajes de transición personalizables
 */

import { gameStateManager } from './GameStateManager';

export type EcoState = string; // Dynamic states from JSON

export interface EcoStateConfig {
  id: string;
  name: string;
  threshold: number;
  description: string;
  imagePath: string;
  effectIntensity: 'low' | 'medium' | 'high';
  effects: string[];
  behaviorModifiers: {
    aggressiveness: number;
    eventFrequency: number;
    attackPower: number;
    corruptionRate: number;
  };
  flavorText: string;
}

export interface EcoConfiguration {
  id: string;
  name: string;
  description: string;
  scenarioId: string;
  lore?: string;
  phases: Record<string, EcoStateConfig>;
  globalSettings: {
    baseHp: number;
    adaptiveAI: boolean;
    phaseTransitionEffects: boolean;
    fallbackImage: string;
    weakness?: string;
    weaknessDescription?: string;
  };
  transitionMessages: Record<string, string>;
}

class EcoStateSystem {
  private currentState: EcoState = 'vigilante';
  private listeners: ((state: EcoState, config: EcoStateConfig) => void)[] = [];
  private configuration: EcoConfiguration | null = null;
  private stateConfigs: Record<string, EcoStateConfig> = {};
  private orderedStates: string[] = []; // States ordered by threshold (descending)

  constructor() {
    // Subscribe to game state changes
    gameStateManager.subscribe(() => {
      this.updateEcoState();
    });
    
    // Load default configuration
    this.loadConfiguration('default').catch(error => {
      console.error('🚨 EcoStateSystem: Failed to load default configuration:', error);
      this.loadFallbackConfiguration();
    });
  }

  /**
   * Carga la configuración del ECO desde un archivo JSON de escenario
   */
  async loadConfiguration(scenarioId: string): Promise<void> {
    try {
      const response = await fetch(`/scenarios/${scenarioId}/eco.json`);
      if (!response.ok) {
        throw new Error(`Failed to load eco configuration: ${response.status}`);
      }
      
      const config: EcoConfiguration = await response.json();
      this.setConfiguration(config);
      
      console.log(`✅ EcoStateSystem: Loaded configuration for ${config.name}`);
    } catch (error) {
      console.error(`🚨 EcoStateSystem: Error loading configuration for ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Establece la configuración del ECO y procesa los estados
   */
  private setConfiguration(config: EcoConfiguration): void {
    this.configuration = config;
    this.stateConfigs = { ...config.phases };
    
    // Ordenar estados por umbral (descendente)
    this.orderedStates = Object.keys(config.phases).sort((a, b) => 
      config.phases[b].threshold - config.phases[a].threshold
    );
    
    // Establecer estado inicial
    this.currentState = this.orderedStates[0] || 'vigilante';
    
    console.log(`📊 EcoStateSystem: Configured with states: ${this.orderedStates.join(' → ')}`);
  }

  /**
   * Configuración de fallback si falla la carga del JSON
   */
  private loadFallbackConfiguration(): void {
    const fallbackConfig: EcoConfiguration = {
      id: 'eco_fallback',
      name: 'ECO - Configuración Básica',
      description: 'Configuración básica de respaldo para el ECO.',
      scenarioId: 'default',
      phases: {
        vigilante: {
          id: 'vigilante',
          name: 'Vigilante',
          threshold: 60,
          description: 'El ECO está observando',
          imagePath: '/images/scenarios/default/eco/eco-vigilante.png',
          effectIntensity: 'low',
          effects: ['basic_attack'],
          behaviorModifiers: {
            aggressiveness: 0.3,
            eventFrequency: 0.8,
            attackPower: 1.0,
            corruptionRate: 0.5
          },
          flavorText: 'El ECO observa desde las sombras.'
        },
        predator: {
          id: 'predator',
          name: 'Depredador',
          threshold: 25,
          description: 'El ECO se vuelve agresivo',
          imagePath: '/images/scenarios/default/eco/eco-predator.png',
          effectIntensity: 'medium',
          effects: ['basic_attack', 'insert_hallucination'],
          behaviorModifiers: {
            aggressiveness: 0.6,
            eventFrequency: 1.2,
            attackPower: 1.3,
            corruptionRate: 1.0
          },
          flavorText: 'El ECO ataca con ferocidad.'
        },
        devastator: {
          id: 'devastator',
          name: 'Devastador',
          threshold: 0,
          description: 'El ECO está enfurecido',
          imagePath: '/images/scenarios/default/eco/eco-devastator.png',
          effectIntensity: 'high',
          effects: ['enhanced_attack', 'corrupt', 'insert_hallucination'],
          behaviorModifiers: {
            aggressiveness: 1.0,
            eventFrequency: 1.5,
            attackPower: 1.8,
            corruptionRate: 1.5
          },
          flavorText: 'El ECO desata toda su furia.'
        }
      },
      globalSettings: {
        baseHp: 50,
        adaptiveAI: true,
        phaseTransitionEffects: true,
        fallbackImage: '/images/scenarios/default/eco/eco-vigilante.png'
      },
      transitionMessages: {
        vigilante_to_predator: 'El ECO se vuelve más agresivo...',
        predator_to_devastator: 'El ECO entra en furia total.'
      }
    };
    
    this.setConfiguration(fallbackConfig);
    console.log('⚠️  EcoStateSystem: Using fallback configuration');
  }

  /**
   * Calcula el estado actual del ECO basado en su HP y umbrales configurados
   */
  private calculateEcoState(): EcoState {
    if (!this.configuration || this.orderedStates.length === 0) {
      return this.currentState; // Keep current state if no configuration
    }

    const currentHp = gameStateManager.ecoHp;
    const maxHp = gameStateManager.maxEcoHp;
    const hpPercentage = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;

    // Buscar el estado apropiado basado en umbrales (de mayor a menor)
    for (const stateId of this.orderedStates) {
      const config = this.stateConfigs[stateId];
      if (hpPercentage >= config.threshold) {
        return stateId;
      }
    }

    // Fallback al estado de menor umbral
    return this.orderedStates[this.orderedStates.length - 1] || 'devastator';
  }

  /**
   * Actualiza el estado del ECO si ha cambiado
   */
  private updateEcoState(): void {
    const newState = this.calculateEcoState();
    
    if (newState !== this.currentState) {
      const oldState = this.currentState;
      this.currentState = newState;
      const config = this.stateConfigs[newState];
      
      if (config) {
        console.log(`🎭 EcoStateSystem: Estado cambió de '${oldState}' a '${newState}' (${gameStateManager.ecoHp}/${gameStateManager.maxEcoHp} HP)`);
        console.log(`    → ${config.flavorText}`);
        
        // Mostrar mensaje de transición si existe
        const transitionKey = `${oldState}_to_${newState}`;
        if (this.configuration?.transitionMessages[transitionKey]) {
          console.log(`🗨️  Transición: ${this.configuration.transitionMessages[transitionKey]}`);
        }
        
        // Notificar a listeners
        this.notifyListeners(newState, config);
      }
    }
  }

  /**
   * Obtiene el estado actual del ECO
   */
  getCurrentState(): EcoState {
    return this.currentState;
  }

  /**
   * Obtiene la configuración del estado actual
   */
  getCurrentConfig(): EcoStateConfig | null {
    return this.stateConfigs[this.currentState] || null;
  }

  /**
   * Obtiene la configuración de un estado específico
   */
  getStateConfig(state: EcoState): EcoStateConfig | null {
    return this.stateConfigs[state] || null;
  }

  /**
   * Obtiene la configuración completa del ECO
   */
  getConfiguration(): EcoConfiguration | null {
    return this.configuration;
  }

  /**
   * Forzar actualización del estado (útil para debugging)
   */
  forceUpdate(): void {
    this.updateEcoState();
  }

  /**
   * Subscribirse a cambios de estado del ECO
   */
  subscribe(listener: (state: EcoState, config: EcoStateConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Enviar estado actual inmediatamente
    const currentConfig = this.getCurrentConfig();
    if (currentConfig) {
      listener(this.currentState, currentConfig);
    }
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners(state: EcoState, config: EcoStateConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(state, config);
      } catch (error) {
        console.error('🚨 EcoStateSystem: Error en listener:', error);
      }
    });
  }

  /**
   * Obtener todas las configuraciones disponibles (para debugging/UI)
   */
  getAllConfigs(): Record<string, EcoStateConfig> {
    return { ...this.stateConfigs };
  }

  /**
   * Obtener lista de estados disponibles en orden
   */
  getAvailableStates(): string[] {
    return [...this.orderedStates];
  }

  /**
   * Obtener modificadores de comportamiento del estado actual
   */
  getCurrentBehaviorModifiers(): any {
    const config = this.getCurrentConfig();
    return config?.behaviorModifiers || {
      aggressiveness: 0.5,
      eventFrequency: 1.0,
      attackPower: 1.0,
      corruptionRate: 0.5
    };
  }

  /**
   * Obtener información de diagnóstico
   */
  getDebugInfo(): {
    currentState: EcoState;
    hpPercentage: number;
    hpRaw: string;
    config: EcoStateConfig | null;
    configurationName: string;
    availableStates: string[];
    behaviorModifiers: any;
  } {
    const hpPercentage = Math.round((gameStateManager.ecoHp / gameStateManager.maxEcoHp) * 100);
    
    return {
      currentState: this.currentState,
      hpPercentage,
      hpRaw: `${gameStateManager.ecoHp}/${gameStateManager.maxEcoHp}`,
      config: this.getCurrentConfig(),
      configurationName: this.configuration?.name || 'No Configuration',
      availableStates: this.orderedStates,
      behaviorModifiers: this.getCurrentBehaviorModifiers()
    };
  }
}

// Singleton instance
export const ecoStateSystem = new EcoStateSystem();
