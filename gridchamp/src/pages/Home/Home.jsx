import { Link } from 'react-router-dom'
import styles from './Home.module.css'

function Home() {
  return (
    <div className={styles.page}>

      {/* ── Hero section ────────────────────────────────────────────────── */}
      <section className={styles.hero}>

        {/* Left side — headline, description and call to action buttons */}
        <div className={styles.heroContent}>
          <span className={styles.badge}>2025 Formula One Season</span>
          <h1 className={styles.title}>
            Predict. Compete.<br /><span>Dominate.</span>
          </h1>
          <p className={styles.subtitle}>
            Submit your predictions for every qualifying session, sprint, and race.
            Score points based on real results. Compete with friends in private leagues
            or take on the world on the global leaderboard.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.btnPrimary}>Get started free</Link>
            <Link to="/login" className={styles.btnOutline}>Log in</Link>
          </div>
        </div>

        {/* Right side — preview card showing a mock live session and predictions */}
        <div className={styles.heroVisual}>
          <div className={styles.card}>

            {/* Card header with race name and live indicator */}
            <div className={styles.cardHeader}>
              <span className={styles.cardBadge}>Miami Grand Prix</span>
              <span className={styles.cardLive}>● Live</span>
            </div>
            <div className={styles.cardSession}>Race — Round 6</div>

            {/* Mock prediction rows showing correct and incorrect predictions
                green = exact match, yellow = incorrect prediction */}
            <div className={styles.predictionList}>
              {[
                { pos: 1, driver: 'Verstappen', predicted: 1, correct: true },
                { pos: 2, driver: 'Norris', predicted: 3, correct: false },
                { pos: 3, driver: 'Leclerc', predicted: 2, correct: false },
                { pos: 4, driver: 'Piastri', predicted: 4, correct: true },
                { pos: 5, driver: 'Hamilton', predicted: 6, correct: false },
              ].map((row) => (
                <div key={row.pos} className={styles.predictionRow}>
                  <span className={styles.pos}>{row.pos}</span>
                  <span className={styles.driver}>{row.driver}</span>
                  {/* Apply correct or wrong style based on prediction accuracy */}
                  <span className={`${styles.predicted} ${row.correct ? styles.correct : styles.wrong}`}>
                    P{row.predicted} predicted
                  </span>
                </div>
              ))}
            </div>

            {/* Card footer showing total points earned this session */}
            <div className={styles.cardFooter}>
              <span>Your score this session</span>
              <span className={styles.score}>+34 pts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works section ─────────────────────────────────────────── */}
      <section className={styles.howItWorks}>
        <h2>How it works</h2>

        {/* Four step process explaining the app to new visitors */}
        <div className={styles.steps}>
          {[
            { num: '01', title: 'Create an account', desc: 'Sign up for free and join the GridChamp community.' },
            { num: '02', title: 'Submit predictions', desc: 'Predict qualifying, sprint, and race results before each session locks.' },
            { num: '03', title: 'Score points', desc: 'Earn points automatically when official results come in. The closer your predictions, the more you score.' },
            { num: '04', title: 'Climb the standings', desc: 'Compete on the global leaderboard or create a private mini league with friends.' },
          ].map((step) => (
            <div key={step.num} className={styles.step}>
              <span className={styles.stepNum}>{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Call to action section ───────────────────────────────────────── */}
      <section className={styles.cta}>
        <h2>Ready to prove your F1 knowledge?</h2>
        <p>Join GridChamp and start predicting before the next race weekend.</p>
        <Link to="/register" className={styles.btnPrimary}>Create your account</Link>
      </section>

    </div>
  )
}

export default Home