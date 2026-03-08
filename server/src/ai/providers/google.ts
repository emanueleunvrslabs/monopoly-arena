import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, extractJson } from './index';

export class GoogleProvider implements AIProvider {
  async call(system: string, user: string, apiKey: string, model: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const gModel = genAI.getGenerativeModel({
      model,
      systemInstruction: system + '\n\nRespond ONLY with valid JSON.'
    });
    const res = await gModel.generateContent(user);
    return extractJson(res.response.text());
  }
}
