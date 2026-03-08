import { useEffect, useState } from 'react';

export default function TurnTimer({ duration = 30, active }: { duration?: number; active: boolean }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    setRemaining(duration);
    if (!active) return;
    const interval = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(interval);
  }, [active, duration]);

  const pct = remaining / duration;
  const color = pct > 0.5 ? '#22d97f' : pct > 0.25 ? '#F5C518' : '#FF3B3B';
  const r = 17;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="42" height="42" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
        <circle
          cx="21" cy="21" r={r} fill="none"
          stroke={color} strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span style={{
        position: 'absolute',
        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700,
        color: active ? color : 'var(--muted)',
      }}>
        {remaining}
      </span>
    </div>
  );
}
