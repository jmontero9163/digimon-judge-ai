import { describe, expect, it } from 'vitest';
import { apiErrorResponseSchema, healthResponseSchema } from '../src/index';

describe('contratos de API', () => {
  it('valida la respuesta de health', () => {
    const parsed = healthResponseSchema.safeParse({
      status: 'ok',
      service: 'digimon-judge-ai-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    });

    expect(parsed.success).toBe(true);
  });

  it('valida el sobre de errores', () => {
    const parsed = apiErrorResponseSchema.safeParse({
      error: {
        code: 'not_implemented',
        message: 'Modulo en preparacion.',
      },
      requestId: 'request-test',
    });

    expect(parsed.success).toBe(true);
  });

  it('rechaza codigos de error desconocidos', () => {
    const parsed = apiErrorResponseSchema.safeParse({
      error: {
        code: 'unknown',
        message: 'Error.',
      },
    });

    expect(parsed.success).toBe(false);
  });
});
