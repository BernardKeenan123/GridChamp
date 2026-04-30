import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sessionAPI } from '../../services/api'
import styles from './Weekend.module.css'

// Normalise Supabase timestamp to a valid UTC Date
// Supabase returns timestamps with a space instead of T, e.g. "2026-05-01 20:30:00"
function toUTC(dateStr) {
  if (!dateStr) return null
  const normalised = dateStr.replace(' ', 'T')
  return new Date(normalised.endsWith('Z') ? normalised : normalised + 'Z')
}

// Countdown hook - returns a live countdown string to a target date
function useCountdown(targetDate) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    function update() {
      const target = toUTC(targetDate)
      if (!target) return

      const now = new Date()
      const diff = target - now

      if (diff <= 0) {
        setCountdown('Locked')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${mins}m`)
      } else if (hours > 0) {
        setCountdown(`${hours}h ${mins}m ${secs}s`)
      } else {
        setCountdown(`${mins}m ${secs}s`)
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return countdown
}

function SessionCard({ session, predictionsCloseAt, isWeekendLocked }) {
  const sessionTime = toUTC(session.scheduled_at)
  const countdown = useCountdown(predictionsCloseAt)

  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionLeft}>
        <div>
          <div className={styles.sessionType}>{session.session_type}</div>
          <div className={styles.sessionTime}>
            {sessionTime ? sessionTime.toLocaleString() : ''}
          </div>
          {/* Show countdown on all sessions until predictions close */}
          {!isWeekendLocked && !session.completed && (
            <div className={styles.countdown}>
              Predictions close in {countdown}
            </div>
          )}
        </div>
      </div>
      <div className={styles.sessionRight}>
        {session.completed ? (
          <Link to={`/results/${session.id}`} className={styles.btnResults}>
            View results
          </Link>
        ) : isWeekendLocked ? (
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
          .sort((a, b) => toUTC(a.scheduled_at) - toUTC(b.scheduled_at))
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

  // All sessions in a weekend share the same predictions_close_at
  const predictionsCloseAt = sessions[0]?.predictions_close_at
  const isWeekendLocked = predictionsCloseAt
    ? new Date() > toUTC(predictionsCloseAt)
    : false

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
            <SessionCard
              key={s.id}
              session={s}
              predictionsCloseAt={predictionsCloseAt}
              isWeekendLocked={isWeekendLocked}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Weekend