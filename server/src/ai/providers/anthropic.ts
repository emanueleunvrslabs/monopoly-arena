import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, extractJson } from './index';

export class AnthropicProvider implements AIProvider {
  async call(system: string, user: string, apiKey: string, model: string): Promise<string> {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model,
      max_tokens: 512,
      system: system + '\n\nRespond ONLY with valid JSON.',
      messages: [{ role: 'user', content: user }],
    });
    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    return extractJson(text);
  }
}
