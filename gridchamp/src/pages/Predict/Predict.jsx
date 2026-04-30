import { useState, useEffect, useRef } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { sessionAPI, predictionAPI, leagueAPI } from "../../services/api";
import styles from "./Predict.module.css";

const FALLBACK_DRIVERS = [
  { id: 1, code: "VER", name: "Verstappen", team: "Red Bull Racing", colour: "#3671C6" },
  { id: 2, code: "NOR", name: "Norris", team: "McLaren", colour: "#FF8000" },
  { id: 3, code: "LEC", name: "Leclerc", team: "Ferrari", colour: "#E8002D" },
  { id: 4, code: "PIA", name: "Piastri", team: "McLaren", colour: "#FF8000" },
  { id: 5, code: "HAM", name: "Hamilton", team: "Ferrari", colour: "#E8002D" },
  { id: 6, code: "RUS", name: "Russell", team: "Mercedes", colour: "#27F4D2" },
  { id: 7, code: "SAI", name: "Sainz", team: "Williams", colour: "#64C4FF" },
  { id: 8, code: "ANT", name: "Antonelli", team: "Mercedes", colour: "#27F4D2" },
  { id: 9, code: "ALO", name: "Alonso", team: "Aston Martin", colour: "#229971" },
  { id: 10, code: "STR", name: "Stroll", team: "Aston Martin", colour: "#229971" },
  { id: 11, code: "TSU", name: "Tsunoda", team: "Red Bull Racing", colour: "#3671C6" },
  { id: 12, code: "HAD", name: "Hadjar", team: "Racing Bulls", colour: "#6692FF" },
  { id: 13, code: "HUL", name: "Hulkenberg", team: "Sauber", colour: "#52E252" },
  { id: 14, code: "BOR", name: "Bortoleto", team: "Sauber", colour: "#52E252" },
  { id: 15, code: "OCO", name: "Ocon", team: "Haas", colour: "#B6BABD" },
  { id: 16, code: "BEA", name: "Bearman", team: "Haas", colour: "#B6BABD" },
  { id: 17, code: "GAS", name: "Gasly", team: "Alpine", colour: "#FF87BC" },
  { id: 18, code: "DOO", name: "Doohan", team: "Alpine", colour: "#FF87BC" },
  { id: 19, code: "ALB", name: "Albon", team: "Williams", colour: "#64C4FF" },
  { id: 20, code: "LAW", name: "Lawson", team: "Racing Bulls", colour: "#6692FF" },
];

// Normalise Supabase timestamp to a valid UTC Date
// Supabase returns timestamps with a space instead of T, e.g. "2026-05-01 20:30:00"
function toUTC(dateStr) {
  if (!dateStr) return null
  const normalised = dateStr.replace(' ', 'T')
  return new Date(normalised.endsWith('Z') ? normalised : normalised + 'Z')
}

// Group drivers by team for the dropdown
function groupByTeam(drivers) {
  const groups = {};
  for (const driver of drivers) {
    if (!groups[driver.team]) groups[driver.team] = [];
    groups[driver.team].push(driver);
  }
  return Object.entries(groups);
}

// Custom driver dropdown for a single position slot
function DriverDropdown({ position, selected, drivers, predictions, onSelect, onRemove, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const assignedIds = predictions.filter(Boolean).map((d) => d?.id);
  const availableDrivers = drivers.filter(
    (d) => !assignedIds.includes(d.id) || selected?.id === d.id
  );
  const grouped = groupByTeam(availableDrivers);

  return (
    <div className={styles.slot} ref={ref}>
      <span className={styles.slotPos}>P{position + 1}</span>

      {selected ? (
        <div className={styles.slotFilled}>
          <span className={styles.driverColour} style={{ backgroundColor: selected.colour }} />
          <span className={styles.slotCode}>{selected.code}</span>
          <span className={styles.slotName}>{selected.name}</span>
          <span className={styles.slotTeam}>{selected.team}</span>
          {!disabled && (
            <button className={styles.removeBtn} onClick={() => onRemove(position)}>✕</button>
          )}
        </div>
      ) : (
        <button
          className={styles.slotTrigger}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
        >
          <span className={styles.slotPlaceholder}>Select a driver</span>
          <span className={styles.slotChevron}>▾</span>
        </button>
      )}

      {open && !disabled && (
        <div className={styles.dropdown}>
          {grouped.map(([team, teamDrivers]) => (
            <div key={team} className={styles.teamGroup}>
              <div className={styles.teamGroupLabel}>{team}</div>
              {teamDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className={styles.dropdownOption}
                  onMouseDown={() => {
                    onSelect(position, driver);
                    setOpen(false);
                  }}
                >
                  <span className={styles.optionColour} style={{ backgroundColor: driver.colour }} />
                  <span className={styles.optionCode}>{driver.code}</span>
                  <span className={styles.optionName}>{driver.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        const sessionData = await sessionAPI.getOne(sessionId);
        setSession(sessionData);

        if (sessionData.session_key) {
          try {
            const res = await fetch(
              `https://api.openf1.org/v1/drivers?session_key=${sessionData.session_key}`
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
            setDrivers(FALLBACK_DRIVERS);
          }
        } else {
          setDrivers(FALLBACK_DRIVERS);
        }

        let leagueData = null;
        let slots = 10;

        if (leagueId) {
          leagueData = await leagueAPI.getOne(leagueId);
          setLeague(leagueData);
          slots = leagueData.prediction_slots || 10;
          setPositions(slots);
        }

        const existingPredictions = await predictionAPI.getForSession(
          sessionId,
          leagueId ? parseInt(leagueId) : null
        );

        if (existingPredictions.length > 0) {
          const positionPredictions = existingPredictions.filter(
            (p) => p.prediction_type === "position"
          );
          const flPrediction = existingPredictions.find(
            (p) => p.prediction_type === "fastest_lap"
          );
          const dodPrediction = existingPredictions.find(
            (p) => p.prediction_type === "driver_of_day"
          );

          if (positionPredictions.length > 0) {
            const filled = Array(slots).fill(null);
            for (const pred of positionPredictions) {
              const driver = FALLBACK_DRIVERS.find((d) => d.code === pred.driver_code);
              if (driver && pred.position <= slots) {
                filled[pred.position - 1] = driver;
              }
            }
            setPredictions(filled);
            setAlreadySubmitted(true);
          }

          if (flPrediction) {
            const driver = FALLBACK_DRIVERS.find((d) => d.code === flPrediction.driver_code);
            if (driver) setFastestLapPick(driver);
          }

          if (dodPrediction) {
            const driver = FALLBACK_DRIVERS.find((d) => d.code === dodPrediction.driver_code);
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

  useEffect(() => {
    setPredictions(Array(positions).fill(null));
  }, [positions]);

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
  const filledCount = predictions.filter(Boolean).length;

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ padding: "2rem", color: "var(--color-text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p style={{ padding: "2rem", color: "var(--color-primary)" }}>{error}</p>
      </div>
    );
  }

  // Check if predictions are closed using predictions_close_at, falling back to scheduled_at
  const closeAt = session?.predictions_close_at || session?.scheduled_at;
  if (session && closeAt && new Date() > toUTC(closeAt)) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.sessionHeader}>
            <Link to={backLink} className={styles.back}>
              ← {leagueId ? "Leagues" : "Dashboard"}
            </Link>
            <div className={styles.sessionInfo}>
              <div>
                <h1>{session?.race_name} <span>— {session?.session_type}</span></h1>
                <p>Round {session?.round} · Predictions closed</p>
              </div>
            </div>
          </div>
          <div className={styles.successBox}>
            <div className={styles.successIcon}>🔒</div>
            <h2>Predictions locked</h2>
            <p>This session has started. Predictions are now closed.</p>
            <Link to={`/results/${session?.id}`} className={styles.btnPrimary}>
              View results
            </Link>
          </div>
        </div>
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
            predictions for {session?.session_type} — {session?.race_name} have been locked in.
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
              <h1>{session?.race_name} <span>— {session?.session_type}</span></h1>
              <p>
                Round {session?.round} · {toUTC(session?.scheduled_at)?.toLocaleString()}
                {leagueId && league ? ` · ${league.name} · Top ${positions}` : ` · Global · Top ${positions}`}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.predictInner}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(filledCount / positions) * 100}%` }} />
          </div>
          <p className={styles.progressLabel}>
            {filledCount} / {positions} positions filled
          </p>

          <div className={styles.slots}>
            {predictions.map((driver, i) => (
              <DriverDropdown
                key={i}
                position={i}
                selected={driver}
                drivers={drivers}
                predictions={predictions}
                onSelect={handleSelect}
                onRemove={handleRemove}
                disabled={alreadySubmitted}
              />
            ))}
          </div>

          {leagueId && league?.fastest_lap && (
            <div className={styles.bonusSection}>
              <h3>Fastest lap</h3>
              <p className={styles.hint}>Which driver sets the fastest lap?</p>
              <select
                className={styles.bonusSelect}
                value={fastestLapPick?.code || ""}
                onChange={(e) =>
                  setFastestLapPick(drivers.find((d) => d.code === e.target.value) || null)
                }
                disabled={alreadySubmitted}
              >
                <option value="">Select a driver</option>
                {drivers.map((d) => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>
          )}

          {leagueId && league?.driver_of_day && (
            <div className={styles.bonusSection}>
              <h3>Driver of the day</h3>
              <p className={styles.hint}>Which driver wins driver of the day?</p>
              <select
                className={styles.bonusSelect}
                value={driverOfDayPick?.code || ""}
                onChange={(e) =>
                  setDriverOfDayPick(drivers.find((d) => d.code === e.target.value) || null)
                }
                disabled={alreadySubmitted}
              >
                <option value="">Select a driver</option>
                {drivers.map((d) => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
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
                  : `${filledCount} / ${positions} positions filled`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Predict;