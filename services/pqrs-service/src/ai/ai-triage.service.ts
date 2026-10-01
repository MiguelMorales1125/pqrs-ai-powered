import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { defer, lastValueFrom, timer, throwError, retry, catchError } from 'rxjs';
import { ILlmProvider, LLM_PROVIDER } from './interfaces/llm-provider.interface';
import { AI_SYSTEM_PROMPT, buildTriageUserPrompt } from './prompts/triage.prompt';

export interface PqrsAiAnalysisResult {
  category: string;
  department: string;
  priority: string;
  isUrgent: boolean;
  summary: string;
  priorityJustification: string;
}

@Injectable()
export class AiTriageService {
  private readonly logger = new Logger(AiTriageService.name);
  private readonly availableCategories: string[];
  private readonly availablePriorities: string[];
  private readonly availableDepartments: string[];
  private readonly MAX_RETRIES = 3;

  constructor(
    @Inject(LLM_PROVIDER) private readonly llmProvider: ILlmProvider,
    private readonly configService: ConfigService,
  ) {
    this.availableCategories = this.parseConfigList('COMPANY_CATEGORIES', 'PETITION,COMPLAINT,CLAIM,SUGGESTION');
    this.availablePriorities = this.parseConfigList('COMPANY_PRIORITIES', 'LOW,MEDIUM,HIGH,CRITICAL');
    this.availableDepartments = this.parseConfigList(
      'COMPANY_DEPARTMENTS',
      'Technical Support,Billing,Customer Care,Legal,Logistics',
    );
  }

  private parseConfigList(key: string, defaultValue: string): string[] {
    const envValue = this.configService.get<string>(key, defaultValue);
    return envValue.split(',').map((item) => item.trim());
  }

  async analyzeTicket(subject: string, description: string): Promise<PqrsAiAnalysisResult> {
    const userPrompt = buildTriageUserPrompt(
      subject,
      description,
      this.availableCategories,
      this.availablePriorities,
      this.availableDepartments,
    );

    const request$ = defer(() =>
      this.llmProvider.generateStructuredResponse<PqrsAiAnalysisResult>({
        systemPrompt: AI_SYSTEM_PROMPT,
        userPrompt: userPrompt,
      }),
    ).pipe(
      retry({
        count: this.MAX_RETRIES,
        delay: (error: any, retryCount: number) => {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.warn(`AI triage attempt ${retryCount} failed: ${errMsg}`);
          return timer(1000 * retryCount);
        },
      }),
      catchError((error: any) => {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`AI triage failed completely after ${this.MAX_RETRIES} attempts: ${errMsg}`);
        return throwError(() => new Error(`Failed to process AI triage: ${errMsg}`));
      }),
    );

    return lastValueFrom(request$);
  }
}
