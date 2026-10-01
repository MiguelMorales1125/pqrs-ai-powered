export interface LlmCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface ILlmProvider {
  generateStructuredResponse<T>(request: LlmCompletionRequest): Promise<T>;
}
