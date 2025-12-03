import type { GameState } from '../types'
import {
  STAR_COUNT,
  EXPLOSION_FRAMES,
  WRONG_EFFECT_FRAMES
} from './constants'

interface RenderContext {
  width: number
  height: number
  scaleX: number
  scaleY: number
}

// Star positions stored in base coordinates (0-1 normalized)
const stars: { x: number; y: number; size: number; twinkleOffset: number }[] = []

// Cached gradients - recreated only when dimensions change
let cachedBgGradient: CanvasGradient | null = null
let cachedBgHeight = 0
let cachedBgCtx: CanvasRenderingContext2D | null = null

function initStars(): void {
  if (stars.length > 0) return
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random(), // Normalized 0-1
      y: Math.random(), // Normalized 0-1
      size: Math.random() * 2 + 1,
      twinkleOffset: Math.random() * Math.PI * 2
    })
  }
}

function getBackgroundGradient(ctx: CanvasRenderingContext2D, height: number): CanvasGradient {
  // Only recreate gradient if height changed or context changed
  if (cachedBgGradient && cachedBgHeight === height && cachedBgCtx === ctx) {
    return cachedBgGradient
  }

  cachedBgGradient = ctx.createLinearGradient(0, 0, 0, height)
  cachedBgGradient.addColorStop(0, '#0f0c29')
  cachedBgGradient.addColorStop(0.5, '#302b63')
  cachedBgGradient.addColorStop(1, '#24243e')
  cachedBgHeight = height
  cachedBgCtx = ctx

  return cachedBgGradient
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dimensions: RenderContext
): void {
  initStars()

  const { width, height, scaleX, scaleY } = dimensions

  // Clear and draw background (using cached gradient)
  ctx.fillStyle = getBackgroundGradient(ctx, height)
  ctx.fillRect(0, 0, width, height)

  // Draw stars (scaled from normalized coordinates)
  const time = Date.now() / 1000
  for (const star of stars) {
    const twinkle = Math.sin(time * 2 + star.twinkleOffset) * 0.5 + 0.5
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`
    ctx.beginPath()
    ctx.arc(star.x * width, star.y * height, star.size * twinkle, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw problems with Fredoka font (scaled)
  const fontSize = Math.round(22 * Math.min(scaleX, scaleY))
  ctx.font = `bold ${fontSize}px Fredoka, ui-rounded, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Set shadow once for all problems (avoid setting per-problem)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2

  for (const problem of state.problems) {
    // Scale coordinates from base to actual canvas
    const px = problem.x * scaleX
    const py = problem.y * scaleY

    const text = `${problem.a} × ${problem.b}`
    const metrics = ctx.measureText(text)
    const padding = 16 * Math.min(scaleX, scaleY)
    const boxWidth = metrics.width + padding * 2
    const boxHeight = 36 * Math.min(scaleX, scaleY)

    // Solid background instead of per-problem gradient (much faster on mobile)
    ctx.fillStyle = 'rgba(245, 245, 255, 0.95)'
    ctx.beginPath()
    ctx.roundRect(px - boxWidth / 2, py - boxHeight / 2, boxWidth, boxHeight, 10)
    ctx.fill()

    // Text
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText(text, px, py)
  }

  // Reset shadow after all problems
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Draw missiles with trail effect (scaled)
  const missileScale = Math.min(scaleX, scaleY)
  for (const missile of state.missiles) {
    const mx = missile.x * scaleX
    const my = missile.y * scaleY

    // Draw trail particles with simple circles (faster than gradients on mobile)
    for (let i = 0; i < 5; i++) {
      const trailY = my + i * 8 * scaleY
      const size = (6 - i) * missileScale
      const alpha = 0.6 - i * 0.1

      // Simple solid circles instead of radial gradients
      ctx.fillStyle = `rgba(255, 180, 50, ${alpha})`
      ctx.beginPath()
      ctx.arc(mx, trailY, size, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw rocket
    ctx.save()
    ctx.translate(mx, my)
    ctx.rotate(missile.rotation + Math.PI / 2)
    ctx.font = `${Math.round(28 * missileScale)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🚀', 0, 0)
    ctx.restore()
  }

  // Draw explosions with ring effect (scaled)
  const effectScale = Math.min(scaleX, scaleY)
  for (const explosion of state.explosions) {
    const ex = explosion.x * scaleX
    const ey = explosion.y * scaleY
    const progress = explosion.frame / EXPLOSION_FRAMES

    // Multiple expanding rings
    for (let ring = 0; ring < 3; ring++) {
      const ringProgress = Math.max(0, progress - ring * 0.1)
      const size = (20 + ringProgress * 60) * effectScale
      const opacity = (1 - ringProgress) * 0.6

      ctx.strokeStyle = `rgba(255, 200, 50, ${opacity})`
      ctx.lineWidth = (3 - ring) * effectScale
      ctx.beginPath()
      ctx.arc(ex, ey, size, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Central explosion emoji
    const emojiSize = (24 + progress * 40) * effectScale
    const emojiOpacity = 1 - progress

    ctx.globalAlpha = emojiOpacity
    ctx.font = `${Math.round(emojiSize)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💥', ex, ey)
    ctx.globalAlpha = 1
  }

  // Draw wrong answer effects (scaled)
  for (const effect of state.wrongAnswerEffects) {
    const ex = effect.x * scaleX
    const ey = effect.y * scaleY
    const progress = effect.frame / WRONG_EFFECT_FRAMES
    const opacity = 1 - progress
    const effectScaleFactor = 1 + progress * 0.5

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(ex, ey)
    ctx.rotate(effect.rotation)
    ctx.scale(effectScaleFactor, effectScaleFactor)
    ctx.font = `${Math.round(32 * effectScale)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(effect.emoji, 0, 0)
    ctx.restore()
  }
}
