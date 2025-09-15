# 🌊 Crónicas del Abismo
## Libro I: Los Susurros de Hualaihué
*Un juego de cartas de horror roguelike desarrollado con tecnologías web de vanguardia*

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)]()
[![PixiJS](https://img.shields.io/badge/PixiJS-8.13.1-red.svg)]()
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)]()
[![Version](https://img.shields.io/badge/version-4.2-green.svg)]()
[![Last Updated](https://img.shields.io/badge/updated-Sept%202025-yellow.svg)]()

![Game Screenshot](https://raw.githubusercontent.com/Miltondz/EcoGamev0/master/public/images/scenarios/default/backgrounds/main-bg.png)

---

## 📖 **Acerca del Proyecto**

**Crónicas del Abismo** es una serie épica de juegos de cartas de horror psicológico que combina mecánicas roguelike con narrativa inmersiva. Esta primera entrega, **"Los Susurros de Hualaihué"**, transporta a los jugadores a las costas chilenas donde deben sobrevivir contra una entidad ancestral conocida como "El Eco" mientras gestionan recursos críticos, reparan sistemas dañados y mantienen su cordura en un ambiente marítimo claustrofóbico.

### 🎯 **Concepto Central**
Utilizando una baraja estándar de 52 cartas, cada palo representa una habilidad diferente del superviviente:
- **♠ Picas**: Tecnología naval y combate directo
- **♥ Corazones**: Voluntad marinera y resistencia psicológica  
- **♣ Tréboles**: Ingeniería marítima e investigación
- **♦ Diamantes**: Recursos náuticos y exploración costera

---

## 🎭 **Narrativa y Ambientación**

### **El Escenario**
Los jugadores encarnan a un superviviente atrapado en una instalación marítima aislada en las costas de Hualaihué, Chile, donde una entidad ancestral conocida como "El Eco" ha comenzado a manifestarse desde las profundidades del abismo. Esta presencia sobrenatural no solo representa una amenaza física, sino que también corrompe la percepción de la realidad, inyectando alucinaciones y distorsionando los sentidos.

### **La Amenaza: El Eco**
El Eco evoluciona a través de tres fases distintas:
- **🔍 Vigilante**: Observa y aprende los patrones del jugador
- **🦾 Predador**: Intensifica los ataques y manipula la psique
- **💀 Devastador**: Desata todo su poder destructivo

### **Sistemas Críticos**
Cuatro nodos vitales mantienen la instalación operativa:
- **📡 Comunicaciones**: Conexión con el exterior
- **⚡ Energía**: Sistemas de soporte vital  
- **🛡️ Defensa**: Protección contra intrusiones
- **📦 Suministros**: Recursos de supervivencia

---

## 🎮 **Sistema de Juego**

### **Mecánicas Core**
- **Sistema de Turnos por Fases**: 4 fases por turno (Evento → Acción → Eco → Mantenimiento)
- **Gestión de Recursos**: 2 Puntos de Acción por turno, mano máxima de 5 cartas
- **Estadísticas Vitales**: HP (20), Cordura (20), Puntos de Acción (2)
- **Sistema de Nodos**: Reparación y mantenimiento de infraestructura crítica

### **Acciones del Jugador**
- **⚔️ Atacar (♠)**: Infligir daño directo al Eco
- **💖 Recuperar (♥)**: Restaurar cordura y resistencia mental
- **🔧 Investigar (♣)**: Reparar nodos y exponer debilidades del Eco
- **🔍 Buscar (♦)**: Obtener recursos adicionales y cartas extra
- **🎯 Enfocar**: Intercambiar cartas por nuevas opciones estratégicas

### **Sistema de Alucinaciones**
El Eco puede inyectar cartas falsas en la baraja del jugador, creando decisiones engañosas que pueden resultar en consecuencias devastadoras cuando la cordura se ve comprometida.

---

## 🚀 **Stack Tecnológico**

### **Frontend & Framework**
- **React 19.1.1** - Framework principal con hooks modernos
- **TypeScript 5.8.3** - Tipado fuerte y desarrollo robusto
- **Vite 7.1.4** - Build system ultra-rápido con HMR

### **Gráficos y Animaciones**
- **PixiJS 8.13.1** - Motor gráfico WebGL con aceleración por hardware
- **@pixi/react 8.0.3** - Integración React-PixiJS para componentes declarativos
- **GSAP 3.13.0** - Animaciones de alta performance y timeline avanzado
- **Framer Motion 12.23.12** - Animaciones de componentes React
- **pixi-filters 6.1.4** - Filtros avanzados y efectos visuales

### **Estilización y UI**
- **TailwindCSS 4.1.13** - Framework CSS utility-first
- **PostCSS 8.5.6** - Procesamiento CSS avanzado
- **React Icons 5.5.0** - Iconografía completa y consistente

---

## ⚙️ **Engines y Sistemas Desarrollados**

### **🧠 Core Game Engine**
- **GameStateManager**: Gestión centralizada de estado reactivo
- **TurnManager**: Orquestación del loop de juego por fases
- **CardEffectEngine**: Sistema de efectos dinámicos por carta
- **DeckManager**: Manejo completo de barajas, mezcla y distribución

### **🤖 AI & Behavior Systems**
- **EcoAI**: Inteligencia artificial con 3 fases de comportamiento
- **HallucinationSystem**: Inyección procedural de elementos falsos
- **ScenarioEventsEngine**: Motor de eventos narrativos dinámicos
- **ScenarioRulesEngine**: Sistema de reglas modulares por escenario

### **🎨 Advanced Visual Systems** 
*Aprovechando todo el potencial de PixiJS:*
- **PixiScreenEffects**: 12 efectos de pantalla hardware-accelerated
  - ⚡ Lightning, 🔥 Fire, 📺 Glitch, 🌍 Shake, 📻 Static, ✨ Sparks
  - 🌑 Darkness, 💫 Glow, 🦠 Corruption, ⚡ Energy, 🌫️ Fog
- **VFXSystem**: Sistema de partículas y efectos de combate
- **⚡ Electric Arc System**: Arcos eléctricos realistas entre cartas
  - Algoritmos de ruido avanzados para patrones orgánicos
  - Sistema de ramificaciones probabilísticas (65% cortas, 25% medias, 10% largas)
  - Grosor variable con adelgazamiento en extremos
  - Múltiples capas visuales (glow exterior, medio, núcleo blanco)
  - Animación con parpadeo eléctrico y fade-out natural
  - Generación automática cada 3-7 segundos en cartas inactivas
- **EventVisualSystem**: 4 tipos de presentación (Card/Image/GIF/Video)
- **UIPositionManager**: Gestión dinámica de posiciones para animaciones

### **📊 Management Systems**
- **NodeSystem**: Gestión de infraestructura crítica con estados dinámicos
- **GameLogSystem**: Sistema de logging con categorización y filtrado
- **ScoreSystem**: Tracking de logros y puntuación avanzada
- **AssetManager**: Carga dinámica de recursos por escenario

---

## 📊 **Estado Actual**

### **✅ COMPLETADO - Phase 4.2 (98%)**

#### **Motor de Juego (100%)**
- ✅ Sistema completo de gestión de estado
- ✅ Loop de juego por turnos totalmente funcional
- ✅ Motor de efectos de cartas (52 cartas únicas)
- ✅ IA avanzada del Eco con 3 fases comportamentales
- ✅ Sistema completo de nodos con daño/reparación
- ✅ Sistema de alucinaciones procedurales
- ✅ Carga de escenarios modulares
- ✅ **🔧 GameLifecycleManager** - Sistema completo de lifecycle del juego

#### **Sistemas Visuales Avanzados (100%)**
- ✅ Layout fijo 1280×720 completamente implementado
- ✅ Integración completa PixiJS con efectos hardware-accelerated
- ✅ Sistema de eventos visuales con 4 tipos de presentación
- ✅ 12 efectos de pantalla únicos usando PixiJS
- ✅ UI animada con integración GSAP
- ✅ Componentes estilizados con temática atmosférica
- ✅ **LayerManager revolucionario** - Sistema de capas Z-index unificado
- ✅ **🎯 CRÍTICO RESUELTO**: Desincronización card-sprite corregida
- ✅ **🔧 PixiJS v8 Optimizado**: Mejores prácticas y manejo de memoria

#### **UX/UI Moderno (100%)**
- ✅ Menú principal con fondo WebP animado
- ✅ Ventanas modales semitransparentes y compactas
- ✅ Botón de salida en pantalla de juego
- ✅ Navegación intuitiva entre menús
- ✅ Diseño responsivo y profesional
- ✅ **Consistencia visual unificada** - Estilos sistemáticos

#### **Características Avanzadas (100%)**
- ✅ Sistema de logging en tiempo real
- ✅ Sistema de puntuación y logros
- ✅ Motor VFX con efectos de partículas PixiJS
- ✅ Gestión dinámica de posiciones UI
- ✅ Gestión de assets con soporte multi-escenario
- ✅ **Cálculo dinámico de dimensiones** - Adaptación automática
- ✅ **Documentación comprehensiva** - Código autodocumentado
- ✅ **💾 LocalStorage Inteligente** - Configuraciones y estadísticas persistentes
- ✅ **🔊 AudioManager Mejorado** - Mejor manejo de memoria y preloading

### 🆕 **ÚLTIMAS MEJORAS - 15 Sept 2025**

#### **🔧 Mejores Prácticas PixiJS v8**
- ✅ **Problema crítico resuelto**: Desincronización card-sprite (zoom incorrecto)
- ✅ Limpieza completa de memory leaks en texturas y sprites
- ✅ Manejo correcto de event listeners y cleanup
- ✅ Reemplazo de setTimeout con GSAP para mejor control
- ✅ Gestión segura de timers y partículas de arrastre
- ✅ Destrucción apropiada con `destroy()` y parámetros correctos

#### **💾 Sistema de Persistencia Inteligente**
- ✅ **LocalStorageManager**: Configuraciones, estadísticas y preferencias
- ✅ Manejo de versiones y migración automática
- ✅ Protección contra storage lleno con cleanup automático
- ✅ Export/import de configuraciones de usuario
- ✅ Tracking completo de estadísticas por escenario

#### **🔄 GameLifecycleManager**
- ✅ Estados del juego bien definidos (MENU, PLAYING, GAME_OVER, etc.)
- ✅ Reset completo de variables entre partidas
- ✅ Prevención de eventos después de game over
- ✅ Sistema de cleanup tasks registrables
- ✅ Tracking de sesiones con tiempo de juego y acciones

#### **⚡ Sistema de Arcos Eléctricos Realistas**
- ✅ **Algoritmo de ruido avanzado**: Pseudo-Perlin con múltiples frecuencias
- ✅ **Trayectorias orgánicas**: 25px debajo de cartas con segmentos delgados en extremos
- ✅ **Grosor variable inteligente**: Adelgazamiento progresivo y variaciones internas
- ✅ **Sistema de ramificaciones**: Distribución probabilística (65%-25%-10%)
- ✅ **Múltiples capas visuales**: Glow exterior, medio y núcleo blanco superpuestos
- ✅ **Animación realista**: Parpadeo eléctrico con ticker y fade-out natural
- ✅ **Generación automática**: Cada 3-7 segundos entre cartas inactivas

#### **🆕 AudioManager Optimizado**
- ✅ Integración con sistema de persistencia
- ✅ Métodos para pausar/resumir todo el audio
- ✅ Preloading inteligente por escenario
- ✅ Mejor manejo de memoria y cleanup automático

### 📊 **Detalles Técnicos de las Mejoras**

#### **Arquitectura Mejorada**
```typescript
// Sistema de Lifecycle unificado
GameLifecycleManager.getInstance()
  .startNewGame('scenario-id')
  .performCompleteReset()  // Reset completo entre partidas
  .preventEventsAfterGameOver()  // No más eventos después de game over

// Persistencia inteligente
LocalStorageManager.getInstance()
  .saveGameSettings({ audio: { volume: 0.8 } })
  .recordGameResult(true, 25.5, 'submarine-lab')
  .getGameStatistics()  // Estadísticas completas
```

#### **⚡ Sistema de Arcos Eléctricos Avanzado**
- **Algoritmo de Ruido Pseudo-Perlin**: Combina múltiples ondas seno/coseno para patrones orgánicos
- **Trayectoria Realista**: Viaja 25px debajo de las cartas siguiendo bordes inferiores
- **Segmentos Extremos Delgados**: Ínicio y fin con segmentos de ≤10px y ángulos ±15°
- **Grosor Variable Inteligente**: 20% en extremos, 100% en el medio, con variaciones 60-140% para arcos >100px
- **Ramificaciones Orgánicas**: Distribución probabilística con longitudes 5-50px
- **Múltiples Capas Visuales**: Glow exterior (14px), glow medio (8px), núcleo blanco (2px)
- **Sistema de Animación**: Ticker nativo con parpadeo eléctrico y cleanup automático

#### **Performance Optimizado**
- **Memory Management**: Cleanup completo de sprites, texturas y event listeners
- **Audio Pooling**: Reutilización inteligente de audio assets
- **State Synchronization**: Solución definitiva al problema card-sprite
- **Layer Management**: Sistema de capas Z-index unificado y eficiente

### ⚠️ **EN DESARROLLO - Phase 5 (10%)**

#### **Integración de Assets**
- [ ] Artwork final para 52 cartas (actualmente gráficos procedurales)
- [ ] Retratos de personajes (jugador y fases del Eco)
- [ ] Ilustraciones de eventos (52 imágenes únicas)
- [ ] Integración completa del sistema de audio

#### **Balance y Pulido**
- [ ] Ajuste de curva de dificultad
- [ ] Escenarios adicionales (Libro II, Libro III)  
- [ ] Sistema de guardado/carga
- [ ] Optimización de performance
- [ ] Efectos de sonido y audio ambiental

---

## 🎯 **Roadmap Futuro**

### **🎮 Expansiones de Contenido**
- **Nuevos Libros**: Diferentes ubicaciones con mecánicas únicas
- **Modos de Juego**: Survival, Time Attack, Endless Mode
- **Sistema de Capítulos**: Progresión narrativa extendida
- **Cartas Especiales**: Expansiones de la baraja con efectos únicos

### **🔧 Mejoras Técnicas**
- **Optimización PixiJS**: Mejores efectos visuales y rendimiento
- **Sistema de Mods**: Soporte para contenido generado por usuarios
- **Multijugador**: Cooperativo local o en línea
- **Adaptación Móvil**: Versión responsive para tablets y móviles

### **🎨 Mejoras Visuales**
- **Efectos PixiJS Avanzados**: Shaders customizados y post-processing
- **Animaciones Cinematográficas**: Secuencias de eventos mejoradas
- **UI Dinámica**: Interfaces que reaccionan al estado del juego
- **Temas Visuales**: Diferentes estilos artísticos por escenario

---

## 🛠️ **Instalación y Desarrollo**

### **Requisitos**
- Node.js 18+ 
- npm o pnpm
- Navegador moderno con soporte WebGL

### **Setup Local**
```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/juego-eco.git
cd juego-eco

# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### **Comandos Disponibles**
- `npm run dev` - Servidor de desarrollo con HMR
- `npm run build` - Build optimizado para producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Análisis de código con ESLint

---

## 📷 **Screenshots y Demos**

### **Interfaz Actual del Juego**
![Interfaz de Juego](https://raw.githubusercontent.com/Miltondz/EcoGamev0/master/public/images/scenarios/default/preview.png)

*Interfaz completamente funcional con efectos PixiJS, cartas interactivas, y sistema de nodos dinámico*

---

## 🤝 **Contribuciones**

Este proyecto está diseñado con arquitectura modular que facilita contribuciones:
- **Sistema de Escenarios**: Fácil adición de nuevos contenidos
- **Motor de Efectos**: Extensible para nuevos efectos PixiJS
- **Sistema de Cartas**: Configurable para nuevas mecánicas
- **Documentación**: Guías completas para desarrolladores

---

## 📄 **Licencia**

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 **Agradecimientos**

- **PixiJS Community** - Por el increíble motor gráfico WebGL
- **React Team** - Por el framework que hace posible la arquitectura modular
- **GSAP** - Por las animaciones de alta calidad y performance
- **Vite** - Por la experiencia de desarrollo excepcional
- **Comunidad de Hualaihué** - Por la inspiración para la ambientación

---

## 🌊 **Sobre "Los Susurros de Hualaihué"**

Este primer libro de **Crónicas del Abismo** está ambientado en las mist eriosas y traicioneras costas de Hualaihué, Chile. La elección de esta ubicación no es casual: sus extensas costas, su aislamiento natural y su rica tradición marítima proporcionan el escenario perfecto para una historia de supervivencia contra fuerzas ancestrales que emergen desde las profundidades del abismo marítimo.

*Desarrollado con ❤️ usando React, TypeScript, PixiJS y tecnologías web modernas*
