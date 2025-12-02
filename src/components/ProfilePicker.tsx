import { useState, useEffect } from 'react'
import type { Profile } from '../types'
import { getAllProfiles, createProfile, deleteProfile } from '../storage/profiles'

interface Props {
  onSelectProfile: (profile: Profile) => void
}

// Avatar options for pilots
const AVATARS = ['🤖', '👽', '🚀', '⭐', '🌟', '🛸', '👨‍🚀', '👩‍🚀', '🌙', '🪐']

function getAvatar(index: number): string {
  return AVATARS[index % AVATARS.length]
}

export function ProfilePicker({ onSelectProfile }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    const loaded = await getAllProfiles()
    setProfiles(loaded.sort((a, b) => b.createdAt - a.createdAt))
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setError(null)
    try {
      const profile = await createProfile(newName.trim())
      setNewName('')
      setIsCreating(false)
      onSelectProfile(profile)
    } catch (err) {
      console.error('Failed to create profile:', err)
      setError('Could not create pilot. Try a different browser or disable private browsing.')
    }
  }

  async function handleDelete(id: string) {
    await deleteProfile(id)
    setConfirmDelete(null)
    loadProfiles()
  }

  return (
    <div className="min-h-screen bg-profile-gradient flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-10 animate-slide-down">
        <h1 className="text-title text-white drop-shadow-lg mb-2">
          <span className="inline-block animate-float">🚀</span> Times Table Blaster <span className="inline-block animate-float" style={{ animationDelay: '0.5s' }}>🚀</span>
        </h1>
        <p className="text-white/70 text-lg">Choose Your Pilot!</p>
      </div>

      {/* Profile Cards Grid */}
      <div className="w-full max-w-3xl">
        <div className="flex flex-wrap justify-center gap-6">
          {profiles.map((profile, index) => (
            <div
              key={profile.id}
              className="relative group"
            >
              {/* Profile Card */}
              <button
                onClick={() => confirmDelete !== profile.id && onSelectProfile(profile)}
                className="w-44 h-56 glass-card p-4 flex flex-col items-center justify-center gap-3
                  border-4 border-transparent hover:border-secondary-400/50
                  transition-all duration-300 hover:scale-105 hover:-rotate-1
                  hover:shadow-[0_8px_32px_rgba(34,211,238,0.3)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                }}
              >
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center text-4xl shadow-lg">
                  {getAvatar(index)}
                </div>

                {/* Name */}
                <div className="text-white font-bold text-lg truncate w-full text-center">
                  {profile.name}
                </div>

                {/* High Score */}
                <div className="flex items-center gap-1 text-warning-400">
                  <span>🏆</span>
                  <span className="font-semibold">{profile.highScore.toLocaleString()}</span>
                </div>
              </button>

              {/* Delete Button */}
              {confirmDelete === profile.id ? (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-bg-dark p-2 rounded-xl shadow-xl">
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="px-3 py-1 bg-error-500 rounded-lg text-sm text-white hover:bg-error-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1 bg-surface-dark rounded-lg text-sm text-white hover:bg-surface-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(profile.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-500/50"
                  title="Delete profile"
                >
                  <span className="text-sm">🗑️</span>
                </button>
              )}
            </div>
          ))}

          {/* New Profile Card */}
          {isCreating ? (
            <div className="w-44 glass-card p-4 flex flex-col items-center justify-center gap-3 animate-bounce-in">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Your name"
                className="game-input w-full px-3 py-2 text-center text-white"
                autoFocus
              />
              {error && (
                <div className="text-error-400 text-xs text-center">
                  {error}
                </div>
              )}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="flex-1 btn-primary py-2 text-sm text-white"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewName('')
                    setError(null)
                  }}
                  className="btn-secondary px-3 py-2 text-sm text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-44 h-56 rounded-2xl border-4 border-dashed border-white/30
                flex flex-col items-center justify-center gap-3
                hover:border-secondary-400 hover:bg-white/5 transition-all duration-300
                group animate-pulse-glow"
            >
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/30
                flex items-center justify-center text-4xl text-white/50
                group-hover:border-secondary-400 group-hover:text-secondary-400 transition-colors">
                +
              </div>
              <div className="text-white/70 font-semibold group-hover:text-secondary-400 transition-colors">
                New Pilot
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
