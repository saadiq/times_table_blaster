import type { ProblemStats, Problem, DifficultyPhase } from '../types'
import { daysOverdue } from './sm2'
import { filterProblemsByPhase } from './difficulty'
import { BASE_WIDTH } from '../hooks/useResponsiveCanvas'
import { generateUUID } from '../utils/uuid'

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
  missedThisSession: Set<string>,
  phase: DifficultyPhase,
  correctInPhase: number
): Problem {
  // Get all possible problems for selected tables
  let allProblemKeys = generateAllProblemsForTables(selectedTables, maxMultiplier)

  // Filter by phase difficulty
  allProblemKeys = filterProblemsByPhase(
    allProblemKeys,
    phase,
    correctInPhase,
    allStats
  )

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
      missedThisSession,
      phase,
      correctInPhase
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
    id: generateUUID(),
    a: displayA,
    b: displayB,
    answer: a * b,
    x: 50 + Math.random() * (BASE_WIDTH - 100), // Random X within canvas bounds
    y: -40,
    spawnedAt: Date.now()
  }
}
