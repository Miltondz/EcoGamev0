# Assets Requirements - Eco del Vacío

## 📂 Estructura de Carpetas Requerida
```
/public
├── /images
│   ├── /ui                    # Elementos de interfaz GLOBALES
│   │   ├── frame-border.png   # Marco de madera/metal del tablero
│   │   ├── card-zoom-bg.png   # ⭐ Fondo para cartas ampliadas
│   │   └── /card-actions      # ⭐ Botones de acción para cartas
│   │       ├── play.png       # Botón jugar carta
│   │       ├── sacrifice.png  # Botón sacrificar carta
│   │       ├── research.png   # Botón investigar/reparar
│   │       ├── discard.png    # Botón descartar carta
│   │       └── cancel.png     # Botón cancelar selección
│   ├── /effects               # Efectos visuales GLOBALES
│   │   ├── glow-effect.png    # Texturas para efectos de brillo
│   │   ├── projectile.png     # Proyectil para ataques
│   │   └── particles.png      # Texturas para partículas
│   └── /scenarios             # ⭐ ASSETS POR ESCENARIO
│       ├── /default           # Escenario por defecto
│       │   ├── /backgrounds
│       │   │   ├── main-bg.jpg        # Fondo principal (1280x800px)
│       │   │   └── menu-bg.jpg        # Fondo del menú
│       │   ├── /characters
│       │   │   └── player-portrait.png # Retrato jugador (180x350px)
│       │   ├── /eco
│       │   │   ├── eco-vigilante.png  # Eco vigilante (180x350px)
│       │   │   ├── eco-predator.png   # Eco predador
│       │   │   └── eco-devastator.png # Eco devastador
│       │   ├── /ui
│       │   │   ├── hud-background.png # HUD específico del escenario
│       │   │   └── node-icons.png     # Iconos de nodos (45x45px x4)
│       │   ├── /cards             # ⭐ CARTAS REGULARES (70x98px)
│       │   │   ├── card-back.png  # Reverso específico
│       │   │   ├── 2S.png         # 52 cartas del escenario
│       │   │   ├── 3S.png
│       │   │   └── ...            # (resto de cartas)
│       │   └── /events            # ⭐ CARTAS DE EVENTOS (280x392px)
│       │       ├── 2S.png         # Evento: Fallo del Sistema
│       │       ├── 3S.png         # Evento: Ruido Blanco
│       │       ├── ...            # 52 eventos ilustrados
│       │       └── AD.png         # Evento: La Reserva del Capitán
│       ├── /horror             # ⭐ Escenario de horror (futuro)
│       │   ├── /backgrounds
│       │   ├── /characters
│       │   ├── /eco
│       │   ├── /ui
│       │   ├── /cards
│       │   └── /events
│       └── /survival           # ⭐ Escenario de supervivencia (futuro)
│           ├── /backgrounds
│           ├── /characters
│           ├── /eco
│           ├── /ui
│           ├── /cards
│           └── /events
```

## 🎨 Especificaciones de Assets

### **RESOLUCIÓN FIJA: 1280x720**
> ⚠️ **IMPORTANTE**: Toda la aplicación usa resolución fija de 1280x720px.

### Layout Real de la Aplicación (1280x720)
```
┌─────────────────┬───────────────────────────────────────────────────────────────┬─────────────────┐
│  Panel Izquierdo  │          Mano del Eco               [Eco HP/  │   Panel Derecho  │ ← Altura ~120px
│      (UNIDO)      │      [♠] [♠] [♠] [♠] [♠]              Estado]   │     (UNIDO)      │
│                  │                                              │                 │
├──────────────────┴───────────────────────────────────────────────────────────────┴─────────────────┤
│   Imagen del      │                                              │  Imagen del Eco  │
│   Jugador        │              Panel Central                   │                 │ ← Altura ~350px
│   (Vertical)      │           (Campo de Batalla)                │   (Vertical)      │
│                  │                                              │                 │
├──────────────────┬─────────────────────────────────────────────────────────┬─────────────────┤
│      Nodos       │                                         │    GameLog      │ ← Altura ~150px
│                 │              Panel Central                │                 │
│                 │            (Info / Objetivos)              │                 │
├──────────────────┼─────────────────────────────────────────────────────────┴─────────────────┤
│ [Jugador HP /   │               Mano del Jugador                       │ ← Altura ~100px
│ CORD / AP]      │          [♠] [♠] [♠] [♠] [♠] [♠]                        │
└──────────────────┴─────────────────────────────────────────────────────────┘
│          [Acción] [Acción] [Acción] [Terminar turno]                │ ← Altura ~80px
└───────────────────────────────────────────────────────────────────────────┘
                        ← 200px │ ←→ 880px │ ← 200px
```

### Coordenadas Exactas del Layout
```typescript
const LAYOUT = {
  // Paneles laterales UNIDOS (incluyen imagen integrada)
  PLAYER_PANEL_UNIFIED: { x: 0, y: 0, width: 200, height: 720 },
  ECO_PANEL_UNIFIED: { x: 1080, y: 0, width: 200, height: 720 },
  
  // Área Central Superior
  ECO_CARDS_AREA: { x: 200, y: 0, width: 680, height: 120 },
  ECO_STATUS_HUD: { x: 880, y: 0, width: 200, height: 120 },
  
  // Panel Central (dividido en 3 secciones)
  BATTLE_FIELD: { x: 200, y: 120, width: 880, height: 350 },
  INFO_OBJECTIVES: { x: 200, y: 470, width: 680, height: 150 },
  PLAYER_HAND_AREA: { x: 200, y: 620, width: 880, height: 100 },
  
  // Elementos laterales específicos
  NODES_SECTION: { x: 0, y: 470, width: 200, height: 150 },
  GAME_LOG_PANEL: { x: 880, y: 470, width: 400, height: 150 },
  PLAYER_STATS_HUD: { x: 0, y: 620, width: 200, height: 100 },
  
  // Botones (fuera del layout principal)
  ACTION_BUTTONS: { x: 0, y: 720, width: 1280, height: 80 }
};
```

### Assets para Resolución FIJA: 1280x720

#### **Card Action Buttons** (`/ui/card-actions/[action].png`) ⭐ **NUEVO**
- **Tamaño**: 60x60px cada botón circular
- **Variantes**: 
  - `play.png` - Botón verde con icono "play"/"usar"
  - `sacrifice.png` - Botón rojo con icono de sacrificio
  - `research.png` - Botón azul con icono de investigación
  - `discard.png` - Botón gris con icono de descarte
  - `cancel.png` - Botón negro con X para cancelar
- **Uso**: Aparecen sobre cartas ampliadas (2x) cuando se hace click
- **Disposición**: En arco sobre la carta para fácil selección
- **Estilo**: Diseño circular con iconografía clara y distintiva
- **Estado hover**: Versión resaltada para indicar selección
- **Formato**: PNG con transparencia

#### **Card Zoom Overlay** (`/ui/card-zoom-bg.png`) ⭐ **NUEVO**
- **Tamaño**: 200x260px (espacio para carta ampliada + botones)
- **Estilo**: Marco/fondo decorativo que resalta la carta seleccionada
- **Opacidad**: Semi-transparente para no obstruir completamente el tablero
- **Uso**: Fondo detrás de cartas cuando se hace zoom al hacer click
- **Formato**: PNG con transparencia

#### **Frame Border** (`/ui/frame-border.png`)
- **Tamaño**: 1280x800px (incluye botones)
- **Estilo**: Marco de madera envejecida o metal industrial
- **Transparencia**: Centro completamente transparente, solo bordes
- **Formato**: PNG con transparencia

#### **Node Background** (`/ui/node-bg.png`)
- **Tamaño**: 120x120px cada uno
- **Variaciones**: 4 iconos diferentes
  - Reactor: Engranaje/átomo
  - Communications: Antena/radar
  - Life Support: Corazón médico/pulmones
  - Propulsion: Cohete/turbina
- **Estados**: Normal (verde), Damaged (naranja), Critical (rojo)
- **Formato**: PNG con transparencia

### Backgrounds

#### **Main Background** (`/scenarios/[scenario]/backgrounds/main-bg.jpg`)
- **Ruta por escenario**: Cada escenario tiene su fondo único
- **Tamaño**: 1280x800px (incluye área de botones)
- **Estilo**: Adaptado al tema del escenario (marítimo, horror, supervivencia, etc.)
- **Carga dinámica**: Se carga vía `scenarioLoader.getAssetPath('background')`
- **Paleta**: Variable según escenario
- **Formato**: JPG (optimizado para tamaño)

### Characters

#### **Player Portrait** (`/scenarios/[scenario]/characters/player-portrait.png`)
- **Ruta por escenario**: Cada escenario puede tener diferentes personajes
- **Tamaño**: 180x350px (se integra en panel izquierdo unificado)
- **Posición**: Dentro del Panel Izquierdo UNIDO (0, 0) - 200x720px
- **Área de imagen**: Aproximadamente (10, 120) - 180x350px
- **Estilo**: Adaptado al tema del escenario (marinero, soldado, científico, etc.)
- **Iluminación**: Dramática, desde un lado
- **Formato**: PNG con transparencia

### Eco Entity

#### **Eco Phases** (`/scenarios/[scenario]/eco/eco-*.png`)
- **Ruta por escenario**: Cada escenario tiene diferentes versiones del Eco
- **Tamaño**: 180x350px cada uno (se integra en panel derecho unificado)
- **Posición**: Dentro del Panel Derecho UNIDO (1080, 0) - 200x720px
- **Área de imagen**: Aproximadamente (1090, 120) - 180x350px
- **Vigilante**: Adaptado al tema del escenario
- **Predator**: Más agresivo, características del escenario
- **Devastator**: Forma final, específico del escenario
- **Formato**: PNG con transparencia

### Card Assets

#### **Card Back** (`/decks/default/card-back.png`)
- **Tamaño**: 70x98px (ratio 5:7, optimizado para layout)
- **Uso**: 
  - Mano del Eco: área (200, 0) - 680x120px
  - Mano del Jugador: área (200, 620) - 880x100px
- **Estilo**: Diseño geométrico azul, acorde al tema
- **Formato**: PNG

#### **Individual Cards** (`/scenarios/[scenario]/cards/[rank][suit].png`)
- **Ruta por escenario**: Cada escenario tiene su set completo de 52 cartas
- **Cantidad**: 52 archivos por escenario (2S.png, 3S.png, ... AS.png, etc.)
- **Tamaño**: 70x98px cada una (coherente con card-back)
- **Hover/Selección**: Puede escalar a 140x196px temporalmente
- **Estilo**: Adaptado al tema del escenario específico
- **Carga dinámica**: Se cargan según el escenario activo desde ScenarioLoader
- **Formato**: PNG

#### **Event Cards** (`/scenarios/[scenario]/events/[rank][suit].png`) ⭐ **NUEVO**
- **Ruta por escenario**: Cada escenario tiene sus eventos ilustrados únicos
- **Cantidad**: 52 archivos por escenario (2S.png, 3S.png, ... AS.png, etc.)
- **Tamaño**: 280x392px (4x más grande que cartas normales)
- **Uso**: Mostrar durante eventos en modal/overlay centrado
- **Estilo**: Ilustraciones atmosféricas específicas para cada escenario y evento
- **Carga dinámica**: Se cargan vía `scenarioLoader.getEventCardPath(cardId)`
- **Contenido por palo**:
  - **♠ Spades (2S-AS)**: Eventos negativos (fallos, daño, corrupciones)
  - **♥ Hearts (2H-AH)**: Eventos positivos (curación, esperanza, valentía)
  - **♣ Clubs (2C-AC)**: Eventos técnicos (investigación, sistemas, conocimiento)
  - **♦ Diamonds (2D-AD)**: Eventos de recursos (suministros, hallazgos, decisiones)
- **Ejemplos de contenido**:
  - 2S: "Fallo del Sistema" - Circuitos quemándose
  - AH: "Momento Heroico" - Figura heroica enfrentando la oscuridad
  - QC: "Análisis Exitoso" - Datos y pantallas con análisis del Eco
  - KD: "El Arsenal" - Taquilla abierta repleta de herramientas
- **Formato**: PNG con alta calidad artística

### Effects

#### **Projectile** (`/effects/projectile.png`)
- **Tamaño**: 32x32px
- **Estilo**: Energía/bala/proyectil para ataques ♠
- **Formato**: PNG con transparencia

#### **Particles** (`/effects/particles.png`)
- **Tamaño**: 16x16px
- **Estilo**: Chispas, energía, magia para efectos ♦
- **Formato**: PNG con transparencia

## 🎯 Prioridades de Implementación

### **Fase 1 - Básico Funcional**
1. `frame-border.png` - Marco principal
2. `hud-background.png` - HUD básico
3. `main-bg.jpg` - Fondo principal
4. `player-portrait.png` - Jugador
5. `eco-vigilante.png` - Eco básico

### **Fase 2 - UI Completa**
6. 4x `node-bg.png` - Iconos de nodos
7. `button-bg.png` - Botones estilizados
8. `card-back.png` - Reverso de cartas

### **Fase 3 - Assets Completos**
9. 52x archivos de cartas individuales
10. 3x fases del Eco restantes
11. Assets de efectos visuales

## ⚙️ Sistema de Carga de Assets por Escenario

### **Configuración en config.json**
```json
{
  "id": "default",
  "name": "Default Scenario",
  "art": {
    "background": "main-bg.jpg",
    "cardBack": "card-back.png",
    "hudTheme": "hud-background.png",
    "eventCards": true,    // Si usa cartas de eventos específicas
    "customCards": true    // Si usa cartas personalizadas
  },
  "audio": {
    "ambientSound": "ocean-ambient.ogg",
    "music": "tension-theme.ogg"
  }
}
```

### **Métodos de Carga en ScenarioLoader**
- `scenarioLoader.getAssetPath('background')` → `/images/scenarios/default/backgrounds/main-bg.jpg`
- `scenarioLoader.getCardPath('3S')` → `/images/scenarios/default/cards/3S.png`
- `scenarioLoader.getEventCardPath('AS')` → `/images/scenarios/default/events/AS.png`

### **Fallbacks a Assets Globales**
- Si no se especifica un asset específico, usa el global de `/images/ui/`
- Permite desarrollo incremental sin necesidad de assets completos

## 📱 Estructura de Paneles

### **Panel Izquierdo UNIFICADO (200x720px)**
- **0-120px**: Sección superior (info jugador)
- **120-470px**: Imagen vertical del jugador (350px altura)
- **470-620px**: Nodos del sistema
- **620-720px**: Stats detallados HP/CORD/AP

### **Panel Central DIVIDIDO (880px ancho)**
- **0-120px**: Mano del Eco + Status Eco (880px + 200px)
- **120-470px**: Campo de batalla principal (880x350px)
- **470-620px**: Info/Objetivos (680px) + GameLog (400px)
- **620-720px**: Mano del jugador (880x100px)

### **Panel Derecho UNIFICADO (200x720px)**
- **0-120px**: HUD superior del Eco
- **120-470px**: Imagen vertical del Eco (350px altura)
- **470-620px**: GameLog continuo
- **620-720px**: Info adicional del Eco

### **Botones (Fuera del layout principal)**
- **720-800px**: Fila de botones de acción

## 📝 Notas Técnicas

- **⚠️ RESOLUCIÓN FIJA**: 1280x720px (+ 80px botones = 800px total)
- **Paneles unificados**: Izquierdo y derecho son elementos únicos
- **Imágenes integradas**: Retratos forman parte de sus paneles
- **Sin escalado**: Assets exactos para evitar pixelación
- **Coordenadas absolutas**: Posicionamiento pixel-perfect
- **Optimización**: JPG para fondos, PNG para elementos con transparencia
- **Performance**: Assets pequeños para efectos

## 🔧 Placeholders Temporales

Por ahora, el código usará:
- **Colores sólidos** para fondos (CSS gradients)
- **React-icons** para iconografía básica
- **Bordes CSS** para marcos temporales
- **Texturas generadas por código** para efectos básicos
