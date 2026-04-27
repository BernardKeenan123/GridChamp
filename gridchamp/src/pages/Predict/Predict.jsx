import { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { sessionAPI, predictionAPI, leagueAPI } from "../../services/api";
import styles from "./Predict.module.css";

function Predict() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const leagueId = searchParams.get("league_id");
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [league, setLeague] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [positions, setPositions] = useState(10);
  const [predictions, setPredictions] = useState(Array(10).fill(null));
  const [fastestLapPick, setFastestLapPick] = useState(null);
  const [driverOfDayPick, setDriverOfDayPick] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Fetch session
        const sessionData = await sessionAPI.getOne(sessionId);
        setSession(sessionData);

        // Fetch drivers from OpenF1 using the session key
        try {
          const res = await fetch(
            `https://api.openf1.org/v1/drivers?session_key=${sessionData.openf1_session_key}`,
          );
          const data = await res.json();
          const mapped = data.map((d) => ({
            id: d.driver_number,
            code: d.name_acronym,
            name: d.last_name,
            team: d.team_name,
            colour: d.team_colour ? `#${d.team_colour}` : "#ffffff",
          }));
          setDrivers(mapped);
        } catch {
          setError("Could not load drivers for this session");
        }

        // If league_id in URL, fetch league settings
        let leagueData = null;
        let slots = 10;

        if (leagueId) {
          leagueData = await leagueAPI.getOne(leagueId);
          setLeague(leagueData);
          slots = leagueData.prediction_slots || 10;
          setPositions(slots);
        }

        // Fetch existing predictions for this session/league combo
        const existingPredictions = await predictionAPI.getForSession(
          sessionId,
          leagueId ? parseInt(leagueId) : null,
        );

        if (existingPredictions.length > 0) {
          const positionPredictions = existingPredictions.filter(
            (p) => p.prediction_type === "position",
          );
          const flPrediction = existingPredictions.find(
            (p) => p.prediction_type === "fastest_lap",
          );
          const dodPrediction = existingPredictions.find(
            (p) => p.prediction_type === "driver_of_day",
          );

          if (positionPredictions.length > 0) {
            const filled = Array(slots).fill(null);
            for (const pred of positionPredictions) {
              const driver = drivers.find((d) => d.code === pred.driver_code);
              if (driver && pred.position <= slots) {
                filled[pred.position - 1] = driver;
              }
            }
            setPredictions(filled);
            setAlreadySubmitted(true);
          }

          if (flPrediction) {
            const driver = drivers.find(
              (d) => d.code === flPrediction.driver_code,
            );
            if (driver) setFastestLapPick(driver);
          }

          if (dodPrediction) {
            const driver = drivers.find(
              (d) => d.code === dodPrediction.driver_code,
            );
            if (driver) setDriverOfDayPick(driver);
          }
        }
      } catch (err) {
        setError("Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, leagueId]);

  // Reset predictions array when positions count changes
  useEffect(() => {
    setPredictions(Array(positions).fill(null));
  }, [positions]);

  const assignedIds = predictions.filter(Boolean).map((d) => d.id);

  const handleSelect = (position, driver) => {
    const updated = [...predictions];
    updated[position] = driver;
    setPredictions(updated);
  };

  const handleRemove = (position) => {
    const updated = [...predictions];
    updated[position] = null;
    setPredictions(updated);
  };

  const handleSubmit = async () => {
    if (predictions.some((p) => p === null)) return;
    setSubmitting(true);
    try {
      const payload = predictions.map((driver, i) => ({
        position: i + 1,
        driver_code: driver.code,
      }));

      const options = {};
      if (leagueId) options.league_id = parseInt(leagueId);
      if (fastestLapPick) options.fastest_lap = fastestLapPick.code;
      if (driverOfDayPick) options.driver_of_day = driverOfDayPick.code;

      await predictionAPI.submit(sessionId, payload, options);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const allFilled = predictions.every((p) => p !== null);
  const backLink = leagueId ? "/leagues" : "/dashboard";

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

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✓</div>
          <h2>Predictions submitted!</h2>
          <p>
            Your {leagueId ? `${league?.name} league ` : "global "}
            predictions for {session?.session_type} — {session?.race_name} have
            been locked in.
          </p>
          <Link to={backLink} className={styles.btnPrimary}>
            {leagueId ? "Back to leagues" : "Back to dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.sessionHeader}>
          <Link to={backLink} className={styles.back}>
            ← {leagueId ? "Leagues" : "Dashboard"}
          </Link>
          <div className={styles.sessionInfo}>
            <div>
              <h1>
                {session?.race_name} <span>— {session?.session_type}</span>
              </h1>
              <p>
                Round {session?.round} ·{" "}
                {new Date(session?.scheduled_at).toLocaleString()}
                {leagueId && league
                  ? ` · ${league.name} · Top ${positions}`
                  : ` · Global · Top ${positions}`}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.predictionSection}>
            <h2>Your predictions</h2>
            <p className={styles.hint}>
              Select a driver from the panel for each position
            </p>

            <div className={styles.slots}>
              {predictions.map((driver, i) => (
                <div
                  key={i}
                  className={`${styles.slot} ${driver ? styles.slotFilled : styles.slotEmpty}`}
                >
                  <span className={styles.slotPos}>P{i + 1}</span>
                  {driver ? (
                    <>
                      <span
                        className={styles.driverColour}
                        style={{ backgroundColor: driver.colour }}
                      />
                      <span className={styles.slotCode}>{driver.code}</span>
                      <span className={styles.slotName}>{driver.name}</span>
                      <span className={styles.slotTeam}>{driver.team}</span>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemove(i)}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className={styles.slotPlaceholder}>
                      Select a driver
                    </span>
                  )}
                </div>
              ))}
            </div>

            {leagueId && league?.fastest_lap && (
              <div className={styles.bonusSection}>
                <h3>Fastest lap</h3>
                <p className={styles.hint}>
                  Which driver sets the fastest lap?
                </p>
                <select
                  className={styles.bonusSelect}
                  value={fastestLapPick?.code || ""}
                  onChange={(e) =>
                    setFastestLapPick(
                      drivers.find((d) => d.code === e.target.value) || null,
                    )
                  }
                  disabled={alreadySubmitted}
                >
                  <option value="">Select a driver</option>
                  {drivers.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {leagueId && league?.driver_of_day && (
              <div className={styles.bonusSection}>
                <h3>Driver of the day</h3>
                <p className={styles.hint}>
                  Which driver wins driver of the day?
                </p>
                <select
                  className={styles.bonusSelect}
                  value={driverOfDayPick?.code || ""}
                  onChange={(e) =>
                    setDriverOfDayPick(
                      drivers.find((d) => d.code === e.target.value) || null,
                    )
                  }
                  disabled={alreadySubmitted}
                >
                  <option value="">Select a driver</option>
                  {drivers.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              className={`${styles.btnSubmit} ${!allFilled || submitting || alreadySubmitted ? styles.btnDisabled : ""}`}
              onClick={handleSubmit}
              disabled={!allFilled || submitting || alreadySubmitted}
            >
              {submitting
                ? "Submitting..."
                : alreadySubmitted
                  ? "Predictions already submitted"
                  : allFilled
                    ? "Submit predictions"
                    : `${predictions.filter(Boolean).length} / ${positions} positions filled`}
            </button>
          </div>

          <div className={styles.driverPanel}>
            <h2>Drivers</h2>
            <p className={styles.hint}>
              {drivers.length - assignedIds.length} remaining
            </p>
            <div className={styles.driverList}>
              {drivers.map((driver) => {
                const isUsed = assignedIds.includes(driver.id);
                return (
                  <div
                    key={driver.id}
                    className={`${styles.driverCard} ${isUsed ? styles.driverUsed : ""}`}
                    onClick={() => {
                      if (isUsed) return;
                      const nextEmpty = predictions.findIndex(
                        (p) => p === null,
                      );
                      if (nextEmpty !== -1) handleSelect(nextEmpty, driver);
                    }}
                  >
                    <span
                      className={styles.teamColour}
                      style={{ backgroundColor: driver.colour }}
                    />
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
                            className={`${styles.posBtn} ${slot !== null ? styles.posBtnTaken : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!slot) handleSelect(i, driver);
                            }}
                            disabled={slot !== null}
                            title={
                              slot ? `P${i + 1} taken` : `Place at P${i + 1}`
                            }
                          >
                            P{i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                    {isUsed && <span className={styles.usedLabel}>Added</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Predict;
