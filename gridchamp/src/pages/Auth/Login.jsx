import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.username, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>
            Grid<span>Champ</span>
          </Link>
          <h1>Welcome back</h1>
          <p>Log in to your account to continue predicting</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
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

        <p className={styles.switch}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
