# Game Development Status

## Roadmap Progress

The project has made significant progress. The core engine is now functional, and the game loop is playable with basic mechanics. The project's structure is consistent with the one described in `architecture.md`.

-   [X] **Fase 1 — Base técnica**: **Completed**
    -   The original HTML engine has been successfully migrated to a TypeScript + React architecture.
    -   `DeckManager`, `GameStateManager`, and `TurnManager` are implemented and manage the core game flow.
    -   The game board, hand, and HUD are rendered using React.
    -   The four-phase turn (Event, Player, Eco, Maintenance) is fully operational.

-   [X] **Fase 2 — Nodos y EcoAI**: **Engine Complete**
    -   The `NodeSystem` is fully implemented and loads data from scenario files, tracks damage, and provides player rewards.
    -   The `EcoAI` is fully implemented with its three-phase behavior system (`vigilante`, `predador`, `devastador`), including special attacks and hallucination mechanics.

-   [X] **Fase 3 — Escenarios**: **Completed**
    -   The scenario-loading mechanism (`ScenarioLoader.ts`) has been implemented.
    -   The game now runs on data loaded from the `src/scenarios/default` directory.
    -   Core engine components (`DeckManager`, `GameStateManager`, `NodeSystem`, `EcoAI`) have been refactored to use the scenario loader.

-   [ ] **Fase 4 — UI y atmósfera**: **In Progress**
    -   A functional HUD is in place, but it lacks the detailed visual feedback described in `UI.MD`.
    -   The `HallucinationSystem` is implemented, but one of its effects is simplified (see below).
    -   Narrative overlays for events or game over screens are functional but lack styling and narrative text.
    -   **Animations and visual feedback are now being implemented.** Card dealing, hovering, selection, and playing animations are complete. Suit-specific effects (e.g., projectiles for attacks) are in place.
    -   **Crucially, the UI does not yet support advanced player actions like choosing a node to repair or selecting a card to focus.**

-   [ ] **Fase 5 — Balance y expansión**: **Not Started**
    -   Game values (card effects, HP, etc.) are initial placeholders and require balancing.
    -   Difficulty settings are not yet implemented.

## Core Component Status

*   **`src/engine/ScenarioLoader.ts`**: **Done**
*   **`src/engine/GameStateManager.ts`**: **Done**
*   **`src/engine/TurnManager.ts`**: **Done**
*   **`src/engine/DeckManager.ts`**: **Done**

*   **`src/engine/CardEffectEngine.ts`**: **Done**
    *   All card suit effects (Attack, Recover, Search, Investigate/Repair) are implemented.
    *   The "Investigate" action (♣) correctly "exposes" the Eco for double damage.
    -   The "Focus" action is implemented in `TurnManager`.
    *   **Note:** The node repair mechanic is simplified. It's based on a single card's value (`value / 7`) rather than combining multiple cards.

*   **`src/engine/EcoAI.ts`**: **Done**
    *   The AI's behavior is driven by the phased system in `eco.json`.
    *   All phase-specific actions (double attack, node damage, amplified damage, adding hallucinations) are implemented.

*   **`src/engine/NodeSystem.ts`**: **Done**
    *   Creates and tracks nodes based on scenario data.
    *   Damage and repair mechanics are functional.
    *   The reward system correctly applies bonuses to the player's stats.

*   **`src/engine/HallucinationSystem.ts`**: **Done**
    *   The system adds hallucination cards to the player's deck.
    *   Effects are applied correctly upon drawing a hallucination card.
    *   **Note:** One effect ("cannot play Spades this turn") is not fully implemented and only logs to the console, as a player status effect system is not yet in place.

*   **`src/App.tsx`**: **Done**
*   **`src/components/...`**: **Basic Implementation**
    *   UI components are functional but lack animations, sound effects, and detailed visual feedback. They do not yet support advanced mechanics like targeting a node for repair.

## Visual Effect Dependencies
*   **`pixi.js`**: The core rendering library.
*   **`@pixi/react`**: The official React renderer for PixiJS.
*   **`gsap`**: The animation library used for all tweens and timelines.
*   **`@pixi/filter-glow`**: A PixiJS filter used for the card selection highlight effect.
