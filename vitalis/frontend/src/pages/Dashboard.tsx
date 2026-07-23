import { useEffect, useState } from 'react';
import { api, API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardData {
  metrics: any;
  today: any;
  history: any[];
  streakDays: number;
  badges: { badge_key: string }[];
  weeklyGoals: string[];
  insights: string[];
  quote: string;
}

const BADGE_LABELS: Record<string, string> = {
  step_goal_hit: '👣 Step Goal Hit',
  week_streak: '🔥 7-Day Streak',
  month_streak: '🏆 30-Day Streak',
  hydration_hero: '💧 Hydration Hero'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [manualEntry, setManualEntry] = useState({ steps: '', sleepHours: '', waterMl: '', heartRate: '' });

  async function load() {
    try {
      const res = await api.get('/api/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, number> = {};
    if (manualEntry.steps) payload.steps = Number(manualEntry.steps);
    if (manualEntry.sleepHours) payload.sleepHours = Number(manualEntry.sleepHours);
    if (manualEntry.waterMl) payload.waterMl = Number(manualEntry.waterMl);
    if (manualEntry.heartRate) payload.heartRate = Number(manualEntry.heartRate);
    await api.post('/api/metrics/sync', { source: 'manual', ...payload });
    setManualEntry({ steps: '', sleepHours: '', waterMl: '', heartRate: '' });
    load();
  }

  if (error) return <div className="container" style={{ padding: 40 }}>Couldn't load dashboard: {error}</div>;
  if (!data) return <div className="container" style={{ padding: 40 }}>Loading your dashboard…</div>;

  const { metrics, today, history, streakDays, badges, weeklyGoals, insights, quote } = data;

  const chartData = history.map((h) => ({
    date: new Date(h.logged_date).toLocaleDateString(undefined, { weekday: 'short' }),
    steps: Number(h.steps) || 0,
    sleep: Number(h.sleep_hours) || 0
  }));

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <div className="scale-in" style={{ marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 26 }}>Hi {user?.username} 👋</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>"{quote}"</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ProgressRing value={today.steps} max={metrics.dailyStepGoal} color="var(--amber)" label={`${today.steps}`} sublabel="steps" />
          <p style={{ fontSize: 13, fontWeight: 600 }}>Goal: {metrics.dailyStepGoal.toLocaleString()}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ProgressRing value={today.water_ml} max={metrics.waterIntakeMl} color="#7FB3D5" label={`${(today.water_ml / 1000).toFixed(1)}L`} sublabel="water" />
          <p style={{ fontSize: 13, fontWeight: 600 }}>Goal: {(metrics.waterIntakeMl / 1000).toFixed(1)}L</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ProgressRing value={metrics.bmi} max={35} color="var(--lavender)" label={`${metrics.bmi}`} sublabel="BMI" />
          <p style={{ fontSize: 13, fontWeight: 600 }}>{metrics.bmiCategory}</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="label">Daily calories</p>
          <p className="display" style={{ fontSize: 26 }}>{metrics.calorieTarget}</p>
          <p className="muted" style={{ fontSize: 13 }}>kcal target</p>
        </div>
        <div className="card">
          <p className="label">Protein / Carbs / Fat</p>
          <p className="display" style={{ fontSize: 20 }}>{metrics.macros.proteinG}g / {metrics.macros.carbG}g / {metrics.macros.fatG}g</p>
          <p className="muted" style={{ fontSize: 13 }}>macro targets</p>
        </div>
        <div className="card">
          <p className="label">Streak</p>
          <p className="display" style={{ fontSize: 26 }}>{streakDays} 🔥</p>
          <p className="muted" style={{ fontSize: 13 }}>days logged in a row</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="label" style={{ marginBottom: 12 }}>Steps — last 7 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ring-track)" />
              <XAxis dataKey="date" fontSize={12} stroke="var(--ink-soft)" />
              <YAxis fontSize={12} stroke="var(--ink-soft)" />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: 12 }} />
              <Line type="monotone" dataKey="steps" stroke="#F3BA60" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <p className="label" style={{ marginBottom: 12 }}>Sleep — last 7 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ring-track)" />
              <XAxis dataKey="date" fontSize={12} stroke="var(--ink-soft)" />
              <YAxis fontSize={12} stroke="var(--ink-soft)" />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: 12 }} />
              <Line type="monotone" dataKey="sleep" stroke="#A594D1" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="label" style={{ marginBottom: 10 }}>AI insights</p>
          {insights.map((ins: string, i: number) => (
            <p key={i} style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>💡 {ins}</p>
          ))}
        </div>
        <div className="card">
          <p className="label" style={{ marginBottom: 10 }}>This week's goals</p>
          {weeklyGoals.map((g: string, i: number) => (
            <p key={i} style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>✓ {g}</p>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="label" style={{ marginBottom: 10 }}>Log today's activity</p>
          <form onSubmit={submitManual} className="grid grid-2" style={{ gap: 10 }}>
            <input className="input" placeholder="Steps" type="number" value={manualEntry.steps} onChange={(e) => setManualEntry((m) => ({ ...m, steps: e.target.value }))} />
            <input className="input" placeholder="Sleep (hrs)" type="number" step="0.1" value={manualEntry.sleepHours} onChange={(e) => setManualEntry((m) => ({ ...m, sleepHours: e.target.value }))} />
            <input className="input" placeholder="Water (ml)" type="number" value={manualEntry.waterMl} onChange={(e) => setManualEntry((m) => ({ ...m, waterMl: e.target.value }))} />
            <input className="input" placeholder="Heart rate (bpm)" type="number" value={manualEntry.heartRate} onChange={(e) => setManualEntry((m) => ({ ...m, heartRate: e.target.value }))} />
            <button className="btn btn-primary" type="submit" style={{ gridColumn: '1 / -1' }}>Save entry</button>
          </form>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Connects automatically to Apple HealthKit / Android Health Connect when running as a native wrapper — use manual entry in the browser.
          </p>
        </div>
        <div className="card">
          <p className="label" style={{ marginBottom: 10 }}>Achievements</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {badges.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Log activity to start earning badges.</p>}
            {badges.map((b) => (
              <span key={b.badge_key} className="pill active">{BADGE_LABELS[b.badge_key] || b.badge_key}</span>
            ))}
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 16 }}
            onClick={async () => {
              const token = localStorage.getItem('vitalis_token');
              const res = await fetch(`${API_URL}/api/dashboard/export`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'vitalis-health-report.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export health report
          </button>
        </div>
      </div>
    </div>
  );
}
