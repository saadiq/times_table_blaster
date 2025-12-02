import type { PhaseProgress, DifficultyPhase } from '../types'

const PROBLEMS_PER_PHASE = 15

export function createInitialPhaseProgress(): PhaseProgress {
  return {
    currentPhase: 1,
    correctInPhase: 0,
    totalCorrect: 0
  }
}

export function recordCorrectAnswer(progress: PhaseProgress): void {
  progress.correctInPhase += 1
  progress.totalCorrect += 1

  // Check for phase advancement
  if (shouldAdvancePhase(progress)) {
    advancePhase(progress)
  }
}

function shouldAdvancePhase(progress: PhaseProgress): boolean {
  // Advance every 15 correct problems, but not beyond phase 4
  return progress.correctInPhase >= PROBLEMS_PER_PHASE && progress.currentPhase < 4
}

function advancePhase(progress: PhaseProgress): void {
  progress.currentPhase = (progress.currentPhase + 1) as DifficultyPhase
  progress.correctInPhase = 0
}

export function getPhaseDescription(phase: DifficultyPhase): string {
  const descriptions: Record<DifficultyPhase, string> = {
    1: 'Foundation - Building confidence with easier problems',
    2: 'Gradual Challenge - Introducing harder problems',
    3: 'Full Practice - All problems, steady pace',
    4: 'Mastery - Adaptive speed based on performance'
  }
  return descriptions[phase]
}

export function getProgressToNextPhase(progress: PhaseProgress): {
  current: number
  needed: number
  percentage: number
} | null {
  if (progress.currentPhase >= 4) {
    return null  // Already at max phase
  }

  const needed = PROBLEMS_PER_PHASE
  const current = progress.correctInPhase
  const percentage = Math.min((current / needed) * 100, 100)

  return { current, needed, percentage }
}
