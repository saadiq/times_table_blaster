import { useState, useRef, useEffect, useCallback } from 'react'
import type { Profile, GameState, ProblemStats } from '../types'
import { GameCanvas } from './GameCanvas'
import type { GameCanvasHandle } from './GameCanvas'
import { GameHUD } from './GameHUD'
import {
  createInitialGameState,
  updateGameState,
  fireMissile,
  addProblem
} from '../game/engine'
import { getSpawnInterval, getMaxMultiplier, GAME_WIDTH } from '../game/constants'
import { selectProblem, getProblemKey } from '../learning/selector'
import { getProblemStats, saveProblemStatsBatch } from '../storage/stats'
import { updateProfile } from '../storage/profiles'
import { updateStats, calculateQuality, createInitialStats } from '../learning/sm2'

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

  const gameStateRef = useRef<GameState>(createInitialGameState())
  const statsMapRef = useRef<Map<string, ProblemStats>>(new Map())
  const recentlyShownRef = useRef<Set<string>>(new Set())
  const missedThisSessionRef = useRef<Set<string>>(new Set())
  const gameLoopRef = useRef<number | null>(null)
  const spawnIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hudUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<GameCanvasHandle>(null)

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

    const problem = selectProblem(
      selectedTables,
      getMaxMultiplier(state.level),
      statsMapRef.current,
      profile.id,
      recentlyShownRef.current,
      missedThisSessionRef.current
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

    const interval = getSpawnInterval(state.level)
    spawnIntervalRef.current = setTimeout(() => {
      spawnProblem()
      scheduleSpawn()
    }, interval)
  }, [spawnProblem])

  // Handle game end
  const handleGameEnd = useCallback(async () => {
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
    }

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
    // Start spawning
    spawnProblem()
    scheduleSpawn()

    // Game loop
    function loop() {
      const state = gameStateRef.current
      updateGameState(state)

      // Render to canvas
      canvasRef.current?.render(state)

      // Check for newly missed problems
      for (const [key, result] of state.problemResults) {
        if (result.incorrect > 0) {
          missedThisSessionRef.current.add(key)
        }
      }

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
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      if (spawnIntervalRef.current) clearTimeout(spawnIntervalRef.current)
      if (hudUpdateRef.current) clearInterval(hudUpdateRef.current)
    }
  }, [spawnProblem, scheduleSpawn, handleGameEnd])

  function handleFire() {
    const answer = parseInt(inputValue, 10)
    if (isNaN(answer)) return

    fireMissile(gameStateRef.current, answer, GAME_WIDTH / 2)
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFire()
    }
  }

  const state = gameStateRef.current

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="arcade-frame overflow-hidden">
        <GameHUD lives={state.lives} level={state.level} score={state.score} />
        <GameCanvas ref={canvasRef} />

        {/* Control Panel */}
        <div className="p-5 bg-bg-deep border-t-2 border-primary-500/30">
          <div className="flex gap-3">
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type answer..."
              className="game-input flex-1 px-5 py-4 text-white text-2xl"
              autoFocus
            />
            <button
              onClick={handleFire}
              className="btn-fire px-8 py-4 text-lg text-white"
            >
              FIRE! 🚀
            </button>
          </div>
          <p className="text-surface-light text-sm mt-3 text-center">
            Type the answer and press <span className="text-secondary-400 font-semibold">Enter</span> to fire!
          </p>
        </div>
      </div>

      <button
        onClick={onBackToMenu}
        className="mt-6 text-surface-light hover:text-white text-sm transition-colors"
      >
        ← Back to Menu
      </button>
    </div>
  )
}
