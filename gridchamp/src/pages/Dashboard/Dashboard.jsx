import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'

// TODO: replace all mock data below with real API calls to the backend

// Mock upcoming sessions - will be fetched from /api/sessions
const upcomingSessions = [
  { id: 1, round: 6, race: 'Miami Grand Prix', flag: '🇺🇸', type: 'Qualifying', date: 'Sat 3 May', time: '22:00', locked: false },
  { id: 2, round: 6, race: 'Miami Grand Prix', flag: '🇺🇸', type: 'Race', date: 'Sun 4 May', time: '21:00', locked: false },
  { id: 3, round: 7, race: 'Emilia Romagna Grand Prix', flag: '🇮🇹', type: 'Qualifying', date: 'Sat 17 May', time: '15:00', locked: false },
]

// Mock recent results - will be fetched from /api/scores/me
const recentResults = [
  { id: 10, race: 'Saudi Arabian GP', type: 'Race', score: 42, maxScore: 60, position: 3 },
  { id: 9, race: 'Saudi Arabian GP', type: 'Qualifying', score: 28, maxScore: 40, position: 5 },
  { id: 8, race: 'Bahrain GP', type: 'Race', score: 55, maxScore: 60, position: 1 },
]

// Mock league standings - will be fetched from /api/leagues/me
const leagueStandings = [
  { name: 'Global', rank: 142, total: 8420 },
  { name: 'Family League', rank: 2, total: 12 },
  { name: 'Uni Mates', rank: 1, total: 8 },
]

// SessionCard displays a single upcoming session with a predict or locked button
function SessionCard({ session }) {
  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionLeft}>
        <span className={styles.flag}>{session.flag}</span>
        <div>
          <div className={styles.sessionRace}>{session.race}</div>
          <div className={styles.sessionMeta}>
            Round {session.round} · {session.type} · {session.date} at {session.time}
          </div>
        </div>
      </div>
      <div className={styles.sessionRight}>
        {/* Show locked label if session has started, otherwise show predict button */}
        {session.locked
          ? <span className={styles.locked}>Locked</span>
          : <Link to={`/predict/${session.id}`} className={styles.btnPredict}>Predict</Link>
        }
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Page header with welcome message and summary stats */}
        <div className={styles.header}>
          <div>
            {/* TODO: replace hardcoded name with logged in user's username from auth context */}
            <h1>Welcome back, <span>Bernard</span></h1>
            <p>You have {upcomingSessions.length} upcoming sessions to predict</p>
          </div>

          {/* Summary stats - total points, predictions made, global rank */}
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              {/* TODO: replace with real total points from /api/scores/me */}
              <span className={styles.statValue}>247</span>
              <span className={styles.statLabel}>Total points</span>
            </div>
            <div className={styles.stat}>
              {/* TODO: replace with real prediction count from backend */}
              <span className={styles.statValue}>12</span>
              <span className={styles.statLabel}>Predictions made</span>
            </div>
            <div className={styles.stat}>
              {/* TODO: replace with real global rank from /api/leaderboard */}
              <span className={styles.statValue}>#142</span>
              <span className={styles.statLabel}>Global rank</span>
            </div>
          </div>
        </div>

        {/* Two column layout - upcoming sessions on left, sidebar widgets on right */}
        <div className={styles.grid}>

          {/* Upcoming sessions list */}
          <div className={styles.section}>
            <h2>Upcoming sessions</h2>
            <div className={styles.sessionList}>
              {upcomingSessions.map(s => <SessionCard key={s.id} session={s} />)}
            </div>
          </div>

          {/* Sidebar with recent scores and league standings */}
          <div className={styles.sidebar}>

            {/* Recent scores widget */}
            <div className={styles.widget}>
              <h3>Recent scores</h3>
              <div className={styles.resultList}>
                {recentResults.map(r => (
                  <div key={r.id} className={styles.resultRow}>
                    <div>
                      <div className={styles.resultName}>{r.race}</div>
                      <div className={styles.resultMeta}>{r.type}</div>
                    </div>
                    <div className={styles.resultRight}>
                      <span className={styles.resultScore}>+{r.score} pts</span>
                      {/* Position in the session leaderboard */}
                      <span className={styles.resultRank}>P{r.position}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/results/10" className={styles.viewAll}>View all results →</Link>
            </div>

            {/* League standings widget */}
            <div className={styles.widget}>
              <h3>Your leagues</h3>
              <div className={styles.leagueList}>
                {leagueStandings.map(l => (
                  <div key={l.name} className={styles.leagueRow}>
                    <div className={styles.leagueName}>{l.name}</div>
                    <div className={styles.leagueRight}>
                      {/* User's rank within the league */}
                      <span className={styles.leagueRank}>#{l.rank}</span>
                      <span className={styles.leagueTotal}>of {l.total}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/leagues" className={styles.viewAll}>Manage leagues →</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard