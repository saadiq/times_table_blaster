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

  // Draw problems with Fredoka font
  ctx.font = 'bold 22px Fredoka, ui-rounded, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const problem of state.problems) {
    const text = `${problem.a} × ${problem.b}`
    const metrics = ctx.measureText(text)
    const padding = 16
    const width = metrics.width + padding * 2
    const height = 36

    // Gradient background for problems
    const problemGradient = ctx.createLinearGradient(
      problem.x - width / 2,
      problem.y - height / 2,
      problem.x + width / 2,
      problem.y + height / 2
    )
    problemGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
    problemGradient.addColorStop(1, 'rgba(230, 230, 255, 0.95)')

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 2

    ctx.fillStyle = problemGradient
    ctx.beginPath()
    ctx.roundRect(problem.x - width / 2, problem.y - height / 2, width, height, 10)
    ctx.fill()

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Text
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText(text, problem.x, problem.y)
  }

  // Draw missiles with trail effect
  for (const missile of state.missiles) {
    // Draw trail particles
    ctx.save()
    for (let i = 0; i < 5; i++) {
      const trailY = missile.y + i * 8
      const size = 6 - i * 1
      const alpha = 0.6 - i * 0.1

      // Orange-yellow gradient trail
      const trailGradient = ctx.createRadialGradient(
        missile.x, trailY, 0,
        missile.x, trailY, size
      )
      trailGradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`)
      trailGradient.addColorStop(1, `rgba(255, 100, 50, 0)`)

      ctx.fillStyle = trailGradient
      ctx.beginPath()
      ctx.arc(missile.x, trailY, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // Draw rocket
    ctx.save()
    ctx.translate(missile.x, missile.y)
    ctx.rotate(missile.rotation + Math.PI / 2)
    ctx.font = '28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🚀', 0, 0)
    ctx.restore()
  }

  // Draw explosions with ring effect
  for (const explosion of state.explosions) {
    const progress = explosion.frame / EXPLOSION_FRAMES

    // Multiple expanding rings
    for (let ring = 0; ring < 3; ring++) {
      const ringProgress = Math.max(0, progress - ring * 0.1)
      const size = 20 + ringProgress * 60
      const opacity = (1 - ringProgress) * 0.6

      ctx.strokeStyle = `rgba(255, 200, 50, ${opacity})`
      ctx.lineWidth = 3 - ring
      ctx.beginPath()
      ctx.arc(explosion.x, explosion.y, size, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Central explosion emoji
    const emojiSize = 24 + progress * 40
    const emojiOpacity = 1 - progress

    ctx.globalAlpha = emojiOpacity
    ctx.font = `${emojiSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💥', explosion.x, explosion.y)
    ctx.globalAlpha = 1
  }

  // Draw wrong answer effects
  for (const effect of state.wrongAnswerEffects) {
    const progress = effect.frame / WRONG_EFFECT_FRAMES
    const opacity = 1 - progress
    const scale = 1 + progress * 0.5

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(effect.x, effect.y)
    ctx.rotate(effect.rotation)
    ctx.scale(scale, scale)
    ctx.font = '32px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(effect.emoji, 0, 0)
    ctx.restore()
  }
}
