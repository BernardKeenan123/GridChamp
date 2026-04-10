import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { sessionAPI, scoreAPI, leaderboardAPI, leagueAPI } from '../../services/api'
import styles from './Dashboard.module.css'

function SessionCard({ session }) {
  const now = new Date()
  const sessionTime = new Date(session.scheduled_at)
  const isLocked = now > sessionTime

  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionLeft}>
        <span className={styles.flag}>🏁</span>
        <div>
          <div className={styles.sessionRace}>{session.race_name}</div>
          <div className={styles.sessionMeta}>
            Round {session.round} · {session.session_type} · {new Date(session.scheduled_at).toLocaleString()}
          </div>
        </div>
      </div>
      <div className={styles.sessionRight}>
        {isLocked
          ? <span className={styles.locked}>Locked</span>
          : <Link to={`/predict/${session.id}`} className={styles.btnPredict}>Predict</Link>
        }
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [globalRank, setGlobalRank] = useState(null)
  const [leagues, setLeagues] = useState([])
  const [recentScores, setRecentScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Fetch all data in parallel
        const [sessionsData, scoreData, leaderboardData, leaguesData] = await Promise.all([
          sessionAPI.getAll(),
          scoreAPI.getMyTotal(),
          leaderboardAPI.getGlobal(),
          leagueAPI.getMyLeagues(),
        ])

        // Filter to only show upcoming/unlocked sessions
        const now = new Date()
        const upcoming = sessionsData
        .filter(s => !s.completed)
        .slice(0, 5)
        
        setSessions(upcoming)
        setTotalPoints(scoreData.total)
        setLeagues(leaguesData)

        // Find the current user's rank in the global leaderboard
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

        {/* Page header with welcome message and summary stats */}
        <div className={styles.header}>
          <div>
            <h1>Welcome back, <span>{user?.username}</span></h1>
            <p>You have {sessions.length} upcoming sessions to predict</p>
          </div>

          {/* Summary stats */}
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

          {/* Upcoming sessions */}
          <div className={styles.section}>
            <h2>Upcoming sessions</h2>
            <div className={styles.sessionList}>
              {sessions.length > 0
                ? sessions.map(s => <SessionCard key={s.id} session={s} />)
                : <p style={{ color: 'var(--color-text-secondary)' }}>No upcoming sessions available.</p>
              }
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>

            {/* League standings widget */}
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