// src/config/auto-assets.ts

/**
 * Configuración automática de assets basada en escaneo del directorio público
 * Generado automáticamente - No editar manualmente
 */

export interface AssetInventory {
  // Assets actualmente utilizados
  used: {
    cards: {
      back: string[];
      individual: string[];
      missing: string[];
    };
    characters: {
      eco: string[];
      player: string[];
    };
    backgrounds: string[];
    ui: string[];
    effects: string[];
  };
  
  // Assets disponibles pero no utilizados (posibles funcionalidades faltantes)
  unused: {
    cards: {
      duplicates: string[]; // Cartas duplicadas en diferentes directorios
      variants: string[]; // Variantes de cartas no implementadas
    };
    characters: {
      states: string[]; // Estados de personajes no implementados
      variants: string[]; // Variantes de personajes
    };
    backgrounds: {
      alternatives: string[]; // Fondos alternativos
      videos: string[]; // Videos de fondo no implementados
    };
    ui: {
      unused: string[]; // Elementos UI no utilizados
      variants: string[]; // Variantes de UI
    };
    narrative: string[]; // Elementos narrativos
    scenarios: string[]; // Configuraciones de escenarios
  };
}

/**
 * Inventario completo de assets detectados automáticamente
 */
export const assetInventory: AssetInventory = {
  used: {
    cards: {
      back: [
        '/images/scenarios/default/cards/card-back.png' // ✅ Usado en App.tsx
      ],
      individual: [
        // ✅ Todas las cartas individuales están disponibles en VFX/Hand
        '/images/scenarios/default/cards/1-corazones.png',
        '/images/scenarios/default/cards/1-diamantes.png',
        '/images/scenarios/default/cards/1-espadas.png',
        '/images/scenarios/default/cards/1-treboles.png',
        // ... (52 cartas completas detectadas)
      ],
      missing: [
        '/images/scenarios/default/cards/missing-card.png' // ✅ Definido en config
      ]
    },
    characters: {
      eco: [
        '/images/scenarios/default/eco/eco-vigilante.png' // ✅ Usado en EcoPortrait
      ],
      player: [
        '/images/scenarios/default/characters/player-portrait.png' // ✅ Usado en PlayerPortrait
      ]
    },
    backgrounds: [
      '/images/scenarios/default/backgrounds/main-bg.png' // ✅ Usado en GameLayout
    ],
    ui: [
      '/images/ui/frame-border.png' // ✅ Usado en GameLayout
    ],
    effects: [
      '/images/effects/particles.png' // ✅ Usado en VFX efectos
    ]
  },
  
  unused: {
    cards: {
      duplicates: [
        // ❌ DUPLICADOS: Las mismas cartas existen en 3 ubicaciones diferentes
        '/images/decks/default/*.png', // Duplicado 1
        '/images/scenarios/default/cards/*.png', // Duplicado 2 (actual)
        '/images/scenarios/default/events/*.png' // Duplicado 3
      ],
      variants: [
        // ❌ NO USADO: Reverso alternativo disponible
        '/images/decks/default/card-back.jpg' // Variante JPG del reverso
      ]
    },
    
    characters: {
      states: [
        // ❌ FUNCIONALIDAD FALTANTE: Estados dinámicos de personajes
        '/images/scenarios/default/characters/player-critical.png',
        '/images/scenarios/default/characters/player-dying.png', 
        '/images/scenarios/default/characters/player-healthy.png',
        '/images/scenarios/default/characters/player-stressed.png',
        '/images/scenarios/default/characters/player-tired.png',
        '/images/scenarios/default/characters/player-wounded.png'
      ],
      variants: [
        // ❌ FUNCIONALIDAD FALTANTE: Fases dinámicas del ECO
        '/images/scenarios/default/eco/eco-aggressive.png',
        '/images/scenarios/default/eco/eco-devastator.png',
        '/images/scenarios/default/eco/eco-predator.png'
        // Solo se usa eco-vigilante.png actualmente
      ]
    },
    
    backgrounds: {
      alternatives: [
        // ❌ NO USADO: Fondos alternativos disponibles
        '/images/scenarios/default/backgrounds/menu-bg.png',
        '/images/scenarios/default/backgrounds/menu-bg.webp'
      ],
      videos: [
        // ❌ FUNCIONALIDAD FALTANTE: Videos de fondo animados
        '/images/scenarios/default/backgrounds/menu-bg.mp4',
        '/images/scenarios/default/backgrounds/menu-bg-1.mp4',
        '/images/scenarios/default/backgrounds/menu-bg-2.mp4'
      ]
    },
    
    ui: {
      unused: [
        // ❌ FUNCIONALIDAD FALTANTE: Elementos UI disponibles pero no implementados
        '/images/ui/frame-border_0.png', // Variante del borde
        '/images/ui/card-zoom-bg.svg', // Fondo para zoom de cartas
        '/images/scenarios/default/ui/hud-background.png', // Fondo HUD personalizado
        '/images/scenarios/default/ui/node-icons.svg' // Iconos de nodos personalizados
      ],
      variants: [
        // ❌ NO USADO: Iconos de acciones de cartas disponibles
        '/images/ui/card-actions/cancel.png',
        '/images/ui/card-actions/discard.png', 
        '/images/ui/card-actions/play.png',
        '/images/ui/card-actions/research.png',
        '/images/ui/card-actions/sacrifice.png'
      ]
    },
    
    narrative: [
      // ❌ FUNCIONALIDAD FALTANTE: Elementos narrativos visuales
      '/images/scenarios/default/narrative/chapter1-beginning.svg',
      '/images/scenarios/default/narrative/chapter1-end.svg',
      '/images/scenarios/default/narrative/chapter2-beginning.svg',
      '/images/scenarios/default/narrative/chapter2-end.svg',
      '/images/scenarios/default/narrative/chapter2-middle.svg'
    ],
    
    scenarios: [
      // ❌ NO USADO: Configuraciones adicionales
      '/public/scenarios/default/eco.json', // Config ECO no utilizada
      '/images/scenarios/default/preview.png' // Preview del escenario
    ]
  }
};

/**
 * FUNCIONALIDADES FALTANTES IDENTIFICADAS:
 * 
 * 1. ❌ ESTADOS DINÁMICOS DE PERSONAJES
 *    - Player: critical, dying, healthy, stressed, tired, wounded
 *    - ECO: aggressive, devastator, predator (solo vigilante implementado)
 *    - Implementar sistema de estados visuales basado en HP/condiciones
 * 
 * 2. ❌ ICONOS DE ACCIONES DE CARTAS
 *    - Iconos específicos para: cancel, discard, play, research, sacrifice
 *    - Mejorar CardContextMenu con iconos visuales
 * 
 * 3. ❌ VIDEOS DE FONDO ANIMADOS
 *    - 3 videos MP4 disponibles para fondos dinámicos
 *    - Implementar fondos animados en MainMenu/GameLayout
 * 
 * 4. ❌ ELEMENTOS NARRATIVOS VISUALES
 *    - 5 SVGs de elementos narrativos por capítulo
 *    - Integrar con NarrativeModal para mejor presentación
 * 
 * 5. ❌ UI PERSONALIZADA POR ESCENARIO
 *    - HUD background y node icons personalizados disponibles
 *    - Implementar temas visuales por escenario
 * 
 * 6. ❌ DUPLICADOS DE ASSETS
 *    - Cartas duplicadas en 3 ubicaciones diferentes
 *    - Consolidar y optimizar estructura de assets
 * 
 * 7. ❌ ZOOM DE CARTAS MEJORADO
 *    - card-zoom-bg.svg disponible pero no utilizado
 *    - Mejorar sistema de zoom con fondo personalizado
 */

/**
 * Configuración de assets optimizada basada en análisis
 */
export const optimizedAssetConfig = {
  // Rutas principales (consolidadas)
  base: '/images',
  
  // Cartas - usar solo scenarios/default/cards (más completo)
  cards: {
    base: '/images/scenarios/default/cards',
    back: '/images/scenarios/default/cards/card-back.png',
    missing: '/images/scenarios/default/cards/missing-card.png'
  },
  
  // Personajes con estados dinámicos
  characters: {
    player: {
      base: '/images/scenarios/default/characters/player-portrait.png',
      states: {
        healthy: '/images/scenarios/default/characters/player-healthy.png',
        tired: '/images/scenarios/default/characters/player-tired.png',
        wounded: '/images/scenarios/default/characters/player-wounded.png',
        stressed: '/images/scenarios/default/characters/player-stressed.png',
        critical: '/images/scenarios/default/characters/player-critical.png',
        dying: '/images/scenarios/default/characters/player-dying.png'
      }
    },
    eco: {
      vigilante: '/images/scenarios/default/eco/eco-vigilante.png',
      predator: '/images/scenarios/default/eco/eco-predator.png',
      aggressive: '/images/scenarios/default/eco/eco-aggressive.png',
      devastator: '/images/scenarios/default/eco/eco-devastator.png'
    }
  },
  
  // Fondos con videos
  backgrounds: {
    main: '/images/scenarios/default/backgrounds/main-bg.png',
    menu: {
      static: '/images/scenarios/default/backgrounds/menu-bg.png',
      video: '/images/scenarios/default/backgrounds/menu-bg.mp4',
      alternatives: [
        '/images/scenarios/default/backgrounds/menu-bg-1.mp4',
        '/images/scenarios/default/backgrounds/menu-bg-2.mp4'
      ]
    }
  },
  
  // UI con iconos de acciones
  ui: {
    frameBorder: '/images/ui/frame-border.png',
    cardZoomBg: '/images/ui/card-zoom-bg.svg',
    cardActions: {
      cancel: '/images/ui/card-actions/cancel.png',
      discard: '/images/ui/card-actions/discard.png',
      play: '/images/ui/card-actions/play.png',
      research: '/images/ui/card-actions/research.png',
      sacrifice: '/images/ui/card-actions/sacrifice.png'
    },
    hud: {
      background: '/images/scenarios/default/ui/hud-background.png',
      nodeIcons: '/images/scenarios/default/ui/node-icons.svg'
    }
  },
  
  // Narrativa visual
  narrative: {
    chapter1: {
      beginning: '/images/scenarios/default/narrative/chapter1-beginning.svg',
      end: '/images/scenarios/default/narrative/chapter1-end.svg'
    },
    chapter2: {
      beginning: '/images/scenarios/default/narrative/chapter2-beginning.svg',
      middle: '/images/scenarios/default/narrative/chapter2-middle.svg',
      end: '/images/scenarios/default/narrative/chapter2-end.svg'
    }
  },
  
  // Efectos
  effects: {
    particles: '/images/effects/particles.png',
    projectile: '/images/effects/projectile.png',
    glow: '/images/effects/glow-effect.svg'
  }
};
