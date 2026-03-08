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
  const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#374151" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
      </svg>
      <span className="absolute text-white text-xs font-bold">{remaining}</span>
    </div>
  );
}
