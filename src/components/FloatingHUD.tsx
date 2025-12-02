import { useState, useEffect, useRef } from 'react'
import type { PhaseProgress } from '../types'
import { getPhaseDescription } from '../game/phases'

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
      width="24"
      height="24"
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

export function FloatingHUD({ lives, level, score, phaseProgress }: Props) {
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)
  const [isLivesShaking, setIsLivesShaking] = useState(false)
  const prevScoreRef = useRef(score)
  const prevLivesRef = useRef(lives)

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
    <div className="floating-hud absolute inset-0 pointer-events-none z-10">
      {/* Lives - Top Left */}
      <div
        className={`absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 ${
          isLivesShaking ? 'animate-shake' : ''
        }`}
      >
        <div className="flex gap-0.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} filled={i < lives} />
          ))}
        </div>
      </div>

      {/* Level & Phase - Top Center */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-1.5 text-center">
        <div className="text-sm font-bold text-secondary-400">
          Level {level}
        </div>
        <div className="text-xs text-gray-400 max-w-[150px] truncate">
          {phaseDesc}
        </div>
      </div>

      {/* Score - Top Right */}
      <div
        className={`absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 ${
          isScoreAnimating ? 'animate-score-pop' : ''
        }`}
      >
        <div
          className={`text-lg font-mono font-bold ${
            isScoreAnimating ? 'text-warning-400' : 'text-white'
          }`}
        >
          {score.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
