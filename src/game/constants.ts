// Game dimensions
export const GAME_WIDTH = 900
export const GAME_HEIGHT = 700

// Gameplay
export const INITIAL_LIVES = 3
export const POINTS_PER_DESTROY = 10
export const POINTS_PER_LEVEL = 100

// Phase system
export const PROBLEMS_PER_PHASE = 15
export const PHASE_1_FALL_SPEED = 0.15
export const PHASE_1_SPAWN_INTERVAL = 2500
export const PERFORMANCE_WINDOW_SIZE = 10
export const PERFORMANCE_MIN_SAMPLES = 5
export const EXCELLENT_THRESHOLD = 0.85
export const GOOD_THRESHOLD = 0.70
export const ADEQUATE_THRESHOLD = 0.55

// Difficulty scaling
// @deprecated - Use getPhaseBasedSpeed from performance.ts instead
export function getFallSpeed(level: number): number {
  return 0.15 + level * 0.075
}

// @deprecated - Use getPhaseBasedSpeed from performance.ts instead
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
