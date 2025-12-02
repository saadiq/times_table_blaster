import type { ProblemStats, ProblemDifficulty, DifficultyPhase } from '../types'

// Calculate table difficulty score (0-1) based on max factor
export function calculateTableScore(a: number, b: number): number {
  const max = Math.max(a, b)

  if (max <= 2) return 0.0
  if (max <= 4) return 0.2
  if (max <= 7) return 0.5
  if (max <= 9) return 0.8
  return 1.0
}

// Calculate product difficulty score (0-1) based on result magnitude
export function calculateProductScore(product: number): number {
  if (product <= 20) return 0.0
  if (product <= 40) return 0.3
  if (product <= 60) return 0.5
  if (product <= 80) return 0.7
  return 1.0
}

// Calculate SM-2 difficulty score (0-1) based on easiness factor
export function calculateSM2Score(stats: ProblemStats | null): number {
  if (!stats) return 0.3  // Neutral baseline for new problems

  const easiness = stats.easiness
  if (easiness >= 2.5) return 0.0
  if (easiness >= 2.0) return 0.3
  if (easiness >= 1.5) return 0.6
  return 1.0
}

// Classify a problem's difficulty
export function classifyProblemDifficulty(
  problemKey: string,
  stats: ProblemStats | null
): ProblemDifficulty {
  const [a, b] = problemKey.split('×').map(Number)
  const product = a * b

  const tableScore = calculateTableScore(a, b)
  const productScore = calculateProductScore(product)
  const sm2Score = calculateSM2Score(stats)

  // Weighted combination: SM-2 (40%), Table (30%), Product (30%)
  const totalScore = (tableScore * 0.3) + (productScore * 0.3) + (sm2Score * 0.4)

  return {
    problemKey,
    tableScore,
    productScore,
    sm2Score,
    totalScore,
    isEasy: totalScore <= 0.4
  }
}

// Get hard problem probability for Phase 2 based on correct count
function getHardProblemProbability(correctInPhase: number): number {
  if (correctInPhase < 10) return 0.1   // 0-9 correct: 10% hard
  if (correctInPhase < 20) return 0.5   // 10-19 correct: 50% hard
  return 1.0                             // 20+ correct: 100% hard
}

// Filter problems by difficulty for current phase
export function filterProblemsByPhase(
  allProblemKeys: string[],
  phase: DifficultyPhase,
  correctInPhase: number,
  statsMap: Map<string, ProblemStats>
): string[] {
  // Phase 1: Only easy problems
  if (phase === 1) {
    const easyProblems = allProblemKeys.filter(key => {
      const difficulty = classifyProblemDifficulty(key, statsMap.get(key) ?? null)
      return difficulty.isEasy
    })

    // Ensure we have at least some problems (fallback if all are hard)
    return easyProblems.length >= 5 ? easyProblems : allProblemKeys
  }

  // Phase 2: Gradual introduction of hard problems
  if (phase === 2) {
    const hardProbability = getHardProblemProbability(correctInPhase)

    return allProblemKeys.filter(key => {
      const difficulty = classifyProblemDifficulty(key, statsMap.get(key) ?? null)

      // Always include easy problems
      if (difficulty.isEasy) return true

      // Randomly include hard problems based on probability
      return Math.random() < hardProbability
    })
  }

  // Phase 3 & 4: All problems available
  return allProblemKeys
}
