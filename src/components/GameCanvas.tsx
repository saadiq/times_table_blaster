import { useRef, useEffect } from 'react'
import type { GameState } from '../types'
import { render } from '../game/renderer'
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants'

interface Props {
  gameState: GameState
}

export function GameCanvas({ gameState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    render(ctx, gameState)
  }, [gameState])

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block"
    />
  )
}
