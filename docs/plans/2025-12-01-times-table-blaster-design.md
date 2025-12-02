# Times Table Blaster - Technical Design

## Overview

An arcade-style educational game for practicing multiplication facts, featuring SM-2 spaced repetition to adapt to player weaknesses and local profile support for multiple users.

## Tech Stack

- **Runtime:** Bun
- **Build:** Vite
- **UI:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Rendering:** HTML Canvas (game area)
- **Persistence:** IndexedDB (via idb library)

## Project Structure

```
times_table_blaster/
├── src/
│   ├── components/       # React UI components
│   │   ├── App.tsx
│   │   ├── ProfilePicker.tsx
│   │   ├── Menu.tsx
│   │   ├── Game.tsx
│   │   ├── GameCanvas.tsx
│   │   ├── GameHUD.tsx
│   │   ├── GameOver.tsx
│   │   └── StatsView.tsx
│   ├── game/             # Pure game logic (no React)
│   │   ├── engine.ts     # Game loop, update, render
│   │   ├── entities.ts   # Problem, Missile, Explosion types
│   │   ├── collision.ts  # Hit detection
│   │   └── renderer.ts   # Canvas drawing functions
│   ├── learning/         # SM-2 + adaptive system
│   │   ├── sm2.ts        # SM-2 algorithm
│   │   ├── problemStore.ts
│   │   └── selector.ts   # Weighted problem selection
│   ├── storage/          # IndexedDB persistence
│   │   ├── db.ts         # Database setup
│   │   ├── profiles.ts   # Profile CRUD
│   │   └── stats.ts      # Performance data
│   ├── audio/            # Sound system (future-ready)
│   │   └── sounds.ts     # Placeholder implementation
│   └── types/            # Shared TypeScript types
├── index.html
├── package.json
└── tailwind.config.js
```

## Data Model

### Profile

```typescript
interface Profile {
  id: string           // UUID
  name: string         // Display name
  createdAt: number    // Timestamp
  highScore: number    // Best score achieved
}
```

### Problem Performance (SM-2 data per problem, per profile)

```typescript
interface ProblemStats {
  profileId: string
  problemKey: string   // "3×7" - canonical form (smaller number first)

  // SM-2 fields
  easiness: number     // EF (starts at 2.5)
  interval: number     // Days until next review
  repetitions: number  // Consecutive correct answers
  nextReview: number   // Timestamp when "due"

  // Additional stats for UI
  totalAttempts: number
  totalCorrect: number
  avgResponseTimeMs: number
  lastSeen: number     // Timestamp
}
```

### Session Stats

```typescript
interface SessionResult {
  profileId: string
  timestamp: number
  score: number
  level: number
  problemsAttempted: number
  problemsCorrect: number
  troubleSpots: string[]  // Problems missed this session
}
```

### IndexedDB Structure

- `profiles` store - keyed by id
- `problemStats` store - keyed by `[profileId, problemKey]`
- `sessions` store - keyed by `[profileId, timestamp]`

## SM-2 Weighted Problem Selection

### Standard SM-2 Adapted for Arcade Flow

Instead of strict scheduling, weight problem selection based on SM-2 data:

```typescript
function selectProblem(selectedTables: number[], allStats: ProblemStats[]): Problem {
  // 1. Filter to problems where at least one operand is in selectedTables
  const eligible = allStats.filter(s => isProblemAvailable(s.problemKey, selectedTables))

  // 2. Include "new" problems (no stats yet) for selected tables
  const newProblems = generateAllProblems(selectedTables)
    .filter(p => !eligible.find(s => s.problemKey === p.key))

  // 3. Score eligible problems:
  //    - Overdue: high weight (days overdue × 10)
  //    - Low easiness: medium weight (3.0 - easiness) × 5
  //    - Never seen: baseline weight (1.0)
  //    - Recently shown this session: skip

  // 4. Weighted random selection
}
```

### Problem-to-Table Mapping

A problem like "3×7" belongs to both the 3s and 7s tables:

```typescript
function isProblemAvailable(problemKey: string, selectedTables: number[]): boolean {
  const tables = getTablesForProblem(problemKey)  // "3×7" → [3, 7]
  return tables.some(t => selectedTables.includes(t))
}
```

### Quality Rating from Gameplay

- Correct + fast (< 3s): quality 5
- Correct + medium (3-6s): quality 4
- Correct + slow (> 6s): quality 3
- Incorrect: quality 1

### Session-Level Boost

Problems missed in the current session get a temporary weight multiplier (×3) so they reappear sooner.

## Game Architecture

### React + Canvas Separation

```
┌─────────────────────────────────────────────────────┐
│  React Layer                                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │ProfilePicker│ │   Menu   │ │     GameOver     │  │
│  └───────────┘ └───────────┘ └───────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Game.tsx (orchestrator)                     │    │
│  │  - Owns game state                          │    │
│  │  - Handles input                            │    │
│  │  - Manages game loop lifecycle              │    │
│  │  ┌─────────────┐  ┌──────────────────────┐  │    │
│  │  │  GameHUD    │  │  GameCanvas          │  │    │
│  │  │  (React)    │  │  (canvas ref)        │  │    │
│  │  └─────────────┘  └──────────────────────┘  │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Pure TypeScript Layer (no React)                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐   │
│  │  engine.ts │ │ renderer.ts│ │  collision.ts  │   │
│  └────────────┘ └────────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Game Loop

```typescript
useEffect(() => {
  const loop = () => {
    updateGameState(stateRef.current)  // Pure function
    render(canvasCtx, stateRef.current) // Pure function
    frameId = requestAnimationFrame(loop)
  }
  frameId = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(frameId)
}, [])
```

Game state lives in a ref (not useState) to avoid 60 re-renders per second. HUD updates throttled to ~10fps.

## Game State

```typescript
interface GameState {
  status: 'playing' | 'paused' | 'ended'
  score: number
  level: number
  lives: number

  problems: Problem[]
  missiles: Missile[]
  explosions: Explosion[]
  wrongAnswerEffects: WrongEffect[]

  problemResults: Map<string, { correct: number, incorrect: number, times: number[] }>

  lastSpawnTime: number
  sessionStartTime: number
}

interface Problem {
  id: string
  a: number
  b: number
  answer: number
  x: number
  y: number
  spawnedAt: number
}

interface Missile {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  targetAnswer: number
  rotation: number
}

interface Explosion {
  id: string
  x: number
  y: number
  frame: number  // 0-20
}

interface WrongEffect {
  id: string
  emoji: string
  x: number
  y: number
  frame: number
  rotation: number
}
```

## User Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ProfilePicker │────▶│     Menu     │────▶│     Game     │
│              │     │              │     │              │
│ Select/Create│     │ Table select │     │   Gameplay   │
│   profile    │     │ High score   │     │              │
│              │     │ View stats   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            ▲                    │
                            │              ┌─────▼────────┐
                            │              │   GameOver   │
                            │              │              │
                            └──────────────│ Score/Stats  │
                               (menu btn)  │ Trouble spots│
                                           │ Play again   │
                                           └──────────────┘
```

## Stats View

Heatmap grid showing mastery level per problem:
- Green: Mastered (EF > 2.5, interval > 7 days)
- Yellow: Learning (EF 2.0-2.5)
- Red: Needs work (EF < 2.0)
- Gray: Not yet practiced

Plus a "trouble spots" list showing lowest-performing problems.

## Audio System (Future-Ready)

Placeholder interface ready for implementation:

```typescript
interface SoundManager {
  init(): Promise<void>
  play(sound: SoundEffect): void
  setMuted(muted: boolean): void
}

type SoundEffect =
  | 'missile_launch'
  | 'explosion'
  | 'wrong_answer'
  | 'level_up'
  | 'game_over'
  | 'menu_select'
```

Integration points stubbed throughout codebase.

## Level Progression (from spec)

- Level = floor(score / 100) + 1
- Fall Speed = 0.3 + (level × 0.15) px/frame
- Spawn Rate = max(2000 - (level × 150), 800) ms
- Max Multiplier = min(5 + floor(level / 2), 12)
