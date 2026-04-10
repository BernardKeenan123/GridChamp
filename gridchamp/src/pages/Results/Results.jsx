import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { sessionAPI, predictionAPI, scoreAPI } from '../../services/api'
import styles from './Results.module.css'

// Points awarded based on prediction accuracy
const POINTS = {
  exact: 10,
  oneOff: 6,
  twoOff: 3,
  inTop10: 1,
}

function getScore(predicted, actual) {
  const diff = Math.abs(predicted - actual)
  if (diff === 0) return { points: POINTS.exact, label: 'Exact', type: 'exact' }
  if (diff === 1) return { points: POINTS.oneOff, label: '±1', type: 'close' }
  if (diff === 2) return { points: POINTS.twoOff, label: '±2', type: 'close' }
  return { points: POINTS.inTop10, label: 'In top 10', type: 'partial' }
}

// Driver data for display purposes
const driverInfo = {
  VER: { name: 'Verstappen', team: 'Red Bull Racing', colour: '#3671C6' },
  NOR: { name: 'Norris', team: 'McLaren', colour: '#FF8000' },
  LEC: { name: 'Leclerc', team: 'Ferrari', colour: '#E8002D' },
  PIA: { name: 'Piastri', team: 'McLaren', colour: '#FF8000' },
  HAM: { name: 'Hamilton', team: 'Ferrari', colour: '#E8002D' },
  RUS: { name: 'Russell', team: 'Mercedes', colour: '#27F4D2' },
  SAI: { name: 'Sainz', team: 'Williams', colour: '#64C4FF' },
  ANT: { name: 'Antonelli', team: 'Mercedes', colour: '#27F4D2' },
  ALO: { name: 'Alonso', team: 'Aston Martin', colour: '#229971' },
  STR: { name: 'Stroll', team: 'Aston Martin', colour: '#229971' },
  TSU: { name: 'Tsunoda', team: 'Red Bull Racing', colour: '#3671C6' },
  HAD: { name: 'Hadjar', team: 'Racing Bulls', colour: '#6692FF' },
  HUL: { name: 'Hulkenberg', team: 'Sauber', colour: '#52E252' },
  BOR: { name: 'Bortoleto', team: 'Sauber', colour: '#52E252' },
  OCO: { name: 'Ocon', team: 'Haas', colour: '#B6BABD' },
  BEA: { name: 'Bearman', team: 'Haas', colour: '#B6BABD' },
  GAS: { name: 'Gasly', team: 'Alpine', colour: '#FF87BC' },
  DOO: { name: 'Doohan', team: 'Alpine', colour: '#FF87BC' },
  ALB: { name: 'Albon', team: 'Williams', colour: '#64C4FF' },
  LAW: { name: 'Lawson', team: 'Racing Bulls', colour: '#6692FF' },
}

function Results() {
  const { sessionId } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [results, setResults] = useState([])
  const [predictions, setPredictions] = useState([])
  const [sessionScore, setSessionScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [sessionData, predictionsData, scoresData] = await Promise.all([
          sessionAPI.getOne(sessionId),
          predictionAPI.getForSession(sessionId),
          scoreAPI.getSessionScores(sessionId),
        ])

        setSession(sessionData)
        setPredictions(predictionsData)

        // Find this user's score for the session
        const myScore = scoresData.find(s => s.username === user.username)
        if (myScore) setSessionScore(myScore.points)

        // Build results from predictions and stored results
        // TODO: fetch from results table once populated
        // For now build from predictions data
        if (predictionsData.length > 0) {
          setResults(predictionsData.sort((a, b) => a.position - b.position))
        }

      } catch (err) {
        setError('Failed to load results')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId, user.username])

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p style={{ padding: '2rem', color: 'var(--color-primary)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
          <div className={styles.sessionInfo}>
            <div>
              <h1>{session?.race_name} <span>— {session?.session_type}</span></h1>
              <p>Round {session?.round} · {new Date(session?.scheduled_at).toLocaleDateString()} · {session?.completed ? 'Final results' : 'Results pending'}</p>
            </div>
          </div>
        </div>

        {/* Score summary */}
        {sessionScore !== null && (
          <div className={styles.scoreSummary}>
            <div className={styles.scoreMain}>
              <span className={styles.scoreValue}>+{sessionScore}</span>
              <span className={styles.scoreLabel}>points earned</span>
            </div>
          </div>
        )}

        {/* Scoring key */}
        <div className={styles.scoringKey}>
          <span className={styles.keyLabel}>Scoring:</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.exact}`}>Exact</span> +10 pts</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.close}`}>±1</span> +6 pts</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.close}`}>±2</span> +3 pts</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.partial}`}>In top 10</span> +1 pt</span>
        </div>

        {/* Results table */}
        {results.length > 0 ? (
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <span>Your prediction</span>
              <span>Driver</span>
            </div>
            {results.map((r) => {
              const info = driverInfo[r.driver_code] || { name: r.driver_code, team: '', colour: '#888' }
              return (
                <div key={r.position} className={styles.tableRow}>
                  <span className={styles.pos}>P{r.position}</span>
                  <div className={styles.driver}>
                    <span className={styles.teamBar} style={{ backgroundColor: info.colour }} />
                    <span className={styles.code}>{r.driver_code}</span>
                    <div className={styles.driverDetails}>
                      <span className={styles.name}>{info.name}</span>
                      <span className={styles.team}>{info.team}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {session?.completed
              ? 'No predictions were submitted for this session.'
              : 'Results will appear here once the session is complete and scored.'}
          </p>
        )}

      </div>
    </div>
  )
}

export default Results