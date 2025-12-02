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
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 ${
      isNewHighScore ? 'bg-victory-gradient' : ''
    }`}>
      <div className="w-full max-w-md text-center">
        {/* Title */}
        <h1 className="text-title text-white mb-4 animate-bounce-in drop-shadow-lg">
          {isNewHighScore ? '🏆 NEW HIGH SCORE! 🏆' : 'MISSION COMPLETE'}
        </h1>

        {isNewHighScore && (
          <p className="text-white/80 mb-6 animate-slide-up">
            Amazing work, pilot!
          </p>
        )}

        {!isNewHighScore && (
          <p className="text-surface-light mb-6 animate-slide-up">
            Great effort, pilot!
          </p>
        )}

        {/* Score Card */}
        <div className="glass-card p-6 mb-6 animate-slide-up">
          <div className="text-score text-success-400 mb-2 animate-bounce-in">
            {score.toLocaleString()}
          </div>
          <div className="text-surface-light">Final Score</div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="stagger-1">
              <div className="text-stat text-white">{level}</div>
              <div className="text-sm text-surface-light">Level</div>
            </div>
            <div className="stagger-2">
              <div className="text-stat text-white">{problemsCorrect}</div>
              <div className="text-sm text-surface-light">Correct</div>
            </div>
            <div className="stagger-3">
              <div className="text-stat text-white">{accuracy}%</div>
              <div className="text-sm text-surface-light">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Trouble Spots */}
        {troubleSpots.length > 0 && (
          <div className="glass-card p-5 mb-6 text-left stagger-4">
            <h3 className="text-subheading mb-3 text-warning-400">
              🎯 Practice These:
            </h3>
            <div className="flex flex-wrap gap-2">
              {troubleSpots.slice(0, 5).map(key => (
                <span
                  key={key}
                  className="bg-warning-500/20 border border-warning-500/30 px-4 py-2 rounded-lg text-sm text-warning-300 font-medium"
                >
                  {key}
                </span>
              ))}
              {troubleSpots.length > 5 && (
                <span className="text-surface-light text-sm self-center">
                  +{troubleSpots.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 stagger-5">
          <button
            onClick={onPlayAgain}
            className="w-full btn-launch py-5 text-xl text-white"
          >
            🚀 Play Again
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full btn-secondary py-4 text-white"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}
