import { useEffect, useState } from 'react';

const LOADING_MESSAGES = ['Initializing AI', 'Loading health profile', 'Syncing health data', 'Preparing dashboard'];

const HEALTH_FACTS = [
  'Walking 10,000 steps burns roughly 300-500 calories for most adults.',
  'Muscle recovers most efficiently during deep sleep, not rest days.',
  'Drinking water before meals can reduce overall calorie intake.',
  'Just 2.5 hours of moderate cardio a week meaningfully lowers heart disease risk.',
  'Protein has the highest thermic effect of any macronutrient.'
];

const STAGES = ['heart', 'feet', 'logo'] as const;

export default function Splash({ onDone, userName }: { onDone: () => void; userName?: string }) {
  const [stage, setStage] = useState<typeof STAGES[number]>('heart');
  const [msgIndex, setMsgIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('feet'), 900);
    const t2 = setTimeout(() => setStage('logo'), 1800);
    const t3 = setTimeout(() => setShowWelcome(true), 2600);
    const t4 = setTimeout(onDone, 4200);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length), 850);
    const factTimer = setInterval(() => setFactIndex((i) => (i + 1) % HEALTH_FACTS.length), 1700);
    const progTimer = setInterval(() => setProgress((p) => Math.min(100, p + 3)), 90);
    return () => {
      clearInterval(msgTimer);
      clearInterval(factTimer);
      clearInterval(progTimer);
    };
  }, []);

  const circumference = 2 * Math.PI * 54;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(160deg, #202022 0%, #2c2836 55%, #3a3350 100%)',
        color: '#F6F6F6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        zIndex: 100
      }}
    >
      <div style={{ position: 'relative', width: 132, height: 132 }}>
        <svg width={132} height={132} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={66} cy={66} r={54} fill="none" stroke="rgba(246,246,246,0.12)" strokeWidth={4} />
          <circle
            cx={66}
            cy={66}
            r={54}
            fill="none"
            stroke="#F3BA60"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            style={{ transition: 'stroke-dashoffset 0.2s linear' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 46
          }}
        >
          <span key={stage} className="splash-icon" style={{ animation: 'splashPop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {stage === 'heart' && (
              <span style={{ color: '#F3BA60', filter: 'drop-shadow(0 0 14px rgba(243,186,96,0.75))' }}>♥</span>
            )}
            {stage === 'feet' && <span style={{ color: '#E0DBF3' }}>👣</span>}
            {stage === 'logo' && (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: '#F6F6F6' }}>
                V
              </span>
            )}
          </span>
        </div>
      </div>

      {!showWelcome ? (
        <div style={{ textAlign: 'center', minHeight: 60 }}>
          <p key={msgIndex} style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', animation: 'fadeUp 0.4s ease' }}>
            {LOADING_MESSAGES[msgIndex]}…
          </p>
          <p key={`fact-${factIndex}`} className="muted" style={{ fontSize: 12, marginTop: 10, maxWidth: 280, color: '#B6B1C0', animation: 'fadeUp 0.4s ease' }}>
            {HEALTH_FACTS[factIndex]}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>
            {userName ? `Welcome back, ${userName}` : 'Welcome to Vitalis'}
          </h2>
          <p style={{ fontSize: 13, color: '#B6B1C0', marginTop: 6 }}>Your health profile is ready.</p>
        </div>
      )}

      <style>{`
        @keyframes splashPop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
