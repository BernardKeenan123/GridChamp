import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.css'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          Grid<span>Champ</span>
        </Link>

        {/* Desktop links */}
        <div className={styles.links}>
          <Link to="/dashboard" className={isActive('/dashboard') ? styles.active : ''}>Dashboard</Link>
          <Link to="/leaderboard" className={isActive('/leaderboard') ? styles.active : ''}>Leaderboard</Link>
          <Link to="/leagues" className={isActive('/leagues') ? styles.active : ''}>Leagues</Link>
        </div>

        {/* Desktop actions */}
        <div className={styles.actions}>
          {user ? (
            <>
              <span className={styles.username}>👤 {user.username}</span>
              <button className={styles.btnOutline} onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.btnOutline}>Log in</Link>
              <Link to="/register" className={styles.btnPrimary}>Sign up</Link>
            </>
          )}
        </div>

        {/* Hamburger button - mobile only */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/dashboard" className={isActive('/dashboard') ? styles.mobileActive : ''} onClick={closeMenu}>Dashboard</Link>
          <Link to="/leaderboard" className={isActive('/leaderboard') ? styles.mobileActive : ''} onClick={closeMenu}>Leaderboard</Link>
          <Link to="/leagues" className={isActive('/leagues') ? styles.mobileActive : ''} onClick={closeMenu}>Leagues</Link>
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              <span className={styles.mobileUsername}>👤 {user.username}</span>
              <button className={styles.mobileLogout} onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Log in</Link>
              <Link to="/register" onClick={closeMenu}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar