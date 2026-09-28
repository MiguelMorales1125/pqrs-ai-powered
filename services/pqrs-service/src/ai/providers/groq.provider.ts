import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ILlmProvider, LlmCompletionRequest } from '../interfaces/llm-provider.interface';

@Injectable()
export class GroqProvider implements ILlmProvider {
  private groq: Groq | null = null;
  private readonly logger = new Logger(GroqProvider.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    } else {
      this.logger.warn('Groq API Key not found or using placeholder. Provider will fail on execution.');
    }
  }

  async generateStructuredResponse<T>(request: LlmCompletionRequest): Promise<T> {
    if (!this.groq) {
      throw new Error('Groq provider is not properly initialized due to missing API Key.');
    }

    const chatCompletion = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      model: 'openai/gpt-oss-20b',
      temperature: request.temperature || 0.1,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    return JSON.parse(content) as T;
  }
}
