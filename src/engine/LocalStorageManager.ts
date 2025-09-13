// src/engine/LocalStorageManager.ts

/**
 * Sistema de localStorage inteligente para ECO Game
 * Maneja configuraciones, estadísticas y preferencias del usuario
 * Con fallbacks y validación de datos
 */

export interface GameSettings {
  graphics: {
    pixiQuality: 'low' | 'medium' | 'high';
    enableParticles: boolean;
    enableAnimations: boolean;
    enableScreenEffects: boolean;
  };
  audio: {
    masterVolume: number;
    musicVolume: number;
    effectsVolume: number;
    musicEnabled: boolean;
    effectsEnabled: boolean;
  };
  gameplay: {
    autoSkipAnimations: boolean;
    confirmCardActions: boolean;
    showTooltips: boolean;
    debugMode: boolean;
  };
  ui: {
    cardZoomOnHover: boolean;
    showAdvancedStats: boolean;
    compactMode: boolean;
    theme: 'dark' | 'light' | 'auto';
  };
}

export interface GameStatistics {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalPlayTime: number; // en minutos
  bestWinTime: number; // en minutos
  averageWinTime: number;
  cardsPlayed: number;
  favoriteStrategy: string;
  lastPlayed: string; // ISO date
  achievements: string[];
  scenarios: {
    [scenarioId: string]: {
      played: number;
      won: number;
      bestTime: number;
    };
  };
}

export interface UserPreferences {
  lastScenario: string;
  preferredDifficulty: 'easy' | 'normal' | 'hard';
  tutorialCompleted: boolean;
  seenIntros: string[];
  customKeybinds: { [action: string]: string };
  language: string;
}

class LocalStorageManager {
  private static instance: LocalStorageManager;
  private readonly STORAGE_VERSION = '1.0';
  private readonly KEYS = {
    SETTINGS: 'eco_game_settings',
    STATISTICS: 'eco_game_statistics',
    PREFERENCES: 'eco_game_preferences',
    VERSION: 'eco_storage_version',
  };

  private constructor() {
    this.migrateStorageIfNeeded();
  }

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // 🔧 CONFIGURACIONES DEL JUEGO
  getGameSettings(): GameSettings {
    const defaults: GameSettings = {
      graphics: {
        pixiQuality: 'medium',
        enableParticles: true,
        enableAnimations: true,
        enableScreenEffects: true,
      },
      audio: {
        masterVolume: 0.7,
        musicVolume: 0.8,
        effectsVolume: 0.9,
        musicEnabled: true,
        effectsEnabled: true,
      },
      gameplay: {
        autoSkipAnimations: false,
        confirmCardActions: true,
        showTooltips: true,
        debugMode: false,
      },
      ui: {
        cardZoomOnHover: true,
        showAdvancedStats: false,
        compactMode: false,
        theme: 'auto',
      },
    };

    return this.loadWithDefaults(this.KEYS.SETTINGS, defaults);
  }

  saveGameSettings(settings: Partial<GameSettings>): void {
    const current = this.getGameSettings();
    const merged = this.deepMerge(current, settings);
    this.saveData(this.KEYS.SETTINGS, merged);
    console.log('💾 LocalStorage: Game settings saved');
  }

  // 🔧 ESTADÍSTICAS DEL JUEGO
  getGameStatistics(): GameStatistics {
    const defaults: GameStatistics = {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalPlayTime: 0,
      bestWinTime: 0,
      averageWinTime: 0,
      cardsPlayed: 0,
      favoriteStrategy: '',
      lastPlayed: new Date().toISOString(),
      achievements: [],
      scenarios: {},
    };

    return this.loadWithDefaults(this.KEYS.STATISTICS, defaults);
  }

  updateGameStatistics(updates: Partial<GameStatistics>): void {
    const current = this.getGameStatistics();
    const merged = this.deepMerge(current, updates);
    merged.lastPlayed = new Date().toISOString();
    this.saveData(this.KEYS.STATISTICS, merged);
    console.log('📊 LocalStorage: Game statistics updated');
  }

  recordGameResult(won: boolean, playTime: number, scenario: string): void {
    const stats = this.getGameStatistics();
    
    stats.gamesPlayed++;
    if (won) {
      stats.gamesWon++;
      if (stats.bestWinTime === 0 || playTime < stats.bestWinTime) {
        stats.bestWinTime = playTime;
      }
      stats.averageWinTime = ((stats.averageWinTime * (stats.gamesWon - 1)) + playTime) / stats.gamesWon;
    } else {
      stats.gamesLost++;
    }
    
    stats.totalPlayTime += playTime;
    
    // Actualizar estadísticas por escenario
    if (!stats.scenarios[scenario]) {
      stats.scenarios[scenario] = { played: 0, won: 0, bestTime: 0 };
    }
    
    const scenarioStats = stats.scenarios[scenario];
    scenarioStats.played++;
    if (won) {
      scenarioStats.won++;
      if (scenarioStats.bestTime === 0 || playTime < scenarioStats.bestTime) {
        scenarioStats.bestTime = playTime;
      }
    }
    
    this.saveData(this.KEYS.STATISTICS, stats);
    console.log('🏆 LocalStorage: Game result recorded');
  }

  // 🔧 PREFERENCIAS DEL USUARIO
  getUserPreferences(): UserPreferences {
    const defaults: UserPreferences = {
      lastScenario: 'default',
      preferredDifficulty: 'normal',
      tutorialCompleted: false,
      seenIntros: [],
      customKeybinds: {},
      language: 'en',
    };

    return this.loadWithDefaults(this.KEYS.PREFERENCES, defaults);
  }

  saveUserPreferences(preferences: Partial<UserPreferences>): void {
    const current = this.getUserPreferences();
    const merged = this.deepMerge(current, preferences);
    this.saveData(this.KEYS.PREFERENCES, merged);
    console.log('⚙️ LocalStorage: User preferences saved');
  }

  // 🔧 UTILIDADES INTERNAS
  private loadWithDefaults<T>(key: string, defaults: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaults;
      
      const parsed = JSON.parse(stored);
      return this.deepMerge(defaults, parsed);
    } catch (error) {
      console.warn(`⚠️ LocalStorage: Error loading ${key}, using defaults:`, error);
      return defaults;
    }
  }

  private saveData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`❌ LocalStorage: Error saving ${key}:`, error);
      // Intentar limpiar storage si está lleno
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldData();
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (retryError) {
          console.error('❌ LocalStorage: Failed to save even after cleanup');
        }
      }
    }
  }

  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];
        
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
            targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else if (sourceValue !== undefined) {
          result[key] = sourceValue as any;
        }
      }
    }
    
    return result;
  }

  private migrateStorageIfNeeded(): void {
    const currentVersion = localStorage.getItem(this.KEYS.VERSION);
    
    if (!currentVersion || currentVersion !== this.STORAGE_VERSION) {
      console.log('🔄 LocalStorage: Migrating to version', this.STORAGE_VERSION);
      this.performMigration(currentVersion);
      localStorage.setItem(this.KEYS.VERSION, this.STORAGE_VERSION);
    }
  }

  private performMigration(fromVersion: string | null): void {
    // Aquí se pueden implementar migraciones específicas
    if (!fromVersion) {
      console.log('🆕 LocalStorage: First time setup');
      return;
    }
    
    // Ejemplo de migración futura:
    // if (fromVersion === '0.9') {
    //   // Migrar de v0.9 a v1.0
    // }
  }

  private cleanupOldData(): void {
    console.log('🧹 LocalStorage: Cleaning up old data');
    
    // Remover datos de versiones antiguas o corruptos
    const keysToCheck = Object.values(this.KEYS);
    
    keysToCheck.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          JSON.parse(data); // Verificar que es JSON válido
        }
      } catch (error) {
        console.log(`🧹 LocalStorage: Removing corrupted data for ${key}`);
        localStorage.removeItem(key);
      }
    });
  }

  // 🔧 MÉTODOS PÚBLICOS DE UTILIDAD
  exportData(): string {
    const data = {
      version: this.STORAGE_VERSION,
      settings: this.getGameSettings(),
      statistics: this.getGameStatistics(),
      preferences: this.getUserPreferences(),
      exported: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.settings) {
        this.saveGameSettings(data.settings);
      }
      if (data.statistics) {
        this.saveData(this.KEYS.STATISTICS, data.statistics);
      }
      if (data.preferences) {
        this.saveUserPreferences(data.preferences);
      }
      
      console.log('✅ LocalStorage: Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ LocalStorage: Error importing data:', error);
      return false;
    }
  }

  clearAllData(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🧹 LocalStorage: All data cleared');
  }

  getStorageSize(): number {
    let total = 0;
    Object.values(this.KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        total += data.length;
      }
    });
    return total;
  }
}

export const localStorageManager = LocalStorageManager.getInstance();
