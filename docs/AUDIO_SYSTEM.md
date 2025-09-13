# 🎵 Sistema de Audio ECO Game

Sistema completo de música y efectos de sonido para ECO Game con soporte para múltiples escenarios.

## 📁 Estructura de Archivos

```
public/audio/
├── scenarios/
│   ├── default/
│   │   ├── ambient.mp3    # Música ambiental (music-sad.mp3)
│   │   ├── tension.mp3    # Música de tensión (music-onimus.mp3) 
│   │   └── victory.mp3    # Música de victoria (music-hope.mp3)
│   └── submarine-lab/
│       ├── ambient.mp3    # Música ambiental (music-dark.mp3)
│       ├── tension.mp3    # Música de tensión (music-misc.mp3)
│       └── victory.mp3    # Reutiliza default/victory.mp3
└── effects/
    ├── attack-cut-1.mp3   # Efectos de ataque
    ├── attack-hit-1.mp3   # Impactos
    ├── event-danger.mp3   # Eventos peligrosos
    ├── menu-select.mp3    # Selección de menú
    ├── treasure-1.mp3     # Recompensas
    └── game-over.mp3      # Fin de juego
```

## 🔧 Componentes del Sistema

### 1. AudioManager (src/engine/AudioManager.ts)
**Gestor centralizado de audio con:**
- ✅ Precarga de audio por escenario
- ✅ Fade in/out automático
- ✅ Control de volumen (Master, Música, Efectos)
- ✅ Configuración persistente en localStorage
- ✅ Soporte para AudioContext
- ✅ Sistema de suscripción para cambios

### 2. AudioControls (src/components/AudioControls.tsx)
**Componente React para configuración:**
- ✅ Sliders de volumen con preview
- ✅ Toggle de música/efectos
- ✅ Información del escenario actual
- ✅ Feedback visual inmediato

## 🎵 Tracks de Música Disponibles

### Por Escenario
- **default (Caleta Abandonada)**: Melancólico, costero
  - `ambient`: music-sad.mp3 - Atmósfera pesquera abandonada
  - `tension`: music-onimus.mp3 - Tensión sobrenatural
  - `victory`: music-hope.mp3 - Esperanza renovada

- **submarine-lab (Laboratorio Submarino)**: Dark, cyberpunk
  - `ambient`: music-dark.mp3 - Profundidades tecnológicas
  - `tension`: music-misc.mp3 - Terror biocibernético
  - `victory`: Reutiliza default/victory.mp3

## 🔊 Efectos de Sonido

### Por Categoría
- **Menu**: menu-select.mp3
- **Combat**: attack-hit-1/2/3.mp3, attack-special.mp3, attack-cut-1/2.mp3
- **Events**: event-danger.mp3, event-scary.mp3, event-strange.mp3
- **Rewards**: treasure-1/2/3.mp3
- **System**: game-over.mp3

### Mapeo de Efectos
```typescript
export type EffectId = 
  | 'menu-select'    // Navegación de menús
  | 'card-play'      // Jugar carta (attack-cut-1.mp3)
  | 'card-hover'     // Hover carta (menu-select.mp3)
  | 'attack-hit'     // Ataque exitoso (attack-hit-1.mp3)
  | 'attack-special' // Ataque especial
  | 'treasure'       // Recompensa obtenida (treasure-1.mp3)
  | 'event-danger'   // Evento peligroso
  | 'event-scary'    // Evento de terror
  | 'game-over';     // Fin de partida
```

## 🚀 Uso del Sistema

### Inicialización
```typescript
// En App.tsx - Al iniciar juego
const currentScenario = chapterManager.currentScenarioConfig;
if (currentScenario) {
    await audioManager.setScenario(currentScenario.id);
    audioManager.playMusic('ambient', true);
}
```

### Reproducir Música
```typescript
// Música ambiental (loop automático)
audioManager.playMusic('ambient', true);

// Cambiar a tensión
audioManager.playMusic('tension', true);

// Victoria (no loop)
audioManager.playMusic('victory', false);
```

### Reproducir Efectos
```typescript
// Efecto básico
audioManager.playEffect('menu-select');

// Efecto con volumen personalizado
audioManager.playEffect('attack-hit', 0.8);
```

### Controles de Usuario
```typescript
// Toggle música/efectos
audioManager.toggleMusic();
audioManager.toggleEffects();

// Ajustar volúmenes (0.0 - 1.0)
audioManager.setMasterVolume(0.7);
audioManager.setMusicVolume(0.8);
audioManager.setEffectsVolume(0.9);
```

## 🎮 Integración en Componentes

### MainMenu.tsx
```typescript
import { audioManager } from '../engine/AudioManager';
import AudioControls from './AudioControls';

// En handleNewGame
audioManager.playEffect('menu-select', 0.7);

// En renderConfigView
<AudioControls />
```

### TurnManager.ts
```typescript
// Al jugar carta
audioManager.playEffect('card-play');

// Al recibir daño
audioManager.playEffect('attack-hit');

// En eventos peligrosos
audioManager.playEffect('event-danger');
```

### App.tsx
```typescript
// Al iniciar juego
await audioManager.setScenario(currentScenario.id);
setTimeout(() => {
    audioManager.playMusic('ambient', true);
}, 2000);
```

## ⚙️ Configuración Avanzada

### AudioConfig Interface
```typescript
interface AudioConfig {
  masterVolume: number;     // 0.0 - 1.0
  musicVolume: number;      // 0.0 - 1.0  
  effectsVolume: number;    // 0.0 - 1.0
  musicEnabled: boolean;    // Toggle música
  effectsEnabled: boolean;  // Toggle efectos
  currentScenario: string;  // Escenario actual
}
```

### Persistencia
- ✅ Configuración guardada en `localStorage` como `eco_audio_config`
- ✅ Carga automática al inicializar
- ✅ Fallback a valores por defecto

### Performance
- ✅ Precarga inteligente por escenario
- ✅ Reutilización de Audio elements
- ✅ Cleanup automático para evitar memory leaks
- ✅ AudioContext para mejor compatibilidad

## 🔄 Flujo de Estados

### Inicio del Juego
1. `audioManager.setScenario(id)` → Precarga audio del escenario
2. Mostrar narrativa inicial
3. `audioManager.playMusic('ambient')` → Comenzar atmósfera
4. Efectos dinámicos según interacciones del usuario

### Cambio de Escenario
1. `stopMusic(true)` → Fade out actual
2. `setScenario(newId)` → Precargar nuevo audio
3. `playMusic('ambient', true)` → Fade in nueva atmósfera

### Configuración
1. Usuario ajusta sliders → Cambio inmediato de volumen
2. Toggle música/efectos → Enable/disable instantáneo
3. Configuración persiste automáticamente en localStorage

## 🐛 Debug y Logs

Todos los logs utilizan el prefijo `🔊 AudioManager:` para facilitar debug:

```
🔊 AudioManager: Setting scenario to submarine-lab
🔊 AudioManager: Preloaded audio for scenario: submarine-lab
🔊 AudioManager: Playing music: ambient
🔊 AudioManager: Playing effect: menu-select
```

## 🎯 Próximas Mejoras

### Planeadas
- [ ] Sistema de ducking (reducir música durante efectos)
- [ ] Efectos de audio posicional/3D
- [ ] Compresión dinámica para mejor balance
- [ ] Más variaciones de efectos por contexto
- [ ] Sistema de playlists para música de fondo
- [ ] Análisis de espectro para efectos visuales reactivos

### Consideraciones
- [ ] Soporte para formatos adicionales (OGG, FLAC)
- [ ] Streaming de audio para archivos grandes
- [ ] Cache inteligente basado en uso frecuente
- [ ] API para mods de audio personalizados
