import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { leagueAPI, sessionAPI } from "../../services/api";
import styles from "./Leagues.module.css";

const SLOT_OPTIONS = [3, 5, 10, 20];

function Leagues() {
  const { user } = useAuth();
  const [myLeagues, setMyLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newLeagueName, setNewLeagueName] = useState("");
  const [predictionSlots, setPredictionSlots] = useState(10);
  const [fastestLap, setFastestLap] = useState(false);
  const [driverOfDay, setDriverOfDay] = useState(false);
  const [poleBonus, setPoleBonus] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchFocused, setMemberSearchFocused] = useState(false);
  const searchTimeout = useRef(null);

  const [addSearch, setAddSearch] = useState("");
  const [addSearchResults, setAddSearchResults] = useState([]);
  const [addMemberError, setAddMemberError] = useState("");
  const [addMemberSuccess, setAddMemberSuccess] = useState("");
  const [addSearchFocused, setAddSearchFocused] = useState(false);
  const addSearchTimeout = useRef(null);

  // Inline confirmation state
  const [confirmAction, setConfirmAction] = useState(null);
  // confirmAction shape: { type: 'leave' | 'delete' | 'remove', userId?, username?, label }

  useEffect(() => {
    loadLeagues();
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeLeague) {
      loadStandings(activeLeague.id);
      loadMembers(activeLeague.id);
    }
  }, [activeLeague]);

  async function loadLeagues() {
    try {
      const data = await leagueAPI.getMyLeagues();
      setMyLeagues(data);
      if (data.length > 0) setActiveLeague(data[0]);
    } catch (err) {
      console.error("Failed to load leagues:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      const data = await sessionAPI.getAll();
      setSessions(data.filter((s) => !s.completed));
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }

  async function loadStandings(leagueId) {
    try {
      const data = await leagueAPI.getStandings(leagueId);
      setStandings(data);
    } catch (err) {
      console.error("Failed to load standings:", err);
    }
  }

  async function loadMembers(leagueId) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/leagues/${leagueId}/members`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }

  async function searchUsers(q, setResults) {
    try {
      const token = localStorage.getItem("token");
      const url =
        q && q.length > 0
          ? `${import.meta.env.VITE_API_URL}/api/users/search?q=${encodeURIComponent(q)}`
          : `${import.meta.env.VITE_API_URL}/api/users/search`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  function handleMemberSearchChange(e) {
    const q = e.target.value;
    setMemberSearch(q);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(
      () => searchUsers(q, setSearchResults),
      200,
    );
  }

  function handleMemberSearchFocus() {
    setMemberSearchFocused(true);
    if (searchResults.length === 0) searchUsers("", setSearchResults);
  }

  function handleAddSearchChange(e) {
    const q = e.target.value;
    setAddSearch(q);
    clearTimeout(addSearchTimeout.current);
    addSearchTimeout.current = setTimeout(
      () => searchUsers(q, setAddSearchResults),
      200,
    );
  }

  function handleAddSearchFocus() {
    setAddSearchFocused(true);
    if (addSearchResults.length === 0) searchUsers("", setAddSearchResults);
  }

  function selectMember(u) {
    if (selectedMembers.find((m) => m.id === u.id)) return;
    setSelectedMembers((prev) => [...prev, u]);
    setMemberSearch("");
    setSearchResults([]);
    setMemberSearchFocused(false);
  }

  function removeMember(id) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleCreate() {
    if (!newLeagueName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leagues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newLeagueName,
          prediction_slots: predictionSlots,
          fastest_lap: fastestLap,
          driver_of_day: driverOfDay,
          pole_bonus: poleBonus,
        }),
      });
      const league = await res.json();

      for (const member of selectedMembers) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/leagues/${league.id}/members`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username: member.username }),
          },
        );
      }

      setNewLeagueName("");
      setPredictionSlots(10);
      setFastestLap(false);
      setDriverOfDay(false);
      setPoleBonus(false);
      setSelectedMembers([]);
      setMemberSearch("");
      setSearchResults([]);
      setShowCreate(false);
      await loadLeagues();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddMember(u) {
    setAddMemberError("");
    setAddMemberSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/leagues/${activeLeague.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: u.username }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setAddMemberError(data.error);
      } else {
        setAddMemberSuccess(`${u.username} added successfully`);
        setAddSearch("");
        setAddSearchResults([]);
        setAddSearchFocused(false);
        await loadMembers(activeLeague.id);
        await loadLeagues();
      }
    } catch (err) {
      setAddMemberError("Failed to add member");
    }
  }

  async function executeConfirmedAction() {
    if (!confirmAction) return;
    const token = localStorage.getItem("token");

    try {
      if (confirmAction.type === "remove") {
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/leagues/${activeLeague.id}/members/${confirmAction.userId}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        );
        await loadMembers(activeLeague.id);
        await loadLeagues();
      } else if (confirmAction.type === "leave") {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/leagues/${activeLeague.id}/leave`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          await loadLeagues();
          setActiveLeague(null);
        } else {
          const data = await res.json();
          setError(data.error);
        }
      } else if (confirmAction.type === "delete") {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/leagues/${activeLeague.id}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          await loadLeagues();
          setActiveLeague(null);
        } else {
          const data = await res.json();
          setError(data.error);
        }
      }
    } catch (err) {
      setError("Action failed");
    } finally {
      setConfirmAction(null);
    }
  }

  const isCreator = activeLeague?.created_by === user?.id;

  const weekends = Object.values(
    sessions.reduce((groups, session) => {
      if (!groups[session.race_name]) {
        groups[session.race_name] = {
          race_name: session.race_name,
          round: session.round,
          sessions: [],
        };
      }
      groups[session.race_name].sessions.push(session);
      return groups;
    }, {}),
  ).sort((a, b) => a.round - b.round);

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ padding: "2rem", color: "var(--color-text-secondary)" }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <h1>Mini leagues</h1>
            <p>Compete in private leagues with friends and family</p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowCreate(true)}
            >
              Create league
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: "var(--color-primary)",
              marginBottom: "1rem",
              fontSize: "var(--font-size-sm)",
            }}
          >
            {error}
          </div>
        )}

        {/* Inline confirmation dialog */}
        {confirmAction && (
          <div className={styles.confirmBox}>
            <p>{confirmAction.label}</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.btnOutline}
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className={styles.btnDanger}
                onClick={executeConfirmedAction}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className={styles.formCard}>
            <h3>Create a new league</h3>
            <p>Customise your league settings and add members below.</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>League name</label>
              <input
                type="text"
                placeholder="e.g. The Paddock"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Positions to predict</label>
              <p className={styles.settingDesc}>
                How many finishing positions members must predict per session.
              </p>
              <div className={styles.slotOptions}>
                {SLOT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    className={`${styles.slotBtn} ${predictionSlots === n ? styles.slotBtnActive : ""}`}
                    onClick={() => setPredictionSlots(n)}
                  >
                    Top {n}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Bonus predictions</label>
              <p className={styles.settingDesc}>
                Optional extra predictions members can make each session.
              </p>
              <div className={styles.toggleList}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>Fastest lap</span>
                    <span className={styles.toggleDesc}>
                      Predict which driver sets the fastest lap
                    </span>
                  </div>
                  <button
                    className={`${styles.toggle} ${fastestLap ? styles.toggleOn : ""}`}
                    onClick={() => setFastestLap(!fastestLap)}
                  >
                    {fastestLap ? "On" : "Off"}
                  </button>
                </div>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>
                      Driver of the day
                    </span>
                    <span className={styles.toggleDesc}>
                      Predict which driver wins driver of the day
                    </span>
                  </div>
                  <button
                    className={`${styles.toggle} ${driverOfDay ? styles.toggleOn : ""}`}
                    onClick={() => setDriverOfDay(!driverOfDay)}
                  >
                    {driverOfDay ? "On" : "Off"}
                  </button>
                </div>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleLabel}>
                      Pole position bonus
                    </span>
                    <span className={styles.toggleDesc}>
                      Correctly predicting P1 in qualifying earns bonus points
                    </span>
                  </div>
                  <button
                    className={`${styles.toggle} ${poleBonus ? styles.toggleOn : ""}`}
                    onClick={() => setPoleBonus(!poleBonus)}
                  >
                    {poleBonus ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Add members</label>
              <p className={styles.settingDesc}>
                Click the box to see all users, or type to filter.
              </p>
              <div className={styles.memberSearch}>
                <input
                  type="text"
                  placeholder="Click to see all users..."
                  value={memberSearch}
                  onChange={handleMemberSearchChange}
                  onFocus={handleMemberSearchFocus}
                  onBlur={() =>
                    setTimeout(() => setMemberSearchFocused(false), 150)
                  }
                  className={styles.input}
                />
                {memberSearchFocused && searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults
                      .filter(
                        (u) => !selectedMembers.find((m) => m.id === u.id),
                      )
                      .map((u) => (
                        <div
                          key={u.id}
                          className={styles.searchResult}
                          onMouseDown={() => selectMember(u)}
                        >
                          {u.username}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {selectedMembers.length > 0 && (
                <div className={styles.selectedMembers}>
                  {selectedMembers.map((m) => (
                    <div key={m.id} className={styles.memberTag}>
                      {m.username}
                      <span
                        className={styles.memberTagRemove}
                        onClick={() => removeMember(m.id)}
                      >
                        ✕
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.btnOutline}
                onClick={() => {
                  setShowCreate(false);
                  setSelectedMembers([]);
                  setMemberSearch("");
                  setSearchResults([]);
                }}
              >
                Cancel
              </button>
              <button className={styles.btnPrimary} onClick={handleCreate}>
                Create league
              </button>
            </div>
          </div>
        )}

        {myLeagues.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>
            You haven't joined any leagues yet. Ask a league creator to add you.
          </p>
        ) : (
          <div className={styles.grid}>
            <div className={styles.leagueList}>
              <h2>Your leagues</h2>
              {myLeagues.map((league) => (
                <div
                  key={league.id}
                  className={`${styles.leagueCard} ${activeLeague?.id === league.id ? styles.leagueActive : ""}`}
                  onClick={() => setActiveLeague(league)}
                >
                  <div className={styles.leagueCardTop}>
                    <span className={styles.leagueName}>{league.name}</span>
                  </div>
                  <div className={styles.leagueCardMeta}>
                    <span>{league.member_count} members</span>
                  </div>
                  <div className={styles.leagueSettings}>
                    <span>Top {league.prediction_slots}</span>
                    {league.fastest_lap && <span>Fastest lap</span>}
                    {league.driver_of_day && <span>Driver of day</span>}
                    {league.pole_bonus && <span>Pole bonus</span>}
                  </div>
                </div>
              ))}
            </div>

            {activeLeague && (
              <div className={styles.standingsPanel}>
                <div className={styles.standingsHeader}>
                  <h2>{activeLeague.name}</h2>
                  <div className={styles.leagueActions}>
                    {isCreator && (
                      <>
                        <button
                          className={styles.btnOutline}
                          onClick={() => {
                            setShowAddMember(!showAddMember);
                            setAddMemberError("");
                            setAddMemberSuccess("");
                          }}
                        >
                          + Add member
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() =>
                            setConfirmAction({
                              type: "delete",
                              label: `Permanently delete "${activeLeague.name}"? This cannot be undone.`,
                            })
                          }
                        >
                          Delete league
                        </button>
                      </>
                    )}
                    {!isCreator && (
                      <button
                        className={styles.btnDanger}
                        onClick={() =>
                          setConfirmAction({
                            type: "leave",
                            label: `Leave ${activeLeague.name}?`,
                          })
                        }
                      >
                        Leave league
                      </button>
                    )}
                  </div>
                </div>

                {showAddMember && isCreator && (
                  <div className={styles.addMemberForm}>
                    <div className={styles.memberSearch}>
                      <input
                        type="text"
                        placeholder="Click to see all users..."
                        value={addSearch}
                        onChange={handleAddSearchChange}
                        onFocus={handleAddSearchFocus}
                        onBlur={() =>
                          setTimeout(() => setAddSearchFocused(false), 150)
                        }
                        className={styles.input}
                      />
                      {addSearchFocused && addSearchResults.length > 0 && (
                        <div className={styles.searchResults}>
                          {addSearchResults
                            .filter((u) => !members.find((m) => m.id === u.id))
                            .map((u) => (
                              <div
                                key={u.id}
                                className={styles.searchResult}
                                onMouseDown={() => handleAddMember(u)}
                              >
                                {u.username}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    {addMemberError && (
                      <p
                        style={{
                          color: "var(--color-primary)",
                          fontSize: "var(--font-size-sm)",
                          marginTop: "0.5rem",
                        }}
                      >
                        {addMemberError}
                      </p>
                    )}
                    {addMemberSuccess && (
                      <p
                        style={{
                          color: "var(--color-success)",
                          fontSize: "var(--font-size-sm)",
                          marginTop: "0.5rem",
                        }}
                      >
                        {addMemberSuccess}
                      </p>
                    )}
                  </div>
                )}

                <div className={styles.tableWrapper}>
                  <div className={styles.tableHeader}>
                    <span>Rank</span>
                    <span>Player</span>
                    <span>Points</span>
                    {isCreator && <span />}
                  </div>
                  {standings.map((row, index) => {
                    const rank = index + 1;
                    const isUser = row.id === user.id;
                    return (
                      <div
                        key={row.id}
                        className={`${styles.tableRow} ${isUser ? styles.userRow : ""}`}
                      >
                        <span className={styles.rank}>
                          {rank <= 3
                            ? ["🥇", "🥈", "🥉"][rank - 1]
                            : `#${rank}`}
                        </span>
                        <span
                          className={`${styles.username} ${isUser ? styles.userHighlight : ""}`}
                        >
                          {row.username}
                          {isUser && <span className={styles.youTag}>You</span>}
                        </span>
                        <span
                          className={`${styles.points} ${isUser ? styles.userPoints : ""}`}
                        >
                          {row.total_points}
                        </span>
                        {isCreator && !isUser && (
                          <button
                            className={styles.removeBtn}
                            onClick={() =>
                              setConfirmAction({
                                type: "remove",
                                userId: row.id,
                                username: row.username,
                                label: `Remove ${row.username} from this league?`,
                              })
                            }
                          >
                            ✕
                          </button>
                        )}
                        {isCreator && isUser && <span />}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.leagueSessions}>
                  <h3>Upcoming sessions</h3>
                  {weekends.length === 0 ? (
                    <p
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      No upcoming sessions.
                    </p>
                  ) : (
                    weekends.map((weekend) => (
                      <div
                        key={weekend.race_name}
                        className={styles.weekendGroup}
                      >
                        <span className={styles.weekendName}>
                          {weekend.race_name}
                        </span>
                        {weekend.sessions.map((session) => {
                          const isLocked =
                            new Date(session.scheduled_at) < new Date();
                          return (
                            <div key={session.id} className={styles.sessionRow}>
                              <span className={styles.sessionType}>
                                {session.session_type}
                              </span>
                              {isLocked ? (
                                <span className={styles.locked}>Locked</span>
                              ) : (
                                <Link
                                  to={`/predict/${session.id}?league_id=${activeLeague.id}`}
                                  className={styles.btnPredict}
                                >
                                  Predict
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leagues;
