# Changelog - Crónicas del Abismo

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.2.0] - 2025-09-13

### 🎯 CRÍTICO - Arreglado
- **Desincronización card-sprite**: Resuelto el problema donde el zoom mostraba cartas incorrectas (ej: J de corazones cuando se clickeaba 4 de espadas)
- Implementado sistema para obtener cartas desde estado actual en lugar de closures obsoletos
- Agregado logging detallado para debugging de sincronización

### 🔧 Agregado - Mejores Prácticas PixiJS v8
- **Sistema de limpieza completa de sprites**: Remueve event listeners, mata animaciones y destruye sprites correctamente
- **Manejo correcto de texturas generadas**: Marca y cleanup de texturas dinámicas para prevenir memory leaks
- **Reemplazo de setTimeout con GSAP**: Mayor control de animaciones y mejor performance
- **Gestión segura de trail timers**: Prevención de memory leaks en partículas de arrastre
- **Verificación de existencia de sprites**: Antes de operaciones para prevenir errores

### 💾 Agregado - LocalStorageManager
- **Sistema completo de persistencia inteligente** para configuraciones, estadísticas y preferencias
- **Configuraciones del juego**: Gráficos, audio, gameplay y UI persistentes
- **Estadísticas detalladas**: Partidas jugadas, tiempo, win rate por escenario, achievements
- **Preferencias de usuario**: Último escenario, dificultad, tutoriales completados
- **Manejo de versiones**: Migración automática entre versiones
- **Protección contra storage lleno**: Cleanup automático con QuotaExceededError
- **Export/Import**: Funcionalidad para respaldar y restaurar configuraciones

### 🔄 Agregado - GameLifecycleManager
- **Estados del juego bien definidos**: MENU, LOADING, PLAYING, PAUSED, GAME_OVER, RESETTING
- **Reset completo entre partidas**: Limpia todas las variables y sistemas
- **Prevención de eventos post-game over**: No más eventos después de terminar partida
- **Tracking de sesiones**: Tiempo de juego, cartas jugadas, acciones realizadas
- **Sistema de cleanup tasks**: Registrable para diferentes sistemas
- **Integración con todos los managers**: Audio, VFX, Estado, etc.

### 🔊 Mejorado - AudioManager
- **Integración con localStorage**: Configuraciones persisten automáticamente
- **Métodos de control global**: pauseAll(), resumeAll(), stopAll()
- **Reset a configuración por defecto**: resetToDefaults()
- **Mejor manejo de memoria**: Cleanup automático mejorado
- **Preloading inteligente**: Solo carga audio cuando es necesario

### 🏢 Técnico
- **Build exitoso sin errores**: Compilación TypeScript y Vite completa
- **Imports optimizados**: Removidos imports no utilizados
- **Tipos corregidos**: Compatibilidad con PixiJS v8
- **Documentación actualizada**: README y archivos técnicos

## [1.2.0] - 2025-09-12 (Versión anterior)

### 🎯 **CAMBIOS CRÍTICOS RESUELTOS**

#### LayerManager - Sistema de Gestión de Capas
- **Agregado**: `src/engine/LayerManager.ts` - Sistema centralizado de gestión Z-Index
- **Resuelto**: Menú contextual de cartas no clickeable 
- **Resuelto**: Botones de fin de turno detrás de otros elementos
- **Resuelto**: Conflictos entre efectos PixiJS y UI React
- **Característica**: Hook `useLayer()` para componentes React
- **Característica**: Utilidades `layerSystem` para uso sin hooks
- **Característica**: Integración automática con PixiJS

#### Correcciones de PixiJS
- **Corregido**: Warnings de deprecación `Container.name` → `Container.label`
- **Corregido**: Sintaxis `new PIXI.Text()` a formato v8
- **Actualizado**: Compatibilidad completa con PixiJS v8

#### Sistema de Eventos
- **Implementado**: Eventos de cartas solo se activan después del turno 3
- **Agregado**: Mensaje informativo para el usuario sobre cuándo se activan eventos
- **Mejorado**: Validación en `TurnManager.executeEventPhase()`

#### Gestión de Assets
- **Corregido**: Referencias incorrectas a `main-bg.jpg` → `main-bg.png`
- **Mejorado**: Manejo silencioso de assets faltantes
- **Actualizado**: Logging menos intrusivo para assets opcionales

#### Ajustes Visuales
- **Movido**: Panel del ECO hacia abajo (top: 90px → 150px)
- **Movido**: Cartas del ECO hacia abajo (top: 90px → 220px)
- **Preparado**: Estructura para ajustes del HUD superior

### 🔧 **CAMBIOS TÉCNICOS**

#### Arquitectura
- **Agregado**: Sistema de capas enum `GameLayer` con 75 capas definidas
- **Implementado**: Manager singleton para gestión centralizada
- **Creado**: Hook de React para integración automática
- **Añadido**: Utilidades para PixiJS y DOM

#### Z-Index Organizados
```typescript
// Antes: Z-index hardcodeados dispersos
zIndex: 9999 // ¿Dónde? ¿Por qué?

// Ahora: Sistema centralizado
const { zIndex } = useLayer(GameLayer.CONTEXT_MENU);
// Auto-maneja conflictos y prioridades
```

#### Compatibilidad
- **React**: Hook `useLayer()` 
- **PixiJS**: Contenedores automáticos por capa
- **Vanilla JS**: Utilidades `layerSystem`

### 📁 **ARCHIVOS MODIFICADOS**

#### Nuevos Archivos
- `src/engine/LayerManager.ts` - Sistema principal de capas
- `CHANGELOG.md` - Este archivo de cambios

#### Archivos Modificados
- `src/constants/zIndex.ts` - Valores actualizados con nuevas capas
- `src/engine/TurnManager.ts` - Eventos solo después turno 3
- `src/engine/PixiScreenEffects.ts` - Corregidos usos de Container.name
- `src/components/GameEndSystem.tsx` - Método scoreSystem correcto
- `src/components/VFX.tsx` - Z-index del sistema VFX ajustado
- `src/components/CharacterPortraits.tsx` - Posiciones ECO actualizadas
- `src/App.tsx` - Posiciones de paneles y cartas ajustadas
- `src/docs/ASSETS_REFERENCE.md` - Documentación actualizada

### 🚀 **CÓMO USAR EL NUEVO SISTEMA**

#### En Componentes React:
```typescript
import { useLayer, GameLayer } from '../engine/LayerManager';

function MyContextMenu() {
  const { zIndex, bringToFront } = useLayer(GameLayer.CONTEXT_MENU);
  
  return (
    <div 
      style={{ zIndex }}
      onClick={bringToFront} // Se trae al frente automáticamente
    >
      Menú Contextual
    </div>
  );
}
```

#### Con PixiJS:
```typescript
import { layerSystem, GameLayer } from '../engine/LayerManager';

// Inicializar con la app de Pixi
layerSystem.initPixi(pixiApp);

// Agregar sprites a capas específicas
layerSystem.addToPixi(GameLayer.CARDS_IDLE, cardSprite);
layerSystem.movePixi(cardSprite, GameLayer.CARDS_SELECTED);
```

#### Resolución de Conflictos:
```typescript
// Resolver conflictos automáticamente
layerSystem.resolve('context_menu'); // Trae menú al frente
layerSystem.resolve('modal');        // Trae modal al frente
layerSystem.resolve('tooltip');      // Trae tooltip al frente
```

### 🐛 **ERRORES CONOCIDOS PENDIENTES**

- [ ] Algunas referencias a main-bg.jpg aún persisten (AssetManager.ts línea 458)
- [ ] HUD stats necesita ajuste fino de posición
- [ ] Validar que todos los Container.name estén cambiados

### 📋 **PRÓXIMOS PASOS**

1. **Integrar LayerManager** en todos los componentes existentes
2. **Reemplazar z-index hardcodeados** por el sistema de capas
3. **Probar menú contextual** y botones de fin de turno
4. **Ajustar posiciones finales** según feedback visual
5. **Commit a GitHub** con todos los cambios

---

## [1.1.0] - 2025-09-12 (Cambios Anteriores)

### Cambios Previos
- Sistema de z-index básico implementado
- Correcciones de interactividad de cartas
- Mejoras en carga de assets
- Posicionamiento inicial de elementos

---

**Notas**: Este changelog se actualiza con cada conjunto significativo de cambios. Para detalles técnicos completos, ver commits en GitHub.
