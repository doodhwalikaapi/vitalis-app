# Vitalis — AI Healthcare & Fitness App

A full-stack, responsive AI health & fitness platform: secure auth, a real
BMI/BMR/TDEE/macro calculation engine, AI-personalized workout & meal plans,
an AI health assistant, activity tracking with badges/streaks, and a
dashboard with progress rings and charts. Built to run in any modern
browser on phone, tablet, or desktop.

```
vitalis/
├── backend/     Node.js + Express + PostgreSQL REST API
├── frontend/    React + TypeScript + Vite responsive web app
└── render.yaml  One-click Render Blueprint (API + static site + database)
```

**Stack:** Node/Express, PostgreSQL, JWT auth + bcrypt, React 18, TypeScript,
Vite, Recharts. No native mobile build tooling is included — see
[Mobile & wearables](#mobile--wearables-note) below for how to extend this
into a native app later.

---

## 1. Run it locally first (recommended)

### Backend
```bash
cd backend
cp .env.example .env      # edit DATABASE_URL etc.
npm install
npm run migrate           # creates all tables (also runs automatically on boot)
npm run dev                # http://localhost:4000
```
You need a local PostgreSQL instance, or point `DATABASE_URL` at any hosted
Postgres (Render, Supabase, Neon, etc.).

### Frontend
```bash
cd frontend
cp .env.example .env      # set VITE_API_URL=http://localhost:4000
npm install
npm run dev                # http://localhost:5173
```

Open http://localhost:5173, sign up, and you're in.

---

## 2. Deploy to Render

You have two options: the one-click **Blueprint** (fastest), or manual
service creation (more control). Both produce the same three pieces:
a PostgreSQL database, the Express API, and the static React frontend.

### Option A — One-click Blueprint (fastest)

1. Push this project to a GitHub (or GitLab) repository. The `render.yaml`
   file at the repo root is a **Render Blueprint** that defines all three
   resources for you.
2. Go to the [Render Dashboard](https://dashboard.render.com) → **New** →
   **Blueprint**.
3. Connect the repository. Render will detect `render.yaml` and show you a
   preview of the resources it's about to create: `vitalis-db` (Postgres),
   `vitalis-backend` (web service), `vitalis-frontend` (static site).
4. Click **Apply**. Render provisions the database, injects its connection
   string into the backend automatically, and generates a random `JWT_SECRET`
   for you.
5. Wait for both services to finish deploying (watch the logs). The backend
   runs its migration automatically on boot, so tables are created for you.
6. **Important — fix the cross-links once, after first deploy:**
   - Render gives your frontend a URL like `https://vitalis-frontend-xxxx.onrender.com`.
     Open the `vitalis-backend` service → **Environment** → set `CLIENT_ORIGIN`
     to that exact URL, then save (this triggers a redeploy).
   - Open the `vitalis-frontend` service → **Environment** → set
     `VITE_API_URL` to your backend's URL, e.g.
     `https://vitalis-backend-xxxx.onrender.com`, then **Manual Deploy** →
     **Clear build cache & deploy** (static sites bake env vars in at build
     time, so a rebuild is required).
7. Visit your frontend URL — sign up and you're live.

### Option B — Manual setup (if you'd rather not use a Blueprint)

**Step 1 — Create the database**
1. Render Dashboard → **New** → **PostgreSQL**.
2. Name it `vitalis-db`, choose the free plan, and create it.
3. Once provisioned, copy the **Internal Database URL** shown on its page —
   you'll paste this into the backend service in Step 2.

**Step 2 — Deploy the backend API**
1. Push this project to GitHub/GitLab.
2. Render Dashboard → **New** → **Web Service** → connect your repo.
3. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. Add environment variables (Environment tab):
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = the Internal Database URL from Step 1
   - `JWT_SECRET` = any long random string (Render can auto-generate one)
   - `JWT_EXPIRES_IN` = `30d`
   - `CLIENT_ORIGIN` = leave blank for now, you'll set it in Step 4
5. Deploy. On boot, the server automatically creates all database tables.
   Check the logs for `✅ Database schema is up to date.`

**Step 3 — Deploy the frontend**
1. Render Dashboard → **New** → **Static Site** → connect the same repo.
2. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Add a **Redirect/Rewrite Rule** so client-side routing works:
   - Source: `/*` → Destination: `/index.html` → Action: **Rewrite**
4. Environment variable:
   - `VITE_API_URL` = your backend's URL from Step 2, e.g.
     `https://vitalis-backend.onrender.com`
5. Deploy.

**Step 4 — Connect the two**
1. Copy your frontend's live URL (e.g. `https://vitalis-frontend.onrender.com`).
2. Go back to the backend service → **Environment** → set `CLIENT_ORIGIN` to
   that URL → save (redeploys automatically). This is what allows your
   frontend's browser requests to pass CORS.
3. Visit your frontend URL and sign up.

### Notes on Render's free tier
- Free web services **spin down after inactivity** and take ~30-60s to wake
  on the next request — the first API call after idle time will be slow.
  This is normal; upgrade to a paid instance to avoid it.
- Free PostgreSQL databases on Render expire after 30 days unless upgraded.
- To enable the live AI assistant (instead of the built-in rule-based
  engine), add an `ANTHROPIC_API_KEY` environment variable to the backend
  service — no code changes needed, it's already wired up in
  `backend/src/routes/assistant.js`.

---

## 3. What's implemented

- **Auth:** signup/login with bcrypt + JWT, profile editing, password reset.
- **Health engine:** Mifflin-St Jeor BMR, TDEE, BMI, ideal weight range,
  goal-adjusted calorie/macro targets, water intake, sleep recommendation,
  step goals — recalculated live whenever profile/goals change.
- **AI workout plans:** 7-day split generated from the user's fitness level
  and goals, pulling from a 15-exercise library (search/filter/favorite/
  complete, with instructions, muscles, calories, safety tips).
- **AI meal plans:** goal-aware meal plan from a 12-recipe library (search,
  log meals, daily macro totals).
- **AI health assistant:** answers questions using the user's real profile;
  automatically upgrades to a live Claude API call if `ANTHROPIC_API_KEY`
  is set.
- **Dashboard:** progress rings, 7-day charts, streaks, badges, AI insights,
  weekly goals, motivational quotes, JSON health report export.
- **Activity sync API:** `/api/metrics/sync` accepts `source: manual |
  healthkit | health_connect` and merges multi-device data (max-value wins)
  so switching devices never loses progress — ready for a native wrapper.
- **Design:** the requested color palette, light/dark mode, rounded cards,
  animated splash screen (glowing heart → footsteps → logo, progress ring,
  rotating health facts, loading messages, welcome message).

## Mobile & wearables note

This build ships as a responsive web app rather than separate native iOS/
Android binaries, because true Apple HealthKit and Android Health Connect
integration requires native SDKs compiled through Xcode/Android Studio,
which can't be produced in this environment. The backend's `/api/metrics/
sync` endpoint is already designed for this: wrap the frontend in
[Capacitor](https://capacitorjs.com/) or React Native, and have the native
layer POST HealthKit/Health Connect readings to that endpoint with
`source: "healthkit"` or `source: "health_connect"` — the merge logic
(highest value wins per day) is already implemented server-side.
