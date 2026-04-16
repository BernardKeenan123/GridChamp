import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sessionAPI } from '../../services/api'
import styles from './Weekend.module.css'

function SessionCard({ session }) {
  const now = new Date()
  const sessionTime = new Date(session.scheduled_at)
  const isLocked = now > sessionTime

  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionLeft}>
        <div>
          <div className={styles.sessionType}>{session.session_type}</div>
          <div className={styles.sessionTime}>
            {sessionTime.toLocaleString()}
          </div>
        </div>
      </div>
      <div className={styles.sessionRight}>
        {session.completed ? (
          <Link to={`/results/${session.id}`} className={styles.btnResults}>
            View results
          </Link>
        ) : isLocked ? (
          <span className={styles.locked}>Locked</span>
        ) : (
          <Link to={`/predict/${session.id}`} className={styles.btnPredict}>
            Predict
          </Link>
        )}
      </div>
    </div>
  )
}

function Weekend() {
  const { round } = useParams()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const all = await sessionAPI.getAll()
        const weekend = all
          .filter(s => s.round === parseInt(round))
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
        setSessions(weekend)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [round])

  const raceName = sessions[0]?.race_name || 'Race Weekend'
  const roundNum = sessions[0]?.round

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
        <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
        <h1>{raceName}</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Round {roundNum} · Select a session to make your predictions
        </p>
        <div className={styles.sessionList}>
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Weekend