import { useState } from 'react'
import type { Profile } from '../types'

interface Props {
  profile: Profile
  selectedTables: number[]
  onToggleTable: (table: number) => void
  onStartGame: () => void
  onViewStats: () => void
  onChangeProfile: () => void
}

export function Menu({
  profile,
  selectedTables,
  onToggleTable,
  onStartGame,
  onViewStats,
  onChangeProfile
}: Props) {
  const tables = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const [justToggled, setJustToggled] = useState<number | null>(null)

  function handleToggle(table: number) {
    setJustToggled(table)
    setTimeout(() => setJustToggled(null), 400)
    onToggleTable(table)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl arcade-frame p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-heading text-primary-300">
            <span className="inline-block animate-float">🚀</span> Times Table Blaster
          </h1>
          <button
            onClick={onChangeProfile}
            className="glass-card px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">👨‍🚀</span>
            <span>{profile.name}</span>
            <span className="text-surface-light">▼</span>
          </button>
        </div>

        {/* High Score Trophy Card */}
        {profile.highScore > 0 && (
          <div className="trophy-card p-4 mb-6 text-center animate-slide-down">
            <div className="flex items-center justify-center gap-2 text-bg-dark">
              <span className="text-2xl animate-float">🏆</span>
              <span className="font-semibold">HIGH SCORE</span>
            </div>
            <div className="text-stat text-bg-dark mt-1">
              {profile.highScore.toLocaleString()}
            </div>
          </div>
        )}

        {/* Table Selector */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-subheading text-center mb-4">Select Your Tables</h2>
          <div className="grid grid-cols-5 gap-3 justify-items-center">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => handleToggle(table)}
                className={`
                  btn-table
                  ${justToggled === table ? 'animate-jelly' : ''}
                  ${selectedTables.includes(table) ? 'btn-table-selected' : 'btn-table-unselected'}
                `}
              >
                {table}×
              </button>
            ))}
          </div>
          <p className="text-sm text-center mt-4 text-surface-light">
            {selectedTables.length === 0 ? (
              <span className="text-accent-400">Select at least one table to start</span>
            ) : (
              <span className="text-secondary-300">
                {selectedTables.length} table{selectedTables.length === 1 ? '' : 's'} selected
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={onStartGame}
            disabled={selectedTables.length === 0}
            className={`
              w-full btn-launch py-5 text-xl text-white
              ${selectedTables.length > 0 ? 'animate-pulse-glow' : ''}
            `}
          >
            🚀 LAUNCH MISSION
          </button>

          <button
            onClick={onViewStats}
            className="w-full btn-secondary py-4 text-white"
          >
            📊 View Progress
          </button>
        </div>

        {/* How to Play */}
        <div className="mt-8 glass-card p-5">
          <h3 className="text-subheading mb-3 text-secondary-300">How to Play</h3>
          <ul className="text-sm text-surface-light space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              <span>Problems fall from the sky</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              <span>Type the answer and press Enter to fire</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              <span>Destroy problems before they reach the bottom</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              <span>You have 3 lives - don&apos;t let them run out!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
