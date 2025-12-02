import type { GameState, Problem } from '../types'
import {
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
import { BASE_WIDTH, BASE_HEIGHT } from '../hooks/useResponsiveCanvas'
import { getProblemKey } from '../learning/selector'
import { createInitialPhaseProgress } from './phases'
import { createInitialPerformanceMetrics } from './performance'
import { generateUUID } from '../utils/uuid'

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
    sessionStartTime: Date.now(),
    phaseProgress: createInitialPhaseProgress(),
    performanceMetrics: createInitialPerformanceMetrics()
  }
}

export function calculateLevel(score: number): number {
  return Math.floor(score / POINTS_PER_LEVEL) + 1
}

export function updateGameState(
  state: GameState,
  scaleY: number = 1
): {
  correctHits: Array<{ problemKey: string; responseTime: number }>
  incorrectMisses: Array<{ problemKey: string; timeAlive: number }>
} {
  const correctHits: Array<{ problemKey: string; responseTime: number }> = []
  const incorrectMisses: Array<{ problemKey: string; timeAlive: number }> = []

  if (state.status !== 'playing') return { correctHits, incorrectMisses }

  // Scale fall speed proportionally so gameplay feels the same on all screen sizes
  const baseFallSpeed = getFallSpeed(state.level)
  const fallSpeed = baseFallSpeed * scaleY

  // Update problems
  for (let i = state.problems.length - 1; i >= 0; i--) {
    const problem = state.problems[i]
    problem.y += fallSpeed

    // Check if problem reached bottom (in base coordinates)
    if (problem.y > BASE_HEIGHT) {
      state.problems.splice(i, 1)
      state.lives -= 1

      // Track as incorrect
      const key = getProblemKey(problem.a, problem.b)
      const result = state.problemResults.get(key) ?? { correct: 0, incorrect: 0, times: [] }
      result.incorrect += 1
      state.problemResults.set(key, result)

      // Track miss event
      incorrectMisses.push({
        problemKey: key,
        timeAlive: Date.now() - problem.spawnedAt
      })

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

    // Remove if off screen (in base coordinates)
    if (
      missile.x < -20 ||
      missile.x > BASE_WIDTH + 20 ||
      missile.y < -20 ||
      missile.y > BASE_HEIGHT + 20
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

        // Track hit event
        correctHits.push({ problemKey: key, responseTime })

        // Add explosion
        state.explosions.push({
          id: generateUUID(),
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

  return { correctHits, incorrectMisses }
}

export function fireMissile(
  state: GameState,
  answer: number,
  launchX: number
): boolean {
  // Find a problem with this answer
  const target = state.problems.find(p => p.answer === answer)

  if (!target) {
    // Wrong answer - spawn effects (in base coordinates)
    for (let i = 0; i < 5; i++) {
      state.wrongAnswerEffects.push({
        id: generateUUID(),
        emoji: WRONG_EFFECT_EMOJIS[Math.floor(Math.random() * WRONG_EFFECT_EMOJIS.length)],
        x: Math.random() * BASE_WIDTH,
        y: BASE_HEIGHT - 100 + Math.random() * 50,
        frame: 0,
        rotation: 0
      })
    }
    return false
  }

  // Calculate intercept point (predict where target will be when missile arrives)
  const fallSpeed = getFallSpeed(state.level)
  const launchY = BASE_HEIGHT - 30

  const dx = target.x - launchX
  const dy = target.y - launchY

  // Solve quadratic equation for intercept time
  // Target moves: (tx, ty + fallSpeed*t)
  // Missile travels: MISSILE_SPEED * t
  // Equation: (MISSILE_SPEED² - fallSpeed²)t² - (2*dy*fallSpeed)t - (dx² + dy²) = 0
  const a = MISSILE_SPEED * MISSILE_SPEED - fallSpeed * fallSpeed
  const b = -2 * dy * fallSpeed
  const c = -(dx * dx + dy * dy)

  const discriminant = b * b - 4 * a * c
  const t = (-b + Math.sqrt(discriminant)) / (2 * a)

  // Calculate intercept position
  const interceptX = target.x
  const interceptY = target.y + fallSpeed * t

  // Calculate direction to intercept point
  const interceptDx = interceptX - launchX
  const interceptDy = interceptY - launchY
  const dist = Math.sqrt(interceptDx * interceptDx + interceptDy * interceptDy)
  const vx = (interceptDx / dist) * MISSILE_SPEED
  const vy = (interceptDy / dist) * MISSILE_SPEED
  const rotation = Math.atan2(interceptDy, interceptDx)

  state.missiles.push({
    id: generateUUID(),
    x: launchX,
    y: launchY,
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
