import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'linear-gradient(160deg, var(--bg) 0%, var(--lavender) 130%)'
      }}
    >
      <form onSubmit={handleSubmit} className="card scale-in" style={{ width: '100%', maxWidth: 400 }}>
        <h1 className="display" style={{ fontSize: 28, marginBottom: 6 }}>
          Welcome back
        </h1>
        <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
          Log in to keep your streak going.
        </p>

        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          className="input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          className="input"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 8 }}
        />

        {error && (
          <p style={{ color: '#C0392B', fontSize: 13, marginTop: 8 }}>{error}</p>
        )}

        <button className="btn btn-accent" type="submit" disabled={loading} style={{ width: '100%', marginTop: 16 }}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p className="muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          New here? <Link to="/signup" style={{ color: 'var(--ink)', fontWeight: 700 }}>Create an account</Link>
        </p>
      </form>
    </div>
  );
}
