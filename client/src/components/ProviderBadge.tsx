const CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  OPENAI:           { bg: 'rgba(34,217,127,0.1)',  text: '#22d97f', border: 'rgba(34,217,127,0.25)' },
  ANTHROPIC:        { bg: 'rgba(255,140,66,0.1)',  text: '#FF8C42', border: 'rgba(255,140,66,0.25)' },
  GOOGLE:           { bg: 'rgba(74,158,255,0.1)',  text: '#4A9EFF', border: 'rgba(74,158,255,0.25)' },
  OPENAI_COMPATIBLE:{ bg: 'rgba(180,142,254,0.1)', text: '#B48EFE', border: 'rgba(180,142,254,0.25)' },
};

export default function ProviderBadge({ provider, model }: { provider: string; model: string }) {
  const c = CONFIG[provider] || { bg: 'rgba(100,100,100,0.1)', text: '#888', border: 'rgba(100,100,100,0.25)' };
  const shortModel = model
    .replace('claude-', '')
    .replace('gpt-', 'GPT-')
    .replace('gemini-', 'Gemini ')
    .slice(0, 18);
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.04em',
      padding: '2px 8px', borderRadius: '4px',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {shortModel}
    </span>
  );
}
