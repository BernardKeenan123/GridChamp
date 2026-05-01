import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  sessionAPI,
  predictionAPI,
  scoreAPI,
  leagueAPI,
} from "../../services/api";
import styles from "./Results.module.css";

// F1 points awarded per position for exact predictions
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// Returns score details if the user predicted a driver's position exactly
function getScore(predictedCode, predictions, actualResults) {
  const pred = predictions.find((p) => p.driver_code === predictedCode);
  const actual = actualResults.find((r) => r.driver_code === predictedCode);
  if (!pred || !actual) return null;
  if (pred.position === actual.position) {
    const points = F1_POINTS[actual.position - 1] || 0;
    return { points, label: "Exact", type: "exact" };
  }
  return null;
}

// Team colours for displaying driver results
const driverInfo = {
  VER: { team: "Red Bull Racing", colour: "#3671C6" },
  HAD: { team: "Red Bull Racing", colour: "#3671C6" },
  NOR: { team: "McLaren", colour: "#FF8000" },
  PIA: { team: "McLaren", colour: "#FF8000" },
  LEC: { team: "Ferrari", colour: "#E8002D" },
  HAM: { team: "Ferrari", colour: "#E8002D" },
  RUS: { team: "Mercedes", colour: "#27F4D2" },
  ANT: { team: "Mercedes", colour: "#27F4D2" },
  SAI: { team: "Williams", colour: "#64C4FF" },
  ALB: { team: "Williams", colour: "#64C4FF" },
  ALO: { team: "Aston Martin", colour: "#229971" },
  STR: { team: "Aston Martin", colour: "#229971" },
  OCO: { team: "Haas", colour: "#B6BABD" },
  BEA: { team: "Haas", colour: "#B6BABD" },
  GAS: { team: "Alpine", colour: "#FF87BC" },
  COL: { team: "Alpine", colour: "#FF87BC" },
  LAW: { team: "Racing Bulls", colour: "#6692FF" },
  LIN: { team: "Racing Bulls", colour: "#6692FF" },
  HUL: { team: "Audi", colour: "#C0C0C0" },
  BOR: { team: "Audi", colour: "#C0C0C0" },
  BOT: { team: "Cadillac", colour: "#CC0000" },
  PER: { team: "Cadillac", colour: "#CC0000" },
};

function Results() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [actualResults, setActualResults] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [sessionScore, setSessionScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // League selector — null means global predictions
  const [userLeagues, setUserLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  // Load session info, actual results from OpenF1, and user's leagues on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const [sessionData, leaguesData] = await Promise.all([
          sessionAPI.getOne(sessionId),
          leagueAPI.getMyLeagues(),
        ]);
        setSession(sessionData);
        setUserLeagues(leaguesData);

        const token = localStorage.getItem("token");

        // Fetch actual results — backend checks DB first, then queries OpenF1 if needed
        const resultsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/results/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          if (resultsData.results?.length > 0) {
            setActualResults(resultsData.results);

            // Auto-trigger scoring the first time results are fetched from OpenF1
            if (resultsData.source === "openf1") {
              await fetch(
                `${import.meta.env.VITE_API_URL}/api/sessions/${sessionId}/score`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({}),
                }
              );
            }
          }
        }
      } catch (err) {
        setError("Failed to load results");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [sessionId]);

  // Reload predictions and score whenever the selected league changes
  useEffect(() => {
    async function loadLeagueData() {
      try {
        const [predictionsData, scoresData] = await Promise.all([
          predictionAPI.getForSession(sessionId, selectedLeagueId),
          scoreAPI.getSessionScores(sessionId, selectedLeagueId),
        ]);

        const positionPredictions = predictionsData
          .filter((p) => p.prediction_type === "position")
          .sort((a, b) => a.position - b.position);
        setPredictions(positionPredictions);

        const myScore = scoresData.find((s) => s.username === user.username);
        setSessionScore(myScore ? myScore.points : null);
      } catch (err) {
        console.error("Failed to load league data:", err);
      }
    }
    if (sessionId) loadLeagueData();
  }, [sessionId, selectedLeagueId, user.username]);

  // Build position -> driver code lookup from actual results
  const actualByPosition = {};
  for (const r of actualResults) {
    actualByPosition[r.position] = r.driver_code;
  }

  // Build prediction lookup by position for quick access
  const predictionByPosition = {};
  for (const p of predictions) {
    predictionByPosition[p.position] = p.driver_code;
  }

  const hasActualResults = actualResults.length > 0;
  const hasPredictions = predictions.length > 0;

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ padding: "2rem", color: "var(--color-text-secondary)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p style={{ padding: "2rem", color: "var(--color-primary)" }}>
          {error}
        </p>
      </div>
    );
  }

  // Determine which positions to display — use actual results if available, otherwise predictions
  const displayPositions = hasActualResults
    ? actualResults.map((r) => r.position)
    : predictions.map((p) => p.position);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link to="/dashboard" className={styles.back}>
            ← Dashboard
          </Link>
          <div className={styles.sessionInfo}>
            <div>
              <h1>
                {session?.race_name} <span>— {session?.session_type}</span>
              </h1>
              <p>
                Round {session?.round} ·{" "}
                {new Date(session?.scheduled_at).toLocaleDateString()} ·{" "}
                {hasActualResults ? "Final results" : "Results pending"}
              </p>
            </div>
          </div>
        </div>

        {/* League selector — only shown if user is in at least one league */}
        {userLeagues.length > 0 && (
          <div className={styles.leagueSelector}>
            <label className={styles.leagueSelectorLabel}>Viewing:</label>
            <select
              className={styles.leagueSelectorSelect}
              value={selectedLeagueId ?? "global"}
              onChange={(e) =>
                setSelectedLeagueId(
                  e.target.value === "global" ? null : parseInt(e.target.value)
                )
              }
            >
              <option value="global">Global predictions</option>
              {userLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Score summary — only shown once session has been scored */}
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
          <span className={styles.keyItem}>
            <span className={`${styles.keyBadge} ${styles.exact}`}>P1</span> +25 pts
          </span>
          <span className={styles.keyItem}>
            <span className={`${styles.keyBadge} ${styles.exact}`}>P2</span> +18 pts
          </span>
          <span className={styles.keyItem}>
            <span className={`${styles.keyBadge} ${styles.exact}`}>P3</span> +15 pts
          </span>
          <span className={styles.keyItem}>
            <span className={`${styles.keyBadge} ${styles.partial}`}>P4–P10</span>{" "}
            12→1 pts
          </span>
        </div>

        {/* Results table — shows actual results with user predictions alongside */}
        {hasActualResults || hasPredictions ? (
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <span>Pos</span>
              <span>Your prediction</span>
              {hasActualResults && <span>Actual result</span>}
              {hasActualResults && <span>Points</span>}
            </div>

            {displayPositions.map((pos) => {
              const predictedCode = predictionByPosition[pos] || null;
              const actualCode = actualByPosition[pos] || null;
              const predInfo = predictedCode
                ? driverInfo[predictedCode] || { colour: "#888" }
                : null;
              const actualInfo = actualCode
                ? driverInfo[actualCode] || { colour: "#888" }
                : null;

              // Only calculate score if user made a prediction for this position
              const score =
                hasActualResults && predictedCode
                  ? getScore(predictedCode, predictions, actualResults)
                  : null;

              return (
                <div key={pos} className={styles.tableRow}>
                  <span className={styles.pos}>P{pos}</span>

                  {/* User's predicted driver — shows dash if no prediction made */}
                  <div className={styles.driver}>
                    {predictedCode && predInfo ? (
                      <>
                        <span
                          className={styles.teamBar}
                          style={{ backgroundColor: predInfo.colour }}
                        />
                        <span className={styles.code}>{predictedCode}</span>
                      </>
                    ) : (
                      <span style={{ color: "var(--color-text-secondary)" }}>—</span>
                    )}
                  </div>

                  {/* Actual finishing driver */}
                  {hasActualResults && (
                    <div className={styles.driver}>
                      {actualInfo ? (
                        <>
                          <span
                            className={styles.teamBar}
                            style={{ backgroundColor: actualInfo.colour }}
                          />
                          <span className={styles.code}>{actualCode}</span>
                        </>
                      ) : (
                        <span style={{ color: "var(--color-text-secondary)" }}>—</span>
                      )}
                    </div>
                  )}

                  {/* Points badge */}
                  {hasActualResults && (
                    <div className={styles.scoreBadge}>
                      {score ? (
                        <>
                          <span className={`${styles.keyBadge} ${styles.exact}`}>
                            Exact
                          </span>
                          <span className={styles.pts}>+{score.points}</span>
                        </>
                      ) : (
                        <span style={{ color: "var(--color-text-secondary)" }}>—</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--color-text-secondary)" }}>
            Results will appear here once the session is complete and scored.
          </p>
        )}
      </div>
    </div>
  );
}

export default Results;