# Times Table Blaster - Initial Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete, playable Times Table Blaster game with SM-2 adaptive learning and local profile support.

**Architecture:** React + Canvas hybrid. React handles UI screens (profile picker, menu, game over, stats). Canvas renders the game area at 60fps. Pure TypeScript game logic separated from React. IndexedDB for persistence via `idb` library.

**Tech Stack:** Bun, Vite, React 18, TypeScript, Tailwind CSS, IndexedDB (idb)

---

## Phase 1: Project Setup

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Step 1: Initialize project with Bun + Vite**

```bash
cd /Users/saadiq/dev/times_table_blaster/.worktrees/initial-implementation
bun create vite . --template react-ts
```

When prompted about non-empty directory, choose to proceed/overwrite.

**Step 2: Install dependencies**

```bash
bun install
```

**Step 3: Verify dev server starts**

```bash
bun run dev
```

Expected: Vite dev server starts, shows local URL

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize Vite + React + TypeScript project"
```

---

### Task 2: Add Tailwind CSS

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`
- Modify: `src/main.tsx`

**Step 1: Install Tailwind and dependencies**

```bash
bun add -d tailwindcss postcss autoprefixer
bunx tailwindcss init -p
```

**Step 2: Configure Tailwind**

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 3: Create CSS file with Tailwind directives**

Create `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Import CSS in main.tsx**

Add to top of `src/main.tsx`:

```typescript
import './index.css'
```

**Step 5: Verify Tailwind works**

Update `src/App.tsx` to include a Tailwind class:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Times Table Blaster</h1>
    </div>
  )
}

export default App
```

Run `bun run dev` and verify styling applies.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Tailwind CSS"
```

---

### Task 3: Add IndexedDB library

**Files:**
- Modify: `package.json`

**Step 1: Install idb**

```bash
bun add idb
```

**Step 2: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add idb for IndexedDB"
```

---

### Task 4: Create project folder structure

**Files:**
- Create: `src/components/.gitkeep`
- Create: `src/game/.gitkeep`
- Create: `src/learning/.gitkeep`
- Create: `src/storage/.gitkeep`
- Create: `src/types/.gitkeep`
- Create: `src/audio/.gitkeep`

**Step 1: Create directories**

```bash
mkdir -p src/components src/game src/learning src/storage src/types src/audio
touch src/components/.gitkeep src/game/.gitkeep src/learning/.gitkeep src/storage/.gitkeep src/types/.gitkeep src/audio/.gitkeep
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: create project folder structure"
```

---

## Phase 2: Types & Data Layer

### Task 5: Define TypeScript types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Create types file**

Create `src/types/index.ts`:

```typescript
// Profile types
export interface Profile {
  id: string
  name: string
  createdAt: number
  highScore: number
}

// SM-2 problem stats
export interface ProblemStats {
  profileId: string
  problemKey: string  // "3×7" canonical form (smaller first)
  easiness: number    // EF, starts at 2.5
  interval: number    // Days until next review
  repetitions: number // Consecutive correct
  nextReview: number  // Timestamp when due
  totalAttempts: number
  totalCorrect: number
  avgResponseTimeMs: number
  lastSeen: number
}

// Session result for history
export interface SessionResult {
  profileId: string
  timestamp: number
  score: number
  level: number
  problemsAttempted: number
  problemsCorrect: number
  troubleSpots: string[]
}

// Game entities
export interface Problem {
  id: string
  a: number
  b: number
  answer: number
  x: number
  y: number
  spawnedAt: number
}

export interface Missile {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  targetAnswer: number
  rotation: number
}

export interface Explosion {
  id: string
  x: number
  y: number
  frame: number
}

export interface WrongEffect {
  id: string
  emoji: string
  x: number
  y: number
  frame: number
  rotation: number
}

// Game state
export interface GameState {
  status: 'playing' | 'paused' | 'ended'
  score: number
  level: number
  lives: number
  problems: Problem[]
  missiles: Missile[]
  explosions: Explosion[]
  wrongAnswerEffects: WrongEffect[]
  problemResults: Map<string, { correct: number; incorrect: number; times: number[] }>
  lastSpawnTime: number
  sessionStartTime: number
}

// App-level state
export type Screen = 'profile' | 'menu' | 'game' | 'gameOver' | 'stats'

export interface AppState {
  screen: Screen
  currentProfile: Profile | null
  selectedTables: number[]
  lastGameResult: {
    score: number
    level: number
    problemsAttempted: number
    problemsCorrect: number
    troubleSpots: string[]
    isNewHighScore: boolean
  } | null
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
rm src/types/.gitkeep
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 6: Implement IndexedDB database setup

**Files:**
- Create: `src/storage/db.ts`

**Step 1: Create database module**

Create `src/storage/db.ts`:

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Profile, ProblemStats, SessionResult } from '../types'

interface TimesTableDB extends DBSchema {
  profiles: {
    key: string
    value: Profile
  }
  problemStats: {
    key: [string, string]  // [profileId, problemKey]
    value: ProblemStats
    indexes: {
      'by-profile': string
    }
  }
  sessions: {
    key: [string, number]  // [profileId, timestamp]
    value: SessionResult
    indexes: {
      'by-profile': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<TimesTableDB>> | null = null

export function getDB(): Promise<IDBPDatabase<TimesTableDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TimesTableDB>('times-table-blaster', 1, {
      upgrade(db) {
        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' })
        }

        // Problem stats store
        if (!db.objectStoreNames.contains('problemStats')) {
          const statsStore = db.createObjectStore('problemStats', {
            keyPath: ['profileId', 'problemKey']
          })
          statsStore.createIndex('by-profile', 'profileId')
        }

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', {
            keyPath: ['profileId', 'timestamp']
          })
          sessionsStore.createIndex('by-profile', 'profileId')
        }
      }
    })
  }
  return dbPromise
}
```

**Step 2: Commit**

```bash
git add src/storage/db.ts
rm src/storage/.gitkeep
git commit -m "feat: implement IndexedDB database setup"
```

---

### Task 7: Implement profile storage

**Files:**
- Create: `src/storage/profiles.ts`

**Step 1: Create profiles module**

Create `src/storage/profiles.ts`:

```typescript
import { getDB } from './db'
import type { Profile } from '../types'

export async function getAllProfiles(): Promise<Profile[]> {
  const db = await getDB()
  return db.getAll('profiles')
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const db = await getDB()
  return db.get('profiles', id)
}

export async function createProfile(name: string): Promise<Profile> {
  const db = await getDB()
  const profile: Profile = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    highScore: 0
  }
  await db.put('profiles', profile)
  return profile
}

export async function updateProfile(profile: Profile): Promise<void> {
  const db = await getDB()
  await db.put('profiles', profile)
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDB()

  // Delete profile
  await db.delete('profiles', id)

  // Delete all problem stats for this profile
  const stats = await db.getAllFromIndex('problemStats', 'by-profile', id)
  const tx = db.transaction('problemStats', 'readwrite')
  for (const stat of stats) {
    await tx.store.delete([stat.profileId, stat.problemKey])
  }
  await tx.done

  // Delete all sessions for this profile
  const sessions = await db.getAllFromIndex('sessions', 'by-profile', id)
  const tx2 = db.transaction('sessions', 'readwrite')
  for (const session of sessions) {
    await tx2.store.delete([session.profileId, session.timestamp])
  }
  await tx2.done
}
```

**Step 2: Commit**

```bash
git add src/storage/profiles.ts
git commit -m "feat: implement profile storage"
```

---

### Task 8: Implement stats storage

**Files:**
- Create: `src/storage/stats.ts`

**Step 1: Create stats module**

Create `src/storage/stats.ts`:

```typescript
import { getDB } from './db'
import type { ProblemStats, SessionResult } from '../types'

// Problem Stats
export async function getProblemStats(profileId: string): Promise<ProblemStats[]> {
  const db = await getDB()
  return db.getAllFromIndex('problemStats', 'by-profile', profileId)
}

export async function getProblemStat(
  profileId: string,
  problemKey: string
): Promise<ProblemStats | undefined> {
  const db = await getDB()
  return db.get('problemStats', [profileId, problemKey])
}

export async function saveProblemStats(stats: ProblemStats): Promise<void> {
  const db = await getDB()
  await db.put('problemStats', stats)
}

export async function saveProblemStatsBatch(statsArray: ProblemStats[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('problemStats', 'readwrite')
  for (const stats of statsArray) {
    await tx.store.put(stats)
  }
  await tx.done
}

// Session Results
export async function saveSessionResult(result: SessionResult): Promise<void> {
  const db = await getDB()
  await db.put('sessions', result)
}

export async function getSessionHistory(
  profileId: string,
  limit = 50
): Promise<SessionResult[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('sessions', 'by-profile', profileId)
  // Sort by timestamp descending and limit
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
}
```

**Step 2: Commit**

```bash
git add src/storage/stats.ts
git commit -m "feat: implement stats storage"
```

---

## Phase 3: SM-2 Learning System

### Task 9: Implement SM-2 algorithm

**Files:**
- Create: `src/learning/sm2.ts`

**Step 1: Create SM-2 module**

Create `src/learning/sm2.ts`:

```typescript
import type { ProblemStats } from '../types'

// Quality ratings based on response
export function calculateQuality(correct: boolean, responseTimeMs: number): number {
  if (!correct) return 1
  if (responseTimeMs < 3000) return 5  // Fast
  if (responseTimeMs < 6000) return 4  // Medium
  return 3  // Slow but correct
}

// Create initial stats for a new problem
export function createInitialStats(
  profileId: string,
  problemKey: string
): ProblemStats {
  return {
    profileId,
    problemKey,
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    totalAttempts: 0,
    totalCorrect: 0,
    avgResponseTimeMs: 0,
    lastSeen: 0
  }
}

// Update stats after answering a problem
export function updateStats(
  stats: ProblemStats,
  quality: number,
  responseTimeMs: number
): ProblemStats {
  const now = Date.now()

  // Update attempt tracking
  const totalAttempts = stats.totalAttempts + 1
  const totalCorrect = quality >= 3 ? stats.totalCorrect + 1 : stats.totalCorrect
  const avgResponseTimeMs = Math.round(
    (stats.avgResponseTimeMs * stats.totalAttempts + responseTimeMs) / totalAttempts
  )

  // SM-2 algorithm
  let { easiness, interval, repetitions } = stats

  // Update easiness factor
  easiness = Math.max(
    1.3,
    easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  if (quality < 3) {
    // Incorrect or very slow - reset
    repetitions = 0
    interval = 0
  } else {
    // Correct - advance
    repetitions += 1
    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 6
    } else {
      interval = Math.round(interval * easiness)
    }
  }

  // Calculate next review timestamp (interval is in days)
  const nextReview = now + interval * 24 * 60 * 60 * 1000

  return {
    ...stats,
    easiness,
    interval,
    repetitions,
    nextReview,
    totalAttempts,
    totalCorrect,
    avgResponseTimeMs,
    lastSeen: now
  }
}

// Check if a problem is due for review
export function isDue(stats: ProblemStats): boolean {
  return Date.now() >= stats.nextReview
}

// Calculate how overdue a problem is (in days, can be negative)
export function daysOverdue(stats: ProblemStats): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return (Date.now() - stats.nextReview) / msPerDay
}
```

**Step 2: Commit**

```bash
git add src/learning/sm2.ts
rm src/learning/.gitkeep
git commit -m "feat: implement SM-2 spaced repetition algorithm"
```

---

### Task 10: Implement problem selector

**Files:**
- Create: `src/learning/selector.ts`

**Step 1: Create selector module**

Create `src/learning/selector.ts`:

```typescript
import type { ProblemStats, Problem } from '../types'
import { createInitialStats, daysOverdue } from './sm2'

// Generate canonical problem key (smaller number first)
export function getProblemKey(a: number, b: number): string {
  const [min, max] = a <= b ? [a, b] : [b, a]
  return `${min}×${max}`
}

// Get which tables a problem belongs to
export function getTablesForProblem(problemKey: string): number[] {
  const [a, b] = problemKey.split('×').map(Number)
  return a === b ? [a] : [a, b]
}

// Check if problem is available given selected tables
export function isProblemAvailable(problemKey: string, selectedTables: number[]): boolean {
  const tables = getTablesForProblem(problemKey)
  return tables.some(t => selectedTables.includes(t))
}

// Generate all possible problems for selected tables
export function generateAllProblemsForTables(
  selectedTables: number[],
  maxMultiplier: number
): string[] {
  const keys = new Set<string>()

  for (const table of selectedTables) {
    for (let i = 0; i <= maxMultiplier; i++) {
      keys.add(getProblemKey(table, i))
    }
  }

  return Array.from(keys)
}

// Calculate weight for problem selection
function calculateWeight(
  stats: ProblemStats | null,
  recentlyShownThisSession: Set<string>,
  missedThisSession: Set<string>
): number {
  const problemKey = stats?.problemKey ?? ''

  // Skip recently shown problems
  if (recentlyShownThisSession.has(problemKey)) {
    return 0
  }

  // New problem - baseline weight
  if (!stats) {
    return 1
  }

  let weight = 1

  // Overdue problems get high weight
  const overdue = daysOverdue(stats)
  if (overdue > 0) {
    weight += overdue * 10
  }

  // Low easiness gets medium weight
  if (stats.easiness < 2.5) {
    weight += (3.0 - stats.easiness) * 5
  }

  // Missed this session gets boost
  if (missedThisSession.has(problemKey)) {
    weight *= 3
  }

  return weight
}

// Select a problem using weighted random selection
export function selectProblem(
  selectedTables: number[],
  maxMultiplier: number,
  allStats: Map<string, ProblemStats>,
  profileId: string,
  recentlyShownThisSession: Set<string>,
  missedThisSession: Set<string>
): Problem {
  // Get all possible problems for selected tables
  const allProblemKeys = generateAllProblemsForTables(selectedTables, maxMultiplier)

  // Calculate weights
  const weighted: { key: string; weight: number }[] = []
  let totalWeight = 0

  for (const key of allProblemKeys) {
    const stats = allStats.get(key) ?? null
    const weight = calculateWeight(stats, recentlyShownThisSession, missedThisSession)

    if (weight > 0) {
      weighted.push({ key, weight })
      totalWeight += weight
    }
  }

  // Fallback if all problems recently shown
  if (weighted.length === 0) {
    recentlyShownThisSession.clear()
    return selectProblem(
      selectedTables,
      maxMultiplier,
      allStats,
      profileId,
      recentlyShownThisSession,
      missedThisSession
    )
  }

  // Weighted random selection
  let random = Math.random() * totalWeight
  let selectedKey = weighted[0].key

  for (const { key, weight } of weighted) {
    random -= weight
    if (random <= 0) {
      selectedKey = key
      break
    }
  }

  // Parse key and create problem
  const [a, b] = selectedKey.split('×').map(Number)

  // Randomly swap order for display variety
  const [displayA, displayB] = Math.random() < 0.5 ? [a, b] : [b, a]

  return {
    id: crypto.randomUUID(),
    a: displayA,
    b: displayB,
    answer: a * b,
    x: 50 + Math.random() * 500,  // GAME_WIDTH - 100
    y: -40,
    spawnedAt: Date.now()
  }
}
```

**Step 2: Commit**

```bash
git add src/learning/selector.ts
git commit -m "feat: implement weighted problem selector with SM-2"
```

---

## Phase 4: Game Engine

### Task 11: Implement game constants and utilities

**Files:**
- Create: `src/game/constants.ts`

**Step 1: Create constants file**

Create `src/game/constants.ts`:

```typescript
// Game dimensions
export const GAME_WIDTH = 600
export const GAME_HEIGHT = 500

// Gameplay
export const INITIAL_LIVES = 3
export const POINTS_PER_DESTROY = 10
export const POINTS_PER_LEVEL = 100

// Difficulty scaling
export function getFallSpeed(level: number): number {
  return 0.3 + level * 0.15
}

export function getSpawnInterval(level: number): number {
  return Math.max(2000 - level * 150, 800)
}

export function getMaxMultiplier(level: number): number {
  return Math.min(5 + Math.floor(level / 2), 12)
}

// Missile
export const MISSILE_SPEED = 12

// Collision
export const PROBLEM_HIT_WIDTH = 60
export const PROBLEM_HIT_HEIGHT = 35

// Effects
export const EXPLOSION_FRAMES = 20
export const WRONG_EFFECT_FRAMES = 30
export const WRONG_EFFECT_EMOJIS = ['💥', '❌', '🙈', '😱', '🤯']

// Stars
export const STAR_COUNT = 50
```

**Step 2: Commit**

```bash
git add src/game/constants.ts
rm src/game/.gitkeep
git commit -m "feat: add game constants and difficulty formulas"
```

---

### Task 12: Implement game state factory and update logic

**Files:**
- Create: `src/game/engine.ts`

**Step 1: Create engine module**

Create `src/game/engine.ts`:

```typescript
import type { GameState, Problem, Missile, Explosion, WrongEffect } from '../types'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  INITIAL_LIVES,
  POINTS_PER_DESTROY,
  POINTS_PER_LEVEL,
  getFallSpeed,
  MISSILE_SPEED,
  PROBLEM_HIT_WIDTH,
  PROBLEM_HIT_HEIGHT,
  EXPLOSION_FRAMES,
  WRONG_EFFECT_FRAMES,
  WRONG_EFFECT_EMOJIS
} from './constants'
import { getProblemKey } from '../learning/selector'

export function createInitialGameState(): GameState {
  return {
    status: 'playing',
    score: 0,
    level: 1,
    lives: INITIAL_LIVES,
    problems: [],
    missiles: [],
    explosions: [],
    wrongAnswerEffects: [],
    problemResults: new Map(),
    lastSpawnTime: Date.now(),
    sessionStartTime: Date.now()
  }
}

export function calculateLevel(score: number): number {
  return Math.floor(score / POINTS_PER_LEVEL) + 1
}

export function updateGameState(state: GameState): void {
  if (state.status !== 'playing') return

  const fallSpeed = getFallSpeed(state.level)

  // Update problems
  for (let i = state.problems.length - 1; i >= 0; i--) {
    const problem = state.problems[i]
    problem.y += fallSpeed

    // Check if problem reached bottom
    if (problem.y > GAME_HEIGHT) {
      state.problems.splice(i, 1)
      state.lives -= 1

      // Track as incorrect
      const key = getProblemKey(problem.a, problem.b)
      const result = state.problemResults.get(key) ?? { correct: 0, incorrect: 0, times: [] }
      result.incorrect += 1
      state.problemResults.set(key, result)

      if (state.lives <= 0) {
        state.status = 'ended'
      }
    }
  }

  // Update missiles
  for (let i = state.missiles.length - 1; i >= 0; i--) {
    const missile = state.missiles[i]
    missile.x += missile.vx
    missile.y += missile.vy

    // Remove if off screen
    if (
      missile.x < -20 ||
      missile.x > GAME_WIDTH + 20 ||
      missile.y < -20 ||
      missile.y > GAME_HEIGHT + 20
    ) {
      state.missiles.splice(i, 1)
      continue
    }

    // Check collision with problems
    for (let j = state.problems.length - 1; j >= 0; j--) {
      const problem = state.problems[j]
      if (
        missile.targetAnswer === problem.answer &&
        Math.abs(missile.x - problem.x) < PROBLEM_HIT_WIDTH / 2 &&
        Math.abs(missile.y - problem.y) < PROBLEM_HIT_HEIGHT / 2
      ) {
        // Hit!
        const responseTime = Date.now() - problem.spawnedAt

        // Track as correct
        const key = getProblemKey(problem.a, problem.b)
        const result = state.problemResults.get(key) ?? { correct: 0, incorrect: 0, times: [] }
        result.correct += 1
        result.times.push(responseTime)
        state.problemResults.set(key, result)

        // Add explosion
        state.explosions.push({
          id: crypto.randomUUID(),
          x: problem.x,
          y: problem.y,
          frame: 0
        })

        // Update score and level
        state.score += POINTS_PER_DESTROY * state.level
        state.level = calculateLevel(state.score)

        // Remove missile and problem
        state.missiles.splice(i, 1)
        state.problems.splice(j, 1)
        break
      }
    }
  }

  // Update explosions
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    state.explosions[i].frame += 1
    if (state.explosions[i].frame >= EXPLOSION_FRAMES) {
      state.explosions.splice(i, 1)
    }
  }

  // Update wrong answer effects
  for (let i = state.wrongAnswerEffects.length - 1; i >= 0; i--) {
    const effect = state.wrongAnswerEffects[i]
    effect.frame += 1
    effect.y -= 2  // Float upward
    effect.rotation += 0.1
    if (effect.frame >= WRONG_EFFECT_FRAMES) {
      state.wrongAnswerEffects.splice(i, 1)
    }
  }
}

export function fireMissile(
  state: GameState,
  answer: number,
  launchX: number
): boolean {
  // Find a problem with this answer
  const target = state.problems.find(p => p.answer === answer)

  if (!target) {
    // Wrong answer - spawn effects
    for (let i = 0; i < 5; i++) {
      state.wrongAnswerEffects.push({
        id: crypto.randomUUID(),
        emoji: WRONG_EFFECT_EMOJIS[Math.floor(Math.random() * WRONG_EFFECT_EMOJIS.length)],
        x: Math.random() * GAME_WIDTH,
        y: GAME_HEIGHT - 100 + Math.random() * 50,
        frame: 0,
        rotation: 0
      })
    }
    return false
  }

  // Calculate direction to target
  const dx = target.x - launchX
  const dy = target.y - (GAME_HEIGHT - 30)
  const dist = Math.sqrt(dx * dx + dy * dy)
  const vx = (dx / dist) * MISSILE_SPEED
  const vy = (dy / dist) * MISSILE_SPEED
  const rotation = Math.atan2(dy, dx)

  state.missiles.push({
    id: crypto.randomUUID(),
    x: launchX,
    y: GAME_HEIGHT - 30,
    vx,
    vy,
    targetAnswer: answer,
    rotation
  })

  return true
}

export function addProblem(state: GameState, problem: Problem): void {
  state.problems.push(problem)
  state.lastSpawnTime = Date.now()
}
```

**Step 2: Commit**

```bash
git add src/game/engine.ts
git commit -m "feat: implement game state and update logic"
```

---

### Task 13: Implement canvas renderer

**Files:**
- Create: `src/game/renderer.ts`

**Step 1: Create renderer module**

Create `src/game/renderer.ts`:

```typescript
import type { GameState } from '../types'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  STAR_COUNT,
  EXPLOSION_FRAMES,
  WRONG_EFFECT_FRAMES
} from './constants'

// Star positions (generated once)
let stars: { x: number; y: number; size: number; twinkleOffset: number }[] = []

function initStars(): void {
  if (stars.length > 0) return
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      size: Math.random() * 2 + 1,
      twinkleOffset: Math.random() * Math.PI * 2
    })
  }
}

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  initStars()

  // Clear and draw background
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  gradient.addColorStop(0, '#0f0c29')
  gradient.addColorStop(0.5, '#302b63')
  gradient.addColorStop(1, '#24243e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  // Draw stars
  const time = Date.now() / 1000
  for (const star of stars) {
    const twinkle = Math.sin(time * 2 + star.twinkleOffset) * 0.5 + 0.5
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw problems
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const problem of state.problems) {
    // Background pill
    const text = `${problem.a} × ${problem.b}`
    const metrics = ctx.measureText(text)
    const padding = 12
    const width = metrics.width + padding * 2
    const height = 32

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.roundRect(problem.x - width / 2, problem.y - height / 2, width, height, 8)
    ctx.fill()

    // Text
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText(text, problem.x, problem.y)
  }

  // Draw missiles
  for (const missile of state.missiles) {
    ctx.save()
    ctx.translate(missile.x, missile.y)
    ctx.rotate(missile.rotation + Math.PI / 2)

    // Rocket emoji or simple triangle
    ctx.font = '24px Arial'
    ctx.fillText('🚀', 0, 0)

    ctx.restore()
  }

  // Draw explosions
  for (const explosion of state.explosions) {
    const progress = explosion.frame / EXPLOSION_FRAMES
    const size = 20 + progress * 40
    const opacity = 1 - progress

    ctx.globalAlpha = opacity
    ctx.font = `${size}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💥', explosion.x, explosion.y)
    ctx.globalAlpha = 1
  }

  // Draw wrong answer effects
  for (const effect of state.wrongAnswerEffects) {
    const progress = effect.frame / WRONG_EFFECT_FRAMES
    const opacity = 1 - progress

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(effect.x, effect.y)
    ctx.rotate(effect.rotation)
    ctx.font = '30px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(effect.emoji, 0, 0)
    ctx.restore()
  }
}
```

**Step 2: Commit**

```bash
git add src/game/renderer.ts
git commit -m "feat: implement canvas renderer"
```

---

## Phase 5: React Components

### Task 14: Implement ProfilePicker component

**Files:**
- Create: `src/components/ProfilePicker.tsx`

**Step 1: Create ProfilePicker component**

Create `src/components/ProfilePicker.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { Profile } from '../types'
import { getAllProfiles, createProfile, deleteProfile } from '../storage/profiles'

interface Props {
  onSelectProfile: (profile: Profile) => void
}

export function ProfilePicker({ onSelectProfile }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    const loaded = await getAllProfiles()
    setProfiles(loaded.sort((a, b) => b.createdAt - a.createdAt))
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const profile = await createProfile(newName.trim())
    setNewName('')
    setIsCreating(false)
    onSelectProfile(profile)
  }

  async function handleDelete(id: string) {
    await deleteProfile(id)
    setConfirmDelete(null)
    loadProfiles()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">🚀 Times Table Blaster 🚀</h1>
      <p className="text-gray-400 mb-8">Select your profile to continue</p>

      <div className="w-full max-w-md space-y-4">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <button
              onClick={() => onSelectProfile(profile)}
              className="flex-1 text-left hover:text-green-400 transition-colors"
            >
              <div className="font-semibold text-lg">{profile.name}</div>
              <div className="text-sm text-gray-400">
                High Score: {profile.highScore.toLocaleString()}
              </div>
            </button>
            {confirmDelete === profile.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(profile.id)}
                className="text-gray-500 hover:text-red-400 transition-colors"
                title="Delete profile"
              >
                🗑️
              </button>
            )}
          </div>
        ))}

        {isCreating ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Enter your name"
              className="w-full bg-gray-700 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 bg-green-600 rounded py-2 font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Profile
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewName('')
                }}
                className="px-4 bg-gray-600 rounded py-2 hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full bg-gray-800 rounded-lg p-4 text-green-400 hover:bg-gray-700 transition-colors font-semibold"
          >
            + New Profile
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ProfilePicker.tsx
rm src/components/.gitkeep
git commit -m "feat: implement ProfilePicker component"
```

---

### Task 15: Implement Menu component

**Files:**
- Create: `src/components/Menu.tsx`

**Step 1: Create Menu component**

Create `src/components/Menu.tsx`:

```tsx
import type { Profile } from '../types'

interface Props {
  profile: Profile
  selectedTables: number[]
  onToggleTable: (table: number) => void
  onStartGame: () => void
  onViewStats: () => void
  onChangeProfile: () => void
}

export function Menu({
  profile,
  selectedTables,
  onToggleTable,
  onStartGame,
  onViewStats,
  onChangeProfile
}: Props) {
  const tables = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🚀 Times Table Blaster</h1>
          <button
            onClick={onChangeProfile}
            className="text-gray-400 hover:text-white text-sm"
          >
            {profile.name} ▼
          </button>
        </div>

        {profile.highScore > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6 text-center">
            <div className="text-yellow-400 text-sm">🏆 High Score</div>
            <div className="text-2xl font-bold text-yellow-300">
              {profile.highScore.toLocaleString()}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Times Tables</h2>
          <div className="grid grid-cols-5 gap-2">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => onToggleTable(table)}
                className={`
                  py-3 rounded-lg font-semibold transition-colors
                  ${
                    selectedTables.includes(table)
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }
                `}
              >
                {table}×
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            {selectedTables.length === 0
              ? 'Select at least one table to start'
              : `${selectedTables.length} table${selectedTables.length === 1 ? '' : 's'} selected`}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onStartGame}
            disabled={selectedTables.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 text-xl font-bold transition-colors"
          >
            Start Game
          </button>

          <button
            onClick={onViewStats}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg py-3 font-semibold transition-colors"
          >
            📊 View Progress
          </button>
        </div>

        <div className="mt-8 bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">How to Play</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Problems fall from the sky</li>
            <li>• Type the answer and press Enter to fire</li>
            <li>• Destroy problems before they reach the bottom</li>
            <li>• You have 3 lives - don&apos;t let them run out!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/Menu.tsx
git commit -m "feat: implement Menu component"
```

---

### Task 16: Implement GameHUD component

**Files:**
- Create: `src/components/GameHUD.tsx`

**Step 1: Create GameHUD component**

Create `src/components/GameHUD.tsx`:

```tsx
interface Props {
  lives: number
  level: number
  score: number
}

export function GameHUD({ lives, level, score }: Props) {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-gray-900/80 text-white">
      <div className="text-xl">
        {Array.from({ length: lives }, (_, i) => (
          <span key={i}>❤️</span>
        ))}
        {Array.from({ length: 3 - lives }, (_, i) => (
          <span key={i} className="opacity-30">🖤</span>
        ))}
      </div>
      <div className="text-lg font-semibold">Level {level}</div>
      <div className="text-xl font-bold">{score.toLocaleString()}</div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/GameHUD.tsx
git commit -m "feat: implement GameHUD component"
```

---

### Task 17: Implement GameCanvas component

**Files:**
- Create: `src/components/GameCanvas.tsx`

**Step 1: Create GameCanvas component**

Create `src/components/GameCanvas.tsx`:

```tsx
import { useRef, useEffect } from 'react'
import type { GameState } from '../types'
import { render } from '../game/renderer'
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants'

interface Props {
  gameState: GameState
}

export function GameCanvas({ gameState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    render(ctx, gameState)
  }, [gameState])

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block"
    />
  )
}
```

**Step 2: Commit**

```bash
git add src/components/GameCanvas.tsx
git commit -m "feat: implement GameCanvas component"
```

---

### Task 18: Implement Game component (orchestrator)

**Files:**
- Create: `src/components/Game.tsx`

**Step 1: Create Game component**

Create `src/components/Game.tsx`:

```tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Profile, GameState, ProblemStats } from '../types'
import { GameCanvas } from './GameCanvas'
import { GameHUD } from './GameHUD'
import {
  createInitialGameState,
  updateGameState,
  fireMissile,
  addProblem
} from '../game/engine'
import { getSpawnInterval, getMaxMultiplier, GAME_WIDTH } from '../game/constants'
import { selectProblem, getProblemKey } from '../learning/selector'
import { getProblemStats, saveProblemStatsBatch } from '../storage/stats'
import { updateProfile } from '../storage/profiles'
import { updateStats, calculateQuality, createInitialStats } from '../learning/sm2'

interface Props {
  profile: Profile
  selectedTables: number[]
  onGameOver: (result: {
    score: number
    level: number
    problemsAttempted: number
    problemsCorrect: number
    troubleSpots: string[]
    isNewHighScore: boolean
  }) => void
  onBackToMenu: () => void
}

export function Game({ profile, selectedTables, onGameOver, onBackToMenu }: Props) {
  const [renderTick, setRenderTick] = useState(0)
  const [inputValue, setInputValue] = useState('')

  const gameStateRef = useRef<GameState>(createInitialGameState())
  const statsMapRef = useRef<Map<string, ProblemStats>>(new Map())
  const recentlyShownRef = useRef<Set<string>>(new Set())
  const missedThisSessionRef = useRef<Set<string>>(new Set())
  const gameLoopRef = useRef<number | null>(null)
  const spawnIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hudUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load stats on mount
  useEffect(() => {
    async function loadStats() {
      const stats = await getProblemStats(profile.id)
      const map = new Map<string, ProblemStats>()
      for (const s of stats) {
        map.set(s.problemKey, s)
      }
      statsMapRef.current = map
    }
    loadStats()
  }, [profile.id])

  // Spawn problems
  const spawnProblem = useCallback(() => {
    const state = gameStateRef.current
    if (state.status !== 'playing') return

    const problem = selectProblem(
      selectedTables,
      getMaxMultiplier(state.level),
      statsMapRef.current,
      profile.id,
      recentlyShownRef.current,
      missedThisSessionRef.current
    )

    // Track as recently shown
    const key = getProblemKey(problem.a, problem.b)
    recentlyShownRef.current.add(key)
    if (recentlyShownRef.current.size > 5) {
      const first = recentlyShownRef.current.values().next().value
      if (first) recentlyShownRef.current.delete(first)
    }

    addProblem(state, problem)
  }, [selectedTables, profile.id])

  // Schedule next spawn
  const scheduleSpawn = useCallback(() => {
    const state = gameStateRef.current
    if (state.status !== 'playing') return

    const interval = getSpawnInterval(state.level)
    spawnIntervalRef.current = setTimeout(() => {
      spawnProblem()
      scheduleSpawn()
    }, interval)
  }, [spawnProblem])

  // Game loop
  useEffect(() => {
    // Start spawning
    spawnProblem()
    scheduleSpawn()

    // Game loop
    function loop() {
      const state = gameStateRef.current
      updateGameState(state)

      // Check for newly missed problems
      for (const [key, result] of state.problemResults) {
        if (result.incorrect > 0) {
          missedThisSessionRef.current.add(key)
        }
      }

      // Check game over
      if (state.status === 'ended') {
        handleGameEnd()
        return
      }

      gameLoopRef.current = requestAnimationFrame(loop)
    }

    gameLoopRef.current = requestAnimationFrame(loop)

    // HUD update (10fps)
    hudUpdateRef.current = setInterval(() => {
      setRenderTick(t => t + 1)
    }, 100)

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current)
      if (hudUpdateRef.current) clearInterval(hudUpdateRef.current)
    }
  }, [spawnProblem, scheduleSpawn])

  async function handleGameEnd() {
    if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current)
    if (hudUpdateRef.current) clearInterval(hudUpdateRef.current)

    const state = gameStateRef.current
    const statsMap = statsMapRef.current

    // Update SM-2 stats for all problems encountered
    const updatedStats: ProblemStats[] = []
    let problemsAttempted = 0
    let problemsCorrect = 0
    const troubleSpots: string[] = []

    for (const [key, result] of state.problemResults) {
      problemsAttempted += result.correct + result.incorrect

      if (result.correct > 0) {
        problemsCorrect += result.correct
        const avgTime = result.times.reduce((a, b) => a + b, 0) / result.times.length
        const quality = calculateQuality(true, avgTime)

        let stats = statsMap.get(key) ?? createInitialStats(profile.id, key)
        stats = updateStats(stats, quality, avgTime)
        updatedStats.push(stats)
      }

      if (result.incorrect > 0) {
        troubleSpots.push(key)
        let stats = statsMap.get(key) ?? createInitialStats(profile.id, key)
        stats = updateStats(stats, 1, 10000) // quality 1 for incorrect
        updatedStats.push(stats)
      }
    }

    // Save stats
    if (updatedStats.length > 0) {
      await saveProblemStatsBatch(updatedStats)
    }

    // Update high score if needed
    const isNewHighScore = state.score > profile.highScore
    if (isNewHighScore) {
      await updateProfile({ ...profile, highScore: state.score })
    }

    onGameOver({
      score: state.score,
      level: state.level,
      problemsAttempted,
      problemsCorrect,
      troubleSpots,
      isNewHighScore
    })
  }

  function handleFire() {
    const answer = parseInt(inputValue, 10)
    if (isNaN(answer)) return

    fireMissile(gameStateRef.current, answer, GAME_WIDTH / 2)
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFire()
    }
  }

  const state = gameStateRef.current

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
        <GameHUD lives={state.lives} level={state.level} score={state.score} />
        <GameCanvas gameState={state} />
        <div className="p-4 bg-gray-800">
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type answer..."
              className="flex-1 bg-gray-700 rounded px-4 py-3 text-white text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <button
              onClick={handleFire}
              className="bg-green-600 hover:bg-green-700 rounded px-6 py-3 font-bold text-lg transition-colors"
            >
              Fire! 🚀
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Type the answer and press Enter to fire!
          </p>
        </div>
      </div>
      <button
        onClick={onBackToMenu}
        className="mt-4 text-gray-500 hover:text-gray-300 text-sm"
      >
        ← Back to Menu
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: implement Game orchestrator component"
```

---

### Task 19: Implement GameOver component

**Files:**
- Create: `src/components/GameOver.tsx`

**Step 1: Create GameOver component**

Create `src/components/GameOver.tsx`:

```tsx
interface Props {
  score: number
  level: number
  problemsAttempted: number
  problemsCorrect: number
  troubleSpots: string[]
  isNewHighScore: boolean
  onPlayAgain: () => void
  onBackToMenu: () => void
}

export function GameOver({
  score,
  level,
  problemsAttempted,
  problemsCorrect,
  troubleSpots,
  isNewHighScore,
  onPlayAgain,
  onBackToMenu
}: Props) {
  const accuracy = problemsAttempted > 0
    ? Math.round((problemsCorrect / problemsAttempted) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-5xl font-bold mb-4">GAME OVER</h1>

        {isNewHighScore && (
          <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 mb-6 animate-pulse">
            <div className="text-2xl">🎉 NEW HIGH SCORE! 🎉</div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="text-5xl font-bold text-green-400 mb-2">
            {score.toLocaleString()}
          </div>
          <div className="text-gray-400">Final Score</div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <div className="text-2xl font-bold">{level}</div>
              <div className="text-sm text-gray-400">Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{problemsCorrect}</div>
              <div className="text-sm text-gray-400">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
          </div>
        </div>

        {troubleSpots.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2 text-yellow-400">
              📝 Practice These:
            </h3>
            <div className="flex flex-wrap gap-2">
              {troubleSpots.slice(0, 5).map(key => (
                <span
                  key={key}
                  className="bg-gray-700 px-3 py-1 rounded text-sm"
                >
                  {key}
                </span>
              ))}
              {troubleSpots.length > 5 && (
                <span className="text-gray-400 text-sm">
                  +{troubleSpots.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-green-600 hover:bg-green-700 rounded-lg py-4 text-xl font-bold transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg py-3 font-semibold transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/GameOver.tsx
git commit -m "feat: implement GameOver component"
```

---

### Task 20: Implement StatsView component

**Files:**
- Create: `src/components/StatsView.tsx`

**Step 1: Create StatsView component**

Create `src/components/StatsView.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { Profile, ProblemStats } from '../types'
import { getProblemStats } from '../storage/stats'
import { getProblemKey } from '../learning/selector'

interface Props {
  profile: Profile
  onBack: () => void
}

type MasteryLevel = 'mastered' | 'learning' | 'needsWork' | 'unseen'

function getMasteryLevel(stats: ProblemStats | undefined): MasteryLevel {
  if (!stats) return 'unseen'
  if (stats.easiness >= 2.5 && stats.interval >= 7) return 'mastered'
  if (stats.easiness >= 2.0) return 'learning'
  return 'needsWork'
}

function getMasteryEmoji(level: MasteryLevel): string {
  switch (level) {
    case 'mastered': return '🟢'
    case 'learning': return '🟡'
    case 'needsWork': return '🔴'
    case 'unseen': return '⚪'
  }
}

export function StatsView({ profile, onBack }: Props) {
  const [statsMap, setStatsMap] = useState<Map<string, ProblemStats>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const stats = await getProblemStats(profile.id)
      const map = new Map<string, ProblemStats>()
      for (const s of stats) {
        map.set(s.problemKey, s)
      }
      setStatsMap(map)
      setLoading(false)
    }
    load()
  }, [profile.id])

  // Get trouble spots (lowest easiness)
  const troubleSpots = Array.from(statsMap.values())
    .filter(s => s.totalAttempts > 0)
    .sort((a, b) => a.easiness - b.easiness)
    .slice(0, 5)

  // Calculate overall stats
  const allStats = Array.from(statsMap.values())
  const totalPracticed = allStats.filter(s => s.totalAttempts > 0).length
  const totalAttempts = allStats.reduce((sum, s) => sum + s.totalAttempts, 0)
  const totalCorrect = allStats.reduce((sum, s) => sum + s.totalCorrect, 0)
  const overallAccuracy = totalAttempts > 0
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0

  const tables = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const multipliers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading stats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 Your Progress</h1>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            ← Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{totalPracticed}</div>
            <div className="text-sm text-gray-400">Problems Practiced</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{overallAccuracy}%</div>
            <div className="text-sm text-gray-400">Overall Accuracy</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{profile.highScore.toLocaleString()}</div>
            <div className="text-sm text-gray-400">High Score</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Mastery Grid</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr>
                  <th className="p-2">×</th>
                  {multipliers.map(m => (
                    <th key={m} className="p-2 text-gray-400">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <tr key={table}>
                    <td className="p-2 font-semibold text-gray-400">{table}</td>
                    {multipliers.map(m => {
                      const key = getProblemKey(table, m)
                      const stats = statsMap.get(key)
                      const level = getMasteryLevel(stats)
                      return (
                        <td key={m} className="p-1">
                          <span title={`${key} - ${level}`}>
                            {getMasteryEmoji(level)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-4 text-sm justify-center">
            <span>🟢 Mastered</span>
            <span>🟡 Learning</span>
            <span>🔴 Needs Work</span>
            <span>⚪ Not Practiced</span>
          </div>
        </div>

        {troubleSpots.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-yellow-400">
              🎯 Focus Areas
            </h2>
            <div className="space-y-3">
              {troubleSpots.map(stats => {
                const accuracy = Math.round(
                  (stats.totalCorrect / stats.totalAttempts) * 100
                )
                return (
                  <div
                    key={stats.problemKey}
                    className="flex justify-between items-center bg-gray-700 rounded p-3"
                  >
                    <span className="font-mono text-lg">{stats.problemKey}</span>
                    <span className="text-gray-400">
                      {accuracy}% ({stats.totalAttempts} attempts)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/StatsView.tsx
git commit -m "feat: implement StatsView component"
```

---

### Task 21: Wire up App component

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx**

Replace contents of `src/App.tsx`:

```tsx
import { useState } from 'react'
import type { Profile, Screen } from './types'
import { ProfilePicker } from './components/ProfilePicker'
import { Menu } from './components/Menu'
import { Game } from './components/Game'
import { GameOver } from './components/GameOver'
import { StatsView } from './components/StatsView'

const DEFAULT_TABLES = [2, 3, 4, 5]

interface GameResult {
  score: number
  level: number
  problemsAttempted: number
  problemsCorrect: number
  troubleSpots: string[]
  isNewHighScore: boolean
}

function App() {
  const [screen, setScreen] = useState<Screen>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedTables, setSelectedTables] = useState<number[]>(DEFAULT_TABLES)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  function handleSelectProfile(p: Profile) {
    setProfile(p)
    setScreen('menu')
  }

  function handleToggleTable(table: number) {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table].sort((a, b) => a - b)
    )
  }

  function handleStartGame() {
    setGameResult(null)
    setScreen('game')
  }

  function handleGameOver(result: GameResult) {
    setGameResult(result)
    // Update profile with new high score if applicable
    if (result.isNewHighScore && profile) {
      setProfile({ ...profile, highScore: result.score })
    }
    setScreen('gameOver')
  }

  function handlePlayAgain() {
    setGameResult(null)
    setScreen('game')
  }

  if (screen === 'profile' || !profile) {
    return <ProfilePicker onSelectProfile={handleSelectProfile} />
  }

  if (screen === 'menu') {
    return (
      <Menu
        profile={profile}
        selectedTables={selectedTables}
        onToggleTable={handleToggleTable}
        onStartGame={handleStartGame}
        onViewStats={() => setScreen('stats')}
        onChangeProfile={() => setScreen('profile')}
      />
    )
  }

  if (screen === 'game') {
    return (
      <Game
        key={Date.now()} // Force remount on each game
        profile={profile}
        selectedTables={selectedTables}
        onGameOver={handleGameOver}
        onBackToMenu={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'gameOver' && gameResult) {
    return (
      <GameOver
        {...gameResult}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'stats') {
    return (
      <StatsView
        profile={profile}
        onBack={() => setScreen('menu')}
      />
    )
  }

  return null
}

export default App
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up App component with all screens"
```

---

## Phase 6: Audio Placeholders

### Task 22: Add audio placeholder

**Files:**
- Create: `src/audio/sounds.ts`

**Step 1: Create audio placeholder**

Create `src/audio/sounds.ts`:

```typescript
export type SoundEffect =
  | 'missile_launch'
  | 'explosion'
  | 'wrong_answer'
  | 'level_up'
  | 'game_over'
  | 'menu_select'

interface SoundManager {
  init(): Promise<void>
  play(sound: SoundEffect): void
  setMuted(muted: boolean): void
  isMuted(): boolean
}

// Placeholder implementation - audio not yet implemented
export const soundManager: SoundManager = {
  async init() {
    // TODO: Load audio files
  },
  play(_sound: SoundEffect) {
    // TODO: Play sound
  },
  setMuted(_muted: boolean) {
    // TODO: Store mute preference
  },
  isMuted() {
    return true // Muted by default until implemented
  }
}
```

**Step 2: Commit**

```bash
git add src/audio/sounds.ts
rm src/audio/.gitkeep
git commit -m "feat: add audio system placeholder"
```

---

## Phase 7: Final Cleanup

### Task 23: Clean up unused files

**Files:**
- Delete: `src/assets/react.svg` (if exists)
- Delete: `public/vite.svg` (if exists)
- Modify: `index.html` (update title)

**Step 1: Update index.html title**

In `index.html`, change the title:

```html
<title>Times Table Blaster</title>
```

**Step 2: Remove unused assets**

```bash
rm -f src/assets/react.svg public/vite.svg
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: clean up unused files and update title"
```

---

### Task 24: Verify the build

**Step 1: Run type check**

```bash
bunx tsc --noEmit
```

Expected: No errors

**Step 2: Run build**

```bash
bun run build
```

Expected: Build succeeds

**Step 3: Test dev server**

```bash
bun run dev
```

Expected: App loads, can create profile, start game, play

**Step 4: Commit any fixes if needed**

---

### Task 25: Final commit

**Step 1: Ensure all changes committed**

```bash
git status
```

If any uncommitted changes:

```bash
git add -A
git commit -m "chore: final cleanup"
```

---

## Summary

This plan implements:

1. **Project setup** - Vite + React + TypeScript + Tailwind + IndexedDB
2. **Data layer** - Types, database, profiles, stats storage
3. **SM-2 learning** - Spaced repetition algorithm + weighted problem selection
4. **Game engine** - Pure TypeScript game loop, collision, rendering
5. **React UI** - Profile picker, menu, game, game over, stats view
6. **Audio placeholder** - Ready for future implementation

Total: 25 tasks, each with bite-sized steps following TDD principles where applicable.
