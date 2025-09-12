# Assets Reference - Estructura de Archivos Disponibles

## Ubicación Base
- **Ruta principal de assets**: `D:\Proyectos\juegoeco\juego\juego-eco\public\images`
- **Ruta de escenarios**: `D:\Proyectos\juegoeco\juego\juego-eco\public\images\scenarios`

## Escenarios Disponibles
- **default**: Escenario principal del juego

## Estructura de Assets por Escenario (default)

### Backgrounds
- `backgrounds/main-bg.png` ✅ (Existe)
- `backgrounds/main-bg.svg` ✅ (Existe)  
- `backgrounds/menu-bg.png` ✅ (Existe)
- `backgrounds/menu-bg.webp` ✅ (Existe)
- `backgrounds/menu-bg.mp4` ✅ (Existe - video backgrounds disponibles)

### Characters
- `characters/player-critical.png` ✅
- `characters/player-dying.png` ✅
- `characters/player-healthy.png` ✅
- `characters/player-stressed.png` ✅
- `characters/player-tired.png` ✅
- `characters/player-wounded.png` ✅
- `characters/player-portrait.png` ✅
- `characters/player-portrait.svg` ✅

### ECO States
- `eco/eco-aggressive.png` ✅
- `eco/eco-devastator.png` ✅
- `eco/eco-devastator.svg` ✅
- `eco/eco-predator.png` ✅
- `eco/eco-predator.svg` ✅
- `eco/eco-vigilante.png` ✅
- `eco/eco-vigilante.svg` ✅

### Cards
- **Cartas completas**: 1-13 para todos los palos (corazones, diamantes, espadas, treboles)
- **Formato**: `{numero}-{palo}.png` (ej: `1-corazones.png`, `13-espadas.png`)
- `card-back.png` ✅ (Reverso de cartas)
- `missing-card.png` ✅ (Fallback para cartas faltantes)
- `missing-card.svg` ✅ (Fallback SVG)

### Events
- **Eventos disponibles**: Misma estructura que cartas (1-13 para todos los palos)
- **Formato**: `{numero}-{palo}.png` (para eventos basados en cartas)
- **Archivos de configuración**:
  - `events.json` ✅
  - `events-crono.json` ✅

### Narrative
- `narrative/chapter1-beginning.svg` ✅
- `narrative/chapter1-end.svg` ✅
- `narrative/chapter2-beginning.svg` ✅
- `narrative/chapter2-end.svg` ✅
- `narrative/chapter2-middle.svg` ✅

## Convenciones de Nomenclatura

### Cartas
- **Números**: 1-13 (donde 11=J, 12=Q, 13=K, 1=A)
- **Palos**: `corazones`, `diamantes`, `espadas`, `treboles`
- **Formato**: `{numero}-{palo}.png`

### Estados de Personajes
- **Jugador**: `player-{estado}.png` donde estado puede ser: healthy, tired, wounded, stressed, critical, dying
- **ECO**: `eco-{estado}.png` donde estado puede ser: vigilante, aggressive, wounded, desperate, defeated

### Backgrounds
- **Principal**: `main-bg.png` (usar como primario)
- **Menú**: `menu-bg.png` (usar como primario)
- **Fallbacks**: Versiones SVG disponibles

## Notas Importantes

1. **AssetManager debe usar rutas relativas** desde `/images/scenarios/{scenario}/`
2. **Extensiones preferidas**: PNG para imágenes principales, SVG como fallback
3. **Estructura consistente**: Todos los escenarios siguen la misma estructura de carpetas
4. **Fallbacks disponibles**: missing-card.png/svg para cartas no encontradas

## Estado de Configuración Actual

- ✅ **Rutas correctas configuradas** en AssetManager.ts
- ✅ **Fallbacks implementados** para assets faltantes  
- ✅ **Sistema de z-index organizado** para prevenir conflictos visuales
- ✅ **Manejo de errores mejorado** para assets opcionales
- ✅ **LayerManager implementado** para gestión avanzada de capas
- ✅ **Warnings de PixiJS corregidos** (Container.name → Container.label)
- ✅ **Sistema de eventos solo después del turno 3** implementado

## Nuevas Funcionalidades

### LayerManager (Motor del Juego)
- **Ubicación**: `src/engine/LayerManager.ts`
- **Propósito**: Gestión centralizada de capas Z-Index
- **Resuelve**: Menú contextual no clickeable, botones detrás de elementos
- **Uso**: `import { layerSystem, GameLayer, useLayer } from '../engine/LayerManager'`

### Problemas Resueltos
- ❌ ~~Menú contextual de cartas no visible~~
- ❌ ~~Botones de fin de turno no clickeables~~
- ❌ ~~Eventos activándose desde turno 1~~
- ❌ ~~Warnings de deprecación de PixiJS~~
- ❌ ~~Assets fallando silenciosamente~~

## Última Actualización
- **Fecha**: 2025-09-12
- **Estado**: Assets verificados, LayerManager implementado
- **Escenarios**: default (completo)
- **Motor**: LayerManager integrado para gestión de capas
