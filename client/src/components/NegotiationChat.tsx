import { useEffect, useRef } from 'react';

interface NegotiationMessage {
  fromName: string;
  toName?: string;
  text: string;
  type: 'proposal' | 'accept' | 'reject' | 'counter' | 'system';
  timestamp: number;
}

const TYPE_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  proposal: { color: '#4A9EFF', label: 'PROPOSTA',     bg: 'rgba(74,158,255,0.06)' },
  accept:   { color: '#22d97f', label: 'ACCETTA',      bg: 'rgba(34,217,127,0.06)' },
  reject:   { color: '#FF3B3B', label: 'RIFIUTA',      bg: 'rgba(255,59,59,0.06)' },
  counter:  { color: '#F5C518', label: 'CONTRO',       bg: 'rgba(245,197,24,0.06)' },
  system:   { color: '#4A4A6A', label: 'SISTEMA',      bg: 'transparent' },
};

export default function NegotiationChat({ messages }: { messages: NegotiationMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {messages.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 16px',
          fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
          color: 'var(--muted)', letterSpacing: '0.08em',
          lineHeight: 1.8,
        }}>
          IN ATTESA DI<br />NEGOZIAZIONI...
        </div>
      ) : (
        messages.map((m, i) => {
          const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.system;
          return (
            <div key={i} style={{
              background: cfg.bg,
              border: `1px solid ${cfg.color}25`,
              borderLeft: `2px solid ${cfg.color}`,
              borderRadius: '6px', padding: '8px 10px',
              animation: 'pop-in 0.2s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text)', fontWeight: 600 }}>
                  {m.fromName}{m.toName ? ` → ${m.toName}` : ''}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                  color: cfg.color, letterSpacing: '0.1em',
                  background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                  borderRadius: '3px', padding: '1px 5px',
                }}>
                  {cfg.label}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>{m.text}</div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
