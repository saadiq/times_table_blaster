# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Times Table Blaster is an educational arcade-style typing shooter game for learning multiplication tables. Built with React 19, TypeScript, and Vite. Uses SM-2 spaced repetition algorithm for intelligent problem selection.

## Commands

```bash
bun dev          # Start dev server with HMR (http://localhost:5173)
bun run build    # TypeScript check + production build
bun run lint     # Run ESLint
bun run preview  # Preview production build
```

No test framework is currently configured.

## Architecture

### Directory Structure

```
src/
├── components/   # React UI (Game, GameCanvas, GameHUD, Menu, ProfilePicker, StatsView)
├── game/         # Game engine (engine.ts), canvas rendering (renderer.ts), constants
├── learning/     # SM-2 spaced repetition (sm2.ts) and weighted problem selection (selector.ts)
├── storage/      # IndexedDB operations for profiles, stats, sessions
├── types/        # Central TypeScript interfaces
└── audio/        # Audio system (placeholder, not connected)
```

### Key Patterns

**Screen Router:** `App.tsx` manages screen state (menu, game, gameover, stats) and passes callbacks to child components.

**Game Loop:** `Game.tsx` uses `requestAnimationFrame` for 60fps updates with separate spawn loop via `setTimeout`. Game state lives in a mutable `useRef<GameState>` for performance.

**Canvas Rendering:** `renderer.ts` exports pure render functions. `GameCanvas.tsx` uses `forwardRef` pattern to expose canvas element to parent.

**Problem Selection:** `selector.ts` implements weighted random selection prioritizing:
- Overdue SM-2 problems (10x multiplier per day overdue)
- Low easiness factors
- Recently missed problems (3x multiplier)

**Persistence:** IndexedDB via `idb` library with compound keys `[profileId, problemKey]` for stats tracking.

### Data Flow

```
App (screens, profiles, selectedTables)
  └─ Game Component
       ├─ Game Loop → updateGameState() → canvas render
       ├─ Spawn Loop → selectProblem() (SM-2 + weights)
       └─ HUD Updates (setInterval)
```

### Game Mechanics

- Missiles fire toward falling problems when correct answer typed
- Collision detection uses rectangle-based AABB
- Difficulty scales with level: faster fall speed, shorter spawn intervals
- Visual effects: explosions (20 frames), wrong answer emojis (30 frames)
- Canvas size: 600×500 fixed
