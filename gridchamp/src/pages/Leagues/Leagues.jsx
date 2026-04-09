import { useState } from 'react'
import styles from './Leagues.module.css'

// TODO: replace all mock data with real API calls to the backend

// Mock data for the user's leagues - will be fetched from /api/leagues/me
const myLeagues = [
  {
    id: 1, name: 'Family League', code: 'FAM-2025',
    rank: 2, members: 12, points: 247, leader: 'dad_f1fan', leaderPoints: 312,
  },
  {
    id: 2, name: 'Uni Mates', code: 'UNI-884',
    rank: 1, members: 8, points: 247, leader: 'Bernard', leaderPoints: 247,
  },
]

// Mock standings for the selected league - will be fetched from /api/leagues/:id/standings
const leagueStandings = [
  { rank: 1, username: 'dad_f1fan', points: 312, isUser: false },
  { rank: 2, username: 'Bernard', points: 247, isUser: true },
  { rank: 3, username: 'mum_racing', points: 198, isUser: false },
  { rank: 4, username: 'sister_norris', points: 176, isUser: false },
]

function Leagues() {
  // Track which league is currently selected to show its standings
  const [activeLeague, setActiveLeague] = useState(myLeagues[0])

  // Control visibility of the create and join league forms
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  // Track input values for create and join forms
  const [newLeagueName, setNewLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Page header with title and create/join action buttons */}
        <div className={styles.header}>
          <div>
            <h1>Mini leagues</h1>
            <p>Compete in private leagues with friends and family</p>
          </div>
          <div className={styles.headerActions}>
            {/* Toggle join form, close create form if open */}
            <button className={styles.btnOutline} onClick={() => { setShowJoin(true); setShowCreate(false) }}>
              Join a league
            </button>
            {/* Toggle create form, close join form if open */}
            <button className={styles.btnPrimary} onClick={() => { setShowCreate(true); setShowJoin(false) }}>
              Create league
            </button>
          </div>
        </div>

        {/* Create league form - shown when user clicks Create league */}
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
              {/* TODO: connect to POST /api/leagues to create league and generate invite code */}
              <button className={styles.btnPrimary} onClick={() => setShowCreate(false)}>
                Create
              </button>
            </div>
          </div>
        )}

        {/* Join league form - shown when user clicks Join a league */}
        {showJoin && (
          <div className={styles.formCard}>
            <h3>Join a league</h3>
            <p>Enter the invite code shared by the league creator.</p>
            <div className={styles.formRow}>
              <input
                type="text"
                placeholder="e.g. FAM-2025"
                value={joinCode}
                // Force uppercase so codes are consistent regardless of how user types them
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className={styles.input}
              />
              {/* TODO: connect to POST /api/leagues/join with the entered code */}
              <button className={styles.btnPrimary} onClick={() => setShowJoin(false)}>
                Join
              </button>
            </div>
          </div>
        )}

        {/* Two column layout - league list on left, standings panel on right */}
        <div className={styles.grid}>

          {/* Left column - list of leagues the user belongs to */}
          <div className={styles.leagueList}>
            <h2>Your leagues</h2>
            {myLeagues.map(league => (
              <div
                key={league.id}
                // Highlight the currently selected league
                className={`${styles.leagueCard} ${activeLeague.id === league.id ? styles.leagueActive : ''}`}
                onClick={() => setActiveLeague(league)}
              >
                <div className={styles.leagueCardTop}>
                  <span className={styles.leagueName}>{league.name}</span>
                  <span className={styles.leagueRank}>#{league.rank}</span>
                </div>
                <div className={styles.leagueCardMeta}>
                  <span>{league.members} members</span>
                  <span>Code: <strong>{league.code}</strong></span>
                </div>
                <div className={styles.leagueCardBottom}>
                  <span className={styles.leaguePoints}>{league.points} pts</span>
                  {/* Show trophy and leading message if user is in first place */}
                  <span className={styles.leagueLed}>
                    {league.rank === 1 ? '🏆 Leading' : `Leader: ${league.leader} (${league.leaderPoints})`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right column - standings table for the selected league */}
          <div className={styles.standingsPanel}>
            <div className={styles.standingsHeader}>
              <h2>{activeLeague.name}</h2>
              {/* Show invite code so the user can share it easily */}
              <span className={styles.leagueCode}>Invite code: <strong>{activeLeague.code}</strong></span>
            </div>

            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>
                <span>Rank</span>
                <span>Player</span>
                <span>Points</span>
              </div>
              {leagueStandings.map(row => (
                <div
                  key={row.rank}
                  // Highlight the current user's row
                  className={`${styles.tableRow} ${row.isUser ? styles.userRow : ''}`}
                >
                  {/* Show medal emoji for top 3, otherwise show rank number */}
                  <span className={styles.rank}>
                    {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
                  </span>

                  {/* Username with You tag if this is the current user */}
                  <span className={`${styles.username} ${row.isUser ? styles.userHighlight : ''}`}>
                    {row.username}
                    {row.isUser && <span className={styles.youTag}>You</span>}
                  </span>

                  {/* Highlight user's points in primary colour */}
                  <span className={`${styles.points} ${row.isUser ? styles.userPoints : ''}`}>
                    {row.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Leagues