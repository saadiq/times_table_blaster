import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { GameState } from '../types'
import { render } from '../game/renderer'

interface Props {
  width: number
  height: number
  scaleX: number
  scaleY: number
}

export interface GameCanvasHandle {
  render: (state: GameState) => void
}

export const GameCanvas = forwardRef<GameCanvasHandle, Props>(
  function GameCanvas({ width, height, scaleX, scaleY }, ref) {
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
          render(ctxRef.current, state, { width, height, scaleX, scaleY })
        }
      }
    }))

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
      />
    )
  }
)
