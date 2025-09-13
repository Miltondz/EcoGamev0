// src/engine/FloatingNumbersSystem.ts

/**
 * Sistema reutilizable para mostrar números flotantes con efectos visuales
 * 
 * Características:
 * - Colores configurables según tipo de efecto
 * - Fuentes temáticas para diferentes tipos de damage/healing
 * - Efectos de animación (rebote, desvanecimiento)
 * - Posicionamiento flexible
 * - Duración configurable
 */

import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { layerSystem, GameLayer } from './LayerManager';

// Tipos de efectos de números flotantes
export type FloatingNumberType = 
  | 'damage_hp'      // Daño a HP (rojo, fuente sangrienta)
  | 'heal_hp'        // Curación HP (verde, fuente suave)
  | 'damage_sanity'  // Daño a cordura (naranja, fuente temblorosa)
  | 'heal_sanity'    // Curación cordura (azul, fuente cristalina)
  | 'resource'       // Recursos generales (dorado)
  | 'experience'     // Experiencia (púrpura)
  | 'custom';        // Color y estilo personalizados

// Configuración de estilo para cada tipo
export interface FloatingNumberStyle {
  color: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  stroke?: {
    color: number;
    width: number;
  };
  shadow?: {
    color: number;
    blur: number;
    distance: number;
    alpha: number;
  };
}

// Configuración de animación
export interface FloatingNumberAnimation {
  duration: number;           // Duración total en segundos
  bounceHeight: number;       // Altura del rebote en pixels
  bounceIntensity: number;    // Intensidad del efecto rebote (1.0 = normal)
  fadeDelay: number;         // Retraso antes de empezar a desvanecer
  driftDirection: { x: number; y: number }; // Dirección de deriva
}

// Configuración completa para un número flotante
export interface FloatingNumberConfig {
  value: number;                    // El número a mostrar (puede ser negativo)
  position: { x: number; y: number }; // Posición donde aparece
  type: FloatingNumberType;         // Tipo de efecto
  customStyle?: FloatingNumberStyle; // Estilo personalizado (solo si type = 'custom')
  customAnimation?: Partial<FloatingNumberAnimation>; // Animación personalizada
  prefix?: string;                  // Prefijo (ej: "+", "-", "×")
  suffix?: string;                  // Sufijo (ej: " HP", " pts")
}

// Estilos predefinidos para cada tipo
const PRESET_STYLES: Record<Exclude<FloatingNumberType, 'custom'>, FloatingNumberStyle> = {
  damage_hp: {
    color: 0xdc2626,          // Rojo intenso
    fontSize: 32,
    fontFamily: 'serif',       // Fuente más dramática
    fontWeight: 'bold',
    stroke: {
      color: 0x7f1d1d,
      width: 3
    },
    shadow: {
      color: 0x000000,
      blur: 4,
      distance: 2,
      alpha: 0.8
    }
  },
  heal_hp: {
    color: 0x22c55e,          // Verde brillante
    fontSize: 28,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    stroke: {
      color: 0x166534,
      width: 2
    },
    shadow: {
      color: 0x000000,
      blur: 3,
      distance: 1,
      alpha: 0.6
    }
  },
  damage_sanity: {
    color: 0xf97316,          // Naranja intenso
    fontSize: 30,
    fontFamily: 'monospace',   // Fuente más angular/temblorosa
    fontWeight: 'bold',
    stroke: {
      color: 0xc2410c,
      width: 2
    },
    shadow: {
      color: 0x000000,
      blur: 5,
      distance: 3,
      alpha: 0.7
    }
  },
  heal_sanity: {
    color: 0x3b82f6,          // Azul cristalino
    fontSize: 28,
    fontFamily: 'fantasy',
    fontWeight: 'normal',
    stroke: {
      color: 0x1d4ed8,
      width: 2
    },
    shadow: {
      color: 0xbfdbfe,
      blur: 6,
      distance: 0,
      alpha: 0.5
    }
  },
  resource: {
    color: 0xf59e0b,          // Dorado
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: 'bold',
    stroke: {
      color: 0x92400e,
      width: 2
    },
    shadow: {
      color: 0x000000,
      blur: 3,
      distance: 1,
      alpha: 0.6
    }
  },
  experience: {
    color: 0xa855f7,          // Púrpura místico
    fontSize: 24,
    fontFamily: 'fantasy',
    fontWeight: 'bold',
    stroke: {
      color: 0x6b21a8,
      width: 2
    },
    shadow: {
      color: 0x000000,
      blur: 4,
      distance: 2,
      alpha: 0.7
    }
  }
};

// Animaciones predefinidas
const PRESET_ANIMATIONS: Record<Exclude<FloatingNumberType, 'custom'>, FloatingNumberAnimation> = {
  damage_hp: {
    duration: 2.0,
    bounceHeight: 40,
    bounceIntensity: 1.8,     // Rebote más dramático para daño
    fadeDelay: 0.8,
    driftDirection: { x: 0, y: -1 }
  },
  heal_hp: {
    duration: 1.8,
    bounceHeight: 25,
    bounceIntensity: 1.2,     // Rebote suave para curación
    fadeDelay: 0.6,
    driftDirection: { x: 0, y: -0.5 }
  },
  damage_sanity: {
    duration: 2.2,
    bounceHeight: 35,
    bounceIntensity: 2.0,     // Rebote errático para cordura
    fadeDelay: 1.0,
    driftDirection: { x: 0.3, y: -0.8 } // Deriva ligeramente lateral
  },
  heal_sanity: {
    duration: 1.6,
    bounceHeight: 20,
    bounceIntensity: 0.8,     // Rebote muy suave
    fadeDelay: 0.5,
    driftDirection: { x: 0, y: -0.3 }
  },
  resource: {
    duration: 1.5,
    bounceHeight: 15,
    bounceIntensity: 1.0,
    fadeDelay: 0.4,
    driftDirection: { x: 0, y: -0.2 }
  },
  experience: {
    duration: 2.5,
    bounceHeight: 30,
    bounceIntensity: 1.4,
    fadeDelay: 1.2,
    driftDirection: { x: 0, y: -0.6 }
  }
};

/**
 * Sistema principal para generar y animar números flotantes
 */
class FloatingNumbersSystem {
  private pixiApp: PIXI.Application | null = null;

  /**
   * Inicializa el sistema con la aplicación PIXI
   */
  initialize(app: PIXI.Application) {
    this.pixiApp = app;
    console.log('🔢 FloatingNumbersSystem: Initialized');
  }

  /**
   * Muestra un número flotante con la configuración especificada
   * 
   * @param config - Configuración del número flotante
   * @returns Promise que se resuelve cuando la animación termina
   */
  async showFloatingNumber(config: FloatingNumberConfig): Promise<void> {
    if (!this.pixiApp) {
      console.warn('⚠️ FloatingNumbersSystem: Not initialized');
      return;
    }

    const style = this.getStyle(config);
    const animation = this.getAnimation(config);
    const text = this.formatNumber(config);

    console.log(`🔢 FloatingNumbersSystem: Showing "${text}" at (${config.position.x}, ${config.position.y})`);

    // Crear el texto con PixiJS v8 syntax
    const floatingText = new PIXI.Text(text, {
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight as PIXI.TextStyleFontWeight,
      fill: style.color,
      stroke: style.stroke ? {
        color: style.stroke.color,
        width: style.stroke.width
      } : undefined,
      dropShadow: style.shadow ? {
        color: style.shadow.color,
        blur: style.shadow.blur,
        distance: style.shadow.distance,
        alpha: style.shadow.alpha,
        angle: Math.PI / 6
      } : undefined
    });

    // Posicionar y configurar el texto
    floatingText.anchor.set(0.5);
    floatingText.x = config.position.x;
    floatingText.y = config.position.y;
    floatingText.alpha = 0;
    floatingText.scale.set(0.1);
    floatingText.label = `floatingNumber_${Date.now()}`;

    // Agregar usando LayerManager para floating numbers
    const addedToFloatingLayer = layerSystem.addToPixi(GameLayer.FLOATING_UI, floatingText);
    if (!addedToFloatingLayer) {
      // Fallback: agregar directamente al stage
      this.pixiApp.stage.addChild(floatingText);
      console.log('⚠️ FloatingNumbersSystem: Added to stage directly (LayerManager fallback)');
    } else {
      console.log('✅ FloatingNumbersSystem: Added to FLOATING_UI layer via LayerManager');
    }

    // Crear timeline de animación
    const timeline = gsap.timeline();

    // 1. Aparición con rebote
    timeline.to(floatingText, {
      alpha: 1,
      scale: 1.2,
      duration: 0.3,
      ease: `back.out(${animation.bounceIntensity})`
    });

    // 2. Rebote principal
    timeline.to(floatingText, {
      y: config.position.y - animation.bounceHeight,
      duration: 0.4,
      ease: 'power2.out'
    }, 0.1);

    // 3. Regreso del rebote con overshoot
    timeline.to(floatingText, {
      y: config.position.y - animation.bounceHeight * 0.3,
      scale: 1.0,
      duration: 0.3,
      ease: 'bounce.out'
    });

    // 4. Deriva gradual
    timeline.to(floatingText, {
      x: config.position.x + animation.driftDirection.x * 30,
      y: floatingText.y + animation.driftDirection.y * 50,
      duration: animation.duration - animation.fadeDelay,
      ease: 'power1.out'
    }, animation.fadeDelay);

    // 5. Desvanecimiento
    timeline.to(floatingText, {
      alpha: 0,
      scale: 0.8,
      duration: animation.duration - animation.fadeDelay,
      ease: 'power2.in'
    }, animation.fadeDelay);

    // 6. Limpieza al final
    timeline.call(() => {
      if (this.pixiApp && floatingText.parent) {
        // Usar parent.removeChild en lugar de stage.removeChild para compatibilidad con LayerManager
        floatingText.parent.removeChild(floatingText);
        console.log('🔢 FloatingNumbersSystem: Cleaned up floating number');
      }
    });

    // Retornar promise que se resuelve cuando termina la animación
    return new Promise(resolve => {
      timeline.call(() => resolve());
    });
  }

  /**
   * Método conveniente para mostrar daño HP
   */
  showDamage(value: number, position: { x: number; y: number }) {
    return this.showFloatingNumber({
      value: Math.abs(value),
      position,
      type: 'damage_hp',
      prefix: '-'
    });
  }

  /**
   * Método conveniente para mostrar curación HP
   */
  showHealing(value: number, position: { x: number; y: number }) {
    return this.showFloatingNumber({
      value: Math.abs(value),
      position,
      type: 'heal_hp',
      prefix: '+'
    });
  }

  /**
   * Método conveniente para mostrar daño a cordura
   */
  showSanityDamage(value: number, position: { x: number; y: number }) {
    return this.showFloatingNumber({
      value: Math.abs(value),
      position,
      type: 'damage_sanity',
      prefix: '-',
      suffix: ' SAN'
    });
  }

  /**
   * Método conveniente para mostrar recuperación de cordura
   */
  showSanityHealing(value: number, position: { x: number; y: number }) {
    return this.showFloatingNumber({
      value: Math.abs(value),
      position,
      type: 'heal_sanity',
      prefix: '+',
      suffix: ' SAN'
    });
  }

  // Métodos privados

  private getStyle(config: FloatingNumberConfig): FloatingNumberStyle {
    if (config.type === 'custom' && config.customStyle) {
      return config.customStyle;
    }
    return PRESET_STYLES[config.type as Exclude<FloatingNumberType, 'custom'>];
  }

  private getAnimation(config: FloatingNumberConfig): FloatingNumberAnimation {
    const baseAnimation = PRESET_ANIMATIONS[config.type as Exclude<FloatingNumberType, 'custom'>];
    if (config.customAnimation) {
      return { ...baseAnimation, ...config.customAnimation };
    }
    return baseAnimation;
  }

  private formatNumber(config: FloatingNumberConfig): string {
    const prefix = config.prefix || '';
    const suffix = config.suffix || '';
    const value = Math.abs(config.value);
    
    return `${prefix}${value}${suffix}`;
  }
}

// Instancia singleton
export const floatingNumbersSystem = new FloatingNumbersSystem();
