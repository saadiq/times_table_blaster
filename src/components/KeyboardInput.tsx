interface Props {
  value: string
  onChange: (value: string) => void
  onFire: () => void
}

export function KeyboardInput({ value, onChange, onFire }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onFire()
    }
  }

  return (
    <div className="keyboard-input flex gap-3 p-4 bg-bg-deep border-t border-primary-500/30">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type answer..."
        className="game-input flex-1 px-5 py-4 text-white text-2xl rounded-lg"
        autoFocus
      />
      <button
        type="button"
        onClick={onFire}
        className="btn-fire px-8 py-4 text-xl font-bold rounded-lg"
      >
        FIRE!
      </button>
    </div>
  )
}
