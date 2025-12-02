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
