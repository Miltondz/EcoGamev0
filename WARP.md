# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Eco del Vacío** is a horror roguelike card game built with React + TypeScript and PixiJS. Players survive against "El Eco" entity while managing health, sanity, and critical facility nodes. The game features a complete engine with AI, visual effects system, and atmospheric interface.

## Quick Commands

### Development
```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Testing Individual Components
```powershell
# Test specific scenarios by modifying TurnManager.startGame() calls in App.tsx
# No automated test framework currently configured
```

## Core Architecture

### Engine Layer (`src/engine/`)
The game engine is **completely functional** and contains these core systems:

- **GameStateManager.ts** - Central state (PV, Sanity, AP, turn phases, reactive subscriptions)
- **TurnManager.ts** - 4-phase turn system (Event → Player Action → Eco Attack → Maintenance)
- **CardEffectEngine.ts** - Suit-based card effects with dynamic rule system
- **EcoAI.ts** - 3-phase AI behavior (Vigilante → Predator → Devastador)
- **NodeSystem.ts** - Critical facility nodes with damage/repair mechanics
- **ScenarioLoader.ts** - Modular scenario system (JSON-based configuration)
- **PixiScreenEffects.ts** - 12 hardware-accelerated screen effects for events

### Component Layer (`src/components/`)
React UI components with PixiJS integration:

- **App.tsx** - Main game container with fixed 1280x720 resolution
- **GameLayout.tsx** - 3-zone layout (HUD/Central/Hand) with atmospheric styling  
- **VFX.tsx** - PixiJS integration layer with GSAP animations
- **EventVisualSystem.tsx** - Advanced event presentation (Card/Image/GIF/Video modals)
- **Hand.tsx** - Drag-and-drop card interactions
- **Board.tsx** - Central game area with node visualization

### Data Layer (`src/data/`)
- **cards.json** - Standard 52-card deck definitions
- **events.json** - Event flavor text and configurations

## Key Technical Decisions

### Graphics System
- **PixiJS 8.13.1** for hardware-accelerated effects and card rendering
- **GSAP 3.13.0** for UI animations and transitions
- **Fixed Resolution**: Game designed for 1280x720 with responsive scaling
- **VFX Integration**: PixiJS effects overlay React components via z-index management

### State Management
- **Custom Reactive System**: GameStateManager with subscription-based updates
- **Phase-Driven Architecture**: Turn-based state machine with clear phase transitions
- **Card Selection System**: Multi-card selection with action modes (repair/focus/search)

### Asset Pipeline
- **No bundled card artwork** - game uses procedural graphics and CSS styling
- **TailwindCSS 4.1.13** for styling with custom atmospheric theme
- **React Icons 5.2.1** for UI iconography

## Development Workflow

### Making Changes to Game Logic
1. **Engine modifications** require testing the 4-phase turn cycle
2. **Card effects** are defined in `CardEffectEngine.ts` with JSON-configurable rules
3. **Visual effects** are managed through `PixiScreenEffects.ts` with intensity controls

### Adding New Features
- **New scenarios**: Add JSON files to `src/scenarios/` directory
- **New card effects**: Extend rule system in `CardEffectEngine.ts`
- **New visual effects**: Add to `PixiScreenEffects.ts` effects registry
- **UI components**: Follow the existing pattern with styled-components and reactive state

### Performance Considerations
- **PixiJS rendering** is hardware-accelerated but heavy - profile with browser dev tools
- **Large bundle size** (844KB) due to PixiJS - consider code splitting for production
- **Reactive subscriptions** can cause render cascades - use React.memo for expensive components

## Project Structure Deep Dive

### Engine Architecture
```
GameStateManager ←→ TurnManager ←→ CardEffectEngine
      ↓                   ↓              ↓
  Components         EcoAI System    NodeSystem
      ↓                   ↓              ↓  
   PixiJS VFX     HallucinationSys   ScenarioLoader
```

### Component Hierarchy
```
App.tsx
├── MainMenu.tsx (pre-game)
└── GameLayout.tsx (in-game)
    ├── HUD Components (stats, turn info)
    ├── VFX.tsx (PixiJS overlay)
    ├── Board.tsx (central play area)
    ├── Hand.tsx (player cards)
    └── EventVisualSystem.tsx (event modals)
```

### Current Phase Status
- **Phase 1-3**: Game engine complete and functional ✅
- **Phase 4**: Visual polish and atmospheric interface complete ✅  
- **Phase 5**: Balance testing, additional scenarios, sound system (pending)

## Important Notes

### Game is Fully Playable
The core game loop is complete - cards can be played, the Eco AI responds, nodes can be damaged/repaired, and win/loss conditions work. Focus should be on polish, balance, and expansion rather than core functionality.

### Visual System is Advanced
The game features a sophisticated visual effects system with 52 unique event configurations, PixiJS screen effects, and responsive UI. The `EventVisualSystem` component handles complex modal presentations with multiple media types.

### No Unit Tests
No testing framework is currently configured. Manual testing through gameplay is the current approach. Component testing should focus on visual regression and game state consistency.

### Asset Requirements
If adding artwork, refer to `ASSETS_REQUIREMENTS.md` for specifications. The game currently uses procedural graphics and can be enhanced with actual artwork without code changes.

## Windows Environment Notes

This project runs on Windows with PowerShell. All commands should be run in PowerShell, and file paths use Windows conventions. The development server runs on `localhost:5173` by default with Vite.
