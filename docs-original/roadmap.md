 
# Roadmap de implementación — Eco del Vacío

## Fase 1 — Base técnica
- Migrar motor HTML a TypeScript + React.
- Implementar `DeckManager`, `GameStateManager` y `TurnManager`.
- Renderizar mesa básica con PixiJS/React.
- Reproducir flujo de turno completo con lógica genérica.

## Fase 2 — Nodos y EcoAI
- Implementar `NodeSystem` con nodos genéricos.
- Integrar `EcoAI` con fases de comportamiento.
- Añadir sistema de recompensas/colapsos.
- Mostrar nodos en tablero.

## Fase 3 — Escenarios
- Definir estructura `/scenarios/<id>/`.
- Implementar `ScenarioLoader`.
- Crear campaña de **Chile** como primer escenario.
- Integrar arte y narrativa.

## Fase 4 — UI y atmósfera
- Diseñar HUD completo.
- Añadir efectos visuales (PixiJS + Framer Motion).
- Implementar sistema de alucinaciones (`HallucinationSystem`).
- Crear overlays narrativos.

## Fase 5 — Balance y expansión
- Ajustar valores de cartas, HP, COR, nodos.
- Integrar dificultad escalonada (Normal, Difícil, Pesadilla).
- Añadir campaña de **Venezuela**.
- Preparar API para futuros escenarios personalizados.
