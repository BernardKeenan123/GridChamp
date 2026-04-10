import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { sessionAPI, predictionAPI } from '../../services/api'
import styles from './Predict.module.css'

// Full 2025 F1 driver list with team colours for visual identification
// TODO: fetch driver list dynamically from OpenF1 API
const drivers = [
  { id: 1, code: 'VER', name: 'Verstappen', team: 'Red Bull Racing', colour: '#3671C6' },
  { id: 2, code: 'NOR', name: 'Norris', team: 'McLaren', colour: '#FF8000' },
  { id: 3, code: 'LEC', name: 'Leclerc', team: 'Ferrari', colour: '#E8002D' },
  { id: 4, code: 'PIA', name: 'Piastri', team: 'McLaren', colour: '#FF8000' },
  { id: 5, code: 'HAM', name: 'Hamilton', team: 'Ferrari', colour: '#E8002D' },
  { id: 6, code: 'RUS', name: 'Russell', team: 'Mercedes', colour: '#27F4D2' },
  { id: 7, code: 'SAI', name: 'Sainz', team: 'Williams', colour: '#64C4FF' },
  { id: 8, code: 'ANT', name: 'Antonelli', team: 'Mercedes', colour: '#27F4D2' },
  { id: 9, code: 'ALO', name: 'Alonso', team: 'Aston Martin', colour: '#229971' },
  { id: 10, code: 'STR', name: 'Stroll', team: 'Aston Martin', colour: '#229971' },
  { id: 11, code: 'TSU', name: 'Tsunoda', team: 'Red Bull Racing', colour: '#3671C6' },
  { id: 12, code: 'HAD', name: 'Hadjar', team: 'Racing Bulls', colour: '#6692FF' },
  { id: 13, code: 'HUL', name: 'Hulkenberg', team: 'Sauber', colour: '#52E252' },
  { id: 14, code: 'BOR', name: 'Bortoleto', team: 'Sauber', colour: '#52E252' },
  { id: 15, code: 'OCO', name: 'Ocon', team: 'Haas', colour: '#B6BABD' },
  { id: 16, code: 'BEA', name: 'Bearman', team: 'Haas', colour: '#B6BABD' },
  { id: 17, code: 'GAS', name: 'Gasly', team: 'Alpine', colour: '#FF87BC' },
  { id: 18, code: 'DOO', name: 'Doohan', team: 'Alpine', colour: '#FF87BC' },
  { id: 19, code: 'ALB', name: 'Albon', team: 'Williams', colour: '#64C4FF' },
  { id: 20, code: 'LAW', name: 'Lawson', team: 'Racing Bulls', colour: '#6692FF' },
]

const POSITIONS = 10

function Predict() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [predictions, setPredictions] = useState(Array(POSITIONS).fill(null))
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  // Load session info and any existing predictions
  useEffect(() => {
    async function load() {
      try {
        const [sessionData, existingPredictions] = await Promise.all([
          sessionAPI.getOne(sessionId),
          predictionAPI.getForSession(sessionId),
        ])

        setSession(sessionData)

        // If user has already submitted predictions, pre-fill the slots
        if (existingPredictions.length > 0) {
          const filled = Array(POSITIONS).fill(null)
          for (const pred of existingPredictions) {
            const driver = drivers.find(d => d.code === pred.driver_code)
            if (driver && pred.position <= POSITIONS) {
              filled[pred.position - 1] = driver
            }
          }
          setPredictions(filled)
          setAlreadySubmitted(true)
        }
      } catch (err) {
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const assignedIds = predictions.filter(Boolean).map(d => d.id)

  const handleSelect = (position, driver) => {
    const updated = [...predictions]
    updated[position] = driver
    setPredictions(updated)
  }

  const handleRemove = (position) => {
    const updated = [...predictions]
    updated[position] = null
    setPredictions(updated)
  }

  const handleSubmit = async () => {
    if (predictions.some(p => p === null)) return
    setSubmitting(true)
    try {
      // Format predictions for the API
      const payload = predictions.map((driver, i) => ({
        position: i + 1,
        driver_code: driver.code,
      }))
      await predictionAPI.submit(sessionId, payload)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const allFilled = predictions.every(p => p !== null)

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

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✓</div>
          <h2>Predictions submitted!</h2>
          <p>Your predictions for {session?.session_type} — {session?.race_name} have been locked in.</p>
          <Link to="/dashboard" className={styles.btnPrimary}>Back to dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Session header with back link and session details */}
        <div className={styles.sessionHeader}>
          <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
          <div className={styles.sessionInfo}>
            <div>
              <h1>{session?.race_name} <span>— {session?.session_type}</span></h1>
              <p>Round {session?.round} · {new Date(session?.scheduled_at).toLocaleString()} · Predict the top {POSITIONS} positions</p>
            </div>
          </div>
        </div>

        {/* Two column layout */}
        <div className={styles.grid}>

          {/* Left column - prediction slots */}
          <div className={styles.predictionSection}>
            <h2>Your predictions</h2>
            <p className={styles.hint}>Select a driver from the panel for each position</p>
            <div className={styles.slots}>
              {predictions.map((driver, i) => (
                <div key={i} className={`${styles.slot} ${driver ? styles.slotFilled : styles.slotEmpty}`}>
                  <span className={styles.slotPos}>P{i + 1}</span>
                  {driver ? (
                    <>
                      <span className={styles.driverColour} style={{ backgroundColor: driver.colour }} />
                      <span className={styles.slotCode}>{driver.code}</span>
                      <span className={styles.slotName}>{driver.name}</span>
                      <span className={styles.slotTeam}>{driver.team}</span>
                      <button className={styles.removeBtn} onClick={() => handleRemove(i)}>✕</button>
                    </>
                  ) : (
                    <span className={styles.slotPlaceholder}>Select a driver</span>
                  )}
                </div>
              ))}
            </div>

            {/* Submit button */}
            <button
            className={`${styles.btnSubmit} ${!allFilled || submitting || alreadySubmitted ? styles.btnDisabled : ''}`}
            onClick={handleSubmit}
            disabled={!allFilled || submitting || alreadySubmitted}
            >
              {submitting
              ? 'Submitting...'
              : alreadySubmitted
              ? 'Predictions already submitted'
              : allFilled
              ? 'Submit predictions'
              : `${predictions.filter(Boolean).length} / ${POSITIONS} positions filled`}
            </button>
          </div>

          {/* Right column - driver panel */}
          <div className={styles.driverPanel}>
            <h2>Drivers</h2>
            <p className={styles.hint}>{drivers.length - assignedIds.length} remaining</p>
            <div className={styles.driverList}>
              {drivers.map(driver => {
                const isUsed = assignedIds.includes(driver.id)
                return (
                  <div key={driver.id} className={`${styles.driverCard} ${isUsed ? styles.driverUsed : ''}`}>
                    <span className={styles.teamColour} style={{ backgroundColor: driver.colour }} />
                    <div className={styles.driverInfo}>
                      <span className={styles.driverCode}>{driver.code}</span>
                      <span className={styles.driverName}>{driver.name}</span>
                      <span className={styles.driverTeam}>{driver.team}</span>
                    </div>
                    {!isUsed && (
                      <div className={styles.posButtons}>
                        {predictions.map((slot, i) => (
                          <button
                            key={i}
                            className={`${styles.posBtn} ${slot !== null ? styles.posBtnTaken : ''}`}
                            onClick={() => !slot && handleSelect(i, driver)}
                            disabled={slot !== null}
                            title={slot ? `P${i + 1} taken` : `Place at P${i + 1}`}
                          >
                            P{i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                    {isUsed && <span className={styles.usedLabel}>Added</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Predict