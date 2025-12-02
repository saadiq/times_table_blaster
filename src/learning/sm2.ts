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
