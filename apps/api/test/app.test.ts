import { describe, expect, it } from 'vitest';
import { apiErrorResponseSchema, healthResponseSchema } from '@digimon/contracts';
import { createApp } from '../src/app';
import type { AccessVerifier } from '../src/middleware/auth';
import type { AppEnv } from '../src/env';

function createEnv(overrides: Partial<AppEnv> = {}): AppEnv {
  return {
    DB: {} as D1Database,
    ASSETS: {} as Fetcher,
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    AI_ENABLED: 'false',
    ...overrides,
  } as AppEnv;
}

describe('API Etapa 1', () => {
  it('responde health con el contrato compartido', async () => {
    const app = createApp();
    const response = await app.request('/api/v1/health', {}, createEnv());
    const payload = healthResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(payload.status).toBe('ok');
  });

  it('devuelve 501 en modulos pendientes sin inventar datos', async () => {
    const app = createApp();
    const response = await app.request('/api/v1/cards', {}, createEnv());
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(501);
    expect(payload.error.code).toBe('not_implemented');
  });

  it('deniega admin si Cloudflare Access no esta configurado', async () => {
    const app = createApp();
    const response = await app.request('/api/v1/admin', {}, createEnv());
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe('admin_auth_not_configured');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('deniega admin sin token aunque Access este configurado', async () => {
    const app = createApp();
    const response = await app.request(
      '/api/v1/admin',
      {},
      createEnv({
        ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com',
        ACCESS_AUD: 'test-audience',
      }),
    );

    expect(response.status).toBe(401);
  });

  it('permite continuar solo con un verificador valido inyectado en pruebas', async () => {
    const verifier: AccessVerifier = {
      async verify() {
        return { email: 'admin@example.com' };
      },
    };
    const app = createApp({ adminVerifier: verifier });
    const response = await app.request(
      '/api/v1/admin',
      {
        headers: {
          'Cf-Access-Jwt-Assertion': 'test-token',
        },
      },
      createEnv({
        ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com',
        ACCESS_AUD: 'test-audience',
      }),
    );

    expect(response.status).toBe(501);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('devuelve 404 con sobre de error para rutas desconocidas', async () => {
    const app = createApp();
    const response = await app.request('/api/v1/unknown', {}, createEnv());
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe('not_found');
  });
});
