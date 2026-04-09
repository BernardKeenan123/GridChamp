import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Auth.module.css'
import { useAuth } from '../../context/AuthContext'

function Register() {
  // Track all registration form field values
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Holds any error message to display to the user
  const [error, setError] = useState('')

  // Access the register function from auth context to log user in after registration
  const { register } = useAuth()

  // Used to redirect the user after successful registration
  const navigate = useNavigate()

  // Update form state on input change and clear any existing error
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match')
    return
  }
  try {
    await register(formData.username, formData.email, formData.password)
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
          <h1>Create your account</h1>
          <p>Join GridChamp and start predicting today</p>
        </div>

        {/* Show error message if validation fails */}
        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* Username input field */}
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. max_fan33"
              required
            />
          </div>

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

          {/* Confirm password field to catch typos */}
          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.btnPrimary}>
            Create account
          </button>
        </form>

        {/* Link back to login for existing users */}
        <p className={styles.switch}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register