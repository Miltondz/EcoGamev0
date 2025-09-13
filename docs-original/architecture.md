 
# Arquitectura del motor — Eco del Vacío

El juego se basa en un motor modular en **TypeScript + React**, con integración opcional de **PixiJS** para efectos visuales.

## Módulos principales

### 1. AssetLoader
- Carga imágenes, sonidos y fuentes.
- Soporta múltiples carpetas (`/assets`, `/scenarios/.../art/`).
- Mantiene un caché de recursos para acceso rápido.

### 2. DeckManager
- Genera baraja estándar de 52 cartas.
- Baraja, reparte, roba y descarta cartas.
- Permite inyectar eventos personalizados (`events.json`).

### 3. CardEffectEngine
- Aplica efectos de cartas jugadas (ataque, defensa, investigación, búsqueda).
- Aplica modificadores de estado (exposed, corrupt, focus).
- Soporta efectos específicos definidos en escenarios.

### 4. GameStateManager
- Mantiene PV, COR, PA, mano, mazo, descarte.
- Define fases de turno (evento, acción jugador, ataque Eco, mantenimiento).
- Gestiona condiciones de victoria/derrota.

### 5. TurnManager
- Avanza las fases del turno.
- Notifica a UI sobre cambios de estado.
- Integra acciones del Eco y jugador.

### 6. NodeSystem
- Carga nodos desde `nodes.json`.
- Maneja daño, reparación y recompensas.
- Informa colapsos al GameStateManager.

### 7. EcoAI
- Define comportamiento del Eco según fase (vigilante, predador, devastador).
- Interpreta ataques en base al mazo.
- Inserta alucinaciones y genera corrupción.

### 8. HallucinationSystem
- Inyecta cartas falsas en el mazo.
- Maneja efectos visuales/narrativos de confusión.
- Se alimenta de `flavor.json`.

## Esquema de carpetas
/src
/components # React (UI)
/engine # lógica central
/assets # imágenes, audio
/scenarios # campañas (Chile, Venezuela, etc.)
/data # definición genérica (cards.json, events.json)