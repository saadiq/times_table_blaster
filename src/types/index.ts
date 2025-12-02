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

// Phase system types
export type DifficultyPhase = 1 | 2 | 3 | 4

export interface PhaseProgress {
  currentPhase: DifficultyPhase
  correctInPhase: number  // Resets on phase advance
  totalCorrect: number    // Cumulative across all phases
}

export interface PerformanceMetrics {
  recentResults: Array<{
    correct: boolean
    responseTime: number
    timestamp: number
  }>  // Max 10 items (rolling window)
  currentSpeedMultiplier: number  // Smooth transition value
  targetSpeedMultiplier: number   // Based on performance score
}

export interface ProblemDifficulty {
  problemKey: string
  tableScore: number
  productScore: number
  sm2Score: number
  totalScore: number
  isEasy: boolean  // score ≤ 0.4
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
  phaseProgress: PhaseProgress
  performanceMetrics: PerformanceMetrics
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
