import { getDB } from './db'
import type { ProblemStats, SessionResult } from '../types'

// Problem Stats
export async function getProblemStats(profileId: string): Promise<ProblemStats[]> {
  const db = await getDB()
  return db.getAllFromIndex('problemStats', 'by-profile', profileId)
}

export async function getProblemStat(
  profileId: string,
  problemKey: string
): Promise<ProblemStats | undefined> {
  const db = await getDB()
  return db.get('problemStats', [profileId, problemKey])
}

export async function saveProblemStats(stats: ProblemStats): Promise<void> {
  const db = await getDB()
  await db.put('problemStats', stats)
}

export async function saveProblemStatsBatch(statsArray: ProblemStats[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('problemStats', 'readwrite')
  for (const stats of statsArray) {
    await tx.store.put(stats)
  }
  await tx.done
}

// Session Results
export async function saveSessionResult(result: SessionResult): Promise<void> {
  const db = await getDB()
  await db.put('sessions', result)
}

export async function getSessionHistory(
  profileId: string,
  limit = 50
): Promise<SessionResult[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('sessions', 'by-profile', profileId)
  // Sort by timestamp descending and limit
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
}
