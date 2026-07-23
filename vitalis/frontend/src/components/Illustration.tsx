type Variant =
  | 'strength' | 'cardio' | 'mobility' | 'hiit' | 'endurance' | 'full_body'
  | 'breakfast' | 'lunch' | 'dinner' | 'snack';

const PALETTE = {
  amber: '#F3BA60',
  lavender: '#E0DBF3',
  muted: '#B6B1C0',
  ink: '#202022'
};

// Deterministic pseudo-random offset so each card's blobs look slightly
// different without being random on every render (keeps it stable).
function seededOffset(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 97;
  return h;
}

export default function Illustration({ variant, seed = '', height = 120 }: { variant: Variant; seed?: string; height?: number | string }) {
  const o = seededOffset(seed);
  const dx = (o % 10) - 5;
  const dy = ((o * 3) % 10) - 5;

  const blobBg = (
    <>
      <circle cx={30 + dx} cy={26 + dy} r="34" fill={PALETTE.lavender} opacity="0.9" />
      <circle cx={92 - dx} cy={70 - dy} r="26" fill={PALETTE.amber} opacity="0.85" />
    </>
  );

  let icon;
  switch (variant) {
    case 'strength':
      icon = (
        <g stroke={PALETTE.ink} strokeWidth="4" strokeLinecap="round">
          <line x1="34" y1="52" x2="86" y2="52" />
          <rect x="24" y="40" width="12" height="24" rx="3" fill={PALETTE.ink} stroke="none" />
          <rect x="84" y="40" width="12" height="24" rx="3" fill={PALETTE.ink} stroke="none" />
        </g>
      );
      break;
    case 'cardio':
    case 'hiit':
      icon = (
        <polyline
          points="20,54 38,54 46,34 56,72 64,44 72,54 100,54"
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
      break;
    case 'endurance':
    case 'full_body':
      icon = (
        <g fill="none" stroke={PALETTE.ink} strokeWidth="4" strokeLinecap="round">
          <circle cx="60" cy="52" r="22" />
          <path d="M60 40 L60 52 L70 58" />
        </g>
      );
      break;
    case 'mobility':
      icon = (
        <path
          d="M28 62 Q46 26 60 52 Q74 78 92 42"
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
      break;
    case 'breakfast':
      icon = (
        <g>
          <ellipse cx="60" cy="58" rx="26" ry="16" fill="none" stroke={PALETTE.ink} strokeWidth="4" />
          <circle cx="52" cy="52" r="6" fill={PALETTE.ink} />
          <circle cx="68" cy="50" r="4" fill={PALETTE.ink} opacity="0.6" />
        </g>
      );
      break;
    case 'lunch':
      icon = (
        <g fill="none" stroke={PALETTE.ink} strokeWidth="4" strokeLinecap="round">
          <path d="M36 34 v18 M36 34 a6 6 0 000 12" />
          <path d="M50 34 v30" />
          <path d="M84 34 c10 4 10 20 0 24 v10" />
        </g>
      );
      break;
    case 'dinner':
      icon = (
        <g fill="none" stroke={PALETTE.ink} strokeWidth="4">
          <circle cx="60" cy="54" r="24" />
          <circle cx="60" cy="54" r="10" />
        </g>
      );
      break;
    case 'snack':
    default:
      icon = (
        <path
          d="M46 32 Q30 46 40 62 Q50 78 68 68 Q86 58 78 40 Q70 24 54 30 Q48 32 46 32 Z"
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 120 100"
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', borderRadius: 'var(--radius-sm)' }}
    >
      <rect width="120" height="100" rx="16" fill="var(--surface-2)" />
      {blobBg}
      {icon}
    </svg>
  );
}
