// Google Analytics event tracking utility

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type EventParams = Record<string, string | number | boolean | undefined>

export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

// Game events
export function trackGameStart(tables: number[], profileName: string): void {
  trackEvent('game_start', {
    tables: tables.join(','),
    table_count: tables.length,
    profile_name: profileName,
  })
}

export function trackGameEnd(data: {
  score: number
  level: number
  problemsAttempted: number
  problemsCorrect: number
  duration: number
  isNewHighScore: boolean
}): void {
  trackEvent('game_end', {
    score: data.score,
    level: data.level,
    problems_attempted: data.problemsAttempted,
    problems_correct: data.problemsCorrect,
    accuracy: data.problemsAttempted > 0
      ? Math.round((data.problemsCorrect / data.problemsAttempted) * 100)
      : 0,
    duration_seconds: Math.round(data.duration / 1000),
    is_new_high_score: data.isNewHighScore,
  })
}

export function trackLevelUp(level: number, score: number): void {
  trackEvent('level_up', {
    level,
    score,
  })
}

export function trackProfileCreated(profileName: string): void {
  trackEvent('profile_created', {
    profile_name: profileName,
  })
}

export function trackNewHighScore(score: number, previousHighScore: number): void {
  trackEvent('new_high_score', {
    score,
    previous_high_score: previousHighScore,
    improvement: score - previousHighScore,
  })
}
