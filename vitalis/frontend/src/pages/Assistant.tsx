import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

interface Msg { role: 'user' | 'assistant'; text: string; }

const SUGGESTIONS = [
  'How many calories should I eat?',
  'How much protein do I need?',
  'How much water should I drink?',
  'How much sleep do I need?',
  "What's my BMI?",
  'How should I recover after a hard workout?'
];

export default function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: "Hi! I'm your Vitalis health assistant. Ask me anything about your workouts, nutrition, sleep, or recovery — I'll answer using your actual profile." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/api/assistant/ask', { question: text });
      setMessages((m) => [...m, { role: 'assistant', text: res.answer }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: 'assistant', text: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingBottom: 100, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 16 }}>AI Assistant</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} className="pill" onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'var(--ink)' : 'var(--surface-2)',
              color: m.role === 'user' ? 'var(--bg)' : 'var(--ink)',
              padding: '10px 16px',
              borderRadius: 16,
              maxWidth: '80%',
              fontSize: 14,
              lineHeight: 1.5
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="muted" style={{ fontSize: 13 }}>Thinking…</div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        style={{ display: 'flex', gap: 10 }}
      >
        <input
          className="input"
          placeholder="Ask about your health…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-accent" type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}
