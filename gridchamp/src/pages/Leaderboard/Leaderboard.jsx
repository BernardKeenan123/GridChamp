import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { leaderboardAPI } from '../../services/api'
import styles from './Leaderboard.module.css'

const TABS = ['global', 'friends']

function Leaderboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('global')
  const [globalStandings, setGlobalStandings] = useState([])
  const [friendsStandings, setFriendsStandings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [global, friends] = await Promise.all([
          leaderboardAPI.getGlobal(),
          leaderboardAPI.getFriends(),
        ])
        setGlobalStandings(global)
        setFriendsStandings(friends)
      } catch (err) {
        console.error('Failed to load leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const standings = activeTab === 'global' ? globalStandings : friendsStandings
  const userRank = globalStandings.findIndex(s => s.id === user.id) + 1

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        <div className={styles.header}>
          <div>
            <h1>Leaderboard</h1>
            <p>Rankings across all {globalStandings.length} participants</p>
          </div>
          <div className={styles.yourRank}>
            <span className={styles.yourRankValue}>#{userRank || '-'}</span>
            <span className={styles.yourRankLabel}>Your global rank</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'global' ? 'Global' : 'Friends'}
            </button>
          ))}
        </div>

        {/* Empty state for friends tab */}
        {activeTab === 'friends' && friendsStandings.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Join a league to see how your friends rank globally.
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <span>Rank</span>
              <span>Player</span>
              <span>Predictions</span>
              <span>Points</span>
            </div>

            {standings.map((row, index) => {
              const rank = index + 1
              const isUser = row.id === user.id
              return (
                <div
                  key={row.id}
                  className={`${styles.tableRow} ${isUser ? styles.userRow : ''}`}
                >
                  <span className={styles.rank}>
                    {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                  </span>
                  <span className={`${styles.username} ${isUser ? styles.userHighlight : ''}`}>
                    {row.username}
                    {isUser && <span className={styles.youTag}>You</span>}
                  </span>
                  <span className={styles.cell}>{row.predictions_made}</span>
                  <span className={`${styles.cell} ${styles.points} ${isUser ? styles.userPoints : ''}`}>
                    {row.total_points}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default Leaderboard