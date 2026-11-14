import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiErrorResponseSchema, externalCardSearchResponseSchema } from '@digimon/contracts';
import { createApp } from '../src/app';
import type { AppEnv } from '../src/env';
import { resetExternalSearchStateForTests } from '../src/lib/digimoncard';

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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const sampleCard = {
  id: 'BT1-010',
  name: 'Agumon',
  type: 'Digimon',
  color: 'Red',
  color2: '',
  level: 3,
  dp: 2000,
  play_cost: 3,
  evolution_cost: 0,
  form: 'Rookie',
  attribute: 'Vaccine',
  rarity: 'r',
  digi_type: 'Reptile',
  main_effect: '[On Play] Reveal the top 5 cards of your deck.',
  source_effect: null,
  alt_effect: '',
  set_name: ['BT-01'],
  series: 'Digimon Card Game',
  image_url: 'https://images.example.test/BT1-010.png',
};

describe('API de búsqueda externa', () => {
  beforeEach(() => {
    resetExternalSearchStateForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mapea una carta externa sin imágenes al buscar por nombre', async () => {
    const fetchMock = vi.fn<(input: unknown, init?: unknown) => Promise<Response>>(async () =>
      jsonResponse([sampleCard]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await createApp().request(
      '/api/v1/cards/external?query=Agumon',
      {},
      createEnv(),
    );
    const payload = externalCardSearchResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(payload.attribution).toEqual({
      name: 'DigimonCard.io',
      url: 'https://digimoncard.io/api-documentation/',
    });
    expect(payload.cards).toHaveLength(1);
    expect(payload.cards[0]).toMatchObject({
      id: 'BT1-010',
      name: 'Agumon',
      level: 3,
      play_cost: 3,
      evolution_cost: 0,
      set_name: ['BT-01'],
    });
    expect(payload.cards[0]).not.toHaveProperty('image_url');

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get('n')).toBe('Agumon');
    expect(requestUrl.searchParams.get('series')).toBe('Digimon Card Game');
  });

  it('detecta identificadores y consulta por card', async () => {
    const fetchMock = vi.fn<(input: unknown, init?: unknown) => Promise<Response>>(async () =>
      jsonResponse([sampleCard]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await createApp().request(
      '/api/v1/cards/external?query=bt1-010',
      {},
      createEnv(),
    );

    expect(response.status).toBe(200);
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get('card')).toBe('BT1-010');
    expect(requestUrl.searchParams.get('n')).toBeNull();
  });

  it('devuelve una lista vacía cuando la fuente no encuentra cartas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse([])),
    );

    const response = await createApp().request(
      '/api/v1/cards/external?query=NoExiste',
      {},
      createEnv(),
    );
    const payload = externalCardSearchResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(payload.cards).toEqual([]);
  });

  it('trata el 400 de la fuente sin coincidencias como una lista vacía', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'No cards found for this search.' }, 400)),
    );

    const response = await createApp().request(
      '/api/v1/cards/external?query=ZZZZ-999',
      {},
      createEnv(),
    );
    const payload = externalCardSearchResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(payload.cards).toEqual([]);
  });

  it('mantiene el 502 ante un 400 que no sea una búsqueda sin coincidencias', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'Invalid query parameters.' }, 400)),
    );

    const response = await createApp().request(
      '/api/v1/cards/external?query=Agumon',
      {},
      createEnv(),
    );
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe('external_unavailable');
  });

  it('mantiene el 502 cuando la fuente rechaza una petición mal formada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            error: 'Invalid query parameters.',
            errors: { parameters: ['Unsupported query parameter(s): foo.'] },
          },
          422,
        ),
      ),
    );

    const response = await createApp().request(
      '/api/v1/cards/external?query=Agumon',
      {},
      createEnv(),
    );
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe('external_unavailable');
  });

  it('traduce el 429 de la fuente a un error explícito', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'rate limited' }, 429)),
    );

    const response = await createApp().request(
      '/api/v1/cards/external?query=Agumon',
      {},
      createEnv(),
    );
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(429);
    expect(payload.error.code).toBe('external_rate_limited');
  });

  it('traduce el timeout de la fuente a 504', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The operation timed out.', 'TimeoutError');
      }),
    );

    const response = await createApp().request(
      '/api/v1/cards/external?query=Agumon',
      {},
      createEnv(),
    );
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(504);
    expect(payload.error.code).toBe('external_timeout');
  });

  it('traduce un fallo de la fuente a 502', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'boom' }, 500)),
    );

    const response = await createApp().request(
      '/api/v1/cards/external?query=Agumon',
      {},
      createEnv(),
    );
    const payload = apiErrorResponseSchema.parse(await response.json());

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe('external_unavailable');
  });

  it('rechaza consultas externas de menos de dos caracteres', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await createApp().request('/api/v1/cards/external?query=a', {}, createEnv());

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reutiliza la caché y no repite la solicitud externa', async () => {
    const fetchMock = vi.fn<(input: unknown, init?: unknown) => Promise<Response>>(async () =>
      jsonResponse([sampleCard]),
    );
    vi.stubGlobal('fetch', fetchMock);
    const app = createApp();

    const first = await app.request('/api/v1/cards/external?query=Agumon', {}, createEnv());
    const second = await app.request('/api/v1/cards/external?query=Agumon', {}, createEnv());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('mantiene la búsqueda local disponible aunque la fuente externa falle', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'boom' }, 500)),
    );

    const externalResponse = await createApp().request(
      '/api/v1/cards/external?query=Agumon',
      {},
      createEnv(),
    );
    const localResponse = await createApp().request('/api/v1/cards', {}, createEnv());

    expect(externalResponse.status).toBe(502);
    expect(localResponse.status).toBe(501);
  });
});
