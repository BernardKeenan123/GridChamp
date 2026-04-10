import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { leagueAPI } from '../../services/api'
import styles from './Leagues.module.css'

function Leagues() {
  const { user } = useAuth()
  const [myLeagues, setMyLeagues] = useState([])
  const [activeLeague, setActiveLeague] = useState(null)
  const [standings, setStandings] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newLeagueName, setNewLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load user's leagues on mount
  useEffect(() => {
    loadLeagues()
  }, [])

  // Load standings when active league changes
  useEffect(() => {
    if (activeLeague) {
      loadStandings(activeLeague.id)
    }
  }, [activeLeague])

  async function loadLeagues() {
    try {
      const data = await leagueAPI.getMyLeagues()
      setMyLeagues(data)
      if (data.length > 0) setActiveLeague(data[0])
    } catch (err) {
      console.error('Failed to load leagues:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadStandings(leagueId) {
    try {
      const data = await leagueAPI.getStandings(leagueId)
      setStandings(data)
    } catch (err) {
      console.error('Failed to load standings:', err)
    }
  }

  async function handleCreate() {
    if (!newLeagueName.trim()) return
    try {
      await leagueAPI.create(newLeagueName)
      setNewLeagueName('')
      setShowCreate(false)
      await loadLeagues()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return
    try {
      await leagueAPI.join(joinCode)
      setJoinCode('')
      setShowJoin(false)
      await loadLeagues()
    } catch (err) {
      setError(err.message)
    }
  }

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

        {/* Page header */}
        <div className={styles.header}>
          <div>
            <h1>Mini leagues</h1>
            <p>Compete in private leagues with friends and family</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnOutline} onClick={() => { setShowJoin(true); setShowCreate(false) }}>
              Join a league
            </button>
            <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setShowJoin(false) }}>
              Create league
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
            {error}
          </div>
        )}

        {/* Create league form */}
        {showCreate && (
          <div className={styles.formCard}>
            <h3>Create a new league</h3>
            <p>Share the generated code with friends so they can join.</p>
            <div className={styles.formRow}>
              <input
                type="text"
                placeholder="League name"
                value={newLeagueName}
                onChange={e => setNewLeagueName(e.target.value)}
                className={styles.input}
              />
              <button className={styles.btnPrimary} onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        )}

        {/* Join league form */}
        {showJoin && (
          <div className={styles.formCard}>
            <h3>Join a league</h3>
            <p>Enter the invite code shared by the league creator.</p>
            <div className={styles.formRow}>
              <input
                type="text"
                placeholder="Enter invite code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className={styles.input}
              />
              <button className={styles.btnPrimary} onClick={handleJoin}>
                Join
              </button>
            </div>
          </div>
        )}

        {myLeagues.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            You haven't joined any leagues yet. Create one or join with an invite code.
          </p>
        ) : (
          <div className={styles.grid}>

            {/* League list */}
            <div className={styles.leagueList}>
              <h2>Your leagues</h2>
              {myLeagues.map(league => (
                <div
                  key={league.id}
                  className={`${styles.leagueCard} ${activeLeague?.id === league.id ? styles.leagueActive : ''}`}
                  onClick={() => setActiveLeague(league)}
                >
                  <div className={styles.leagueCardTop}>
                    <span className={styles.leagueName}>{league.name}</span>
                  </div>
                  <div className={styles.leagueCardMeta}>
                    <span>{league.member_count} members</span>
                    <span>Code: <strong>{league.code}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Standings panel */}
            {activeLeague && (
              <div className={styles.standingsPanel}>
                <div className={styles.standingsHeader}>
                  <h2>{activeLeague.name}</h2>
                  <span className={styles.leagueCode}>Invite code: <strong>{activeLeague.code}</strong></span>
                </div>

                <div className={styles.tableWrapper}>
                  <div className={styles.tableHeader}>
                    <span>Rank</span>
                    <span>Player</span>
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
                        <span className={`${styles.points} ${isUser ? styles.userPoints : ''}`}>
                          {row.total_points}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Leagues