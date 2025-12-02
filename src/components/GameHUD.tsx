interface Props {
  lives: number
  level: number
  score: number
}

export function GameHUD({ lives, level, score }: Props) {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-gray-900/80 text-white">
      <div className="text-xl">
        {Array.from({ length: lives }, (_, i) => (
          <span key={i}>❤️</span>
        ))}
        {Array.from({ length: 3 - lives }, (_, i) => (
          <span key={i} className="opacity-30">🖤</span>
        ))}
      </div>
      <div className="text-lg font-semibold">Level {level}</div>
      <div className="text-xl font-bold">{score.toLocaleString()}</div>
    </div>
  )
}
