# Assets Requirements - Eco del Vacío

## 📂 Estructura de Carpetas Requerida
```
/public
├── /images
│   ├── /ui                    # Elementos de interfaz
│   │   ├── frame-border.png   # Marco de madera/metal del tablero
│   │   ├── hud-background.png # Fondo semi-transparente para HUD
│   │   ├── node-bg.png        # Fondo para iconos de nodos
│   │   └── button-bg.png      # Fondo para botones
│   ├── /backgrounds           # Fondos atmosféricos
│   │   ├── main-bg.jpg        # Fondo principal del juego
│   │   └── menu-bg.jpg        # Fondo del menú principal
│   ├── /characters            # Personajes
│   │   └── player-portrait.png # Retrato del jugador (300x400px)
│   ├── /eco                   # La entidad antagonista
│   │   ├── eco-vigilante.png  # Eco en fase vigilante
│   │   ├── eco-predator.png   # Eco en fase predador  
│   │   └── eco-devastator.png # Eco en fase devastador
│   ├── /decks                 # Cartas
│   │   └── /default
│   │       ├── card-back.png  # Reverso de las cartas
│   │       ├── 2S.png         # Cartas individuales (52 archivos)
│   │       └── ...            # (resto de cartas 3S, 4S, etc.)
│   └── /effects               # Efectos visuales
│       ├── glow-effect.png    # Texturas para efectos de brillo
│       ├── projectile.png     # Proyectil para ataques
│       └── particles.png      # Texturas para partículas
```

## 🎨 Especificaciones de Assets

### HUD y UI (Resolución: 1920x1080 base)

#### **Frame Border** (`/ui/frame-border.png`)
- **Tamaño**: 1920x1080px
- **Estilo**: Marco de madera envejecida o metal industrial
- **Transparencia**: Centro completamente transparente, solo bordes
- **Grosor**: ~50-80px en los bordes
- **Formato**: PNG con transparencia

#### **HUD Background** (`/ui/hud-background.png`)
- **Tamaño**: 1920x100px (franja superior)
- **Estilo**: Semi-transparente, textura sutil
- **Color**: Negro/gris oscuro con 70% opacidad
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

#### **Main Background** (`/backgrounds/main-bg.jpg`)
- **Tamaño**: 1920x1080px
- **Estilo**: Paisaje marítimo nebuloso y atmosférico
- **Paleta**: Azules, grises, toques de verde
- **Mood**: Horror atmosférico, niebla, desolación
- **Formato**: JPG (optimizado para tamaño)

### Characters

#### **Player Portrait** (`/characters/player-portrait.png`)
- **Tamaño**: 300x400px
- **Estilo**: Hombre con abrigo amarillo, expresión tensa
- **Iluminación**: Dramática, desde un lado
- **Background**: Transparente
- **Formato**: PNG con transparencia

### Eco Entity

#### **Eco Phases** (`/eco/eco-*.png`)
- **Tamaño**: 400x600px cada uno
- **Vigilante**: Forma sombría, menos definida
- **Predator**: Más tentáculos, ojos brillantes
- **Devastator**: Forma más agresiva, aura roja
- **Background**: Transparente
- **Formato**: PNG con transparencia

### Card Assets

#### **Card Back** (`/decks/default/card-back.png`)
- **Tamaño**: 150x210px (ratio 5:7)
- **Estilo**: Diseño geométrico azul, acorde al tema
- **Formato**: PNG

#### **Individual Cards** (`/decks/default/[rank][suit].png`)
- **Cantidad**: 52 archivos (2S.png, 3S.png, ... AS.png, etc.)
- **Tamaño**: 150x210px cada una
- **Estilo**: Diseño clásico con tema atmosférico
- **Formato**: PNG

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

## 📝 Notas Técnicas

- **Optimización**: Usar JPG para fondos, PNG para elementos con transparencia
- **Resolución**: Diseñar para 1920x1080, se escalará automáticamente
- **Paleta de colores**: Mantener coherencia con azules, grises, verdes siniestros
- **Performance**: Assets de efectos pequeños para optimizar rendimiento

## 🔧 Placeholders Temporales

Por ahora, el código usará:
- **Colores sólidos** para fondos (CSS gradients)
- **React-icons** para iconografía básica
- **Bordes CSS** para marcos temporales
- **Texturas generadas por código** para efectos básicos
