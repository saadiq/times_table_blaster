import type { PerformanceMetrics, DifficultyPhase } from '../types'

export function createInitialPerformanceMetrics(): PerformanceMetrics {
  return {
    recentResults: [],
    currentSpeedMultiplier: 1.0,
    targetSpeedMultiplier: 1.0
  }
}

export function addPerformanceResult(
  metrics: PerformanceMetrics,
  correct: boolean,
  responseTime: number
): void {
  metrics.recentResults.push({
    correct,
    responseTime,
    timestamp: Date.now()
  })

  // Keep only last 10 results (rolling window)
  if (metrics.recentResults.length > 10) {
    metrics.recentResults.shift()
  }

  // Recalculate target multiplier
  metrics.targetSpeedMultiplier = calculateTargetSpeedMultiplier(metrics.recentResults)
}

export function calculateTargetSpeedMultiplier(
  results: Array<{ correct: boolean; responseTime: number }>
): number {
  // Need minimum samples for reliable calculation
  if (results.length < 5) {
    return 1.0  // Not enough data, use baseline
  }

  // Calculate accuracy rate
  const correct = results.filter(r => r.correct).length
  const accuracy = correct / results.length

  // Calculate normalized average response time
  const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  const normalizedTime = Math.min(avgTime / 10000, 1.0)  // 10s = 1.0 (very slow)

  // Performance score: accuracy (60%) + speed (40%)
  const performanceScore = (accuracy * 0.6) + ((1 - normalizedTime) * 0.4)

  // Map performance score to speed multiplier
  if (performanceScore >= 0.85) return 1.5   // Excellent
  if (performanceScore >= 0.70) return 1.25  // Good
  if (performanceScore >= 0.55) return 1.0   // Adequate
  return 0.8  // Struggling - slow down
}

export function updateSpeedMultiplier(metrics: PerformanceMetrics): void {
  const diff = metrics.targetSpeedMultiplier - metrics.currentSpeedMultiplier

  // Smooth transition: move 5% toward target each update
  metrics.currentSpeedMultiplier += diff * 0.05

  // Clamp to reasonable bounds
  metrics.currentSpeedMultiplier = Math.max(0.5, Math.min(2.0, metrics.currentSpeedMultiplier))
}

export function getPhaseBasedSpeed(
  phase: DifficultyPhase,
  metrics: PerformanceMetrics
): { fallSpeed: number; spawnInterval: number } {
  // Phases 1-3: Fixed slow speed
  if (phase < 4) {
    return {
      fallSpeed: 0.15,
      spawnInterval: 2500
    }
  }

  // Phase 4: Performance adaptive
  const multiplier = metrics.currentSpeedMultiplier
  return {
    fallSpeed: 0.15 * multiplier,
    spawnInterval: Math.round(2500 / multiplier)
  }
}
