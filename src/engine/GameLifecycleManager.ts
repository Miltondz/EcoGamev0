// src/engine/GameLifecycleManager.ts

/**
 * Sistema de Lifecycle del Juego
 * Maneja el ciclo de vida completo: inicio, pausa, reset, fin
 * Asegura cleanup correcto y previene eventos después de game over
 * 🔧 MEJORES PRÁCTICAS: Reseteo completo de variables y estado
 */

import { gameStateManager } from './GameStateManager';
import { vfxSystem } from './VFXSystem';
import { audioManager } from './AudioManager';
import { localStorageManager } from './LocalStorageManager';
// import { layerSystem } from './LayerManager';
// import { floatingNumbersSystem } from './FloatingNumbersSystem';
import { pixiScreenEffects } from './PixiScreenEffects';
import { vfxController } from './VFXController';

export enum GameLifecycleState {
  MENU = 'menu',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  RESETTING = 'resetting',
}

export interface GameSession {
  startTime: number;
  endTime?: number;
  scenario: string;
  result?: 'won' | 'lost' | 'abandoned';
  playTimeMinutes: number;
  cardsPlayed: number;
  actionsPerformed: number;
}

class GameLifecycleManager {
  private static instance: GameLifecycleManager;
  private currentState: GameLifecycleState = GameLifecycleState.MENU;
  private currentSession: GameSession | null = null;
  private eventQueue: (() => void)[] = [];
  private cleanupTasks: (() => void)[] = [];
  private preventEventsAfterGameOver = false;
  private sessionStartTime = 0;
  
  private listeners: ((state: GameLifecycleState) => void)[] = [];

  private constructor() {
    this.setupGlobalEventPrevention();
  }

  static getInstance(): GameLifecycleManager {
    if (!GameLifecycleManager.instance) {
      GameLifecycleManager.instance = new GameLifecycleManager();
    }
    return GameLifecycleManager.instance;
  }

  // 🔧 ESTADO Y SUBSCRIPCIONES
  getCurrentState(): GameLifecycleState {
    return this.currentState;
  }

  isGameActive(): boolean {
    return this.currentState === GameLifecycleState.PLAYING;
  }

  isGameOver(): boolean {
    return this.currentState === GameLifecycleState.GAME_OVER;
  }

  shouldPreventEvents(): boolean {
    return this.preventEventsAfterGameOver && this.isGameOver();
  }

  subscribe(listener: (state: GameLifecycleState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private setState(newState: GameLifecycleState): void {
    if (this.currentState !== newState) {
      const previousState = this.currentState;
      this.currentState = newState;
      
      console.log(`🔄 GameLifecycle: State changed from ${previousState} to ${newState}`);
      
      // Notificar listeners
      this.listeners.forEach(listener => {
        try {
          listener(newState);
        } catch (error) {
          console.error('🔄 GameLifecycle: Error in state listener:', error);
        }
      });

      // Acciones específicas por estado
      this.handleStateChange(newState, previousState);
    }
  }

  private handleStateChange(newState: GameLifecycleState, previousState: GameLifecycleState): void {
    switch (newState) {
      case GameLifecycleState.PLAYING:
        this.preventEventsAfterGameOver = false;
        break;
        
      case GameLifecycleState.GAME_OVER:
        this.preventEventsAfterGameOver = true;
        this.endCurrentSession();
        break;
        
      case GameLifecycleState.RESETTING:
        this.preventEventsAfterGameOver = true;
        break;
        
      case GameLifecycleState.MENU:
        if (previousState === GameLifecycleState.PLAYING || previousState === GameLifecycleState.GAME_OVER) {
          this.abandonCurrentSession();
        }
        break;
    }
  }

  // 🔧 GESTIÓN DE SESIONES DE JUEGO
  startNewGame(scenario: string): void {
    console.log(`🎮 GameLifecycle: Starting new game with scenario: ${scenario}`);
    
    this.setState(GameLifecycleState.LOADING);
    
    // Crear nueva sesión
    this.currentSession = {
      startTime: Date.now(),
      scenario: scenario,
      playTimeMinutes: 0,
      cardsPlayed: 0,
      actionsPerformed: 0,
    };
    
    this.sessionStartTime = performance.now();
    
    // Resetear todos los sistemas
    this.performCompleteReset();
    
    // Marcar como jugando
    this.setState(GameLifecycleState.PLAYING);
    
    console.log('🎮 GameLifecycle: New game started successfully');
  }

  pauseGame(): void {
    if (this.currentState === GameLifecycleState.PLAYING) {
      this.setState(GameLifecycleState.PAUSED);
      
      // Pausar audio
      audioManager.pauseAll();
      
      console.log('⏸️ GameLifecycle: Game paused');
    }
  }

  resumeGame(): void {
    if (this.currentState === GameLifecycleState.PAUSED) {
      this.setState(GameLifecycleState.PLAYING);
      
      // Resumir audio
      audioManager.resumeAll();
      
      console.log('▶️ GameLifecycle: Game resumed');
    }
  }

  endGame(result: 'won' | 'lost'): void {
    if (this.currentState === GameLifecycleState.PLAYING) {
      console.log(`🏁 GameLifecycle: Game ended with result: ${result}`);
      
      // Actualizar sesión
      if (this.currentSession) {
        this.currentSession.result = result;
        this.currentSession.endTime = Date.now();
      }
      
      this.setState(GameLifecycleState.GAME_OVER);
      
      // Registrar estadísticas
      this.recordGameStatistics();
    }
  }

  returnToMenu(): void {
    console.log('🏠 GameLifecycle: Returning to menu');
    
    this.setState(GameLifecycleState.RESETTING);
    
    // Cleanup completo
    this.performCompleteCleanup();
    
    this.setState(GameLifecycleState.MENU);
  }

  // 🔧 RESET Y CLEANUP COMPLETO
  performCompleteReset(): void {
    console.log('🔄 GameLifecycle: Performing complete game reset');
    
    try {
      // 1. Reset GameStateManager
      gameStateManager.reset();
      
      // 2. Limpiar sistemas VFX
      this.cleanupVFXSystems();
      
      // 3. Reset sistemas de audio
      this.resetAudioSystems();
      
      // 4. Limpiar capas y contenedores
      this.cleanupLayersAndContainers();
      
      // 5. Reset variables de sesión
      this.resetSessionVariables();
      
      // 6. Ejecutar cleanup tasks registrados
      this.executeCleanupTasks();
      
      console.log('✅ GameLifecycle: Complete reset finished successfully');
      
    } catch (error) {
      console.error('❌ GameLifecycle: Error during complete reset:', error);
    }
  }

  private cleanupVFXSystems(): void {
    console.log('🧹 GameLifecycle: Cleaning VFX systems');
    
    try {
      // Limpiar zoom containers activos
      if (vfxController.cleanupActiveZooms) {
        vfxController.cleanupActiveZooms();
      }
      
      // Limpiar números flotantes (si tiene método de limpieza)
      // floatingNumbersSystem.clearAll(); // Método no disponible
      
      // Limpiar efectos de pantalla
      pixiScreenEffects.clearAllEffects();
      
    } catch (error) {
      console.error('❌ GameLifecycle: Error cleaning VFX systems:', error);
    }
  }

  private resetAudioSystems(): void {
    console.log('🔊 GameLifecycle: Resetting audio systems');
    
    try {
      // Detener toda la música y efectos
      audioManager.stopAll();
      
      // Reset a configuración por defecto
      audioManager.resetToDefaults();
      
    } catch (error) {
      console.error('❌ GameLifecycle: Error resetting audio:', error);
    }
  }

  private cleanupLayersAndContainers(): void {
    console.log('🗂️ GameLifecycle: Cleaning layers and containers');
    
    try {
      // Resetear todas las capas del LayerManager
      // layerSystem no tiene clearAllLayers, usar métodos individuales si es necesario
      
    } catch (error) {
      console.error('❌ GameLifecycle: Error cleaning layers:', error);
    }
  }

  private resetSessionVariables(): void {
    console.log('📊 GameLifecycle: Resetting session variables');
    
    // Limpiar queue de eventos
    this.eventQueue = [];
    
    // Reset flags
    this.preventEventsAfterGameOver = false;
  }

  private executeCleanupTasks(): void {
    console.log(`🧹 GameLifecycle: Executing ${this.cleanupTasks.length} cleanup tasks`);
    
    this.cleanupTasks.forEach((task, index) => {
      try {
        task();
        console.log(`✅ GameLifecycle: Cleanup task ${index + 1} completed`);
      } catch (error) {
        console.error(`❌ GameLifecycle: Cleanup task ${index + 1} failed:`, error);
      }
    });
  }

  private performCompleteCleanup(): void {
    console.log('🧹 GameLifecycle: Performing complete cleanup before menu');
    
    // Igual que reset pero más agresivo
    this.performCompleteReset();
    
    // Adicional: limpiar referencias de sesión
    this.currentSession = null;
    this.sessionStartTime = 0;
  }

  // 🔧 GESTIÓN DE EVENTOS Y PREVENCIÓN
  private setupGlobalEventPrevention(): void {
    // Interceptar eventos críticos cuando el juego termina
    const originalDispatch = vfxSystem.dispatch;
    
    vfxSystem.dispatch = (type: any, data: any) => {
      if (this.shouldPreventEvents()) {
        console.warn(`🚫 GameLifecycle: Preventing VFX event '${type}' after game over`);
        return;
      }
      
      return originalDispatch.call(vfxSystem, type, data);
    };
  }

  executeWhenSafe(callback: () => void): void {
    if (this.shouldPreventEvents()) {
      console.warn('🚫 GameLifecycle: Queuing callback, game is over');
      this.eventQueue.push(callback);
    } else {
      callback();
    }
  }

  // 🔧 REGISTRO DE CLEANUP TASKS
  registerCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  // 🔧 ESTADÍSTICAS Y SESIÓN
  private endCurrentSession(): void {
    if (this.currentSession) {
      const currentTime = performance.now();
      this.currentSession.playTimeMinutes = (currentTime - this.sessionStartTime) / (1000 * 60);
      this.currentSession.endTime = Date.now();
    }
  }

  private abandonCurrentSession(): void {
    if (this.currentSession && !this.currentSession.result) {
      this.currentSession.result = 'abandoned';
      this.currentSession.endTime = Date.now();
      
      const currentTime = performance.now();
      this.currentSession.playTimeMinutes = (currentTime - this.sessionStartTime) / (1000 * 60);
    }
  }

  private recordGameStatistics(): void {
    if (this.currentSession && this.currentSession.result && this.currentSession.result !== 'abandoned') {
      console.log('📊 GameLifecycle: Recording game statistics');
      
      const won = this.currentSession.result === 'won';
      localStorageManager.recordGameResult(
        won,
        this.currentSession.playTimeMinutes,
        this.currentSession.scenario
      );
      
      // Actualizar estadísticas adicionales
      localStorageManager.updateGameStatistics({
        cardsPlayed: localStorageManager.getGameStatistics().cardsPlayed + this.currentSession.cardsPlayed
      });
    }
  }

  // 🔧 MÉTODOS PÚBLICOS DE UTILIDAD
  incrementCardPlayed(): void {
    if (this.currentSession) {
      this.currentSession.cardsPlayed++;
    }
  }

  incrementActionPerformed(): void {
    if (this.currentSession) {
      this.currentSession.actionsPerformed++;
    }
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }
}

export const gameLifecycleManager = GameLifecycleManager.getInstance();
