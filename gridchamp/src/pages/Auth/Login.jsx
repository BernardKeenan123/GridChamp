import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Auth.module.css'
import { useAuth } from '../../context/AuthContext'

function Login() {
  // Track email and password input values
  const [formData, setFormData] = useState({ email: '', password: '' })

  // Holds any error message to display to the user
  const [error, setError] = useState('')

  // Access the login function from auth context
  const { login } = useAuth()

  // Used to redirect the user after successful login
  const navigate = useNavigate()

  // Update form state on input change and clear any existing error
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    await login(formData.email, formData.password)
    navigate('/dashboard')
  } catch (err) {
    setError(err.message)
  }
}

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Header with logo and page title */}
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>Grid<span>Champ</span></Link>
          <h1>Welcome back</h1>
          <p>Log in to your account to continue predicting</p>
        </div>

        {/* Show error message if login fails */}
        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* Email input field */}
          <div className={styles.field}>
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password input field */}
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.btnPrimary}>
            Log in
          </button>
        </form>

        {/* Link to registration page for new users */}
        <p className={styles.switch}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login