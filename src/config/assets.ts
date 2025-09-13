// src/config/assets.ts

/**
 * Configuración centralizada de rutas de assets
 * Permite cambiar rutas fácilmente y mantener consistencia
 */

// Interface para compatibilidad con AssetManager
export interface AssetConfig {
  base: string;
  cards: {
    base: string;
    back: string;
    missing: string;
  };
  characters: {
    player: {
      base: string;
      states: Record<string, string>;
    };
    eco: Record<string, string>;
  };
  backgrounds: {
    main: string;
    menu: {
      static: string;
      video: string;
      alternatives: string[];
    };
  };
  ui: {
    frameBorder: string;
    cardZoomBg: string;
    cardActions: Record<string, string>;
    hud: {
      background: string;
      nodeIcons: string;
    };
  };
  narrative: Record<string, Record<string, string>>;
  effects: Record<string, string>;
  scenarios: {
    base: string;
    default: {
      name: string;
      preview: string;
      config: string;
      cards: {
        base: string;
        back: string;
        missing: string;
      };
      events: {
        base: string;
        back: string;
        config: string;
      };
    };
    submarineLab: {
      name: string;
      preview: string;
      config: string;
      cards: {
        base: string;
        back: string;
        missing: string;
      };
      events: {
        base: string;
        back: string;
        config: string;
      };
    };
  };
}

/**
 * Configuración de un Escenario completo y autocontenido
 * Cada escenario es una historia independiente con sus propios assets, lógica y narrativa
 */
export interface ScenarioConfig {
  // Metadatos del escenario
  metadata: {
    id: string;
    name: string;
    version: string;
    description: string;
    preview: string; // Imagen de vista previa
    difficulty: 'easy' | 'medium' | 'hard';
    duration: string; // Duración estimada
    author: string;
  };
  
  // Assets visuales del escenario
  assets: {
    base: string; // Ruta base del escenario
    
    // Cartas específicas del escenario
    cards: {
      base: string;
      back: string;
      missing: string;
      individual: string[]; // Lista de todas las cartas disponibles
    };
    
    // Personajes únicos del escenario
    characters: {
      player: {
        base: string;
        states: Record<string, string>; // Estados dinámicos flexibles
      };
      antagonist: {
        base: string;
        phases: Record<string, string>; // Fases del antagonista (ECO, alien, etc.)
      };
      npcs?: Record<string, string>; // Personajes secundarios opcionales
    };
    
    // Ambientes y fondos del escenario
    backgrounds: {
      main: string;
      menu: {
        static: string;
        video?: string;
        alternatives?: string[];
      };
      locations?: Record<string, string>; // Múltiples ubicaciones
    };
    
    // UI personalizada del escenario
    ui: {
      frameBorder?: string;
      cardZoomBg?: string;
      cardActions?: Record<string, string>;
      hud: {
        background?: string;
        nodeIcons?: string;
        customElements?: Record<string, string>;
      };
    };
    
    // Elementos narrativos visuales
    narrative: Record<string, Record<string, string>>; // Flexible por capítulos
    
    // Efectos visuales del escenario
    effects: Record<string, string>; // Efectos flexibles
    
    // Audio del escenario (preparado para futuro)
    audio?: {
      music: Record<string, string>;
      sfx: Record<string, string>;
      voice?: Record<string, string>;
    };
  };
  
  // Configuración de juego del escenario
  gameConfig: {
    // Configuración del antagonista (ECO, alien, etc.)
    antagonist: {
      type: string; // 'eco', 'alien', 'virus', etc.
      config: string; // Ruta al archivo JSON de configuración
      initialPhase: string;
      maxHp: number;
      phases: string[]; // Fases disponibles
    };
    
    // Eventos del escenario
    events: {
      base: string;
      config: string; // eventos.json
      chronoConfig?: string; // eventos-crono.json
    };
    
    // Configuración de nodos/sistemas
    nodes: {
      available: string[]; // Nodos disponibles en este escenario
      config: string; // Configuración específica
    };
    
    // Reglas de juego específicas
    rules: {
      initialPlayerHp: number;
      initialPlayerSanity: number;
      maxActionPoints: number;
      specialRules?: string[]; // Reglas únicas del escenario
    };
    
    // Narrativa y capítulos
    narrative: {
      chapters: string[]; // Lista de capítulos disponibles
      config: string; // Configuración narrativa
    };
  };
  
  // Recursos adicionales del escenario
  resources?: {
    documentation?: string; // Documentación del escenario
    translations?: Record<string, string>; // Traducciones
    mods?: string[]; // Modificaciones opcionales
  };
}

/**
 * PRIMER ESCENARIO: "ECO Vigilante" - Historia completa y autocontenida
 * Esta es la primera entrega con todos los assets y lógica necesaria
 */
export const autoAssets: AssetConfig = {
  base: '/images',
  
  // Cartas - Ruta consolidada detectada automáticamente
  cards: {
    base: '/images/scenarios/default/cards',
    back: '/images/scenarios/default/cards/card-back.png', // ✅ 312KB PNG disponible
    missing: '/images/scenarios/default/cards/missing-card.png' // ✅ 369KB fallback
  },
  
  // Personajes con estados dinámicos detectados
  characters: {
    player: {
      base: '/images/scenarios/default/characters/player-portrait.png',
      states: {
        healthy: '/images/scenarios/default/characters/player-healthy.png', // ✅ 1.3MB
        tired: '/images/scenarios/default/characters/player-tired.png', // ✅ 1.3MB
        wounded: '/images/scenarios/default/characters/player-wounded.png', // ✅ 1.3MB
        stressed: '/images/scenarios/default/characters/player-stressed.png', // ✅ 1.3MB
        critical: '/images/scenarios/default/characters/player-critical.png', // ✅ 1.3MB
        dying: '/images/scenarios/default/characters/player-dying.png' // ✅ 1.3MB
      }
    },
    eco: {
      vigilante: '/images/scenarios/default/eco/eco-vigilante.png', // ✅ 331KB - USADO
      predator: '/images/scenarios/default/eco/eco-predator.png', // ✅ 283KB - DISPONIBLE
      aggressive: '/images/scenarios/default/eco/eco-aggressive.png', // ✅ 283KB - DISPONIBLE
      devastator: '/images/scenarios/default/eco/eco-devastator.png' // ✅ 293KB - DISPONIBLE
    }
  },
  
  // Fondos con videos animados detectados
  backgrounds: {
    main: '/images/scenarios/default/backgrounds/main-bg.png', // ✅ 1.27MB
    menu: {
      static: '/images/scenarios/default/backgrounds/menu-bg.png', // ✅ 762KB
      video: '/images/scenarios/default/backgrounds/menu-bg.mp4', // ✅ 4.28MB
      alternatives: [
        '/images/scenarios/default/backgrounds/menu-bg-1.mp4', // ✅ 1.06MB
        '/images/scenarios/default/backgrounds/menu-bg-2.mp4' // ✅ 2.91MB
      ]
    }
  },
  
  // UI completa con iconos de acciones detectados
  ui: {
    frameBorder: '/images/ui/frame-border.png', // ✅ 129KB - USADO
    cardZoomBg: '/images/ui/card-zoom-bg.svg', // ✅ 496B - DISPONIBLE
    cardActions: {
      cancel: '/images/ui/card-actions/cancel.png', // ✅ 127KB
      discard: '/images/ui/card-actions/discard.png', // ✅ 247KB
      play: '/images/ui/card-actions/play.png', // ✅ 322KB
      research: '/images/ui/card-actions/research.png', // ✅ 113KB
      sacrifice: '/images/ui/card-actions/sacrifice.png' // ✅ 294KB
    },
    hud: {
      background: '/images/scenarios/default/ui/hud-background.png', // ✅ 639KB
      nodeIcons: '/images/scenarios/default/ui/node-icons.svg' // ✅ 1.47KB
    }
  },
  
  // Elementos narrativos visuales por capítulo
  narrative: {
    chapter1: {
      beginning: '/images/scenarios/default/narrative/chapter1-beginning.svg', // ✅ 2.74KB
      end: '/images/scenarios/default/narrative/chapter1-end.svg' // ✅ 4.06KB
    },
    chapter2: {
      beginning: '/images/scenarios/default/narrative/chapter2-beginning.svg', // ✅ 4.50KB
      middle: '/images/scenarios/default/narrative/chapter2-middle.svg', // ✅ 5.07KB
      end: '/images/scenarios/default/narrative/chapter2-end.svg' // ✅ 6.64KB
    }
  },
  
  // Efectos visuales detectados
  effects: {
    particles: '/images/effects/particles.png', // ✅ 66KB - USADO
    projectile: '/images/effects/projectile.png', // ✅ 140KB - DISPONIBLE
    glow: '/images/effects/glow-effect.svg' // ✅ 755B - DISPONIBLE
  },
  
  // Configuración específica del escenario por defecto
  scenarios: {
    base: '/images/scenarios',
    default: {
      name: 'Escenario Por Defecto',
      preview: '/images/scenarios/default/preview.png', // ✅ 916KB
      config: '/public/scenarios/default/eco.json', // ✅ 3KB config ECO
      cards: {
        base: '/images/scenarios/default/cards',
        back: '/images/scenarios/default/cards/card-back.png',
        missing: '/images/scenarios/default/cards/missing-card.png'
      },
      events: {
        base: '/images/scenarios/default/events',
        back: '/images/scenarios/default/events/card-back.png', // ✅ 322KB
        config: '/images/scenarios/default/events.json' // ✅ 11KB eventos
      }
    },
    submarineLab: {
      name: 'Laboratorio Submarino',
      preview: '/images/scenarios/submarine-lab/preview.svg',
      config: '/public/scenarios/submarine-lab/eco.json',
      cards: {
        base: '/images/scenarios/default/cards', // Reutiliza cartas base
        back: '/images/scenarios/default/cards/card-back.png',
        missing: '/images/scenarios/default/cards/missing-card.png'
      },
      events: {
        base: '/images/scenarios/default/events', // Reutiliza eventos base
        back: '/images/scenarios/default/events/card-back.png',
        config: '/images/scenarios/default/events.json'
      }
    }
  }
};

/**
 * Asset Manager para gestión dinámica de rutas
 */
class AssetManager {
  private config: AssetConfig;
  
constructor(config?: AssetConfig) {
    this.config = config || autoAssets;
  }
  
  /**
   * Actualiza la configuración de assets
   */
  setConfig(config: AssetConfig) {
    this.config = config;
  }
  
  /**
   * Obtiene la ruta de una carta por ID
   */
  getCardPath(cardId: string): string {
    // Convertir ID de carta (ej: "AS", "2H") a nombre de archivo
    const rank = cardId.slice(0, -1);
    const suit = cardId.slice(-1);
    
    const suitMap: Record<string, string> = {
      'S': 'espadas',
      'H': 'corazones', 
      'C': 'treboles',
      'D': 'diamantes'
    };
    
    const rankMap: Record<string, string> = {
      'A': '1',
      'J': '11',
      'Q': '12', 
      'K': '13'
    };
    
    const fileName = `${rankMap[rank] || rank}-${suitMap[suit] || 'unknown'}.png`;
    return `${this.config.scenarios.default.cards.base}/${fileName}`;
  }
  
  /**
   * Obtiene la ruta del reverso de carta
   */
  getCardBackPath(): string {
    return this.config.scenarios.default.cards.back;
  }
  
  /**
   * Obtiene la ruta de carta faltante/error
   */
  getMissingCardPath(): string {
    return this.config.scenarios.default.cards.missing;
  }
  
  /**
   * Obtiene la ruta del fondo del escenario
   */
  getBackgroundPath(): string {
    return this.config.backgrounds.main;
  }
  
  /**
   * Obtiene la ruta del borde del frame
   */
  getFrameBorderPath(): string {
    return this.config.ui.frameBorder;
  }
  
  /**
   * Obtiene la ruta de un personaje con estado específico
   */
  getPlayerPath(state?: 'healthy' | 'tired' | 'wounded' | 'stressed' | 'critical' | 'dying'): string {
    if (state && this.config.characters.player.states[state]) {
      return this.config.characters.player.states[state];
    }
    return this.config.characters.player.base;
  }
  
  /**
   * Obtiene la ruta del ECO según su fase actual
   */
  getEcoPath(phase: 'vigilante' | 'predator' | 'aggressive' | 'devastator' = 'vigilante'): string {
    return this.config.characters.eco[phase];
  }
  
  /**
   * Obtiene la ruta de fondo de menú (estático o video)
   */
  getMenuBackgroundPath(type: 'static' | 'video' = 'static', alternative?: number): string {
    if (type === 'video') {
      if (alternative && this.config.backgrounds.menu.alternatives[alternative - 1]) {
        return this.config.backgrounds.menu.alternatives[alternative - 1];
      }
      return this.config.backgrounds.menu.video;
    }
    return this.config.backgrounds.menu.static;
  }
  
  /**
   * Obtiene la ruta de un icono de acción de carta
   */
  getCardActionIcon(action: 'cancel' | 'discard' | 'play' | 'research' | 'sacrifice'): string {
    return this.config.ui.cardActions[action];
  }
  
  /**
   * Obtiene la ruta de un elemento narrativo
   */
  getNarrativePath(chapter: 'chapter1' | 'chapter2', moment: string): string {
    const chapterConfig = this.config.narrative[chapter];
    return (chapterConfig as any)[moment] || '';
  }
  
  /**
   * Obtiene la ruta de un efecto visual
   */
  getEffectPath(effect: 'particles' | 'projectile' | 'glow'): string {
    return this.config.effects[effect];
  }
  
  /**
   * Obtiene la ruta del fondo de zoom de carta
   */
  getCardZoomBgPath(): string {
    return this.config.ui.cardZoomBg;
  }
  
  /**
   * Obtiene la configuración completa
   */
  getConfig(): AssetConfig {
    return this.config;
  }
}

// Instancia singleton del Asset Manager
export const assetManager = new AssetManager();

/**
 * Configuraciones predefinidas para diferentes escenarios
 * Permite cambiar fácilmente entre temas visuales
 */
export const scenarioAssets = {
  // Escenario por defecto - Configuración completa detectada
  default: autoAssets,
  
  // Escenario nocturno - Ejemplo de variación temática
  nightMode: {
    ...autoAssets,
    backgrounds: {
      ...autoAssets.backgrounds,
      main: '/images/scenarios/night/backgrounds/main-bg.png' // Hipotético
    },
    characters: {
      ...autoAssets.characters,
      eco: {
        ...autoAssets.characters.eco,
        vigilante: '/images/scenarios/night/eco/eco-vigilante-dark.png' // Hipotético
      }
    }
  },
  
  // Escenario minimalista - Solo assets esenciales
  minimal: {
    ...autoAssets,
    ui: {
      frameBorder: '', // Sin borde
      cardZoomBg: '',
      cardActions: {
        cancel: '',
        discard: '',
        play: '',
        research: '',
        sacrifice: ''
      },
      hud: {
        background: '', // Sin fondo HUD personalizado
        nodeIcons: ''
      }
    },
    effects: {
      particles: '',
      projectile: '',
      glow: ''
    }
  }
};

/**
 * FUNCIONALIDADES PREPARADAS PARA IMPLEMENTAR:
 * 
 * 1. ✅ Estados dinámicos de personajes
 *    - assetManager.getPlayerPath('critical') 
 *    - assetManager.getEcoPath('devastator')
 * 
 * 2. ✅ Iconos de acciones de cartas
 *    - assetManager.getCardActionIcon('play')
 *    - Listo para CardContextMenu mejorado
 * 
 * 3. ✅ Videos de fondo animados
 *    - assetManager.getMenuBackgroundPath('video', 1)
 *    - Listo para MainMenu con fondos dinámicos
 * 
 * 4. ✅ Elementos narrativos visuales
 *    - assetManager.getNarrativePath('chapter1', 'beginning')
 *    - Listo para NarrativeModal mejorado
 * 
 * 5. ✅ Efectos visuales adicionales
 *    - assetManager.getEffectPath('projectile')
 *    - Listo para sistema VFX ampliado
 * 
 * 6. ✅ Zoom de cartas personalizado
 *    - assetManager.getCardZoomBgPath()
 *    - Listo para mejoras en VFX card zoom
 */
