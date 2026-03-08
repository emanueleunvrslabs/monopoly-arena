interface NegotiationMessage {
  fromName: string;
  toName?: string;
  text: string;
  type: 'proposal' | 'accept' | 'reject' | 'counter' | 'system';
  timestamp: number;
}

const TYPE_STYLES: Record<string, string> = {
  proposal: 'border-blue-700 bg-blue-950/60',
  accept: 'border-green-700 bg-green-950/60',
  reject: 'border-red-700 bg-red-950/60',
  counter: 'border-yellow-700 bg-yellow-950/60',
  system: 'border-gray-700 bg-gray-900/60',
};

const TYPE_LABEL: Record<string, string> = {
  proposal: '📤 Proposta',
  accept: '✅ Accetta',
  reject: '❌ Rifiuta',
  counter: '🔄 Contro-offerta',
  system: '🔔',
};

export default function NegotiationChat({ messages }: { messages: NegotiationMessage[] }) {
  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto p-2 scrollbar-thin">
      {messages.length === 0 ? (
        <p className="text-gray-600 text-xs text-center mt-6 font-mono">Nessuna negoziazione ancora...</p>
      ) : (
        messages.map((m, i) => (
          <div key={i} className={`border rounded-lg p-2 text-xs ${TYPE_STYLES[m.type]}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-300 font-semibold">
                {m.fromName}{m.toName ? ` → ${m.toName}` : ''}
              </span>
              <span className="text-gray-500 text-[10px]">{TYPE_LABEL[m.type]}</span>
            </div>
            <div className="text-white">{m.text}</div>
          </div>
        ))
      )}
    </div>
  );
}
