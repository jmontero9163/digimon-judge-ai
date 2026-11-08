import { describe, expect, it } from 'vitest';
import {
  createInsufficientJudgement,
  createPendingJudgement,
  isAiGenerated,
  isOfficial,
} from '../src/index';

describe('resultados de juicio', () => {
  it('nunca marca una respuesta de IA como oficial', () => {
    const result = {
      kind: 'ai_generated' as const,
      status: 'generated' as const,
      answer: 'Borrador generado.',
      citations: [{ sourceId: 'source-test' }],
      model: 'test-model',
      promptVersion: 'v0',
      disclaimer: 'Requiere revision humana.',
      generatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(isAiGenerated(result)).toBe(true);
    expect(isOfficial(result)).toBe(false);
  });

  it('considera oficial solo un resultado determinista con estado official', () => {
    const official = {
      kind: 'deterministic' as const,
      status: 'official' as const,
      answer: 'Resultado respaldado.',
      citations: [{ sourceId: 'source-test' }],
      ruleIds: ['rule-test'],
    };
    const interpretation = { ...official, status: 'interpretation' as const };

    expect(isOfficial(official)).toBe(true);
    expect(isOfficial(interpretation)).toBe(false);
  });

  it('crea resultados pendientes sin inventar respuestas', () => {
    const result = createPendingJudgement('Falta la fuente oficial.');

    expect(result.kind).toBe('insufficient_information');
    expect(result.status).toBe('pending');
    expect(result.missingInformation).toEqual(['Falta la fuente oficial.']);
  });

  it('exige informacion faltante explicita', () => {
    const result = createInsufficientJudgement(['Source A', 'Source B']);

    expect(result.missingInformation).toHaveLength(2);
  });
});
