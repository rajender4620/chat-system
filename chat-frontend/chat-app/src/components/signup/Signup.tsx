import { useState, type FormEventHandler } from "react"
import { useNavigate, Link } from "react-router-dom"
import { API_URL } from "../../config"
import "../login/logic.css"   // reuse the same auth styles

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || 'Signup failed')
      }

      localStorage.setItem('token', json.token)
      sessionStorage.setItem('user', JSON.stringify(json.user))

      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Create your account</h1>
        <p className="login-subtitle">Sign up to start chatting</p>

        {error && <p className="login-error">{error}</p>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </label>

          <label className="login-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="login-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="login-footer">
          Already a user? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
