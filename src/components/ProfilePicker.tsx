import { useState, useEffect } from 'react'
import type { Profile } from '../types'
import { getAllProfiles, createProfile, deleteProfile } from '../storage/profiles'

interface Props {
  onSelectProfile: (profile: Profile) => void
}

export function ProfilePicker({ onSelectProfile }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    const loaded = await getAllProfiles()
    setProfiles(loaded.sort((a, b) => b.createdAt - a.createdAt))
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const profile = await createProfile(newName.trim())
    setNewName('')
    setIsCreating(false)
    onSelectProfile(profile)
  }

  async function handleDelete(id: string) {
    await deleteProfile(id)
    setConfirmDelete(null)
    loadProfiles()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">🚀 Times Table Blaster 🚀</h1>
      <p className="text-gray-400 mb-8">Select your profile to continue</p>

      <div className="w-full max-w-md space-y-4">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <button
              onClick={() => onSelectProfile(profile)}
              className="flex-1 text-left hover:text-green-400 transition-colors"
            >
              <div className="font-semibold text-lg">{profile.name}</div>
              <div className="text-sm text-gray-400">
                High Score: {profile.highScore.toLocaleString()}
              </div>
            </button>
            {confirmDelete === profile.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(profile.id)}
                className="text-gray-500 hover:text-red-400 transition-colors"
                title="Delete profile"
              >
                🗑️
              </button>
            )}
          </div>
        ))}

        {isCreating ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Enter your name"
              className="w-full bg-gray-700 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 bg-green-600 rounded py-2 font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Profile
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewName('')
                }}
                className="px-4 bg-gray-600 rounded py-2 hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full bg-gray-800 rounded-lg p-4 text-green-400 hover:bg-gray-700 transition-colors font-semibold"
          >
            + New Profile
          </button>
        )}
      </div>
    </div>
  )
}
