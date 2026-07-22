import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOAL_OPTIONS = [
  'Improve Heart Health',
  'Lose Weight',
  'Burn Fat',
  'Gain Weight',
  'Build Muscle',
  'Improve Sleep',
  'Increase Endurance',
  'Improve Flexibility',
  'Healthy Lifestyle',
  'Reduce Stress'
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    gender: 'female',
    heightCm: '',
    weightKg: '',
    activityLevel: 'moderate'
  });
  const [goals, setGoals] = useState<string[]>([]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleGoal(goal: string) {
    setGoals((g) => (g.includes(goal) ? g.filter((x) => x !== goal) : [...g, goal]));
  }

  async function handleFinish() {
    setError('');
    setLoading(true);
    try {
      await signup({
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        goals
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setStep(1);
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
      <div className="card scale-in" style={{ width: '100%', maxWidth: 460 }}>
        {step === 1 && (
          <>
            <h1 className="display" style={{ fontSize: 28, marginBottom: 6 }}>Create your account</h1>
            <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>Step 1 of 2 — your details</p>

            <div className="grid" style={{ gap: 12 }}>
              <div>
                <label className="label">Username</label>
                <input className="input" value={form.username} onChange={(e) => update('username', e.target.value)} required minLength={3} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
              </div>
              <div className="grid grid-2">
                <div>
                  <label className="label">Age</label>
                  <input className="input" type="number" value={form.age} onChange={(e) => update('age', e.target.value)} required min={10} max={120} />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-2">
                <div>
                  <label className="label">Height (cm)</label>
                  <input className="input" type="number" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} required min={50} max={260} />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input className="input" type="number" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} required min={20} max={400} />
                </div>
              </div>
              <div>
                <label className="label">Activity level</label>
                <select className="input" value={form.activityLevel} onChange={(e) => update('activityLevel', e.target.value)}>
                  <option value="sedentary">Sedentary (little/no exercise)</option>
                  <option value="light">Light (1-3 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very active (hard training/physical job)</option>
                </select>
              </div>
            </div>

            {error && <p style={{ color: '#C0392B', fontSize: 13, marginTop: 12 }}>{error}</p>}

            <button
              className="btn btn-accent"
              style={{ width: '100%', marginTop: 20 }}
              onClick={() => {
                if (form.username.length >= 3 && form.email && form.password.length >= 8 && form.age && form.heightCm && form.weightKg) {
                  setError('');
                  setStep(2);
                } else {
                  setError('Please fill in all fields (password min. 8 characters).');
                }
              }}
            >
              Continue
            </button>

            <p className="muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 700 }}>Log in</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="display" style={{ fontSize: 28, marginBottom: 6 }}>What are your goals?</h1>
            <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>Step 2 of 2 — pick as many as you like</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  className={`pill${goals.includes(goal) ? ' active' : ''}`}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>

            {error && <p style={{ color: '#C0392B', fontSize: 13, marginTop: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>
                Back
              </button>
              <button className="btn btn-accent" onClick={handleFinish} disabled={loading || goals.length === 0} style={{ flex: 2 }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
