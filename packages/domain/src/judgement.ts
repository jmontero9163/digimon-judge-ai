import type { CitedSource } from './provenance';
import type { RuleStatus } from './status';

export interface DeterministicJudgement {
  kind: 'deterministic';
  status: RuleStatus;
  answer: string;
  citations: CitedSource[];
  ruleIds: string[];
}

export interface AiGeneratedJudgement {
  kind: 'ai_generated';
  status: 'generated';
  answer: string;
  citations: CitedSource[];
  model: string;
  promptVersion: string;
  disclaimer: string;
  generatedAt: string;
}

export interface InsufficientInformationJudgement {
  kind: 'insufficient_information';
  status: 'pending';
  answer: string;
  missingInformation: string[];
  citations: CitedSource[];
}

export type JudgementResult =
  DeterministicJudgement | AiGeneratedJudgement | InsufficientInformationJudgement;

export interface JudgementRequest {
  question: string;
  cardIds?: string[];
  ruleIds?: string[];
}

export function isAiGenerated(result: JudgementResult): result is AiGeneratedJudgement {
  return result.kind === 'ai_generated';
}

export function isOfficial(result: JudgementResult): boolean {
  return result.kind === 'deterministic' && result.status === 'official';
}

export function createInsufficientJudgement(
  missingInformation: string[],
): InsufficientInformationJudgement {
  return {
    kind: 'insufficient_information',
    status: 'pending',
    answer: 'No hay informacion suficiente y verificada para responder esta consulta.',
    missingInformation,
    citations: [],
  };
}

export function createPendingJudgement(reason: string): InsufficientInformationJudgement {
  return createInsufficientJudgement([reason]);
}
