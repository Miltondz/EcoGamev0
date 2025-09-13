## 🎵 Sistema de Audio - Guía de Pruebas

### Estado Actual
- **✅ Sistema de audio implementado** y funcionando
- **✅ Controles compactos** en configuración (sin scroll)
- **✅ Botón de salir** en ventana de configuración
- **✅ Sliders de volumen funcionales** con estilos CSS personalizados
- **✅ Efecto ambiental** `event-strange.mp3` en loop en menú principal
- **✅ Botón mute/unmute rápido** en esquina superior derecha del menú
- **✅ Script de debug** disponible en consola del navegador

### Cómo Probar

#### 1. **Menú Principal**
- Al cargar el juego debería sonar `event-strange.mp3` en loop a volumen medio
- Se para automáticamente al iniciar o continuar partida
- **Botón de mute rápido** en esquina superior derecha (🔊/🔇)
  - Cambia entre volumen 0% y 70%
  - Se actualiza visualmente en tiempo real
  - Incluye tooltip informativo

#### 2. **Controles de Audio**
- Acceder desde Menú Principal → ⚙️ Configuración → 🎵 Audio
- Los controles están compactos en 2 columnas sin necesidad de scroll
- **Sliders funcionales** con estilos personalizados dorados
  - Master, Música, Efectos (0-100%)
  - Efectos de prueba al cambiar volumen
- **Toggles ON/OFF** para activar/desactivar Música y Efectos
- **Info del escenario actual** con nombres abreviados
- **Botón "Volver al Menú Principal"** para salir

#### 3. **Testing en Consola**
Abrir DevTools (F12) y ejecutar:
```javascript
testAudioSystem()
```

Esto probará:
- ✅ Configuración inicial
- ✅ Cambio de escenarios (default → submarine-lab)
- ✅ Efectos de sonido (menu-select, attack-hit, treasure, event-danger)
- ✅ Música de fondo (ambient → tension)
- ✅ Controles de volumen
- ✅ Toggles de audio

#### 4. **Durante el Juego**
- La música cambia según escenario seleccionado
- Efectos de sonido en acciones como ataques, eventos, etc.
- Configuración persiste entre sesiones

### Archivos de Audio Disponibles

**🎵 Música por Escenario:**
- `default/`: ambient.mp3, tension.mp3, victory.mp3
- `submarine-lab/`: ambient.mp3, tension.mp3, victory.mp3

**🔊 Efectos Globales:**
- menu-select.mp3
- attack-hit-1/2/3.mp3, attack-cut-1/2.mp3, attack-special.mp3
- event-danger.mp3, event-scary.mp3, **event-strange.mp3**
- treasure-1/2/3.mp3
- game-over.mp3

### Resolución de Problemas

Si el audio no funciona:
1. **Verificar permisos del navegador** (autoplay policy)
2. **Hacer clic en la página** para activar AudioContext
3. **Abrir consola** y revisar errores de carga de archivos
4. **Ejecutar** `testAudioSystem()` para diagnóstico

### Configuración Técnica
- AudioManager centralizado con singleton pattern
- Precarga de archivos por escenario
- Fade in/out para transiciones suaves
- Configuración persistente en localStorage
- Soporte para efectos en loop
