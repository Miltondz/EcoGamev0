// src/config/scenarios/submarine-lab.ts

import type { ScenarioConfig } from '../assets';

/**
 * ESCENARIO: "Laboratorio Submarino" - Historia completa y autocontenida
 * Temática: Terror científico / Lovecraft cyberpunk / Body horror
 */
export const submarineLabScenario: ScenarioConfig = {
  // Metadatos del escenario
  metadata: {
    id: 'submarine-lab',
    name: 'Laboratorio Submarino',
    version: '1.0.0',
    description: 'Un laboratorio de investigación en aguas profundas donde los experimentos con IA y vida abismal han salido terriblemente mal.',
    preview: '/images/scenarios/submarine-lab/preview.svg',
    difficulty: 'hard',
    duration: '45-60 minutos',
    author: 'ECO Team'
  },

  // Assets visuales del escenario
  assets: {
    base: '/images/scenarios/submarine-lab',
    
    // Cartas - reutiliza el deck base pero con temática submarina
    cards: {
      base: '/images/scenarios/default/cards',
      back: '/images/scenarios/default/cards/card-back.png',
      missing: '/images/scenarios/default/cards/missing-card.png',
      individual: [
        // Las mismas 52 cartas pero con contexto narrativo submarino
        '1-corazones.png', '2-corazones.png', '3-corazones.png', // Sistemas de soporte vital
        '1-diamantes.png', '2-diamantes.png', '3-diamantes.png', // Energía/reactor
        '1-espadas.png', '2-espadas.png', '3-espadas.png', // Herramientas/armas
        '1-treboles.png', '2-treboles.png', '3-treboles.png' // Conocimiento/datos
      ]
    },
    
    // Personajes únicos del escenario
    characters: {
      player: {
        base: '/images/scenarios/submarine-lab/characters/player-portrait.png',
        states: {
          healthy: '/images/scenarios/submarine-lab/characters/player-healthy.png',
          tired: '/images/scenarios/submarine-lab/characters/player-tired.png',
          wounded: '/images/scenarios/submarine-lab/characters/player-wounded.png',
          stressed: '/images/scenarios/submarine-lab/characters/player-stressed.png',
          critical: '/images/scenarios/submarine-lab/characters/player-critical.png',
          dying: '/images/scenarios/submarine-lab/characters/player-dying.png'
        }
      },
      antagonist: {
        base: '/images/scenarios/submarine-lab/eco/eco-vigilante.png',
        phases: {
          vigilante: '/images/scenarios/submarine-lab/eco/eco-vigilante.png', // IA observando
          predator: '/images/scenarios/submarine-lab/eco/eco-predator.png',   // IA cazando
          devastator: '/images/scenarios/submarine-lab/eco/eco-devastator.png' // IA fusionada
        }
      }
    },
    
    // Ambientes submarinos
    backgrounds: {
      main: '/images/scenarios/submarine-lab/backgrounds/main-bg.png',
      menu: {
        static: '/images/scenarios/submarine-lab/backgrounds/menu-bg.png',
        video: '/images/scenarios/submarine-lab/backgrounds/menu-bg.mp4'
      },
      locations: {
        controlRoom: '/images/scenarios/submarine-lab/backgrounds/control-room.png',
        laboratory: '/images/scenarios/submarine-lab/backgrounds/laboratory.png',
        corredors: '/images/scenarios/submarine-lab/backgrounds/corridors.png',
        reactor: '/images/scenarios/submarine-lab/backgrounds/reactor.png'
      }
    },
    
    // UI personalizada con temática submarina
    ui: {
      frameBorder: '/images/ui/frame-border.png', // Reutiliza UI base
      cardZoomBg: '/images/ui/card-zoom-bg.svg',
      cardActions: {
        cancel: '/images/ui/card-actions/cancel.png',
        discard: '/images/ui/card-actions/discard.png',
        play: '/images/ui/card-actions/play.png',
        research: '/images/ui/card-actions/research.png',
        sacrifice: '/images/ui/card-actions/sacrifice.png'
      },
      hud: {
        background: '/images/scenarios/submarine-lab/ui/hud-background.png',
        nodeIcons: '/images/scenarios/submarine-lab/ui/node-icons.svg',
        customElements: {
          pressureGauge: '/images/scenarios/submarine-lab/ui/pressure-gauge.svg',
          oxygenMeter: '/images/scenarios/submarine-lab/ui/oxygen-meter.svg',
          systemStatus: '/images/scenarios/submarine-lab/ui/system-status.svg'
        }
      }
    },
    
    // Elementos narrativos específicos del laboratorio
    narrative: {
      chapter1: {
        beginning: '/images/scenarios/submarine-lab/narrative/ch1-arrival.svg',
        middle: '/images/scenarios/submarine-lab/narrative/ch1-discovery.svg',
        end: '/images/scenarios/submarine-lab/narrative/ch1-first-encounter.svg'
      },
      chapter2: {
        beginning: '/images/scenarios/submarine-lab/narrative/ch2-investigation.svg',
        middle: '/images/scenarios/submarine-lab/narrative/ch2-revelation.svg',
        end: '/images/scenarios/submarine-lab/narrative/ch2-escalation.svg'
      },
      chapter3: {
        beginning: '/images/scenarios/submarine-lab/narrative/ch3-final-confrontation.svg',
        end: '/images/scenarios/submarine-lab/narrative/ch3-resolution.svg'
      }
    },
    
    // Efectos visuales submarinos
    effects: {
      particles: '/images/effects/particles.png', // Reutiliza base
      projectile: '/images/effects/projectile.png',
      glow: '/images/effects/glow-effect.svg',
      bioElectric: '/images/scenarios/submarine-lab/effects/bio-electric.svg',
      pressure: '/images/scenarios/submarine-lab/effects/pressure-wave.svg',
      malfunction: '/images/scenarios/submarine-lab/effects/system-malfunction.svg'
    },
    
    // Audio del escenario (preparado para futuro)
    audio: {
      music: {
        ambient: '/audio/scenarios/submarine-lab/ambient-deep.mp3',
        tension: '/audio/scenarios/submarine-lab/rising-tension.mp3',
        combat: '/audio/scenarios/submarine-lab/ai-awakens.mp3'
      },
      sfx: {
        systemBeep: '/audio/scenarios/submarine-lab/system-beep.wav',
        pressureAlarm: '/audio/scenarios/submarine-lab/pressure-alarm.wav',
        aiVoice: '/audio/scenarios/submarine-lab/ai-voice.wav',
        tentacleMovement: '/audio/scenarios/submarine-lab/tentacle-movement.wav'
      }
    }
  },
  
  // Configuración de juego específica
  gameConfig: {
    // IA Abismal como antagonista
    antagonist: {
      type: 'ai-hybrid',
      config: '/public/scenarios/submarine-lab/eco.json',
      initialPhase: 'vigilante',
      maxHp: 55,
      phases: ['vigilante', 'predator', 'devastator']
    },
    
    // Eventos del laboratorio submarino
    events: {
      base: '/images/scenarios/submarine-lab/events',
      config: '/public/scenarios/submarine-lab/events.json',
      // chronoConfig: '/public/scenarios/submarine-lab/chrono-events.json' // Opcional
    },
    
    // Sistemas del laboratorio
    nodes: {
      available: [
        'life-support',      // Sistemas de soporte vital
        'reactor-core',      // Núcleo del reactor
        'ai-mainframe',      // Computadora principal
        'specimen-tanks',    // Tanques de especímenes
        'pressure-locks',    // Esclusas de presión
        'emergency-systems'  // Sistemas de emergencia
      ],
      config: '/public/scenarios/submarine-lab/nodes.json'
    },
    
    // Reglas específicas del submarino
    rules: {
      initialPlayerHp: 18, // Menos vida (ambiente hostil)
      initialPlayerSanity: 15, // Menos sanidad (terror psicológico)
      maxActionPoints: 2,
      specialRules: [
        'pressure_effects',    // Efectos de presión
        'oxygen_management',   // Gestión de oxígeno
        'system_malfunctions', // Fallas de sistemas
        'ai_learning'          // IA que aprende del jugador
      ]
    },
    
    // Narrativa del laboratorio
    narrative: {
      chapters: ['arrival', 'investigation', 'revelation', 'confrontation'],
      config: '/public/scenarios/submarine-lab/narrative.json'
    }
  },
  
  // Recursos adicionales
  resources: {
    documentation: '/public/scenarios/submarine-lab/README.md',
    translations: {
      en: '/public/scenarios/submarine-lab/locales/en.json',
      es: '/public/scenarios/submarine-lab/locales/es.json'
    }
  }
};
