# Estado del Proyecto - Juego Eco

## Resumen del Proyecto
Juego de cartas survival basado en React + PixiJS donde el jugador debe sobrevivir ataques de un Eco vigilante mientras repara sistemas críticos de una estación.

## Arquitectura Actual
- **Frontend**: React 18 + TypeScript + Vite
- **Rendering**: PixiJS para cartas y efectos visuales + CSS/Tailwind para UI
- **Animaciones**: GSAP para transiciones y efectos
- **Estado**: GameStateManager centralizado con patrón Observer
- **Motor de juego**: TurnManager + CardEffectEngine + EcoAI

## Problemas Recurrentes y Soluciones

### 1. **Problema: Cartas PixiJS Desaparecen al Hover**
**Síntomas**: Al hacer hover sobre cartas, estas desaparecían o se posicionaban incorrectamente.

**Causa Raíz**: El evento `pointerout` usaba posiciones guardadas en estado React que se volvían obsoletas cuando la ventana se redimensionaba.

**Solución Final**: 
- Almacenar posición original directamente en el sprite: `sprite.originalPosition = { x, y }`
- En pointerout, usar `sprite.originalPosition` en lugar de estado React obsoleto
- Evitar reinsertar sprites en el stage, usar `setChildIndex()` para reordenamiento

### 2. **Problema: Duplicación de Cartas al Redimensionar**
**Síntomas**: Al cambiar tamaño de ventana, las cartas se duplicaban o aparecían en posiciones erróneas.

**Causa Raíz**: Múltiples sistemas renderizando cartas (CSS + PixiJS) y ciclos infinitos en useEffect.

**Solución Final**:
- Desactivar sistema CSS de cartas, mantener solo PixiJS
- Simplificar `dealCard` para solo animar sprites existentes
- Dejar que `updateHand` maneje toda la creación y posicionamiento de sprites
- Añadir debounce en cálculos de posición para evitar ciclos infinitos

### 3. **Problema: Texturas Asíncronas Causando Fallos Visuales**
**Síntomas**: Cartas aparecían como rectángulos vacíos o con texturas incorrectas.

**Solución Final**: Implementar carga asíncrona con fallbacks estables:
```typescript
// Cargar textura real de forma asíncrona
const img = new Image();
img.onload = () => {
    const texture = PIXI.Texture.from(img);
    sprite.texture = texture;
};
img.src = cardImageUrl;
```

### 4. **Problema: Layout Responsivo con Superposiciones**
**Síntomas**: Paneles laterales, HUD y tablero central se superponían, especialmente en diferentes resoluciones.

**Intentos de Solución**:
1. Ajuste de z-index y márgenes → Mejoras parciales
2. Refactorización de GameLayout → Persisten problemas
3. Posicionamiento absoluto con cálculos complejos → Inconsistente

**Estado Actual**: Se decide migrar a resolución fija 1280x720 para eliminar complejidad responsiva.

### 5. **Problema: Reflow de Cartas al Jugar**
**Síntomas**: Al jugar una carta, las restantes no se reposicionan automáticamente, dejando espacios vacíos.

**Solución Parcial**: Mejorar llamadas a `updateHand` después de efectos de carta.

### 6. **Problema: Sprites Excesivos en Tablero**
**Síntomas**: Ciertos efectos de cartas causan creación masiva de sprites llenando el tablero.

**Estado**: En investigación, requiere análisis de CardEffectEngine.

## Decisiones Arquitectónicas Clave

### Motor de Rendering Híbrido
- **PixiJS**: Cartas, efectos visuales, animaciones complejas
- **CSS/React**: UI estática, menús, paneles informativos
- **Coordinación**: VFX.tsx como puente entre ambos sistemas

### Gestión de Estado Centralizada
```typescript
GameStateManager (Observable)
├── TurnManager (Fases del juego)
├── CardEffectEngine (Efectos y reglas)
├── EcoAI (IA del oponente)
└── GameLogSystem (Registro de eventos)
```

### Posicionamiento Dinámico
- Cálculo de posiciones basado en dimensiones de contenedor
- Animaciones GSAP para transiciones suaves
- Almacenamiento de posiciones en sprites para referencia

## Próximas Mejoras Planificadas

### Migración a Resolución Fija (En Proceso)
**Objetivo**: Cambiar de diseño responsivo a aplicación fija de 1280x720px
**Beneficios**: 
- Eliminar problemas de superposición
- Posicionamiento pixel-perfect predecible
- Simplificar lógica de layout
- Mejor control sobre experiencia visual

**Implicaciones**:
- Reemplazar unidades responsivas (%, vw, vh) con píxeles fijos
- Contenedor principal centrado en viewport
- Todos los componentes reposicionados con coordenadas absolutas
- Preparar base para futura versión móvil con layout específico

### Optimizaciones Técnicas Pendientes
- Implementar object pooling para sprites de cartas
- Mejorar gestión de memoria en texturas
- Optimizar re-renders innecesarios
- Añadir sistema de caching para efectos visuales

## Estado de Funcionalidades

### ✅ Completadas (Phase 4 Finalizada)
- Sistema base de turnos y fases
- Renderizado de cartas con PixiJS
- Efectos de hover y animaciones básicas
- Carga asíncrona de texturas de cartas
- Motor de efectos de cartas funcional
- IA básica del Eco
- Sistema de logging de combate
- HUD con estadísticas dinámicas
- **🎆 Sistema de Eventos Visuales** - 52 eventos únicos con efectos PixiJS
- **EventVisualSystem.tsx** - 4 tipos de presentación (Card/Image/GIF/Video)
- **PixiScreenEffects.ts** - 12 efectos de pantalla hardware-accelerated
- **Migración a resolución fija 1280x720** - Layout pixel-perfect
- **Integración TurnManager-App-VFX** - Sistema callback para eventos

### 🔄 En Progreso (Phase 5)
- Balance testing del sistema de eventos
- Integración de audio para efectos de pantalla
- Assets reales para imágenes/GIFs/videos de eventos

### 📋 Pendientes (Phase 5)
- Sistema de victoria/derrota mejorado
- Sonidos y música sincronizada con eventos
- Sistema de guardado/carga
- Escenarios adicionales (Chile, Venezuela)
- Menú de configuraciones
- Versión móvil con layout específico
- Efectos de partículas avanzados

---
*Documento actualizado: Enero 2025*
