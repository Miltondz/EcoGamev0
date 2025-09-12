/**
 * Sistema de Narrativa por Capítulos
 * 
 * Maneja la estructura narrativa de 3 actos por escenario:
 * - Principio: Introducción y setup
 * - Medio: Desarrollo y complicaciones  
 * - Final: Clímax y resolución
 * 
 * Características:
 * - Elementos visuales entre etapas (videos, GIFs, imágenes)
 * - Texto narrativo contextual
 * - Efectos visuales y transiciones
 * - Completamente parametrizable por escenario
 * - Integración con AssetManager
 */

import { assetManager } from './AssetManager';
// import { chapterManager } from './ChapterManager'; // Reserved for future use
import { pixiScreenEffects } from './PixiScreenEffects';
import type { ScreenEffectType } from './PixiScreenEffects';

export type ChapterAct = 'beginning' | 'middle' | 'end';
export type NarrativeMediaType = 'image' | 'gif' | 'video' | 'text_only';

export interface NarrativeElement {
  id: string;
  act: ChapterAct;
  title: string;
  content: string; // Texto narrativo
  mediaType: NarrativeMediaType;
  mediaPath?: string; // Path al archivo multimedia
  duration?: number; // Duración en ms (para videos/GIFs)
  screenEffect?: ScreenEffectType;
  effectIntensity?: 'low' | 'medium' | 'high';
  skipable: boolean;
  autoAdvance?: boolean; // Avanza automáticamente después de la duración
}

export interface ChapterNarrativeConfig {
  scenarioId: string;
  chapterId: string;
  title: string;
  description: string;
  acts: {
    beginning: NarrativeElement;
    middle?: NarrativeElement; // Opcional, solo si el capítulo lo requiere
    end: NarrativeElement;
  };
}

// Configuraciones de narrativa por capítulo
const NARRATIVE_CONFIGS: Record<string, ChapterNarrativeConfig> = {
  'chapter_1_easy': {
    scenarioId: 'default',
    chapterId: 'chapter_1_easy',
    title: 'Despertar - Los Primeros Susurros',
    description: 'Tu primera incursión en las profundidades de la estación abandonada',
    acts: {
      beginning: {
        id: 'ch1-begin',
        act: 'beginning',
        title: 'Llegada a la Estación',
        content: `Las luces de emergencia parpadean débilmente mientras te abres paso por los corredores abandonados. 
        
El aire está cargado de electricidad estática y un zumbido apenas perceptible resuena en las paredes metálicas. Los informes hablaban de una "anomalía", pero nada te preparó para la sensación de ser observado.
        
Tu misión es simple: restaurar los sistemas críticos y evacuar. Pero algo en la oscuridad susurra que no será tan fácil...`,
        mediaType: 'image',
        mediaPath: '/images/scenarios/default/narrative/chapter1-beginning.svg',
        duration: 8000,
        screenEffect: 'static',
        effectIntensity: 'low',
        skipable: true,
        autoAdvance: false
      },
      end: {
        id: 'ch1-end',
        act: 'end',
        title: 'Primeros Ecos',
        content: `Los sistemas comienzan a responder, pero cada reparación parece despertar algo más en las profundidades.
        
Las sombras se mueven donde no deberían moverse. Los sensores captan lecturas imposibles. Y ese susurro... ahora está más cerca.
        
Has completado las reparaciones básicas, pero sientes que esto es solo el comienzo. La estación guarda secretos más oscuros, y el ECO apenas ha comenzado a mostrar su verdadero poder.`,
        mediaType: 'image',
        mediaPath: '/images/scenarios/default/narrative/chapter1-end.svg',
        duration: 5000,
        screenEffect: 'glitch',
        effectIntensity: 'medium',
        skipable: true,
        autoAdvance: false
      }
    }
  },
  'chapter_2_descent': {
    scenarioId: 'default',
    chapterId: 'chapter_2_descent',
    title: 'En las Profundidades',
    description: 'Las anomalías se intensifican mientras desciendes a los niveles inferiores',
    acts: {
      beginning: {
        id: 'ch2-begin',
        act: 'beginning',
        title: 'Descenso',
        content: `Los niveles superiores ya no son seguros. Las lecturas de energía se han vuelto erráticas y los sistemas que reparaste muestran signos de sabotaje... interno.
        
Debes descender más profundo, donde la oscuridad es absoluta y el aire mismo parece tener vida propia. Los sensores detectan movimiento en sectores que se supone están vacíos.
        
Con cada paso hacia abajo, el susurro se vuelve más claro. Ya no es solo ruido... son palabras.`,
        mediaType: 'image',
        mediaPath: '/images/scenarios/default/narrative/chapter2-beginning.svg',
        duration: 10000,
        screenEffect: 'darkness',
        effectIntensity: 'medium',
        skipable: true,
        autoAdvance: false
      },
      middle: {
        id: 'ch2-middle',
        act: 'middle',
        title: 'Revelación',
        content: `En el núcleo de la estación descubres la verdad: el ECO no es solo un mal funcionamiento de los sistemas.
        
Es algo consciente. Algo que ha estado esperando. Los circuitos no están dañados... están evolucionando.
        
Las paredes pulsan con una vida artificial que desafía toda lógica. Y ahora, finalmente, el ECO te habla directamente.`,
        mediaType: 'image',
        mediaPath: '/images/scenarios/default/narrative/chapter2-middle.svg',
        duration: 6000,
        screenEffect: 'corruption',
        effectIntensity: 'high',
        skipable: true,
        autoAdvance: false
      },
      end: {
        id: 'ch2-end',
        act: 'end',
        title: 'El Corazón de la Bestia',
        content: `Has llegado al núcleo central. Aquí, donde todo comenzó, el ECO se manifiesta en toda su terrible gloria.
        
Los sistemas que creías controlar han sido sus ojos y oídos todo este tiempo. Cada reparación, cada decisión... él lo sabía todo.
        
Ahora queda solo una pregunta: ¿viniste aquí a destruirlo, o él te trajo aquí para algo más?`,
        mediaType: 'image',
        mediaPath: '/images/scenarios/default/narrative/chapter2-end.svg',
        duration: 7000,
        screenEffect: 'energy',
        effectIntensity: 'high',
        skipable: true,
        autoAdvance: false
      }
    }
  }
};

class ChapterNarrativeSystem {
  private currentNarrative: ChapterNarrativeConfig | null = null;
  private listeners: ((element: NarrativeElement, config: ChapterNarrativeConfig) => void)[] = [];

  /**
   * Carga la narrativa para un capítulo específico
   */
  async loadNarrativeForChapter(chapterId: string): Promise<ChapterNarrativeConfig | null> {
    const config = NARRATIVE_CONFIGS[chapterId];
    if (!config) {
      console.warn(`📖 ChapterNarrativeSystem: No narrative config found for chapter: ${chapterId}`);
      return null;
    }

    console.log(`📖 ChapterNarrativeSystem: Loading narrative for chapter: ${chapterId}`);
    
    // Pre-cargar assets multimedia
    await this.preloadNarrativeAssets(config);
    
    this.currentNarrative = config;
    return config;
  }

  /**
   * Pre-carga los assets multimedia de una narrativa
   */
  private async preloadNarrativeAssets(config: ChapterNarrativeConfig): Promise<void> {
    const elements = [config.acts.beginning, config.acts.middle, config.acts.end].filter(Boolean) as NarrativeElement[];
    
    const loadPromises = elements.map(async (element) => {
      if (element.mediaPath && element.mediaType !== 'text_only') {
        try {
          const fallbackPath = this.getFallbackPath(element.mediaPath, element.mediaType);
          await assetManager.loadImage(element.mediaPath, fallbackPath);
          console.log(`✅ ChapterNarrativeSystem: Preloaded ${element.id} media`);
        } catch (error) {
          console.warn(`⚠️ ChapterNarrativeSystem: Failed to preload ${element.id}:`, error);
        }
      }
    });

    await Promise.allSettled(loadPromises);
  }

  /**
   * Obtiene un path de fallback basado en el tipo de media
   */
  private getFallbackPath(originalPath: string, mediaType: NarrativeMediaType): string {
    const basePath = originalPath.substring(0, originalPath.lastIndexOf('.'));
    
    switch (mediaType) {
      case 'video':
        return basePath + '.gif'; // Fallback de video a GIF
      case 'gif':
        return basePath + '.png'; // Fallback de GIF a imagen
      case 'image':
        return basePath + '.svg'; // Fallback de PNG a SVG
      default:
        return originalPath;
    }
  }

  /**
   * Reproduce un elemento narrativo específico
   */
  async playNarrativeElement(act: ChapterAct): Promise<void> {
    if (!this.currentNarrative) {
      console.warn(`📖 ChapterNarrativeSystem: No narrative loaded`);
      return;
    }

    const element = this.currentNarrative.acts[act];
    if (!element) {
      console.warn(`📖 ChapterNarrativeSystem: No ${act} element found in current narrative`);
      return;
    }

    console.log(`📖 ChapterNarrativeSystem: Playing narrative element: ${element.id}`);

    // Aplicar efecto de pantalla si existe
    if (element.screenEffect && element.screenEffect !== 'none') {
      try {
        await pixiScreenEffects.playEffect({
          type: element.screenEffect,
          intensity: element.effectIntensity || 'medium',
          duration: 2000 // Efecto inicial más corto
        });
      } catch (error) {
        console.warn(`⚠️ ChapterNarrativeSystem: Screen effect failed:`, error);
      }
    }

    // Notificar a listeners para mostrar UI
    this.notifyListeners(element, this.currentNarrative);
  }

  /**
   * Obtiene la configuración narrativa actual
   */
  getCurrentNarrative(): ChapterNarrativeConfig | null {
    return this.currentNarrative;
  }

  /**
   * Obtiene un elemento narrativo específico
   */
  getNarrativeElement(act: ChapterAct): NarrativeElement | null {
    if (!this.currentNarrative) return null;
    return this.currentNarrative.acts[act] || null;
  }

  /**
   * Verifica si un capítulo tiene narrativa configurada
   */
  hasNarrativeForChapter(chapterId: string): boolean {
    return !!NARRATIVE_CONFIGS[chapterId];
  }

  /**
   * Obtiene todas las configuraciones disponibles (para debugging)
   */
  getAllNarrativeConfigs(): Record<string, ChapterNarrativeConfig> {
    return { ...NARRATIVE_CONFIGS };
  }

  /**
   * Subscribirse a eventos de narrativa
   */
  subscribe(listener: (element: NarrativeElement, config: ChapterNarrativeConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar a listeners
   */
  private notifyListeners(element: NarrativeElement, config: ChapterNarrativeConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(element, config);
      } catch (error) {
        console.error('🚨 ChapterNarrativeSystem: Error in listener:', error);
      }
    });
  }

  /**
   * Limpia la narrativa actual
   */
  clearCurrentNarrative(): void {
    this.currentNarrative = null;
  }

  /**
   * Registra una nueva configuración de narrativa (para mods/expansiones)
   */
  registerNarrativeConfig(chapterId: string, config: ChapterNarrativeConfig): void {
    NARRATIVE_CONFIGS[chapterId] = config;
    console.log(`📖 ChapterNarrativeSystem: Registered narrative for chapter: ${chapterId}`);
  }
}

// Singleton instance
export const chapterNarrativeSystem = new ChapterNarrativeSystem();
