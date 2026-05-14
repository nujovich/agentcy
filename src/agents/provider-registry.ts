import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
  type LanguageModel,
} from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import type { ProviderName } from '@/types/brand-profile';

export interface GenerateParams {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export type StreamTextResult = ReturnType<typeof aiStreamText>;

export interface GenerateTextResult {
  text: string;
}

export interface AgentProvider {
  name: ProviderName;
  model: string;
  generateText(params: GenerateParams): Promise<GenerateTextResult>;
  streamText(params: GenerateParams): StreamTextResult;
}

abstract class BaseProvider implements AgentProvider {
  abstract name: ProviderName;
  readonly model: string;

  protected constructor(model: string) {
    this.model = model;
  }

  protected abstract languageModel(): LanguageModel;

  async generateText(params: GenerateParams): Promise<GenerateTextResult> {
    const result = await aiGenerateText({
      model: this.languageModel(),
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens: params.maxTokens,
      temperature: params.temperature,
    });
    return { text: result.text };
  }

  streamText(params: GenerateParams): StreamTextResult {
    return aiStreamText({
      model: this.languageModel(),
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens: params.maxTokens,
      temperature: params.temperature,
    });
  }
}

export class AnthropicProvider extends BaseProvider {
  readonly name: ProviderName = 'anthropic';

  constructor(model: string) {
    super(model);
  }

  protected languageModel(): LanguageModel {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(this.model);
  }
}

export class OpenAIProvider extends BaseProvider {
  readonly name: ProviderName = 'openai';

  constructor(model: string) {
    super(model);
  }

  protected languageModel(): LanguageModel {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(this.model);
  }
}

export class GoogleProvider extends BaseProvider {
  readonly name: ProviderName = 'google';

  constructor(model: string) {
    super(model);
  }

  protected languageModel(): LanguageModel {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return google(this.model);
  }
}

export function createProvider(name: ProviderName, model: string): AgentProvider {
  switch (name) {
    case 'anthropic':
      return new AnthropicProvider(model);
    case 'openai':
      return new OpenAIProvider(model);
    case 'google':
      return new GoogleProvider(model);
  }
}
