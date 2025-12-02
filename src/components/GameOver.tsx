interface Props {
  score: number
  level: number
  problemsAttempted: number
  problemsCorrect: number
  troubleSpots: string[]
  isNewHighScore: boolean
  onPlayAgain: () => void
  onBackToMenu: () => void
}

export function GameOver({
  score,
  level,
  problemsAttempted,
  problemsCorrect,
  troubleSpots,
  isNewHighScore,
  onPlayAgain,
  onBackToMenu
}: Props) {
  const accuracy = problemsAttempted > 0
    ? Math.round((problemsCorrect / problemsAttempted) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-5xl font-bold mb-4">GAME OVER</h1>

        {isNewHighScore && (
          <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 mb-6 animate-pulse">
            <div className="text-2xl">🎉 NEW HIGH SCORE! 🎉</div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="text-5xl font-bold text-green-400 mb-2">
            {score.toLocaleString()}
          </div>
          <div className="text-gray-400">Final Score</div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <div className="text-2xl font-bold">{level}</div>
              <div className="text-sm text-gray-400">Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{problemsCorrect}</div>
              <div className="text-sm text-gray-400">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
          </div>
        </div>

        {troubleSpots.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2 text-yellow-400">
              📝 Practice These:
            </h3>
            <div className="flex flex-wrap gap-2">
              {troubleSpots.slice(0, 5).map(key => (
                <span
                  key={key}
                  className="bg-gray-700 px-3 py-1 rounded text-sm"
                >
                  {key}
                </span>
              ))}
              {troubleSpots.length > 5 && (
                <span className="text-gray-400 text-sm">
                  +{troubleSpots.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-green-600 hover:bg-green-700 rounded-lg py-4 text-xl font-bold transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg py-3 font-semibold transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}
