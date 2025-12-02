import { useState, useEffect, useRef } from 'react'
import type { PhaseProgress } from '../types'
import { getPhaseDescription, getProgressToNextPhase } from '../game/phases'

interface Props {
  lives: number
  level: number
  score: number
  phaseProgress: PhaseProgress
}

// SVG Heart component for lives display
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill={filled ? '#f56565' : 'transparent'}
      stroke={filled ? '#f56565' : '#5c5690'}
      strokeWidth="2"
      className={`inline-block ${filled ? 'animate-heart-pulse drop-shadow-[0_0_8px_rgba(245,101,101,0.6)]' : 'opacity-40'}`}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

export function GameHUD({ lives, level, score, phaseProgress }: Props) {
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)
  const [isLivesShaking, setIsLivesShaking] = useState(false)
  const prevScoreRef = useRef(score)
  const prevLivesRef = useRef(lives)

  const progress = getProgressToNextPhase(phaseProgress)
  const phaseDesc = getPhaseDescription(phaseProgress.currentPhase)

  useEffect(() => {
    if (score > prevScoreRef.current) {
      setIsScoreAnimating(true)
      const timer = setTimeout(() => setIsScoreAnimating(false), 600)
      prevScoreRef.current = score
      return () => clearTimeout(timer)
    }
  }, [score])

  useEffect(() => {
    if (lives < prevLivesRef.current) {
      setIsLivesShaking(true)
      const timer = setTimeout(() => setIsLivesShaking(false), 400)
      prevLivesRef.current = lives
      return () => clearTimeout(timer)
    }
  }, [lives])

  return (
    <div className="relative">
      <div
        className={`flex justify-between items-center px-4 py-3 bg-bg-deep/90 backdrop-blur-sm border-b-2 border-primary-500/30 ${
          isLivesShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Lives */}
        <div className="flex gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} filled={i < lives} />
          ))}
        </div>

        {/* Phase indicator */}
        <div className="text-center">
          <div className="text-xs text-surface-light uppercase tracking-wider">Phase</div>
          <div className="text-2xl font-bold text-secondary-400">
            {phaseProgress.currentPhase}
          </div>
          {progress && (
            <div className="text-xs text-surface-light mt-1">
              {progress.current}/{progress.needed}
            </div>
          )}
        </div>

        {/* Level Badge */}
        <div className="level-badge text-white font-bold">
          LEVEL {level}
        </div>

        {/* Score */}
        <div
          className={`text-stat text-white min-w-[100px] text-right ${
            isScoreAnimating ? 'animate-score-pop text-warning-400' : ''
          }`}
        >
          {score.toLocaleString()}
        </div>
      </div>

      {/* Phase description bar */}
      <div className="px-4 py-1 text-xs text-center text-surface-light bg-bg-darker/50 border-b border-primary-500/20">
        {phaseDesc}
      </div>
    </div>
  )
}
