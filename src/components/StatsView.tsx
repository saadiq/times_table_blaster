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

// Star SVG component for mastery display
function MasteryStar({ level }: { level: MasteryLevel }) {
  const getStarClass = () => {
    switch (level) {
      case 'mastered': return 'star-mastered'
      case 'learning': return 'star-learning'
      case 'needsWork': return 'star-needs-work'
      case 'unseen': return 'star-not-practiced'
    }
  }

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={level === 'unseen' ? 'transparent' : 'currentColor'}
      stroke="currentColor"
      strokeWidth={level === 'unseen' ? '1.5' : '0'}
      className={`${getStarClass()} transition-transform hover:scale-150 cursor-pointer`}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

// Stat card with icon
function StatCard({ icon, value, label, delay }: { icon: string; value: string | number; label: string; delay: number }) {
  return (
    <div
      className="glass-card p-5 text-center hover:-translate-y-1 transition-transform"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-stat text-white">{value}</div>
      <div className="text-sm text-surface-light">{label}</div>
    </div>
  )
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white animate-pulse">Loading stats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-heading text-white animate-slide-down">
            📊 Your Progress
          </h1>
          <button
            onClick={onBack}
            className="text-surface-light hover:text-white transition-colors"
          >
            ← Back to Menu
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon="🎯" value={totalPracticed} label="Problems Practiced" delay={0} />
          <StatCard icon="✨" value={`${overallAccuracy}%`} label="Overall Accuracy" delay={75} />
          <StatCard icon="🏆" value={profile.highScore.toLocaleString()} label="High Score" delay={150} />
        </div>

        {/* Mastery Grid */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-subheading text-secondary-300 mb-4">
            Multiplication Mastery
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr>
                  <th className="p-2 text-surface-light font-display">×</th>
                  {multipliers.map(m => (
                    <th key={m} className="p-2 text-surface-light text-sm">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <tr key={table}>
                    <td className="p-2 font-display font-bold text-surface-light">{table}</td>
                    {multipliers.map(m => {
                      const key = getProblemKey(table, m)
                      const stats = statsMap.get(key)
                      const level = getMasteryLevel(stats)
                      const accuracy = stats && stats.totalAttempts > 0
                        ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
                        : null
                      return (
                        <td key={m} className="p-1">
                          <div
                            title={`${key}${accuracy !== null ? ` - ${accuracy}%` : ' - Not practiced'}`}
                            className="flex justify-center"
                          >
                            <MasteryStar level={level} />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-6 text-sm justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <MasteryStar level="mastered" />
              <span className="text-surface-light">Mastered</span>
            </div>
            <div className="flex items-center gap-2">
              <MasteryStar level="learning" />
              <span className="text-surface-light">Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <MasteryStar level="needsWork" />
              <span className="text-surface-light">Needs Work</span>
            </div>
            <div className="flex items-center gap-2">
              <MasteryStar level="unseen" />
              <span className="text-surface-light">Not Practiced</span>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        {troubleSpots.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-subheading text-warning-400 mb-4">
              🎯 Focus Areas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {troubleSpots.map(stats => {
                const accuracy = Math.round(
                  (stats.totalCorrect / stats.totalAttempts) * 100
                )
                return (
                  <div
                    key={stats.problemKey}
                    className="bg-bg-medium rounded-xl p-4 border-l-4 border-warning-500"
                  >
                    <div className="font-display text-xl text-white mb-2">
                      {stats.problemKey}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-bg-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-error-500 to-warning-500 rounded-full"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm text-surface-light w-12 text-right">
                        {accuracy}%
                      </span>
                    </div>
                    <div className="text-xs text-surface-light mt-1">
                      {stats.totalAttempts} attempts
                    </div>
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
