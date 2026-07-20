import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Recipe {
  id: string;
  name: string;
  mealType: string;
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  prepTimeMin: number;
  ingredients: string[];
  instructions: string[];
  healthierAlt: string;
}

export default function Nutrition() {
  const [tab, setTab] = useState<'plan' | 'library' | 'today'>('plan');
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [library, setLibrary] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<any>(null);

  useEffect(() => {
    api.get('/api/nutrition/plan').then(setMealPlan);
    loadLibrary();
    loadToday();
  }, []);

  async function loadLibrary(q = '') {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const d = await api.get(`/api/nutrition/recipes?${params.toString()}`);
    setLibrary(d.recipes);
  }

  async function loadToday() {
    const d = await api.get('/api/nutrition/today');
    setTodayLog(d);
  }

  async function logMeal(recipe: Recipe) {
    await api.post('/api/nutrition/log', { recipeId: recipe.id, mealType: recipe.mealType });
    loadToday();
  }

  function RecipeCard({ r }: { r: Recipe }) {
    const isOpen = expanded === r.id;
    return (
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : r.id)}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</p>
            <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              {r.calories} kcal · P{r.proteinG} C{r.carbG} F{r.fatG} · {r.prepTimeMin} min
            </p>
          </div>
          <button className="btn btn-ghost" style={{ padding: '8px 14px', height: 'fit-content' }} onClick={(e) => { e.stopPropagation(); logMeal(r); }}>
            Log
          </button>
        </div>
        {isOpen && (
          <div style={{ marginTop: 14, borderTop: '1px solid var(--ring-track)', paddingTop: 14 }}>
            <p className="label">Ingredients</p>
            <ul style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
              {r.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
            <p className="label">Instructions</p>
            <ol style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
              {r.instructions.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <p style={{ fontSize: 13, marginTop: 8 }}><strong>Healthier swap:</strong> {r.healthierAlt}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Fiber: {r.fiberG}g</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 16 }}>Nutrition</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`pill${tab === 'plan' ? ' active' : ''}`} onClick={() => setTab('plan')}>AI Meal Plan</button>
        <button className={`pill${tab === 'library' ? ' active' : ''}`} onClick={() => setTab('library')}>Recipes</button>
        <button className={`pill${tab === 'today' ? ' active' : ''}`} onClick={() => setTab('today')}>Today's Log</button>
      </div>

      {tab === 'plan' && mealPlan && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="label">Daily calorie target</p>
            <p className="display" style={{ fontSize: 24 }}>{mealPlan.calorieTarget} kcal</p>
          </div>
          {Object.entries(mealPlan.plan).map(([meal, recipes]: [string, any]) => (
            <div key={meal} style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, textTransform: 'capitalize' }}>{meal}</p>
              {recipes.map((r: Recipe) => <RecipeCard key={r.id} r={r} />)}
            </div>
          ))}
        </div>
      )}

      {tab === 'library' && (
        <div>
          <input
            className="input"
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); loadLibrary(e.target.value); }}
            style={{ marginBottom: 16 }}
          />
          {library.map((r) => <RecipeCard key={r.id} r={r} />)}
        </div>
      )}

      {tab === 'today' && todayLog && (
        <div>
          <div className="grid grid-3" style={{ marginBottom: 16 }}>
            <div className="card"><p className="label">Calories</p><p className="display" style={{ fontSize: 22 }}>{todayLog.totals.calories}</p></div>
            <div className="card"><p className="label">Protein</p><p className="display" style={{ fontSize: 22 }}>{todayLog.totals.proteinG}g</p></div>
            <div className="card"><p className="label">Fiber</p><p className="display" style={{ fontSize: 22 }}>{todayLog.totals.fiberG}g</p></div>
          </div>
          {todayLog.logged.length === 0 && <p className="muted">Nothing logged yet today — log a meal from the plan or recipe library.</p>}
          {todayLog.logged.map((l: any, i: number) => l.recipe && (
            <div key={i} className="card" style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 700 }}>{l.recipe.name}</p>
              <p className="muted" style={{ fontSize: 13 }}>{l.meal_type} · {l.recipe.calories} kcal</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
