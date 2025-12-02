import { useState, useRef, useEffect, useCallback } from 'react'
import type { Profile, GameState, ProblemStats } from '../types'
import { GameCanvas } from './GameCanvas'
import type { GameCanvasHandle } from './GameCanvas'
import { FloatingHUD } from './FloatingHUD'
import { NumberPad } from './NumberPad'
import { KeyboardInput } from './KeyboardInput'
import {
  createInitialGameState,
  updateGameState,
  fireMissile,
  addProblem
} from '../game/engine'
import { getMaxMultiplier } from '../game/constants'
import { useResponsiveCanvas, BASE_WIDTH } from '../hooks/useResponsiveCanvas'
import { selectProblem, getProblemKey } from '../learning/selector'
import { getProblemStats, saveProblemStatsBatch } from '../storage/stats'
import { updateProfile } from '../storage/profiles'
import { updateStats, calculateQuality, createInitialStats } from '../learning/sm2'
import { getPhaseBasedSpeed, updateSpeedMultiplier, addPerformanceResult } from '../game/performance'
import { recordCorrectAnswer, getPhaseDescription } from '../game/phases'
import { trackGameStart, trackGameEnd, trackNewHighScore } from '../utils/analytics'

interface Props {
  profile: Profile
  selectedTables: number[]
  onGameOver: (result: {
    score: number
    level: number
    problemsAttempted: number
    problemsCorrect: number
    troubleSpots: string[]
    isNewHighScore: boolean
  }) => void
  onBackToMenu: () => void
}

export function Game({ profile, selectedTables, onGameOver, onBackToMenu }: Props) {
  const [, setRenderTick] = useState(0)
  const [inputValue, setInputValue] = useState('')

  // Get responsive canvas dimensions
  const { width, height, scaleX, scaleY, isMobile } = useResponsiveCanvas()

  const gameStateRef = useRef<GameState>(createInitialGameState())
  const statsMapRef = useRef<Map<string, ProblemStats>>(new Map())
  const recentlyShownRef = useRef<Set<string>>(new Set())
  const missedThisSessionRef = useRef<Set<string>>(new Set())
  const gameLoopRef = useRef<number | null>(null)
  const spawnIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hudUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<GameCanvasHandle>(null)
  const mountedRef = useRef(true)
  const gameStartTimeRef = useRef<number>(Date.now())

  // Load stats on mount
  useEffect(() => {
    async function loadStats() {
      const stats = await getProblemStats(profile.id)
      const map = new Map<string, ProblemStats>()
      for (const s of stats) {
        map.set(s.problemKey, s)
      }
      statsMapRef.current = map
    }
    loadStats()
  }, [profile.id])

  // Spawn problems
  const spawnProblem = useCallback(() => {
    const state = gameStateRef.current
    if (state.status !== 'playing') return

    const { currentPhase, correctInPhase } = state.phaseProgress

    const problem = selectProblem(
      selectedTables,
      getMaxMultiplier(state.level),
      statsMapRef.current,
      profile.id,
      recentlyShownRef.current,
      missedThisSessionRef.current,
      currentPhase,
      correctInPhase
    )

    // Track as recently shown
    const key = getProblemKey(problem.a, problem.b)
    recentlyShownRef.current.add(key)
    if (recentlyShownRef.current.size > 5) {
      const first = recentlyShownRef.current.values().next().value
      if (first) recentlyShownRef.current.delete(first)
    }

    addProblem(state, problem)
  }, [selectedTables, profile.id])

  // Schedule next spawn
  const scheduleSpawn = useCallback(() => {
    const state = gameStateRef.current
    if (state.status !== 'playing') return

    const { currentPhase } = state.phaseProgress
    const { spawnInterval } = getPhaseBasedSpeed(currentPhase, state.performanceMetrics)

    spawnIntervalRef.current = setTimeout(() => {
      spawnProblem()
      scheduleSpawn()
    }, spawnInterval)
  }, [spawnProblem])

  // Handle game end
  const handleGameEnd = useCallback(async () => {
    if (!mountedRef.current) return

    if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current)
    if (hudUpdateRef.current) clearInterval(hudUpdateRef.current)

    const state = gameStateRef.current
    const statsMap = statsMapRef.current

    // Update SM-2 stats for all problems encountered
    const updatedStats: ProblemStats[] = []
    let problemsAttempted = 0
    let problemsCorrect = 0
    const troubleSpots: string[] = []

    for (const [key, result] of state.problemResults) {
      problemsAttempted += result.correct + result.incorrect

      if (result.correct > 0) {
        problemsCorrect += result.correct
        const avgTime = result.times.reduce((a, b) => a + b, 0) / result.times.length
        const quality = calculateQuality(true, avgTime)

        let stats = statsMap.get(key) ?? createInitialStats(profile.id, key)
        stats = updateStats(stats, quality, avgTime)
        updatedStats.push(stats)
      }

      if (result.incorrect > 0) {
        troubleSpots.push(key)
        let stats = statsMap.get(key) ?? createInitialStats(profile.id, key)
        stats = updateStats(stats, 1, 10000) // quality 1 for incorrect
        updatedStats.push(stats)
      }
    }

    // Save stats
    if (updatedStats.length > 0) {
      await saveProblemStatsBatch(updatedStats)
    }

    // Update high score if needed
    const isNewHighScore = state.score > profile.highScore
    if (isNewHighScore) {
      await updateProfile({ ...profile, highScore: state.score })
      trackNewHighScore(state.score, profile.highScore)
    }

    // Track game end
    const duration = Date.now() - gameStartTimeRef.current
    trackGameEnd({
      score: state.score,
      level: state.level,
      problemsAttempted,
      problemsCorrect,
      duration,
      isNewHighScore,
    })

    onGameOver({
      score: state.score,
      level: state.level,
      problemsAttempted,
      problemsCorrect,
      troubleSpots,
      isNewHighScore
    })
  }, [profile, onGameOver])

  // Game loop
  useEffect(() => {
    // Track game start
    gameStartTimeRef.current = Date.now()
    trackGameStart(selectedTables, profile.name)

    // Spawn initial problems immediately so screen isn't empty
    spawnProblem()
    // Add a second problem after a short delay for variety
    setTimeout(() => spawnProblem(), 300)
    scheduleSpawn()

    // Game loop
    function loop() {
      const state = gameStateRef.current

      // Update speed multiplier smoothly every frame
      updateSpeedMultiplier(state.performanceMetrics)

      // Update game state with scaleY for proportional fall speed
      const events = updateGameState(state, scaleY)

      // Process correct hits
      for (const { responseTime } of events.correctHits) {
        recordCorrectAnswer(state.phaseProgress)
        addPerformanceResult(state.performanceMetrics, true, responseTime)
      }

      // Process incorrect misses
      for (const { problemKey, timeAlive } of events.incorrectMisses) {
        missedThisSessionRef.current.add(problemKey)
        addPerformanceResult(state.performanceMetrics, false, timeAlive)
      }

      // Render to canvas
      canvasRef.current?.render(state)

      // Check game over
      if (state.status === 'ended') {
        handleGameEnd()
        return
      }

      gameLoopRef.current = requestAnimationFrame(loop)
    }

    gameLoopRef.current = requestAnimationFrame(loop)

    // HUD update (10fps)
    hudUpdateRef.current = setInterval(() => {
      setRenderTick(t => t + 1)
    }, 100)

    return () => {
      mountedRef.current = false
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current)
      if (hudUpdateRef.current) clearInterval(hudUpdateRef.current)
    }
  }, [spawnProblem, scheduleSpawn, handleGameEnd, scaleY])

  // Fire missile at center of canvas (in base coordinates)
  function handleFire() {
    const answer = parseInt(inputValue, 10)
    if (isNaN(answer)) return

    fireMissile(gameStateRef.current, answer, BASE_WIDTH / 2)
    setInputValue('')
  }

  // NumberPad handlers
  function handleDigit(digit: string) {
    setInputValue(prev => {
      if (prev.length >= 3) return prev // Max 3 digits (answers up to 144)
      return prev + digit
    })
  }

  function handleClear() {
    setInputValue('')
  }

  const state = gameStateRef.current

  // Don't render until we have valid dimensions
  if (width === 0 || height === 0) {
    return (
      <div className="game-container fixed inset-0 flex items-center justify-center bg-bg-deep">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="game-container fixed inset-0 flex flex-col bg-bg-deep overflow-hidden">
      {/* Mobile HUD - separate row above canvas */}
      {isMobile && (
        <div className="flex-shrink-0 px-2 py-2 flex items-center justify-between gap-2" style={{ paddingTop: 'env(safe-area-inset-top, 8px)' }}>
          {/* Lives */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }, (_, i) => (
                <svg
                  key={i}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={i < state.lives ? '#f56565' : 'transparent'}
                  stroke={i < state.lives ? '#f56565' : '#5c5690'}
                  strokeWidth="2"
                  className={i < state.lives ? 'drop-shadow-[0_0_6px_rgba(245,101,101,0.6)]' : 'opacity-40'}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ))}
            </div>
          </div>

          {/* Level & Phase */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-center flex-1 max-w-[160px]">
            <div className="text-xs font-bold text-secondary-400">Level {state.level}</div>
            <div className="text-[10px] text-gray-400 truncate">
              {getPhaseDescription(state.phaseProgress.currentPhase)}
            </div>
          </div>

          {/* Score */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <div className="text-base font-mono font-bold text-white">
              {state.score.toLocaleString()}
            </div>
          </div>

          {/* Exit button */}
          <button
            onClick={onBackToMenu}
            className="bg-black/50 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-surface-light active:bg-black/70"
            aria-label="Exit game"
          >
            ✕
          </button>
        </div>
      )}

      {/* Canvas Container */}
      <div
        className="relative flex-1 flex items-center justify-center min-h-0 overflow-hidden"
        style={!isMobile ? { maxWidth: `${width}px`, margin: '0 auto' } : undefined}
      >
        <div className="relative">
          <GameCanvas
            ref={canvasRef}
            width={width}
            height={height}
            scaleX={scaleX}
            scaleY={scaleY}
          />
          {/* Desktop HUD - overlaid on canvas */}
          {!isMobile && (
            <FloatingHUD
              lives={state.lives}
              level={state.level}
              score={state.score}
              phaseProgress={state.phaseProgress}
            />
          )}
        </div>
      </div>

      {/* Input Controls - NumberPad on mobile, Keyboard on desktop */}
      {isMobile ? (
        <NumberPad
          value={inputValue}
          onDigit={handleDigit}
          onFire={handleFire}
          onClear={handleClear}
        />
      ) : (
        <div className="max-w-[1200px] mx-auto w-full">
          <KeyboardInput
            value={inputValue}
            onChange={setInputValue}
            onFire={handleFire}
          />
        </div>
      )}

      {/* Back/Pause button - positioned relative to canvas on mobile */}
      {!isMobile && (
        <button
          onClick={onBackToMenu}
          className="absolute top-4 left-4 text-surface-light hover:text-white text-sm transition-colors z-20"
        >
          ← Back to Menu
        </button>
      )}
    </div>
  )
}
