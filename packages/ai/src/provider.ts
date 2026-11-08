import type { AiGeneratedJudgement, JudgementRequest } from '@digimon/domain';

export interface AiProvider {
  readonly id: string;
  readonly available: boolean;
  answer(request: JudgementRequest): Promise<AiGeneratedJudgement>;
}

export class AiUnavailableError extends Error {
  readonly code = 'ai_unavailable';

  constructor(message = 'La capa de IA esta deshabilitada en esta etapa.') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

export class DisabledAiProvider implements AiProvider {
  readonly id = 'disabled';
  readonly available = false;

  async answer(): Promise<AiGeneratedJudgement> {
    throw new AiUnavailableError();
  }
}

export interface AiProviderConfig {
  enabled: boolean;
  apiKey?: string;
  model?: string;
}

export function createAiProvider(config: AiProviderConfig): AiProvider {
  if (!config.enabled) {
    return new DisabledAiProvider();
  }

  return new DisabledAiProvider();
}
