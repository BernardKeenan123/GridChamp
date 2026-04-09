import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

// Displayed when a user navigates to a route that doesn't exist
function NotFound() {
  return (
    <div className={styles.page}>
      <h1>404</h1>
      <p>This page doesn't exist.</p>
      {/* Link back to the home page */}
      <Link to="/" className={styles.btn}>Go home</Link>
    </div>
  )
}

export default NotFound