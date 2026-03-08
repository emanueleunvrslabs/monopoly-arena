// React import not needed — JSX transform handles it

const GLOW: Record<string, { border: string; glow: string }> = {
  OPENAI:           { border: '#22d97f', glow: 'rgba(34,217,127,0.3)' },
  ANTHROPIC:        { border: '#FF8C42', glow: 'rgba(255,140,66,0.3)' },
  GOOGLE:           { border: '#4A9EFF', glow: 'rgba(74,158,255,0.3)' },
  OPENAI_COMPATIBLE:{ border: '#B48EFE', glow: 'rgba(180,142,254,0.3)' },
};

interface Props { text: string; provider: string; visible: boolean; }

export default function ThoughtBubble({ text, provider, visible }: Props) {
  const cfg = GLOW[provider] || { border: '#888', glow: 'rgba(136,136,136,0.2)' };
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '8px', zIndex: 30,
      pointerEvents: 'none',
      transition: 'opacity 0.3s, transform 0.3s',
      opacity: visible ? 1 : 0,
      animation: visible ? 'pop-in 0.25s ease' : 'none',
    }}>
      <div style={{
        background: 'rgba(10,10,22,0.95)',
        border: `1px solid ${cfg.border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        maxWidth: '200px', minWidth: '120px',
        fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text)',
        lineHeight: 1.4, textAlign: 'center',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 20px ${cfg.glow}`,
      }}>
        <span style={{ color: cfg.border, marginRight: '4px', fontSize: '0.7rem' }}>💭</span>
        <span style={{
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{text}</span>
      </div>
      {/* Triangle */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `6px solid ${cfg.border}`,
        margin: '0 auto',
      }} />
    </div>
  );
}
