import { describe, expect, it } from 'vitest';
import { AiUnavailableError, createAiProvider, DisabledAiProvider } from '../src/index';

describe('proveedor de IA', () => {
  it('permanece deshabilitado por defecto', async () => {
    const provider = createAiProvider({ enabled: false });

    expect(provider).toBeInstanceOf(DisabledAiProvider);
    expect(provider.available).toBe(false);
    await expect(provider.answer({ question: 'Consulta de prueba' })).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });

  it('no habilita Gemini en la Etapa 1 aunque se reciba configuracion', async () => {
    const provider = createAiProvider({ enabled: true, apiKey: 'test-placeholder' });

    expect(provider.available).toBe(false);
    await expect(provider.answer({ question: 'Consulta de prueba' })).rejects.toMatchObject({
      code: 'ai_unavailable',
    });
  });
});
