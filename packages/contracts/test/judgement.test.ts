import { describe, expect, it } from 'vitest';
import { aiGeneratedJudgementSchema, judgementResultSchema } from '../src/index';

const citation = {
  sourceId: 'source-test',
  sourceKind: 'official_rules',
  url: 'https://example.com/rules',
};

describe('contratos de juicio', () => {
  it('acepta un resultado determinista con fuente', () => {
    const parsed = judgementResultSchema.safeParse({
      kind: 'deterministic',
      status: 'official',
      answer: 'Respuesta respaldada.',
      citations: [citation],
      ruleIds: ['rule-test'],
    });

    expect(parsed.success).toBe(true);
  });

  it('rechaza un resultado determinista oficial sin citas', () => {
    const parsed = judgementResultSchema.safeParse({
      kind: 'deterministic',
      status: 'official',
      answer: 'Respuesta sin fuente.',
      citations: [],
      ruleIds: ['rule-test'],
    });

    expect(parsed.success).toBe(false);
  });

  it('impide que una respuesta de IA se marque como oficial', () => {
    const parsed = aiGeneratedJudgementSchema.safeParse({
      kind: 'ai_generated',
      status: 'official',
      answer: 'Borrador.',
      citations: [citation],
      model: 'test-model',
      promptVersion: 'v0',
      disclaimer: 'Requiere revision humana.',
      generatedAt: new Date().toISOString(),
    });

    expect(parsed.success).toBe(false);
  });

  it('acepta una respuesta de IA como borrador generado con citas', () => {
    const parsed = aiGeneratedJudgementSchema.safeParse({
      kind: 'ai_generated',
      status: 'generated',
      answer: 'Borrador.',
      citations: [citation],
      model: 'test-model',
      promptVersion: 'v0',
      disclaimer: 'Requiere revision humana.',
      generatedAt: new Date().toISOString(),
    });

    expect(parsed.success).toBe(true);
  });

  it('rechaza URLs de fuente invalidas', () => {
    const parsed = judgementResultSchema.safeParse({
      kind: 'deterministic',
      status: 'official',
      answer: 'Respuesta.',
      citations: [{ sourceId: 'source-test', url: 'not-a-url' }],
      ruleIds: ['rule-test'],
    });

    expect(parsed.success).toBe(false);
  });
});
