import { useEffect, useState } from 'react';

const GLOW: Record<string, string> = {
  OPENAI: 'border-green-400 shadow-[0_0_12px_rgba(74,222,128,0.4)]',
  ANTHROPIC: 'border-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.4)]',
  GOOGLE: 'border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]',
  OPENAI_COMPATIBLE: 'border-purple-400 shadow-[0_0_12px_rgba(167,139,250,0.4)]',
};

interface Props {
  text: string;
  provider: string;
  visible: boolean;
}

export default function ThoughtBubble({ text, provider, visible }: Props) {
  const glow = GLOW[provider] || 'border-gray-400';
  return (
    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 transition-all duration-300 pointer-events-none
      ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-1'}`}>
      <div className={`backdrop-blur-md bg-gray-900/85 border rounded-xl px-3 py-2 text-xs text-white max-w-[200px] text-center ${glow}`}>
        <span className="mr-1">💭</span>
        <span className="line-clamp-3">{text}</span>
      </div>
      {/* Triangolino */}
      <div className="w-2 h-2 bg-gray-900/85 border-r border-b border-gray-400 rotate-45 mx-auto -mt-1" />
    </div>
  );
}
