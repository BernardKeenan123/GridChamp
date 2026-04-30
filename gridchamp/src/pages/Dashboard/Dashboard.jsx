import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  sessionAPI,
  scoreAPI,
  leaderboardAPI,
  leagueAPI,
} from "../../services/api";
import styles from "./Dashboard.module.css";

function groupByRaceWeekend(sessions) {
  const groups = {};
  for (const session of sessions) {
    if (!groups[session.race_name]) {
      groups[session.race_name] = {
        race_name: session.race_name,
        round: session.round,
        sessions: [],
      };
    }
    groups[session.race_name].sessions.push(session);
  }
  return Object.values(groups).sort((a, b) => a.round - b.round);
}

function toUTC(dateStr) {
  if (!dateStr) return null
  const normalised = dateStr.replace(' ', 'T')
  return new Date(normalised.endsWith('Z') ? normalised : normalised + 'Z')
}

function getWeekendStatus(weekend) {
  const now = new Date()

  const allCompleted = weekend.sessions.every((s) => s.completed)
  if (allCompleted) return 'completed'

  const closeAt = weekend.sessions[0]?.predictions_close_at || weekend.sessions[0]?.scheduled_at
  const isLocked = closeAt ? now > toUTC(closeAt) : false

  if (isLocked) return 'live'

  return 'open'
}

function RaceWeekendCard({ weekend }) {
  const status = getWeekendStatus(weekend);
  const sessionCount = weekend.sessions.length;

  // Use the last session of the weekend for the results link
  const lastSession = weekend.sessions[weekend.sessions.length - 1];

  const statusLabel = {
    open: "Predictions open",
    live: "● Live",
    completed: "Results available",
  }[status];

  const statusClass = {
    open: styles.statusOpen,
    live: styles.statusLive,
    completed: styles.statusCompleted,
  }[status];

  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionLeft}>
        <span className={styles.flag}>🏁</span>
        <div>
          <div className={styles.sessionRace}>{weekend.race_name}</div>
          <div className={styles.sessionMeta}>
            Round {weekend.round} · {sessionCount} session
            {sessionCount !== 1 ? "s" : ""} ·{" "}
            <span className={statusClass}>{statusLabel}</span>
          </div>
        </div>
      </div>
      <div className={styles.sessionRight}>
        {status === "completed" ? (
          <Link to={`/results/${lastSession.id}`} className={styles.btnResults}>
            View results
          </Link>
        ) : (
          <Link to={`/weekend/${weekend.round}`} className={styles.btnPredict}>
            View sessions
          </Link>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [weekends, setWeekends] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [globalRank, setGlobalRank] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [sessionsData, scoreData, leaderboardData, leaguesData] =
          await Promise.all([
            sessionAPI.getAll(),
            scoreAPI.getMyTotal(),
            leaderboardAPI.getGlobal(),
            leagueAPI.getMyLeagues(),
          ]);

        // Show all sessions - completed ones show results, upcoming show predict
        const grouped = groupByRaceWeekend(sessionsData);
        setWeekends(grouped);
        setTotalPoints(scoreData.total);
        setLeagues(leaguesData);

        const userRank = leaderboardData.findIndex((u) => u.id === user.id) + 1;
        setGlobalRank(userRank || null);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user.id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const upcomingCount = weekends.filter(
    (w) => getWeekendStatus(w) !== "completed"
  ).length;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <h1>
              Welcome back, <span>{user?.username}</span>
            </h1>
            <p>
              {upcomingCount} upcoming race weekend
              {upcomingCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalPoints}</span>
              <span className={styles.statLabel}>Total points</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {globalRank ? `#${globalRank}` : "-"}
              </span>
              <span className={styles.statLabel}>Global rank</span>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.section}>
            <h2>Race weekends</h2>
            <div className={styles.sessionList}>
              {weekends.length > 0 ? (
                weekends.map((w) => (
                  <RaceWeekendCard key={w.round} weekend={w} />
                ))
              ) : (
                <p style={{ color: "var(--color-text-secondary)" }}>
                  No race weekends available.
                </p>
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.widget}>
              <h3>Your leagues</h3>
              {leagues.length > 0 ? (
                <div className={styles.leagueList}>
                  {leagues.map((l) => (
                    <div key={l.id} className={styles.leagueRow}>
                      <div className={styles.leagueName}>{l.name}</div>
                      <div className={styles.leagueRight}>
                        <span className={styles.leagueRank}>
                          {l.member_count} members
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  You haven't joined any leagues yet.
                </p>
              )}
              <Link to="/leagues" className={styles.viewAll}>
                Manage leagues →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;