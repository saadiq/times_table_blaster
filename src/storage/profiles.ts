import { getDB } from './db'
import type { Profile } from '../types'

// Fallback for browsers without crypto.randomUUID (Safari < 15.4, older Chrome/Firefox)
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function getAllProfiles(): Promise<Profile[]> {
  const db = await getDB()
  return db.getAll('profiles')
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const db = await getDB()
  return db.get('profiles', id)
}

export async function createProfile(name: string): Promise<Profile> {
  const db = await getDB()
  const profile: Profile = {
    id: generateId(),
    name,
    createdAt: Date.now(),
    highScore: 0
  }
  await db.put('profiles', profile)
  return profile
}

export async function updateProfile(profile: Profile): Promise<void> {
  const db = await getDB()
  await db.put('profiles', profile)
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDB()

  // Delete profile
  await db.delete('profiles', id)

  // Delete all problem stats for this profile
  const stats = await db.getAllFromIndex('problemStats', 'by-profile', id)
  const tx = db.transaction('problemStats', 'readwrite')
  for (const stat of stats) {
    await tx.store.delete([stat.profileId, stat.problemKey])
  }
  await tx.done

  // Delete all sessions for this profile
  const sessions = await db.getAllFromIndex('sessions', 'by-profile', id)
  const tx2 = db.transaction('sessions', 'readwrite')
  for (const session of sessions) {
    await tx2.store.delete([session.profileId, session.timestamp])
  }
  await tx2.done
}
