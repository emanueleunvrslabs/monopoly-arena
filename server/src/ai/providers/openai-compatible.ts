import OpenAI from 'openai';
import { AIProvider, extractJson } from './index';

export class OpenAICompatibleProvider implements AIProvider {
  async call(system: string, user: string, apiKey: string, model: string, endpointUrl?: string): Promise<string> {
    const client = new OpenAI({ apiKey, baseURL: endpointUrl });
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      max_tokens: 512,
    });
    const text = res.choices[0].message.content || '{}';
    return extractJson(text);
  }
}
