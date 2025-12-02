import { useState, Component, type ReactNode } from 'react'
import type { Profile, Screen } from './types'
import { ProfilePicker } from './components/ProfilePicker'
import { Menu } from './components/Menu'
import { Game } from './components/Game'
import { GameOver } from './components/GameOver'
import { StatsView } from './components/StatsView'
import { Footer } from './components/Footer'

// Error boundary to catch Game component crashes
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface GameWrapperProps {
  profile: Profile
  selectedTables: number[]
  onGameOver: (result: GameResult) => void
  onBackToMenu: () => void
}

class GameWrapper extends Component<GameWrapperProps, ErrorBoundaryState> {
  constructor(props: GameWrapperProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Game crashed:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#1a1a2e',
          color: 'white',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h1 style={{ color: 'red', marginBottom: '20px' }}>Game Crashed!</h1>
          <p style={{ marginBottom: '10px' }}>Error: {this.state.error?.message}</p>
          <pre style={{
            background: '#000',
            padding: '10px',
            borderRadius: '5px',
            maxWidth: '100%',
            overflow: 'auto',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={this.props.onBackToMenu}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Back to Menu
          </button>
        </div>
      )
    }

    return (
      <Game
        key={Date.now()}
        profile={this.props.profile}
        selectedTables={this.props.selectedTables}
        onGameOver={this.props.onGameOver}
        onBackToMenu={this.props.onBackToMenu}
      />
    )
  }
}

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

  return (
    <>
      {screen === 'profile' || !profile ? (
        <ProfilePicker onSelectProfile={handleSelectProfile} />
      ) : screen === 'menu' ? (
        <Menu
          profile={profile}
          selectedTables={selectedTables}
          onToggleTable={handleToggleTable}
          onStartGame={handleStartGame}
          onViewStats={() => setScreen('stats')}
          onChangeProfile={() => setScreen('profile')}
        />
      ) : screen === 'game' ? (
        <GameWrapper
          profile={profile}
          selectedTables={selectedTables}
          onGameOver={handleGameOver}
          onBackToMenu={() => setScreen('menu')}
        />
      ) : screen === 'gameOver' && gameResult ? (
        <GameOver
          {...gameResult}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={() => setScreen('menu')}
        />
      ) : screen === 'stats' ? (
        <StatsView
          profile={profile}
          onBack={() => setScreen('menu')}
        />
      ) : null}
      {/* Hide footer during gameplay to prevent accidental clicks */}
      {screen !== 'game' && <Footer />}
    </>
  )
}

export default App
