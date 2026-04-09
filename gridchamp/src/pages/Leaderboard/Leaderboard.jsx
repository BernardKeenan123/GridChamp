import { useState } from 'react'
import styles from './Leaderboard.module.css'

// TODO: replace mock data with real API call to /api/leaderboard

// Mock global standings data - includes a divider row to show the user's position
// relative to the top 10 without listing every rank in between
const globalStandings = [
  { rank: 1, username: 'gridmaster99', points: 892, predictions: 24, exactHits: 18 },
  { rank: 2, username: 'f1prophet', points: 871, predictions: 24, exactHits: 15 },
  { rank: 3, username: 'apex_predictor', points: 845, predictions: 23, exactHits: 14 },
  { rank: 4, username: 'pitlane_paul', points: 820, predictions: 24, exactHits: 13 },
  { rank: 5, username: 'checo_fan_mx', points: 798, predictions: 22, exactHits: 12 },
  { rank: 6, username: 'tifosi_marco', points: 776, predictions: 24, exactHits: 11 },
  { rank: 7, username: 'hamilfan44', points: 754, predictions: 23, exactHits: 11 },
  { rank: 8, username: 'norris_army', points: 731, predictions: 22, exactHits: 10 },
  { rank: 9, username: 'redbull_spy', points: 718, predictions: 24, exactHits: 9 },
  { rank: 10, username: 'podium_hunter', points: 702, predictions: 21, exactHits: 9 },
  // Divider row to indicate skipped ranks between top 10 and the current user
  { rank: 141, username: '...', points: null, predictions: null, exactHits: null, divider: true },
  // Current user's row - flagged with isUser so it can be highlighted
  { rank: 142, username: 'Bernard', points: 247, predictions: 12, exactHits: 4, isUser: true },
  { rank: 143, username: 'racefan_uk', points: 241, predictions: 11, exactHits: 3 },
]

// Round filter options - allows users to view standings for a specific race weekend
// TODO: populate dynamically from /api/sessions once backend is connected
const rounds = [
  { label: 'All rounds', value: 'all' },
  { label: 'Bahrain GP', value: '1' },
  { label: 'Saudi Arabian GP', value: '4' },
  { label: 'Miami GP', value: '6' },
]

function Leaderboard() {
  // Track which round filter is currently active
  const [activeRound, setActiveRound] = useState('all')

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Page header with title and the current user's global rank */}
        <div className={styles.header}>
          <div>
            <h1>Global leaderboard</h1>
            {/* Subtract 2 to exclude the divider row and avoid miscounting */}
            <p>Rankings across all {globalStandings.filter(r => !r.divider).length - 2} participants</p>
          </div>
          {/* TODO: replace hardcoded rank with real rank from /api/leaderboard */}
          <div className={styles.yourRank}>
            <span className={styles.yourRankValue}>#142</span>
            <span className={styles.yourRankLabel}>Your global rank</span>
          </div>
        </div>

        {/* Round filter buttons - highlights the active selection */}
        <div className={styles.filters}>
          {rounds.map(r => (
            <button
              key={r.value}
              className={`${styles.filterBtn} ${activeRound === r.value ? styles.filterActive : ''}`}
              onClick={() => setActiveRound(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Leaderboard table */}
        <div className={styles.tableWrapper}>

          {/* Column headers */}
          <div className={styles.tableHeader}>
            <span>Rank</span>
            <span>Player</span>
            <span>Predictions</span>
            <span>Exact hits</span>
            <span>Points</span>
          </div>

          {globalStandings.map((row, i) => {
            // Render a divider row to indicate skipped ranks
            if (row.divider) {
              return (
                <div key={i} className={styles.dividerRow}>
                  <span>···</span>
                </div>
              )
            }

            return (
              <div
                key={row.rank}
                // Highlight the current user's row and top 3 rows differently
                className={`${styles.tableRow} ${row.isUser ? styles.userRow : ''} ${row.rank <= 3 ? styles.topRow : ''}`}
              >
                {/* Show medal emoji for top 3, otherwise show rank number */}
                <span className={`${styles.rank} ${row.rank === 1 ? styles.gold : row.rank === 2 ? styles.silver : row.rank === 3 ? styles.bronze : ''}`}>
                  {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
                </span>

                {/* Username with a "You" tag if this is the current user's row */}
                <span className={`${styles.username} ${row.isUser ? styles.userHighlight : ''}`}>
                  {row.username} {row.isUser && <span className={styles.youTag}>You</span>}
                </span>

                <span className={styles.cell}>{row.predictions}</span>
                <span className={styles.cell}>{row.exactHits}</span>

                {/* Highlight the user's points in primary colour */}
                <span className={`${styles.cell} ${styles.points} ${row.isUser ? styles.userPoints : ''}`}>
                  {row.points}
                </span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default Leaderboard