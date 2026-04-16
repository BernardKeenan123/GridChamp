import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { sessionAPI, scoreAPI, leaderboardAPI, leagueAPI } from '../../services/api'
import styles from './Dashboard.module.css'

// Group an array of sessions by race_name
function groupByRaceWeekend(sessions) {
  const groups = {}
  for (const session of sessions) {
    if (!groups[session.race_name]) {
      groups[session.race_name] = {
        race_name: session.race_name,
        round: session.round,
        sessions: [],
      }
    }
    groups[session.race_name].sessions.push(session)
  }
  // Return sorted by round number
  return Object.values(groups).sort((a, b) => a.round - b.round)
}

function RaceWeekendCard({ weekend }) {
  const now = new Date()
  const allLocked = weekend.sessions.every(s => new Date(s.scheduled_at) < now)
  const anyOpen = weekend.sessions.some(s => new Date(s.scheduled_at) > now)
  const sessionCount = weekend.sessions.length

  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionLeft}>
        <span className={styles.flag}>🏁</span>
        <div>
          <div className={styles.sessionRace}>{weekend.race_name}</div>
          <div className={styles.sessionMeta}>
            Round {weekend.round} · {sessionCount} session{sessionCount !== 1 ? 's' : ''} · {anyOpen ? 'Predictions open' : 'Locked'}
          </div>
        </div>
      </div>
      <div className={styles.sessionRight}>
        <Link
          to={`/weekend/${weekend.round}`}
          className={styles.btnPredict}
        >
          View sessions
        </Link>
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [weekends, setWeekends] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [globalRank, setGlobalRank] = useState(null)
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [sessionsData, scoreData, leaderboardData, leaguesData] = await Promise.all([
          sessionAPI.getAll(),
          scoreAPI.getMyTotal(),
          leaderboardAPI.getGlobal(),
          leagueAPI.getMyLeagues(),
        ])

        // Filter to only incomplete sessions then group by race weekend
        const upcoming = sessionsData.filter(s => !s.completed)
        const grouped = groupByRaceWeekend(upcoming)
        setWeekends(grouped)
        setTotalPoints(scoreData.total)
        setLeagues(leaguesData)

        const userRank = leaderboardData.findIndex(u => u.id === user.id) + 1
        setGlobalRank(userRank || null)

      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user.id])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        <div className={styles.header}>
          <div>
            <h1>Welcome back, <span>{user?.username}</span></h1>
            <p>{weekends.length} upcoming race weekend{weekends.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalPoints}</span>
              <span className={styles.statLabel}>Total points</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{globalRank ? `#${globalRank}` : '-'}</span>
              <span className={styles.statLabel}>Global rank</span>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.section}>
            <h2>Upcoming race weekends</h2>
            <div className={styles.sessionList}>
              {weekends.length > 0
                ? weekends.map(w => <RaceWeekendCard key={w.round} weekend={w} />)
                : <p style={{ color: 'var(--color-text-secondary)' }}>No upcoming race weekends.</p>
              }
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.widget}>
              <h3>Your leagues</h3>
              {leagues.length > 0 ? (
                <div className={styles.leagueList}>
                  {leagues.map(l => (
                    <div key={l.id} className={styles.leagueRow}>
                      <div className={styles.leagueName}>{l.name}</div>
                      <div className={styles.leagueRight}>
                        <span className={styles.leagueRank}>{l.member_count} members</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  You haven't joined any leagues yet.
                </p>
              )}
              <Link to="/leagues" className={styles.viewAll}>Manage leagues →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard