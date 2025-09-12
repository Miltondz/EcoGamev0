# Motor de Juego EcoGame - Documentación Completa

## Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Sistemas Principales](#sistemas-principales)
4. [Configuración por Escenarios](#configuración-por-escenarios)
5. [API de Integración](#api-de-integración)
6. [Guía de Creación de Escenarios](#guía-de-creación-de-escenarios)
7. [Extensibilidad](#extensibilidad)
8. [Referencia de Configuración](#referencia-de-configuración)

## Visión General

El Motor de Juego EcoGame es un sistema completamente parametrizable diseñado para crear experiencias narrativas interactivas de tipo survival horror con mecánicas de cartas. El motor está construido en React/TypeScript con PixiJS para efectos visuales y utiliza un sistema de configuración JSON para máxima reutilización.

### Características Principales

- **Completamente Configurable**: Todos los aspectos del juego se definen en archivos JSON
- **Sistema de Estados Dinámico**: ECO y héroe con estados visuales basados en estadísticas
- **Narrativa por Capítulos**: Sistema de 3 actos (principio, medio, final) con multimedia
- **Efectos Visuales Avanzados**: Integración PixiJS para efectos inmersivos
- **Gestión de Assets Inteligente**: Carga dinámica con fallbacks automáticos
- **Modular y Extensible**: Fácil adición de nuevos escenarios y mecánicas

## Arquitectura del Sistema

```
EcoGame Engine
├── Core Systems/
│   ├── GameStateManager - Estado global del juego
│   ├── TurnManager - Control de turnos y fases
│   ├── AssetManager - Gestión de recursos multimedia
│   └── ChapterManager - Control de progresión y capítulos
├── Character Systems/
│   ├── HeroStateSystem - Estados dinámicos del jugador
│   ├── EcoStateSystem - Estados configurables del ECO
│   └── CharacterPortraits - Visualización de personajes
├── Narrative Systems/
│   ├── ChapterNarrativeSystem - Narrativa multimedia por actos
│   ├── GameEndSystem - Manejo de finales y transiciones
│   └── EventVisualSystem - Presentación de eventos
├── Game Mechanics/
│   ├── CardEffectEngine - Mecánicas de cartas
│   ├── NodeSystem - Sistema de nodos críticos
│   ├── ScenarioRulesEngine - Reglas dinámicas por escenario
│   └── EcoAI - Inteligencia artificial del antagonista
└── UI Components/
    ├── Styled Components - Elementos visuales estandarizados
    ├── Modal System - Ventanas con opacidad 70% estándar
    └── VFX System - Efectos visuales PixiJS
```

## Sistemas Principales

### 1. GameStateManager

**Propósito**: Mantiene el estado global del juego de manera reactiva.

```typescript
// Estado principal
interface GameState {
  pv: number;           // Puntos de vida del jugador
  sanity: number;       // Cordura del jugador
  pa: number;           // Puntos de acción
  ecoHp: number;        // Vida del ECO
  turn: number;         // Turno actual
  phase: GamePhase;     // Fase actual del juego
  hand: Card[];         // Mano del jugador
  isGameOver: boolean;  // Estado de fin de juego
}
```

### 2. EcoStateSystem (Configurable)

**Propósito**: Gestiona los estados del ECO basado en configuración JSON.

```typescript
interface EcoConfiguration {
  id: string;
  name: string;
  phases: Record<string, EcoStateConfig>;
  globalSettings: {
    baseHp: number;
    adaptiveAI: boolean;
    phaseTransitionEffects: boolean;
  };
  transitionMessages: Record<string, string>;
}
```

**Configuración por Escenario**:
```json
{
  "phases": {
    "vigilante": {
      "threshold": 60,
      "imagePath": "/images/scenarios/default/eco/eco-vigilante.png",
      "behaviorModifiers": {
        "aggressiveness": 0.3,
        "eventFrequency": 0.8
      }
    }
  }
}
```

### 3. HeroStateSystem

**Propósito**: Estados visuales dinámicos del héroe basados en estadísticas.

Estados disponibles:
- `healthy`: PV ≥ 75%, Sanity ≥ 75%
- `tired`: PV/Sanity 50-74%
- `wounded`: PV < 50%, Sanity ≥ 50%
- `stressed`: PV ≥ 50%, Sanity < 50%
- `critical`: PV < 50%, Sanity < 50%
- `dying`: PV ≤ 25% || Sanity ≤ 25%

### 4. ChapterNarrativeSystem

**Propósito**: Maneja la narrativa multimedia en 3 actos por capítulo.

```typescript
interface ChapterNarrativeConfig {
  acts: {
    beginning: NarrativeElement;
    middle?: NarrativeElement;
    end: NarrativeElement;
  };
}

interface NarrativeElement {
  title: string;
  content: string;
  mediaType: 'image' | 'gif' | 'video' | 'text_only';
  mediaPath?: string;
  screenEffect?: ScreenEffectType;
  skipable: boolean;
}
```

### 5. AssetManager

**Propósito**: Gestión inteligente de assets con fallbacks automáticos.

**Funcionalidades**:
- Carga dinámica con rutas de fallback
- Cache de imágenes y texturas PIXI
- Generación de assets de emergencia
- Soporte para múltiples formatos (PNG, SVG, JPG)

```typescript
async getEventImagePath(eventId: string): Promise<string>
async getCardImagePath(cardId: string): Promise<string>
async getEcoImagePath(phase: string): Promise<string>
```

## Configuración por Escenarios

### Estructura de Archivos

```
public/scenarios/[scenarioId]/
├── eco.json              # Configuración del ECO
├── events.json           # Eventos específicos del escenario
├── cards.json            # Cartas personalizadas (opcional)
└── assets/
    ├── backgrounds/
    ├── characters/
    ├── eco/
    └── events/
```

### Archivo eco.json

```json
{
  "id": "eco_caleta_hualaihu",
  "name": "El Susurro del Mar",
  "description": "Una entidad que es el eco de una tragedia pasada...",
  "phases": {
    "vigilante": {
      "threshold": 60,
      "name": "Susurro Observador",
      "imagePath": "/images/scenarios/default/eco/eco-vigilante.png",
      "behaviorModifiers": {
        "aggressiveness": 0.3,
        "eventFrequency": 0.8,
        "attackPower": 1.0
      },
      "flavorText": "Los susurros del mar se vuelven más claros..."
    }
  },
  "transitionMessages": {
    "vigilante_to_predator": "El susurro se vuelve un rugido..."
  }
}
```

### Configuración de Narrativa

```json
{
  "chapter_1_easy": {
    "acts": {
      "beginning": {
        "title": "Llegada a la Estación",
        "content": "Las luces de emergencia parpadean...",
        "mediaType": "image",
        "mediaPath": "/images/scenarios/default/narrative/chapter1-beginning.svg",
        "screenEffect": "static",
        "skipable": true
      }
    }
  }
}
```

## API de Integración

### Eventos del Sistema

```typescript
// Suscribirse a cambios de estado
gameStateManager.subscribe(() => {
  // Reaccionar a cambios
});

// Suscribirse a cambios de estado del ECO
ecoStateSystem.subscribe((state, config) => {
  console.log(`ECO cambió a: ${config.name}`);
});

// Suscribirse a narrativa
chapterNarrativeSystem.subscribe((element, config) => {
  // Mostrar narrativa
});
```

### Control de Flujo

```typescript
// Iniciar nuevo juego
await chapterManager.selectChapter('chapter_1_easy');
turnManager.startGame();

// Avanzar al siguiente capítulo
const success = await chapterManager.goToNextChapter();

// Reproducir narrativa
await chapterManager.playChapterNarrative('beginning');
```

## Guía de Creación de Escenarios

### Paso 1: Crear Estructura de Archivos

```bash
public/scenarios/mi_escenario/
├── eco.json
├── narrative.json (opcional)
└── assets/
    ├── backgrounds/
    │   ├── main-bg.png
    │   └── main-bg.webp (opcional, video de fondo)
    ├── characters/
    │   ├── player-healthy.png
    │   ├── player-tired.png
    │   └── ... (otros estados)
    ├── eco/
    │   ├── eco-vigilante.png
    │   ├── eco-predator.png
    │   └── eco-devastator.png
    └── events/
        ├── 2S.png
        ├── 3S.png
        └── ... (cartas de eventos)
```

### Paso 2: Configurar el ECO

```json
{
  "id": "mi_eco",
  "name": "Mi Entidad",
  "phases": {
    "estado1": {
      "threshold": 100,
      "name": "Estado Inicial",
      "imagePath": "/images/scenarios/mi_escenario/eco/estado1.png",
      "behaviorModifiers": {
        "aggressiveness": 0.2,
        "eventFrequency": 0.7
      }
    }
  }
}
```

### Paso 3: Definir Narrativa (Opcional)

```json
{
  "mi_capitulo": {
    "acts": {
      "beginning": {
        "title": "Inicio",
        "content": "Tu narrativa aquí...",
        "mediaType": "image",
        "mediaPath": "/images/scenarios/mi_escenario/narrative/inicio.png"
      }
    }
  }
}
```

### Paso 4: Registrar en ChapterManager

```typescript
// En ChapterManager.ts - initializeScenarios()
this.scenarios['mi_escenario'] = {
  id: 'mi_escenario',
  name: 'Mi Escenario',
  description: 'Descripción del escenario',
  assetsPath: '/images/scenarios/mi_escenario'
  // ... configuración adicional
};
```

## Extensibilidad

### Agregar Nuevos Estados del ECO

1. Definir en `eco.json`:
```json
{
  "phases": {
    "nuevo_estado": {
      "threshold": 30,
      "name": "Nuevo Estado",
      "imagePath": "/path/to/image.png"
    }
  }
}
```

2. El sistema automáticamente:
   - Ordenará los estados por threshold
   - Cargará las imágenes correspondientes
   - Aplicará transiciones cuando sea necesario

### Crear Nuevos Efectos de Pantalla

```typescript
// En PixiScreenEffects.ts
export class PixiScreenEffects {
  async playCustomEffect(options: EffectOptions) {
    // Implementar nuevo efecto
  }
}
```

### Agregar Nuevas Mecánicas de Carta

```typescript
// En CardEffectEngine.ts
private applyCustomEffect(card: Card, target?: any) {
  // Implementar mecánica personalizada
}
```

## Referencia de Configuración

### Tipos de Datos Principales

```typescript
// Configuración del ECO
interface EcoConfiguration {
  id: string;
  name: string;
  description: string;
  scenarioId: string;
  lore?: string;
  phases: Record<string, EcoStateConfig>;
  globalSettings: EcoGlobalSettings;
  transitionMessages: Record<string, string>;
}

// Configuración de estado del ECO
interface EcoStateConfig {
  id: string;
  name: string;
  threshold: number;
  description: string;
  imagePath: string;
  effectIntensity: 'low' | 'medium' | 'high';
  effects: string[];
  behaviorModifiers: BehaviorModifiers;
  flavorText: string;
}

// Modificadores de comportamiento
interface BehaviorModifiers {
  aggressiveness: number;    // 0.0 - 1.0
  eventFrequency: number;    // Multiplicador de frecuencia
  attackPower: number;       // Multiplicador de daño
  corruptionRate: number;    // Tasa de corrupción
}
```

### Valores por Defecto

```typescript
const DEFAULT_BEHAVIOR: BehaviorModifiers = {
  aggressiveness: 0.5,
  eventFrequency: 1.0,
  attackPower: 1.0,
  corruptionRate: 0.5
};
```

### Eventos del Sistema

```typescript
// Eventos disponibles para suscripción
interface GameEvents {
  'stateChanged': (newState: GameState) => void;
  'ecoStateChanged': (state: EcoState, config: EcoStateConfig) => void;
  'heroStateChanged': (state: HeroState, config: HeroStateConfig) => void;
  'narrativeTriggered': (element: NarrativeElement) => void;
  'chapterCompleted': (chapterId: string, victory: boolean) => void;
}
```

## Mejores Prácticas

### 1. Organización de Assets
- Usar nombres descriptivos para archivos
- Mantener resoluciones consistentes
- Proporcionar fallbacks en múltiples formatos

### 2. Configuración de ECO
- Definir thresholds claros y no solapados
- Usar nombres descriptivos para estados
- Incluir flavor text inmersivo

### 3. Narrativa
- Mantener elementos opcionales (skipable: true)
- Usar duración apropiada para efectos
- Proporcionar tanto texto como elementos visuales

### 4. Performance
- Precargar assets críticos
- Usar compresión apropiada para imágenes
- Implementar lazy loading para assets opcionales

---

## Soporte y Mantenimiento

Esta documentación cubre la versión actual del Motor de Juego EcoGame. Para actualizaciones y nuevas funcionalidades, consultar el repositorio del proyecto.

**Autor**: Motor de Juego EcoGame Team  
**Versión**: 1.0  
**Fecha**: Diciembre 2024
