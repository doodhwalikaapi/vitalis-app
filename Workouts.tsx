:root {
  --bg: #F6F6F6;
  --surface: #FFFFFF;
  --surface-2: #EFEDF7;
  --lavender: #E0DBF3;
  --amber: #F3BA60;
  --muted: #B6B1C0;
  --ink-soft: #736A6A;
  --ink: #202022;
  --ring-track: rgba(32, 32, 34, 0.08);
  --shadow: 0 8px 24px rgba(32, 32, 34, 0.08);
  --shadow-lg: 0 16px 48px rgba(32, 32, 34, 0.14);
  --radius-sm: 12px;
  --radius: 20px;
  --radius-lg: 28px;
  --font-display: 'Fraunces', serif;
  --font-body: 'Sora', system-ui, sans-serif;
}

[data-theme='dark'] {
  --bg: #17171A;
  --surface: #202022;
  --surface-2: #2A2A2E;
  --lavender: #34304A;
  --amber: #F3BA60;
  --muted: #726D82;
  --ink-soft: #B6B1C0;
  --ink: #F6F6F6;
  --ring-track: rgba(246, 246, 246, 0.1);
  --shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);
}

* { box-sizing: border-box; }
html, body, #root { height: 100%; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  transition: background 0.3s ease, color 0.3s ease;
}

h1, h2, h3, .display {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
}

p { margin: 0; }

button, input, select, textarea { font-family: inherit; }

a { color: inherit; text-decoration: none; }

::selection { background: var(--amber); color: var(--ink); }

:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}

.app-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.container {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px;
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  padding: 13px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary { background: var(--ink); color: var(--bg); }
.btn-primary:hover { box-shadow: var(--shadow); }

.btn-accent { background: var(--amber); color: #202022; }
.btn-accent:hover { box-shadow: 0 8px 20px rgba(243, 186, 96, 0.45); }

.btn-ghost {
  background: transparent;
  color: var(--ink);
  border: 1.5px solid var(--ring-track);
}

.input {
  width: 100%;
  padding: 13px 16px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--ring-track);
  background: var(--surface);
  color: var(--ink);
  font-size: 15px;
}
.input:focus { border-color: var(--amber); outline: none; }

.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
  margin-bottom: 6px;
  display: block;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.pill.active {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}

.grid {
  display: grid;
  gap: 16px;
}

@media (min-width: 720px) {
  .grid-2 { grid-template-columns: 1fr 1fr; }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
}

.muted { color: var(--ink-soft); }

.scale-in {
  animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes scaleIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
