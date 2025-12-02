import { useState, useEffect } from 'react'

// Base dimensions for coordinate scaling (original game size)
export const BASE_WIDTH = 900
export const BASE_HEIGHT = 700

interface CanvasDimensions {
  width: number
  height: number
  scaleX: number
  scaleY: number
  isMobile: boolean
}

const MOBILE_BREAKPOINT = 768
const MAX_DESKTOP_WIDTH = 1200
const DESKTOP_ASPECT_RATIO = 4 / 3
const MOBILE_PAD_HEIGHT = 200 // Number pad height
const MOBILE_HUD_HEIGHT = 60  // Floating badges space

export function useResponsiveCanvas(): CanvasDimensions {
  const [dimensions, setDimensions] = useState<CanvasDimensions>(() =>
    calculateDimensions()
  )

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    function handleResize() {
      // Debounce resize to avoid excessive recalculations
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setDimensions(calculateDimensions())
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', handleResize)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return dimensions
}

function calculateDimensions(): CanvasDimensions {
  const isMobile = detectMobile()

  if (isMobile) {
    return calculateMobileDimensions()
  } else {
    return calculateDesktopDimensions()
  }
}

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false
  // Use width-based detection only - touch detection can be unreliable
  return window.innerWidth < MOBILE_BREAKPOINT
}

function calculateMobileDimensions(): CanvasDimensions {
  const viewportWidth = window.innerWidth || 375 // Fallback to iPhone width
  const viewportHeight = window.innerHeight || 667 // Fallback to iPhone height

  // Canvas fills width, height is viewport minus pad and HUD space
  const width = Math.max(viewportWidth, 320)
  const height = Math.max(
    viewportHeight - MOBILE_PAD_HEIGHT - MOBILE_HUD_HEIGHT,
    300 // Minimum canvas height
  )

  return {
    width,
    height,
    scaleX: width / BASE_WIDTH,
    scaleY: height / BASE_HEIGHT,
    isMobile: true,
  }
}

function calculateDesktopDimensions(): CanvasDimensions {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Padding and space for input controls
  const maxWidth = Math.min(MAX_DESKTOP_WIDTH, viewportWidth - 40)
  const maxHeight = viewportHeight - 120 // Space for keyboard input area

  // Calculate dimensions maintaining aspect ratio
  let width = maxWidth
  let height = width / DESKTOP_ASPECT_RATIO

  // If too tall, constrain by height instead
  if (height > maxHeight) {
    height = maxHeight
    width = height * DESKTOP_ASPECT_RATIO
  }

  return {
    width,
    height,
    scaleX: width / BASE_WIDTH,
    scaleY: height / BASE_HEIGHT,
    isMobile: false,
  }
}
