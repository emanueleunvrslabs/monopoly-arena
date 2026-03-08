const COLORS: Record<string, string> = {
  OPENAI: 'bg-green-900/50 text-green-300 border-green-600',
  ANTHROPIC: 'bg-orange-900/50 text-orange-300 border-orange-600',
  GOOGLE: 'bg-blue-900/50 text-blue-300 border-blue-600',
  OPENAI_COMPATIBLE: 'bg-purple-900/50 text-purple-300 border-purple-600',
};

export default function ProviderBadge({ provider, model }: { provider: string; model: string }) {
  const color = COLORS[provider] || 'bg-gray-800 text-gray-300 border-gray-600';
  const shortModel = model.replace('claude-', '').replace('gpt-', 'GPT-').replace('gemini-', 'Gemini ');
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-mono ${color}`}>
      {shortModel}
    </span>
  );
}
