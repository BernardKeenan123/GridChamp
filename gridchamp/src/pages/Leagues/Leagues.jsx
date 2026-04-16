import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { leagueAPI } from '../../services/api'
import styles from './Leagues.module.css'

const SLOT_OPTIONS = [3, 5, 10, 20]

function Leagues() {
  const { user } = useAuth()
  const [myLeagues, setMyLeagues] = useState([])
  const [activeLeague, setActiveLeague] = useState(null)
  const [standings, setStandings] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form state
  const [newLeagueName, setNewLeagueName] = useState('')
  const [predictionSlots, setPredictionSlots] = useState(10)
  const [fastestLap, setFastestLap] = useState(false)
  const [driverOfDay, setDriverOfDay] = useState(false)
  const [poleBonus, setPoleBonus] = useState(false)

  // Join form state
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    loadLeagues()
  }, [])

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
      await leagueAPI.create(newLeagueName, {
        prediction_slots: predictionSlots,
        fastest_lap: fastestLap,
        driver_of_day: driverOfDay,
        pole_bonus: poleBonus,
      })
      setNewLeagueName('')
      setPredictionSlots(10)
      setFastestLap(false)
      setDriverOfDay(false)
      setPoleBonus(false)
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

        {error && (
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: 'var(--font-size-sm)' }}>
            {error}
          </div>
        )}

        {/* Create league form */}
        {showCreate && (
          <div className={styles.formCard}>
            <h3>Create a new league</h3>
            <p>Customise your league settings below. These can be updated later.</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>League name</label>
              <input
                type="text"
                placeholder="e.g. The Paddock"
                value={newLeagueName}
                onChange={e => setNewLeagueName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Positions to predict</label>
              <p className={styles.settingDesc}>How many finishing positions members must predict per session.</p>
              <div className={styles.slotOptions}>
                {SLOT_OPTIONS.map(n => (
                  <button
                    key={n}
                    className={`${styles.slotBtn} ${predictionSlots === n ? styles.slotBtnActive : ''}`}
                    onClick={() => setPredictionSlots(n)}
                  >
                    Top {n}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Bonus predictions</label>
              <p className={styles.settingDesc}>Optional extra predictions members can make each session.</p>
              <div className={styles.toggleList}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>Fastest lap</span>
                    <span className={styles.toggleDesc}>Predict which driver sets the fastest lap of the race</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${fastestLap ? styles.toggleOn : ''}`}
                    onClick={() => setFastestLap(!fastestLap)}
                  >
                    {fastestLap ? 'On' : 'Off'}
                  </button>
                </div>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>Driver of the day</span>
                    <span className={styles.toggleDesc}>Predict which driver wins driver of the day</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${driverOfDay ? styles.toggleOn : ''}`}
                    onClick={() => setDriverOfDay(!driverOfDay)}
                  >
                    {driverOfDay ? 'On' : 'Off'}
                  </button>
                </div>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>Pole position bonus</span>
                    <span className={styles.toggleDesc}>Correctly predicting P1 in qualifying earns bonus points</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${poleBonus ? styles.toggleOn : ''}`}
                    onClick={() => setPoleBonus(!poleBonus)}
                  >
                    {poleBonus ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.btnOutline} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className={styles.btnPrimary} onClick={handleCreate}>
                Create league
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
                  <div className={styles.leagueSettings}>
                    <span>Top {league.prediction_slots}</span>
                    {league.fastest_lap && <span>Fastest lap</span>}
                    {league.driver_of_day && <span>Driver of day</span>}
                    {league.pole_bonus && <span>Pole bonus</span>}
                  </div>
                </div>
              ))}
            </div>

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