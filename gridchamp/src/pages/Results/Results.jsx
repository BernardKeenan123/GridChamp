import { Link } from 'react-router-dom'
import styles from './Results.module.css'

// TODO: replace mock data with real data fetched from /api/predictions/:sessionId
// and /api/scores/session/:sessionId once backend is connected

// Mock session info - will be fetched from /api/sessions/:id
const sessionInfo = {
  race: 'Saudi Arabian GP',
  round: 4,
  type: 'Race',
  date: 'Sun 20 Apr',
  flag: '🇸🇦',
}

// Mock results array combining official finishing positions with the user's predictions
// In production this will be joined data from the results and predictions tables
const results = [
  { pos: 1, code: 'NOR', name: 'Norris', team: 'McLaren', colour: '#FF8000', predictedPos: 2 },
  { pos: 2, code: 'VER', name: 'Verstappen', team: 'Red Bull Racing', colour: '#3671C6', predictedPos: 1 },
  { pos: 3, code: 'LEC', name: 'Leclerc', team: 'Ferrari', colour: '#E8002D', predictedPos: 3 },
  { pos: 4, code: 'PIA', name: 'Piastri', team: 'McLaren', colour: '#FF8000', predictedPos: 5 },
  { pos: 5, code: 'HAM', name: 'Hamilton', team: 'Ferrari', colour: '#E8002D', predictedPos: 4 },
  { pos: 6, code: 'RUS', name: 'Russell', team: 'Mercedes', colour: '#27F4D2', predictedPos: 6 },
  { pos: 7, code: 'SAI', name: 'Sainz', team: 'Williams', colour: '#64C4FF', predictedPos: 8 },
  { pos: 8, code: 'ALO', name: 'Alonso', team: 'Aston Martin', colour: '#229971', predictedPos: 7 },
  { pos: 9, code: 'TSU', name: 'Tsunoda', team: 'Red Bull Racing', colour: '#3671C6', predictedPos: 10 },
  { pos: 10, code: 'ANT', name: 'Antonelli', team: 'Mercedes', colour: '#27F4D2', predictedPos: 9 },
]

// Points awarded based on how close the prediction was to the actual result
const pointsPerPosition = {
  exact: 10,   // Predicted position exactly correct
  oneOff: 6,   // Predicted position was 1 place out
  twoOff: 3,   // Predicted position was 2 places out
  inTop10: 1,  // Driver was predicted somewhere in top 10 but position was wrong
}

// Calculate points and label for a single prediction based on predicted vs actual position
function getScore(predicted, actual) {
  const diff = Math.abs(predicted - actual)
  if (diff === 0) return { points: pointsPerPosition.exact, label: 'Exact', type: 'exact' }
  if (diff === 1) return { points: pointsPerPosition.oneOff, label: '±1', type: 'close' }
  if (diff === 2) return { points: pointsPerPosition.twoOff, label: '±2', type: 'close' }
  return { points: pointsPerPosition.inTop10, label: 'In top 10', type: 'partial' }
}

function Results() {
  // Calculate the user's total points for this session by summing all individual scores
  const totalScore = results.reduce((sum, r) => sum + getScore(r.predictedPos, r.pos).points, 0)

  // Count how many predictions were exactly correct
  const exactCount = results.filter(r => r.predictedPos === r.pos).length

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Page header with back link and session details */}
        <div className={styles.header}>
          <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
          <div className={styles.sessionInfo}>
            <span className={styles.flag}>{sessionInfo.flag}</span>
            <div>
              <h1>{sessionInfo.race} <span>— {sessionInfo.type}</span></h1>
              <p>Round {sessionInfo.round} · {sessionInfo.date} · Final results</p>
            </div>
          </div>
        </div>

        {/* Score summary card showing total points and breakdown stats */}
        <div className={styles.scoreSummary}>
          <div className={styles.scoreMain}>
            <span className={styles.scoreValue}>+{totalScore}</span>
            <span className={styles.scoreLabel}>points earned</span>
          </div>
          <div className={styles.scoreMeta}>
            <div className={styles.metaStat}>
              <span className={styles.metaValue}>{exactCount}</span>
              <span className={styles.metaLabel}>Exact predictions</span>
            </div>
            <div className={styles.metaStat}>
              {/* Partial predictions = total positions minus exact hits */}
              <span className={styles.metaValue}>{results.length - exactCount}</span>
              <span className={styles.metaLabel}>Partial predictions</span>
            </div>
            <div className={styles.metaStat}>
              {/* TODO: replace hardcoded rank with real session rank from /api/scores/session/:id */}
              <span className={styles.metaValue}>#3</span>
              <span className={styles.metaLabel}>Session rank</span>
            </div>
          </div>
        </div>

        {/* Scoring key explaining how points are awarded */}
        <div className={styles.scoringKey}>
          <span className={styles.keyLabel}>Scoring:</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.exact}`}>Exact</span> +10 pts</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.close}`}>±1</span> +6 pts</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.close}`}>±2</span> +3 pts</span>
          <span className={styles.keyItem}><span className={`${styles.keyBadge} ${styles.partial}`}>In top 10</span> +1 pt</span>
        </div>

        {/* Results table comparing official finishing positions to user's predictions */}
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span>Pos</span>
            <span>Driver</span>
            <span>Your prediction</span>
            <span>Points</span>
          </div>

          {results.map((r) => {
            // Calculate the score for this individual result row
            const score = getScore(r.predictedPos, r.pos)
            return (
              <div
                key={r.pos}
                // Apply green left border highlight for exact predictions
                className={`${styles.tableRow} ${r.predictedPos === r.pos ? styles.rowExact : ''}`}
              >
                {/* Official finishing position */}
                <span className={styles.pos}>{r.pos}</span>

                {/* Driver info with team colour bar */}
                <div className={styles.driver}>
                  <span className={styles.teamBar} style={{ backgroundColor: r.colour }} />
                  <span className={styles.code}>{r.code}</span>
                  <div className={styles.driverDetails}>
                    <span className={styles.name}>{r.name}</span>
                    <span className={styles.team}>{r.team}</span>
                  </div>
                </div>

                {/* User's predicted position and accuracy badge */}
                <div className={styles.prediction}>
                  <span className={styles.predictedPos}>P{r.predictedPos}</span>
                  {/* Badge colour reflects accuracy - exact, close or partial */}
                  <span className={`${styles.badge} ${styles[score.type]}`}>{score.label}</span>
                </div>

                {/* Points awarded for this prediction */}
                <span className={styles.points}>+{score.points}</span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default Results