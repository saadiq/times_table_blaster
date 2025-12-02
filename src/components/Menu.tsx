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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🚀 Times Table Blaster</h1>
          <button
            onClick={onChangeProfile}
            className="text-gray-400 hover:text-white text-sm"
          >
            {profile.name} ▼
          </button>
        </div>

        {profile.highScore > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6 text-center">
            <div className="text-yellow-400 text-sm">🏆 High Score</div>
            <div className="text-2xl font-bold text-yellow-300">
              {profile.highScore.toLocaleString()}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Times Tables</h2>
          <div className="grid grid-cols-5 gap-2">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => onToggleTable(table)}
                className={`
                  py-3 rounded-lg font-semibold transition-colors
                  ${
                    selectedTables.includes(table)
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }
                `}
              >
                {table}×
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            {selectedTables.length === 0
              ? 'Select at least one table to start'
              : `${selectedTables.length} table${selectedTables.length === 1 ? '' : 's'} selected`}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onStartGame}
            disabled={selectedTables.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 text-xl font-bold transition-colors"
          >
            Start Game
          </button>

          <button
            onClick={onViewStats}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg py-3 font-semibold transition-colors"
          >
            📊 View Progress
          </button>
        </div>

        <div className="mt-8 bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">How to Play</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Problems fall from the sky</li>
            <li>• Type the answer and press Enter to fire</li>
            <li>• Destroy problems before they reach the bottom</li>
            <li>• You have 3 lives - don&apos;t let them run out!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
