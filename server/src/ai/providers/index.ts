export interface AIProvider {
  call(
    systemPrompt: string,
    userMessage: string,
    apiKey: string,
    model: string,
    endpointUrl?: string
  ): Promise<string>;
}

import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { OpenAICompatibleProvider } from './openai-compatible';

const providers: Record<string, AIProvider> = {
  OPENAI: new OpenAIProvider(),
  ANTHROPIC: new AnthropicProvider(),
  GOOGLE: new GoogleProvider(),
  OPENAI_COMPATIBLE: new OpenAICompatibleProvider(),
};

export function getProvider(providerName: string): AIProvider {
  const p = providers[providerName];
  if (!p) throw new Error(`Unknown provider: ${providerName}`);
  return p;
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : '{}';
}
export { extractJson };
