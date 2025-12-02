import { getDB } from './db'
import type { Profile } from '../types'

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
    id: crypto.randomUUID(),
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
