import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import styles from './Predict.module.css'

// TODO: replace mock session info with real data fetched from /api/sessions/:id
const sessionInfo = {
  race: 'Miami Grand Prix',
  round: 6,
  type: 'Qualifying',
  date: 'Sat 3 May',
  time: '22:00 BST',
  flag: '🇺🇸',
  positions: 10,
}

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

function Predict() {
  // Get the session ID from the URL params e.g. /predict/1
  const { sessionId } = useParams()

  // Predictions array holds one slot per position, initialised as null (empty)
  const [predictions, setPredictions] = useState(
    Array(sessionInfo.positions).fill(null)
  )

  // Tracks whether the user has successfully submitted their predictions
  const [submitted, setSubmitted] = useState(false)

  // Get the IDs of drivers already assigned to a position
  const assignedIds = predictions.filter(Boolean).map(d => d.id)

  // Filter out assigned drivers so they can't be selected twice
  const availableDrivers = drivers.filter(d => !assignedIds.includes(d.id))

  // Assign a driver to a specific position index
  const handleSelect = (position, driver) => {
    const updated = [...predictions]
    updated[position] = driver
    setPredictions(updated)
  }

  // Remove a driver from a specific position, returning the slot to empty
  const handleRemove = (position) => {
    const updated = [...predictions]
    updated[position] = null
    setPredictions(updated)
  }

  const handleSubmit = () => {
    // Guard against submitting with unfilled positions
    if (predictions.some(p => p === null)) return

    // TODO: POST predictions to /api/predictions/:sessionId
    console.log('Submitting predictions:', predictions)
    setSubmitted(true)
  }

  // Only allow submission once all positions have been filled
  const allFilled = predictions.every(p => p !== null)

  // Show success confirmation screen after submission
  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✓</div>
          <h2>Predictions submitted!</h2>
          <p>Your predictions for {sessionInfo.type} — {sessionInfo.race} have been locked in.</p>
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
            <span className={styles.flag}>{sessionInfo.flag}</span>
            <div>
              <h1>{sessionInfo.race} <span>— {sessionInfo.type}</span></h1>
              <p>Round {sessionInfo.round} · {sessionInfo.date} at {sessionInfo.time} · Predict the top {sessionInfo.positions} positions</p>
            </div>
          </div>
        </div>

        {/* Two column layout - prediction slots on left, driver panel on right */}
        <div className={styles.grid}>

          {/* Left column - ordered prediction slots for each position */}
          <div className={styles.predictionSection}>
            <h2>Your predictions</h2>
            <p className={styles.hint}>Select a driver from the panel for each position</p>
            <div className={styles.slots}>
              {predictions.map((driver, i) => (
                <div key={i} className={`${styles.slot} ${driver ? styles.slotFilled : styles.slotEmpty}`}>
                  <span className={styles.slotPos}>P{i + 1}</span>
                  {driver ? (
                    <>
                      {/* Team colour bar for visual identification */}
                      <span
                        className={styles.driverColour}
                        style={{ backgroundColor: driver.colour }}
                      />
                      <span className={styles.slotCode}>{driver.code}</span>
                      <span className={styles.slotName}>{driver.name}</span>
                      <span className={styles.slotTeam}>{driver.team}</span>
                      {/* Remove button to clear this position */}
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemove(i)}
                      >✕</button>
                    </>
                  ) : (
                    <span className={styles.slotPlaceholder}>Select a driver</span>
                  )}
                </div>
              ))}
            </div>

            {/* Submit button - disabled until all positions are filled */}
            <button
              className={`${styles.btnSubmit} ${!allFilled ? styles.btnDisabled : ''}`}
              onClick={handleSubmit}
              disabled={!allFilled}
            >
              {/* Show progress count instead of submit text until all slots are filled */}
              {allFilled ? 'Submit predictions' : `${predictions.filter(Boolean).length} / ${sessionInfo.positions} positions filled`}
            </button>
          </div>

          {/* Right column - full driver list with position assignment buttons */}
          <div className={styles.driverPanel}>
            <h2>Drivers</h2>
            <p className={styles.hint}>{availableDrivers.length} remaining</p>
            <div className={styles.driverList}>
              {drivers.map(driver => {
                const isUsed = assignedIds.includes(driver.id)
                return (
                  <div
                    key={driver.id}
                    // Dim the driver card once they have been assigned to a position
                    className={`${styles.driverCard} ${isUsed ? styles.driverUsed : ''}`}
                  >
                    {/* Team colour bar */}
                    <span
                      className={styles.teamColour}
                      style={{ backgroundColor: driver.colour }}
                    />
                    <div className={styles.driverInfo}>
                      <span className={styles.driverCode}>{driver.code}</span>
                      <span className={styles.driverName}>{driver.name}</span>
                      <span className={styles.driverTeam}>{driver.team}</span>
                    </div>

                    {/* Show position buttons if driver hasn't been assigned yet */}
                    {!isUsed && (
                      <div className={styles.posButtons}>
                        {predictions.map((slot, i) => (
                          <button
                            key={i}
                            // Grey out position buttons that are already taken
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

                    {/* Show Added label once driver has been placed in a slot */}
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