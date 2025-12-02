import { useState, useEffect } from 'react'
import type { Profile, ProblemStats } from '../types'
import { getProblemStats } from '../storage/stats'
import { getProblemKey } from '../learning/selector'

interface Props {
  profile: Profile
  onBack: () => void
}

type MasteryLevel = 'mastered' | 'learning' | 'needsWork' | 'unseen'

function getMasteryLevel(stats: ProblemStats | undefined): MasteryLevel {
  if (!stats) return 'unseen'
  if (stats.easiness >= 2.5 && stats.interval >= 7) return 'mastered'
  if (stats.easiness >= 2.0) return 'learning'
  return 'needsWork'
}

function getMasteryEmoji(level: MasteryLevel): string {
  switch (level) {
    case 'mastered': return '🟢'
    case 'learning': return '🟡'
    case 'needsWork': return '🔴'
    case 'unseen': return '⚪'
  }
}

export function StatsView({ profile, onBack }: Props) {
  const [statsMap, setStatsMap] = useState<Map<string, ProblemStats>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const stats = await getProblemStats(profile.id)
      const map = new Map<string, ProblemStats>()
      for (const s of stats) {
        map.set(s.problemKey, s)
      }
      setStatsMap(map)
      setLoading(false)
    }
    load()
  }, [profile.id])

  // Get trouble spots (lowest easiness)
  const troubleSpots = Array.from(statsMap.values())
    .filter(s => s.totalAttempts > 0)
    .sort((a, b) => a.easiness - b.easiness)
    .slice(0, 5)

  // Calculate overall stats
  const allStats = Array.from(statsMap.values())
  const totalPracticed = allStats.filter(s => s.totalAttempts > 0).length
  const totalAttempts = allStats.reduce((sum, s) => sum + s.totalAttempts, 0)
  const totalCorrect = allStats.reduce((sum, s) => sum + s.totalCorrect, 0)
  const overallAccuracy = totalAttempts > 0
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0

  const tables = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const multipliers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading stats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 Your Progress</h1>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            ← Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{totalPracticed}</div>
            <div className="text-sm text-gray-400">Problems Practiced</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{overallAccuracy}%</div>
            <div className="text-sm text-gray-400">Overall Accuracy</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{profile.highScore.toLocaleString()}</div>
            <div className="text-sm text-gray-400">High Score</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Mastery Grid</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr>
                  <th className="p-2">×</th>
                  {multipliers.map(m => (
                    <th key={m} className="p-2 text-gray-400">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <tr key={table}>
                    <td className="p-2 font-semibold text-gray-400">{table}</td>
                    {multipliers.map(m => {
                      const key = getProblemKey(table, m)
                      const stats = statsMap.get(key)
                      const level = getMasteryLevel(stats)
                      return (
                        <td key={m} className="p-1">
                          <span title={`${key} - ${level}`}>
                            {getMasteryEmoji(level)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-4 text-sm justify-center">
            <span>🟢 Mastered</span>
            <span>🟡 Learning</span>
            <span>🔴 Needs Work</span>
            <span>⚪ Not Practiced</span>
          </div>
        </div>

        {troubleSpots.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-yellow-400">
              🎯 Focus Areas
            </h2>
            <div className="space-y-3">
              {troubleSpots.map(stats => {
                const accuracy = Math.round(
                  (stats.totalCorrect / stats.totalAttempts) * 100
                )
                return (
                  <div
                    key={stats.problemKey}
                    className="flex justify-between items-center bg-gray-700 rounded p-3"
                  >
                    <span className="font-mono text-lg">{stats.problemKey}</span>
                    <span className="text-gray-400">
                      {accuracy}% ({stats.totalAttempts} attempts)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
