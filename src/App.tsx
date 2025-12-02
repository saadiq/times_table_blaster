import { useState } from 'react'
import type { Profile, Screen } from './types'
import { ProfilePicker } from './components/ProfilePicker'
import { Menu } from './components/Menu'
import { Game } from './components/Game'
import { GameOver } from './components/GameOver'
import { StatsView } from './components/StatsView'

const DEFAULT_TABLES = [2, 3, 4, 5]

interface GameResult {
  score: number
  level: number
  problemsAttempted: number
  problemsCorrect: number
  troubleSpots: string[]
  isNewHighScore: boolean
}

function App() {
  const [screen, setScreen] = useState<Screen>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedTables, setSelectedTables] = useState<number[]>(DEFAULT_TABLES)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  function handleSelectProfile(p: Profile) {
    setProfile(p)
    setScreen('menu')
  }

  function handleToggleTable(table: number) {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table].sort((a, b) => a - b)
    )
  }

  function handleStartGame() {
    setGameResult(null)
    setScreen('game')
  }

  function handleGameOver(result: GameResult) {
    setGameResult(result)
    // Update profile with new high score if applicable
    if (result.isNewHighScore && profile) {
      setProfile({ ...profile, highScore: result.score })
    }
    setScreen('gameOver')
  }

  function handlePlayAgain() {
    setGameResult(null)
    setScreen('game')
  }

  if (screen === 'profile' || !profile) {
    return <ProfilePicker onSelectProfile={handleSelectProfile} />
  }

  if (screen === 'menu') {
    return (
      <Menu
        profile={profile}
        selectedTables={selectedTables}
        onToggleTable={handleToggleTable}
        onStartGame={handleStartGame}
        onViewStats={() => setScreen('stats')}
        onChangeProfile={() => setScreen('profile')}
      />
    )
  }

  if (screen === 'game') {
    return (
      <Game
        key={Date.now()} // Force remount on each game
        profile={profile}
        selectedTables={selectedTables}
        onGameOver={handleGameOver}
        onBackToMenu={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'gameOver' && gameResult) {
    return (
      <GameOver
        {...gameResult}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'stats') {
    return (
      <StatsView
        profile={profile}
        onBack={() => setScreen('menu')}
      />
    )
  }

  return null
}

export default App
