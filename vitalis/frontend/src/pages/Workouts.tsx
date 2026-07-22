import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Illustration from '../components/Illustration';

function primaryVariant(tags: string[]): any {
  const order = ['strength', 'hiit', 'cardio', 'endurance', 'mobility', 'full_body'];
  return order.find((t) => tags.includes(t)) || 'full_body';
}

interface Exercise {
  id: string;
  name: string;
  level: string;
  tags: string[];
  muscles: string[];
  sets: number;
  reps?: number;
  durationSec?: number;
  restSec: number;
  caloriesPerSet: number;
  instructions: string[];
  safetyTips: string;
}

export default function Workouts() {
  const [tab, setTab] = useState<'plan' | 'library' | 'favorites'>('plan');
  const [plan, setPlan] = useState<Record<string, any> | null>(null);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [favorites, setFavorites] = useState<Exercise[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/api/workouts/plan').then((d) => setPlan(d.plan));
    api.get('/api/workouts/favorites').then((d) => {
      setFavorites(d.exercises);
      setFavIds(new Set(d.exercises.map((e: Exercise) => e.id)));
    });
    loadLibrary();
  }, []);

  async function loadLibrary(q = '', level = '') {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (level) params.set('level', level);
    const d = await api.get(`/api/workouts/exercises?${params.toString()}`);
    setLibrary(d.exercises);
  }

  async function toggleFavorite(id: string) {
    if (favIds.has(id)) {
      await api.delete(`/api/workouts/favorites/${id}`);
      setFavIds((s) => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await api.post(`/api/workouts/favorites/${id}`);
      setFavIds((s) => new Set(s).add(id));
    }
  }

  async function markComplete(ex: Exercise) {
    await api.post('/api/workouts/complete', {
      exerciseId: ex.id,
      sets: ex.sets,
      reps: ex.reps,
      durationMin: ex.durationSec ? Math.round(ex.durationSec / 60) : null,
      caloriesBurned: ex.caloriesPerSet * ex.sets
    });
    setCompletedIds((s) => new Set(s).add(ex.id));
  }

  function ExerciseCard({ ex }: { ex: Exercise }) {
    const isOpen = expanded === ex.id;
    const isFav = favIds.has(ex.id);
    const isDone = completedIds.has(ex.id);
    return (
      <div className="card" style={{ marginBottom: 12, overflow: 'hidden', padding: 0 }}>
        <Illustration variant={primaryVariant(ex.tags)} seed={ex.id} height={110} />
        <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : ex.id)}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{ex.name}</p>
            <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              {ex.muscles.join(', ')} · {ex.level} · {ex.sets} sets {ex.reps ? `× ${ex.reps} reps` : ex.durationSec ? `× ${ex.durationSec}s` : ''}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id); }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: isFav ? 'var(--amber)' : 'var(--muted)' }}
            aria-label="Favorite"
          >
            {isFav ? '★' : '☆'}
          </button>
        </div>
        {isOpen && (
          <div style={{ marginTop: 14, borderTop: '1px solid var(--ring-track)', paddingTop: 14 }}>
            <p className="label">Steps</p>
            <ol style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
              {ex.instructions.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <p style={{ fontSize: 13, marginTop: 8 }}><strong>Safety:</strong> {ex.safetyTips}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Rest {ex.restSec}s between sets · ~{ex.caloriesPerSet} kcal/set</p>
            <button className="btn btn-accent" style={{ marginTop: 12 }} disabled={isDone} onClick={() => markComplete(ex)}>
              {isDone ? 'Completed ✓' : 'Mark as completed'}
            </button>
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 16 }}>Workouts</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`pill${tab === 'plan' ? ' active' : ''}`} onClick={() => setTab('plan')}>AI Weekly Plan</button>
        <button className={`pill${tab === 'library' ? ' active' : ''}`} onClick={() => setTab('library')}>Library</button>
        <button className={`pill${tab === 'favorites' ? ' active' : ''}`} onClick={() => setTab('favorites')}>Favorites</button>
      </div>

      {tab === 'plan' && plan && (
        <div className="grid" style={{ gap: 16 }}>
          {Object.entries(plan).map(([day, info]: [string, any]) => (
            <div key={day} className="card">
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{day}</p>
              {info.restDay ? (
                <p className="muted" style={{ fontSize: 14 }}>{info.note}</p>
              ) : (
                <div>{info.exercises.map((ex: Exercise) => <ExerciseCard key={ex.id + day} ex={ex} />)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'library' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="Search exercises…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); loadLibrary(e.target.value, levelFilter); }}
              style={{ flex: 1, minWidth: 200 }}
            />
            <select className="input" style={{ maxWidth: 160 }} value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); loadLibrary(search, e.target.value); }}>
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          {library.map((ex) => <ExerciseCard key={ex.id} ex={ex} />)}
        </div>
      )}

      {tab === 'favorites' && (
        <div>
          {favorites.length === 0 && <p className="muted">No favorites yet — tap the star on any exercise.</p>}
          {favorites.map((ex) => <ExerciseCard key={ex.id} ex={ex} />)}
        </div>
      )}
    </div>
  );
}
