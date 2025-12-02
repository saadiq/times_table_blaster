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
