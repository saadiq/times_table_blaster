export type SoundEffect =
  | 'missile_launch'
  | 'explosion'
  | 'wrong_answer'
  | 'level_up'
  | 'game_over'
  | 'menu_select'

interface SoundManager {
  init(): Promise<void>
  play(sound: SoundEffect): void
  setMuted(muted: boolean): void
  isMuted(): boolean
}

// Placeholder implementation - audio not yet implemented
export const soundManager: SoundManager = {
  async init() {
    // TODO: Load audio files
  },
  play(_sound: SoundEffect) {
    // TODO: Play sound
  },
  setMuted(_muted: boolean) {
    // TODO: Store mute preference
  },
  isMuted() {
    return true // Muted by default until implemented
  }
}
