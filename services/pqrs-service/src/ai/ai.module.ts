import { Module } from '@nestjs/common';
import { AiTriageService } from './ai-triage.service';
import { GroqProvider } from './providers/groq.provider';
import { LLM_PROVIDER } from './interfaces/llm-provider.interface';

@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      useClass: GroqProvider,
    },
    AiTriageService,
  ],
  exports: [AiTriageService],
})
export class AiModule {}
