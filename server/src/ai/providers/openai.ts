import OpenAI from 'openai';
import { AIProvider, extractJson } from './index';

export class OpenAIProvider implements AIProvider {
  async call(system: string, user: string, apiKey: string, model: string): Promise<string> {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 512,
    });
    return res.choices[0].message.content || '{}';
  }
}
