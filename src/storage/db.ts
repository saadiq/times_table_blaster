import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Profile, ProblemStats, SessionResult } from '../types'

interface TimesTableDB extends DBSchema {
  profiles: {
    key: string
    value: Profile
  }
  problemStats: {
    key: [string, string]  // [profileId, problemKey]
    value: ProblemStats
    indexes: {
      'by-profile': string
    }
  }
  sessions: {
    key: [string, number]  // [profileId, timestamp]
    value: SessionResult
    indexes: {
      'by-profile': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<TimesTableDB>> | null = null

export function getDB(): Promise<IDBPDatabase<TimesTableDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TimesTableDB>('times-table-blaster', 1, {
      upgrade(db) {
        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' })
        }

        // Problem stats store
        if (!db.objectStoreNames.contains('problemStats')) {
          const statsStore = db.createObjectStore('problemStats', {
            keyPath: ['profileId', 'problemKey']
          })
          statsStore.createIndex('by-profile', 'profileId')
        }

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', {
            keyPath: ['profileId', 'timestamp']
          })
          sessionsStore.createIndex('by-profile', 'profileId')
        }
      }
    })
  }
  return dbPromise
}
