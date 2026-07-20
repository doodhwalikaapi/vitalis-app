import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const GOAL_OPTIONS = [
  'Improve Heart Health', 'Lose Weight', 'Burn Fat', 'Gain Weight', 'Build Muscle',
  'Improve Sleep', 'Increase Endurance', 'Improve Flexibility', 'Healthy Lifestyle', 'Reduce Stress'
];

export default function Profile() {
  const { user, goals, refresh } = useAuth();
  const [form, setForm] = useState({ username: '', age: '', gender: '', heightCm: '', weightKg: '', activityLevel: '' });
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        age: String(user.age),
        gender: user.gender,
        heightCm: String(user.height_cm),
        weightKg: String(user.weight_kg),
        activityLevel: user.activity_level
      });
    }
    setSelectedGoals(goals);
  }, [user, goals]);

  function toggleGoal(g: string) {
    setSelectedGoals((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api.put('/api/profile', {
        username: form.username,
        age: Number(form.age),
        gender: form.gender,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        activityLevel: form.activityLevel
      });
      await api.put('/api/profile/goals', { goals: selectedGoals });
      await refresh();
      setMsg('Profile updated — your health targets have been recalculated.');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg('');
    try {
      await api.post('/api/auth/reset-password', pwForm);
      setPwMsg('Password updated.');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      setPwMsg(err.message);
    }
  }

  if (!user) return null;

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 16 }}>Your profile</h1>

      <form onSubmit={saveProfile} className="card" style={{ marginBottom: 16 }}>
        <p className="label" style={{ marginBottom: 12, fontSize: 15 }}>Personal details</p>
        <div className="grid grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Age</label>
            <input className="input" type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input className="input" type="number" value={form.heightCm} onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input className="input" type="number" value={form.weightKg} onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} />
          </div>
          <div>
            <label className="label">Activity level</label>
            <select className="input" value={form.activityLevel} onChange={(e) => setForm((f) => ({ ...f, activityLevel: e.target.value }))}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very active</option>
            </select>
          </div>
        </div>

        <p className="label" style={{ margin: '16px 0 10px', fontSize: 15 }}>Goals</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {GOAL_OPTIONS.map((g) => (
            <button type="button" key={g} className={`pill${selectedGoals.includes(g) ? ' active' : ''}`} onClick={() => toggleGoal(g)}>
              {g}
            </button>
          ))}
        </div>

        {msg && <p style={{ fontSize: 13, marginBottom: 12, color: msg.includes('updated') ? '#2E8B57' : '#C0392B' }}>{msg}</p>}
        <button className="btn btn-accent" type="submit">Save changes</button>
      </form>

      <form onSubmit={changePassword} className="card">
        <p className="label" style={{ marginBottom: 12, fontSize: 15 }}>Change password</p>
        <div className="grid grid-2" style={{ marginBottom: 12 }}>
          <input
            className="input"
            type="password"
            placeholder="Current password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
          />
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
          />
        </div>
        {pwMsg && <p style={{ fontSize: 13, marginBottom: 12 }}>{pwMsg}</p>}
        <button className="btn btn-ghost" type="submit">Update password</button>
      </form>
    </div>
  );
}
