// src/engine/AudioManager.ts

/**
 * Sistema de Audio para ECO Game
 * Maneja música de fondo, efectos de sonido y audio por escenarios
 * 🔧 MEJORADO: Integra con LocalStorageManager y mejores prácticas de memoria
 */

import { localStorageManager } from './LocalStorageManager';

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  currentScenario: string;
}

export interface AudioTrack {
  id: string;
  path: string;
  type: 'music' | 'effect';
  scenario?: string;
  loop?: boolean;
  volume?: number;
}

export type MusicTrackId = 
  | 'menu'
  | 'ambient'
  | 'tension'
  | 'combat'
  | 'victory'
  | 'defeat';

export type EffectId = 
  | 'menu-select'
  | 'card-play'
  | 'card-hover'
  | 'attack-hit'
  | 'attack-hit-1'
  | 'attack-hit-2'
  | 'attack-hit-3'
  | 'attack-cut-1'
  | 'attack-cut-2'
  | 'attack-shot'
  | 'attack-special'
  | 'treasure'
  | 'treasure-1'
  | 'treasure-2'
  | 'treasure-3'
  | 'event-danger'
  | 'event-scary'
  | 'event-strange'
  | 'event-morning'
  | 'game-over';

class AudioManager {
  private static instance: AudioManager;
  private config: AudioConfig;
  private musicTracks: Map<string, HTMLAudioElement> = new Map();
  private effectTracks: Map<string, HTMLAudioElement> = new Map();
  private currentMusicTrack: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private listeners: (() => void)[] = [];
  private preloadedTracks: Set<string> = new Set();

  private constructor() {
    this.config = this.loadConfig();
    this.initializeAudioContext();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private loadConfig(): AudioConfig {
    // 🔧 MEJORADO: Usar LocalStorageManager para configuración persistente
    const settings = localStorageManager.getGameSettings();
    return {
      masterVolume: settings.audio.masterVolume,
      musicVolume: settings.audio.musicVolume,
      effectsVolume: settings.audio.effectsVolume,
      musicEnabled: settings.audio.musicEnabled,
      effectsEnabled: settings.audio.effectsEnabled,
      currentScenario: 'default'
    };
  }

  private getDefaultConfig(): AudioConfig {
    return {
      masterVolume: 0.7,
      musicVolume: 0.8,
      effectsVolume: 0.9,
      musicEnabled: true,
      effectsEnabled: true,
      currentScenario: 'default'
    };
  }

  private saveConfig(): void {
    // 🔧 MEJORADO: Usar LocalStorageManager para persistencia
    try {
      localStorageManager.saveGameSettings({
        audio: {
          masterVolume: this.config.masterVolume,
          musicVolume: this.config.musicVolume,
          effectsVolume: this.config.effectsVolume,
          musicEnabled: this.config.musicEnabled,
          effectsEnabled: this.config.effectsEnabled,
        }
      });
    } catch (error) {
      console.error('🔊 AudioManager: Error saving config:', error);
    }
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      // Crear AudioContext para mejor control
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context on user interaction (required by browsers)
      document.addEventListener('click', () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
      }, { once: true });
      
      console.log('🔊 AudioManager: Audio context initialized');
    } catch (error) {
      console.warn('🔊 AudioManager: Could not initialize AudioContext:', error);
    }
  }

  /**
   * Configura el escenario actual y precarga su audio
   */
  async setScenario(scenarioId: string): Promise<void> {
    if (this.config.currentScenario === scenarioId) return;
    
    console.log(`🔊 AudioManager: Setting scenario to ${scenarioId}`);
    this.config.currentScenario = scenarioId;
    this.saveConfig();
    
    // Precargar audio del escenario
    await this.preloadScenarioAudio(scenarioId);
  }

  /**
   * Precarga el audio específico de un escenario
   */
  private async preloadScenarioAudio(scenarioId: string): Promise<void> {
    const musicTracks = [
      { id: 'ambient', path: `/audio/scenarios/${scenarioId}/ambient.mp3`, loop: true },
      { id: 'tension', path: `/audio/scenarios/${scenarioId}/tension.mp3`, loop: true },
      { id: 'victory', path: `/audio/scenarios/${scenarioId}/victory.mp3`, loop: false }
    ];

    const effectTracks = [
      { id: 'menu-select', path: '/audio/effects/menu-select.mp3' },
      { id: 'attack-hit-1', path: '/audio/effects/attack-hit-1.mp3' },
      { id: 'attack-hit-2', path: '/audio/effects/attack-hit-2.mp3' },
      { id: 'attack-hit-3', path: '/audio/effects/attack-hit-3.mp3' },
      { id: 'attack-special', path: '/audio/effects/attack-special.mp3' },
      { id: 'event-danger', path: '/audio/effects/event-danger.mp3' },
      { id: 'event-scary', path: '/audio/effects/event-scary.mp3' },
      { id: 'game-over', path: '/audio/effects/game-over.mp3' },
      { id: 'treasure-1', path: '/audio/effects/treasure-1.mp3' },
      { id: 'treasure-2', path: '/audio/effects/treasure-2.mp3' },
      { id: 'treasure-3', path: '/audio/effects/treasure-3.mp3' }
    ];

    // Precargar música
    const musicPromises = musicTracks.map(track => this.preloadAudio(track, 'music'));
    const effectPromises = effectTracks.map(track => this.preloadAudio(track, 'effect'));

    try {
      await Promise.all([...musicPromises, ...effectPromises]);
      console.log(`🔊 AudioManager: Preloaded audio for scenario: ${scenarioId}`);
    } catch (error) {
      console.warn(`🔊 AudioManager: Some audio failed to preload for ${scenarioId}:`, error);
    }
  }

  private async preloadAudio(track: { id: string; path: string; loop?: boolean }, type: 'music' | 'effect'): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      // Extraer scenarioId del path en lugar de usar this.config.currentScenario
      const scenarioMatch = track.path.match(/\/scenarios\/([^/]+)\//);
      const scenarioId = scenarioMatch ? scenarioMatch[1] : this.config.currentScenario;
      const trackKey = `${scenarioId}-${track.id}`;
      console.log(`🔊 AudioManager: Preloading ${type} with key: ${trackKey} from path: ${track.path}`);
      
      audio.preload = 'auto';
      audio.loop = track.loop || false;
      
      // Configurar volumen base
      if (type === 'music') {
        audio.volume = this.config.masterVolume * this.config.musicVolume;
      } else {
        audio.volume = this.config.masterVolume * this.config.effectsVolume;
      }

      audio.addEventListener('canplaythrough', () => {
        if (type === 'music') {
          this.musicTracks.set(trackKey, audio);
          console.log(`✅ AudioManager: Music track loaded and cached: ${trackKey}`);
        } else {
          this.effectTracks.set(trackKey, audio);
          console.log(`✅ AudioManager: Effect track loaded and cached: ${trackKey}`);
        }
        this.preloadedTracks.add(trackKey);
        resolve();
      });

      audio.addEventListener('error', (error) => {
        console.warn(`🔊 AudioManager: Failed to load ${track.path}:`, error);
        resolve(); // Continúa aunque falle
      });

      audio.src = track.path;
    });
  }

  /**
   * Reproduce música de fondo
   */
  async playMusic(trackId: MusicTrackId, fadeIn: boolean = true): Promise<void> {
    if (!this.config.musicEnabled) return;

    const trackKey = `${this.config.currentScenario}-${trackId}`;
    let audio = this.musicTracks.get(trackKey);
    
    console.log(`🔊 AudioManager: Looking for music track: ${trackKey}`);
    console.log(`🔊 AudioManager: Available music tracks:`, Array.from(this.musicTracks.keys()));

    if (!audio) {
      console.warn(`🔊 AudioManager: Music track not found: ${trackKey}`);
      // Intentar precargar en caliente y reintentar una vez
      try {
        await this.preloadAudio({ id: trackId, path: `/audio/scenarios/${this.config.currentScenario}/${trackId}.mp3`, loop: trackId !== 'victory' }, 'music');
        const retryAudio = this.musicTracks.get(trackKey);
        if (!retryAudio) {
          console.warn(`🔊 AudioManager: Still missing track after hot-preload: ${trackKey}`);
          return;
        }
        // Reasignar para continuar con la reproducción
        console.log(`🔊 AudioManager: Hot-preloaded music track: ${trackKey}`);
        audio = retryAudio;
      } catch (e) {
        console.warn(`🔊 AudioManager: Hot-preload failed for ${trackKey}:`, e);
        return;
      }
    }

    // Fade out current track if exists
    if (this.currentMusicTrack && this.currentMusicTrack !== audio) {
      await this.fadeOut(this.currentMusicTrack, 1000);
      this.currentMusicTrack.pause();
    }

    this.currentMusicTrack = audio;
    audio.currentTime = 0;

    if (fadeIn) {
      audio.volume = 0;
      await this.fadeIn(audio, 2000);
    }

    try {
      await audio.play();
      console.log(`🔊 AudioManager: Playing music: ${trackId}`);
    } catch (error) {
      console.warn(`🔊 AudioManager: Could not play music ${trackId}:`, error);
    }
  }

  /**
   * Reproduce efecto de sonido
   */
  async playEffect(effectId: EffectId, volume: number = 1.0, loop: boolean = false): Promise<void> {
    if (!this.config.effectsEnabled) return;

    // Para efectos, usar key global ya que son compartidos
    const effectKey = `global-${effectId}`;
    let audio = this.effectTracks.get(effectKey);

    // Si no está precargado, crear dinámicamente
    if (!audio) {
      audio = new Audio();
      const effectPaths: Record<string, string> = {
        'menu-select': '/audio/effects/menu-select.mp3',
        'card-play': '/audio/effects/attack-cut-1.mp3',
        'card-hover': '/audio/effects/menu-select.mp3',
        'attack-hit': '/audio/effects/attack-hit-1.mp3',
        'attack-hit-1': '/audio/effects/attack-hit-1.mp3',
        'attack-hit-2': '/audio/effects/attack-hit-2.mp3',
        'attack-hit-3': '/audio/effects/attack-hit-3.mp3',
        'attack-cut-1': '/audio/effects/attack-cut-1.mp3',
        'attack-cut-2': '/audio/effects/attack-cut-2.mp3',
        'attack-shot': '/audio/effects/attack-shot.mp3',
        'attack-special': '/audio/effects/attack-special.mp3',
        'treasure': '/audio/effects/treasure-1.mp3',
        'treasure-1': '/audio/effects/treasure-1.mp3',
        'treasure-2': '/audio/effects/treasure-2.mp3',
        'treasure-3': '/audio/effects/treasure-3.mp3',
        'event-danger': '/audio/effects/event-danger.mp3',
        'event-scary': '/audio/effects/event-scary.mp3',
        'event-strange': '/audio/effects/event-strange.mp3',
        'event-morning': '/audio/effects/event-morning.mp3',
        'game-over': '/audio/effects/game-over.mp3'
      };

      audio.src = effectPaths[effectId] || '/audio/effects/menu-select.mp3';
      this.effectTracks.set(effectKey, audio);
    }

    // Configurar loop y volumen
    audio.loop = loop;
    audio.volume = this.config.masterVolume * this.config.effectsVolume * volume;
    
    // Solo reiniciar si no está en loop o si está pausado
    if (!loop || audio.paused) {
      audio.currentTime = 0;
    }

    try {
      await audio.play();
      console.log(`🔊 AudioManager: Playing effect: ${effectId}${loop ? ' (loop)' : ''}`);
    } catch (error) {
      console.warn(`🔊 AudioManager: Could not play effect ${effectId}:`, error);
    }
  }

  /**
   * Para la música actual
   */
  stopMusic(fadeOut: boolean = true): void {
    if (!this.currentMusicTrack) return;

    if (fadeOut) {
      this.fadeOut(this.currentMusicTrack, 1000).then(() => {
        if (this.currentMusicTrack) {
          this.currentMusicTrack.pause();
          this.currentMusicTrack = null;
        }
      });
    } else {
      this.currentMusicTrack.pause();
      this.currentMusicTrack = null;
    }
  }

  /**
   * Para un efecto específico
   */
  stopEffect(effectId: EffectId): void {
    const effectKey = `global-${effectId}`;
    const audio = this.effectTracks.get(effectKey);
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      console.log(`🔊 AudioManager: Stopped effect: ${effectId}`);
    }
  }

  /**
   * Fade in animation
   */
  private fadeIn(audio: HTMLAudioElement, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const targetVolume = this.config.masterVolume * this.config.musicVolume;
      const startVolume = 0;
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = (targetVolume - startVolume) / steps;
      
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.min(startVolume + (volumeStep * currentStep), targetVolume);
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Fade out animation
   */
  private fadeOut(audio: HTMLAudioElement, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = audio.volume;
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = startVolume / steps;
      
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(startVolume - (volumeStep * currentStep), 0);
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Configuración de volumen
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveConfig();
    this.notify();
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolumes();
    this.saveConfig();
    this.notify();
  }

  setEffectsVolume(volume: number): void {
    this.config.effectsVolume = Math.max(0, Math.min(1, volume));
    this.updateEffectVolumes();
    this.saveConfig();
    this.notify();
  }

  private updateAllVolumes(): void {
    this.updateMusicVolumes();
    this.updateEffectVolumes();
  }

  private updateMusicVolumes(): void {
    const targetVolume = this.config.masterVolume * this.config.musicVolume;
    this.musicTracks.forEach(audio => {
      audio.volume = targetVolume;
    });
  }

  private updateEffectVolumes(): void {
    const targetVolume = this.config.masterVolume * this.config.effectsVolume;
    this.effectTracks.forEach(audio => {
      audio.volume = targetVolume;
    });
  }

  /**
   * Toggle música y efectos
   */
  toggleMusic(): void {
    this.config.musicEnabled = !this.config.musicEnabled;
    if (!this.config.musicEnabled && this.currentMusicTrack) {
      this.stopMusic(true);
    }
    this.saveConfig();
    this.notify();
  }

  toggleEffects(): void {
    this.config.effectsEnabled = !this.config.effectsEnabled;
    this.saveConfig();
    this.notify();
  }

  /**
   * Getters para configuración
   */
  get currentConfig(): AudioConfig {
    return { ...this.config };
  }

  get isInitialized(): boolean {
    return this.preloadedTracks.size > 0;
  }

  /**
   * Sistema de eventos
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Pausa todo el audio
   */
  pauseAll(): void {
    if (this.currentMusicTrack) {
      this.currentMusicTrack.pause();
    }
    
    // Pausar efectos activos
    this.effectTracks.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
    
    console.log('⏸️ AudioManager: All audio paused');
  }

  /**
   * Resume todo el audio
   */
  resumeAll(): void {
    if (this.currentMusicTrack && this.currentMusicTrack.paused) {
      this.currentMusicTrack.play().catch(error => {
        console.warn('🔊 AudioManager: Error resuming music:', error);
      });
    }
    
    console.log('▶️ AudioManager: All audio resumed');
  }

  /**
   * Para todo el audio
   */
  stopAll(): void {
    this.stopMusic(false);
    
    this.effectTracks.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    console.log('🔇 AudioManager: All audio stopped');
  }

  /**
   * Reset a configuración por defecto
   */
  resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    console.log('🔄 AudioManager: Reset to defaults');
  }

  /**
   * Cleanup para evitar memory leaks
   */
  dispose(): void {
    this.stopMusic(false);
    this.musicTracks.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.effectTracks.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.musicTracks.clear();
    this.effectTracks.clear();
    this.preloadedTracks.clear();
    this.listeners = [];
  }
}

// Singleton instance
export const audioManager = AudioManager.getInstance();
