import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { GameState } from '../types'
import { render } from '../game/renderer'
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants'

export interface GameCanvasHandle {
  render: (state: GameState) => void
}

export const GameCanvas = forwardRef<GameCanvasHandle>(function GameCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    ctxRef.current = canvas.getContext('2d')
  }, [])

  useImperativeHandle(ref, () => ({
    render: (state: GameState) => {
      if (ctxRef.current) {
        render(ctxRef.current, state)
      }
    }
  }))

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block"
    />
  )
})
