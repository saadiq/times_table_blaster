interface Props {
  value: string
  onDigit: (digit: string) => void
  onFire: () => void
  onClear: () => void
}

export function NumberPad({ value, onDigit, onFire, onClear }: Props) {
  return (
    <div className="number-pad bg-bg-deep border-t border-primary-500/30">
      {/* Answer Display */}
      <div className="answer-display text-center text-3xl font-mono font-bold py-3 bg-bg-darker/50 text-white min-h-[52px]">
        {value || <span className="text-gray-600">—</span>}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {/* Row 1: 1-2-3 */}
        <PadButton digit="1" onPress={onDigit} />
        <PadButton digit="2" onPress={onDigit} />
        <PadButton digit="3" onPress={onDigit} />

        {/* Row 2: 4-5-6 */}
        <PadButton digit="4" onPress={onDigit} />
        <PadButton digit="5" onPress={onDigit} />
        <PadButton digit="6" onPress={onDigit} />

        {/* Row 3: 7-8-9 */}
        <PadButton digit="7" onPress={onDigit} />
        <PadButton digit="8" onPress={onDigit} />
        <PadButton digit="9" onPress={onDigit} />

        {/* Row 4: Clear-0-Fire */}
        <button
          type="button"
          onClick={onClear}
          className="pad-button pad-button-clear text-2xl font-bold"
        >
          C
        </button>
        <PadButton digit="0" onPress={onDigit} />
        <button
          type="button"
          onClick={onFire}
          className="pad-button pad-button-fire text-2xl"
        >
          🚀
        </button>
      </div>
    </div>
  )
}

function PadButton({
  digit,
  onPress,
}: {
  digit: string
  onPress: (d: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPress(digit)}
      className="pad-button text-3xl font-bold"
    >
      {digit}
    </button>
  )
}
