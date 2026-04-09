import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.css'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          Grid<span>Champ</span>
        </Link>
        <div className={styles.links}>
          <Link to="/dashboard" className={isActive('/dashboard') ? styles.active : ''}>Dashboard</Link>
          <Link to="/leaderboard" className={isActive('/leaderboard') ? styles.active : ''}>Leaderboard</Link>
          <Link to="/leagues" className={isActive('/leagues') ? styles.active : ''}>Leagues</Link>
        </div>
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
      </div>
    </nav>
  )
}

export default Navbar