import type { GameState } from '../types'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  STAR_COUNT,
  EXPLOSION_FRAMES,
  WRONG_EFFECT_FRAMES
} from './constants'

// Star positions (generated once)
let stars: { x: number; y: number; size: number; twinkleOffset: number }[] = []

function initStars(): void {
  if (stars.length > 0) return
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      size: Math.random() * 2 + 1,
      twinkleOffset: Math.random() * Math.PI * 2
    })
  }
}

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  initStars()

  // Clear and draw background
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  gradient.addColorStop(0, '#0f0c29')
  gradient.addColorStop(0.5, '#302b63')
  gradient.addColorStop(1, '#24243e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  // Draw stars
  const time = Date.now() / 1000
  for (const star of stars) {
    const twinkle = Math.sin(time * 2 + star.twinkleOffset) * 0.5 + 0.5
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw problems
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const problem of state.problems) {
    // Background pill
    const text = `${problem.a} × ${problem.b}`
    const metrics = ctx.measureText(text)
    const padding = 12
    const width = metrics.width + padding * 2
    const height = 32

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.roundRect(problem.x - width / 2, problem.y - height / 2, width, height, 8)
    ctx.fill()

    // Text
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText(text, problem.x, problem.y)
  }

  // Draw missiles
  for (const missile of state.missiles) {
    ctx.save()
    ctx.translate(missile.x, missile.y)
    ctx.rotate(missile.rotation + Math.PI / 2)

    // Rocket emoji or simple triangle
    ctx.font = '24px Arial'
    ctx.fillText('🚀', 0, 0)

    ctx.restore()
  }

  // Draw explosions
  for (const explosion of state.explosions) {
    const progress = explosion.frame / EXPLOSION_FRAMES
    const size = 20 + progress * 40
    const opacity = 1 - progress

    ctx.globalAlpha = opacity
    ctx.font = `${size}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💥', explosion.x, explosion.y)
    ctx.globalAlpha = 1
  }

  // Draw wrong answer effects
  for (const effect of state.wrongAnswerEffects) {
    const progress = effect.frame / WRONG_EFFECT_FRAMES
    const opacity = 1 - progress

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(effect.x, effect.y)
    ctx.rotate(effect.rotation)
    ctx.font = '30px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(effect.emoji, 0, 0)
    ctx.restore()
  }
}
